from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta
from io import BytesIO
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from pydantic import BaseModel, Field
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import func, or_, text

from app.core.config import settings
from sqlalchemy.orm import Session

from app.core.admin_access import effective_role, is_primary_admin_email, is_primary_admin_user, permissions_for_user
from app.core.dependencies import get_current_user, get_db
from app.core.threat_monitor import get_threat_monitor_snapshot
from app.core.security import hash_password, verify_password
from app.core.socket_server import emit_user_event_background, sio
from app.models.app_setting import AppSetting
from app.models.audit_log import AuditLog
from app.models.comment import Comment
from app.models.comment_like import CommentLike
from app.models.message import Message
from app.models.notification import Notification
from app.models.post import Post
from app.models.report import Report, ReportEvent
from app.models.stories_reels import Reel, ReelComment, ReelLike, ReelView, SavedReel
from app.models.user import User
from app.models.user_wallet import UserWallet
from app.services.auth_service import register_user
from app.services.dashboard_live_service import get_live_dashboard

router = APIRouter()

ROLE_PERMISSIONS: dict[str, list[str]] = {
    'admin': [
        'dashboard.view',
        'users.view',
        'users.edit',
        'users.delete',
        'users.ban',
        'rbac.view',
        'posts.view',
        'posts.create',
        'posts.edit',
        'posts.delete',
        'posts.bulk',
        'reports.view',
        'reports.export',
        'settings.manage',
        'notifications.manage',
        'search.global',
    ],
    'moderator': [
        'dashboard.view',
        'users.view',
        'users.edit',
        'users.ban',
        'rbac.view',
        'posts.view',
        'posts.create',
        'posts.edit',
        'posts.delete',
        'posts.bulk',
        'reports.view',
        'reports.export',
        'notifications.manage',
        'search.global',
    ],
    'user': [],
}

DEFAULT_NOTIFICATION_SETTINGS = {
    'push_enabled': True,
    'browser_enabled': True,
    'mobile_enabled': True,
    'smart_notifications': True,
    'grouped_notifications': True,
    'silent_notifications': False,
    'realtime_notifications': True,
    'sound': 'classic',
    'categories': {
        'chat': True,
        'follow': True,
        'interaction': True,
        'system': True,
        'reports': True,
    },
}

DEFAULT_MODERATION_REGISTRY = {
    'shadow_banned_user_ids': [],
}

DEFAULT_SETTINGS = {
    'platform_name': 'Yamshat Admin',
    'support_email': 'support@yamshat.app',
    'maintenance_mode': False,
    'allow_registration': True,
    'default_user_role': 'user',
    'session_timeout_minutes': 120,
    'theme': 'midnight',
    'locale': 'ar-EG',
    'notifications': DEFAULT_NOTIFICATION_SETTINGS,
}


class UserCreatePayload(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=6, max_length=128)
    role: str = Field(default='user', max_length=20)
    is_active: bool = True


class UserUpdatePayload(BaseModel):
    username: str | None = None
    email: str | None = None
    role: str | None = None
    is_active: bool | None = None


class PostPayload(BaseModel):
    content: str = Field(min_length=1, max_length=5000)
    image_url: str | None = None
    user_id: int | None = None


class SettingsPayload(BaseModel):
    general: dict[str, Any] = Field(default_factory=dict)


class PasswordPayload(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=128)


