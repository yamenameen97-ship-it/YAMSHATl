from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint

from app.db.base import Base


class CommentLike(Base):
    __tablename__ = 'comment_likes'
    __table_args__ = (
        UniqueConstraint('comment_id', 'user_id', name='uq_comment_likes_comment_user'),
    )

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey('comments.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
