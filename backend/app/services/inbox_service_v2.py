"""
خدمة الصندوق الوارد المحسّنة مع دعم كامل للأرشفة والكتم والتثبيت والحذف
"""
from datetime import datetime
from typing import List, Dict, Any, Optional

from sqlalchemy import and_, func, or_, desc
from sqlalchemy.orm import Session

from app.models.conversation_state import ConversationState
from app.models.message import Message
from app.models.user import User


def get_or_create_conversation_state(
    db: Session, user_id: int, other_user_id: int
) -> ConversationState:
    """الحصول على أو إنشاء حالة المحادثة"""
    state = db.query(ConversationState).filter(
        and_(
            ConversationState.user_id == user_id,
            ConversationState.other_user_id == other_user_id,
        )
    ).first()
    
    if not state:
        state = ConversationState(
            user_id=user_id,
            other_user_id=other_user_id,
        )
        db.add(state)
        db.commit()
        db.refresh(state)
    
    return state


def get_conversations(
    db: Session, user_id: int, include_archived: bool = False, include_deleted: bool = False
) -> List[Dict[str, Any]]:
    """الحصول على قائمة المحادثات مع الفرز الذكي"""
    
    # الحصول على جميع الرسائل المتعلقة بالمستخدم
    messages = db.query(Message).filter(
        or_(Message.sender_id == user_id, Message.receiver_id == user_id)
    ).order_by(Message.created_at.desc()).all()

    conversations: Dict[int, Dict[str, Any]] = {}
    
    for msg in messages:
        other_user_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
        
        if other_user_id not in conversations:
            # الحصول على حالة المحادثة
            state = get_or_create_conversation_state(db, user_id, other_user_id)
            
            # تخطي المحادثات المحذوفة إذا لم تكن مطلوبة
            if state.is_deleted and not include_deleted:
                continue
            
            # تخطي المحادثات المؤرشفة إذا لم تكن مطلوبة
            if state.is_archived and not include_archived:
                continue
            
            # الحصول على بيانات المستخدم الآخر
            other_user = db.query(User).filter(User.id == other_user_id).first()
            
            # حساب الرسائل غير المقروءة
            unread_count = db.query(func.count(Message.id)).filter(
                Message.receiver_id == user_id,
                Message.sender_id == other_user_id,
                Message.is_seen.is_(False),
            ).scalar() or 0
            
            conversations[other_user_id] = {
                'user_id': other_user_id,
                'username': other_user.username if other_user else 'unknown',
                'avatar': other_user.avatar if other_user else None,
                'last_message': msg.content,
                'last_message_type': msg.message_type,
                'last_message_media_url': msg.media_url,
                'timestamp': msg.created_at,
                'is_seen': True if msg.sender_id == user_id else msg.is_seen,
                'unread_count': unread_count,
                # حالة المحادثة
                'is_archived': state.is_archived,
                'is_pinned': state.is_pinned,
                'is_muted': state.is_muted,
                'is_deleted': state.is_deleted,
                'pin_order': state.pin_order,
                'archived_at': state.archived_at,
                'pinned_at': state.pinned_at,
                'muted_at': state.muted_at,
            }
    
    # الفرز الذكي: المثبتة أولاً، ثم حسب آخر رسالة
    result = list(conversations.values())
    result.sort(
        key=lambda x: (
            not x['is_pinned'],  # المثبتة أولاً
            -(x['pin_order'] or 0) if x['is_pinned'] else 0,  # ترتيب التثبيت
            x['timestamp'].timestamp() if x['timestamp'] else 0,  # آخر رسالة
        ),
        reverse=True
    )
    
    return result


def archive_chat(db: Session, user_id: int, other_user_id: int) -> Dict[str, Any]:
    """أرشفة محادثة"""
    state = get_or_create_conversation_state(db, user_id, other_user_id)
    state.is_archived = True
    state.archived_at = datetime.utcnow()
    db.commit()
    db.refresh(state)
    
    return {
        "status": "archived",
        "conversation_id": state.id,
        "is_archived": state.is_archived,
        "archived_at": state.archived_at,
    }


def unarchive_chat(db: Session, user_id: int, other_user_id: int) -> Dict[str, Any]:
    """إلغاء أرشفة محادثة"""
    state = get_or_create_conversation_state(db, user_id, other_user_id)
    state.is_archived = False
    state.archived_at = None
    db.commit()
    db.refresh(state)
    
    return {
        "status": "unarchived",
        "conversation_id": state.id,
        "is_archived": state.is_archived,
    }


