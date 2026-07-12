"""MutedStoryUser — v87.12.

كتم قصص مستخدم محدد (Mute User Stories).

- muter_id: المستخدم الذي يريد كتم قصص شخص آخر
- muted_id: المستخدم الذي ستُكتم قصصه

القاعدة: قصص muted_id تُستبعد من شريط الستوري الخاص بـ muter_id،
لكن يبقى بإمكان muter_id رؤية بقية محتوى muted_id (بوستات، ريلز، بروفايل).
مستقل تماماً عن UserMute (كتم عام) وUserBlock (حظر كامل).
"""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint

from app.db.base import Base


class MutedStoryUser(Base):
    __tablename__ = 'muted_story_users'
    __table_args__ = (
        UniqueConstraint('muter_id', 'muted_id', name='uq_muted_story_users_pair'),
    )

    id = Column(Integer, primary_key=True, index=True)
    muter_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    muted_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
