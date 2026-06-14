"""
نموذج البلاغات - Report Model
يدعم البلاغات على: المنشورات، الريلز، الستوري، التعليقات،
الرسائل، الغرف الصوتية، المستخدمين، المجموعات.
"""
from datetime import datetime

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)

from app.db.base import Base


# ============================================================
# أنواع الكيان المُبلَّغ عنه (Target Types)
# ============================================================
TARGET_TYPES = (
    'post',           # منشور
    'reel',           # ريلز
    'story',          # ستوري
    'comment',        # تعليق
    'reel_comment',   # تعليق ريلز
    'message',        # رسالة شات
    'group_message',  # رسالة مجموعة
    'user',           # حساب مستخدم
    'group',          # مجموعة
    'voice_room',     # غرفة صوتية
)

# ============================================================
# أسباب البلاغ (Reasons) - متطابقة مع أزرار الواجهة
# ============================================================
REPORT_REASONS = (
    'abuse',              # إساءة وتنمر
    'impersonation',      # انتحال شخصية
    'inappropriate',      # محتوى غير لائق
    'spam',               # محتوى مزعج
    'unwanted',           # محتوى غير مرغوب فيه
    'hate_speech',        # خطاب كراهية
    'violence',           # عنف
    'nudity',             # عُري
    'self_harm',          # إيذاء النفس
    'misinformation',     # معلومات مضللة
    'scam',               # احتيال
    'copyright',          # انتهاك حقوق
    'other',              # أخرى
)

# ============================================================
# حالات البلاغ
# ============================================================
REPORT_STATUSES = (
    'pending',     # قيد المراجعة
    'reviewing',   # تحت المراجعة من مشرف
    'resolved',    # تمت المعالجة
    'dismissed',   # تم الرفض/الإغلاق
    'escalated',   # تم التصعيد
)

REPORT_PRIORITIES = ('low', 'normal', 'high', 'urgent')


class Report(Base):
    """
    جدول البلاغات الموحّد لكل المحتوى داخل المنصة.
    """
    __tablename__ = 'reports'

    id = Column(Integer, primary_key=True, index=True)

    # المُبلِّغ
    reporter_user_id = Column(
        Integer,
        ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )

    # الكيان المُبلَّغ عنه (target_type + target_id)
    target_type = Column(String(40), nullable=False, index=True)
    target_id = Column(String(64), nullable=False, index=True)

    # صاحب المحتوى المُبلَّغ عنه (إن أمكن استنتاجه — يفيد في المعالجة الذكية)
    target_owner_user_id = Column(
        Integer,
        ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )

    # السبب الرئيسي + سبب إضافي اختياري
    reason = Column(String(40), nullable=False, index=True)
    details = Column(Text, nullable=True)  # شرح المستخدم بالنص الحر

    # تصنيف داخلي للمشرفين
    priority = Column(String(10), default='normal', nullable=False, index=True)
    status = Column(String(20), default='pending', nullable=False, index=True)

    # snapshot للمحتوى وقت البلاغ (يحمي ضد الحذف لاحقاً)
    snapshot = Column(JSON, nullable=False, default=dict)

    # سياق إضافي (IP, user-agent, app version...)
    context = Column(JSON, nullable=False, default=dict)

    # المعالجة
    handled_by_user_id = Column(
        Integer,
        ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )
    handled_at = Column(DateTime, nullable=True)
    moderator_notes = Column(Text, nullable=True)
    action_taken = Column(String(60), nullable=True)
    # القيم الممكنة: dismissed / content_removed / user_warned /
    # user_muted / user_suspended / user_banned / escalated

    # تجميع البلاغات المتكررة على نفس الكيان
    duplicate_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    __table_args__ = (
        # فهرس مركّب لتسريع تجميع البلاغات على نفس الكيان
        Index('ix_reports_target', 'target_type', 'target_id'),
        Index('ix_reports_status_priority', 'status', 'priority'),
    )

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'reporter_user_id': self.reporter_user_id,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'target_owner_user_id': self.target_owner_user_id,
            'reason': self.reason,
            'details': self.details,
            'priority': self.priority,
            'status': self.status,
            'snapshot': self.snapshot or {},
            'context': self.context or {},
            'handled_by_user_id': self.handled_by_user_id,
            'handled_at': self.handled_at.isoformat() if self.handled_at else None,
            'moderator_notes': self.moderator_notes,
            'action_taken': self.action_taken,
            'duplicate_count': self.duplicate_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class ReportEvent(Base):
    """
    سجل أحداث/مراسلات البلاغ — لإظهار تاريخ المعالجة في لوحة الأدمن.
    """
    __tablename__ = 'report_events'

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(
        Integer,
        ForeignKey('reports.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    actor_user_id = Column(
        Integer,
        ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )
    event_type = Column(String(40), nullable=False, index=True)
    # القيم: created / status_changed / priority_changed / note_added /
    # action_taken / reopened / duplicate_merged
    note = Column(Text, nullable=True)
    meta = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
