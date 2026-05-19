from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text

from app.db.base import Base


class Comment(Base):
    __tablename__ = 'comments'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey('posts.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('comments.id', ondelete='CASCADE'), nullable=True, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
