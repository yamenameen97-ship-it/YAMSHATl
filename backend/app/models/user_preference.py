from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from app.db.base import Base


class UserPreference(Base):
    __tablename__ = 'user_preferences'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    language = Column(String(10), nullable=False, default='ar')
    chat_translation_enabled = Column(Boolean, nullable=False, default=True)
    
    # Notification Settings
    notify_messages = Column(Boolean, default=True, nullable=False)
    notify_groups = Column(Boolean, default=True, nullable=False)
    notify_posts = Column(Boolean, default=True, nullable=False)
    notify_reels = Column(Boolean, default=True, nullable=False)
    notify_stories = Column(Boolean, default=True, nullable=False)
    notify_live = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False, onupdate=datetime.utcnow)
