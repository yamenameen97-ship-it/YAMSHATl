"""
Schemas للبث المباشر - Live Stream Schemas
تعريف نماذج البيانات المستخدمة في API
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class StreamStatus(str, Enum):
    """حالات البث المباشر"""
    PENDING = "pending"
    ACTIVE = "active"
    PAUSED = "paused"
    ENDED = "ended"
    ARCHIVED = "archived"


class StreamQuality(str, Enum):
    """جودة البث"""
    QUALITY_1080P = "1080p"
    QUALITY_720P = "720p"
    QUALITY_480P = "480p"


class BanDuration(str, Enum):
    """مدة الحظر"""
    TEMPORARY = "temporary"
    LONG_TERM = "long_term"
    PERMANENT = "permanent"


# ==================== Request Models ====================

class LiveStreamCreate(BaseModel):
    """طلب إنشاء بث جديد"""
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    category: Optional[str] = Field(None, max_length=100)
    thumbnail_url: Optional[str] = None
    quality: Optional[str] = Field("720p", regex="^(1080p|720p|480p)$")
    is_public: bool = True
    allow_comments: bool = True
    allow_gifts: bool = True
    allow_recording: bool = False

    class Config:
        schema_extra = {
            "example": {
                "title": "البث الأول",
                "description": "وصف البث المباشر",
                "category": "ألعاب",
                "quality": "720p",
                "is_public": True,
                "allow_comments": True,
                "allow_gifts": True,
            }
        }


class LiveStreamUpdate(BaseModel):
    """طلب تحديث بث"""
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[StreamStatus] = None
    thumbnail_url: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "title": "البث المحدث",
                "status": "active",
            }
        }


class UpdateCameraStateRequest(BaseModel):
    """طلب تحديث حالة الكاميرا"""
    camera_enabled: Optional[bool] = None
    microphone_enabled: Optional[bool] = None
    screen_share_enabled: Optional[bool] = None
    video_bitrate: Optional[int] = None
    audio_bitrate: Optional[int] = None

    class Config:
        schema_extra = {
            "example": {
                "camera_enabled": True,
                "microphone_enabled": True,
                "screen_share_enabled": False,
            }
        }


class ModerationActionRequest(BaseModel):
    """طلب إجراء اعتدال"""
    action: str = Field(..., regex="^(mute|unmute|ban|unban|kick|close_camera)$")
    user_id: int
    reason: Optional[str] = None
    duration: Optional[str] = Field(None, regex="^(temporary|long_term|permanent)$")

    class Config:
        schema_extra = {
            "example": {
                "action": "mute",
                "user_id": 123,
                "reason": "سبام",
                "duration": "temporary",
            }
        }


class AddViewerRequest(BaseModel):
    """طلب إضافة مشاهد"""
    user_id: int
    username: str
    user_avatar: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "user_id": 123,
                "username": "ahmed",
                "user_avatar": "https://example.com/avatar.jpg",
            }
        }


# ==================== Response Models ====================

class LiveStreamResponse(BaseModel):
    """استجابة بيانات البث"""
    stream_id: str
    host_id: int
    title: str
    description: Optional[str] = None
    status: str
    quality: str
    is_public: bool
    allow_comments: bool = True
    allow_gifts: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "stream_id": "stream_1_1717939200000",
                "host_id": 1,
                "title": "البث الأول",
                "description": "وصف البث",
                "status": "active",
                "quality": "720p",
                "is_public": True,
                "allow_comments": True,
                "allow_gifts": True,
            }
        }


class ViewerResponse(BaseModel):
    """استجابة بيانات المشاهد"""
    user_id: int
    username: str
    user_avatar: Optional[str] = None
    joined_at: datetime
    is_banned: bool
    is_muted: bool
    hearts_sent: int
    gifts_sent: int
    comments_count: int

    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "user_id": 123,
                "username": "ahmed",
                "user_avatar": "https://example.com/avatar.jpg",
                "joined_at": "2026-06-04T10:00:00Z",
                "is_banned": False,
                "is_muted": False,
                "hearts_sent": 5,
                "gifts_sent": 2,
                "comments_count": 3,
            }
        }


class StreamStatsResponse(BaseModel):
    """استجابة إحصائيات البث"""
    stream_id: str
    status: str
    total_viewers: int
    peak_viewers: int
    unique_viewers: int
    total_hearts: int
    total_gifts: int
    total_comments: int
    total_coins_earned: float
    duration_seconds: int
    health_score: int
    bitrate: int
    fps: int
    latency_ms: int

    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "stream_id": "stream_1_1717939200000",
                "status": "active",
                "total_viewers": 150,
                "peak_viewers": 200,
                "unique_viewers": 180,
                "total_hearts": 500,
                "total_gifts": 25,
                "total_comments": 100,
                "total_coins_earned": 2500.0,
                "duration_seconds": 3600,
                "health_score": 95,
                "bitrate": 3000,
                "fps": 30,
                "latency_ms": 50,
            }
        }


class CameraStateResponse(BaseModel):
    """استجابة حالة الكاميرا"""
    camera_enabled: bool
    microphone_enabled: bool
    screen_share_enabled: bool
    video_resolution: Optional[str] = None
    video_fps: Optional[int] = None
    audio_bitrate: Optional[int] = None
    video_bitrate: Optional[int] = None
    is_recording: bool

    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "camera_enabled": True,
                "microphone_enabled": True,
                "screen_share_enabled": False,
                "video_resolution": "1280x720",
                "video_fps": 30,
                "audio_bitrate": 128,
                "video_bitrate": 2500,
                "is_recording": False,
            }
        }


class ModerationActionResponse(BaseModel):
    """استجابة إجراء الاعتدال"""
    status: str
    user_id: int
    stream_id: str
    action: str
    reason: Optional[str] = None
    duration: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "status": "success",
                "user_id": 123,
                "stream_id": "stream_1_1717939200000",
                "action": "muted",
                "reason": "سبام",
                "duration": "temporary",
            }
        }


class StreamSessionDetailResponse(BaseModel):
    """استجابة تفاصيل جلسة البث"""
    stream_id: str
    host_id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    status: str
    quality: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: int
    total_viewers: int
    peak_viewers: int
    unique_viewers: int
    total_hearts: int
    total_gifts: int
    total_comments: int
    total_coins_earned: float
    is_public: bool
    allow_comments: bool
    allow_gifts: bool
    camera_enabled: bool
    microphone_enabled: bool
    health_score: int
    created_at: datetime

    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "stream_id": "stream_1_1717939200000",
                "host_id": 1,
                "title": "البث الأول",
                "description": "وصف البث",
                "category": "ألعاب",
                "status": "active",
                "quality": "720p",
                "started_at": "2026-06-04T10:00:00Z",
                "ended_at": None,
                "duration_seconds": 3600,
                "total_viewers": 150,
                "peak_viewers": 200,
                "unique_viewers": 180,
                "total_hearts": 500,
                "total_gifts": 25,
                "total_comments": 100,
                "total_coins_earned": 2500.0,
                "is_public": True,
                "allow_comments": True,
                "allow_gifts": True,
                "camera_enabled": True,
                "microphone_enabled": True,
                "health_score": 95,
                "created_at": "2026-06-04T09:00:00Z",
            }
        }


class ErrorResponse(BaseModel):
    """استجابة الخطأ"""
    status: str = "error"
    detail: str
    error_code: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "status": "error",
                "detail": "البث غير موجود",
                "error_code": "STREAM_NOT_FOUND",
            }
        }


class SuccessResponse(BaseModel):
    """استجابة النجاح"""
    status: str = "success"
    message: str
    data: Optional[dict] = None

    class Config:
        schema_extra = {
            "example": {
                "status": "success",
                "message": "تم العملية بنجاح",
                "data": {},
            }
        }
