from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer

from app.db.base import Base


class PostSave(Base):
    __tablename__ = 'post_saves'

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey('posts.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
