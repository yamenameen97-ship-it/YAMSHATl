from datetime import datetime

import bleach
import httpx
from fastapi import APIRouter, Body, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.core.rate_limit import allow_socket_message
from app.core.security import ACCESS_TOKEN_TYPE, TokenError, decode_token
from app.core.socket_server import is_user_online, sio
from app.db.session import SessionLocal
from app.models.message import Message
from app.models.user import User
from app.models.user_block import UserBlock
from app.services.chat_realtime import mark_messages_delivered, mark_messages_seen_for_sender, serialize_message
from app.services.connection_manager import manager

router = APIRouter()

TRANSLATE_TIMEOUT_SECONDS = 12


def _authenticate_websocket_user(websocket: WebSocket, user_id: int, db: Session) -> User:
    token = websocket.query_params.get('token')
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token is required')

    try:
        payload = decode_token(token, expected_type=ACCESS_TOKEN_TYPE)
    except TokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    token_user_id = payload.get('user_id')
    if token_user_id is None or int(token_user_id) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Token does not match websocket user')

    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    return user


def _block_status(db: Session, current_user_id: int, other_user_id: int) -> dict:
    blocked_by_me = db.query(UserBlock).filter(
        UserBlock.blocker_id == current_user_id,
        UserBlock.blocked_id == other_user_id,
    ).first() is not None
    blocked_me = db.query(UserBlock).filter(
        UserBlock.blocker_id == other_user_id,
        UserBlock.blocked_id == current_user_id,
    ).first() is not None
    return {
        'blocked_by_me': blocked_by_me,
        'blocked_me': blocked_me,
        'can_chat': not blocked_by_me and not blocked_me,
    }


def _assert_can_chat(db: Session, current_user_id: int, other_user_id: int) -> dict:
    status_payload = _block_status(db, current_user_id, other_user_id)
    if not status_payload['can_chat']:
        detail = 'You blocked this user' if status_payload['blocked_by_me'] else 'This user blocked you'
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
    return status_payload


async def _emit_delivered_receipts(db: Session, current_user: User, peer_user_id: int | None = None) -> None:
    for receipt in mark_messages_delivered(db, current_user, peer_user_id=peer_user_id):
        await sio.emit('messages_delivered', receipt, room=f'username:{receipt["sender"]}')


async def _translate_with_mymemory(text: str, source_lang: str, target_lang: str) -> dict:
    async with httpx.AsyncClient(timeout=TRANSLATE_TIMEOUT_SECONDS, follow_redirects=True) as client:
        response = await client.get(
            'https://api.mymemory.translated.net/get',
            params={
                'q': text,
                'langpair': f'{source_lang}|{target_lang}',
            },
            headers={'Accept': 'application/json'},
        )
        response.raise_for_status()
        payload = response.json()

    translated = str((payload.get('responseData') or {}).get('translatedText') or '').strip()
    if not translated:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail='Translation service unavailable')
    return {
        'translated_text': translated,
        'provider': 'MyMemory',
        'match': payload.get('responseData', {}).get('match'),
    }


@router.get('/messages')
def get_messages(
    receiver: str,
    limit: int = Query(default=40, ge=1, le=200),
    before_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    other_user = db.query(User).filter(User.username == receiver, User.is_active.is_(True)).first()
    if other_user is None:
        return {'items': [], 'paging': {'limit': limit, 'has_more': False, 'next_before_id': None}}

    _assert_can_chat(db, current_user.id, other_user.id)

    query = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == other_user.id),
            and_(Message.sender_id == other_user.id, Message.receiver_id == current_user.id),
        )
    )
    if before_id is not None:
        query = query.filter(Message.id < before_id)

    messages = list(reversed(query.order_by(Message.id.desc()).limit(limit).all()))
    items = [serialize_message(message, db) for message in messages]
    return {
        'items': items,
        'paging': {
            'limit': limit,
            'has_more': len(messages) >= limit,
            'next_before_id': messages[0].id if messages else None,
        },
    }


