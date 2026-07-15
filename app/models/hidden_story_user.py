"""HiddenStoryUser — v87.11.

المستخدمون الذين يخفي عنهم صاحب الحساب قصصه (Hide Story From).

- owner_id: صاحب القصص الذي يريد الإخفاء
- hidden_id: المستخدم الذي يجب ألا يرى قصص owner

القاعدة: عندما يشاهد hidden_id قصة owner_id → تُستبعد كليّاً من الرؤية،
حتى لو كانوا أصدقاء أو مقربين. هذا مستقل تماماً عن UserBlock (الحظر الكامل).
"""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint

from app.db.base import Base


class HiddenStoryUser(Base):
    __tablename__ = 'hidden_story_users'
    __table_args__ = (
        UniqueConstraint('owner_id', 'hidden_id', name='uq_hidden_story_users_pair'),
    )

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    hidden_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
