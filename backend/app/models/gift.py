from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Boolean, Index

from app.db.base import Base


class Gift(Base):
    """نموذج الهدايا المتاحة في النظام"""
    __tablename__ = 'gifts'
    __table_args__ = (
        Index('ix_gifts_name', 'name'),
        Index('ix_gifts_price', 'price'),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    emoji = Column(String(10), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Integer, nullable=False)  # السعر بالعملات
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class UserCoins(Base):
    """نموذج رصيد العملات للمستخدمين"""
    __tablename__ = 'user_coins'
    __table_args__ = (
        Index('ix_user_coins_user_id', 'user_id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    balance = Column(Integer, default=0, nullable=False)
    total_earned = Column(Integer, default=0, nullable=False)  # إجمالي الأرباح
    total_spent = Column(Integer, default=0, nullable=False)   # إجمالي الإنفاق
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class GiftTransaction(Base):
    """نموذج معاملات الهدايا"""
    __tablename__ = 'gift_transactions'
    __table_args__ = (
        Index('ix_gift_transactions_sender_id', 'sender_id'),
        Index('ix_gift_transactions_receiver_id', 'receiver_id'),
        Index('ix_gift_transactions_created_at', 'created_at'),
    )

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    gift_id = Column(Integer, ForeignKey('gifts.id', ondelete='CASCADE'), nullable=False)
    live_room_id = Column(String(100), nullable=True)  # معرف غرفة البث المباشر
    amount = Column(Integer, nullable=False)  # عدد الهدايا
    total_coins = Column(Integer, nullable=False)  # إجمالي العملات
    message = Column(Text, nullable=True)  # رسالة مع الهدية
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class LiveStreamRecording(Base):
    """نموذج تسجيلات البث المباشر"""
    __tablename__ = 'live_stream_recordings'
    __table_args__ = (
        Index('ix_live_stream_recordings_host_id', 'host_id'),
        Index('ix_live_stream_recordings_created_at', 'created_at'),
    )

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    room_id = Column(String(100), nullable=False, unique=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    video_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    duration = Column(Integer, nullable=False)  # بالثواني
    view_count = Column(Integer, default=0, nullable=False)
    like_count = Column(Integer, default=0, nullable=False)
    is_public = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
