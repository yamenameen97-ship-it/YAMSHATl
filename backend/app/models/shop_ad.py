"""
Shop Ad model — يخزّن إعلانات صفحة التسوق في قاعدة البيانات
حتى تظهر لجميع المشتركين وليس فقط لناشرها على متصفحه المحلي.

الإصلاح الجذري لمشكلة: "أنشر إعلاناً في صفحة التسوق فلا يظهر لدى المشتركين".
السبب السابق: صفحة Shop.jsx كانت تعتمد على localStorage فقط دون حفظ
الإعلان على الخادم. الآن أصبح لدينا جدول shop_ads يُشارك بين كل المستخدمين.

v89.29 ROOT FIX — إضافات:
  * حقول جرد المخزون اللحظي: stock, reserved, sold, low_stock_threshold
  * حقول ربط الدفع: payment_provider, external_ref
  * جدول ShopPaymentEvent لتخزين webhooks بشكل idempotent
  * حقول payment_status/payment_ref على ShopAdOrder
"""
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey, Index, Integer, Text, UniqueConstraint
)

from app.db.base import Base


class ShopAd(Base):
    __tablename__ = 'shop_ads'

    id = Column(Integer, primary_key=True, index=True)
    # ناشر الإعلان
    seller_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    seller_username = Column(Text, nullable=True, index=True)
    seller_name = Column(Text, nullable=True)

    # بيانات المنتج
    name = Column(Text, nullable=False)
    price = Column(Float, nullable=False, default=0.0)
    currency = Column(Text, nullable=False, default='USD')
    address = Column(Text, nullable=True, default='')
    description = Column(Text, nullable=True, default='')
    image = Column(Text, nullable=True, default='')  # URL أو data-url

    # حالة الإعلان
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)

    # تفاعلات (نخزنها كحقول رقمية + JSON لتفاصيل reactions)
    likes = Column(Integer, default=0, nullable=False)
    liked_by_json = Column(Text, nullable=False, default='[]')  # JSON array of usernames
    reactions_json = Column(Text, nullable=False, default='{}')  # JSON dict {key: count}

    # v89.29: جرد المخزون اللحظي (Concurrency-safe via SELECT ... FOR UPDATE)
    stock = Column(Integer, default=0, nullable=False)               # إجمالي المتاح
    reserved = Column(Integer, default=0, nullable=False)            # محجوز مؤقتاً بانتظار الدفع
    sold = Column(Integer, default=0, nullable=False)                # مباع بالفعل (بعد نجاح الدفع)
    low_stock_threshold = Column(Integer, default=0, nullable=False) # لتنبيه البائع
    track_inventory = Column(Boolean, default=False, nullable=False) # false = لا يوجد جرد (خدمة/رقمي غير محدود)

    # v89.29: بوابة الدفع الافتراضية لهذا الإعلان (stripe/paypal/tap/hyperpay/custom/none)
    payment_provider = Column(Text, nullable=True, default='none')
    external_ref = Column(Text, nullable=True)  # مرجع خارجي (product id في بوابة الدفع)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ShopAdOrder(Base):
    """طلبات الشراء — تُنشأ عند تقديم طلب وتُحدَّث تلقائياً بواسطة Payment Webhooks."""
    __tablename__ = 'shop_ad_orders'

    id = Column(Integer, primary_key=True, index=True)
    ad_id = Column(Integer, ForeignKey('shop_ads.id', ondelete='CASCADE'), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    buyer_username = Column(Text, nullable=True)

    buyer_name = Column(Text, nullable=True)
    contact = Column(Text, nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    message = Column(Text, nullable=True, default='')

    # pending / accepted / rejected / delivered / cancelled / refunded
    status = Column(Text, nullable=False, default='pending', index=True)
    replies_json = Column(Text, nullable=False, default='[]')

    # v89.29: مسار الدفع
    # unpaid / awaiting / paid / failed / refunded / expired
    payment_status = Column(Text, nullable=False, default='unpaid', index=True)
    payment_provider = Column(Text, nullable=True)      # stripe/paypal/tap/hyperpay/...
    payment_ref = Column(Text, nullable=True, index=True)   # PaymentIntent / Charge / Order id
    amount_total = Column(Float, nullable=False, default=0.0)
    currency = Column(Text, nullable=False, default='USD')
    idempotency_key = Column(Text, nullable=True, unique=True)  # لمنع تكرار الطلبات

    paid_at = Column(DateTime, nullable=True)
    refunded_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)   # موعد انتهاء الحجز إذا لم يكتمل الدفع

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ShopPaymentEvent(Base):
    """
    v89.29: سجل مؤمَّن لكل webhook دفع نستقبله.
    الغرض:
      1) idempotency: لا نعالج نفس event_id مرتين
      2) تدقيق: يبقى الـ payload الأصلي محفوظاً
      3) حماية: نتحقّق من التوقيع HMAC قبل تحديث الطلب
    """
    __tablename__ = 'shop_payment_events'

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(Text, nullable=False, index=True)     # stripe / paypal / tap / ...
    event_id = Column(Text, nullable=False)                 # id من مزوّد الدفع
    event_type = Column(Text, nullable=False)               # e.g. payment_intent.succeeded
    order_id = Column(Integer, ForeignKey('shop_ad_orders.id', ondelete='SET NULL'), nullable=True, index=True)
    payment_ref = Column(Text, nullable=True, index=True)
    signature_ok = Column(Boolean, default=False, nullable=False)
    processed = Column(Boolean, default=False, nullable=False, index=True)
    payload_json = Column(Text, nullable=False, default='{}')
    error = Column(Text, nullable=True)
    received_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    processed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint('provider', 'event_id', name='uq_shop_payment_events_provider_event'),
        Index('ix_shop_payment_events_provider_type', 'provider', 'event_type'),
    )
