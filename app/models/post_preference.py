from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, Index

from app.db.base import Base


class PostPreference(Base):
    """
    Cloud-persisted per-user preferences for individual posts.
    Replaces the localStorage-only 'hidden/archived/muted/reported' state.
    """
    __tablename__ = 'post_preferences'
    __table_args__ = (
        UniqueConstraint('user_id', 'post_id', name='uq_post_preferences_user_post'),
        Index('ix_post_preferences_user_flags', 'user_id', 'is_hidden', 'is_archived'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey('posts.id', ondelete='CASCADE'), nullable=False, index=True)

    is_hidden = Column(Boolean, nullable=False, default=False, index=True)
    is_archived = Column(Boolean, nullable=False, default=False, index=True)
    is_muted_author = Column(Boolean, nullable=False, default=False)
    is_reported = Column(Boolean, nullable=False, default=False)
    report_reason = Column(String(200), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False, onupdate=datetime.utcnow)


class CommentReaction(Base):
    """
    Cloud-persisted per-user reactions on comments (emoji-based).
    Replaces the local-only handleCommentReaction() state.
    """
    __tablename__ = 'comment_reactions'
    __table_args__ = (
        UniqueConstraint('user_id', 'comment_id', name='uq_comment_reactions_user_comment'),
    )

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey('comments.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    emoji = Column(String(16), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False, onupdate=datetime.utcnow)
