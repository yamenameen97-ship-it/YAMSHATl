from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class LinkCard(BaseModel):
    """v88.86: بيانات كارت الرابط الغني — تُعرض في الفيد ككارت مع زر 'فتح المصدر'."""
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    sourceName: Optional[str] = None
    sourceLogo: Optional[str] = None
    sourceUrl: Optional[str] = None
    platform: Optional[str] = None
    supportsBrowser: Optional[bool] = None
    publishedAt: Optional[str] = None
    viewsCount: Optional[int] = None
    subscribersCount: Optional[int] = None
    duration: Optional[float] = None

    class Config:
        extra = 'allow'


class AdminSource(BaseModel):
    """v88.86: بيانات المصدر الأصلية — لا تُعرض للمستخدمين، للأدمن فقط."""
    source_platform: Optional[str] = None
    source_platform_name: Optional[str] = None
    source_url: Optional[str] = None
    source_title: Optional[str] = None
    source_text: Optional[str] = None
    source_author: Optional[str] = None
    source_channel: Optional[str] = None
    captured_at: Optional[str] = None
    share_mode: Optional[str] = None  # 'link' | 'download'
    download_size: Optional[int] = None
    download_mime: Optional[str] = None
    verified_by_yamshat: Optional[bool] = None

    class Config:
        extra = 'allow'


class PostCreate(BaseModel):
    content: str
    image_url: Optional[str] = None
    # ✅ v88.86 — دعم نظام المشاركة "موثق لدى Yamshat"
    link_card: Optional[LinkCard] = None
    verified_by_yamshat: Optional[bool] = False
    admin_source: Optional[AdminSource] = None


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
    # ✅ v88.86 — يُعرض في الفيد
    link_card: Optional[dict] = None
    verified_by_yamshat: Optional[bool] = False
