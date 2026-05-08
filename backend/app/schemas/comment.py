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
    created_at: datetime
    reply_count: int = 0
    replies: list['CommentOut'] = []
