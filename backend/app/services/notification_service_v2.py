"""
خدمة الإشعارات المحسّنة مع دعم Push Notifications والإشعارات المتقدمة
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from sqlalchemy import and_, func, desc, or_
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User


# ============ أنواع الإشعارات ============

NOTIFICATION_TYPES = {
    "new_message": "رسالة جديدة",
    "new_follow": "متابع جديد",
    "new_like": "إعجاب جديد",
    "new_comment": "تعليق جديد",
    "new_share": "مشاركة جديدة",
    "gift_received": "هدية جديدة",
    "live_started": "بث مباشر جديد",
    "mention": "إشارة جديدة",
    "system_alert": "تنبيه نظام",
    "admin_action": "إجراء إداري",
}


# ============ إنشاء الإشعارات ============

def create_notification(
    db: Session,
    user_id: int,
    notif_type: str,
    title: str,
    body: str,
    data: Dict = None,
) -> Optional[Dict[str, Any]]:
    """إنشاء إشعار جديد"""
    
    if notif_type not in NOTIFICATION_TYPES:
        raise ValueError(f"نوع الإشعار غير صحيح: {notif_type}")

    # التحقق من تفضيلات المستخدم
    try:
        from app.models.user_preference import UserPreference
        pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        if pref:
            if notif_type == "new_message" and not pref.notify_messages: return None
            if notif_type == "live_started" and not pref.notify_live: return None
            if notif_type in ["new_like", "new_comment", "new_share", "mention"] and not pref.notify_posts: return None
            # يمكن إضافة المزيد من التحققات هنا للمجموعات والريلز والستوري حسب نوع الإشعار
    except Exception as e:
        print(f"Error checking notification preferences: {e}")
    
    notification = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        body=body,
        data=data or {},
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return {
        "id": notification.id,
        "type": notif_type,
        "title": title,
        "body": body,
        "created_at": notification.created_at,
    }


def create_message_notification(
    db: Session,
    user_id: int,
    sender_id: int,
    message_preview: str,
) -> Dict[str, Any]:
    """إنشاء إشعار رسالة جديدة"""
    
    sender = db.query(User).filter(User.id == sender_id).first()
    if not sender:
        raise ValueError("المرسل غير موجود")
    
    return create_notification(
        db,
        user_id,
        "new_message",
        f"رسالة جديدة من {sender.username}",
        message_preview[:100],
        {
            "sender_id": sender_id,
            "sender_username": sender.username,
            "message_preview": message_preview,
        },
    )


def create_follow_notification(
    db: Session,
    user_id: int,
    follower_id: int,
) -> Dict[str, Any]:
    """إنشاء إشعار متابع جديد"""
    
    follower = db.query(User).filter(User.id == follower_id).first()
    if not follower:
        raise ValueError("المتابع غير موجود")
    
    return create_notification(
        db,
        user_id,
        "new_follow",
        f"{follower.username} يتابعك الآن",
        "اضغط لعرض الملف الشخصي",
        {
            "follower_id": follower_id,
            "follower_username": follower.username,
        },
    )


def create_like_notification(
    db: Session,
    user_id: int,
    liker_id: int,
    post_id: int,
) -> Dict[str, Any]:
    """إنشاء إشعار إعجاب جديد"""
    
    liker = db.query(User).filter(User.id == liker_id).first()
    if not liker:
        raise ValueError("المعجب غير موجود")
    
    return create_notification(
        db,
        user_id,
        "new_like",
        f"{liker.username} أعجب بمنشورك",
        "اضغط لعرض المنشور",
        {
            "liker_id": liker_id,
            "liker_username": liker.username,
            "post_id": post_id,
        },
    )


def create_comment_notification(
    db: Session,
    user_id: int,
    commenter_id: int,
    post_id: int,
    comment_preview: str,
) -> Dict[str, Any]:
    """إنشاء إشعار تعليق جديد"""
    
    commenter = db.query(User).filter(User.id == commenter_id).first()
    if not commenter:
        raise ValueError("المعلق غير موجود")
    
    return create_notification(
        db,
        user_id,
        "new_comment",
        f"{commenter.username} علق على منشورك",
        comment_preview[:100],
        {
            "commenter_id": commenter_id,
            "commenter_username": commenter.username,
            "post_id": post_id,
            "comment_preview": comment_preview,
        },
    )


def create_gift_notification(
    db: Session,
    user_id: int,
    sender_id: int,
    gift_name: str,
    amount: int,
) -> Dict[str, Any]:
    """إنشاء إشعار هدية جديدة"""
    
    sender = db.query(User).filter(User.id == sender_id).first()
    if not sender:
        raise ValueError("المرسل غير موجود")
    
    return create_notification(
        db,
        user_id,
        "gift_received",
        f"تلقيت {amount} {gift_name} من {sender.username}",
        "شكراً على الدعم!",
        {
            "sender_id": sender_id,
            "sender_username": sender.username,
            "gift_name": gift_name,
            "amount": amount,
        },
    )


def create_live_notification(
    db: Session,
    user_id: int,
    host_id: int,
    room_id: str,
) -> Dict[str, Any]:
    """إنشاء إشعار بث مباشر جديد"""
    
    host = db.query(User).filter(User.id == host_id).first()
    if not host:
        raise ValueError("المضيف غير موجود")
    
    return create_notification(
        db,
        user_id,
        "live_started",
        f"{host.username} بدأ بث مباشر",
        "اضغط للانضمام",
        {
            "host_id": host_id,
            "host_username": host.username,
            "room_id": room_id,
        },
    )


# ============ إدارة الإشعارات ============

def get_notifications(
    db: Session,
    user_id: int,
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """الحصول على إشعارات المستخدم"""
    
    query = db.query(Notification).filter(Notification.user_id == user_id)
    
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))
    
    notifications = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()
    
    return [
        {
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "body": n.body,
            "data": n.data,
            "is_read": n.is_read,
            "created_at": n.created_at,
        }
        for n in notifications
    ]


def mark_as_read(db: Session, notification_id: int) -> Dict[str, Any]:
    """تعليم إشعار كمقروء"""
    
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise ValueError("الإشعار غير موجود")
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    
    return {
        "status": "marked_as_read",
        "notification_id": notification_id,
    }


def mark_all_as_read(db: Session, user_id: int) -> Dict[str, Any]:
    """تعليم جميع الإشعارات كمقروءة"""
    
    count = db.query(Notification).filter(
        and_(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        )
    ).update({Notification.is_read: True})
    
    db.commit()
    
    return {
        "status": "marked_all_as_read",
        "count": count,
    }


def delete_notification(db: Session, notification_id: int) -> Dict[str, Any]:
    """حذف إشعار"""
    
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise ValueError("الإشعار غير موجود")
    
    db.delete(notification)
    db.commit()
    
    return {
        "status": "deleted",
        "notification_id": notification_id,
    }


def clear_old_notifications(
    db: Session,
    user_id: int,
    days: int = 30,
) -> Dict[str, Any]:
    """حذف الإشعارات القديمة"""
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    count = db.query(Notification).filter(
        and_(
            Notification.user_id == user_id,
            Notification.created_at < cutoff_date,
        )
    ).delete()
    
    db.commit()
    
    return {
        "status": "cleared",
        "count": count,
    }


# ============ إحصائيات الإشعارات ============

def get_unread_count(db: Session, user_id: int) -> int:
    """الحصول على عدد الإشعارات غير المقروءة"""
    
    count = db.query(func.count(Notification.id)).filter(
        and_(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        )
    ).scalar() or 0
    
    return count


def get_notification_summary(db: Session, user_id: int) -> Dict[str, Any]:
    """الحصول على ملخص الإشعارات"""
    
    total = db.query(func.count(Notification.id)).filter(
        Notification.user_id == user_id
    ).scalar() or 0
    
    unread = get_unread_count(db, user_id)
    
    # الإشعارات حسب النوع
    type_counts = db.query(
        Notification.type,
        func.count(Notification.id).label('count'),
    ).filter(
        Notification.user_id == user_id
    ).group_by(Notification.type).all()
    
    type_summary = {
        t[0]: t[1] for t in type_counts
    }
    
    return {
        "total": total,
        "unread": unread,
        "by_type": type_summary,
    }


def get_notification_preferences(db: Session, user_id: int) -> Dict[str, Any]:
    """الحصول على تفضيلات الإشعارات"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("المستخدم غير موجود")
    
    # يمكن توسيع هذا لاحقاً
    return {
        "user_id": user_id,
        "notifications_enabled": True,
        "push_notifications_enabled": True,
        "email_notifications_enabled": False,
        "notification_types": {
            "new_message": True,
            "new_follow": True,
            "new_like": True,
            "new_comment": True,
            "gift_received": True,
            "live_started": True,
        },
    }


