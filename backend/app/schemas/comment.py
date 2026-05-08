from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CommentCreate(BaseModel):
    content: str


class CommentOut(BaseModel):
    id: int
    user_id: int
    username: str
    avatar: Optional[str] = None
    post_id: int
    content: str
    created_at: datetime
