from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None


class CommentOut(BaseModel):
    id: int
    user_id: int
    username: str
    avatar: Optional[str] = None
    post_id: int
    parent_id: Optional[int] = None
    content: str
    mentions: list[str] = []
    likes_count: int = 0
    is_liked: bool = False
    is_pinned: bool = False
    is_hidden: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    reply_count: int = 0
    replies: list['CommentOut'] = []
