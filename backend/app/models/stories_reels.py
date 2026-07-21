from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.base import Base


def _expires_default():
    return datetime.utcnow() + timedelta(hours=24)


class Story(Base):
    """قصة على السحابة — v83.9 (Postgres, لا JSON محلي).

    كل الحقول التي كان يستخدمها story_store.json صارت أعمدة حقيقية على DB.
    """
    __tablename__ = 'stories'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    media_url = Column(String(1000), nullable=False)
    media_type = Column(String(16), default='image', nullable=False)  # image | video
    caption = Column(Text, nullable=True)
    duration = Column(Integer, default=5, nullable=False)

    # الخصوصية والميزات
    privacy = Column(String(24), default='friends', nullable=False, index=True)  # friends | close_friends | private
    music = Column(String(200), nullable=True)
    stickers = Column(Text, nullable=True)      # CSV
    mentions = Column(Text, nullable=True)      # CSV
    poll_question = Column(String(200), nullable=True)
    poll_options = Column(Text, nullable=True)  # CSV (max 4)
    poll_votes = Column(Text, nullable=True)    # JSON string: {"0": n, "1": n}
    poll_voters = Column(Text, nullable=True)   # JSON string: {"username": index}
    countdown_at = Column(String(64), nullable=True)
    filter_name = Column(String(80), nullable=True)
    drawing_data = Column(Text, nullable=True)  # حتى ~200KB
    is_close_friends = Column(Boolean, default=False, nullable=False)
    highlight = Column(Boolean, default=False, nullable=False, index=True)
    highlight_title = Column(String(80), nullable=True)
    reactions = Column(Text, nullable=True)     # JSON string: {"🔥": n}
    auto_delete_hours = Column(Integer, default=24, nullable=False)

    # عدادات مسبقة الحساب
    views_count = Column(Integer, default=0, nullable=False)
    replies_count = Column(Integer, default=0, nullable=False)
    reactions_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    expires_at = Column(DateTime, default=_expires_default, nullable=True, index=True)


class StoryView(Base):
    """سجل مشاهدة قصة — سطر لكل (story, user) فريد."""
    __tablename__ = 'story_views'

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey('stories.id', ondelete='CASCADE'), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    username = Column(String(150), nullable=True)  # للسرعة بدون JOIN
    viewed_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint('story_id', 'user_id', name='uq_story_views_story_user'),
    )


class StoryReply(Base):
    __tablename__ = 'story_replies'

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey('stories.id', ondelete='CASCADE'), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    username = Column(String(150), nullable=True)
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
    # v88.28 — تخزين سحابي دائم: نحفظ public_id/URL/نوع التخزين للريلز حتى لا نفقدها بعد إعادة النشر
    cloudinary_public_id = Column(String(255), nullable=True, index=True)
    cloudinary_video_public_id = Column(String(255), nullable=True)
    cloudinary_thumb_public_id = Column(String(255), nullable=True)
    storage_type = Column(String(32), default='local', nullable=False)  # cloudinary | persistent_disk | local
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ReelLike(Base):
    __tablename__ = 'reel_likes'

    id = Column(Integer, primary_key=True, index=True)
    reel_id = Column(Integer, ForeignKey('reels.id', ondelete='CASCADE'), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class ReelComment(Base):
    """v85.5 — توسيع جدول تعليقات الريلز لدعم الردود/الإخفاء/تاريخ التحديث."""
    __tablename__ = 'reel_comments'

    id = Column(Integer, primary_key=True, index=True)
    reel_id = Column(Integer, ForeignKey('reels.id', ondelete='CASCADE'), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    parent_id = Column(Integer, ForeignKey('reel_comments.id', ondelete='CASCADE'), nullable=True, index=True)
    username = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    likes_count = Column(Integer, default=0, nullable=False)
    is_hidden = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, nullable=True)


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
