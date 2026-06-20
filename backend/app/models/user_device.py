"""
نموذج أجهزة المستخدمين لإدارة رموز الإشعارات الفورية
User Devices Model - manages FCM/APNS/Web Push tokens per device.

يدعم:
- Android (FCM)
- iOS (APNS via FCM)
- Web (Web Push API + VAPID)
- Desktop (Web Push)
"""
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)

from app.db.base import Base


class UserDevice(Base):
    """
    جهاز مستخدم مسجَّل لتلقي الإشعارات الفورية.
    كل صف يمثّل قناة push واحدة على جهاز واحد لمستخدم واحد.
    """

    __tablename__ = "user_devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # معرّف الجهاز المُولَّد من العميل (UUID v4 يبقى ثابتاً عبر الجلسات)
    device_id = Column(String(128), nullable=False, index=True)

    # رمز الدفع: FCM token أو APNS أو Web Push endpoint
    push_token = Column(String(2048), nullable=False)

    # نوع المنصّة: android | ios | web | windows | macos | linux
    platform = Column(String(20), nullable=False, default="web", index=True)

    # نوع المزود: fcm | apns | webpush
    provider = Column(String(20), nullable=False, default="fcm")

    # مفاتيح Web Push (مطلوبة لمزود webpush فقط)
    web_push_p256dh = Column(String(255), nullable=True)
    web_push_auth = Column(String(255), nullable=True)

    # بيانات الجهاز للتشخيص
    device_name = Column(String(255), nullable=True)
    os_version = Column(String(50), nullable=True)
    app_version = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)

    # الحالة
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    notifications_enabled = Column(Boolean, default=True, nullable=False)

    # أوقات
    registered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_seen_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    last_push_at = Column(DateTime, nullable=True)

    # عدّاد الإخفاقات المتتالية لإلغاء التسجيل تلقائياً
    failure_count = Column(Integer, default=0, nullable=False)

    __table_args__ = (
        # نفس الجهاز + نفس الـtoken لا يجوز تكراره لنفس المستخدم
        UniqueConstraint("user_id", "device_id", "push_token", name="uq_user_device_token"),
        Index("ix_user_devices_active", "user_id", "is_active"),
    )
