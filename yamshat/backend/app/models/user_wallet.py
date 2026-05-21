from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer

from app.db.base import Base


class UserWallet(Base):
    __tablename__ = 'user_wallets'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    coin_balance = Column(Integer, nullable=False, default=1000)
    total_earned = Column(Integer, nullable=False, default=0)
    total_spent = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False, onupdate=datetime.utcnow)
