"""
نموذج سجل البحث - Search History Model
يخزن جميع عمليات البحث للمستخدمين
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum


class SearchCategoryEnum(str, enum.Enum):
    """فئات البحث"""
    TOP = "top"
    ACCOUNTS = "accounts"
    POSTS = "posts"
    GROUPS = "groups"
    HASHTAGS = "hashtags"


class SearchHistory(Base):
    """
    نموذج سجل البحث
    
    الحقول:
    - id: معرّف فريد
    - user_id: معرّف المستخدم
    - query: نص البحث
    - category: فئة البحث
    - results_count: عدد النتائج
    - timestamp: وقت البحث
    """
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete='CASCADE'), index=True, nullable=False)
    query = Column(String(255), nullable=False, index=True)
    category = Column(Enum(SearchCategoryEnum), default=SearchCategoryEnum.TOP)
    results_count = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # العلاقات
    user = relationship("User", back_populates="search_history")

    def __repr__(self):
        return f"<SearchHistory(id={self.id}, user_id={self.user_id}, query='{self.query}', timestamp={self.timestamp})>"
