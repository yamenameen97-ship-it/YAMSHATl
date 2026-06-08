from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    is_delivered: bool
    is_seen: bool
    created_at: datetime


class ConversationOut(BaseModel):
    user_id: int
    username: str
    avatar: Optional[str] = None
    last_message: str
    timestamp: datetime
    is_seen: bool
    unread_count: int
