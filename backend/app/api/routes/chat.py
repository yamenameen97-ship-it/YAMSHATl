from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.core.security import TokenError, decode_token
from app.db.session import SessionLocal
from app.models.message import Message
from app.models.user import User
from app.services.connection_manager import manager

router = APIRouter()


@router.get('/api/chat/messages/{other_user_id}')
def get_messages(
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

    return [
        {
            'id': msg.id,
            'sender_id': msg.sender_id,
            'receiver_id': msg.receiver_id,
            'content': msg.content,
            'is_delivered': msg.is_delivered,
            'is_seen': msg.is_seen,
            'created_at': msg.created_at,
        }
        for msg in messages
    ]


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

    await manager.send_to_user(
        user_id,
        {
            'type': 'online_snapshot',
            'data': {'user_ids': manager.online_users()},
        },
    )

    try:
        while True:
            event = await websocket.receive_json()
            event_type = event.get('type')

            if event_type == 'message':
                data = event.get('data', {})
                receiver_id = data.get('receiver_id')
                content = (data.get('content') or '').strip()

                if not receiver_id or not content:
                    await websocket.send_json({'type': 'error', 'detail': 'receiver_id and content are required'})
                    continue

                receiver = db.query(User).filter(User.id == int(receiver_id), User.is_active.is_(True)).first()
                if receiver is None:
                    await websocket.send_json({'type': 'error', 'detail': 'Receiver not found'})
                    continue

                is_delivered = manager.is_online(int(receiver_id))
                message = Message(
                    sender_id=user_id,
                    receiver_id=int(receiver_id),
                    content=content,
                    is_delivered=is_delivered,
                    is_seen=False,
                )
                db.add(message)
                db.commit()
                db.refresh(message)

                sender = db.query(User).filter(User.id == user_id).first()
                payload = {
                    'type': 'message',
                    'data': {
                        'id': message.id,
                        'from': user_id,
                        'receiver_id': int(receiver_id),
                        'content': content,
                        'created_at': message.created_at.isoformat(),
                        'status': 'delivered' if is_delivered else 'sent',
                        'username': sender.username if sender else 'unknown',
                        'avatar': sender.avatar if sender else None,
                    },
                }

                if is_delivered:
                    await manager.send_to_user(int(receiver_id), payload)

                await manager.send_to_user(
                    user_id,
                    {
                        'type': 'delivered',
                        'data': {
                            'message_id': message.id,
                            'delivered': is_delivered,
                        },
                    },
                )

            elif event_type == 'typing':
                receiver_id = event.get('receiver_id')
                if receiver_id:
                    await manager.send_to_user(
                        int(receiver_id),
                        {
                            'type': 'typing',
                            'data': {'from': user_id},
                        },
                    )

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
                    await manager.send_to_user(
                        message.sender_id,
                        {
                            'type': 'seen',
                            'data': {
                                'message_id': message.id,
                                'seen_by': user_id,
                            },
                        },
                    )

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
