from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta
from io import BytesIO
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
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
from app.core.live_store import live_store
from app.core.security import hash_password, verify_password
from app.core.socket_server import sio
from app.models.app_setting import AppSetting
from app.models.audit_log import AuditLog
from app.models.comment import Comment
from app.models.message import Message
from app.models.notification import Notification
from app.models.post import Post
from app.models.user import User

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
        'live.manage',
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
        'live.manage',
        'search.global',
    ],
    'user': [],
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
}


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


class LiveFeaturePayload(BaseModel):
    featured: bool | None = None


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


def _get_setting(db: Session, key: str, default: dict[str, Any]) -> dict[str, Any]:
    record = db.query(AppSetting).filter(AppSetting.key == key).first()
    if record is None:
        record = AppSetting(key=key, value=default)
        db.add(record)
        db.commit()
        db.refresh(record)
    return record.value if isinstance(record.value, dict) else default


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
    livekit_ready = bool(settings.LIVEKIT_URL and settings.LIVEKIT_API_KEY and settings.LIVEKIT_API_SECRET)
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
            'key': 'livekit',
            'label': 'خدمة البث المباشر',
            'status': 'healthy' if livekit_ready else 'warning',
            'value': settings.LIVEKIT_URL or 'غير مفعّل',
            'description': 'ربط البث المباشر جاهز عند وجود مفاتيح LiveKit الكاملة.',
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

    recent_activity = [
        {
            'id': log.id or index + 1,
            'title': log.action.replace('_', ' ').title(),
            'description': log.description,
            'entity_type': log.entity_type,
            'entity_id': log.entity_id,
            'created_at': log.created_at.isoformat() if log.created_at else now.isoformat(),
        }
        for index, log in enumerate(recent_logs)
    ]

    service_health = _service_health_snapshot(db)
    platform_links = _platform_links()
    live_overview = live_store.admin_overview()
    admins_online = _room_members_count('admins')
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
        {
            'level': 'info' if live_overview['stats']['active_rooms'] else 'warning',
            'title': 'البث المباشر',
            'description': f"يوجد {live_overview['stats']['active_rooms']} بث نشط و{live_overview['stats']['current_viewers']} مشاهد حالياً.",
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
            'key': 'today',
            'label': 'عمليات اليوم',
            'value': int(today_operations),
            'description': 'إجمالي منشورات وتعليقات ورسائل اليوم بشكل لحظي.',
        },
        {
            'key': 'live',
            'label': 'بثوث مباشرة',
            'value': int(live_overview['stats']['active_rooms']),
            'description': 'عدد غرف البث النشطة المتاحة حالياً داخل المنصة.',
        },
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
            'live_overview': live_overview,
            'today_posts': int(today_posts),
            'today_comments': int(today_comments),
            'today_messages': int(today_messages),
            'today_users': int(today_users),
            'admins_online': int(admins_online),
            'web_connected': any(item['key'] == 'frontend' and item['status'] == 'linked' for item in platform_links),
            'mobile_connected': any(item['key'] == 'mobile' and item['status'] == 'linked' for item in platform_links),
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
        'items': [_serialize_user(user) for user in items],
        'pagination': {
            'page': page,
            'page_size': page_size,
            'total': total,
            'pages': max((total + page_size - 1) // page_size, 1),
        },
    }


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
    _emit_admin_event('admin:user_updated', {'user': _serialize_user(user)})
    return _serialize_user(user)


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
    _emit_admin_event('admin:user_status_changed', {'user': _serialize_user(user)})
    return _serialize_user(user)


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


