from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    avatar: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: EmailStr
    avatar: Optional[str] = None
    email_verified: bool = False
    followers_count: int = 0
    following_count: int = 0
    created_at: datetime


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = 'bearer'


class PublicUser(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    avatar: Optional[str] = None
    followers_count: int = 0
    following_count: int = 0
