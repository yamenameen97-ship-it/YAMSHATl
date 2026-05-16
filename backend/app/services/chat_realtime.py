from __future__ import annotations

from collections import defaultdict
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.message import Message
from app.models.user import User


def serialize_message(message: Message, db: Session) -> dict:
    sender = db.query(User).filter(User.id == message.sender_id).first()
    receiver = db.query(User).filter(User.id == message.receiver_id).first()
    deleted = bool(message.deleted_at)
    return {
        'id': message.id,
        'client_id': message.client_id,
        'sender': sender.username if sender else str(message.sender_id),
        'receiver': receiver.username if receiver else str(message.receiver_id),
        'message': 'تم حذف الرسالة' if deleted else message.content,
        'content': 'تم حذف الرسالة' if deleted else message.content,
        'media_url': None if deleted else message.media_url,
        'type': message.message_type or ('image' if message.media_url else 'text'),
        'created_at': message.created_at.isoformat() if message.created_at else None,
        'delivered_at': message.delivered_at.isoformat() if message.delivered_at else None,
        'seen_at': message.seen_at.isoformat() if message.seen_at else None,
        'status': 'seen' if message.is_seen else 'delivered' if message.is_delivered else 'sent',
        'deleted': deleted,
        'cursor': message.id,
    }


def mark_messages_delivered(db: Session, viewer: User, peer_user_id: int | None = None) -> list[dict]:
    query = db.query(Message).filter(
        Message.receiver_id == viewer.id,
        Message.is_delivered.is_(False),
    )
    if peer_user_id is not None:
        query = query.filter(Message.sender_id == peer_user_id)

    pending_messages = query.order_by(Message.id.asc()).all()
    if not pending_messages:
        return []

    delivered_at = datetime.utcnow()
    grouped_ids: dict[int, list[int]] = defaultdict(list)
    for message in pending_messages:
        message.is_delivered = True
        message.delivered_at = delivered_at
        grouped_ids[message.sender_id].append(message.id)

    db.commit()

    users = db.query(User).filter(User.id.in_(list(grouped_ids.keys()))).all()
    username_by_id = {user.id: user.username for user in users}
    return [
        {
            'sender': username_by_id.get(sender_id, str(sender_id)),
            'viewer': viewer.username,
            'message_ids': message_ids,
        }
        for sender_id, message_ids in grouped_ids.items()
    ]


def mark_messages_seen_for_sender(db: Session, viewer: User, sender: User) -> list[int]:
    messages = db.query(Message).filter(
        Message.sender_id == sender.id,
        Message.receiver_id == viewer.id,
        Message.is_seen.is_(False),
    ).all()
    if not messages:
        return []

    seen_at = datetime.utcnow()
    for message in messages:
        message.is_seen = True
        message.seen_at = seen_at
        message.is_delivered = True
        if message.delivered_at is None:
            message.delivered_at = seen_at
    db.commit()
    return [message.id for message in messages]
