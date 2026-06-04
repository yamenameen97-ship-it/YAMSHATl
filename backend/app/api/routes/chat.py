from datetime import datetime
import inspect

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
from app.models.notification import Notification
from app.models.user import User
from app.models.user_block import UserBlock
from app.services.chat_realtime import mark_messages_delivered, mark_messages_seen_for_sender, serialize_message
from app.services.encryption_service import encrypt_message
from app.services.media_service import scan_media_for_malware
from app.services.chat_features import recall_message, add_reaction, apply_retention_policy
from app.services.connection_manager import manager

router = APIRouter()

TRANSLATE_TIMEOUT_SECONDS = 12


async def _resolve_rate_limit_result(result) -> bool:
    if inspect.isawaitable(result):
        return bool(await result)
    return bool(result)


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


def _find_active_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == str(username or '').strip(), User.is_active.is_(True)).first()


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


def _presence_payload(other_user: User) -> dict:
    return {
        'is_online': is_user_online(username=other_user.username, user_id=other_user.id),
        'last_seen': other_user.last_login_at.isoformat() if other_user.last_login_at else None,
    }


async def _emit_delivered_receipts(db: Session, current_user: User, peer_user_id: int | None = None) -> None:
    for receipt in mark_messages_delivered(db, current_user, peer_user_id=peer_user_id):
        await sio.emit('messages_delivered', receipt, room=f'username:{receipt["sender"]}')


