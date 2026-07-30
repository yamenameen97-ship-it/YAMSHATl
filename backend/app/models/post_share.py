from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.db.base import Base


class PostShare(Base):
    __tablename__ = 'post_shares'

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey('posts.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    platform = Column(String(60), nullable=True)
    # ✅ v88.99 — تمييز نوع المشاركة: 'share' (عادية) أو 'repost' (إعادة نشر)
    share_type = Column(String(20), nullable=False, default='share', index=True)
    # ✅ v88.99 — نص الاقتباس عند إعادة النشر من نوع 'quote'
    quote_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