@router.post('/send_message')
async def send_message(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    receiver_username = str(payload.get('receiver') or '').strip()
    raw_message = str(payload.get('message') or '').strip()
    media_url = str(payload.get('media_url') or '').strip()
    message_type = str(payload.get('type') or ('image' if media_url else 'text')).strip() or 'text'
    client_id = str(payload.get('client_id') or '').strip() or None
    if not receiver_username or (not raw_message and not media_url):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='receiver and message or media_url are required')
    if not allow_socket_message(f'chat:{current_user.id}'):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='You are sending messages too quickly')

    receiver = db.query(User).filter(User.username == receiver_username, User.is_active.is_(True)).first()
    if receiver is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Receiver not found')

    _assert_can_chat(db, current_user.id, receiver.id)

    if client_id:
        existing = db.query(Message).filter(Message.sender_id == current_user.id, Message.client_id == client_id).first()
        if existing is not None:
            return serialize_message(existing, db)

    delivered_now = is_user_online(username=receiver.username, user_id=receiver.id)
    delivered_at = datetime.utcnow() if delivered_now else None
    message = Message(
        sender_id=current_user.id,
        receiver_id=receiver.id,
        client_id=client_id,
        content=bleach.clean(raw_message),
        media_url=media_url or None,
        message_type=message_type,
        is_delivered=delivered_now,
        delivered_at=delivered_at,
        is_seen=False,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    serialized = serialize_message(message, db)

    await sio.emit('new_private_message', serialized, room=f'username:{receiver.username}')
    await sio.emit('new_private_message', serialized, room=f'username:{current_user.username}')
    if message.is_delivered:
        await sio.emit(
            'messages_delivered',
            {'sender': current_user.username, 'viewer': receiver.username, 'message_ids': [message.id]},
            room=f'username:{current_user.username}',
        )
    return serialized


@router.post('/message_seen')
async def mark_messages_seen(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sender_username = str(payload.get('sender') or '').strip()
    sender = db.query(User).filter(User.username == sender_username, User.is_active.is_(True)).first()
    if sender is None:
        return {'message_ids': []}

    if not _block_status(db, current_user.id, sender.id)['can_chat']:
        return {'message_ids': []}

    await _emit_delivered_receipts(db, current_user, peer_user_id=sender.id)
    message_ids = mark_messages_seen_for_sender(db, current_user, sender)
    if message_ids:
        await sio.emit(
            'messages_seen',
            {'sender': sender.username, 'viewer': current_user.username, 'message_ids': message_ids},
            room=f'username:{sender.username}',
        )
    return {'message_ids': message_ids}


@router.get('/chat_threads')
def get_chat_threads(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conversations = db.query(Message).filter(
        or_(Message.sender_id == current_user.id, Message.receiver_id == current_user.id)
    ).order_by(Message.created_at.desc()).all()
    seen: set[str] = set()
    result: list[dict] = []
    for message in conversations:
        peer_id = message.receiver_id if message.sender_id == current_user.id else message.sender_id
        peer = db.query(User).filter(User.id == peer_id, User.is_active.is_(True)).first()
        if peer is None or peer.username in seen:
            continue
        if not _block_status(db, current_user.id, peer.id)['can_chat']:
            continue
        seen.add(peer.username)
        unread_count = db.query(Message).filter(
            Message.sender_id == peer.id,
            Message.receiver_id == current_user.id,
            Message.is_seen.is_(False),
        ).count()
        result.append({
            'name': peer.username,
            'username': peer.username,
            'avatar': peer.avatar,
            'last_message': 'تم حذف الرسالة' if message.deleted_at else (message.content or ''),
            'created_at': message.created_at.isoformat() if message.created_at else None,
            'unread_count': int(unread_count),
            'status': 'seen' if message.is_seen else 'delivered' if message.is_delivered else 'sent',
            'last_message_status': 'seen' if message.is_seen else 'delivered' if message.is_delivered else 'sent',
            'last_message_sender': current_user.username if message.sender_id == current_user.id else peer.username,
            'last_message_type': message.message_type or ('image' if message.media_url else 'text'),
            'last_message_deleted': bool(message.deleted_at),
            'last_message_id': message.id,
        })
    return result


@router.get('/presence/{username}')
def get_presence(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.username == username, User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    _assert_can_chat(db, current_user.id, user.id)
    online = is_user_online(username=username, user_id=user.id)
    return {
        'user': username,
        'is_online': online,
        'last_seen': None if online else (user.last_login_at.isoformat() if user.last_login_at else None),
    }


@router.get('/chat_block_status/{username}')
def get_chat_block_status(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    other_user = db.query(User).filter(User.username == username, User.is_active.is_(True)).first()
    if other_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    status_payload = _block_status(db, current_user.id, other_user.id)
    return {
        'username': other_user.username,
        **status_payload,
    }


@router.post('/block_user')
def block_user(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target_username = str(payload.get('username') or payload.get('receiver') or '').strip()
    if not target_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='username is required')

    other_user = db.query(User).filter(User.username == target_username, User.is_active.is_(True)).first()
    if other_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    if other_user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Cannot block yourself')

    existing = db.query(UserBlock).filter(
        UserBlock.blocker_id == current_user.id,
        UserBlock.blocked_id == other_user.id,
    ).first()
    if existing is None:
        db.add(UserBlock(blocker_id=current_user.id, blocked_id=other_user.id))
        db.commit()

    return {
        'username': other_user.username,
        **_block_status(db, current_user.id, other_user.id),
    }


@router.post('/unblock_user')
def unblock_user(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target_username = str(payload.get('username') or payload.get('receiver') or '').strip()
    if not target_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='username is required')

    other_user = db.query(User).filter(User.username == target_username, User.is_active.is_(True)).first()
    if other_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    existing = db.query(UserBlock).filter(
        UserBlock.blocker_id == current_user.id,
        UserBlock.blocked_id == other_user.id,
    ).first()
    if existing is not None:
        db.delete(existing)
        db.commit()

    return {
        'username': other_user.username,
        **_block_status(db, current_user.id, other_user.id),
    }


@router.post('/translate_message')
async def translate_message(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    _ = current_user
    text = str(payload.get('text') or '').strip()
    source_lang = str(payload.get('source_lang') or 'auto').strip().lower() or 'auto'
    target_lang = str(payload.get('target_lang') or 'en').strip().lower() or 'en'
    if not text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='text is required')
    if target_lang not in {'ar', 'en'}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Unsupported target language')

    result = await _translate_with_mymemory(text, source_lang, target_lang)
    return {
        'text': text,
        'source_lang': source_lang,
        'target_lang': target_lang,
        **result,
    }


@router.post('/update_online')
async def update_online(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    online = bool(payload.get('online', True))
    if not online:
        current_user.last_login_at = datetime.utcnow()
        db.commit()
        db.refresh(current_user)
    response = {
        'user': current_user.username,
        'is_online': online,
        'last_seen': None if online else (current_user.last_login_at.isoformat() if current_user.last_login_at else None),
    }
    await sio.emit('presence_update', response)
    return response


@router.post('/delete_message')
async def delete_message(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    message_id = payload.get('message_id')
    if not message_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='message_id is required')
    message = db.query(Message).filter(Message.id == int(message_id), Message.sender_id == current_user.id).first()
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Message not found')
    receiver = db.query(User).filter(User.id == message.receiver_id).first()
    message.deleted_at = datetime.utcnow()
    message.content = 'تم حذف الرسالة'
    message.media_url = None
    db.commit()
    payload_out = {
        'id': message.id,
        'client_id': message.client_id,
        'sender': current_user.username,
        'receiver': receiver.username if receiver else str(message.receiver_id),
        'deleted': True,
        'message': 'تم حذف الرسالة',
        'content': 'تم حذف الرسالة',
        'media_url': None,
        'type': 'text',
    }
    await sio.emit('message_deleted', payload_out, room=f'username:{payload_out["receiver"]}')
    await sio.emit('message_deleted', payload_out, room=f'username:{payload_out["sender"]}')
    return payload_out


@router.get('/api/chat/messages/{other_user_id}')
def get_messages_legacy(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    other_user = db.query(User).filter(User.id == other_user_id, User.is_active.is_(True)).first()
    if other_user is None:
        return []
    _assert_can_chat(db, current_user.id, other_user.id)

    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.receiver_id == current_user.id),
        )
    ).order_by(Message.created_at.asc()).all()
    return [serialize_message(message, db) for message in messages]


@router.websocket('/ws/{user_id}')
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    db = SessionLocal()
    try:
        current_user = _authenticate_websocket_user(websocket, user_id, db)
    except HTTPException:
        await websocket.close(code=1008)
        db.close()
        return

    became_online = await manager.connect(user_id, websocket)
    if became_online:
        await manager.broadcast({'type': 'online', 'user_id': user_id, 'status': True})

    await manager.send_to_user(user_id, {'type': 'online_snapshot', 'data': {'user_ids': manager.online_users()}})

    try:
        while True:
            event = await websocket.receive_json()
            event_type = event.get('type')

            if event_type == 'message':
                data = event.get('data', {})
                receiver_id = data.get('receiver_id')
                content = bleach.clean((data.get('content') or '').strip())
                client_id = str(data.get('client_id') or '').strip() or None

                if not receiver_id or not content:
                    await websocket.send_json({'type': 'error', 'detail': 'receiver_id and content are required'})
                    continue
                if not allow_socket_message(f'ws-chat:{user_id}'):
                    await websocket.send_json({'type': 'error', 'detail': 'You are sending messages too quickly'})
                    continue

                receiver = db.query(User).filter(User.id == int(receiver_id), User.is_active.is_(True)).first()
                if receiver is None:
                    await websocket.send_json({'type': 'error', 'detail': 'Receiver not found'})
                    continue

                if not _block_status(db, user_id, int(receiver_id))['can_chat']:
                    await websocket.send_json({'type': 'error', 'detail': 'Conversation is blocked'})
                    continue

                existing = None
                if client_id:
                    existing = db.query(Message).filter(Message.sender_id == user_id, Message.client_id == client_id).first()

                if existing is None:
                    delivered_now = manager.is_online(int(receiver_id))
                    message = Message(
                        sender_id=user_id,
                        receiver_id=int(receiver_id),
                        client_id=client_id,
                        content=content,
                        is_delivered=delivered_now,
                        delivered_at=datetime.utcnow() if delivered_now else None,
                        is_seen=False,
                    )
                    db.add(message)
                    db.commit()
                    db.refresh(message)
                else:
                    message = existing
                    delivered_now = bool(message.is_delivered)

                payload = {'type': 'message', 'data': serialize_message(message, db)}
                await manager.send_to_user(int(receiver_id), payload)
                await manager.send_to_user(user_id, payload)
                await manager.send_to_user(user_id, {'type': 'delivered', 'data': {'message_id': message.id, 'delivered': delivered_now}})

            elif event_type == 'typing':
                receiver_id = event.get('receiver_id')
                if receiver_id and _block_status(db, user_id, int(receiver_id))['can_chat']:
                    await manager.send_to_user(int(receiver_id), {'type': 'typing', 'data': {'from': user_id}})

            elif event_type == 'seen':
                message_id = event.get('message_id')
                if not message_id:
                    await websocket.send_json({'type': 'error', 'detail': 'message_id is required'})
                    continue
                message = db.query(Message).filter(Message.id == int(message_id)).first()
                if message and message.receiver_id == user_id:
                    message.is_seen = True
                    message.seen_at = datetime.utcnow()
                    message.is_delivered = True
                    if message.delivered_at is None:
                        message.delivered_at = message.seen_at
                    db.commit()
                    await manager.send_to_user(message.sender_id, {'type': 'seen', 'data': {'message_id': message.id, 'seen_by': user_id}})

            elif event_type == 'ping':
                await websocket.send_json({'type': 'pong'})
            elif event_type == 'sync_delivery':
                peer_id = event.get('peer_id')
                await _emit_delivered_receipts(db, current_user, peer_user_id=int(peer_id) if peer_id else None)
            else:
                await websocket.send_json({'type': 'error', 'detail': 'Unsupported event type'})

    except WebSocketDisconnect:
        became_offline = manager.disconnect(user_id, websocket)
        if became_offline:
            await manager.broadcast({'type': 'online', 'user_id': user_id, 'status': False})
    finally:
        db.close()