@router.get('/settings')
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_permission(current_user, 'settings.manage')
    return {
        'general': _get_setting(db, 'general', DEFAULT_SETTINGS),
        'profile': _serialize_user(current_user),
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


@router.get('/live/overview')
def get_live_admin_overview(current_user: User = Depends(get_current_user)):
    _require_permission(current_user, 'live.manage')
    overview = live_store.admin_overview()
    rooms = overview['rooms']
    summary_cards = [
        {'key': 'active_rooms', 'label': 'الغرف النشطة', 'value': overview['stats']['active_rooms']},
        {'key': 'featured_rooms', 'label': 'الغرف المميزة', 'value': overview['stats']['featured_rooms']},
        {'key': 'current_viewers', 'label': 'المشاهدون الآن', 'value': overview['stats']['current_viewers']},
        {'key': 'comments_count', 'label': 'تعليقات البث', 'value': overview['stats']['comments_count']},
        {'key': 'hearts_count', 'label': 'القلوب', 'value': overview['stats']['hearts_count']},
        {'key': 'top_peak_viewers', 'label': 'أعلى ذروة مشاهدة', 'value': overview['stats']['top_peak_viewers']},
    ]
    attention_queue = [
        {
            'key': room['id'],
            'title': room['title'],
            'description': (
                f"{room['viewer_count']} مشاهد الآن • {room['comments_count']} تعليق • آخر نشاط "
                f"{room['last_activity_at'] or room['created_at']}"
            ),
            'featured': room['featured'],
            'has_pinned_comment': bool(room.get('pinned_comment')),
        }
        for room in rooms[:8]
    ]
    return {
        'stats': overview['stats'],
        'summary_cards': summary_cards,
        'attention_queue': attention_queue,
        'rooms': rooms,
        'generated_at': datetime.utcnow().isoformat(),
    }


@router.post('/live/{room_id}/feature')
def feature_live_room(
    room_id: str,
    payload: LiveFeaturePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'live.manage')
    try:
        room = live_store.toggle_featured(room_id, payload.featured)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    _add_audit_log(db, current_user, 'live_featured', 'live_room', room_id, 'تم تحديث حالة تمييز البث المباشر.', {'featured': room['featured']})
    _emit_admin_event('admin:live_updated', {'room': room})
    return room


@router.post('/live/{room_id}/pin-latest')
def pin_latest_live_comment(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'live.manage')
    try:
        room = live_store.pin_latest_comment(room_id)
    except KeyError as exc:
        detail = 'Live room not found' if 'Room' in str(exc) else 'No comments available to pin'
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
    _add_audit_log(db, current_user, 'live_comment_pinned', 'live_room', room_id, 'تم تثبيت آخر تعليق داخل غرفة البث.', {'pinned_comment': room.get('pinned_comment')})
    _emit_admin_event('admin:live_updated', {'room': room})
    return room


@router.post('/live/{room_id}/end')
def end_live_room_admin(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_permission(current_user, 'live.manage')
    room = live_store.end_room(room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    _add_audit_log(db, current_user, 'live_ended_admin', 'live_room', room_id, 'تم إنهاء البث المباشر من لوحة التحكم.', {})
    _emit_admin_event('admin:live_updated', {'room': room})
    return room


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
                'type': notification.type,
                'title': notification.title,
                'body': notification.body,
                'username': username,
                'is_read': notification.is_read,
                'created_at': notification.created_at.isoformat() if notification.created_at else None,
            }
            for notification, username in notifications
        ]
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
    for user in recipients:
        db.add(
            Notification(
                user_id=user.id,
                type=payload.type.upper(),
                title=payload.title,
                body=payload.body,
                data={'broadcast': True, 'target_role': payload.target_role},
            )
        )
        created += 1
    db.commit()
    _add_audit_log(db, current_user, 'notification_broadcast', 'notification', 'broadcast', f'تم إرسال إشعار جماعي إلى {created} مستخدم.', {'target_role': payload.target_role})
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


@router.get('/reports/summary')
def get_report_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_permission(current_user, 'reports.view')
    users = db.query(func.count(User.id)).scalar() or 0
    active = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0
    posts = db.query(func.count(Post.id)).scalar() or 0
    comments = db.query(func.count(Comment.id)).scalar() or 0
    messages = db.query(func.count(Message.id)).scalar() or 0
    per_role = db.query(User.role, func.count(User.id)).group_by(User.role).all()
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
