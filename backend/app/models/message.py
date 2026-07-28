from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


class Message(Base):
    __tablename__ = 'messages'
    __table_args__ = (
        UniqueConstraint('sender_id', 'client_id', name='uq_messages_sender_client_id'),
        Index('ix_messages_sender_client_id', 'sender_id', 'client_id'),
        Index('ix_messages_conversation_pair', 'sender_id', 'receiver_id', 'id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    sender = Column(String(80), nullable=True)
    receiver = Column(String(80), nullable=True)
    client_id = Column(String(80), nullable=True)
    message = Column(Text, nullable=True)
    content = Column(Text, nullable=False, default='')
    media_url = Column(Text, nullable=True)
    message_type = Column(String(20), nullable=False, default='text')

    # حالة التسليم/القراءة
    is_delivered = Column(Boolean, default=False, nullable=False)
    delivered_at = Column(DateTime, nullable=True)
    is_seen = Column(Boolean, default=False, nullable=False)
    seen_at = Column(DateTime, nullable=True)

    # حذف
    deleted_at = Column(DateTime, nullable=True)
    deleted_for_everyone = Column(Boolean, default=False, nullable=False)

    # ربط متقدم (Reply / Forward / Edit / Recall)
    reply_to_id = Column(
        Integer,
        ForeignKey('messages.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )
    forwarded_from_id = Column(
        Integer,
        ForeignKey('messages.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )
    edited_at = Column(DateTime, nullable=True)
    is_edited = Column(Boolean, default=False, nullable=False)
    is_recalled = Column(Boolean, default=False, nullable=False)

    # الرسائل المختفية (disappearing messages)
    expires_at = Column(DateTime, nullable=True, index=True)

    # عدّاد سريع للتفاعلات
    reactions_count = Column(Integer, default=0, nullable=False)

    # ==========================================================
    # ✅ v88.87 — دعم نظام المشاركة (Share) الموثق لدى Yamshat
    # ==========================================================
    # link_card: بيانات كارت الرابط الغني (JSON نصي) — يُعرض في الشات والمجموعات.
    # verified_by_yamshat: الطابع الرسمي "موثق لدى Yamshat".
    # admin_source_*: بيانات المصدر الأصلية — لا تُعرض للمستخدمين،
    #   يقرأها لوحة الأدمن فقط (audit/tracing للمحتوى المُشارك).
    link_card = Column(Text, nullable=True)
    verified_by_yamshat = Column(Boolean, default=False, nullable=False, index=True)
    admin_source_platform = Column(String(60), nullable=True, index=True)
    admin_source_platform_name = Column(String(120), nullable=True)
    admin_source_url = Column(Text, nullable=True)
    admin_source_title = Column(Text, nullable=True)
    admin_source_text = Column(Text, nullable=True)
    admin_source_author = Column(String(200), nullable=True)
    admin_source_channel = Column(String(200), nullable=True)
    admin_source_captured_at = Column(DateTime, nullable=True)
    admin_source_share_mode = Column(String(20), nullable=True)  # 'link' | 'download'
    admin_source_download_size = Column(Integer, nullable=True)
    admin_source_download_mime = Column(String(120), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # علاقات
    reactions = relationship(
        'MessageReaction',
        backref='message',
        cascade='all, delete-orphan',
        lazy='dynamic',
    )
    attachments = relationship(
        'MessageAttachment',
        backref='message',
        cascade='all, delete-orphan',
        order_by='MessageAttachment.position',
        lazy='select',
    )
    reply_to = relationship(
        'Message',
        remote_side='Message.id',
        foreign_keys=[reply_to_id],
        post_update=True,
        uselist=False,
    )
