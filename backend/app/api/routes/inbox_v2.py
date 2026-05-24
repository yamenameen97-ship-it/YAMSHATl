"""
مسارات الصندوق الوارد المحسّنة مع دعم كامل للأرشفة والكتم والتثبيت والحذف
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.services.inbox_service_v2 import (
    get_conversations,
    archive_chat,
    unarchive_chat,
    pin_chat,
    unpin_chat,
    mute_chat,
    unmute_chat,
    delete_chat,
    restore_chat,
    reorder_pinned_chats,
    get_archived_conversations,
    get_deleted_conversations,
    get_conversation_state,
)

router = APIRouter(prefix="/inbox", tags=["inbox"])


# ============ Pydantic Models ============

class ConversationStateResponse(BaseModel):
    """نموذج استجابة حالة المحادثة"""
    status: str
    conversation_id: int
    is_archived: bool = False
    is_pinned: bool = False
    is_muted: bool = False
    is_deleted: bool = False


class ReorderPinnedRequest(BaseModel):
    """نموذج طلب إعادة ترتيب المحادثات المثبتة"""
    pinned_order: List[int]


# ============ الحصول على المحادثات ============

@router.get("/")
def get_inbox(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    include_archived: bool = Query(False),
    include_deleted: bool = Query(False),
):
    """الحصول على قائمة المحادثات مع الفرز الذكي"""
    conversations = get_conversations(
        db, 
        current_user.id, 
        include_archived=include_archived,
        include_deleted=include_deleted
    )
    return {"conversations": conversations}


@router.get("/archived")
def get_archived(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """الحصول على المحادثات المؤرشفة"""
    conversations = get_archived_conversations(db, current_user.id)
    return {"conversations": conversations}


@router.get("/deleted")
def get_deleted(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """الحصول على المحادثات المحذوفة"""
    conversations = get_deleted_conversations(db, current_user.id)
    return {"conversations": conversations}


@router.get("/{other_user_id}/state")
def get_state(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """الحصول على حالة محادثة معينة"""
    state = get_conversation_state(db, current_user.id, other_user_id)
    if not state:
        raise HTTPException(status_code=404, detail="المحادثة غير موجودة")
    return state


# ============ الأرشفة ============

@router.post("/{other_user_id}/archive")
def archive(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """أرشفة محادثة"""
    result = archive_chat(db, current_user.id, other_user_id)
    return result


@router.post("/{other_user_id}/unarchive")
def unarchive(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إلغاء أرشفة محادثة"""
    result = unarchive_chat(db, current_user.id, other_user_id)
    return result


# ============ التثبيت ============

@router.post("/{other_user_id}/pin")
def pin(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """تثبيت محادثة"""
    result = pin_chat(db, current_user.id, other_user_id)
    return result


@router.post("/{other_user_id}/unpin")
def unpin(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إلغاء تثبيت محادثة"""
    result = unpin_chat(db, current_user.id, other_user_id)
    return result


# ============ الكتم ============

@router.post("/{other_user_id}/mute")
def mute(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """كتم محادثة"""
    result = mute_chat(db, current_user.id, other_user_id)
    return result


@router.post("/{other_user_id}/unmute")
def unmute(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إلغاء كتم محادثة"""
    result = unmute_chat(db, current_user.id, other_user_id)
    return result


# ============ الحذف ============

@router.post("/{other_user_id}/delete")
def delete(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """حذف محادثة"""
    result = delete_chat(db, current_user.id, other_user_id)
    return result


@router.post("/{other_user_id}/restore")
def restore(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """استعادة محادثة محذوفة"""
    result = restore_chat(db, current_user.id, other_user_id)
    return result


# ============ إعادة الترتيب ============

@router.post("/reorder-pinned")
def reorder_pinned(
    request: ReorderPinnedRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إعادة ترتيب المحادثات المثبتة"""
    result = reorder_pinned_chats(db, current_user.id, request.pinned_order)
    return result
