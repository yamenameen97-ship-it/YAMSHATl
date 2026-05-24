from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text

from app.db.base import Base


class Story(Base):
    __tablename__ = 'stories'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    media_url = Column(String(1000), nullable=False)
    caption = Column(Text, nullable=True)
    duration = Column(Integer, default=5, nullable=False)
    views_count = Column(Integer, default=0, nullable=False)
    replies_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=True, index=True)


class StoryView(Base):
    __tablename__ = 'story_views'

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey('stories.id', ondelete='CASCADE'), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    viewed_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class StoryReply(Base):
    __tablename__ = 'story_replies'

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey('stories.id', ondelete='CASCADE'), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    reply_type = Column(String(50), default='text', nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class Reel(Base):
    __tablename__ = 'reels'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    video_url = Column(String(1000), nullable=False)
    thumbnail_url = Column(String(1000), nullable=True)
    caption = Column(Text, nullable=True)
    category = Column(String(100), default='general', nullable=False, index=True)
    duration = Column(Integer, default=0, nullable=False)
    likes_count = Column(Integer, default=0, nullable=False)
    comments_count = Column(Integer, default=0, nullable=False)
    shares_count = Column(Integer, default=0, nullable=False)
    views_count = Column(Integer, default=0, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ReelLike(Base):
    __tablename__ = 'reel_likes'

    id = Column(Integer, primary_key=True, index=True)
    reel_id = Column(Integer, ForeignKey('reels.id', ondelete='CASCADE'), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class ReelComment(Base):
    __tablename__ = 'reel_comments'

    id = Column(Integer, primary_key=True, index=True)
    reel_id = Column(Integer, ForeignKey('reels.id', ondelete='CASCADE'), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    content = Column(Text, nullable=False)
    likes_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class ReelView(Base):
    __tablename__ = 'reel_views'

    id = Column(Integer, primary_key=True, index=True)
    reel_id = Column(Integer, ForeignKey('reels.id', ondelete='CASCADE'), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    viewed_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class SavedReel(Base):
    __tablename__ = 'saved_reels'

    id = Column(Integer, primary_key=True, index=True)
    reel_id = Column(Integer, ForeignKey('reels.id', ondelete='CASCADE'), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    saved_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
