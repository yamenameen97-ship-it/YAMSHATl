"""نموذج تفاعلات الرسائل (👍 ❤️ 😂 ...)."""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint

from app.db.base import Base


class MessageReaction(Base):
    __tablename__ = 'message_reactions'
    __table_args__ = (
        UniqueConstraint(
            'message_id', 'user_id', 'reaction',
            name='uq_message_reaction_per_user',
        ),
        Index('ix_message_reactions_message_id', 'message_id'),
        Index('ix_message_reactions_user_id', 'user_id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(
        Integer,
        ForeignKey('messages.id', ondelete='CASCADE'),
        nullable=False,
    )
    user_id = Column(
        Integer,
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
    )
    reaction = Column(String(32), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
