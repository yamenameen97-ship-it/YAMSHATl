"""
نماذج مقاييس المنصة والإيرادات
==============================
- platform_metrics_daily : تجميعات يومية (Snapshot) لإحصائيات المنصة
- revenue_transactions   : معاملات الإيرادات الفعلية (مشتريات/اشتراكات/هدايا)
- post_views             : تتبع مشاهدات المنشورات
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, String, Text

from app.db.base import Base


class PlatformMetricsDaily(Base):
    """تجميعة يومية لإحصائيات المنصة — تتيح حساب التغير الشهري والـ trends بسهولة."""
    __tablename__ = 'platform_metrics_daily'
    # v85.3 fix: كان يوجد فهرسان بنفس الاسم (index=True على العمود + Index في
    # __table_args__) → create_all يفشل بـ DuplicateTable وينهار الـ transaction
    # فلا يُنشأ أي جدول آخر. الحل: إبقاء التعريف الصريح فقط (unique).
    __table_args__ = (
        Index('ix_platform_metrics_daily_date', 'date', unique=True),
    )

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False)  # بداية اليوم (00:00 UTC) — الفهرس معرَّف في __table_args__

    # Users
    total_users = Column(Integer, nullable=False, default=0)
    active_users = Column(Integer, nullable=False, default=0)
    new_users = Column(Integer, nullable=False, default=0)

    # Content
    total_posts = Column(Integer, nullable=False, default=0)
    total_reels = Column(Integer, nullable=False, default=0)
    total_stories = Column(Integer, nullable=False, default=0)
    total_comments = Column(Integer, nullable=False, default=0)
    total_messages = Column(Integer, nullable=False, default=0)

    # Engagement
    total_views = Column(Integer, nullable=False, default=0)
    total_likes = Column(Integer, nullable=False, default=0)
    total_shares = Column(Integer, nullable=False, default=0)

    # Revenue (USD cents to avoid float issues)
    revenue_cents = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class RevenueTransaction(Base):
    """معاملات إيرادات حقيقية (هدايا، اشتراكات، شراء عملات، إعلانات...)."""
    __tablename__ = 'revenue_transactions'
    __table_args__ = (
        Index('ix_revenue_transactions_created_at', 'created_at'),
        Index('ix_revenue_transactions_user_id', 'user_id'),
        Index('ix_revenue_transactions_source', 'source'),
    )

    id = Column(Integer, primary_key=True, index=True)
    # v85.3 fix: إزالة index=True من الأعمدة لأن الفهارس معرَّفة في __table_args__
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    # 'gift' | 'coins_purchase' | 'subscription' | 'ad' | 'other'
    source = Column(String(50), nullable=False, default='other')
    reference_id = Column(String(120), nullable=True)  # gift_transaction_id, order_id ...

    # المبلغ مخزن بالسنتات لتفادي float (USD * 100)
    amount_cents = Column(Integer, nullable=False, default=0)
    currency = Column(String(10), nullable=False, default='USD')

    # عدد العملات داخل التطبيق المرتبط بالمعاملة (للهدايا)
    coins = Column(Integer, nullable=False, default=0)

    description = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default='completed')  # completed|pending|refunded

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class PostView(Base):
    """تتبع مشاهدات المنشورات لإحصاء الـ views الكلية."""
    __tablename__ = 'post_views'
    __table_args__ = (
        Index('ix_post_views_post_id', 'post_id'),
        Index('ix_post_views_viewed_at', 'viewed_at'),
        Index('ix_post_views_user_id', 'user_id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    # v85.3 fix: إزالة index=True من الأعمدة لأن الفهارس معرَّفة في __table_args__
    post_id = Column(Integer, ForeignKey('posts.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    viewed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    duration_seconds = Column(Integer, nullable=False, default=0)
