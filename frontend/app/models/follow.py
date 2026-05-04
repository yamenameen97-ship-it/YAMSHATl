from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint

from app.db.base import Base


class Follow(Base):
    __tablename__ = 'follows'
    __table_args__ = (
        UniqueConstraint('follower_id', 'following_id', name='unique_follow'),
    )

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    following_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
