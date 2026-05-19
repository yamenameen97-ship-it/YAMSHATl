"""
نماذج التفاعلات مع المنشورات - Post Interactions Models
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum


class Like(Base):
    """نموذج اللايكات"""
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("post.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # العلاقات
    post = relationship("Post", back_populates="likes")
    user = relationship("User", back_populates="likes")

    def __repr__(self):
        return f"<Like(id={self.id}, post_id={self.post_id}, user_id={self.user_id})>"


class Comment(Base):
    """نموذج التعليقات"""
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("post.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    content = Column(Text, nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)  # للردود
    likes_count = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)

    # العلاقات
    post = relationship("Post", back_populates="comments")
    user = relationship("User", back_populates="comments")
    replies = relationship("Comment", remote_side=[id], backref="parent")

    def __repr__(self):
        return f"<Comment(id={self.id}, post_id={self.post_id}, user_id={self.user_id})>"


class Share(Base):
    """نموذج المشاركات"""
    __tablename__ = "shares"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("post.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    share_type = Column(String(50), default="internal")  # internal, external, link
    message = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # العلاقات
    post = relationship("Post", back_populates="shares")
    user = relationship("User", back_populates="shares")

    def __repr__(self):
        return f"<Share(id={self.id}, post_id={self.post_id}, user_id={self.user_id})>"


class SavedPost(Base):
    """نموذج المنشورات المحفوظة"""
    __tablename__ = "saved_posts"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("post.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    folder_id = Column(String(255), default="default")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # العلاقات
    post = relationship("Post", back_populates="saved_by")
    user = relationship("User", back_populates="saved_posts")

    def __repr__(self):
        return f"<SavedPost(id={self.id}, post_id={self.post_id}, user_id={self.user_id})>"


class PostHistory(Base):
    """نموذج سجل تعديلات المنشورات"""
    __tablename__ = "post_history"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("post.id"), index=True, nullable=False)
    content = Column(Text, nullable=True)
    content_html = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # العلاقات
    post = relationship("Post", back_populates="history")

    def __repr__(self):
        return f"<PostHistory(id={self.id}, post_id={self.post_id}, timestamp={self.timestamp})>"


class CommentLike(Base):
    """نموذج لايكات التعليقات"""
    __tablename__ = "comment_likes"

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("comments.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # العلاقات
    comment = relationship("Comment", backref="comment_likes")
    user = relationship("User", backref="comment_likes")

    def __repr__(self):
        return f"<CommentLike(id={self.id}, comment_id={self.comment_id}, user_id={self.user_id})>"