async def _translate_with_mymemory(text: str, source_lang: str, target_lang: str) -> dict:
    async with httpx.AsyncClient(timeout=TRANSLATE_TIMEOUT_SECONDS, follow_redirects=True) as client:
        response = await client.get(
            'https://api.mymemory.translated.net/get',
            params={'q': text, 'langpair': f'{source_lang}|{target_lang}'},
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
    # دعم دردشة المجموعات: إذا بدأ المستلم بـ "group:"
    is_group = str(receiver).startswith('group:')
    
    if is_group:
        # في الوقت الحالي، نستخدم جدول الرسائل نفسه للمجموعات مع وضع معرف المجموعة في حقل receiver
        query = db.query(Message).filter(Message.receiver == receiver)
    else:
        other_user = _find_active_user_by_username(db, receiver)
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
    raw_message = str(payload.get('message') or payload.get('content') or '').strip()
    media_url = str(payload.get('media_url') or '').strip()
    message_type = str(payload.get('type') or ('image' if media_url else 'text')).strip() or 'text'
    client_id = str(payload.get('client_id') or '').strip() or None
    
    if not receiver_username or (not raw_message and not media_url):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='receiver and message or media_url are required')
    
    if not await _resolve_rate_limit_result(allow_socket_message(f'chat:{current_user.id}')):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='You are sending messages too quickly')

    # دعم دردشة المجموعات
    is_group = receiver_username.startswith('group:')
    receiver_id = None
    
    if not is_group:
        receiver = _find_active_user_by_username(db, receiver_username)
        if receiver is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Receiver not found')
        _assert_can_chat(db, current_user.id, receiver.id)
        receiver_id = receiver.id
    else:
        # للمجموعات، لا يوجد receiver_id فردي
        receiver_id = 0 

    if client_id:
        existing = db.query(Message).filter(Message.sender_id == current_user.id, Message.client_id == client_id).first()
        if existing is not None:
            return serialize_message(existing, db)

    if media_url and not scan_media_for_malware(media_url):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Media failed malware scan.')

    delivered_now = is_group or is_user_online(username=receiver_username, user_id=receiver_id)
    delivered_at = datetime.utcnow() if delivered_now else None
    clean_message = bleach.clean(raw_message)
    message = Message(
        sender_id=current_user.id,
        receiver_id=receiver_id,
        sender=current_user.username,
        receiver=receiver_username,
        client_id=client_id,
        message=clean_message,
        content=encrypt_message(clean_message),
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

    if is_group:
        # إرسال إلى غرفة المجموعة في السوكيت
        await sio.emit('new_message', serialized, room=receiver_username)
    else:
        await sio.emit('new_private_message', serialized, room=f'username:{receiver_username}')
        await sio.emit('new_private_message', serialized, room=f'username:{current_user.username}')

    # الإشعارات (للمحادثات الخاصة فقط حالياً لتجنب الإزعاج في المجموعات)
    if not is_group:
        try:
            preview = (clean_message or '').strip()
            if not preview and media_url:
                preview = '📎 وسائط جديدة'
            if len(preview) > 140:
                preview = preview[:137] + '...'
            notification = Notification(
                user_id=receiver_id,
                type='CHAT',
                title=f'رسالة جديدة من {current_user.username}',
                body=preview or 'رسالة جديدة',
                data={
                    'from_user_id': current_user.id,
                    'username': current_user.username,
                    'message_id': message.id,
                    'screen': 'chat',
                    'path': f'/chat/{current_user.username}',
                },
            )
            db.add(notification)
            db.commit()
            db.refresh(notification)
            await sio.emit(
                'new_notification',
                {
                    'id': notification.id,
                    'type': 'CHAT',
                    'title': notification.title,
                    'message': notification.body,
                    'text': notification.body,
                    'body': notification.body,
                    'created_at': notification.created_at.isoformat(),
                    'seen': False,
                    'screen': 'chat',
                    'path': f'/chat/{current_user.username}',
                    'data': {
                        'username': current_user.username,
                        'screen': 'chat',
                        'path': f'/chat/{current_user.username}',
                        'message_id': message.id,
                    },
                },
                room=f'user:{receiver_id}',
            )
        except Exception:
            pass

    if not is_group and message.is_delivered:
        await sio.emit(
            'messages_delivered',
            {'sender': current_user.username, 'viewer': receiver_username, 'message_ids': [message.id]},
            room=f'username:{current_user.username}',
        )
    return serialized

    if client_id:
        existing = db.query(Message).filter(Message.sender_id == current_user.id, Message.client_id == client_id).first()
        if existing is not None:
            return serialize_message(existing, db)

    if media_url and not scan_media_for_malware(media_url):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Media failed malware scan.')

    delivered_now = is_user_online(username=receiver.username, user_id=receiver.id)
    delivered_at = datetime.utcnow() if delivered_now else None
    clean_message = bleach.clean(raw_message)
    message = Message(
        sender_id=current_user.id,
        receiver_id=receiver.id,
        sender=current_user.username,
        receiver=receiver.username,
        client_id=client_id,
        message=clean_message,
        content=encrypt_message(clean_message),
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

    # Create a Notification record + emit `new_notification` for the receiver so the
    # bell icon and browser/push notifications fire end-to-end (fixes: chat
    # messages weren't producing notifications on the other side).
    try:
        preview = (clean_message or '').strip()
        if not preview and media_url:
            preview = '📎 وسائط جديدة'
        if len(preview) > 140:
            preview = preview[:137] + '...'
        notification = Notification(
            user_id=receiver.id,
            type='CHAT',
            title=f'رسالة جديدة من {current_user.username}',
            body=preview or 'رسالة جديدة',
            data={
                'from_user_id': current_user.id,
                'username': current_user.username,
                'message_id': message.id,
                'screen': 'chat',
                'path': f'/chat/{current_user.username}',
            },
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        await sio.emit(
            'new_notification',
            {
                'id': notification.id,
                'type': 'CHAT',
                'title': notification.title,
                'message': notification.body,
                'text': notification.body,
                'body': notification.body,
                'created_at': notification.created_at.isoformat(),
                'seen': False,
                'screen': 'chat',
                'path': f'/chat/{current_user.username}',
                'data': {
                    'username': current_user.username,
                    'screen': 'chat',
                    'path': f'/chat/{current_user.username}',
                    'message_id': message.id,
                },
            },
            room=f'user:{receiver.id}',
        )
        # Also emit to the username room as a safety net (some clients join by username)
        await sio.emit(
            'new_notification',
            {
                'id': notification.id,
                'type': 'CHAT',
                'title': notification.title,
                'message': notification.body,
                'body': notification.body,
                'created_at': notification.created_at.isoformat(),
                'seen': False,
                'screen': 'chat',
                'path': f'/chat/{current_user.username}',
                'data': {'username': current_user.username, 'screen': 'chat'},
            },
            room=f'username:{receiver.username}',
        )
    except Exception:
        # Never let a notification failure block the actual message delivery.
        pass

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
    sender = _find_active_user_by_username(db, sender_username)
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


@router.get('/chat_block_status/{username}')
def get_chat_block_status(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    other_user = _find_active_user_by_username(db, username)
    if other_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    return {
        **_block_status(db, current_user.id, other_user.id),
        **_presence_payload(other_user),
        'username': other_user.username,
    }


@router.post('/block_user')
def block_user(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    username = str(payload.get('username') or '').strip()
    other_user = _find_active_user_by_username(db, username)
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
        'blocked_by_me': True,
        'blocked_me': False,
        'can_chat': False,
    }


@router.post('/unblock_user')
def unblock_user(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    username = str(payload.get('username') or '').strip()
    other_user = _find_active_user_by_username(db, username)
    if other_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    existing = db.query(UserBlock).filter(
        UserBlock.blocker_id == current_user.id,
        UserBlock.blocked_id == other_user.id,
    ).first()
    if existing is not None:
        db.delete(existing)
        db.commit()

    other_status = _block_status(db, current_user.id, other_user.id)
    return {
        'username': other_user.username,
        **other_status,
    }


@router.post('/delete_message')
async def delete_message(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    message_id = int(payload.get('message_id') or 0)
    delete_for_everyone = bool(payload.get('delete_for_everyone'))
    message = db.query(Message).filter(Message.id == message_id, Message.sender_id == current_user.id).first()
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Message not found')
    message.deleted_at = datetime.utcnow()
    message.deleted_for_everyone = bool(delete_for_everyone)
    db.commit()
    db.refresh(message)
    serialized = serialize_message(message, db)
    await sio.emit('message_deleted', serialized, room=f'username:{current_user.username}')
    if delete_for_everyone:
        receiver = db.query(User).filter(User.id == message.receiver_id).first()
        if receiver is not None:
            await sio.emit('message_deleted', serialized, room=f'username:{receiver.username}')
    return serialized


@router.post('/restore_message')
def restore_message(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    message_id = int(payload.get('message_id') or 0)
    message = db.query(Message).filter(Message.id == message_id, Message.sender_id == current_user.id).first()
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Message not found')
    message.deleted_at = None
    db.commit()
    db.refresh(message)
    return serialize_message(message, db)


@router.post('/{message_id}/recall')
def recall(message_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return recall_message(db, message_id, current_user.id)


@router.post('/{message_id}/react')
def react(message_id: int, payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reaction = str(payload.get('reaction') or '').strip()
    if not reaction:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Reaction is required')
    return add_reaction(db, message_id, current_user.id, reaction)


@router.post('/apply_retention')
def apply_retention(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    chat_id = payload.get('chat_id')
    policy = payload.get('policy')
    if not chat_id or not policy:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Chat ID and policy are required')
    return apply_retention_policy(db, chat_id, policy, current_user.id)


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
        relationship = _block_status(db, current_user.id, peer.id)
        if not relationship['can_chat']:
            continue
        seen.add(peer.username)
        unread_count = db.query(Message).filter(
            Message.sender_id == peer.id,
            Message.receiver_id == current_user.id,
            Message.is_seen.is_(False),
        ).count()
        presence = _presence_payload(peer)
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
            'presence': presence,
            'last_seen': presence['last_seen'],
        })
    return result


@router.get('/presence/{username}')
def get_presence(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    other_user = _find_active_user_by_username(db, username)
    if other_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    relationship = _assert_can_chat(db, current_user.id, other_user.id)
    return {
        **_presence_payload(other_user),
        **relationship,
        'username': other_user.username,
    }


@router.websocket('/ws/{user_id}')
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(SessionLocal)):
    user = _authenticate_websocket_user(websocket, user_id, db)
    await manager.connect(websocket, user.username, user.id)
    try:
        while True:
            data = await websocket.receive_text()
            print(f'Received from {user.username}: {data}')
    except WebSocketDisconnect:
        manager.disconnect(websocket, user.username, user.id)
        print(f'Client {user.username} disconnected')


@router.post('/translate')
@router.post('/translate_message')
async def translate(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    text = str(payload.get('text') or '').strip()
    source_lang = str(payload.get('source_lang') or '').strip() or 'auto'
    target_lang = str(payload.get('target_lang') or '').strip() or 'en'
    if not text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Text is required')
    return await _translate_with_mymemory(text, source_lang, target_lang)


@router.post('/update_online')
def update_online_status(payload: dict = Body(default={}), current_user: User = Depends(get_current_user)):
    return {
        'ok': True,
        'username': current_user.username,
        'online': bool(payload.get('online', True)),
    }
