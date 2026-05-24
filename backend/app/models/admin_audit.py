from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Boolean, Index, JSON

from app.db.base import Base


class AdminAuditLog(Base):
    """نموذج سجلات تدقيق الإدارة"""
    __tablename__ = 'admin_audit_logs'
    __table_args__ = (
        Index('ix_admin_audit_logs_admin_id', 'admin_id'),
        Index('ix_admin_audit_logs_action', 'action'),
        Index('ix_admin_audit_logs_created_at', 'created_at'),
    )

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True)  # ban_user, delete_post, etc.
    target_type = Column(String(50), nullable=False)  # user, post, comment, etc.
    target_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)  # تفاصيل إضافية
    reason = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class UserReport(Base):
    """نموذج البلاغات عن المستخدمين والمحتوى"""
    __tablename__ = 'user_reports'
    __table_args__ = (
        Index('ix_user_reports_reporter_id', 'reporter_id'),
        Index('ix_user_reports_target_id', 'target_id'),
        Index('ix_user_reports_status', 'status'),
        Index('ix_user_reports_created_at', 'created_at'),
    )

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    target_type = Column(String(50), nullable=False)  # user, post, comment, message
    target_id = Column(Integer, nullable=False)
    reason = Column(String(100), nullable=False)  # spam, abuse, inappropriate, etc.
    description = Column(Text, nullable=True)
    status = Column(String(20), default='pending', nullable=False)  # pending, reviewing, resolved, dismissed
    resolved_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)


class AdminNotification(Base):
    """نموذج إشعارات الإدارة"""
    __tablename__ = 'admin_notifications'
    __table_args__ = (
        Index('ix_admin_notifications_admin_id', 'admin_id'),
        Index('ix_admin_notifications_is_read', 'is_read'),
        Index('ix_admin_notifications_created_at', 'created_at'),
    )

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    type = Column(String(50), nullable=False)  # new_report, user_ban, system_alert, etc.
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class SystemStatistics(Base):
    """نموذج إحصائيات النظام"""
    __tablename__ = 'system_statistics'
    __table_args__ = (
        Index('ix_system_statistics_date', 'date'),
    )

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow, nullable=False, unique=True)
    
    # إحصائيات المستخدمين
    total_users = Column(Integer, default=0, nullable=False)
    active_users = Column(Integer, default=0, nullable=False)
    new_users = Column(Integer, default=0, nullable=False)
    banned_users = Column(Integer, default=0, nullable=False)
    
    # إحصائيات المحتوى
    total_posts = Column(Integer, default=0, nullable=False)
    total_messages = Column(Integer, default=0, nullable=False)
    total_comments = Column(Integer, default=0, nullable=False)
    deleted_posts = Column(Integer, default=0, nullable=False)
    
    # إحصائيات البث المباشر
    active_live_rooms = Column(Integer, default=0, nullable=False)
    total_viewers = Column(Integer, default=0, nullable=False)
    total_gifts_sent = Column(Integer, default=0, nullable=False)
    total_revenue = Column(Integer, default=0, nullable=False)
    
    # إحصائيات الأداء
    avg_response_time = Column(Integer, default=0, nullable=False)  # بالميلي ثانية
    error_count = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
