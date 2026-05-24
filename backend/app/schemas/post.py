from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PostCreate(BaseModel):
    content: str
    image_url: Optional[str] = None


class PostOut(BaseModel):
    id: int
    user_id: int
    username: str
    avatar: Optional[str] = None
    content: str
    image_url: Optional[str] = None
    created_at: datetime
    like_count: int
    comment_count: int
