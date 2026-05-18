"""
خدمة لوحة الإدارة الشاملة
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from sqlalchemy import and_, func, desc, or_
from sqlalchemy.orm import Session

from app.models.admin_audit import AdminAuditLog, UserReport, AdminNotification, SystemStatistics
from app.models.user import User
from app.models.post import Post
from app.models.message import Message
from app.models.comment import Comment


# ============ إدارة المستخدمين ============

def get_all_users(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    search: str = None,
    role: str = None,
) -> List[Dict[str, Any]]:
    """الحصول على قائمة المستخدمين"""
    query = db.query(User)
    
    if search:
        query = query.filter(
            or_(
                User.username.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
            )
        )
    
    if role:
        query = query.filter(User.role == role)
    
    users = query.offset(skip).limit(limit).all()
    
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "followers_count": u.followers_count,
            "following_count": u.following_count,
            "last_login_at": u.last_login_at,
            "created_at": u.created_at,
            "banned_at": u.banned_at,
        }
        for u in users
    ]


def ban_user(
    db: Session,
    admin_id: int,
    user_id: int,
    reason: str = None,
) -> Dict[str, Any]:
    """حظر مستخدم"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("المستخدم غير موجود")
    
    user.banned_at = datetime.utcnow()
    user.is_active = False
    db.commit()
    db.refresh(user)
    
    # تسجيل الإجراء
    log_admin_action(db, admin_id, "ban_user", "user", user_id, reason=reason)
    
    return {
        "status": "banned",
        "user_id": user_id,
        "banned_at": user.banned_at,
    }


def unban_user(
    db: Session,
    admin_id: int,
    user_id: int,
) -> Dict[str, Any]:
    """إلغاء حظر مستخدم"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("المستخدم غير موجود")
    
    user.banned_at = None
    user.is_active = True
    db.commit()
    db.refresh(user)
    
    # تسجيل الإجراء
    log_admin_action(db, admin_id, "unban_user", "user", user_id)
    
    return {
        "status": "unbanned",
        "user_id": user_id,
    }


def delete_user(
    db: Session,
    admin_id: int,
    user_id: int,
    reason: str = None,
) -> Dict[str, Any]:
    """حذف حساب مستخدم"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("المستخدم غير موجود")
    
    # حذف جميع البيانات المرتبطة (يتم حذفها تلقائياً بسبب CASCADE)
    db.delete(user)
    db.commit()
    
    # تسجيل الإجراء
    log_admin_action(db, admin_id, "delete_user", "user", user_id, reason=reason)
    
    return {
        "status": "deleted",
        "user_id": user_id,
    }


def edit_user_permissions(
    db: Session,
    admin_id: int,
    user_id: int,
    role: str = None,
) -> Dict[str, Any]:
    """تعديل صلاحيات المستخدم"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("المستخدم غير موجود")
    
    if role:
        user.role = role
    
    db.commit()
    db.refresh(user)
    
    # تسجيل الإجراء
    log_admin_action(db, admin_id, "edit_permissions", "user", user_id)
    
    return {
        "status": "updated",
        "user_id": user_id,
        "role": user.role,
    }


# ============ إدارة البلاغات ============

def get_reports(
    db: Session,
    status: str = None,
    skip: int = 0,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """الحصول على البلاغات"""
    query = db.query(UserReport)
    
    if status:
        query = query.filter(UserReport.status == status)
    
    reports = query.order_by(desc(UserReport.created_at)).offset(skip).limit(limit).all()
    
    return [
        {
            "id": r.id,
            "reporter_id": r.reporter_id,
            "target_type": r.target_type,
            "target_id": r.target_id,
            "reason": r.reason,
            "description": r.description,
            "status": r.status,
            "created_at": r.created_at,
        }
        for r in reports
    ]


def resolve_report(
    db: Session,
    admin_id: int,
    report_id: int,
    action: str = None,
    notes: str = None,
) -> Dict[str, Any]:
    """حل بلاغ"""
    report = db.query(UserReport).filter(UserReport.id == report_id).first()
    if not report:
        raise ValueError("البلاغ غير موجود")
    
    report.status = "resolved"
    report.resolved_by = admin_id
    report.resolution_notes = notes
    report.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(report)
    
    # تسجيل الإجراء
    log_admin_action(db, admin_id, "resolve_report", "report", report_id, reason=action)
    
    return {
        "status": "resolved",
        "report_id": report_id,
    }


def dismiss_report(
    db: Session,
    admin_id: int,
    report_id: int,
    reason: str = None,
) -> Dict[str, Any]:
    """رفض بلاغ"""
    report = db.query(UserReport).filter(UserReport.id == report_id).first()
    if not report:
        raise ValueError("البلاغ غير موجود")
    
    report.status = "dismissed"
    report.resolved_by = admin_id
    report.resolution_notes = reason
    report.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(report)
    
    # تسجيل الإجراء
    log_admin_action(db, admin_id, "dismiss_report", "report", report_id)
    
    return {
        "status": "dismissed",
        "report_id": report_id,
    }


# ============ الإحصائيات ============

def get_dashboard_statistics(db: Session) -> Dict[str, Any]:
    """الحصول على إحصائيات لوحة المعلومات"""
    
    # إحصائيات المستخدمين
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0
    banned_users = db.query(func.count(User.id)).filter(User.banned_at.isnot(None)).scalar() or 0
    
    # إحصائيات المحتوى
    total_posts = db.query(func.count(Post.id)).scalar() or 0
    total_messages = db.query(func.count(Message.id)).scalar() or 0
    total_comments = db.query(func.count(Comment.id)).scalar() or 0
    
    # البلاغات المعلقة
    pending_reports = db.query(func.count(UserReport.id)).filter(
        UserReport.status == "pending"
    ).scalar() or 0
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "banned": banned_users,
            "inactive": total_users - active_users,
        },
        "content": {
            "posts": total_posts,
            "messages": total_messages,
            "comments": total_comments,
        },
        "reports": {
            "pending": pending_reports,
        },
    }


def get_user_statistics(db: Session, user_id: int) -> Dict[str, Any]:
    """الحصول على إحصائيات مستخدم معين"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("المستخدم غير موجود")
    
    posts_count = db.query(func.count(Post.id)).filter(Post.user_id == user_id).scalar() or 0
    messages_sent = db.query(func.count(Message.id)).filter(Message.sender_id == user_id).scalar() or 0
    messages_received = db.query(func.count(Message.id)).filter(Message.receiver_id == user_id).scalar() or 0
    
    return {
        "user_id": user_id,
        "username": user.username,
        "posts": posts_count,
        "messages_sent": messages_sent,
        "messages_received": messages_received,
        "followers": user.followers_count,
        "following": user.following_count,
        "created_at": user.created_at,
        "last_login_at": user.last_login_at,
    }