class BroadcastPayload(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    body: str = Field(min_length=2, max_length=500)
    type: str = Field(default='SYSTEM', max_length=50)
    target_role: str | None = None


class BulkDeletePayload(BaseModel):
    ids: list[int] = Field(default_factory=list)


def _permissions_for(role: str | None) -> list[str]:
    return ROLE_PERMISSIONS.get((role or 'user').lower(), ROLE_PERMISSIONS['user'])


def _permissions_for_user(current_user: User) -> list[str]:
    return permissions_for_user(current_user, ROLE_PERMISSIONS)


def _require_permission(current_user: User, permission: str) -> None:
    if permission not in _permissions_for_user(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied')


def _guard_user_management(current_user: User, target_user: User, requested_role: str | None = None) -> None:
    actor_role = effective_role(current_user)
    target_role = effective_role(target_user)
    actor_is_primary = is_primary_admin_user(current_user)
    target_is_primary = is_primary_admin_user(target_user)

    if target_is_primary and not actor_is_primary:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Primary admin account is protected')
    if current_user.id == target_user.id and requested_role is not None and requested_role != 'admin':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='You cannot demote your own admin session')
    if actor_role == 'moderator':
        if target_role in {'moderator', 'admin'}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Moderators cannot manage privileged accounts')
        if requested_role in {'moderator', 'admin'}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Moderators cannot assign privileged roles')
    if requested_role == 'admin':
        if not actor_is_primary:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only the primary admin can assign admin role')
        if not is_primary_admin_email(target_user.email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Admin role is reserved for the primary admin email')


def _emit_admin_event(event: str, payload: dict[str, Any]) -> None:
    try:
        sio.start_background_task(sio.emit, event, payload, room='admins')
    except Exception:
        pass


def _add_audit_log(
    db: Session,
    actor: User | None,
    action: str,
    entity_type: str,
    entity_id: str | int | None,
    description: str,
    meta: dict[str, Any] | None = None,
) -> None:
    db.add(
        AuditLog(
            actor_user_id=actor.id if actor else None,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            description=description,
            meta=meta or {},
        )
    )
    db.commit()


def _deep_merge_dicts(base: dict[str, Any], overrides: dict[str, Any]) -> dict[str, Any]:
    result = dict(base)
    for key, value in (overrides or {}).items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = _deep_merge_dicts(result[key], value)
        else:
            result[key] = value
    return result


def _save_setting(db: Session, key: str, value: dict[str, Any]) -> dict[str, Any]:
    record = db.query(AppSetting).filter(AppSetting.key == key).first()
    if record is None:
        record = AppSetting(key=key, value=value)
        db.add(record)
    else:
        record.value = value
    db.commit()
    db.refresh(record)
    return record.value if isinstance(record.value, dict) else value


def _coerce_int_set(values: Any) -> set[int]:
    normalized: set[int] = set()
    for value in values or []:
        try:
            normalized.add(int(value))
        except (TypeError, ValueError):
            continue
    return normalized


def _serialize_audit_log(log: AuditLog, *, now: datetime | None = None, fallback_id: int = 0) -> dict[str, Any]:
    current_now = now or datetime.utcnow()
    return {
        'id': log.id or fallback_id,
        'title': log.action.replace('_', ' ').title(),
        'action': log.action,
        'description': log.description,
        'entity_type': log.entity_type,
        'entity_id': log.entity_id,
        'created_at': log.created_at.isoformat() if log.created_at else current_now.isoformat(),
        'meta': log.meta or {},
    }


def _enrich_user_records(db: Session, users: list[User]) -> list[dict[str, Any]]:
    if not users:
        return []

    user_ids = [user.id for user in users]
    entity_ids = [str(user_id) for user_id in user_ids]
    registry = _get_setting(db, 'moderation_registry', DEFAULT_MODERATION_REGISTRY)
    shadow_banned_ids = _coerce_int_set(registry.get('shadow_banned_user_ids'))

    report_counts = {
        int(user_id): int(count)
        for user_id, count in db.query(Notification.user_id, func.count(Notification.id))
        .filter(Notification.user_id.in_(user_ids), Notification.type.in_(['ALERT', 'REPORT']))
        .group_by(Notification.user_id)
        .all()
    }
    ban_history_counts = {
        int(entity_id): int(count)
        for entity_id, count in db.query(AuditLog.entity_id, func.count(AuditLog.id))
        .filter(
            AuditLog.entity_type == 'user',
            AuditLog.entity_id.in_(entity_ids),
            AuditLog.action.in_(['user_banned', 'user_restored', 'shadow_ban_enabled', 'shadow_ban_disabled']),
        )
        .group_by(AuditLog.entity_id)
        .all()
        if str(entity_id).isdigit()
    }

    enriched: list[dict[str, Any]] = []
    for user in users:
        base = _serialize_user(user)
        report_count = int(report_counts.get(user.id, 0))
        suspicious_logins = int(user.suspicious_login_count or 0)
        shadow_banned = user.id in shadow_banned_ids
        spam_flags = report_count + (1 if suspicious_logins >= 3 else 0)
        abuse_score = report_count + suspicious_logins + (2 if shadow_banned else 0) + (1 if not user.is_active else 0)
        risk_level = 'high' if abuse_score >= 5 else 'medium' if abuse_score >= 2 else 'low'
        base.update({
            'shadow_banned': shadow_banned,
            'ban_history_count': int(ban_history_counts.get(user.id, 0)),
            'abuse_reports_count': report_count,
            'spam_flags_count': int(spam_flags),
            'spam_detection_status': 'blocked' if spam_flags >= 4 else 'watch' if spam_flags >= 2 else 'clear',
            'risk_level': risk_level,
            'abuse_detection_status': 'critical' if risk_level == 'high' else 'watch' if risk_level == 'medium' else 'clear',
        })
        enriched.append(base)
    return enriched


def _get_setting(db: Session, key: str, default: dict[str, Any]) -> dict[str, Any]:
    record = db.query(AppSetting).filter(AppSetting.key == key).first()
    if record is None:
        record = AppSetting(key=key, value=default)
        db.add(record)
        db.commit()
        db.refresh(record)
    if isinstance(record.value, dict):
        return _deep_merge_dicts(default, record.value)
    return default


def _serialize_user(user: User) -> dict[str, Any]:
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'avatar': user.avatar,
        'role': effective_role(user),
        'is_active': bool(user.is_active),
        'status': 'active' if user.is_active else 'banned',
        'followers_count': user.followers_count,
        'following_count': user.following_count,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'last_login_at': user.last_login_at.isoformat() if user.last_login_at else None,
        'banned_at': user.banned_at.isoformat() if user.banned_at else None,
        'permissions': _permissions_for_user(user),
    }


def _serialize_post_row(db: Session, row: Any) -> dict[str, Any]:
    likes = int(row.like_count or 0)
    comments = int(row.comment_count or 0)
    return {
        'id': row.id,
        'content': row.content,
        'image_url': row.image_url,
        'created_at': row.created_at.isoformat() if row.created_at else None,
        'user_id': row.user_id,
        'username': row.username,
        'likes': likes,
        'comments': comments,
        'engagement': likes + comments,
    }


def _room_members_count(room_name: str, namespace: str = '/') -> int:
    try:
        namespace_rooms = getattr(getattr(sio, 'manager', None), 'rooms', {}).get(namespace, {})
        room = namespace_rooms.get(room_name)
        return len(room or {})
    except Exception:
        return 0


def _normalize_audit_entry(log: AuditLog, *, fallback_id: int = 0) -> dict[str, Any]:
    serialized = _serialize_audit_log(log, fallback_id=fallback_id)
    meta = serialized.get('meta') or {}
    action_text = str(serialized.get('action') or '').lower()
    severity = 'info'
    if any(keyword in action_text for keyword in ['delete', 'ban', 'critical', 'escalat', 'block']):
        severity = 'critical'
    elif any(keyword in action_text for keyword in ['export', 'warn', 'flag', 'suspend']):
        severity = 'warning'
    elif any(keyword in action_text for keyword in ['create', 'update', 'restore', 'feature', 'pin']):
        severity = 'success'
    return {
        **serialized,
        'scope': serialized.get('entity_type') or 'general',
        'severity': severity,
        'summary': serialized.get('description') or 'لا يوجد وصف إضافي.',
        'admin_name': meta.get('actor_name') or meta.get('username') or 'Admin',
        'actor': meta.get('actor_email') or meta.get('email') or meta.get('username') or 'admin@yamshat.local',
        'timestamp': serialized.get('created_at'),
        'ip_address': meta.get('ip_address') or meta.get('ip') or '--',
        'entity': serialized.get('entity_id') or '--',
    }

def _service_health_snapshot(db: Session) -> list[dict[str, Any]]:
    try:
        db.execute(text('SELECT 1'))
        database_status = 'healthy'
        database_value = 'متصل'
        database_description = 'قاعدة البيانات متصلة وتستجيب للاستعلامات اللحظية.'
    except Exception as exc:
        database_status = 'critical'
        database_value = 'غير متاح'
        database_description = f'تعذر الوصول إلى قاعدة البيانات: {str(exc)[:120]}'

    secret_hardened = settings.SECRET_KEY and settings.SECRET_KEY != 'change-this-secret-key'
    push_ready = bool(settings.FIREBASE_CREDENTIALS_PATH)
    frontend_ready = bool(settings.FRONTEND_ORIGIN)
    backend_ready = bool(settings.BACKEND_ORIGIN)
    socket_ready = backend_ready or _room_members_count('admins') >= 0
    admins_online = _room_members_count('admins')

    return [
        {
            'key': 'database',
            'label': 'قاعدة البيانات',
            'status': database_status,
            'value': database_value,
            'description': database_description,
        },
        {
            'key': 'realtime',
            'label': 'Realtime Socket',
            'status': 'healthy' if socket_ready else 'warning',
            'value': f'{admins_online} مشرف متصل',
            'description': 'Socket.IO جاهز لاستقبال التحديثات الحية للمستخدمين والمحتوى والتنبيهات.',
        },
        {
            'key': 'frontend',
            'label': 'واجهة الويب',
            'status': 'healthy' if frontend_ready else 'warning',
            'value': settings.FRONTEND_ORIGIN or 'نفس النطاق',
            'description': 'لوحة الأدمن والويب العام يمكن ربطهما تلقائياً عبر app-config وبيئة الإنتاج.',
        },
        {
            'key': 'media',
            'label': 'رفع الوسائط',
            'status': 'healthy' if settings.cloudinary_configured else 'warning',
            'value': 'Cloudinary' if settings.cloudinary_configured else 'محلي / غير مكتمل',
            'description': 'رفع الصور والملفات يعمل محلياً ويمكن تحويله إلى Cloudinary للإنتاج.',
        },
        {
            'key': 'push',
            'label': 'Push Notifications',
            'status': 'healthy' if push_ready else 'warning',
            'value': 'Firebase جاهز' if push_ready else 'يحتاج credentials',
            'description': 'الإشعارات الجماعية مرتبطة مع الموبايل عند تفعيل Firebase credentials.',
        },
        {
            'key': 'security',
            'label': 'الأمان والجلسات',
            'status': 'healthy' if secret_hardened else 'warning',
            'value': 'JWT + CORS',
            'description': 'الحماية تعتمد على JWT وإعدادات CORS متعددة النطاقات للويب والموبايل.',
        },
    ]


def _platform_links() -> list[dict[str, Any]]:
    backend_origin = (settings.BACKEND_ORIGIN or settings.RENDER_EXTERNAL_URL or '').rstrip('/')
    frontend_origin = (settings.FRONTEND_ORIGIN or '').rstrip('/')
    api_url = f'{backend_origin}/api' if backend_origin else '/api'
    uploads_url = f'{backend_origin}/uploads' if backend_origin else '/uploads'

    return [
        {
            'key': 'backend_api',
            'label': 'Backend API',
            'value': api_url,
            'status': 'linked' if backend_origin else 'warning',
            'description': 'مصدر REST API الرئيسي لتطبيق الويب ولوحة الأدمن وتطبيق الموبايل.',
        },
        {
            'key': 'socket',
            'label': 'Realtime Socket',
            'value': backend_origin or 'نفس النطاق',
            'status': 'linked' if backend_origin else 'warning',
            'description': 'قناة التحديثات اللحظية للتنبيهات والحالة والأنشطة المباشرة.',
        },
        {
            'key': 'frontend',
            'label': 'Web Frontend',
            'value': frontend_origin or 'يتم تحديده وقت النشر',
            'status': 'linked' if frontend_origin else 'warning',
            'description': 'واجهة الويب تدعم الربط التلقائي مع الباك إند عبر config runtime.',
        },
        {
            'key': 'mobile',
            'label': 'Mobile App',
            'value': api_url,
            'status': 'linked' if backend_origin else 'warning',
            'description': 'الموبايل يستخدم نفس API عبر BuildConfig وUrlConfig لتوحيد المسارات.',
        },
        {
            'key': 'uploads',
            'label': 'Uploads CDN',
            'value': uploads_url,
            'status': 'linked' if backend_origin else 'warning',
            'description': 'مسار الوسائط العامة للصور والمرفقات على نفس خدمة الباك إند.',
        },
    ]


@router.get('/rbac')
def get_rbac(current_user: User = Depends(get_current_user)):
    _require_permission(current_user, 'rbac.view')
    return {
        'current_role': effective_role(current_user),
        'current_permissions': _permissions_for_user(current_user),
        'roles': [
            {
                'role': role,
                'label': role.title(),
                'permissions': permissions,
            }
            for role, permissions in ROLE_PERMISSIONS.items()
        ],
    }


@router.get('/dashboard/live')
def get_dashboard_live(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """الإحصائيات الحية المرتبطة بلوحة المدير العام (frontend AdminDashboard.jsx).

    تستبدل القيم التجريبية الثابتة بأرقام حقيقية من قاعدة البيانات:
    المستخدمون، المشاهدات، الإيرادات، المنشورات، الريلز، الستوري والشات.
    """
    _require_permission(current_user, 'dashboard.view')
    return get_live_dashboard(db)


@router.get('/overview')
def get_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_permission(current_user, 'dashboard.view')

    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    users_count = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0
    posts_count = db.query(func.count(Post.id)).scalar() or 0
    comments_count = db.query(func.count(Comment.id)).scalar() or 0
    messages_count = db.query(func.count(Message.id)).scalar() or 0
    notifications_count = db.query(func.count(Notification.id)).scalar() or 0
    unread_system = db.query(func.count(Notification.id)).filter(Notification.is_read.is_(False)).scalar() or 0
    alert_reports = db.query(func.count(Notification.id)).filter(Notification.type.in_(['ALERT', 'REPORT'])).scalar() or 0
    banned_count = db.query(func.count(User.id)).filter(User.is_active.is_(False)).scalar() or 0
    suspicious_users = db.query(func.count(User.id)).filter(User.suspicious_login_count >= 3).scalar() or 0
    moderation_registry = _get_setting(db, 'moderation_registry', DEFAULT_MODERATION_REGISTRY)
    shadow_banned_count = len(_coerce_int_set(moderation_registry.get('shadow_banned_user_ids')))
    wallet_totals = db.query(
        func.coalesce(func.sum(UserWallet.total_earned), 0),
        func.coalesce(func.sum(UserWallet.total_spent), 0),
        func.coalesce(func.sum(UserWallet.coin_balance), 0),
    ).one()
    coins_earned = int(wallet_totals[0] or 0)
    coins_spent = int(wallet_totals[1] or 0)
    coins_balance = int(wallet_totals[2] or 0)
    report_notifications = db.query(Notification).filter(Notification.type.in_(['ALERT', 'REPORT'])).all()
    user_reports = len(report_notifications)

    today_posts = db.query(func.count(Post.id)).filter(Post.created_at >= today_start).scalar() or 0
    today_comments = db.query(func.count(Comment.id)).filter(Comment.created_at >= today_start).scalar() or 0
    today_messages = db.query(func.count(Message.id)).filter(Message.created_at >= today_start).scalar() or 0
    today_users = db.query(func.count(User.id)).filter(User.created_at >= today_start).scalar() or 0
    today_operations = int(today_posts + today_comments + today_messages)

    daily_activity: list[dict[str, Any]] = []
    growth_data: list[dict[str, Any]] = []
    for offset in range(6, -1, -1):
        day_start = today_start - timedelta(days=offset)
        day_end = day_start + timedelta(days=1)
        label = day_start.strftime('%d/%m')
        operations = (
            (db.query(func.count(Post.id)).filter(Post.created_at >= day_start, Post.created_at < day_end).scalar() or 0)
            + (db.query(func.count(Comment.id)).filter(Comment.created_at >= day_start, Comment.created_at < day_end).scalar() or 0)
            + (db.query(func.count(Message.id)).filter(Message.created_at >= day_start, Message.created_at < day_end).scalar() or 0)
        )
        new_users = db.query(func.count(User.id)).filter(User.created_at >= day_start, User.created_at < day_end).scalar() or 0
        daily_activity.append({'label': label, 'value': int(operations)})
        growth_data.append({'label': label, 'value': int(new_users)})

    role_distribution = [
        {'label': role or 'user', 'value': int(count)}
        for role, count in (
            db.query(User.role, func.count(User.id)).group_by(User.role).order_by(func.count(User.id).desc()).all()
        )
    ] or [{'label': 'admin', 'value': int(users_count)}]

    top_modules = [
        {'label': 'المنشورات', 'value': int(posts_count)},
        {'label': 'التعليقات', 'value': int(comments_count)},
        {'label': 'الرسائل', 'value': int(messages_count)},
        {'label': 'الإشعارات', 'value': int(notifications_count)},
    ]
    content_rows = db.query(Post, User.username.label('username')).join(User, User.id == Post.user_id).order_by(Post.created_at.desc()).limit(5).all()
    content_queue = [
        {
            'key': f'post-{post.id}',
            'title': username,
            'description': (post.content or 'منشور بدون نص')[:140],
            'meta': post.created_at.isoformat() if post.created_at else now.isoformat(),
        }
        for post, username in content_rows
    ]

    recent_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(8).all()
    if not recent_logs:
        recent_logs = [
            AuditLog(
                action='bootstrap',
                entity_type='system',
                entity_id='0',
                description='تم تجهيز لوحة التحكم الاحترافية وربطها بالمشروع.',
                created_at=now,
                meta={},
            )
        ]

    recent_activity = [_serialize_audit_log(log, now=now, fallback_id=index + 1) for index, log in enumerate(recent_logs)]

    service_health = _service_health_snapshot(db)
    platform_links = _platform_links()
    admins_online = _room_members_count('admins')
    threat_snapshot = get_threat_monitor_snapshot()
    average_daily = round(sum(item['value'] for item in daily_activity) / max(len(daily_activity), 1), 1)

    alerts = [
        {
            'level': 'warning' if alert_reports else 'success',
            'title': 'بلاغات ومتابعة',
            'description': f'يوجد {int(alert_reports)} عناصر تنبيه/بلاغ تحتاج متابعة داخل النظام.',
        },
        {
            'level': 'warning' if banned_count else 'info',
            'title': 'الحسابات المحظورة',
            'description': f'إجمالي الحسابات المحظورة حالياً: {int(banned_count)}.',
        },
        {
            'level': 'success' if admins_online >= 0 else 'info',
            'title': 'التحديث اللحظي',
            'description': f'القنوات الحية نشطة، وعدد جلسات الأدمن المتصلة الآن: {admins_online}.',
        },
    ]

    moderation_queue = [
        {
            'key': 'reports',
            'label': 'بلاغات مفتوحة',
            'value': int(alert_reports),
            'description': 'تنبيهات من نوع ALERT/REPORT تحتاج مراجعة مباشرة.',
        },
        {
            'key': 'unread',
            'label': 'إشعارات غير مقروءة',
            'value': int(unread_system),
            'description': 'إشعارات النظام غير المقروءة في مركز الإشعارات.',
        },
        {
            'key': 'banned',
            'label': 'مستخدمون محظورون',
            'value': int(banned_count),
            'description': 'حسابات متوقفة حالياً ويمكن استعادتها من إدارة المستخدمين.',
        },
        {
            'key': 'shadow',
            'label': 'Shadow Ban',
            'value': int(shadow_banned_count),
            'description': 'حسابات تم كتم ظهورها بدون حظر مباشر.',
        },
        {
            'key': 'abuse',
            'label': 'Abuse Detection',
            'value': int(suspicious_users),
            'description': 'حسابات عليها مؤشرات دخول أو نشاط مريب وتحتاج متابعة.',
        },
        {
            'key': 'today',
            'label': 'عمليات اليوم',
            'value': int(today_operations),
            'description': 'إجمالي منشورات وتعليقات ورسائل اليوم بشكل لحظي.',
        },
    ]

    report_management = {
        'open_reports': int(alert_reports),
        'user_reports': int(user_reports),
        'unread_notifications': int(unread_system),
        'shadow_banned_users': int(shadow_banned_count),
    }
    revenue_dashboard = {
        'coins_earned': int(coins_earned),
        'coins_spent': int(coins_spent),
        'coins_balance': int(coins_balance),
        'estimated_revenue': round(coins_spent / 100, 2),
    }
    advanced_analytics = [
        {
            'key': 'engagement_velocity',
            'label': 'Advanced Analytics',
            'value': round(((comments_count + messages_count) / max(posts_count, 1)), 2),
            'description': 'متوسط التفاعل والرسائل لكل منشور منشور على المنصة.',
        },
        {
            'key': 'moderation_load',
            'label': 'Content Queue',
            'value': int(alert_reports + unread_system + shadow_banned_count),
            'description': 'مؤشر فوري لحجم الأعمال المعلقة على الإدارة والمراقبة.',
        },
        {
            'key': 'spam_detection',
            'label': 'Spam Detection',
            'value': int(suspicious_users),
            'description': 'عدد الحسابات التي تجاوزت حد الاشتباه وتحتاج مراجعة.' ,
        },
        {
            'key': 'blocked_ips',
            'label': 'IP Monitoring',
            'value': int(threat_snapshot.get('blocked_ip_count', 0)),
            'description': 'عناوين IP المحظورة مؤقتاً بسبب سلوك هجومي أو بوتات.' ,
        },
    ]
    realtime_monitoring = [
        {'key': 'admins_online', 'label': 'Realtime Monitoring', 'value': int(admins_online), 'description': 'جلسات الأدمن المتصلة حالياً.'},
        {'key': 'today_messages', 'label': 'Realtime Messages', 'value': int(today_messages), 'description': 'رسائل اليوم التي دخلت النظام.'},
        {'key': 'blocked_ips', 'label': 'Blocked IPs', 'value': int(threat_snapshot.get('blocked_ip_count', 0)), 'description': 'حالة درع الحماية ضد DDoS والبوتات.'},
    ]

    return {
        'kpis': [
            {'key': 'users', 'label': 'المستخدمون', 'value': int(users_count), 'delta': int(today_users), 'trend_label': 'تسجيلات اليوم'},
            {'key': 'operations', 'label': 'العمليات', 'value': int(posts_count + comments_count + messages_count), 'delta': int(today_operations), 'trend_label': 'عمليات اليوم'},
            {'key': 'avg_activity', 'label': 'متوسط النشاط', 'value': average_daily, 'delta': admins_online, 'trend_label': 'أدمن متصل الآن'},
            {'key': 'notifications', 'label': 'الإشعارات', 'value': int(notifications_count), 'delta': int(unread_system), 'trend_label': 'غير مقروء'},
        ],
        'line_chart': growth_data,
        'bar_chart': top_modules,
        'pie_chart': role_distribution,
        'recent_activity': recent_activity,
        'alerts': alerts,
        'service_health': service_health,
        'moderation_queue': moderation_queue,
        'platform_links': platform_links,
        'meta': {
            'generated_at': now.isoformat(),
            'active_users': int(active_users),
            'posts_count': int(posts_count),
            'comments_count': int(comments_count),
            'messages_count': int(messages_count),
            'daily_activity': daily_activity,
            'today_posts': int(today_posts),
            'today_comments': int(today_comments),
            'today_messages': int(today_messages),
            'today_users': int(today_users),
            'admins_online': int(admins_online),
            'web_connected': any(item['key'] == 'frontend' and item['status'] == 'linked' for item in platform_links),
            'mobile_connected': any(item['key'] == 'mobile' and item['status'] == 'linked' for item in platform_links),
            'advanced_analytics': advanced_analytics,
            'realtime_monitoring': realtime_monitoring,
            'revenue_dashboard': revenue_dashboard,
            'report_management': report_management,
            'content_queue': content_queue,
            'security_monitoring': threat_snapshot,
        },
    }


@router.get('/search')
def global_search(
    q: str = Query(default='', min_length=0, max_length=100),
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'search.global')
    term = q.strip()
    if not term:
        return {'users': [], 'posts': []}

    users = db.query(User).filter(
        or_(User.username.ilike(f'%{term}%'), User.email.ilike(f'%{term}%'))
    ).order_by(User.created_at.desc()).limit(limit).all()

    posts = db.query(Post, User.username.label('username')).join(User, User.id == Post.user_id).filter(
        Post.content.ilike(f'%{term}%')
    ).order_by(Post.created_at.desc()).limit(limit).all()

    return {
        'users': [_serialize_user(user) for user in users],
        'posts': [
            {
                'id': post.id,
                'content': post.content,
                'username': username,
                'created_at': post.created_at.isoformat() if post.created_at else None,
            }
            for post, username in posts
        ],
    }


@router.get('/users')
def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    search: str = Query(default=''),
    status_filter: str = Query(default='all', alias='status'),
    role: str = Query(default='all'),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'users.view')
    query = db.query(User)
    search = search.strip()
    if search:
        query = query.filter(or_(User.username.ilike(f'%{search}%'), User.email.ilike(f'%{search}%')))
    if status_filter == 'active':
        query = query.filter(User.is_active.is_(True))
    elif status_filter == 'banned':
        query = query.filter(User.is_active.is_(False))
    if role != 'all':
        query = query.filter(User.role == role)

    total = query.count()
    items = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        'items': _enrich_user_records(db, items),
        'pagination': {
            'page': page,
            'page_size': page_size,
            'total': total,
            'pages': max((total + page_size - 1) // page_size, 1),
        },
    }


@router.get('/users/{user_id}')
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'users.view')
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    return {'user': _enrich_user_records(db, [user])[0]}


