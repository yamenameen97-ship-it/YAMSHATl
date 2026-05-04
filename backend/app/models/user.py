from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.db.base import Base


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    avatar = Column(String(500), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default='user', nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    followers_count = Column(Integer, default=0, nullable=False)
    following_count = Column(Integer, default=0, nullable=False)
    fcm_token = Column(String(1024), nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    banned_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
