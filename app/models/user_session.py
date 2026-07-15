from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.db.base import Base


class UserSession(Base):
    __tablename__ = 'user_sessions'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    session_key = Column(String(96), unique=True, nullable=False, index=True)
    refresh_token_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    remember_me = Column(Boolean, default=False, nullable=False)
    device_id_hash = Column(String(128), nullable=True, index=True)
    ip_hash = Column(String(128), nullable=True)
    user_agent_hash = Column(String(128), nullable=True)
    device_label = Column(String(255), nullable=True)
    login_method = Column(String(40), default='password', nullable=False)
    last_seen_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    revoked_at = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
