"""
مسارات الإشعارات الكاملة مع دعم Push Notifications ومركز الإشعارات
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.services.notification_service_v2 import (
    create_notification,
    create_message_notification,
    create_follow_notification,
    create_like_notification,
    create_comment_notification,
    create_gift_notification,
    get_notifications,
    mark_as_read,
    mark_all_as_read,
    delete_notification,
    clear_old_notifications,
    get_unread_count,
    get_notification_summary,
    get_notification_preferences,
    send_push_notification,
    send_browser_notification,
    get_notification_center,
    categorize_notifications,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


# ============ Pydantic Models ============

class CreateNotificationRequest(BaseModel):
    """نموذج طلب إنشاء إشعار"""
    type: str
    title: str
    body: str
    data: dict = None


class PushNotificationRequest(BaseModel):
    """نموذج طلب إرسال إشعار Push"""
    title: str
    body: str
    data: dict = None


class BrowserNotificationRequest(BaseModel):
    """نموذج طلب إرسال إشعار متصفح"""
    title: str
    body: str
    icon: str = None
    badge: str = None
    tag: str = None


# ============ الحصول على الإشعارات ============

@router.get("/")
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    unread_only: bool = Query(False),
    skip: int = Query(0),
    limit: int = Query(50),
):
    """الحصول على إشعارات المستخدم"""
    notifications = get_notifications(
        db,
        current_user.id,
        unread_only=unread_only,
        skip=skip,
        limit=limit,
    )
    return {"notifications": notifications}


@router.get("/center")
def get_notification_center_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    filter_type: str = Query(None),
    skip: int = Query(0),
    limit: int = Query(50),
):
    """الحصول على مركز الإشعارات الكامل"""
    center = get_notification_center(
        db,
        current_user.id,
        filter_type=filter_type,
        skip=skip,
        limit=limit,
    )
    return center


@router.get("/categorized")
def get_categorized_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """الحصول على الإشعارات مصنفة حسب النوع"""
    categorized = categorize_notifications(db, current_user.id)
    return {"notifications": categorized}


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """الحصول على ملخص الإشعارات"""
    summary = get_notification_summary(db, current_user.id)
    return summary


@router.get("/unread-count")
def get_unread(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """الحصول على عدد الإشعارات غير المقروءة"""
    count = get_unread_count(db, current_user.id)
    return {"unread_count": count}


@router.get("/preferences")
def get_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """الحصول على تفضيلات الإشعارات"""
    preferences = get_notification_preferences(db, current_user.id)
    return preferences


# ============ إدارة الإشعارات ============

@router.post("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """تعليم إشعار كمقروء"""
    result = mark_as_read(db, notification_id)
    return result


@router.post("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """تعليم جميع الإشعارات كمقروءة"""
    result = mark_all_as_read(db, current_user.id)
    return result


@router.delete("/{notification_id}")
def delete_notification_endpoint(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """حذف إشعار"""
    result = delete_notification(db, notification_id)
    return result


@router.post("/clear-old")
def clear_old_notifications_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    days: int = Query(30),
):
    """حذف الإشعارات القديمة"""
    result = clear_old_notifications(db, current_user.id, days=days)
    return result


# ============ إنشاء الإشعارات ============

@router.post("/create")
def create_notification_endpoint(
    request: CreateNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إنشاء إشعار جديد"""
    result = create_notification(
        db,
        current_user.id,
        request.type,
        request.title,
        request.body,
        data=request.data,
    )
    return result


# ============ Push Notifications ============

@router.post("/push")
def send_push_notification_endpoint(
    request: PushNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إرسال إشعار Push"""
    result = send_push_notification(
        current_user.id,
        request.title,
        request.body,
        data=request.data,
    )
    
    # إنشاء إشعار في قاعدة البيانات أيضاً
    create_notification(
        db,
        current_user.id,
        "system_alert",
        request.title,
        request.body,
        data=request.data,
    )
    
    return result


@router.post("/browser")
def send_browser_notification_endpoint(
    request: BrowserNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إرسال إشعار متصفح"""
    result = send_browser_notification(
        current_user.id,
        request.title,
        request.body,
        icon=request.icon,
        badge=request.badge,
        tag=request.tag,
    )
    
    # إنشاء إشعار في قاعدة البيانات أيضاً
    create_notification(
        db,
        current_user.id,
        "system_alert",
        request.title,
        request.body,
    )
    
    return result


# ============ أنواع الإشعارات المتخصصة ============

@router.post("/message")
def create_message_notification_endpoint(
    sender_id: int,
    message_preview: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إنشاء إشعار رسالة جديدة"""
    result = create_message_notification(db, current_user.id, sender_id, message_preview)
    return result


@router.post("/follow")
def create_follow_notification_endpoint(
    follower_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إنشاء إشعار متابع جديد"""
    result = create_follow_notification(db, current_user.id, follower_id)
    return result


@router.post("/like")
def create_like_notification_endpoint(
    liker_id: int,
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إنشاء إشعار إعجاب جديد"""
    result = create_like_notification(db, current_user.id, liker_id, post_id)
    return result


@router.post("/comment")
def create_comment_notification_endpoint(
    commenter_id: int,
    post_id: int,
    comment_preview: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إنشاء إشعار تعليق جديد"""
    result = create_comment_notification(
        db,
        current_user.id,
        commenter_id,
        post_id,
        comment_preview,
    )
    return result


@router.post("/gift")
def create_gift_notification_endpoint(
    sender_id: int,
    gift_name: str,
    amount: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إنشاء إشعار هدية جديدة"""
    result = create_gift_notification(
        db,
        current_user.id,
        sender_id,
        gift_name,
        amount,
    )
    return result


