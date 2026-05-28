from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint

from app.db.base import Base


class UserMute(Base):
    __tablename__ = 'user_mutes'
    __table_args__ = (UniqueConstraint('muter_id', 'muted_id', name='uq_user_mutes_pair'),)

    id = Column(Integer, primary_key=True, index=True)
    muter_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    muted_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
