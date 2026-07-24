"""
v88.53 — نظام قيود موحّد للحسابات (User Restrictions)
=====================================================
هذا الملف يضيف جدولاً موحّداً لتسجيل جميع أنواع الكتم/الحظر التي تفرضها
الإدارة على المستخدمين مع دعم:

- كتم من التعليق على أي منشور (comment_mute) — 24 ساعة قابلة للتمديد.
- حظر من رفع منشور (post_ban) — 48 ساعة.
- كتم من رفع الريلز (reels_ban) — يومان.
- حظر الانضمام إلى المجموعات (groups_join_ban) — أسبوع.
- حظر رفع الستوري (story_ban) — يومان.
- حظر مراسلة المجهولين/غير الأصدقاء (dm_strangers_ban) — سارٍ حتى تنظر
  فيه الإدارة.

كما يدعم الجدول تكرار المخالفة (repeat_count) بحيث تُضاعف مدة الحظر
تلقائياً عند تكرار الفعل، ويحمل حقولاً للتعامل مع طلبات المراجعة
(appeal_status/appeal_message).
"""
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, Integer, String, Text

from app.db.base import Base


# أنواع القيود المدعومة رسمياً — تُستخدم كثابت لتفادي الأخطاء الإملائية.
RESTRICTION_TYPES = (
    'comment_mute',       # كتم عن التعليق على أي منشور
    'post_ban',           # حظر رفع منشور
    'reels_ban',          # حظر رفع ريلز
    'groups_join_ban',    # حظر الانضمام إلى مجموعات
    'story_ban',          # حظر رفع ستوري
    'dm_strangers_ban',   # حظر مراسلة الغرباء/غير الأصدقاء
)

# المدة الافتراضية بالدقائق لكل نوع (المدة الأساسية قبل المضاعفة).
DEFAULT_DURATION_MINUTES = {
    'comment_mute':      60 * 24,          # 24 ساعة
    'post_ban':          60 * 48,          # 48 ساعة
    'reels_ban':         60 * 24 * 2,      # يومان
    'groups_join_ban':   60 * 24 * 7,      # أسبوع
    'story_ban':         60 * 24 * 2,      # يومان
    'dm_strangers_ban':  None,             # سارٍ حتى إلغاء الإدارة
}


class UserRestriction(Base):
    """قيد إداري مفروض على مستخدم لنوع محدد من النشاط."""

    __tablename__ = 'user_restrictions'
    __table_args__ = (
        Index('ix_user_restrictions_user_type_active', 'user_id', 'restriction_type', 'is_active'),
        Index('ix_user_restrictions_until', 'expires_at'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    # نوع القيد من ضمن RESTRICTION_TYPES.
    restriction_type = Column(String(40), nullable=False, index=True)

    # هوية المسؤول الذي فرض القيد.
    imposed_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    imposed_by_username = Column(String(150), nullable=True)

    # سبب الحظر (اختياري).
    reason = Column(String(500), nullable=True)

    # مرجع البلاغات (JSON نصي أو معرّفات مفصولة بفواصل).
    related_report_ids = Column(String(500), nullable=True)

    # مدة الحظر الأصلية والحالية بالدقائق. تُخزَّن الأصلية لمعرفة كيفية
    # مضاعفتها عند التكرار.
    base_duration_minutes = Column(Integer, nullable=True)
    duration_minutes = Column(Integer, nullable=True)

    # عدد مرات تكرار هذا النوع من المخالفة لنفس المستخدم قبل الفرض الحالي.
    repeat_count = Column(Integer, default=0, nullable=False)

    # حالة القيد.
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True, index=True)
    lifted_at = Column(DateTime, nullable=True)
    lifted_by_username = Column(String(150), nullable=True)

    # نظام طلب المراجعة.
    #   'none'      → لم يقدم المستخدم طلباً بعد.
    #   'pending'   → أُرسل طلب مراجعة ولم تردّ الإدارة.
    #   'resolved'  → ردّت الإدارة (بقبول/رفض) وأغلق الإشعار على المستخدم.
    appeal_status = Column(String(20), default='none', nullable=False, index=True)
    appeal_message = Column(Text, nullable=True)
    appeal_submitted_at = Column(DateTime, nullable=True)
    appeal_response = Column(Text, nullable=True)
    appeal_resolved_at = Column(DateTime, nullable=True)
    appeal_resolved_by = Column(String(150), nullable=True)

    # الإشعار المرتبط بهذا القيد على جهة المستخدم (لإخفائه بعد الرد).
    notification_id = Column(Integer, nullable=True, index=True)

    @property
    def is_currently_active(self) -> bool:
        """هل القيد ساري المفعول الآن؟ (يأخذ في الحسبان expires_at)."""
        if not self.is_active:
            return False
        if self.expires_at is None:
            return True  # مثال: dm_strangers_ban حتى إلغاء الإدارة
        try:
            return datetime.utcnow() < self.expires_at
        except Exception:
            return False