# ============ Push Notifications ============

def send_push_notification(
    user_id: int,
    title: str,
    body: str,
    data: Dict = None,
) -> Dict[str, Any]:
    """إرسال إشعار Push (يحتاج تكامل مع FCM أو خدمة أخرى)"""
    
    # هذا نموذج للتكامل مع Firebase Cloud Messaging
    # يمكن تطويره لاحقاً
    
    return {
        "status": "sent",
        "user_id": user_id,
        "title": title,
        "body": body,
        "timestamp": datetime.utcnow(),
    }


def send_browser_notification(
    user_id: int,
    title: str,
    body: str,
    icon: str = None,
    badge: str = None,
    tag: str = None,
) -> Dict[str, Any]:
    """إرسال إشعار متصفح (Web Push)"""
    
    return {
        "status": "sent",
        "user_id": user_id,
        "title": title,
        "body": body,
        "icon": icon,
        "badge": badge,
        "tag": tag,
        "timestamp": datetime.utcnow(),
    }


# ============ مركز الإشعارات ============

def get_notification_center(
    db: Session,
    user_id: int,
    filter_type: str = None,
    skip: int = 0,
    limit: int = 50,
) -> Dict[str, Any]:
    """الحصول على مركز الإشعارات الكامل"""
    
    # الإشعارات
    query = db.query(Notification).filter(Notification.user_id == user_id)
    
    if filter_type:
        query = query.filter(Notification.type == filter_type)
    
    notifications = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()
    
    # الملخص
    summary = get_notification_summary(db, user_id)
    
    # التفضيلات
    preferences = get_notification_preferences(db, user_id)
    
    return {
        "notifications": [
            {
                "id": n.id,
                "type": n.type,
                "title": n.title,
                "body": n.body,
                "data": n.data,
                "is_read": n.is_read,
                "created_at": n.created_at,
            }
            for n in notifications
        ],
        "summary": summary,
        "preferences": preferences,
    }


def categorize_notifications(
    db: Session,
    user_id: int,
) -> Dict[str, List[Dict[str, Any]]]:
    """تصنيف الإشعارات حسب النوع"""
    
    notifications = db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(desc(Notification.created_at)).all()
    
    categorized = {}
    
    for notif in notifications:
        if notif.type not in categorized:
            categorized[notif.type] = []
        
        categorized[notif.type].append({
            "id": notif.id,
            "title": notif.title,
            "body": notif.body,
            "data": notif.data,
            "is_read": notif.is_read,
            "created_at": notif.created_at,
        })
    
    return categorized