def pin_chat(db: Session, user_id: int, other_user_id: int) -> Dict[str, Any]:
    """تثبيت محادثة"""
    state = get_or_create_conversation_state(db, user_id, other_user_id)
    
    # الحصول على أعلى ترتيب تثبيت حالي
    max_pin_order = db.query(func.max(ConversationState.pin_order)).filter(
        and_(
            ConversationState.user_id == user_id,
            ConversationState.is_pinned.is_(True),
        )
    ).scalar() or 0
    
    state.is_pinned = True
    state.pin_order = max_pin_order + 1
    state.pinned_at = datetime.utcnow()
    db.commit()
    db.refresh(state)
    
    return {
        "status": "pinned",
        "conversation_id": state.id,
        "is_pinned": state.is_pinned,
        "pin_order": state.pin_order,
        "pinned_at": state.pinned_at,
    }


def unpin_chat(db: Session, user_id: int, other_user_id: int) -> Dict[str, Any]:
    """إلغاء تثبيت محادثة"""
    state = get_or_create_conversation_state(db, user_id, other_user_id)
    state.is_pinned = False
    state.pin_order = None
    state.pinned_at = None
    db.commit()
    db.refresh(state)
    
    return {
        "status": "unpinned",
        "conversation_id": state.id,
        "is_pinned": state.is_pinned,
    }


def mute_chat(db: Session, user_id: int, other_user_id: int) -> Dict[str, Any]:
    """كتم محادثة (عدم تلقي إشعارات)"""
    state = get_or_create_conversation_state(db, user_id, other_user_id)
    state.is_muted = True
    state.muted_at = datetime.utcnow()
    db.commit()
    db.refresh(state)
    
    return {
        "status": "muted",
        "conversation_id": state.id,
        "is_muted": state.is_muted,
        "muted_at": state.muted_at,
    }


def unmute_chat(db: Session, user_id: int, other_user_id: int) -> Dict[str, Any]:
    """إلغاء كتم محادثة"""
    state = get_or_create_conversation_state(db, user_id, other_user_id)
    state.is_muted = False
    state.muted_at = None
    db.commit()
    db.refresh(state)
    
    return {
        "status": "unmuted",
        "conversation_id": state.id,
        "is_muted": state.is_muted,
    }


def delete_chat(db: Session, user_id: int, other_user_id: int) -> Dict[str, Any]:
    """حذف محادثة (soft delete)"""
    state = get_or_create_conversation_state(db, user_id, other_user_id)
    state.is_deleted = True
    state.deleted_at = datetime.utcnow()
    db.commit()
    db.refresh(state)
    
    return {
        "status": "deleted",
        "conversation_id": state.id,
        "is_deleted": state.is_deleted,
        "deleted_at": state.deleted_at,
    }


def restore_chat(db: Session, user_id: int, other_user_id: int) -> Dict[str, Any]:
    """استعادة محادثة محذوفة"""
    state = get_or_create_conversation_state(db, user_id, other_user_id)
    state.is_deleted = False
    state.deleted_at = None
    db.commit()
    db.refresh(state)
    
    return {
        "status": "restored",
        "conversation_id": state.id,
        "is_deleted": state.is_deleted,
    }


def reorder_pinned_chats(db: Session, user_id: int, pinned_order: List[int]) -> Dict[str, Any]:
    """إعادة ترتيب المحادثات المثبتة"""
    for index, other_user_id in enumerate(pinned_order):
        state = get_or_create_conversation_state(db, user_id, other_user_id)
        state.pin_order = index + 1
        db.add(state)
    
    db.commit()
    
    return {
        "status": "reordered",
        "count": len(pinned_order),
    }


def get_archived_conversations(db: Session, user_id: int) -> List[Dict[str, Any]]:
    """الحصول على المحادثات المؤرشفة"""
    return get_conversations(db, user_id, include_archived=True, include_deleted=False)


def get_deleted_conversations(db: Session, user_id: int) -> List[Dict[str, Any]]:
    """الحصول على المحادثات المحذوفة"""
    return get_conversations(db, user_id, include_archived=False, include_deleted=True)


def get_conversation_state(
    db: Session, user_id: int, other_user_id: int
) -> Optional[Dict[str, Any]]:
    """الحصول على حالة محادثة معينة"""
    state = db.query(ConversationState).filter(
        and_(
            ConversationState.user_id == user_id,
            ConversationState.other_user_id == other_user_id,
        )
    ).first()
    
    if not state:
        return None
    
    return {
        "id": state.id,
        "is_archived": state.is_archived,
        "is_pinned": state.is_pinned,
        "is_muted": state.is_muted,
        "is_deleted": state.is_deleted,
        "pin_order": state.pin_order,
        "archived_at": state.archived_at,
        "pinned_at": state.pinned_at,
        "muted_at": state.muted_at,
        "deleted_at": state.deleted_at,
        "created_at": state.created_at,
        "updated_at": state.updated_at,
    }
