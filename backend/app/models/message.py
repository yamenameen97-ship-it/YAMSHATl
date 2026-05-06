from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint

from app.db.base import Base


class Message(Base):
    __tablename__ = 'messages'
    __table_args__ = (
        UniqueConstraint('sender_id', 'client_id', name='uq_messages_sender_client_id'),
        Index('ix_messages_sender_client_id', 'sender_id', 'client_id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    client_id = Column(String(80), nullable=True)
    content = Column(Text, nullable=False, default='')
    media_url = Column(Text, nullable=True)
    message_type = Column(String(20), nullable=False, default='text')
    is_delivered = Column(Boolean, default=False, nullable=False)
    delivered_at = Column(DateTime, nullable=True)
    is_seen = Column(Boolean, default=False, nullable=False)
    seen_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
