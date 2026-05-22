"""
مسارات لوحة الإدارة الكاملة
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.services.admin_dashboard_service import (
    get_all_users,
    ban_user,
    unban_user,
    delete_user,
    edit_user_permissions,
    get_reports,
    resolve_report,
    dismiss_report,
    get_dashboard_statistics,
    get_user_statistics,
    get_system_statistics,
    delete_post,
    delete_comment,
    get_audit_logs,
    create_admin_notification,
    get_admin_notifications,
    mark_notification_as_read,
)

router = APIRouter(prefix="/admin", tags=["admin"])


# ============ Pydantic Models ============

class BanUserRequest(BaseModel):
    """نموذج طلب حظر مستخدم"""
    reason: str = None


class ResolveReportRequest(BaseModel):
    """نموذج طلب حل بلاغ"""
    action: str = None
    notes: str = None


class DismissReportRequest(BaseModel):
    """نموذج طلب رفض بلاغ"""
    reason: str = None


class DeletePostRequest(BaseModel):
    """نموذج طلب حذف منشور"""
    reason: str = None


# ============ التحقق من الصلاحيات ============

def verify_admin(current_user: User = Depends(get_current_user)):
    """التحقق من أن المستخدم مسؤول"""
    if current_user.role not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="صلاحيات غير كافية")
    return current_user


# ============ لوحة المعلومات ============

@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin),
):
    """الحصول على بيانات لوحة المعلومات"""
    stats = get_dashboard_statistics(db)
    return stats


# ============ إدارة المستخدمين ============

@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin),
    skip: int = Query(0),
    limit: int = Query(50),
    search: str = Query(None),
    role: str = Query(None),
):
    """الحصول على قائمة المستخدمين"""
    users = get_all_users(db, skip=skip, limit=limit, search=search, role=role)
    return {"users": users, "total": len(users)}


@router.get("/users/{user_id}")
def get_user_stats(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin),
):
    """الحصول على إحصائيات مستخدم"""
    stats = get_user_statistics(db, user_id)
    return stats


@router.post("/users/{user_id}/ban")
def ban_user_endpoint(
    user_id: int,
    request: BanUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin),
):
    """حظر مستخدم"""
    result = ban_user(db, current_user.id, user_id, reason=request.reason)
    return result


@router.post("/users/{user_id}/unban")
def unban_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin),
):
    """إلغاء حظر مستخدم"""
    result = unban_user(db, current_user.id, user_id)
    return result


@router.delete("/users/{user_id}")
def delete_user_endpoint(
    user_id: int,
    request: BanUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin),
):
    """حذف حساب مستخدم"""
    result = delete_user(db, current_user.id, user_id, reason=request.reason)
    return result


@router.post("/users/{user_id}/permissions")
def update_permissions(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin),
):
    """تعديل صلاحيات المستخدم"""
    result = edit_user_permissions(db, current_user.id, user_id, role=role)
    return result


# ============ إدارة البلاغات ============

@router.get("/reports")
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin),
    status: str = Query(None),
    skip: int = Query(0),
    limit: int = Query(50),
):
    """الحصول على البلاغات"""
    reports = get_reports(db, status=status, skip=skip, limit=limit)
    return {"reports": reports}


@router.post("/reports/{report_id}/resolve")
def resolve_report_endpoint(
    report_id: int,
    request: ResolveReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin),
):
    """حل بلاغ"""
    result = resolve_report(
        db,
        current_user.id,
        report_id,
        action=request.action,
        notes=request.notes,
    )
    return result


@router.post("/reports/{report_id}/dismiss")
def dismiss_report_endpoint(
    report_id: int,
    request: DismissReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin),
):
    """رفض بلاغ"""
    result = dismiss_report(db, current_user.id, report_id, reason=request.reason)
    return result


# ============ إدارة المحتوى ============

@router.delete("/posts/{post_id}")
def delete_post_endpoint(
    post_id: int,
    request: DeletePostRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin),
):
    """حذف منشور"""
    result = delete_post(db, current_user.id, post_id, reason=request.reason)
    return result


@router.delete("/comments/{comment_id}")
def delete_comment_endpoint(
    comment_id: int,
    request: DeletePostRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin),
):
    """حذف تعليق"""
    result = delete_comment(db, current_user.id, comment_id, reason=request.reason)
    return result


# ============ الإحصائيات ============

@router.get("/statistics/system")
def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin),
    days: int = Query(7),
):
    """الحصول على إحصائيات النظام"""
    stats = get_system_statistics(db, days=days)
    return {"statistics": stats}


# ============ سجلات التدقيق ============

@router.get("/audit-logs")
def list_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin),
    admin_id: int = Query(None),
    action: str = Query(None),
    skip: int = Query(0),
    limit: int = Query(50),
):
    """الحصول على سجلات التدقيق"""
    logs = get_audit_logs(db, admin_id=admin_id, action=action, skip=skip, limit=limit)
    return {"logs": logs}


# ============ إشعارات الإدارة ============

@router.get("/notifications")
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin),
    unread_only: bool = Query(False),
    skip: int = Query(0),
    limit: int = Query(50),
):
    """الحصول على إشعارات الإدارة"""
    notifications = get_admin_notifications(
        db,
        current_user.id,
        unread_only=unread_only,
        skip=skip,
        limit=limit,
    )
    return {"notifications": notifications}


@router.post("/notifications/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_admin),
):
    """تعليم إشعار كمقروء"""
    result = mark_notification_as_read(db, notification_id)
    return result
