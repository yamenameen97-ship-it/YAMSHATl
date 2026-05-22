from sqlalchemy import Column, ForeignKey, Integer, UniqueConstraint

from app.db.base import Base


class Like(Base):
    __tablename__ = 'likes'
    __table_args__ = (UniqueConstraint('user_id', 'post_id', name='uq_likes_user_post'),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey('posts.id', ondelete='CASCADE'), nullable=False, index=True)