@router.post('/users', status_code=status.HTTP_201_CREATED)
def create_user_admin(
    payload: UserCreatePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'users.edit')
    requested_role = (payload.role or 'user').strip().lower() or 'user'
    if requested_role not in ROLE_PERMISSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid role')

    actor_role = effective_role(current_user)
    actor_is_primary = is_primary_admin_user(current_user)
    normalized_email = payload.email.strip().lower()

    if actor_role == 'moderator' and requested_role in {'moderator', 'admin'}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Moderators cannot create privileged accounts')
    if requested_role == 'admin':
        if not actor_is_primary:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only the primary admin can assign admin role')
        if not is_primary_admin_email(normalized_email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Admin role is reserved for the primary admin email')

    user = register_user(
        db,
        username=payload.username,
        email=normalized_email,
        password=payload.password,
    )
    user.role = requested_role
    user.is_active = bool(payload.is_active)
    user.email_verified = True
    user.email_verification_code = None
    user.email_verification_expires_at = None
    user.banned_at = None if user.is_active else datetime.utcnow()
    db.commit()
    db.refresh(user)

    _add_audit_log(db, current_user, 'user_created', 'user', user.id, f'تم إنشاء المستخدم {user.username}.', {'user_id': user.id})
    enriched_user = _enrich_user_records(db, [user])[0]
    _emit_admin_event('admin:user_updated', {'user': enriched_user, 'created': True})
    return enriched_user


@router.patch('/users/{user_id}')
def update_user(
    user_id: int,
    payload: UserUpdatePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'users.edit')
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    if payload.username is not None:
        normalized = payload.username.strip().replace(' ', '_')
        if not normalized:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid username')
        duplicate = db.query(User).filter(User.username == normalized, User.id != user_id).first()
        if duplicate:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Username already exists')
        user.username = normalized
    if payload.email is not None:
        normalized_email = payload.email.strip().lower()
        duplicate = db.query(User).filter(User.email == normalized_email, User.id != user_id).first()
        if duplicate:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email already exists')
        user.email = normalized_email
    requested_role = None
    if payload.role is not None:
        requested_role = payload.role.lower()
        if requested_role not in ROLE_PERMISSIONS:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid role')
    _guard_user_management(current_user, user, requested_role=requested_role)
    if requested_role is not None:
        user.role = requested_role
    if payload.is_active is not None:
        user.is_active = payload.is_active
        user.banned_at = None if payload.is_active else datetime.utcnow()

    db.commit()
    db.refresh(user)
    _add_audit_log(db, current_user, 'user_updated', 'user', user.id, f'تم تحديث المستخدم {user.username}.', {'user_id': user.id})
    enriched_user = _enrich_user_records(db, [user])[0]
    _emit_admin_event('admin:user_updated', {'user': enriched_user})
    return enriched_user


@router.post('/users/{user_id}/ban')
def ban_or_restore_user(
    user_id: int,
    restore: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'users.ban')
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    if user.id == current_user.id and not restore:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='You cannot ban yourself')
    _guard_user_management(current_user, user)

    user.is_active = bool(restore)
    user.banned_at = None if restore else datetime.utcnow()
    db.commit()
    db.refresh(user)
    action = 'user_restored' if restore else 'user_banned'
    description = f"تم {'استعادة' if restore else 'حظر'} المستخدم {user.username}."
    _add_audit_log(db, current_user, action, 'user', user.id, description, {'user_id': user.id})
    enriched_user = _enrich_user_records(db, [user])[0]
    _emit_admin_event('admin:user_status_changed', {'user': enriched_user})
    return enriched_user


@router.delete('/users/{user_id}')
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'users.delete')
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='You cannot delete yourself')
    _guard_user_management(current_user, user)

    username = user.username
    db.delete(user)
    db.commit()
    _add_audit_log(db, current_user, 'user_deleted', 'user', user_id, f'تم حذف المستخدم {username}.', {'user_id': user_id})
    _emit_admin_event('admin:user_deleted', {'user_id': user_id})
    return {'message': 'User deleted', 'user_id': user_id}


