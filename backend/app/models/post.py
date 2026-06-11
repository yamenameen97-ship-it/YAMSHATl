from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Text

from app.db.base import Base


class Post(Base):
    __tablename__ = 'posts'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    username = Column(Text, nullable=True)
    content = Column(Text, nullable=False, default='')
    content_html = Column(Text, nullable=True)
    media = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    media_json = Column(Text, nullable=True)
    hashtags_json = Column(Text, nullable=True)
    mentions_json = Column(Text, nullable=True)
    poll_options_json = Column(Text, nullable=True)
    is_draft = Column(Boolean, default=False, nullable=False, index=True)
    is_pinned = Column(Boolean, default=False, nullable=False, index=True)
    allow_comments = Column(Boolean, default=True, nullable=False)
    scheduled_at = Column(DateTime, nullable=True, index=True)
    published_at = Column(DateTime, nullable=True, index=True)
    pinned_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_edited_at = Column(DateTime, nullable=True)
    edit_count = Column(Integer, default=0, nullable=False)
    share_count = Column(Integer, default=0, nullable=False)
    save_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
