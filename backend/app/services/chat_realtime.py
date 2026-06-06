from __future__ import annotations

from collections import defaultdict
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.message import Message
from app.models.message_attachment import MessageAttachment
from app.models.message_reaction import MessageReaction
from app.models.user import User
from app.core.media_urls import normalize_media_url
from app.services.encryption_service import decrypt_message


def _serialize_attachment(att: MessageAttachment) -> dict:
    return {
        'id': att.id,
        'url': normalize_media_url(att.url),
        'cdn_url': att.cdn_url,
        'thumbnail_url': normalize_media_url(att.thumbnail_url) if att.thumbnail_url else None,
        'kind': att.kind,
        'mime_type': att.mime_type,
        'file_name': att.file_name,
        'file_size': att.file_size,
        'width': att.width,
        'height': att.height,
        'duration_seconds': att.duration_seconds,
        'waveform': att.waveform,
        'position': att.position,
    }


def _serialize_reactions(db: Session, message_id: int) -> dict:
    rows = db.query(
        MessageReaction.reaction,
        func.count(MessageReaction.id),
    ).filter(
        MessageReaction.message_id == message_id,
    ).group_by(MessageReaction.reaction).all()
    summary = [{'reaction': r, 'count': int(c)} for r, c in rows]
    return {
        'summary': summary,
        'total': sum(item['count'] for item in summary),
    }


def _serialize_reply_preview(reply_msg: Message | None) -> dict | None:
    if reply_msg is None:
        return None
    preview = reply_msg.message or ''
    if reply_msg.content and not preview:
        try:
            preview = decrypt_message(reply_msg.content) or ''
        except Exception:
            preview = ''
    if reply_msg.deleted_at:
        preview = 'تم حذف الرسالة'
    if len(preview) > 140:
        preview = preview[:137] + '...'
    return {
        'id': reply_msg.id,
        'sender': reply_msg.sender,
        'content': preview,
        'message_type': reply_msg.message_type,
        'media_url': normalize_media_url(reply_msg.media_url) if reply_msg.media_url else None,
    }


def serialize_message(message: Message, db: Session) -> dict:
    sender = db.query(User).filter(User.id == message.sender_id).first()
    receiver = db.query(User).filter(User.id == message.receiver_id).first()
    deleted = bool(message.deleted_at)
    deleted_for_everyone = bool(getattr(message, 'deleted_for_everyone', False))
    is_recalled = bool(getattr(message, 'is_recalled', False))
    if deleted or is_recalled:
        safe_content = ''
    else:
        raw_content = message.content or ''
        safe_content = decrypt_message(raw_content) if raw_content else str(getattr(message, 'message', '') or '')

    # المرفقات المتعددة
    attachments = []
    try:
        atts = getattr(message, 'attachments', None) or []
        attachments = [_serialize_attachment(a) for a in atts]
    except Exception:
        attachments = []

    # رد على رسالة
    reply_preview = None
    reply_to_id = getattr(message, 'reply_to_id', None)
    if reply_to_id:
        reply_msg = db.query(Message).filter(Message.id == reply_to_id).first()
        reply_preview = _serialize_reply_preview(reply_msg)

    return {
        'id': message.id,
        'client_id': message.client_id,
        'sender': sender.username if sender else (getattr(message, 'sender', None) or str(message.sender_id)),
        'receiver': receiver.username if receiver else (getattr(message, 'receiver', None) or str(message.receiver_id)),
        'message': 'تم حذف الرسالة' if deleted else safe_content,
        'content': 'تم حذف الرسالة' if deleted else safe_content,
        'media_url': None if deleted else normalize_media_url(message.media_url),
        'attachments': attachments,
        'type': message.message_type or ('image' if message.media_url else 'text'),
        'created_at': message.created_at.isoformat() if message.created_at else None,
        'delivered_at': message.delivered_at.isoformat() if message.delivered_at else None,
        'seen_at': message.seen_at.isoformat() if message.seen_at else None,
        'edited_at': message.edited_at.isoformat() if getattr(message, 'edited_at', None) else None,
        'is_edited': bool(getattr(message, 'is_edited', False)),
        'is_recalled': is_recalled,
        'expires_at': message.expires_at.isoformat() if getattr(message, 'expires_at', None) else None,
        'status': 'seen' if message.is_seen else 'delivered' if message.is_delivered else 'sent',
        'deleted': deleted,
        'deleted_for_everyone': deleted_for_everyone,
        'reply_to_id': reply_to_id,
        'reply_to': reply_preview,
        'forwarded_from_id': getattr(message, 'forwarded_from_id', None),
        'is_forwarded': bool(getattr(message, 'forwarded_from_id', None)),
        'reactions_count': int(getattr(message, 'reactions_count', 0) or 0),
        'reactions': _serialize_reactions(db, message.id),
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
