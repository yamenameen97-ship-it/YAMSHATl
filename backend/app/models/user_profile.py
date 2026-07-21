from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text

from app.db.base import Base


class UserProfile(Base):
    __tablename__ = 'user_profiles'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    bio = Column(Text, nullable=True)
    # بيانات الهوية المعروضة في محرر الملف الشخصي
    first_name = Column(String(80), nullable=True)
    father_name = Column(String(80), nullable=True)
    last_name = Column(String(80), nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    cover_photo = Column(String(1000), nullable=True)
    badges_json = Column(Text, nullable=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    profile_theme = Column(String(40), nullable=False, default='midnight')
    privacy_level = Column(String(20), nullable=False, default='public')
    achievements_json = Column(Text, nullable=True)
    activity_tagline = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False, onupdate=datetime.utcnow)