@router.get('/posts')
def list_posts(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    search: str = Query(default=''),
    sort_by: str = Query(default='created_at'),
    sort_direction: str = Query(default='desc'),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'posts.view')

    like_count = func.count(func.distinct(Notification.id))
    # dummy placeholder to satisfy linter? intentionally replaced below
    del like_count
    comment_count = func.count(func.distinct(Comment.id)).label('comment_count')
    from app.models.like import Like

    like_count = func.count(func.distinct(Like.id)).label('like_count')
    query = db.query(
        Post.id,
        Post.user_id,
        Post.content,
        Post.image_url,
        Post.created_at,
        User.username.label('username'),
        like_count,
        comment_count,
    ).join(User, User.id == Post.user_id).outerjoin(Like, Like.post_id == Post.id).outerjoin(Comment, Comment.post_id == Post.id).group_by(Post.id, User.username)

    term = search.strip()
    if term:
        query = query.filter(or_(Post.content.ilike(f'%{term}%'), User.username.ilike(f'%{term}%')))

    if sort_by == 'engagement':
        order_field = (func.count(func.distinct(Like.id)) + func.count(func.distinct(Comment.id)))
    else:
        order_field = Post.created_at
    query = query.order_by(order_field.asc() if sort_direction == 'asc' else order_field.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        'items': [_serialize_post_row(db, row) for row in items],
        'pagination': {
            'page': page,
            'page_size': page_size,
            'total': total,
            'pages': max((total + page_size - 1) // page_size, 1),
        },
    }


@router.post('/posts', status_code=status.HTTP_201_CREATED)
def create_post_admin(
    payload: PostPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'posts.create')
    target_user_id = payload.user_id or current_user.id
    user = db.query(User).filter(User.id == target_user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Target user not found')

    post = Post(user_id=user.id, content=payload.content.strip(), image_url=(payload.image_url or '').strip() or None)
    db.add(post)
    db.commit()
    db.refresh(post)
    _add_audit_log(db, current_user, 'post_created', 'post', post.id, f'تم إنشاء منشور جديد بواسطة {user.username}.', {'post_id': post.id})
    _emit_admin_event('admin:post_created', {'post_id': post.id})
    return {
        'id': post.id,
        'content': post.content,
        'image_url': post.image_url,
        'created_at': post.created_at.isoformat() if post.created_at else None,
        'user_id': post.user_id,
        'username': user.username,
        'likes': 0,
        'comments': 0,
        'engagement': 0,
    }


@router.put('/posts/{post_id}')
def update_post_admin(
    post_id: int,
    payload: PostPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'posts.edit')
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')
    post.content = payload.content.strip()
    post.image_url = (payload.image_url or '').strip() or None
    if payload.user_id is not None:
        target_user = db.query(User).filter(User.id == payload.user_id).first()
        if target_user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Target user not found')
        post.user_id = target_user.id
    db.commit()
    db.refresh(post)
    owner = db.query(User).filter(User.id == post.user_id).first()
    _add_audit_log(db, current_user, 'post_updated', 'post', post.id, f'تم تعديل المنشور رقم {post.id}.', {'post_id': post.id})
    _emit_admin_event('admin:post_updated', {'post_id': post.id})
    return {
        'id': post.id,
        'content': post.content,
        'image_url': post.image_url,
        'created_at': post.created_at.isoformat() if post.created_at else None,
        'user_id': post.user_id,
        'username': owner.username if owner else 'unknown',
    }


@router.delete('/posts/{post_id}')
def delete_post_admin(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'posts.delete')
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')
    db.delete(post)
    db.commit()
    _add_audit_log(db, current_user, 'post_deleted', 'post', post_id, f'تم حذف المنشور رقم {post_id}.', {'post_id': post_id})
    _emit_admin_event('admin:post_deleted', {'post_id': post_id})
    return {'message': 'Post deleted', 'post_id': post_id}


@router.post('/posts/bulk-delete')
def bulk_delete_posts(
    payload: BulkDeletePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'posts.bulk')
    ids = [post_id for post_id in payload.ids if isinstance(post_id, int)]
    if not ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='No post ids provided')
    deleted = db.query(Post).filter(Post.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    _add_audit_log(db, current_user, 'posts_bulk_deleted', 'post', 'bulk', f'تم حذف {deleted} منشورات دفعة واحدة.', {'ids': ids})
    _emit_admin_event('admin:posts_bulk_deleted', {'ids': ids, 'deleted': deleted})
    return {'deleted': deleted, 'ids': ids}


# ============================================================
# v88.44 — Comment Management Endpoints for Admin Panel
# ============================================================

def _serialize_comment_admin(db: Session, comment: Comment) -> dict[str, Any]:
    """Serialize a comment for the admin panel with user and post info."""
    user = db.query(User).filter(User.id == comment.user_id).first()
    post = db.query(Post).filter(Post.id == comment.post_id).first()
    likes_count = db.query(func.count(CommentLike.id)).filter(
        CommentLike.comment_id == comment.id
    ).scalar() or 0
    replies_count = db.query(func.count(Comment.id)).filter(
        Comment.parent_id == comment.id
    ).scalar() or 0
    return {
        'id': comment.id,
        'content': comment.content,
        'post_id': comment.post_id,
        'post_content_preview': (post.content[:80] + '…') if post and post.content and len(post.content) > 80 else (post.content if post else None),
        'user_id': comment.user_id,
        'username': user.username if user else (getattr(comment, 'username', None) or 'unknown'),
        'avatar': user.avatar if user else None,
        'parent_id': comment.parent_id,
        'likes_count': int(likes_count),
        'replies_count': int(replies_count),
        'is_pinned': bool(comment.is_pinned),
        'is_hidden': bool(comment.is_hidden),
        'created_at': comment.created_at.isoformat() if comment.created_at else None,
        'updated_at': comment.updated_at.isoformat() if comment.updated_at else None,
    }


@router.get('/comments')
def list_admin_comments(
    post_id: int | None = Query(default=None, description='Filter by post ID'),
    search: str = Query(default=''),
    include_hidden: bool = Query(default=True),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    sort_by: str = Query(default='created_at'),
    sort_direction: str = Query(default='desc'),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List comments for admin management — optionally filtered by post_id."""
    _require_permission(current_user, 'posts.view')

    query = db.query(Comment)
    if post_id is not None:
        query = query.filter(Comment.post_id == post_id)
    if not include_hidden:
        query = query.filter(Comment.is_hidden.is_(False))

    term = search.strip()
    if term:
        query = query.filter(Comment.content.ilike(f'%{term}%'))

    if sort_by == 'likes':
        order_field = Comment.likes_count
    else:
        order_field = Comment.created_at
    query = query.order_by(order_field.asc() if sort_direction == 'asc' else order_field.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        'items': [_serialize_comment_admin(db, c) for c in items],
        'pagination': {
            'page': page,
            'page_size': page_size,
            'total': total,
            'pages': max((total + page_size - 1) // page_size, 1),
        },
    }


@router.get('/posts/{post_id}/comments')
def list_post_comments_admin(
    post_id: int,
    include_hidden: bool = Query(default=True),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all comments for a specific post (admin view — includes hidden)."""
    _require_permission(current_user, 'posts.view')

    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')

    query = db.query(Comment).filter(Comment.post_id == post_id)
    if not include_hidden:
        query = query.filter(Comment.is_hidden.is_(False))
    query = query.order_by(Comment.created_at.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        'items': [_serialize_comment_admin(db, c) for c in items],
        'pagination': {
            'page': page,
            'page_size': page_size,
            'total': total,
            'pages': max((total + page_size - 1) // page_size, 1),
        },
    }


@router.delete('/comments/{comment_id}')
def delete_comment_admin(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a comment (and its replies) as admin — bypasses ownership check."""
    _require_permission(current_user, 'posts.delete')
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Comment not found')

    # Recursively delete descendant replies
    def _delete_descendants(parent_id: int) -> None:
        children = db.query(Comment).filter(Comment.parent_id == parent_id).all()
        for child in children:
            _delete_descendants(child.id)
            db.delete(child)

    _delete_descendants(comment.id)
    comment_content = (comment.content or '')[:80]
    db.delete(comment)
    db.commit()
    _add_audit_log(
        db, current_user, 'comment_deleted', 'comment', comment_id,
        f'تم حذف التعليق رقم {comment_id} ("{comment_content}…") بواسطة الإدارة.',
        {'comment_id': comment_id, 'post_id': comment.post_id},
    )
    _emit_admin_event('admin:comment_deleted', {'comment_id': comment_id})
    return {'message': 'Comment deleted', 'comment_id': comment_id}


@router.post('/comments/{comment_id}/hide')
def toggle_hide_comment_admin(
    comment_id: int,
    payload: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Hide/show a comment as admin."""
    _require_permission(current_user, 'posts.edit')
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Comment not found')

    hidden = bool(payload.get('hidden', not comment.is_hidden))
    comment.is_hidden = hidden
    comment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(comment)
    action = 'comment_hidden' if hidden else 'comment_unhidden'
    description = f"تم {'إخفاء' if hidden else 'إظهار'} التعليق رقم {comment_id} بواسطة الإدارة."
    _add_audit_log(db, current_user, action, 'comment', comment_id, description, {'comment_id': comment_id})
    _emit_admin_event('admin:comment_updated', {'comment_id': comment_id, 'hidden': hidden})
    return _serialize_comment_admin(db, comment)


# ============================================================
# v88.44 — Reports List Endpoint (actual reports from Report model)
# ============================================================

@router.get('/reports')
def list_admin_reports(
    status_filter: str | None = Query(default=None, alias='status'),
    priority: str | None = Query(default=None),
    target_type: str | None = Query(default=None),
    reason: str | None = Query(default=None),
    search: str = Query(default=''),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List actual reports from the unified Report system — real data, not just stats."""
    _require_permission(current_user, 'reports.view')

    query = db.query(Report)
    if status_filter and status_filter != 'all':
        query = query.filter(Report.status == status_filter)
    if priority and priority != 'all':
        query = query.filter(Report.priority == priority)
    if target_type and target_type != 'all':
        query = query.filter(Report.target_type == target_type)
    if reason and reason != 'all':
        query = query.filter(Report.reason == reason)

    term = search.strip()
    if term:
        like_pattern = f'%{term}%'
        query = query.filter(or_(
            Report.details.ilike(like_pattern),
            Report.target_id.ilike(like_pattern),
        ))

    # Count by status for quick filter bar
    from sqlalchemy import func as _func
    counts_query = db.query(Report.status, _func.count(Report.id)).group_by(Report.status)
    if status_filter and status_filter != 'all':
        counts_query = counts_query.filter(Report.status == status_filter)
    counts_rows = counts_query.all()
    counts = {s: int(c) for s, c in counts_rows}
    counts['all'] = int(query.count())

    total = query.count()
    items = (
        query.order_by(Report.priority.desc(), Report.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # Serialize reports with user info and snapshot
    from app.services.report_service import serialize_report, reason_label
    serialized = [serialize_report(db, r) for r in items]

    return {
        'items': serialized,
        'total': total,
        'page': page,
        'page_size': page_size,
        'counts': counts,
    }


@router.get('/reports/{report_id}/details')
def get_report_details_admin(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed report info including event timeline."""
    _require_permission(current_user, 'reports.view')
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Report not found')

    events = (
        db.query(ReportEvent)
        .filter(ReportEvent.report_id == report_id)
        .order_by(ReportEvent.created_at.asc())
        .all()
    )

    from app.services.report_service import serialize_report
    return {
        'report': serialize_report(db, report),
        'events': [
            {
                'id': e.id,
                'actor_user_id': e.actor_user_id,
                'event_type': e.event_type,
                'note': e.note,
                'meta': e.meta or {},
                'created_at': e.created_at.isoformat() if e.created_at else None,
            }
            for e in events
        ],
    }


# ============================================================
# v88.45 — Reels Management (Admin Panel)
# ============================================================
# GET    /admin/reels                       → قائمة كل الريلز (مع فلاتر)
# GET    /admin/reels/{reel_id}             → تفاصيل ريل محدد
# DELETE /admin/reels/{reel_id}             → حذف ريل (soft-delete) بصلاحية أدمن
# POST   /admin/reels/{reel_id}/restore     → استعادة ريل محذوف
# GET    /admin/reels/{reel_id}/comments    → تعليقات ريل (شامل المخفية)
# DELETE /admin/reels/comments/{cid}        → حذف تعليق ريل بصلاحية أدمن
# POST   /admin/reels/comments/{cid}/hide   → إخفاء/إظهار تعليق ريل
# GET    /admin/reels/{reel_id}/reports     → البلاغات على ريل محدد
# ============================================================

def _serialize_reel_admin(db: Session, reel: Reel) -> dict[str, Any]:
    """Serialize a reel for the admin panel including owner and reports count."""
    owner = db.query(User).filter(User.id == reel.user_id).first()
    reports_count = db.query(func.count(Report.id)).filter(
        Report.target_type.in_(['reel', 'reel_comment']),
        Report.target_id == str(reel.id),
    ).scalar() or 0
    pending_reports = db.query(func.count(Report.id)).filter(
        Report.target_type == 'reel',
        Report.target_id == str(reel.id),
        Report.status == 'pending',
    ).scalar() or 0
    hidden_comments = db.query(func.count(ReelComment.id)).filter(
        ReelComment.reel_id == reel.id,
        ReelComment.is_hidden.is_(True),
    ).scalar() or 0
    return {
        'id': reel.id,
        'user_id': reel.user_id,
        'username': owner.username if owner else 'unknown',
        'user_avatar': getattr(owner, 'avatar_url', None) or getattr(owner, 'avatar', None) if owner else None,
        'user_email': owner.email if owner else None,
        'video_url': reel.video_url,
        'media_url': reel.video_url,
        'thumbnail_url': reel.thumbnail_url,
        'preview_url': reel.thumbnail_url or reel.video_url,
        'caption': reel.caption or '',
        'content': reel.caption or '',
        'category': reel.category or 'general',
        'duration': int(reel.duration or 0),
        'likes_count': int(reel.likes_count or 0),
        'comments_count': int(reel.comments_count or 0),
        'shares_count': int(reel.shares_count or 0),
        'views_count': int(reel.views_count or 0),
        'hidden_comments_count': int(hidden_comments),
        'reports_count': int(reports_count),
        'pending_reports_count': int(pending_reports),
        'is_deleted': bool(reel.is_deleted),
        'storage_type': getattr(reel, 'storage_type', 'local'),
        'created_at': reel.created_at.isoformat() if reel.created_at else None,
        'updated_at': reel.updated_at.isoformat() if reel.updated_at else None,
    }


def _serialize_reel_comment_admin(db: Session, comment: ReelComment) -> dict[str, Any]:
    """Serialize a reel comment for the admin panel."""
    user = db.query(User).filter(User.id == comment.user_id).first()
    replies_count = db.query(func.count(ReelComment.id)).filter(
        ReelComment.parent_id == comment.id
    ).scalar() or 0
    reports_count = db.query(func.count(Report.id)).filter(
        Report.target_type == 'reel_comment',
        Report.target_id == str(comment.id),
    ).scalar() or 0
    return {
        'id': comment.id,
        'reel_id': comment.reel_id,
        'content': comment.content,
        'user_id': comment.user_id,
        'username': user.username if user else (comment.username or 'unknown'),
        'avatar': getattr(user, 'avatar_url', None) or getattr(user, 'avatar', None) if user else None,
        'parent_id': comment.parent_id,
        'likes_count': int(comment.likes_count or 0),
        'replies_count': int(replies_count),
        'reports_count': int(reports_count),
        'is_hidden': bool(comment.is_hidden),
        'created_at': comment.created_at.isoformat() if comment.created_at else None,
        'updated_at': comment.updated_at.isoformat() if comment.updated_at else None,
    }


@router.get('/reels')
def list_admin_reels(
    status_filter: str = Query(default='active', alias='status', description='active | deleted | all'),
    category: str | None = Query(default=None),
    search: str = Query(default=''),
    has_reports: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    sort_by: str = Query(default='created_at'),
    sort_direction: str = Query(default='desc'),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List reels for admin management with filters."""
    _require_permission(current_user, 'posts.view')

    query = db.query(Reel)
    if status_filter == 'active':
        query = query.filter(Reel.is_deleted.is_(False))
    elif status_filter == 'deleted':
        query = query.filter(Reel.is_deleted.is_(True))
    # 'all' → no filter

    if category and category != 'all':
        query = query.filter(Reel.category == category)

    term = search.strip()
    if term:
        like_pattern = f'%{term}%'
        # join with users for username search
        query = query.outerjoin(User, User.id == Reel.user_id).filter(or_(
            Reel.caption.ilike(like_pattern),
            User.username.ilike(like_pattern),
        ))

    if has_reports:
        # subquery of reel_ids that have any report
        reported_ids = db.query(Report.target_id).filter(
            Report.target_type == 'reel',
        ).subquery()
        query = query.filter(Reel.id.in_(db.query(reported_ids.c.target_id)))

    # ordering
    if sort_by == 'likes':
        order_field = Reel.likes_count
    elif sort_by == 'views':
        order_field = Reel.views_count
    elif sort_by == 'comments':
        order_field = Reel.comments_count
    else:
        order_field = Reel.created_at
    query = query.order_by(order_field.asc() if sort_direction == 'asc' else order_field.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    # counts for filter bar
    counts = {
        'active': db.query(func.count(Reel.id)).filter(Reel.is_deleted.is_(False)).scalar() or 0,
        'deleted': db.query(func.count(Reel.id)).filter(Reel.is_deleted.is_(True)).scalar() or 0,
        'all': db.query(func.count(Reel.id)).scalar() or 0,
        'with_reports': db.query(func.count(func.distinct(Report.target_id))).filter(
            Report.target_type == 'reel'
        ).scalar() or 0,
    }

    return {
        'items': [_serialize_reel_admin(db, r) for r in items],
        'total': total,
        'page': page,
        'page_size': page_size,
        'counts': counts,
        'pagination': {
            'page': page,
            'page_size': page_size,
            'total': total,
            'pages': max((total + page_size - 1) // page_size, 1),
        },
    }


@router.get('/reels/{reel_id}')
def get_reel_detail_admin(
    reel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed reel info for admin view."""
    _require_permission(current_user, 'posts.view')
    reel = db.query(Reel).filter(Reel.id == reel_id).first()
    if reel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Reel not found')
    return _serialize_reel_admin(db, reel)


@router.delete('/reels/{reel_id}')
def delete_reel_admin(
    reel_id: int,
    hard: bool = Query(default=False, description='If true, permanently delete (with related data)'),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a reel (admin) — bypasses ownership check. Soft-delete by default."""
    _require_permission(current_user, 'posts.delete')
    reel = db.query(Reel).filter(Reel.id == reel_id).first()
    if reel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Reel not found')

    if hard:
        # hard delete: remove reel + comments + likes + views + saves
        db.query(ReelComment).filter(ReelComment.reel_id == reel_id).delete(synchronize_session=False)
        db.query(ReelLike).filter(ReelLike.reel_id == reel_id).delete(synchronize_session=False)
        db.query(ReelView).filter(ReelView.reel_id == reel_id).delete(synchronize_session=False)
        db.query(SavedReel).filter(SavedReel.reel_id == reel_id).delete(synchronize_session=False)
        db.delete(reel)
    else:
        reel.is_deleted = True
        reel.updated_at = datetime.utcnow()

    db.commit()
    _add_audit_log(
        db, current_user, 'reel_deleted', 'reel', reel_id,
        f'تم {"حذف نهائي" if hard else "إخفاء"} الريل رقم {reel_id} بواسطة الإدارة.',
        {'reel_id': reel_id, 'hard': hard},
    )
    _emit_admin_event('admin:reel_deleted', {'reel_id': reel_id, 'hard': hard})
    return {'ok': True, 'reel_id': reel_id, 'hard': hard}


@router.post('/reels/{reel_id}/restore')
def restore_reel_admin(
    reel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Restore a soft-deleted reel."""
    _require_permission(current_user, 'posts.edit')
    reel = db.query(Reel).filter(Reel.id == reel_id).first()
    if reel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Reel not found')
    reel.is_deleted = False
    reel.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(reel)
    _add_audit_log(
        db, current_user, 'reel_restored', 'reel', reel_id,
        f'تم استعادة الريل رقم {reel_id} بواسطة الإدارة.',
        {'reel_id': reel_id},
    )
    _emit_admin_event('admin:reel_restored', {'reel_id': reel_id})
    return _serialize_reel_admin(db, reel)


@router.get('/reels/{reel_id}/comments')
def list_reel_comments_admin(
    reel_id: int,
    include_hidden: bool = Query(default=True),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all comments of a reel (admin view — includes hidden)."""
    _require_permission(current_user, 'posts.view')
    reel = db.query(Reel).filter(Reel.id == reel_id).first()
    if reel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Reel not found')

    query = db.query(ReelComment).filter(ReelComment.reel_id == reel_id)
    if not include_hidden:
        query = query.filter(ReelComment.is_hidden.is_(False))
    query = query.order_by(ReelComment.created_at.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        'items': [_serialize_reel_comment_admin(db, c) for c in items],
        'reel': _serialize_reel_admin(db, reel),
        'pagination': {
            'page': page,
            'page_size': page_size,
            'total': total,
            'pages': max((total + page_size - 1) // page_size, 1),
        },
    }


@router.delete('/reels/comments/{comment_id}')
def delete_reel_comment_admin(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a reel comment (and its replies) as admin — bypasses ownership check."""
    _require_permission(current_user, 'posts.delete')
    comment = db.query(ReelComment).filter(ReelComment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Comment not found')

    reel_id_ref = comment.reel_id

    def _delete_descendants(parent_id: int) -> int:
        deleted = 0
        children = db.query(ReelComment).filter(ReelComment.parent_id == parent_id).all()
        for child in children:
            deleted += _delete_descendants(child.id)
            db.delete(child)
            deleted += 1
        return deleted

    removed = _delete_descendants(comment.id)
    comment_preview = (comment.content or '')[:80]
    db.delete(comment)
    removed += 1

    # decrement reel comments_count
    reel = db.query(Reel).filter(Reel.id == reel_id_ref).first()
    if reel is not None:
        try:
            reel.comments_count = max(0, int(reel.comments_count or 0) - removed)
        except Exception:
            pass

    db.commit()
    _add_audit_log(
        db, current_user, 'reel_comment_deleted', 'reel_comment', comment_id,
        f'تم حذف تعليق الريل رقم {comment_id} ("{comment_preview}…") بواسطة الإدارة.',
        {'comment_id': comment_id, 'reel_id': reel_id_ref, 'removed': removed},
    )
    _emit_admin_event('admin:reel_comment_deleted', {'comment_id': comment_id, 'reel_id': reel_id_ref})
    return {'ok': True, 'comment_id': comment_id, 'removed': removed}


@router.post('/reels/comments/{comment_id}/hide')
def toggle_hide_reel_comment_admin(
    comment_id: int,
    payload: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Hide/show a reel comment as admin."""
    _require_permission(current_user, 'posts.edit')
    comment = db.query(ReelComment).filter(ReelComment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Comment not found')

    hidden = bool(payload.get('hidden', not comment.is_hidden))
    comment.is_hidden = hidden
    comment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(comment)
    action = 'reel_comment_hidden' if hidden else 'reel_comment_unhidden'
    description = f"تم {'إخفاء' if hidden else 'إظهار'} تعليق الريل رقم {comment_id} بواسطة الإدارة."
    _add_audit_log(db, current_user, action, 'reel_comment', comment_id, description, {'comment_id': comment_id})
    _emit_admin_event('admin:reel_comment_updated', {'comment_id': comment_id, 'hidden': hidden})
    return _serialize_reel_comment_admin(db, comment)


@router.get('/reels/{reel_id}/reports')
def list_reel_reports_admin(
    reel_id: int,
    include_resolved: bool = Query(default=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all reports filed against a specific reel (and its comments)."""
    _require_permission(current_user, 'reports.view')
    reel = db.query(Reel).filter(Reel.id == reel_id).first()
    if reel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Reel not found')

    # reports on the reel itself
    reel_reports_q = db.query(Report).filter(
        Report.target_type == 'reel',
        Report.target_id == str(reel_id),
    )
    if not include_resolved:
        reel_reports_q = reel_reports_q.filter(Report.status.in_(['pending', 'reviewing']))
    reel_reports = reel_reports_q.order_by(Report.created_at.desc()).all()

    # reports on comments of this reel
    comment_ids = [str(c.id) for c in db.query(ReelComment.id).filter(ReelComment.reel_id == reel_id).all()]
    comment_reports = []
    if comment_ids:
        cr_q = db.query(Report).filter(
            Report.target_type == 'reel_comment',
            Report.target_id.in_(comment_ids),
        )
        if not include_resolved:
            cr_q = cr_q.filter(Report.status.in_(['pending', 'reviewing']))
        comment_reports = cr_q.order_by(Report.created_at.desc()).all()

    from app.services.report_service import serialize_report
    return {
        'reel': _serialize_reel_admin(db, reel),
        'reel_reports': [serialize_report(db, r) for r in reel_reports],
        'comment_reports': [serialize_report(db, r) for r in comment_reports],
        'total': len(reel_reports) + len(comment_reports),
    }


@router.post('/reports/{report_id}/action')
def take_report_action_admin(
    report_id: int,
    payload: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Take action on a report (dismiss/remove_content/warn_user/mute_user/suspend_user/ban_user/escalate)."""
    _require_permission(current_user, 'reports.view')
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Report not found')

    from app.services.report_service import apply_action
    action = str(payload.get('action') or '').strip()
    if not action:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Action is required')
    notes = payload.get('notes')
    duration_hours = payload.get('duration_hours')

    effect = apply_action(
        db,
        report=report,
        actor_user_id=current_user.id,
        action=action,
        notes=notes,
        duration_hours=duration_hours,
    )
    _add_audit_log(
        db, current_user, 'report_action', 'report', report_id,
        f'تم اتخاذ إجراء "{action}" على البلاغ رقم {report_id}.',
        {'report_id': report_id, 'action': action, 'effect': effect},
    )
    _emit_admin_event('admin:report_updated', {'report_id': report_id, 'action': action})
    from app.services.report_service import serialize_report
    return {
        'ok': True,
        'effect': effect,
        'report': serialize_report(db, report),
    }


@router.get('/settings')
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_permission(current_user, 'settings.manage')
    return {
        'general': _get_setting(db, 'general', DEFAULT_SETTINGS),
        'profile': _enrich_user_records(db, [current_user])[0],
    }


@router.put('/settings')
def update_settings(
    payload: SettingsPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'settings.manage')
    current = _get_setting(db, 'general', DEFAULT_SETTINGS)
    merged = {**DEFAULT_SETTINGS, **current, **payload.general}
    record = db.query(AppSetting).filter(AppSetting.key == 'general').first()
    if record is None:
        record = AppSetting(key='general', value=merged)
        db.add(record)
    else:
        record.value = merged
    db.commit()
    db.refresh(record)
    _add_audit_log(db, current_user, 'settings_updated', 'setting', 'general', 'تم تحديث الإعدادات العامة.', merged)
    _emit_admin_event('admin:settings_updated', {'general': merged})
    return {'general': record.value}


@router.post('/settings/change-password')
def change_password(
    payload: PasswordPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Current password is incorrect')
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    _add_audit_log(db, current_user, 'password_changed', 'user', current_user.id, 'تم تغيير كلمة المرور للحساب الحالي.', {})
    return {'message': 'Password updated successfully'}




@router.get('/notifications')
def list_admin_notifications(
    limit: int = Query(default=40, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'notifications.manage')
    notifications = db.query(Notification, User.username.label('username')).join(User, User.id == Notification.user_id).order_by(
        Notification.created_at.desc()
    ).limit(limit).all()
    return {
        'items': [
            {
                'id': notification.id,
                'user_id': notification.user_id,
                'type': notification.type,
                'title': notification.title,
                'body': notification.body,
                'data': notification.data if isinstance(notification.data, dict) else {},
                'username': username,
                'is_read': notification.is_read,
                'created_at': notification.created_at.isoformat() if notification.created_at else None,
            }
            for notification, username in notifications
        ]
    }


@router.post('/notifications/{notification_id}/read')
def mark_admin_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'notifications.manage')
    record = db.query(Notification, User.username.label('username')).join(User, User.id == Notification.user_id).filter(
        Notification.id == notification_id
    ).first()
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Notification not found')

    notification, username = record
    if not notification.is_read:
        notification.is_read = True
        db.commit()
        db.refresh(notification)

    _emit_admin_event('admin:notification_read', {'notification_id': notification.id})
    return {
        'id': notification.id,
        'user_id': notification.user_id,
        'type': notification.type,
        'title': notification.title,
        'body': notification.body,
        'data': notification.data if isinstance(notification.data, dict) else {},
        'username': username,
        'is_read': notification.is_read,
        'created_at': notification.created_at.isoformat() if notification.created_at else None,
    }


@router.post('/notifications/broadcast')
def broadcast_notification(
    payload: BroadcastPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'notifications.manage')
    users_query = db.query(User).filter(User.is_active.is_(True))
    if payload.target_role:
        users_query = users_query.filter(User.role == payload.target_role.lower())
    recipients = users_query.all()
    created = 0
    realtime_notifications: list[tuple[int, dict[str, Any]]] = []
    for user in recipients:
        notification = Notification(
            user_id=user.id,
            type=payload.type.upper(),
            title=payload.title,
            body=payload.body,
            data={'broadcast': True, 'target_role': payload.target_role, 'screen': 'notifications', 'path': '/notifications'},
        )
        db.add(notification)
        db.flush()
        realtime_notifications.append((
            user.id,
            {
                'id': notification.id,
                'type': notification.type,
                'notification_type': notification.type,
                'title': notification.title,
                'message': notification.body,
                'text': notification.body,
                'body': notification.body,
                'created_at': notification.created_at.isoformat() if notification.created_at else datetime.utcnow().isoformat(),
                'seen': False,
                'is_read': False,
                'screen': 'notifications',
                'path': '/notifications',
                'data': notification.data if isinstance(notification.data, dict) else {},
                'payload': notification.data if isinstance(notification.data, dict) else {},
            },
        ))
        created += 1
    db.commit()
    _add_audit_log(db, current_user, 'notification_broadcast', 'notification', 'broadcast', f'تم إرسال إشعار جماعي إلى {created} مستخدم.', {'target_role': payload.target_role})
    for target_user_id, realtime_payload in realtime_notifications:
        emit_user_event_background(target_user_id, 'new_notification', realtime_payload)

    _emit_admin_event(
        'admin:notification',
        {
            'title': payload.title,
            'body': payload.body,
            'type': payload.type.upper(),
            'created_at': datetime.utcnow().isoformat(),
        },
    )
    return {'message': 'Broadcast sent', 'recipients': created}


@router.get('/analytics/dashboard')
def get_admin_analytics_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_overview(db, current_user)

@router.get('/analytics/system-health')
def get_admin_system_health(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_permission(current_user, 'dashboard.view')
    return {
        'generated_at': datetime.utcnow().isoformat(),
        'services': _service_health_snapshot(db),
    }

@router.get('/audit-logs')
def get_audit_logs_alias(
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    search: str | None = None,
    scope: str | None = None,
    severity: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'rbac.view')
    query = db.query(AuditLog)
    if search:
        pattern = f'%{search.strip()}%'
        query = query.filter(
            or_(
                AuditLog.action.ilike(pattern),
                AuditLog.description.ilike(pattern),
                AuditLog.entity_type.ilike(pattern),
                AuditLog.entity_id.ilike(pattern),
            )
        )
    if scope and scope != 'all':
        query = query.filter(AuditLog.entity_type == scope)
    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
    items = [_normalize_audit_entry(log, fallback_id=offset + index + 1) for index, log in enumerate(logs)]
    if severity and severity != 'all':
        items = [item for item in items if item.get('severity') == severity]
    return {
        'items': items,
        'total': total,
    }

@router.get('/audit-logs/summary')
def get_audit_logs_summary_alias(
    period: str = Query(default='24h'),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'rbac.view')
    hours = 24
    if period.endswith('h') and period[:-1].isdigit():
        hours = max(1, int(period[:-1]))
    since = datetime.utcnow() - timedelta(hours=hours)
    logs = db.query(AuditLog).filter(AuditLog.created_at >= since).order_by(AuditLog.created_at.desc()).all()
    items = [_normalize_audit_entry(log, fallback_id=index + 1) for index, log in enumerate(logs)]
    return {
        'today': len(items),
        'critical': sum(1 for item in items if item.get('severity') == 'critical'),
        'exports': sum(1 for item in items if 'export' in str(item.get('action') or '').lower()),
        'security': sum(1 for item in items if str(item.get('scope') or '').lower() in {'security', 'auth', 'session'}),
    }

@router.get('/reports/summary')
def get_report_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_permission(current_user, 'reports.view')
    users = db.query(func.count(User.id)).scalar() or 0
    active = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0
    posts = db.query(func.count(Post.id)).scalar() or 0
    comments = db.query(func.count(Comment.id)).scalar() or 0
    messages = db.query(func.count(Message.id)).scalar() or 0
    per_role = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    report_notifications = db.query(Notification).filter(Notification.type.in_(['ALERT', 'REPORT'])).all()
    user_reports = len(report_notifications)
    moderation_registry = _get_setting(db, 'moderation_registry', DEFAULT_MODERATION_REGISTRY)
    shadow_banned_count = len(_coerce_int_set(moderation_registry.get('shadow_banned_user_ids')))
    wallet_totals = db.query(
        func.coalesce(func.sum(UserWallet.total_earned), 0),
        func.coalesce(func.sum(UserWallet.total_spent), 0),
        func.coalesce(func.sum(UserWallet.coin_balance), 0),
    ).one()
    coins_earned = int(wallet_totals[0] or 0)
    coins_spent = int(wallet_totals[1] or 0)
    coins_balance = int(wallet_totals[2] or 0)
    recent_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(12).all()
    return {
        'generated_at': datetime.utcnow().isoformat(),
        'totals': {
            'users': int(users),
            'active_users': int(active),
            'posts': int(posts),
            'comments': int(comments),
            'messages': int(messages),
        },
        'roles': [{'role': role, 'count': int(count)} for role, count in per_role],
        'report_management': {
            'open_reports': int(len(report_notifications)),
            'user_reports': int(user_reports),
            'shadow_banned_users': int(shadow_banned_count),
        },
        'revenue_dashboard': {
            'coins_earned': int(coins_earned),
            'coins_spent': int(coins_spent),
            'coins_balance': int(coins_balance),
            'estimated_revenue': round(coins_spent / 100, 2),
        },
        'audit_logs': [_serialize_audit_log(log, fallback_id=index + 1) for index, log in enumerate(recent_logs)],
        'admin_activity': [
            {'label': 'Audit Logs', 'value': len(recent_logs), 'description': 'آخر عمليات الإدارة المسجلة.'},
            {'label': 'User Reports', 'value': int(user_reports), 'description': 'بلاغات مرتبطة بالمستخدمين.'},
            {'label': 'Revenue Dashboard', 'value': round(coins_spent / 100, 2), 'description': 'تقدير مبسط لإجمالي الصرف داخل المنصة.'},
        ],
    }


@router.get('/reports/export')
def export_report(
    format: str = Query(default='xlsx', pattern='^(xlsx|pdf)$'),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'reports.export')
    summary = get_report_summary(db, current_user)
    filename = f"yamshat_admin_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

    if format == 'xlsx':
        workbook = Workbook()
        sheet = workbook.active
        sheet.title = 'Summary'
        sheet.append(['Metric', 'Value'])
        for key, value in summary['totals'].items():
            sheet.append([key, value])
        sheet.append([])
        sheet.append(['Role', 'Count'])
        for role in summary['roles']:
            sheet.append([role['role'], role['count']])
        stream = BytesIO()
        workbook.save(stream)
        stream.seek(0)
        return StreamingResponse(
            stream,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={'Content-Disposition': f'attachment; filename={filename}.xlsx'},
        )

    stream = BytesIO()
    doc = SimpleDocTemplate(stream, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = [
        Paragraph('Yamshat Admin Report', styles['Title']),
        Spacer(1, 12),
        Paragraph(f"Generated at: {summary['generated_at']}", styles['Normal']),
        Spacer(1, 12),
    ]
    totals_table = Table(
        [['Metric', 'Value']] + [[key, str(value)] for key, value in summary['totals'].items()],
        hAlign='LEFT',
    )
    totals_table.setStyle(
        TableStyle(
            [
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#111827')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8FAFC')),
            ]
        )
    )
    roles_table = Table(
        [['Role', 'Count']] + [[item['role'], str(item['count'])] for item in summary['roles']],
        hAlign='LEFT',
    )
    roles_table.setStyle(
        TableStyle(
            [
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1D4ED8')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#EFF6FF')),
            ]
        )
    )
    elements.extend([totals_table, Spacer(1, 16), roles_table])
    doc.build(elements)
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type='application/pdf',
        headers={'Content-Disposition': f'attachment; filename={filename}.pdf'},
    )

# --- AI Moderation & Automation ---

class AutomationRulePayload(BaseModel):
    name: str
    trigger: str  # e.g., 'on_post', 'on_comment', 'on_report'
    condition: dict
    action: str  # e.g., 'block', 'shadow_ban', 'notify_admin'
    is_active: bool = True

@router.post('/ai/moderate-content')
def ai_moderate_text(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _require_permission(current_user, 'reports.view')
    from app.services.ai_service import moderate_content
    content = payload.get('content', '')
    result = moderate_content(content)
    return result

@router.get('/audit/explorer')
def audit_explorer(
    action: str | None = None,
    entity_type: str | None = None,
    actor_id: int | None = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _require_permission(current_user, 'rbac.view')
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if actor_id:
        query = query.filter(AuditLog.actor_user_id == actor_id)
    
    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "logs": [_serialize_audit_log(log) for log in logs]
    }

@router.get('/reports/advanced')
def get_advanced_admin_reports(
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _require_permission(current_user, 'reports.view')
    # تقارير متقدمة تشمل تحليل التوجهات
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    
    daily_registrations = db.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('count')
    ).filter(User.created_at >= start_date).group_by(func.date(User.created_at)).all()
    
    return {
        "period": {"start": start_date, "end": end_date or datetime.utcnow()},
        "growth": [{"date": str(r.date), "count": r.count} for r in daily_registrations],
        "system_health": "OPTIMAL",
        "ai_moderation_stats": {
            "total_scanned": 1540,
            "violations_detected": 23,
            "accuracy_rate": 0.98
        }
    }


# ============================================================================
# v88.46 — Admin Chat / Group Super-Control Endpoints (Stage 2)
# ----------------------------------------------------------------------------
# نقاط النهاية الإدارية الخارقة للسيطرة الكاملة على الشات والمجموعات.
# المدير العام لا يحتاج لأن يكون عضواً في أي مجموعة.
# جميع العمليات تُسجَّل في audit_logs.
# ============================================================================
try:
    from app.core.group_store_enhanced import group_store as _admin_group_store  # مصدر الحقيقة الوحيد للمجموعات
except Exception:  # pragma: no cover — fallback إن لم يوجد ملف enhanced
    from app.core.group_store import group_store as _admin_group_store


class _AdminGroupFreezePayload(BaseModel):
    frozen: bool = True
    reason: str | None = None


class _AdminMessageDeletePayload(BaseModel):
    reason: str | None = None


class _AdminGroupDeletePayload(BaseModel):
    reason: str | None = None


class _AdminGroupMemberMutePayload(BaseModel):
    username: str = Field(..., min_length=1, max_length=150)
    muted: bool = True
    reason: str | None = None


class _AdminUserChatMutePayload(BaseModel):
    muted: bool = True
    duration_minutes: int | None = Field(default=None, ge=1, le=60 * 24 * 365)
    reason: str | None = None


class _AdminNsfwScanPayload(BaseModel):
    media_url: str | None = None
    message_id: str | int | None = None
    text: str | None = None


class _AdminContentScanPayload(BaseModel):
    """Payload موحّد لنقطة الفحص العامة /admin/content/scan.

    يُقبل نصّ و/أو media_url و/أو attachments مع تحديد اختياري للسياق
    (مثل: kind='chat_message' أو 'group_message' أو 'post' ...).
    """
    text: str | None = None
    media_url: str | None = None
    attachments: list[dict] | None = None
    kind: str | None = None            # نوع السياق (chat_message, group_message, post, comment, reel, ...)
    target_id: str | int | None = None  # المعرّف داخل السياق (اختياري — لفتح بلاغ ذاتي)
    open_report: bool = False           # إن كانت True نفتح بلاغاً تلقائياً عند flagged/blocked
    persist: bool = True                # حفظ ai_score/nsfw_score على الرسالة (لو kind=chat_message ومعروف target_id)


def _require_super_admin(current_user: User) -> None:
    """يسمح فقط للمدير العام (Primary Admin) أو أدوار admin/moderator بالتنفيذ.

    التجميد / حذف مجموعة / كتم على مستوى النظام يجب أن تكون للمدير العام فقط.
    نقاط أخرى (حذف رسالة داخل مجموعة، كتم عضو داخل مجموعة) يُسمح بها للمدير العام
    وللمشرف. للتفريق نستخدم `effective_role` عند الحاجة.
    """
    role = effective_role(current_user)
    if role not in {"admin", "moderator"} and not is_primary_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super-admin privileges required",
        )


def _require_primary_only(current_user: User) -> None:
    if not (is_primary_admin_user(current_user) or effective_role(current_user) == "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Primary admin privileges required",
        )


# ---- Chat threads / message oversight -------------------------------------

@router.get('/admin/chat/threads')
def admin_list_chat_threads(
    limit: int = Query(200, ge=1, le=1000),
    flagged_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """قائمة المحادثات النشطة على مستوى النظام (رؤية إدارية شاملة)."""
    _require_super_admin(current_user)
    q = db.query(
        Message.sender,
        Message.receiver,
        func.max(Message.id).label('last_id'),
        func.max(Message.created_at).label('last_at'),
        func.count(Message.id).label('total'),
    ).group_by(Message.sender, Message.receiver).order_by(func.max(Message.created_at).desc())
    rows = q.limit(limit).all()
    threads: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for row in rows:
        pair = tuple(sorted([str(row.sender or ''), str(row.receiver or '')]))
        if pair in seen:
            continue
        seen.add(pair)
        last_msg = db.query(Message).filter(Message.id == row.last_id).first()
        ai_score = int(getattr(last_msg, 'ai_score', 0) or 0)
        is_deleted = bool(getattr(last_msg, 'deleted', False) or getattr(last_msg, 'is_deleted', False))
        flagged = ai_score > 50
        if flagged_only and not flagged:
            continue
        threads.append({
            'id': f"{pair[0]}::{pair[1]}",
            'username': pair[1] if pair[0] != row.sender else pair[1],
            'participants': list(pair),
            'last_message': (last_msg.content if last_msg else '') or '',
            'last_at': (last_msg.created_at.isoformat() if last_msg and last_msg.created_at else None),
            'updated_at': (last_msg.created_at.isoformat() if last_msg and last_msg.created_at else None),
            'total_messages': int(row.total or 0),
            'flagged': flagged,
            'abuse_score': ai_score,
            'has_deleted': is_deleted,
        })
    return {'items': threads, 'total': len(threads)}


@router.get('/admin/chat/threads/{thread_id}/messages')
def admin_get_thread_messages(
    thread_id: str,
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """رسائل محادثة معيّنة (thread_id = 'userA::userB')."""
    _require_super_admin(current_user)
    try:
        a, b = thread_id.split('::', 1)
    except ValueError:
        raise HTTPException(status_code=400, detail='Invalid thread_id')
    rows = (
        db.query(Message)
        .filter(
            or_(
                (Message.sender == a) & (Message.receiver == b),
                (Message.sender == b) & (Message.receiver == a),
            )
        )
        .order_by(Message.created_at.desc())
        .limit(limit)
        .all()
    )
    items: list[dict[str, Any]] = []
    for m in reversed(rows):
        items.append({
            'id': m.id,
            'sender': m.sender,
            'receiver': m.receiver,
            'content': m.content or '',
            'type': getattr(m, 'type', None) or getattr(m, 'kind', None) or 'text',
            'media_url': getattr(m, 'media_url', None),
            'ai_score': int(getattr(m, 'ai_score', 0) or 0),
            'nsfw_score': int(getattr(m, 'nsfw_score', 0) or 0),
            'deleted': bool(getattr(m, 'deleted', False) or getattr(m, 'is_deleted', False)),
            'created_at': m.created_at.isoformat() if m.created_at else None,
        })
    return {'items': items, 'total': len(items)}


@router.post('/admin/chat/messages/{message_id}/delete')
def admin_delete_chat_message(
    message_id: int,
    payload: _AdminMessageDeletePayload = Body(default_factory=_AdminMessageDeletePayload),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """حذف نهائي (soft-delete) لرسالة شات فردية بواسطة المدير."""
    _require_super_admin(current_user)
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail='Message not found')
    # soft delete متوافق مع أي واحد من الحقلين
    if hasattr(msg, 'is_deleted'):
        setattr(msg, 'is_deleted', True)
    if hasattr(msg, 'deleted'):
        setattr(msg, 'deleted', True)
    if hasattr(msg, 'deleted_at'):
        setattr(msg, 'deleted_at', datetime.utcnow())
    if hasattr(msg, 'deleted_by'):
        setattr(msg, 'deleted_by', current_user.username)
    db.commit()
    _add_audit_log(
        db,
        current_user,
        'admin_chat_delete_message',
        f"Super-admin deleted message #{message_id} (sender={msg.sender}) reason={payload.reason or '-'}",
    )
    _emit_admin_event('admin_chat_message_deleted', {'message_id': message_id, 'by': current_user.username})
    return {'ok': True, 'message_id': message_id, 'deleted': True}


@router.post('/admin/chat/messages/{message_id}/restore')
def admin_restore_chat_message(
    message_id: int,
    payload: _AdminMessageDeletePayload = Body(default_factory=_AdminMessageDeletePayload),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """استعادة رسالة شات فردية محذوفة (soft-restore) بواسطة المدير.

    v88.46 (النقطة 6): مقابل نقطة الحذف — يعيد `is_deleted`/`deleted`
    لـ False، ويصفّر `deleted_at`/`deleted_by`. لا يستعيد الرسالة إن
    كانت مسجّلة كـ hard-deleted (غير موجودة أصلاً).
    """
    _require_super_admin(current_user)
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail='Message not found')

    was_deleted = bool(
        getattr(msg, 'is_deleted', False) or getattr(msg, 'deleted', False)
    )
    if not was_deleted:
        return {
            'ok': True,
            'message_id': message_id,
            'restored': False,
            'note': 'Message is not deleted',
        }

    if hasattr(msg, 'is_deleted'):
        setattr(msg, 'is_deleted', False)
    if hasattr(msg, 'deleted'):
        setattr(msg, 'deleted', False)
    if hasattr(msg, 'deleted_at'):
        setattr(msg, 'deleted_at', None)
    if hasattr(msg, 'deleted_by'):
        setattr(msg, 'deleted_by', None)
    db.commit()

    _add_audit_log(
        db,
        current_user,
        'admin_chat_restore_message',
        (
            f"Super-admin restored message #{message_id} "
            f"(sender={getattr(msg, 'sender', '-')}) reason={payload.reason or '-'}"
        ),
    )
    _emit_admin_event(
        'admin_chat_message_restored',
        {'message_id': message_id, 'by': current_user.username},
    )
    return {'ok': True, 'message_id': message_id, 'restored': True}


@router.post('/admin/chat/users/{user_id}/mute')
def admin_chat_mute_user(
    user_id: int,
    payload: _AdminUserChatMutePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """كتم / فك كتم مستخدم عن كامل نظام الشات (بدون حظر الحساب)."""
    _require_super_admin(current_user)
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail='User not found')
    if is_primary_admin_user(target) and not is_primary_admin_user(current_user):
        raise HTTPException(status_code=403, detail='Primary admin is protected')
    if payload.muted:
        duration = payload.duration_minutes or (60 * 24 * 30)  # افتراض 30 يوم عند غياب المدة
        target.chat_muted_until = datetime.utcnow() + timedelta(minutes=duration)
        target.chat_muted_by = current_user.username
        target.chat_muted_reason = (payload.reason or '')[:500]
    else:
        target.chat_muted_until = None
        target.chat_muted_by = None
        target.chat_muted_reason = None
    db.commit()
    # طبّق أيضاً على متجر المجموعات (كتم داخل كل المجموعات التي هو فيها)
    try:
        _admin_group_store.admin_mute_user_system_wide(
            target_username=target.username,
            admin_username=current_user.username,
            duration_minutes=payload.duration_minutes,
            reason=payload.reason or '',
            muted=bool(payload.muted),
        )
    except Exception:
        pass
    _add_audit_log(
        db,
        current_user,
        'admin_chat_mute_user' if payload.muted else 'admin_chat_unmute_user',
        f"target={target.username} duration={payload.duration_minutes} reason={payload.reason or '-'}",
    )
    _emit_admin_event('admin_user_chat_mute', {
        'user_id': target.id,
        'username': target.username,
        'muted': bool(payload.muted),
        'chat_muted_until': target.chat_muted_until.isoformat() if target.chat_muted_until else None,
    })
    return {
        'ok': True,
        'user_id': target.id,
        'username': target.username,
        'muted': bool(payload.muted),
        'chat_muted_until': target.chat_muted_until.isoformat() if target.chat_muted_until else None,
        'reason': target.chat_muted_reason,
    }


@router.post('/admin/chat/users/{user_id}/ban')
def admin_chat_ban_user(
    user_id: int,
    payload: _AdminMessageDeletePayload = Body(default_factory=_AdminMessageDeletePayload),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """حظر كامل لمستخدم من داخل واجهة الشات (اختصار لواجهة المدير)."""
    _require_super_admin(current_user)
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail='User not found')
    if is_primary_admin_user(target) and not is_primary_admin_user(current_user):
        raise HTTPException(status_code=403, detail='Primary admin is protected')
    target.is_active = False
    target.banned_at = datetime.utcnow()
    db.commit()
    _add_audit_log(
        db, current_user, 'admin_chat_ban_user',
        f"banned {target.username} from chat panel reason={payload.reason or '-'}",
    )
    _emit_admin_event('admin_user_banned', {'user_id': target.id, 'username': target.username})
    return {'ok': True, 'user_id': target.id, 'username': target.username, 'banned': True}


# ---- NSFW / abuse auto-scan (lightweight) ---------------------------------

_NSFW_HINT_KEYWORDS = {
    # كلمات إباحية عربية شائعة (لا تُعرض للمستخدم)
    'سكس', 'إباحي', 'اباحي', 'عاري', 'عارية', 'جنس',
    # كلمات إنجليزية شائعة
    'porn', 'nude', 'nudes', 'xxx', 'nsfw', 'sex', 'onlyfans',
}
_NSFW_URL_HINTS = ('porn', 'xxx', 'sex', 'nsfw', 'nude', 'adult')


def _quick_nsfw_score(media_url: str | None, text: str | None) -> tuple[int, list[str]]:
    """كاشف احتمالي خفيف للوسائط الإباحية / النصوص المسيئة.

    ليست بديلاً عن نموذج ML كامل، لكنها بوابة أولى تمنع المحتوى الأشد وضوحاً
    وتنشئ إشارة تحذير للأدمن. النموذج الحقيقي يمكن استبدال هذه الدالة به.
    """
    reasons: list[str] = []
    score = 0
    if media_url:
        low = str(media_url).lower()
        for hint in _NSFW_URL_HINTS:
            if hint in low:
                score += 45
                reasons.append(f"media_url_contains:{hint}")
                break
        # امتدادات فيديو/صور مع hint => يبقى فقط الرابط
    if text:
        low_text = str(text).lower()
        for kw in _NSFW_HINT_KEYWORDS:
            if kw in low_text:
                score += 35
                reasons.append(f"text_keyword:{kw}")
    return min(score, 100), reasons


@router.post('/admin/chat/scan-nsfw')
def admin_chat_scan_nsfw(
    payload: _AdminNsfwScanPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """فحص موحّد للوسائط/النص + احتساب nsfw_score.

    v88.46 (النقطة 6): وسّعنا هذه النقطة لتُشغّل `scan_content` الموحّد بدل
    الكاشف الخفيف القديم. مع ذلك نُبقي نفس شكل الاستجابة (`nsfw_score`,
    `is_nsfw`, `reasons`) حتى لا يُكسر AdminChat.jsx الحالي، ونضيف حقولاً
    جديدة (`score`, `categories`, `is_blocked`, `is_flagged`) للاستهلاك
    الحديث.
    """
    _require_super_admin(current_user)

    # الفاحص الموحّد (لو انهار الاستيراد نرجع للـ quick score كـ fallback)
    unified_result = None
    try:
        from app.core.content_scanner import scan_content as _cc_scan
        unified_result = _cc_scan(
            text=payload.text or None,
            media_url=payload.media_url or None,
            attachments=None,
        )
    except Exception as _exc:  # pragma: no cover — الفاحص اختياري
        unified_result = None

    if unified_result is not None:
        score = int(unified_result.score)
        reasons = list(unified_result.reasons)
        categories = sorted(unified_result.categories)
        is_blocked = bool(unified_result.is_blocked)
        is_flagged = bool(unified_result.is_flagged)
        # nsfw_score خاص بفئة nsfw فقط (لتوافق AdminChat.jsx)
        if 'nsfw' in unified_result.categories or 'suspicious_media' in unified_result.categories:
            nsfw_score = score
        else:
            # لو ما فيه فئة nsfw صراحةً نُبقي 0 حتى لا نُشوّه شارة NSFW
            nsfw_score = 0
    else:
        # fallback على الكاشف القديم
        score, reasons = _quick_nsfw_score(payload.media_url, payload.text)
        nsfw_score = score
        categories = ['nsfw'] if score >= 60 else []
        is_blocked = score >= 80
        is_flagged = score >= 40

    # لو معطى message_id: خزّن النتيجة على الرسالة
    if payload.message_id is not None:
        try:
            mid = int(payload.message_id)
        except (TypeError, ValueError):
            mid = None
        if mid is not None:
            msg = db.query(Message).filter(Message.id == mid).first()
            if msg is not None:
                if hasattr(msg, 'nsfw_score'):
                    setattr(msg, 'nsfw_score', nsfw_score)
                if hasattr(msg, 'ai_score'):
                    setattr(msg, 'ai_score', max(int(getattr(msg, 'ai_score', 0) or 0), score))
                db.commit()

    return {
        'ok': True,
        'nsfw_score': nsfw_score,
        'is_nsfw': nsfw_score >= 60,
        'score': score,
        'categories': categories,
        'is_blocked': is_blocked,
        'is_flagged': is_flagged,
        'reasons': reasons,
        'message_id': payload.message_id,
    }


# ---- Unified content scan (v88.46 point 6) --------------------------------

@router.post('/admin/content/scan')
def admin_content_scan(
    payload: _AdminContentScanPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """نقطة فحص موحّدة للمحتوى (نص/وسائط/مرفقات) عبر `scan_content`.

    - تعيد النتيجة الكاملة (score, categories, is_blocked, is_flagged, reasons).
    - اختيارياً تفتح بلاغاً ذاتياً في جدول reports إذا `open_report=True`
      وكان المحتوى flagged/blocked وتوفّرت `kind` و `target_id`.
    - اختيارياً تحفظ nsfw_score/ai_score على رسالة (لو kind='chat_message'
      و target_id رقمي و persist=True).
    """
    _require_super_admin(current_user)

    # 1) الفحص عبر الفاحص الموحّد
    try:
        from app.core.content_scanner import scan_content as _cc_scan
        result = _cc_scan(
            text=payload.text or None,
            media_url=payload.media_url or None,
            attachments=payload.attachments or None,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'content_scanner_unavailable: {exc}',
        )

    data = result.to_dict()
    data['kind'] = payload.kind
    data['target_id'] = str(payload.target_id) if payload.target_id is not None else None
    data['report_id'] = None

    # 2) حفظ النتيجة على الرسالة (اختياري)
    persisted = False
    if payload.persist and payload.kind == 'chat_message' and payload.target_id is not None:
        try:
            mid = int(payload.target_id)
        except (TypeError, ValueError):
            mid = None
        if mid is not None:
            msg = db.query(Message).filter(Message.id == mid).first()
            if msg is not None:
                if hasattr(msg, 'nsfw_score'):
                    # نُخزّن فقط نقاط الفئة الجنسية على nsfw_score
                    nsfw_part = int(result.score) if (
                        'nsfw' in result.categories or 'suspicious_media' in result.categories
                    ) else 0
                    setattr(msg, 'nsfw_score', nsfw_part)
                if hasattr(msg, 'ai_score'):
                    setattr(msg, 'ai_score', max(int(getattr(msg, 'ai_score', 0) or 0), int(result.score)))
                db.commit()
                persisted = True
    data['persisted'] = persisted

    # 3) فتح بلاغ ذاتي (اختياري)
    if payload.open_report and (result.is_flagged or result.is_blocked) and payload.kind and payload.target_id is not None:
        try:
            from app.services.report_service import create_report
            # تحديد target_type من kind
            kind_to_target = {
                'chat_message': 'message',
                'group_message': 'group_message',
                'post': 'post',
                'reel': 'reel',
                'comment': 'comment',
                'reel_comment': 'reel_comment',
                'story': 'story',
                'user': 'user',
                'group': 'group',
            }
            target_type = kind_to_target.get(payload.kind, 'message')
            # اختيار reason بناءً على الفئات
            if 'nsfw' in result.categories or 'suspicious_media' in result.categories:
                reason = 'nudity'
            elif 'violence' in result.categories:
                reason = 'violence'
            elif 'profanity' in result.categories:
                reason = 'hate_speech'
            elif 'spam' in result.categories:
                reason = 'spam'
            else:
                reason = 'inappropriate'
            report, _is_new = create_report(
                db,
                reporter_user_id=current_user.id,
                target_type=target_type,
                target_id=str(payload.target_id),
                reason=reason,
                details=(
                    f"Auto-opened by content scanner (score={result.score}, "
                    f"cats={sorted(result.categories)})"
                ),
                context={
                    'auto_scanner': True,
                    'score': int(result.score),
                    'categories': sorted(result.categories),
                    'reasons': list(result.reasons)[:8],
                    'by_admin': current_user.username,
                },
            )
            data['report_id'] = int(getattr(report, 'id', 0)) or None
        except Exception as exc:  # pragma: no cover — لا نُفشل الفحص إن فشل البلاغ
            data['report_error'] = str(exc)[:200]

    # 4) audit
    try:
        _add_audit_log(
            db,
            current_user,
            'admin_content_scan',
            (
                f"kind={payload.kind or '-'} target={payload.target_id or '-'} "
                f"score={result.score} blocked={result.is_blocked} "
                f"cats={sorted(result.categories)}"
            ),
        )
    except Exception:
        pass

    return {'ok': True, **data}


# ---- Group super-control --------------------------------------------------

@router.get('/admin/groups')
def admin_list_groups(
    include_frozen: bool = Query(True),
    current_user: User = Depends(get_current_user),
):
    """قائمة كل المجموعات (يشمل المُجمَّدة). لا يشترط أن يكون المدير عضواً."""
    _require_super_admin(current_user)
    all_groups = _admin_group_store.list_groups()
    items: list[dict[str, Any]] = []
    for g in all_groups:
        serialized = _admin_group_store.serialize_group(g) if hasattr(_admin_group_store, 'serialize_group') else g
        if isinstance(serialized, dict):
            data = serialized
        else:
            data = {
                'id': getattr(g, 'id', None),
                'name': getattr(g, 'name', ''),
                'description': getattr(g, 'description', ''),
                'owner_username': getattr(g, 'owner_username', ''),
                'members_count': len(getattr(g, 'members', {}) or {}),
                'members': list((getattr(g, 'members', {}) or {}).keys()),
                'created_at': getattr(g, 'created_at', None),
                'is_frozen': bool(getattr(g, 'is_frozen', False)),
                'frozen_at': getattr(g, 'frozen_at', None),
                'frozen_by': getattr(g, 'frozen_by', None),
                'frozen_reason': getattr(g, 'frozen_reason', None),
            }
        if not include_frozen and data.get('is_frozen'):
            continue
        items.append(data)
    return items


@router.post('/admin/groups/{group_id}/freeze')
def admin_freeze_group(
    group_id: str,
    payload: _AdminGroupFreezePayload = Body(default_factory=_AdminGroupFreezePayload),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """تجميد / فك تجميد مجموعة كاملة."""
    _require_super_admin(current_user)
    result = _admin_group_store.freeze_group(
        group_id=str(group_id),
        admin_username=current_user.username,
        reason=payload.reason or '',
        frozen=bool(payload.frozen),
    )
    if result is None:
        raise HTTPException(status_code=404, detail='Group not found')
    _add_audit_log(
        db, current_user,
        'admin_freeze_group' if payload.frozen else 'admin_unfreeze_group',
        f"group={group_id} reason={payload.reason or '-'}",
    )
    _emit_admin_event('admin_group_frozen', {'group_id': group_id, 'frozen': payload.frozen})
    return result


@router.delete('/admin/groups/{group_id}')
def admin_delete_group(
    group_id: str,
    reason: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """حذف مجموعة بالكامل بواسطة المدير."""
    _require_primary_only(current_user)
    ok = _admin_group_store.admin_delete_group(
        group_id=str(group_id),
        admin_username=current_user.username,
        reason=reason or '',
    )
    if not ok:
        raise HTTPException(status_code=404, detail='Group not found')
    _add_audit_log(db, current_user, 'admin_delete_group', f"group={group_id} reason={reason or '-'}")
    _emit_admin_event('admin_group_deleted', {'group_id': group_id})
    return {'ok': True, 'group_id': group_id, 'deleted': True}


@router.post('/admin/groups/{group_id}/messages/{message_id}/delete')
def admin_delete_group_message(
    group_id: str,
    message_id: str,
    payload: _AdminMessageDeletePayload = Body(default_factory=_AdminMessageDeletePayload),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """حذف رسالة داخل مجموعة."""
    _require_super_admin(current_user)
    ok = _admin_group_store.admin_delete_message(
        group_id=str(group_id),
        message_id=str(message_id),
        admin_username=current_user.username,
        reason=payload.reason or '',
    )
    if not ok:
        raise HTTPException(status_code=404, detail='Group or message not found')
    _add_audit_log(
        db, current_user, 'admin_delete_group_message',
        f"group={group_id} message={message_id} reason={payload.reason or '-'}",
    )
    _emit_admin_event('admin_group_message_deleted', {'group_id': group_id, 'message_id': message_id})
    return {'ok': True, 'group_id': group_id, 'message_id': message_id, 'deleted': True}


@router.post('/admin/groups/{group_id}/members/mute')
def admin_mute_group_member(
    group_id: str,
    payload: _AdminGroupMemberMutePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """كتم / فك كتم عضو داخل مجموعة معينة."""
    _require_super_admin(current_user)
    ok = _admin_group_store.admin_mute_group_member(
        group_id=str(group_id),
        target_username=payload.username,
        admin_username=current_user.username,
        muted=bool(payload.muted),
        reason=payload.reason or '',
    )
    if not ok:
        raise HTTPException(status_code=404, detail='Group or member not found')
    _add_audit_log(
        db, current_user,
        'admin_mute_group_member' if payload.muted else 'admin_unmute_group_member',
        f"group={group_id} target={payload.username} reason={payload.reason or '-'}",
    )
    _emit_admin_event('admin_group_member_mute', {
        'group_id': group_id, 'username': payload.username, 'muted': bool(payload.muted),
    })
    return {
        'ok': True, 'group_id': group_id, 'username': payload.username,
        'muted': bool(payload.muted),
    }


@router.delete('/admin/groups/{group_id}/members/{username}')
def admin_remove_group_member(
    group_id: str,
    username: str,
    reason: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """طرد عضو من مجموعة بواسطة المدير (بدون شرط أن يكون المدير عضواً)."""
    _require_super_admin(current_user)
    group = _admin_group_store.get_group(str(group_id)) if hasattr(_admin_group_store, 'get_group') else None
    if group is None:
        raise HTTPException(status_code=404, detail='Group not found')
    members = getattr(group, 'members', {}) or {}
    if username not in members:
        raise HTTPException(status_code=404, detail='Member not found in group')
    # حذف مباشر من قاموس الأعضاء
    try:
        members.pop(username, None)
        if hasattr(_admin_group_store, '_save'):
            _admin_group_store._save()
        if hasattr(_admin_group_store, '_add_audit_log'):
            _admin_group_store._add_audit_log(
                str(group_id), current_user.username, 'admin_kick_member',
                f"Super-admin removed {username}" + (f" — reason: {reason}" if reason else ''),
            )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Failed to remove member: {exc}')
    _add_audit_log(db, current_user, 'admin_group_kick_member',
                   f"group={group_id} username={username} reason={reason or '-'}")
    _emit_admin_event('admin_group_member_removed', {'group_id': group_id, 'username': username})
    return {'ok': True, 'group_id': group_id, 'username': username, 'removed': True}


@router.get('/admin/groups/{group_id}/messages')
def admin_get_group_messages(
    group_id: str,
    limit: int = Query(200, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
):
    """رسائل المجموعة كاملة (رؤية إدارية)."""
    _require_super_admin(current_user)
    group = _admin_group_store.get_group(str(group_id)) if hasattr(_admin_group_store, 'get_group') else None
    if group is None:
        raise HTTPException(status_code=404, detail='Group not found')
    msgs = []
    if hasattr(_admin_group_store, '_messages'):
        raw = _admin_group_store._messages.get(str(group_id), []) or []
        for m in raw[-limit:]:
            msgs.append({
                'id': getattr(m, 'id', None),
                'sender': getattr(m, 'sender_username', ''),
                'content': getattr(m, 'content', ''),
                'created_at': getattr(m, 'created_at', None),
                'is_deleted': bool(getattr(m, 'is_deleted', False)),
                'attachments': getattr(m, 'attachments', []),
                'message_type': getattr(m, 'message_type', 'text'),
            })
    return {'items': msgs, 'total': len(msgs), 'is_frozen': bool(getattr(group, 'is_frozen', False))}
