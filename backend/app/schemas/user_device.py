"""
مخططات Pydantic لجهاز المستخدم - User Device Schemas.
"""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class UserDeviceRegister(BaseModel):
    """طلب تسجيل جهاز جديد أو تحديثه."""

    device_id: str = Field(..., min_length=4, max_length=128)
    push_token: str = Field(..., min_length=8, max_length=2048)
    platform: Literal["android", "ios", "web", "windows", "macos", "linux"] = "web"
    provider: Literal["fcm", "apns", "webpush"] = "fcm"

    web_push_p256dh: Optional[str] = Field(default=None, max_length=255)
    web_push_auth: Optional[str] = Field(default=None, max_length=255)

    device_name: Optional[str] = Field(default=None, max_length=255)
    os_version: Optional[str] = Field(default=None, max_length=50)
    app_version: Optional[str] = Field(default=None, max_length=50)
    user_agent: Optional[str] = Field(default=None, max_length=500)


class UserDevicePreferences(BaseModel):
    """تحديث تفضيلات إشعارات جهاز معيّن."""

    notifications_enabled: bool = True


class UserDeviceOut(BaseModel):
    """تمثيل جهاز المستخدم في الاستجابة."""

    id: int
    device_id: str
    platform: str
    provider: str
    device_name: Optional[str]
    is_active: bool
    notifications_enabled: bool
    registered_at: datetime
    last_seen_at: datetime

    class Config:
        from_attributes = True
