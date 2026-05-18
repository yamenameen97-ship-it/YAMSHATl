from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.db.base import Base


class LoginChallenge(Base):
    __tablename__ = 'login_challenges'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    challenge_id = Column(String(96), unique=True, nullable=False, index=True)
    code_hash = Column(String(255), nullable=False)
    challenge_type = Column(String(40), nullable=False, index=True)
    meta_json = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    consumed_at = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
