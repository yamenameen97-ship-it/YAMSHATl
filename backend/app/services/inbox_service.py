from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.message import Message
from app.models.user import User


def get_conversations(db: Session, user_id: int) -> list[dict]:
    messages = db.query(Message).filter(
        or_(Message.sender_id == user_id, Message.receiver_id == user_id)
    ).order_by(Message.created_at.desc()).all()

    conversations: list[dict] = []
    processed_users: set[int] = set()

    for msg in messages:
        other_user_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
        if other_user_id in processed_users:
            continue
        processed_users.add(other_user_id)

        other_user = db.query(User).filter(User.id == other_user_id).first()
        unread_count = db.query(func.count(Message.id)).filter(
            Message.receiver_id == user_id,
            Message.sender_id == other_user_id,
            Message.is_seen.is_(False),
        ).scalar() or 0

        conversations.append(
            {
                'user_id': other_user_id,
                'username': other_user.username if other_user else 'unknown',
                'avatar': other_user.avatar if other_user else None,
                'last_message': msg.content,
                'timestamp': msg.created_at,
                'is_seen': True if msg.sender_id == user_id else msg.is_seen,
                'unread_count': unread_count,
            }
        )

    return conversations
