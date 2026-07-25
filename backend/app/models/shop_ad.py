"""
Shop Ad model — يخزّن إعلانات صفحة التسوق في قاعدة البيانات
حتى تظهر لجميع المشتركين وليس فقط لناشرها على متصفحه المحلي.

الإصلاح الجذري لمشكلة: "أنشر إعلاناً في صفحة التسوق فلا يظهر لدى المشتركين".
السبب السابق: صفحة Shop.jsx كانت تعتمد على localStorage فقط دون حفظ
الإعلان على الخادم. الآن أصبح لدينا جدول shop_ads يُشارك بين كل المستخدمين.
"""
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, Text

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

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ShopAdOrder(Base):
    """طلبات الشراء (كاش على الخادم — الرسالة الفعلية تُرسَل عبر الشات العادي)."""
    __tablename__ = 'shop_ad_orders'

    id = Column(Integer, primary_key=True, index=True)
    ad_id = Column(Integer, ForeignKey('shop_ads.id', ondelete='CASCADE'), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    buyer_username = Column(Text, nullable=True)

    buyer_name = Column(Text, nullable=True)
    contact = Column(Text, nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    message = Column(Text, nullable=True, default='')

    # pending / accepted / rejected / delivered
    status = Column(Text, nullable=False, default='pending', index=True)
    replies_json = Column(Text, nullable=False, default='[]')

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
