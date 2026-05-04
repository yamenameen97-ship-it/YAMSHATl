from datetime import datetime

import bleach
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.core.rate_limit import allow_socket_message
from app.core.security import TokenError, decode_token
from app.core.socket_server import is_user_online, sio
from app.db.session import SessionLocal
from app.models.message import Message
from app.models.user import User
from app.services.connection_manager import manager

router = APIRouter()


def _serialize_message(message: Message, db: Session) -> dict:
    sender = db.query(User).filter(User.id == message.sender_id).first()
    receiver = db.query(User).filter(User.id == message.receiver_id).first()
    deleted = bool(message.deleted_at)
    return {
        'id': message.id,
        'sender': sender.username if sender else str(message.sender_id),
        'receiver': receiver.username if receiver else str(message.receiver_id),
        'message': 'تم حذف الرسالة' if deleted else message.content,
        'content': 'تم حذف الرسالة' if deleted else message.content,
        'media_url': None if deleted else message.media_url,
        'type': message.message_type or ('image' if message.media_url else 'text'),
        'created_at': message.created_at.isoformat() if message.created_at else None,
        'status': 'seen' if message.is_seen else 'delivered' if message.is_delivered else 'sent',
        'deleted': deleted,
    }


def _authenticate_websocket_user(websocket: WebSocket, user_id: int, db: Session) -> User:
    token = websocket.query_params.get('token')
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token is required')

    try:
        payload = decode_token(token)
    except TokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    token_user_id = payload.get('user_id')
    if token_user_id is None or int(token_user_id) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Token does not match websocket user')

    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    return user


@router.get('/messages')
def get_messages(
    receiver: str,
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    other_user = db.query(User).filter(User.username == receiver, User.is_active.is_(True)).first()
    if other_user is None:
        return []
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == other_user.id),
            and_(Message.sender_id == other_user.id, Message.receiver_id == current_user.id),
        )
    ).order_by(Message.created_at.asc()).limit(limit).all()
    return [_serialize_message(message, db) for message in messages]


@router.post('/send_message')
async def send_message(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    receiver_username = str(payload.get('receiver') or '').strip()
    raw_message = str(payload.get('message') or '').strip()
    media_url = str(payload.get('media_url') or '').strip()
    message_type = str(payload.get('type') or ('image' if media_url else 'text')).strip() or 'text'
    if not receiver_username or (not raw_message and not media_url):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='receiver and message or media_url are required')
    if not allow_socket_message(f'chat:{current_user.id}'):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='You are sending messages too quickly')

    receiver = db.query(User).filter(User.username == receiver_username, User.is_active.is_(True)).first()
    if receiver is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Receiver not found')

    message = Message(
        sender_id=current_user.id,
        receiver_id=receiver.id,
        content=bleach.clean(raw_message),
        media_url=media_url or None,
        message_type=message_type,
        is_delivered=is_user_online(username=receiver.username, user_id=receiver.id),
        is_seen=False,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    serialized = _serialize_message(message, db)

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

    messages = db.query(Message).filter(
        Message.sender_id == sender.id,
        Message.receiver_id == current_user.id,
        Message.is_seen.is_(False),
    ).all()
    message_ids = [message.id for message in messages]
    for message in messages:
        message.is_seen = True
        message.is_delivered = True
    db.commit()

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
        seen.add(peer.username)
        result.append({
            'name': peer.username,
            'username': peer.username,
            'avatar': peer.avatar,
            'last_message': 'تم حذف الرسالة' if message.deleted_at else (message.content or ''),
            'created_at': message.created_at.isoformat() if message.created_at else None,
        })
    return result


@router.get('/presence/{username}')
def get_presence(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ = current_user
    user = db.query(User).filter(User.username == username, User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    online = is_user_online(username=username, user_id=user.id)
    return {
        'user': username,
        'is_online': online,
        'last_seen': None if online else (user.last_login_at.isoformat() if user.last_login_at else None),
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
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.receiver_id == current_user.id),
        )
    ).order_by(Message.created_at.asc()).all()
    return [_serialize_message(message, db) for message in messages]


@router.websocket('/ws/{user_id}')
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    db = SessionLocal()
    try:
        _authenticate_websocket_user(websocket, user_id, db)
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

                is_delivered = manager.is_online(int(receiver_id))
                message = Message(sender_id=user_id, receiver_id=int(receiver_id), content=content, is_delivered=is_delivered, is_seen=False)
                db.add(message)
                db.commit()
                db.refresh(message)
                payload = {'type': 'message', 'data': _serialize_message(message, db)}

                if is_delivered:
                    await manager.send_to_user(int(receiver_id), payload)

                await manager.send_to_user(user_id, {'type': 'delivered', 'data': {'message_id': message.id, 'delivered': is_delivered}})

            elif event_type == 'typing':
                receiver_id = event.get('receiver_id')
                if receiver_id:
                    await manager.send_to_user(int(receiver_id), {'type': 'typing', 'data': {'from': user_id}})

            elif event_type == 'seen':
                message_id = event.get('message_id')
                if not message_id:
                    await websocket.send_json({'type': 'error', 'detail': 'message_id is required'})
                    continue
                message = db.query(Message).filter(Message.id == int(message_id)).first()
                if message and message.receiver_id == user_id:
                    message.is_seen = True
                    message.is_delivered = True
                    db.commit()
                    await manager.send_to_user(message.sender_id, {'type': 'seen', 'data': {'message_id': message.id, 'seen_by': user_id}})

            elif event_type == 'ping':
                await websocket.send_json({'type': 'pong'})
            else:
                await websocket.send_json({'type': 'error', 'detail': 'Unsupported event type'})

    except WebSocketDisconnect:
        became_offline = manager.disconnect(user_id, websocket)
        if became_offline:
            await manager.broadcast({'type': 'online', 'user_id': user_id, 'status': False})
    finally:
        db.close()
