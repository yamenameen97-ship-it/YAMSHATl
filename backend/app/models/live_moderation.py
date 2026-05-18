from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Boolean, Index

from app.db.base import Base


class LiveRoomModerator(Base):
    """نموذج مشرفي غرفة البث المباشر"""
    __tablename__ = 'live_room_moderators'
    __table_args__ = (
        Index('ix_live_room_moderators_room_id', 'room_id'),
        Index('ix_live_room_moderators_user_id', 'user_id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String(100), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    host_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # الصلاحيات
    can_mute = Column(Boolean, default=True, nullable=False)
    can_kick = Column(Boolean, default=True, nullable=False)
    can_ban = Column(Boolean, default=False, nullable=False)
    can_delete_comments = Column(Boolean, default=True, nullable=False)
    can_pin_comments = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class LiveRoomMutedUser(Base):
    """نموذج المستخدمين المكتومين في غرفة البث"""
    __tablename__ = 'live_room_muted_users'
    __table_args__ = (
        Index('ix_live_room_muted_users_room_id', 'room_id'),
        Index('ix_live_room_muted_users_user_id', 'user_id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String(100), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    moderator_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    reason = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True)  # None = دائم
    muted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    unmuted_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class LiveRoomKickedUser(Base):
    """نموذج المستخدمين المطرودين من غرفة البث"""
    __tablename__ = 'live_room_kicked_users'
    __table_args__ = (
        Index('ix_live_room_kicked_users_room_id', 'room_id'),
        Index('ix_live_room_kicked_users_user_id', 'user_id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String(100), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    moderator_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    reason = Column(Text, nullable=True)
    kicked_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class LiveRoomBannedUser(Base):
    """نموذج المستخدمين المحظورين من غرفة البث"""
    __tablename__ = 'live_room_banned_users'
    __table_args__ = (
        Index('ix_live_room_banned_users_room_id', 'room_id'),
        Index('ix_live_room_banned_users_user_id', 'user_id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String(100), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    host_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    reason = Column(Text, nullable=True)
    duration_days = Column(Integer, nullable=True)  # None = دائم
    banned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    unbanned_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class LiveRoomComment(Base):
    """نموذج التعليقات المباشرة في غرفة البث"""
    __tablename__ = 'live_room_comments'
    __table_args__ = (
        Index('ix_live_room_comments_room_id', 'room_id'),
        Index('ix_live_room_comments_user_id', 'user_id'),
        Index('ix_live_room_comments_created_at', 'created_at'),
    )

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String(100), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    content = Column(Text, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # الاعتدال
    is_moderated = Column(Boolean, default=False, nullable=False)
    moderation_score = Column(Integer, default=0, nullable=False)  # 0-100
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