def get_system_statistics(
    db: Session,
    days: int = 7,
) -> List[Dict[str, Any]]:
    """الحصول على إحصائيات النظام للأيام الماضية"""
    
    stats = db.query(SystemStatistics).filter(
        SystemStatistics.date >= datetime.utcnow() - timedelta(days=days)
    ).order_by(desc(SystemStatistics.date)).all()
    
    return [
        {
            "date": s.date,
            "total_users": s.total_users,
            "active_users": s.active_users,
            "new_users": s.new_users,
            "total_posts": s.total_posts,
            "total_messages": s.total_messages,
            "active_live_rooms": s.active_live_rooms,
            "total_revenue": s.total_revenue,
        }
        for s in stats
    ]


# ============ إدارة المحتوى ============

def delete_post(
    db: Session,
    admin_id: int,
    post_id: int,
    reason: str = None,
) -> Dict[str, Any]:
    """حذف منشور"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise ValueError("المنشور غير موجود")
    
    db.delete(post)
    db.commit()
    
    # تسجيل الإجراء
    log_admin_action(db, admin_id, "delete_post", "post", post_id, reason=reason)
    
    return {
        "status": "deleted",
        "post_id": post_id,
    }


def delete_comment(
    db: Session,
    admin_id: int,
    comment_id: int,
    reason: str = None,
) -> Dict[str, Any]:
    """حذف تعليق"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise ValueError("التعليق غير موجود")
    
    db.delete(comment)
    db.commit()
    
    # تسجيل الإجراء
    log_admin_action(db, admin_id, "delete_comment", "comment", comment_id, reason=reason)
    
    return {
        "status": "deleted",
        "comment_id": comment_id,
    }


# ============ سجلات التدقيق ============

def log_admin_action(
    db: Session,
    admin_id: int,
    action: str,
    target_type: str,
    target_id: int,
    reason: str = None,
    details: Dict = None,
) -> Dict[str, Any]:
    """تسجيل إجراء إداري"""
    
    log = AdminAuditLog(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        reason=reason,
        details=details or {},
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    
    return {
        "id": log.id,
        "action": action,
        "created_at": log.created_at,
    }


def get_audit_logs(
    db: Session,
    admin_id: int = None,
    action: str = None,
    skip: int = 0,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """الحصول على سجلات التدقيق"""
    query = db.query(AdminAuditLog)
    
    if admin_id:
        query = query.filter(AdminAuditLog.admin_id == admin_id)
    
    if action:
        query = query.filter(AdminAuditLog.action == action)
    
    logs = query.order_by(desc(AdminAuditLog.created_at)).offset(skip).limit(limit).all()
    
    return [
        {
            "id": l.id,
            "admin_id": l.admin_id,
            "action": l.action,
            "target_type": l.target_type,
            "target_id": l.target_id,
            "reason": l.reason,
            "created_at": l.created_at,
        }
        for l in logs
    ]


# ============ إشعارات الإدارة ============

def create_admin_notification(
    db: Session,
    admin_id: int,
    notif_type: str,
    title: str,
    message: str,
    link: str = None,
) -> Dict[str, Any]:
    """إنشاء إشعار إداري"""
    
    notification = AdminNotification(
        admin_id=admin_id,
        type=notif_type,
        title=title,
        message=message,
        link=link,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return {
        "id": notification.id,
        "type": notif_type,
        "title": title,
    }


def get_admin_notifications(
    db: Session,
    admin_id: int,
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """الحصول على إشعارات الإدارة"""
    query = db.query(AdminNotification).filter(AdminNotification.admin_id == admin_id)
    
    if unread_only:
        query = query.filter(AdminNotification.is_read.is_(False))
    
    notifications = query.order_by(desc(AdminNotification.created_at)).offset(skip).limit(limit).all()
    
    return [
        {
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "link": n.link,
            "is_read": n.is_read,
            "created_at": n.created_at,
        }
        for n in notifications
    ]


def mark_notification_as_read(db: Session, notification_id: int) -> Dict[str, Any]:
    """تعليم إشعار كمقروء"""
    notification = db.query(AdminNotification).filter(AdminNotification.id == notification_id).first()
    if not notification:
        raise ValueError("الإشعار غير موجود")
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    
    return {
        "status": "marked_as_read",
        "notification_id": notification_id,
    }
