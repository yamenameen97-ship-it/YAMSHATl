from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text

from app.db.base import Base


class LiveRoomSession(Base):
    __tablename__ = 'live_room_sessions'

    id = Column(String(100), primary_key=True, index=True)
    host_user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    host_username = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False, default='Live Room')
    livekit_room = Column(String(255), nullable=True, index=True)
    livekit_url = Column(String(500), nullable=True)
    stream_status = Column(String(50), nullable=False, default='setup_required', index=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    is_public = Column(Boolean, nullable=False, default=True, index=True)
    viewer_count = Column(Integer, nullable=False, default=0)
    peak_viewer_count = Column(Integer, nullable=False, default=0)
    hearts_count = Column(Integer, nullable=False, default=0)
    recording_status = Column(String(50), nullable=False, default='idle')
    recording_url = Column(String(1000), nullable=True)
    extra_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    last_activity_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    ended_at = Column(DateTime, nullable=True)
