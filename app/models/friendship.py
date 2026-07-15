"""نموذج الصداقة - نظام طلبات الصداقة الكامل.

يدعم الحالات: pending (قيد الانتظار), accepted (مقبولة), declined (مرفوضة).
- requester_id: من أرسل الطلب.
- addressee_id: من تلقى الطلب.
- علاقة الصداقة تكون فريدة بين كل زوج من المستخدمين (بصرف النظر عن الاتجاه).
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, Index

from app.db.base import Base


FRIENDSHIP_STATUS_PENDING = 'pending'
FRIENDSHIP_STATUS_ACCEPTED = 'accepted'
FRIENDSHIP_STATUS_DECLINED = 'declined'


class Friendship(Base):
    __tablename__ = 'friendships'
    __table_args__ = (
        UniqueConstraint('requester_id', 'addressee_id', name='unique_friendship_pair'),
        Index('ix_friendships_requester_status', 'requester_id', 'status'),
        Index('ix_friendships_addressee_status', 'addressee_id', 'status'),
    )

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    addressee_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    status = Column(String(20), nullable=False, default=FRIENDSHIP_STATUS_PENDING)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
