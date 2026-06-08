"""خدمات متقدمة للشات: recall / reactions / retention.

تم تحديث هذه الخدمات للعمل فعلياً مع قاعدة البيانات بدلاً من
أي placeholder سابق.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.message import Message
from app.models.message_reaction import MessageReaction


# -----------------------------------------------------------------------------
# Recall
# -----------------------------------------------------------------------------
def recall_message(db: Session, message_id: int, user_id: int) -> dict:
    """استرجاع/إلغاء رسالة (Recall) خلال نافذة زمنية معقولة."""
    message = db.query(Message).filter(
        Message.id == message_id,
        Message.sender_id == user_id,
    ).first()
    if message is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Message not found',
        )

    # نافذة الـ recall: ساعة من وقت الإرسال
    if message.created_at and (datetime.utcnow() - message.created_at) > timedelta(hours=1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Recall window expired',
        )

    message.is_recalled = True
    message.deleted_for_everyone = True
    message.deleted_at = datetime.utcnow()
    message.content = ''
    message.message = ''
    message.media_url = None
    db.commit()
    db.refresh(message)
    return {
        'message_id': message.id,
        'status': 'recalled',
        'is_recalled': True,
        'deleted_for_everyone': True,
    }


# -----------------------------------------------------------------------------
# Reactions
# -----------------------------------------------------------------------------
def _refresh_reactions_count(db: Session, message_id: int) -> int:
    count = db.query(func.count(MessageReaction.id)).filter(
        MessageReaction.message_id == message_id,
    ).scalar() or 0
    msg = db.query(Message).filter(Message.id == message_id).first()
    if msg is not None:
        msg.reactions_count = int(count)
        db.commit()
    return int(count)


def _serialize_reactions_summary(db: Session, message_id: int) -> dict:
    rows = db.query(
        MessageReaction.reaction,
        func.count(MessageReaction.id),
    ).filter(
        MessageReaction.message_id == message_id,
    ).group_by(MessageReaction.reaction).all()
    summary = [
        {'reaction': r, 'count': int(c)}
        for r, c in rows
    ]
    total = sum(item['count'] for item in summary)
    return {
        'summary': summary,
        'total': total,
    }


def add_reaction(db: Session, message_id: int, user_id: int, reaction: str) -> dict:
    """إضافة/تبديل تفاعل على رسالة. لو موجود نفس التفاعل من نفس المستخدم نحذفه (toggle)."""
    reaction = (reaction or '').strip()
    if not reaction:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Reaction is required',
        )
    if len(reaction) > 32:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Reaction too long',
        )

    message = db.query(Message).filter(Message.id == message_id).first()
    if message is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Message not found',
        )

    existing = db.query(MessageReaction).filter(
        MessageReaction.message_id == message_id,
        MessageReaction.user_id == user_id,
        MessageReaction.reaction == reaction,
    ).first()

    if existing is not None:
        # Toggle off
        db.delete(existing)
        db.commit()
        toggled = 'removed'
    else:
        db.add(MessageReaction(
            message_id=message_id,
            user_id=user_id,
            reaction=reaction,
        ))
        db.commit()
        toggled = 'added'

    total = _refresh_reactions_count(db, message_id)
    summary = _serialize_reactions_summary(db, message_id)
    return {
        'message_id': message_id,
        'user_id': user_id,
        'reaction': reaction,
        'status': toggled,
        'total': total,
        **summary,
    }


def remove_reaction(db: Session, message_id: int, user_id: int, reaction: str | None = None) -> dict:
    """إزالة تفاعل (واحد أو كل تفاعلات المستخدم على هذه الرسالة)."""
    query = db.query(MessageReaction).filter(
        MessageReaction.message_id == message_id,
        MessageReaction.user_id == user_id,
    )
    if reaction:
        query = query.filter(MessageReaction.reaction == reaction)
    deleted_count = query.delete(synchronize_session=False)
    db.commit()

    total = _refresh_reactions_count(db, message_id)
    summary = _serialize_reactions_summary(db, message_id)
    return {
        'message_id': message_id,
        'removed': int(deleted_count),
        'total': total,
        **summary,
    }


def list_reactions(db: Session, message_id: int) -> dict:
    """جلب كل تفاعلات رسالة + ملخص."""
    rows = db.query(MessageReaction).filter(
        MessageReaction.message_id == message_id,
    ).order_by(MessageReaction.created_at.asc()).all()
    items = [
        {
            'id': r.id,
            'user_id': r.user_id,
            'reaction': r.reaction,
            'created_at': r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]
    return {
        'message_id': message_id,
        'items': items,
        **_serialize_reactions_summary(db, message_id),
    }


# -----------------------------------------------------------------------------
# Retention
# -----------------------------------------------------------------------------
def apply_retention_policy(db: Session, chat_id, policy: str, user_id: int) -> dict:
    """
    تطبيق سياسة الاحتفاظ على محادثة (يدوياً يحذف الرسائل القديمة).
    chat_id يمكن أن يكون username للنظير، أو 'group:<id>'.
    policy: '24h', '7d', '30d', 'forever'.
    """
    mapping = {
        '24h': timedelta(hours=24),
        '7d': timedelta(days=7),
        '30d': timedelta(days=30),
        'forever': None,
    }
    if policy not in mapping:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Invalid retention policy',
        )

    cutoff_delta = mapping[policy]
    if cutoff_delta is None:
        return {'chat_id': chat_id, 'policy': policy, 'status': 'noop'}

    cutoff = datetime.utcnow() - cutoff_delta
    peer = str(chat_id)

    query = db.query(Message).filter(
        Message.created_at < cutoff,
    )
    if peer.startswith('group:'):
        query = query.filter(Message.receiver == peer)
    else:
        # نُطبق فقط على الرسائل التي يرسلها المستخدم الحالي لهذا النظير
        query = query.filter(
            ((Message.sender_id == user_id) & (Message.receiver == peer)) |
            ((Message.sender == peer) & (Message.receiver_id == user_id))
        )

    now = datetime.utcnow()
    deleted_count = 0
    for msg in query.all():
        msg.deleted_at = now
        msg.content = ''
        msg.message = ''
        msg.media_url = None
        deleted_count += 1

    db.commit()
    return {
        'chat_id': chat_id,
        'policy': policy,
        'status': 'applied',
        'deleted_count': deleted_count,
    }
