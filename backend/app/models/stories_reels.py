"""
نماذج الستوري والريلز - Stories & Reels Models
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base


class Story(Base):
    """نموذج الستوري"""
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    media_url = Column(String(500), nullable=False)
    caption = Column(Text, nullable=True)
    duration = Column(Integer, default=5)  # بالثواني
    views_count = Column(Integer, default=0)
    replies_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    expires_at = Column(DateTime, nullable=True)

    # العلاقات
    user = relationship("User", back_populates="stories")
    views = relationship("StoryView", back_populates="story", cascade="all, delete-orphan")
    replies = relationship("StoryReply", back_populates="story", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Story(id={self.id}, user_id={self.user_id}, created_at={self.created_at})>"


class StoryView(Base):
    """نموذج مشاهدات الستوري"""
    __tablename__ = "story_views"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("stories.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    viewed_at = Column(DateTime, default=datetime.utcnow, index=True)

    # العلاقات
    story = relationship("Story", back_populates="views")
    user = relationship("User", back_populates="story_views")

    def __repr__(self):
        return f"<StoryView(id={self.id}, story_id={self.story_id}, user_id={self.user_id})>"


class StoryReply(Base):
    """نموذج ردود الستوري"""
    __tablename__ = "story_replies"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("stories.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    reply_type = Column(String(50), default="text")  # text, image
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # العلاقات
    story = relationship("Story", back_populates="replies")
    user = relationship("User", back_populates="story_replies")

    def __repr__(self):
        return f"<StoryReply(id={self.id}, story_id={self.story_id}, user_id={self.user_id})>"


class Reel(Base):
    """نموذج الريلز"""
    __tablename__ = "reels"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    video_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    caption = Column(Text, nullable=True)
    category = Column(String(100), default="general", index=True)
    duration = Column(Integer, default=0)  # بالثواني
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # العلاقات
    user = relationship("User", back_populates="reels")
    likes = relationship("ReelLike", back_populates="reel", cascade="all, delete-orphan")
    comments = relationship("ReelComment", back_populates="reel", cascade="all, delete-orphan")
    views = relationship("ReelView", back_populates="reel", cascade="all, delete-orphan")
    saved_by = relationship("SavedReel", back_populates="reel", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Reel(id={self.id}, user_id={self.user_id}, category={self.category})>"


class ReelLike(Base):
    """نموذج لايكات الريلز"""
    __tablename__ = "reel_likes"

    id = Column(Integer, primary_key=True, index=True)
    reel_id = Column(Integer, ForeignKey("reels.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # العلاقات
    reel = relationship("Reel", back_populates="likes")
    user = relationship("User", back_populates="reel_likes")

    def __repr__(self):
        return f"<ReelLike(id={self.id}, reel_id={self.reel_id}, user_id={self.user_id})>"


class ReelComment(Base):
    """نموذج تعليقات الريلز"""
    __tablename__ = "reel_comments"

    id = Column(Integer, primary_key=True, index=True)
    reel_id = Column(Integer, ForeignKey("reels.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    content = Column(Text, nullable=False)
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # العلاقات
    reel = relationship("Reel", back_populates="comments")
    user = relationship("User", back_populates="reel_comments")

    def __repr__(self):
        return f"<ReelComment(id={self.id}, reel_id={self.reel_id}, user_id={self.user_id})>"


class ReelView(Base):
    """نموذج مشاهدات الريلز"""
    __tablename__ = "reel_views"

    id = Column(Integer, primary_key=True, index=True)
    reel_id = Column(Integer, ForeignKey("reels.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    viewed_at = Column(DateTime, default=datetime.utcnow, index=True)

    # العلاقات
    reel = relationship("Reel", back_populates="views")
    user = relationship("User", back_populates="reel_views")

    def __repr__(self):
        return f"<ReelView(id={self.id}, reel_id={self.reel_id}, user_id={self.user_id})>"


class SavedReel(Base):
    """نموذج الريلز المحفوظة"""
    __tablename__ = "saved_reels"

    id = Column(Integer, primary_key=True, index=True)
    reel_id = Column(Integer, ForeignKey("reels.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    saved_at = Column(DateTime, default=datetime.utcnow, index=True)

    # العلاقات
    reel = relationship("Reel", back_populates="saved_by")
    user = relationship("User", back_populates="saved_reels")

    def __repr__(self):
        return f"<SavedReel(id={self.id}, reel_id={self.reel_id}, user_id={self.user_id})>"
