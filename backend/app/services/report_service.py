"""
خدمة البلاغات — منطق العمل لإنشاء/معالجة/تجميع البلاغات،
وأخذ snapshot للمحتوى وقت البلاغ، وإرسال إشعارات للمشرفين.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Optional

from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.models.message import Message
from app.models.notification import Notification
from app.models.post import Post
from app.models.report import Report, ReportEvent
from app.models.user import User

# اختياري — قد لا يكون موجوداً في كل النسخ
try:
    from app.models.stories_reels import Reel, ReelComment, Story
except Exception:
    Reel = ReelComment = Story = None  # type: ignore

try:
    from app.models.group import Group, GroupPost
except Exception:
    Group = GroupPost = None  # type: ignore


REASON_LABELS_AR = {
    'abuse': 'إساءة وتنمر',
    'impersonation': 'انتحال شخصية',
    'inappropriate': 'محتوى غير لائق',
    'spam': 'محتوى مزعج (سبام)',
    'unwanted': 'محتوى غير مرغوب فيه',
    'hate_speech': 'خطاب كراهية',
    'violence': 'عنف',
    'nudity': 'محتوى إباحي / عُري',
    'self_harm': 'إيذاء النفس',
    'misinformation': 'معلومات مضللة',
    'scam': 'احتيال',
    'copyright': 'انتهاك حقوق ملكية',
    'other': 'سبب آخر',
}

# تصنيف الأولوية افتراضياً حسب السبب
PRIORITY_BY_REASON = {
    'self_harm': 'urgent',
    'violence': 'urgent',
    'nudity': 'high',
    'hate_speech': 'high',
    'impersonation': 'high',
    'scam': 'high',
    'abuse': 'normal',
    'inappropriate': 'normal',
    'misinformation': 'normal',
    'copyright': 'normal',
    'spam': 'low',
    'unwanted': 'low',
    'other': 'normal',
}


# ============================================================
# Helpers
# ============================================================
def reason_label(reason: str) -> str:
    return REASON_LABELS_AR.get(reason, reason)


def _safe_str(v: Any) -> Optional[str]:
    if v is None:
        return None
    try:
        return str(v)[:500]
    except Exception:
        return None


def build_snapshot(db: Session, target_type: str, target_id: str) -> tuple[dict, Optional[int]]:
    """
    أخذ snapshot للمحتوى وقت البلاغ + إرجاع owner_user_id إن أمكن.
    snapshot يبقى محفوظاً حتى لو حُذف المحتوى الأصلي.
    """
    snap: dict[str, Any] = {'target_type': target_type, 'target_id': target_id}
    owner_id: Optional[int] = None

    try:
        if target_type == 'post':
            obj = db.query(Post).filter(Post.id == int(target_id)).first()
            if obj:
                owner_id = obj.user_id
                snap.update({
                    'content': _safe_str(obj.content),
                    'media': _safe_str(obj.media),
                    'image_url': _safe_str(obj.image_url),
                    'username': _safe_str(obj.username),
                    'created_at': obj.updated_at.isoformat() if obj.updated_at else None,
                })

        elif target_type == 'comment':
            obj = db.query(Comment).filter(Comment.id == int(target_id)).first()
            if obj:
                owner_id = getattr(obj, 'user_id', None)
                snap.update({
                    'content': _safe_str(getattr(obj, 'content', None)),
                    'post_id': getattr(obj, 'post_id', None),
                })

        elif target_type == 'reel' and Reel is not None:
            obj = db.query(Reel).filter(Reel.id == int(target_id)).first()
            if obj:
                owner_id = getattr(obj, 'user_id', None)
                snap.update({
                    'caption': _safe_str(getattr(obj, 'caption', None)),
                    'video_url': _safe_str(getattr(obj, 'video_url', None)),
                    'thumbnail_url': _safe_str(getattr(obj, 'thumbnail_url', None)),
                })

        elif target_type == 'reel_comment' and ReelComment is not None:
            obj = db.query(ReelComment).filter(ReelComment.id == int(target_id)).first()
            if obj:
                owner_id = getattr(obj, 'user_id', None)
                snap.update({
                    'content': _safe_str(getattr(obj, 'content', None)),
                    'reel_id': getattr(obj, 'reel_id', None),
                })

        elif target_type == 'story' and Story is not None:
            obj = db.query(Story).filter(Story.id == int(target_id)).first()
            if obj:
                owner_id = getattr(obj, 'user_id', None)
                snap.update({
                    'media_url': _safe_str(getattr(obj, 'media_url', None)),
                    'caption': _safe_str(getattr(obj, 'caption', None)),
                })

        elif target_type in ('message', 'group_message'):
            obj = db.query(Message).filter(Message.id == int(target_id)).first()
            if obj:
                owner_id = getattr(obj, 'sender_id', None) or getattr(obj, 'user_id', None)
                snap.update({
                    'content': _safe_str(getattr(obj, 'content', None)),
                    'conversation_id': getattr(obj, 'conversation_id', None),
                    'group_id': getattr(obj, 'group_id', None),
                })

        elif target_type == 'user':
            obj = db.query(User).filter(User.id == int(target_id)).first()
            if obj:
                owner_id = obj.id
                snap.update({
                    'username': obj.username,
                    'email': obj.email,
                    'avatar': obj.avatar,
                    'role': obj.role,
                })

        elif target_type == 'group' and Group is not None:
            obj = db.query(Group).filter(Group.id == int(target_id)).first()
            if obj:
                owner_id = getattr(obj, 'owner_id', None) or getattr(obj, 'created_by', None)
                snap.update({
                    'name': _safe_str(getattr(obj, 'name', None)),
                    'description': _safe_str(getattr(obj, 'description', None)),
                })

    except Exception as e:
        snap['snapshot_error'] = str(e)[:200]

    return snap, owner_id


# ============================================================
# إنشاء بلاغ
# ============================================================
def create_report(
    db: Session,
    *,
    reporter_user_id: Optional[int],
    target_type: str,
    target_id: str,
    reason: str,
    details: Optional[str] = None,
    context: Optional[dict] = None,
) -> tuple[Report, bool]:
    """
    إنشاء بلاغ جديد. إذا كان نفس المستخدم قد أبلغ سابقاً عن نفس الكيان،
    نزيد العداد بدل إنشاء سجل مكرر. وإذا أبلغ مستخدم آخر، يُنشأ سجل جديد
    لكن نُحدّث عداد التكرار على نفس target.

    Returns: (report, is_new)
    """
    context = context or {}

    # 1) تكرار من نفس المُبلِّغ على نفس الكيان → نزيد العداد
    if reporter_user_id is not None:
        existing = (
            db.query(Report)
            .filter(
                Report.reporter_user_id == reporter_user_id,
                Report.target_type == target_type,
                Report.target_id == str(target_id),
                Report.status.in_(('pending', 'reviewing')),
            )
            .first()
        )
        if existing:
            existing.duplicate_count = (existing.duplicate_count or 0) + 1
            existing.updated_at = datetime.utcnow()
            db.add(ReportEvent(
                report_id=existing.id,
                actor_user_id=reporter_user_id,
                event_type='duplicate_merged',
                meta={'reason': reason},
            ))
            db.commit()
            db.refresh(existing)
            return existing, False

    # 2) إنشاء سجل جديد
    snapshot, owner_id = build_snapshot(db, target_type, str(target_id))
    priority = PRIORITY_BY_REASON.get(reason, 'normal')

    # عدّ كم مرة أُبلغ عن نفس الكيان (من مستخدمين مختلفين)
    same_target_count = (
        db.query(func.count(Report.id))
        .filter(
            Report.target_type == target_type,
            Report.target_id == str(target_id),
        )
        .scalar()
        or 0
    )

    # ترقية الأولوية تلقائياً عند تجاوز عتبات
    if same_target_count >= 10:
        priority = 'urgent'
    elif same_target_count >= 5 and priority == 'normal':
        priority = 'high'

    report = Report(
        reporter_user_id=reporter_user_id,
        target_type=target_type,
        target_id=str(target_id),
        target_owner_user_id=owner_id,
        reason=reason,
        details=details,
        priority=priority,
        status='pending',
        snapshot=snapshot,
        context=context,
        duplicate_count=same_target_count,
    )
    db.add(report)
    db.flush()

    # حدث الإنشاء
    db.add(ReportEvent(
        report_id=report.id,
        actor_user_id=reporter_user_id,
        event_type='created',
        meta={'reason': reason, 'target_type': target_type, 'target_id': str(target_id)},
    ))

    # إشعار للمشرفين الذين عندهم صلاحية reports.view
    try:
        admin_ids = [
            uid for (uid,) in db.query(User.id)
            .filter(User.role.in_(('admin', 'moderator', 'super_admin')))
            .all()
        ]
        title = '🚨 بلاغ جديد'
        body = f'بلاغ جديد على {target_type} — السبب: {reason_label(reason)}'
        for uid in admin_ids:
            db.add(Notification(
                user_id=uid,
                type='REPORT_NEW',
                title=title,
                body=body,
                data={
                    'report_id': report.id,
                    'target_type': target_type,
                    'target_id': str(target_id),
                    'reason': reason,
                    'priority': priority,
                },
            ))
    except Exception:
        pass

    db.commit()
    db.refresh(report)
    return report, True


# ============================================================
# تحديث بلاغ + اتخاذ إجراء
# ============================================================
def apply_action(
    db: Session,
    *,
    report: Report,
    actor_user_id: int,
    action: str,
    notes: Optional[str] = None,
    duration_hours: Optional[int] = None,
) -> dict:
    """
    اتخاذ إجراء على البلاغ. يحدّث status/action_taken ويضيف ReportEvent
    ويُطبّق التأثير على المستخدم/المحتوى عند الإمكان.
    """
    effect = {'action': action, 'applied': False}

    target_owner = None
    if report.target_owner_user_id:
        target_owner = db.query(User).filter(User.id == report.target_owner_user_id).first()

    if action == 'dismiss':
        report.status = 'dismissed'
        report.action_taken = 'dismissed'
        effect['applied'] = True

    elif action == 'remove_content':
        # نحاول حذف/إخفاء المحتوى حسب نوعه
        _soft_remove_content(db, report.target_type, report.target_id)
        report.status = 'resolved'
        report.action_taken = 'content_removed'
        effect['applied'] = True

    elif action == 'warn_user' and target_owner:
        db.add(Notification(
            user_id=target_owner.id,
            type='MODERATION_WARNING',
            title='⚠️ تحذير من فريق الإشراف',
            body=notes or 'تم رصد مخالفة على محتواك. يرجى الالتزام بسياسات المنصة.',
            data={'report_id': report.id},
        ))
        report.status = 'resolved'
        report.action_taken = 'user_warned'
        effect['applied'] = True

    elif action == 'mute_user' and target_owner:
        # كتم 24 ساعة افتراضياً
        hours = duration_hours or 24
        _mute_user(db, target_owner, hours)
        report.status = 'resolved'
        report.action_taken = f'user_muted_{hours}h'
        effect['applied'] = True

    elif action == 'suspend_user' and target_owner:
        hours = duration_hours or 24 * 7
        target_owner.is_active = False
        report.status = 'resolved'
        report.action_taken = f'user_suspended_{hours}h'
        effect['applied'] = True

    elif action == 'ban_user' and target_owner:
        target_owner.is_active = False
        target_owner.role = 'banned'
        report.status = 'resolved'
        report.action_taken = 'user_banned'
        effect['applied'] = True

    elif action == 'escalate':
        report.status = 'escalated'
        report.priority = 'urgent'
        report.action_taken = 'escalated'
        effect['applied'] = True

    report.handled_by_user_id = actor_user_id
    report.handled_at = datetime.utcnow()
    if notes:
        report.moderator_notes = notes

    db.add(ReportEvent(
        report_id=report.id,
        actor_user_id=actor_user_id,
        event_type='action_taken',
        note=notes,
        meta=effect,
    ))

    # إعلام المُبلِّغ بنتيجة بلاغه (إذا كان معروفاً)
    if report.reporter_user_id:
        db.add(Notification(
            user_id=report.reporter_user_id,
            type='REPORT_RESOLVED',
            title='✅ تمت معالجة بلاغك',
            body='قام فريق الإشراف بمراجعة بلاغك واتخاذ الإجراء المناسب. شكراً لمساعدتك في الحفاظ على مجتمع آمن.',
            data={'report_id': report.id, 'action': action},
        ))

    db.commit()
    db.refresh(report)
    return effect


def _soft_remove_content(db: Session, target_type: str, target_id: str) -> None:
    """إخفاء المحتوى من العرض العام."""
    try:
        if target_type == 'post':
            obj = db.query(Post).filter(Post.id == int(target_id)).first()
            if obj:
                obj.is_draft = True  # إخفاء من الفيد
        elif target_type == 'comment':
            obj = db.query(Comment).filter(Comment.id == int(target_id)).first()
            if obj and hasattr(obj, 'content'):
                obj.content = '[تم حذف هذا التعليق من قبل الإشراف]'
        elif target_type == 'reel' and Reel is not None:
            obj = db.query(Reel).filter(Reel.id == int(target_id)).first()
            if obj and hasattr(obj, 'is_active'):
                obj.is_active = False
        elif target_type == 'story' and Story is not None:
            obj = db.query(Story).filter(Story.id == int(target_id)).first()
            if obj:
                if hasattr(obj, 'is_active'):
                    obj.is_active = False
                if hasattr(obj, 'expires_at'):
                    obj.expires_at = datetime.utcnow()
        elif target_type in ('message', 'group_message'):
            obj = db.query(Message).filter(Message.id == int(target_id)).first()
            if obj and hasattr(obj, 'content'):
                obj.content = '[تم حذف هذه الرسالة من قبل الإشراف]'
    except Exception:
        db.rollback()


def _mute_user(db: Session, user: User, hours: int) -> None:
    """كتم مستخدم لمدة محددة (يستخدم UserMute إن وجد، وإلا notification)."""
    try:
        from app.models.user_mute import UserMute  # type: ignore
        mute = UserMute(
            user_id=user.id,
            muted_until=datetime.utcnow() + timedelta(hours=hours),
            reason='moderation',
        )
        db.add(mute)
    except Exception:
        pass

    db.add(Notification(
        user_id=user.id,
        type='MODERATION_MUTE',
        title='🔇 تم كتم حسابك مؤقتاً',
        body=f'تم كتم حسابك لمدة {hours} ساعة بسبب مخالفة سياسات المنصة.',
        data={'duration_hours': hours},
    ))


# ============================================================
# Stats
# ============================================================
def compute_stats(db: Session) -> dict:
    total = db.query(func.count(Report.id)).scalar() or 0
    by_status = dict(
        db.query(Report.status, func.count(Report.id))
        .group_by(Report.status)
        .all()
    )
    by_target = dict(
        db.query(Report.target_type, func.count(Report.id))
        .group_by(Report.target_type)
        .all()
    )
    by_reason = dict(
        db.query(Report.reason, func.count(Report.id))
        .group_by(Report.reason)
        .all()
    )
    now = datetime.utcnow()
    last_24h = db.query(func.count(Report.id)).filter(
        Report.created_at >= now - timedelta(hours=24)
    ).scalar() or 0
    last_7d = db.query(func.count(Report.id)).filter(
        Report.created_at >= now - timedelta(days=7)
    ).scalar() or 0

    return {
        'total': total,
        'pending': by_status.get('pending', 0),
        'reviewing': by_status.get('reviewing', 0),
        'resolved': by_status.get('resolved', 0),
        'dismissed': by_status.get('dismissed', 0),
        'escalated': by_status.get('escalated', 0),
        'by_target': by_target,
        'by_reason': by_reason,
        'last_24h': last_24h,
        'last_7d': last_7d,
    }


def serialize_report(db: Session, r: Report) -> dict:
    """تحويل البلاغ إلى dict مع توسيع المعلومات."""
    def _user_brief(uid):
        if not uid:
            return None
        u = db.query(User).filter(User.id == uid).first()
        if not u:
            return {'id': uid, 'username': '[محذوف]', 'avatar': None}
        return {'id': u.id, 'username': u.username, 'avatar': u.avatar}

    return {
        'id': r.id,
        'reporter': _user_brief(r.reporter_user_id),
        'target_type': r.target_type,
        'target_id': r.target_id,
        'target_owner': _user_brief(r.target_owner_user_id),
        'reason': r.reason,
        'reason_label': reason_label(r.reason),
        'details': r.details,
        'priority': r.priority,
        'status': r.status,
        'snapshot': r.snapshot or {},
        'context': r.context or {},
        'handled_by': _user_brief(r.handled_by_user_id),
        'handled_at': r.handled_at.isoformat() if r.handled_at else None,
        'moderator_notes': r.moderator_notes,
        'action_taken': r.action_taken,
        'duplicate_count': r.duplicate_count or 0,
        'created_at': r.created_at.isoformat() if r.created_at else None,
        'updated_at': r.updated_at.isoformat() if r.updated_at else None,
    }
