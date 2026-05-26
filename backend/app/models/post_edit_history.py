from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text

from app.db.base import Base


class PostEditHistory(Base):
    __tablename__ = 'post_edit_history'

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey('posts.id', ondelete='CASCADE'), nullable=False, index=True)
    editor_user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    previous_content = Column(Text, nullable=True)
    previous_content_html = Column(Text, nullable=True)
    previous_media_json = Column(Text, nullable=True)
    previous_poll_json = Column(Text, nullable=True)
    edited_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
