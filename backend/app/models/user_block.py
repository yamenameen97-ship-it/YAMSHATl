from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint

from app.db.base import Base


class UserBlock(Base):
    __tablename__ = 'user_blocks'
    __table_args__ = (UniqueConstraint('blocker_id', 'blocked_id', name='uq_user_blocks_pair'),)

    id = Column(Integer, primary_key=True, index=True)
    blocker_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    blocked_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
