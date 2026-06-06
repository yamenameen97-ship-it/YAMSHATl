from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Boolean, Index, Float

from app.db.base import Base


class LiveStreamViewer(Base):
    """نموذج المشاهدين الحاليين في البث المباشر"""
    __tablename__ = 'live_stream_viewers'
    __table_args__ = (
        Index('ix_live_stream_viewers_stream_id', 'stream_id'),
        Index('ix_live_stream_viewers_user_id', 'user_id'),
        Index('ix_live_stream_viewers_joined_at', 'joined_at'),
    )

    id = Column(Integer, primary_key=True, index=True)
    stream_id = Column(String(100), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # معلومات المشاهد
    username = Column(String(255), nullable=False)
    user_avatar = Column(String(500), nullable=True)
    
    # معلومات المشاهدة
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    left_at = Column(DateTime, nullable=True)
    watch_duration_seconds = Column(Integer, default=0, nullable=False)
    
    # الحالة
    is_active = Column(Boolean, default=True, nullable=False)
    is_banned = Column(Boolean, default=False, nullable=False)
    is_muted = Column(Boolean, default=False, nullable=False)
    
    # الإحصائيات
    hearts_sent = Column(Integer, default=0, nullable=False)
    gifts_sent = Column(Integer, default=0, nullable=False)
    comments_count = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class LiveStreamSession(Base):
    """نموذج جلسة البث المباشر"""
    __tablename__ = 'live_stream_sessions'
    __table_args__ = (
        Index('ix_live_stream_sessions_stream_id', 'stream_id'),
        Index('ix_live_stream_sessions_host_id', 'host_id'),
        Index('ix_live_stream_sessions_started_at', 'started_at'),
    )

    id = Column(Integer, primary_key=True, index=True)
    stream_id = Column(String(100), nullable=False, unique=True, index=True)
    host_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # معلومات البث
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    
    # حالة البث
    status = Column(String(50), default='pending', nullable=False)  # pending, active, paused, ended
    quality = Column(String(50), default='720p', nullable=False)
    
    # معلومات الجلسة
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0, nullable=False)
    
    # الإحصائيات
    total_viewers = Column(Integer, default=0, nullable=False)
    peak_viewers = Column(Integer, default=0, nullable=False)
    unique_viewers = Column(Integer, default=0, nullable=False)
    total_hearts = Column(Integer, default=0, nullable=False)
    total_gifts = Column(Integer, default=0, nullable=False)
    total_comments = Column(Integer, default=0, nullable=False)
    total_coins_earned = Column(Float, default=0.0, nullable=False)
    
    # الإعدادات
    is_public = Column(Boolean, default=True, nullable=False)
    allow_comments = Column(Boolean, default=True, nullable=False)
    allow_gifts = Column(Boolean, default=True, nullable=False)
    allow_recording = Column(Boolean, default=False, nullable=False)
    is_recording = Column(Boolean, default=False, nullable=False)
    
    # معلومات الكاميرا
    camera_enabled = Column(Boolean, default=True, nullable=False)
    microphone_enabled = Column(Boolean, default=True, nullable=False)
    screen_share_enabled = Column(Boolean, default=False, nullable=False)
    
    # الصحة والأداء
    health_score = Column(Integer, default=100, nullable=False)  # 0-100
    bitrate = Column(Integer, default=0, nullable=False)  # بالـ kbps
    fps = Column(Integer, default=0, nullable=False)
    latency_ms = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class LiveStreamHostSettings(Base):
    """نموذج إعدادات المضيف في البث المباشر"""
    __tablename__ = 'live_stream_host_settings'
    __table_args__ = (
        Index('ix_live_stream_host_settings_host_id', 'host_id'),
        Index('ix_live_stream_host_settings_stream_id', 'stream_id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    stream_id = Column(String(100), ForeignKey('live_stream_sessions.stream_id', ondelete='CASCADE'), nullable=False)
    
    # إعدادات الاعتدال
    auto_moderate = Column(Boolean, default=True, nullable=False)
    filter_banned_words = Column(Boolean, default=True, nullable=False)
    require_comment_approval = Column(Boolean, default=False, nullable=False)
    
    # إعدادات المشرفين
    moderators_list = Column(Text, nullable=True)  # JSON list of moderator IDs
    allow_moderators_to_ban = Column(Boolean, default=True, nullable=False)
    allow_moderators_to_mute = Column(Boolean, default=True, nullable=False)
    
    # إعدادات الهدايا
    minimum_gift_amount = Column(Integer, default=0, nullable=False)
    gift_goal = Column(Integer, default=0, nullable=False)
    
    # إعدادات أخرى
    chat_speed_limit = Column(Integer, default=10, nullable=False)  # رسائل في الدقيقة
    allow_links_in_chat = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class LiveStreamCameraState(Base):
    """نموذج حالة الكاميرا في البث المباشر"""
    __tablename__ = 'live_stream_camera_states'
    __table_args__ = (
        Index('ix_live_stream_camera_states_stream_id', 'stream_id'),
        Index('ix_live_stream_camera_states_host_id', 'host_id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    stream_id = Column(String(100), nullable=False, index=True)
    host_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # حالة الكاميرا
    camera_enabled = Column(Boolean, default=True, nullable=False)
    microphone_enabled = Column(Boolean, default=True, nullable=False)
    screen_share_enabled = Column(Boolean, default=False, nullable=False)
    
    # معلومات الجهاز
    device_id = Column(String(255), nullable=True)
    camera_name = Column(String(255), nullable=True)
    microphone_name = Column(String(255), nullable=True)
    
    # الإعدادات
    video_resolution = Column(String(50), default='1280x720', nullable=False)
    video_fps = Column(Integer, default=30, nullable=False)
    audio_bitrate = Column(Integer, default=128, nullable=False)  # kbps
    video_bitrate = Column(Integer, default=2500, nullable=False)  # kbps
    
    # الحالة الحالية
    is_recording = Column(Boolean, default=False, nullable=False)
    last_frame_timestamp = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
