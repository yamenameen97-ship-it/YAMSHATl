"""نماذج المجموعات - Group Models"""

from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, ForeignKey, JSON, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.db.base import Base


class Group(Base):
    """نموذج المجموعة الرئيسي"""
    __tablename__ = "groups"

    id = Column(String(36), primary_key=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)
    image_url = Column(String(500), nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    is_public = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    owner_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    members_count = Column(Integer, default=0, nullable=False)
    posts_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # العلاقات
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    posts = relationship("GroupPost", back_populates="group", cascade="all, delete-orphan")
    settings = relationship("GroupSettings", back_populates="group", cascade="all, delete-orphan", uselist=False)

    __table_args__ = (
        Index('ix_groups_owner_id', 'owner_id'),
        Index('ix_groups_is_public', 'is_public'),
        Index('ix_groups_category', 'category'),
        Index('ix_groups_created_at', 'created_at'),
    )


class GroupMember(Base):
    """نموذج عضو المجموعة"""
    __tablename__ = "group_members"

    id = Column(String(36), primary_key=True)
    group_id = Column(String(36), ForeignKey('groups.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    role = Column(String(20), default='member', nullable=False)  # owner, admin, moderator, member
    is_muted = Column(Boolean, default=False, nullable=False)
    is_banned = Column(Boolean, default=False, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # العلاقات
    group = relationship("Group", back_populates="members")

    __table_args__ = (
        UniqueConstraint('group_id', 'user_id', name='uq_group_member'),
        Index('ix_group_members_group_id', 'group_id'),
        Index('ix_group_members_user_id', 'user_id'),
    )


class GroupInvitation(Base):
    """نموذج دعوة المجموعة"""
    __tablename__ = "group_invitations"

    id = Column(String(36), primary_key=True)
    group_id = Column(String(36), ForeignKey('groups.id', ondelete='CASCADE'), nullable=False)
    inviter_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    invitee_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    is_accepted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('ix_group_invitations_group_id', 'group_id'),
        Index('ix_group_invitations_inviter_id', 'inviter_id'),
        Index('ix_group_invitations_invitee_id', 'invitee_id'),
    )


class GroupJoinRequest(Base):
    """نموذج طلب الانضمام للمجموعة"""
    __tablename__ = "group_join_requests"

    id = Column(String(36), primary_key=True)
    group_id = Column(String(36), ForeignKey('groups.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    status = Column(String(20), default='pending', nullable=False)  # pending, approved, rejected
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index('ix_group_join_requests_group_id', 'group_id'),
        Index('ix_group_join_requests_user_id', 'user_id'),
        Index('ix_group_join_requests_status', 'status'),
    )


class GroupPost(Base):
    """نموذج منشور المجموعة"""
    __tablename__ = "group_posts"

    id = Column(String(36), primary_key=True)
    group_id = Column(String(36), ForeignKey('groups.id', ondelete='CASCADE'), nullable=False)
    author_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    content = Column(Text, nullable=False)
    media_urls = Column(JSON, nullable=True)
    is_pinned = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    likes_count = Column(Integer, default=0, nullable=False)
    comments_count = Column(Integer, default=0, nullable=False)
    shares_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # العلاقات
    group = relationship("Group", back_populates="posts")

    __table_args__ = (
        Index('ix_group_posts_group_id', 'group_id'),
        Index('ix_group_posts_author_id', 'author_id'),
        Index('ix_group_posts_created_at', 'created_at'),
    )


class GroupRule(Base):
    """نموذج قاعدة المجموعة"""
    __tablename__ = "group_rules"

    id = Column(String(36), primary_key=True)
    group_id = Column(String(36), ForeignKey('groups.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('ix_group_rules_group_id', 'group_id'),
    )


class GroupEvent(Base):
    """نموذج حدث المجموعة"""
    __tablename__ = "group_events"

    id = Column(String(36), primary_key=True)
    group_id = Column(String(36), ForeignKey('groups.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    location = Column(String(300), nullable=True)
    image_url = Column(String(500), nullable=True)
    attendees_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('ix_group_events_group_id', 'group_id'),
    )


class GroupPoll(Base):
    """نموذج استطلاع المجموعة"""
    __tablename__ = "group_polls"

    id = Column(String(36), primary_key=True)
    group_id = Column(String(36), ForeignKey('groups.id', ondelete='CASCADE'), nullable=False)
    creator_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    question = Column(String(500), nullable=False)
    options = Column(JSON, nullable=False)
    votes = Column(JSON, nullable=True)
    end_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('ix_group_polls_group_id', 'group_id'),
    )


class GroupAnnouncement(Base):
    """نموذج إعلان المجموعة"""
    __tablename__ = "group_announcements"

    id = Column(String(36), primary_key=True)
    group_id = Column(String(36), ForeignKey('groups.id', ondelete='CASCADE'), nullable=False)
    creator_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('ix_group_announcements_group_id', 'group_id'),
    )


class GroupSettings(Base):
    """نموذج إعدادات المجموعة"""
    __tablename__ = "group_settings"

    id = Column(String(36), primary_key=True)
    group_id = Column(String(36), ForeignKey('groups.id', ondelete='CASCADE'), nullable=False, unique=True)
    allow_member_invites = Column(Boolean, default=True, nullable=False)
    require_approval = Column(Boolean, default=False, nullable=False)
    allow_external_links = Column(Boolean, default=True, nullable=False)
    allow_live_streaming = Column(Boolean, default=True, nullable=False)
    allow_file_uploads = Column(Boolean, default=True, nullable=False)
    slow_mode_seconds = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # العلاقات
    group = relationship("Group", back_populates="settings")

    __table_args__ = (
        Index('ix_group_settings_group_id', 'group_id'),
    )
