from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text

from app.db.base import Base


class Message(Base):
    __tablename__ = 'messages'

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    content = Column(Text, nullable=False, default='')
    media_url = Column(Text, nullable=True)
    message_type = Column(String(20), nullable=False, default='text')
    is_delivered = Column(Boolean, default=False, nullable=False)
    is_seen = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
