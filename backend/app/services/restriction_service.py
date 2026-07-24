"""
v88.53 — خدمة القيود الإدارية الموحّدة
=======================================
تدير هذه الخدمة إنشاء/تمديد/إلغاء القيود من نوع UserRestriction
وترسل الإشعار المناسب للمستخدم بلغة الطلب (مع زر "طلب مراجعة").

كل نوع قيد له نص إشعار موحّد:
  - comment_mute        → "قامت الإدارة بكتم حسابكم من التعليق على أي منشور
                          لمدة 24 ساعة قابلة للتمديد إذا تكرر ما قمت به سابقاً
                          وبناءً على البلاغات المقدمة."
  - post_ban            → 48 ساعة، ...
  - reels_ban           → يومان، ...
  - groups_join_ban     → أسبوع، ...
  - story_ban           → يومان، ...
  - dm_strangers_ban    → سارٍ حتى تنظر فيه الإدارة، ...

كل نوع يحمل زر "طلب مراجعة" ويعرض حقلاً لإرسال نص الطلب إلى الإدارة.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User
from app.models.user_restriction import (
    DEFAULT_DURATION_MINUTES,
    RESTRICTION_TYPES,
    UserRestriction,
)


# ---------------------------------------------------------------------------
# نصوص الإشعارات لكل نوع قيد — كما طلبها المستخدم حرفياً.
# ---------------------------------------------------------------------------

RESTRICTION_MESSAGES: dict[str, dict[str, str]] = {
    'comment_mute': {
        'title': 'تنبيه إداري — كتم التعليق',
        'body': (
            'قامت الإدارة بكتم حسابكم من التعليق على أي منشور لمدة '
            'أربع وعشرين ساعة قابلة للتمديد إذا تكرر ما قمت به سابقاً '
            'وبناءً على البلاغات المقدمة.'
        ),
    },
    'post_ban': {
        'title': 'تنبيه إداري — حظر النشر',
        'body': (
            'قامت الإدارة بحظر حسابكم من النشر لمدة 48 ساعة بناءً على '
            'البلاغات المقدمة ضدكم، فتكرّموا بالالتزام بكافة الشروط '
            'المنصوص عليها قانوناً تجنّباً لمضاعفة مدة الحظر.'
        ),
    },
    'reels_ban': {
        'title': 'تنبيه إداري — حظر رفع الريلز',
        'body': (
            'قامت الإدارة بكتم حسابكم من رفع ريلز نظراً للبلاغات المقدمة '
            'لمدة يومين، لتجنّب ذلك تقيّد بالشروط المنصوص عليها قانوناً.'
        ),
    },
    'groups_join_ban': {
        'title': 'تنبيه إداري — حظر الانضمام للمجموعات',
        'body': (
            'قامت الإدارة بحظر انضمامكم إلى أي مجموعة لمدة أسبوع نظراً '
            'للبلاغات المقدمة ضدكم، تقيّد بقانون المنصة لتفادي مضاعفة الحظر.'
        ),
    },
    'story_ban': {
        'title': 'تنبيه إداري — حظر رفع الستوري',
        'body': (
            'قامت الإدارة بحظر حسابكم من رفع قصة لمدة يومين نظراً '
            'للبلاغات المقدمة ضدكم، لتفادي الحظر وعدم مضاعفة مدة الحظر '
            'التزم بالشروط المتفق عليها.'
        ),
    },
    'dm_strangers_ban': {
        'title': 'تنبيه إداري — حظر المراسلة العشوائية',
        'body': (
            'قامت الإدارة بحظر حسابكم من المراسلة العشوائية والإزعاج '
            'بناءً على البلاغات المقدمة ضدكم، مدة الحظر سارية إلى أن '
            'يُنظر بها من قبل الإدارة.'
        ),
    },
}


# ---------------------------------------------------------------------------
# دوال مساعدة
# ---------------------------------------------------------------------------

def _count_previous_repeats(db: Session, user_id: int, restriction_type: str) -> int:
    """عدد المرات السابقة لنفس النوع لهذا المستخدم (لحساب المضاعفة)."""
    return (
        db.query(UserRestriction)
        .filter(
            UserRestriction.user_id == user_id,
            UserRestriction.restriction_type == restriction_type,
        )
        .count()
    )


def _get_active_restriction(
    db: Session, user_id: int, restriction_type: str
) -> Optional[UserRestriction]:
    """يعيد القيد الساري حالياً لهذا المستخدم من هذا النوع إن وجد."""
    now = datetime.utcnow()
    q = (
        db.query(UserRestriction)
        .filter(
            UserRestriction.user_id == user_id,
            UserRestriction.restriction_type == restriction_type,
            UserRestriction.is_active.is_(True),
        )
    )
    for row in q.all():
        if row.expires_at is None or row.expires_at > now:
            return row
    return None


def _build_notification_body(
    restriction_type: str, duration_minutes: Optional[int], repeat_count: int
) -> tuple[str, str]:
    """يعيد (title, body) — يضيف تلقائياً ملاحظة المضاعفة عند التكرار."""
    meta = RESTRICTION_MESSAGES.get(restriction_type) or {
        'title': 'تنبيه إداري',
        'body': 'قامت الإدارة بفرض قيد على حسابكم.',
    }
    title = meta['title']
    body = meta['body']
    if repeat_count >= 1 and duration_minutes:
        body += f' (تمت مضاعفة مدة الحظر بسبب تكرار المخالفة، المدة الحالية ≈ {duration_minutes // 60} ساعة).'
    return title, body


# ---------------------------------------------------------------------------
# الواجهة العامة
# ---------------------------------------------------------------------------

def apply_restriction(
    db: Session,
    *,
    user_id: int,
    restriction_type: str,
    imposed_by: User | None = None,
    reason: str | None = None,
    related_report_ids: str | None = None,
    duration_minutes: int | None = None,
) -> UserRestriction:
    """
    يفرض قيداً على مستخدم:
      • يُنشئ سجل UserRestriction.
      • يضاعف المدة تلقائياً عند التكرار.
      • يُنشئ إشعاراً من نوع RESTRICTION_<TYPE> يتضمن زر "طلب مراجعة".
    """
    if restriction_type not in RESTRICTION_TYPES:
        raise ValueError(f'Unknown restriction_type: {restriction_type}')

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise ValueError('User not found')

    # حساب المدة الفعلية
    base_duration = DEFAULT_DURATION_MINUTES.get(restriction_type)
    prev_repeats = _count_previous_repeats(db, user_id, restriction_type)
    if duration_minutes is None:
        if base_duration is None:
            actual_duration = None  # سارٍ حتى فك يدوي (مثل dm_strangers_ban)
        else:
            # مضاعفة تلقائية: base * 2^repeat_count
            multiplier = 2 ** prev_repeats if prev_repeats > 0 else 1
            actual_duration = base_duration * multiplier
    else:
        actual_duration = int(duration_minutes)

    expires_at = None
    if actual_duration is not None:
        expires_at = datetime.utcnow() + timedelta(minutes=actual_duration)

    # إغلاق أي قيد نشط سابق من نفس النوع (لتفادي الازدواج)
    active_prev = _get_active_restriction(db, user_id, restriction_type)
    if active_prev is not None:
        active_prev.is_active = False
        active_prev.lifted_at = datetime.utcnow()
        active_prev.lifted_by_username = (
            imposed_by.username if imposed_by else 'system:replaced'
        )

    restriction = UserRestriction(
        user_id=user_id,
        restriction_type=restriction_type,
        imposed_by_id=imposed_by.id if imposed_by else None,
        imposed_by_username=imposed_by.username if imposed_by else None,
        reason=(reason or '')[:500] or None,
        related_report_ids=(related_report_ids or '')[:500] or None,
        base_duration_minutes=base_duration,
        duration_minutes=actual_duration,
        repeat_count=prev_repeats,
        is_active=True,
        created_at=datetime.utcnow(),
        expires_at=expires_at,
        appeal_status='none',
    )
    db.add(restriction)
    db.flush()  # لضمان الحصول على id

    # تحديث الحقول التوافقية على User لبعض الأنواع
    if restriction_type == 'comment_mute':
        # نستخدم حقل chat_muted_until الموجود مسبقاً كمرجع سريع لكتم التعليق أيضاً
        pass  # سنعتمد على UserRestriction حصراً لتفادي التعارض مع كتم الشات

    # إنشاء الإشعار
    title, body = _build_notification_body(
        restriction_type, actual_duration, prev_repeats
    )
    notification = Notification(
        user_id=user_id,
        type=f'RESTRICTION_{restriction_type.upper()}',
        title=title,
        body=body,
        data={
            'restriction_id': restriction.id,
            'restriction_type': restriction_type,
            'expires_at': expires_at.isoformat() if expires_at else None,
            'duration_minutes': actual_duration,
            'repeat_count': prev_repeats,
            'reason': reason or '',
            'appeal_enabled': True,
            'appeal_status': 'none',
            'screen': 'restriction',
            'path': f'/notifications/restriction/{restriction.id}',
        },
    )
    db.add(notification)
    db.flush()

    restriction.notification_id = notification.id
    db.commit()
    db.refresh(restriction)
    return restriction


def lift_restriction(
    db: Session, restriction_id: int, lifted_by: User | None = None
) -> UserRestriction | None:
    """إلغاء قيد قبل انتهاء مدته."""
    r = db.query(UserRestriction).filter(UserRestriction.id == restriction_id).first()
    if not r:
        return None
    r.is_active = False
    r.lifted_at = datetime.utcnow()
    r.lifted_by_username = lifted_by.username if lifted_by else 'system'
    db.commit()
    db.refresh(r)
    return r


def is_user_restricted(db: Session, user_id: int, restriction_type: str) -> bool:
    """يستخدم من طبقات الـ API لمنع فعل معيّن (تعليق/نشر/ريلز/ستوري/انضمام/DM)."""
    return _get_active_restriction(db, user_id, restriction_type) is not None


def get_active_restrictions(db: Session, user_id: int) -> list[UserRestriction]:
    """قائمة القيود السارية على مستخدم — للعرض في صفحة الإشعارات/البروفايل."""
    now = datetime.utcnow()
    rows = (
        db.query(UserRestriction)
        .filter(
            UserRestriction.user_id == user_id,
            UserRestriction.is_active.is_(True),
        )
        .all()
    )
    return [r for r in rows if r.expires_at is None or r.expires_at > now]


# ---------------------------------------------------------------------------
# طلبات المراجعة
# ---------------------------------------------------------------------------

def submit_appeal(
    db: Session, *, restriction_id: int, user_id: int, message: str
) -> UserRestriction:
    """المستخدم يرسل طلب مراجعة — يُخزَّن ويُرسل للإدارة كرسالة."""
    r = db.query(UserRestriction).filter(UserRestriction.id == restriction_id).first()
    if not r:
        raise ValueError('Restriction not found')
    if r.user_id != user_id:
        raise PermissionError('Not your restriction')
    if r.appeal_status == 'pending':
        raise ValueError('Appeal already pending')

    r.appeal_status = 'pending'
    r.appeal_message = (message or '')[:2000]
    r.appeal_submitted_at = datetime.utcnow()

    # تحديث الإشعار الموجود عند المستخدم ليعكس أن الطلب أُرسل
    if r.notification_id:
        notif = db.query(Notification).filter(Notification.id == r.notification_id).first()
        if notif:
            data = dict(notif.data or {})
            data['appeal_status'] = 'pending'
            data['appeal_submitted_at'] = r.appeal_submitted_at.isoformat()
            notif.data = data

    # إرسال إشعار للإدارة (لكل الأدمنز) كرسالة "طلب مراجعة"
    admins = (
        db.query(User)
        .filter(User.role.in_(['admin', 'moderator']))
        .all()
    )
    for admin in admins:
        db.add(Notification(
            user_id=admin.id,
            type='ADMIN_APPEAL_REQUEST',
            title='طلب مراجعة قيد إداري',
            body=(
                f'المستخدم @{db.query(User).get(user_id).username} '
                f'قدّم طلب مراجعة لقيد ({r.restriction_type}). '
                f'نص الطلب: {r.appeal_message[:120]}'
            ),
            data={
                'restriction_id': r.id,
                'target_user_id': user_id,
                'restriction_type': r.restriction_type,
                'appeal_message': r.appeal_message,
                'screen': 'admin_appeals',
                'path': f'/admin/appeals/{r.id}',
            },
        ))

    db.commit()
    db.refresh(r)
    return r


def resolve_appeal(
    db: Session,
    *,
    restriction_id: int,
    admin: User,
    response: str,
    accept: bool = False,
) -> UserRestriction:
    """الإدارة تردّ على طلب المراجعة (قبول/رفض) — يختفي الإشعار عند المستخدم."""
    r = db.query(UserRestriction).filter(UserRestriction.id == restriction_id).first()
    if not r:
        raise ValueError('Restriction not found')

    r.appeal_status = 'resolved'
    r.appeal_response = (response or '')[:2000]
    r.appeal_resolved_at = datetime.utcnow()
    r.appeal_resolved_by = admin.username if admin else None

    if accept:
        # القبول = رفع القيد فوراً
        r.is_active = False
        r.lifted_at = datetime.utcnow()
        r.lifted_by_username = admin.username if admin else 'admin'

    # حذف/تحديث إشعار المستخدم — نحذفه ليختفي من عنده كما طلب المستخدم
    if r.notification_id:
        notif = db.query(Notification).filter(Notification.id == r.notification_id).first()
        if notif:
            db.delete(notif)

    # إشعار جديد للمستخدم بنتيجة الطلب
    db.add(Notification(
        user_id=r.user_id,
        type='RESTRICTION_APPEAL_RESOLVED',
        title='رد الإدارة على طلب المراجعة',
        body=(
            f'تم قبول طلب مراجعتك ورفع القيد. ' if accept else 'تم النظر بطلب مراجعتك. '
        ) + (response or ''),
        data={
            'restriction_id': r.id,
            'restriction_type': r.restriction_type,
            'accepted': accept,
            'response': response,
            'screen': 'notifications',
            'path': '/notifications',
        },
    ))

    db.commit()
    db.refresh(r)
    return r
