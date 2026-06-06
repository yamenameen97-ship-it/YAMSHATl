from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Text

from app.db.base import Base


class Comment(Base):
    __tablename__ = 'comments'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey('posts.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('comments.id', ondelete='CASCADE'), nullable=True, index=True)
    username = Column(Text, nullable=True)
    comment = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    mentions_json = Column(Text, nullable=True)
    likes_count = Column(Integer, default=0, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False, index=True)
    is_hidden = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, nullable=True)
