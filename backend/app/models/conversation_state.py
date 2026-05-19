from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, Integer, UniqueConstraint

from app.db.base import Base


class ConversationState(Base):
    """نموذج لتخزين حالة المحادثات (أرشفة، كتم، تثبيت، حذف)"""
    __tablename__ = 'conversation_states'
    __table_args__ = (
        UniqueConstraint('user_id', 'other_user_id', name='uq_conversation_state_pair'),
        Index('ix_conversation_state_user_id', 'user_id'),
        Index('ix_conversation_state_other_user_id', 'other_user_id'),
        Index('ix_conversation_state_is_archived', 'is_archived'),
        Index('ix_conversation_state_is_pinned', 'is_pinned'),
        Index('ix_conversation_state_is_muted', 'is_muted'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    other_user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # حالات المحادثة
    is_archived = Column(Boolean, default=False, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    is_muted = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # الترتيب والأولويات
    pin_order = Column(Integer, nullable=True)  # لترتيب المحادثات المثبتة
    
    # الطوابع الزمنية
    archived_at = Column(DateTime, nullable=True)
    pinned_at = Column(DateTime, nullable=True)
    muted_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
