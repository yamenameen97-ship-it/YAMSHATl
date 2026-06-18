"""
خدمة البث المباشر الشاملة - Comprehensive Live Service
يتعامل مع:
- إدارة البثوث المباشرة (إنشاء، بدء، إيقاف)
- إدارة المشتركين والمشاهدين
- نظام الحظر والكتم
- إدارة الكاميرا والميكروفون
- إحصائيات البث والأداء
"""

from fastapi import APIRouter, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect, Body
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Set
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import json
import logging
import uuid
from collections import defaultdict

logger = logging.getLogger(__name__)

# ==================== Models ====================

class StreamStatus(str, Enum):
    """حالات البث المباشر"""
    PENDING = "pending"
    ACTIVE = "active"
    PAUSED = "paused"
    ENDED = "ended"
    ARCHIVED = "archived"


class ModerationAction(str, Enum):
    """إجراءات الاعتدال"""
    MUTE = "mute"
    UNMUTE = "unmute"
    BAN = "ban"
    UNBAN = "unban"
    KICK = "kick"
    CLOSE_CAMERA = "close_camera"


class BanDuration(str, Enum):
    """مدة الحظر"""
    TEMPORARY = "temporary"  # 24 ساعة
    LONG_TERM = "long_term"  # 7 أيام
    PERMANENT = "permanent"


# ==================== Request/Response Models ====================

class CreateStreamRequest(BaseModel):
    """طلب إنشاء بث جديد"""
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    category: Optional[str] = None
    quality: str = Field("720p", regex="^(1080p|720p|480p)$")
    is_public: bool = True
    allow_comments: bool = True
    allow_gifts: bool = True
    allow_recording: bool = False


class StartStreamRequest(BaseModel):
    """طلب بدء البث"""
    quality: Optional[str] = "720p"
    enable_recording: Optional[bool] = False


class UpdateCameraStateRequest(BaseModel):
    """طلب تحديث حالة الكاميرا"""
    camera_enabled: Optional[bool] = None
    microphone_enabled: Optional[bool] = None
    screen_share_enabled: Optional[bool] = None
    video_bitrate: Optional[int] = None
    audio_bitrate: Optional[int] = None


class ModerationActionRequest(BaseModel):
    """طلب إجراء اعتدال"""
    action: ModerationAction
    user_id: int
    reason: Optional[str] = None
    duration: Optional[BanDuration] = BanDuration.TEMPORARY


class StreamViewerResponse(BaseModel):
    """استجابة بيانات المشاهد"""
    user_id: int
    username: str
    user_avatar: Optional[str] = None
    joined_at: datetime
    watch_duration_seconds: int
    is_banned: bool
    is_muted: bool
    hearts_sent: int
    gifts_sent: int
    comments_count: int


class StreamSessionResponse(BaseModel):
    """استجابة بيانات جلسة البث"""
    stream_id: str
    host_id: int
    title: str
    status: StreamStatus
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
    camera_enabled: bool
    microphone_enabled: bool
    health_score: int


class CameraStateResponse(BaseModel):
    """استجابة حالة الكاميرا"""
    camera_enabled: bool
    microphone_enabled: bool
    screen_share_enabled: bool
    video_resolution: str
    video_fps: int
    audio_bitrate: int
    video_bitrate: int
    is_recording: bool


# ==================== Service ====================

class ComprehensiveLiveService:
    """خدمة البث المباشر الشاملة"""
    
    def __init__(self, db_session=None):
        self.db = db_session
        
        # البثوث النشطة
        self.active_streams: Dict[str, Dict[str, Any]] = {}
        
        # المشاهدون الحاليون
        self.stream_viewers: Dict[str, Set[int]] = defaultdict(set)
        
        # حالات الكاميرا
        self.camera_states: Dict[str, Dict[str, Any]] = {}
        
        # المستخدمون المكتومون
        self.muted_users: Dict[str, Set[int]] = defaultdict(set)
        
        # المستخدمون المحظورون
        self.banned_users: Dict[str, Set[int]] = defaultdict(set)
        
        # اتصالات WebSocket
        self.stream_connections: Dict[str, List[WebSocket]] = defaultdict(list)
        
        # إحصائيات البث
        self.stream_stats: Dict[str, Dict[str, Any]] = {}

    # ==================== Stream Management ====================

    async def create_stream(
        self,
        host_id: int,
        host_username: str,
        request: CreateStreamRequest
    ) -> Dict[str, Any]:
        """إنشاء بث مباشر جديد"""
        try:
            stream_id = f"stream_{host_id}_{int(datetime.now().timestamp() * 1000)}"
            
            stream_data = {
                "stream_id": stream_id,
                "host_id": host_id,
                "host_username": host_username,
                "title": request.title,
                "description": request.description,
                "category": request.category,
                "quality": request.quality,
                "is_public": request.is_public,
                "allow_comments": request.allow_comments,
                "allow_gifts": request.allow_gifts,
                "allow_recording": request.allow_recording,
                "status": StreamStatus.PENDING.value,
                "created_at": datetime.utcnow().isoformat(),
                "started_at": None,
                "ended_at": None,
                "camera_enabled": True,
                "microphone_enabled": True,
                "screen_share_enabled": False,
                "health_score": 100,
                "total_viewers": 0,
                "peak_viewers": 0,
                "unique_viewers": 0,
                "total_hearts": 0,
                "total_gifts": 0,
                "total_comments": 0,
                "total_coins_earned": 0.0,
            }
            
            # حفظ البث
            self.active_streams[stream_id] = stream_data
            
            # تهيئة الإحصائيات
            self.stream_stats[stream_id] = {
                "viewers": 0,
                "hearts": 0,
                "gifts": 0,
                "comments": 0,
                "bitrate": 0,
                "fps": 30,
                "latency_ms": 0,
            }
            
            logger.info(f"Created stream {stream_id} by host {host_id}")
            return stream_data
            
        except Exception as e:
            logger.error(f"Error creating stream: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def start_stream(
        self,
        stream_id: str,
        request: StartStreamRequest
    ) -> Dict[str, Any]:
        """بدء البث المباشر"""
        try:
            if stream_id not in self.active_streams:
                raise HTTPException(status_code=404, detail="البث غير موجود")
            
            stream = self.active_streams[stream_id]
            stream["status"] = StreamStatus.ACTIVE.value
            stream["started_at"] = datetime.utcnow().isoformat()
            stream["quality"] = request.quality or "720p"
            
            if request.enable_recording:
                stream["is_recording"] = True
            
            # إنشاء token للبث
            token = str(uuid.uuid4())
            stream["token"] = token
            
            logger.info(f"Started stream {stream_id}")
            return {
                "status": "success",
                "stream_id": stream_id,
                "token": token,
                "stream_url": f"rtmp://stream-server/{stream_id}",
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error starting stream: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def end_stream(self, stream_id: str) -> Dict[str, Any]:
        """إنهاء البث المباشر"""
        try:
            if stream_id not in self.active_streams:
                raise HTTPException(status_code=404, detail="البث غير موجود")
            
            stream = self.active_streams[stream_id]
            stream["status"] = StreamStatus.ENDED.value
            stream["ended_at"] = datetime.utcnow().isoformat()
            
            # حساب المدة
            if stream.get("started_at"):
                start = datetime.fromisoformat(stream["started_at"])
                end = datetime.fromisoformat(stream["ended_at"])
                duration = (end - start).total_seconds()
                stream["duration_seconds"] = int(duration)
            
            # تنظيف الاتصالات
            if stream_id in self.stream_connections:
                for ws in self.stream_connections[stream_id]:
                    try:
                        await ws.close()
                    except:
                        pass
                del self.stream_connections[stream_id]
            
            logger.info(f"Ended stream {stream_id}")
            return {
                "status": "success",
                "stream_id": stream_id,
                "duration_seconds": stream.get("duration_seconds", 0),
                "total_viewers": stream.get("total_viewers", 0),
                "total_coins_earned": stream.get("total_coins_earned", 0.0),
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error ending stream: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # ==================== Viewer Management ====================

    async def add_viewer(
        self,
        stream_id: str,
        user_id: int,
        username: str,
        user_avatar: Optional[str] = None
    ) -> Dict[str, Any]:
        """إضافة مشاهد للبث"""
        try:
            if stream_id not in self.active_streams:
                raise HTTPException(status_code=404, detail="البث غير موجود")
            
            # التحقق من الحظر
            if user_id in self.banned_users.get(stream_id, set()):
                raise HTTPException(status_code=403, detail="أنت محظور من هذا البث")
            
            # إضافة المشاهد
            self.stream_viewers[stream_id].add(user_id)
            
            # تحديث الإحصائيات
            stream = self.active_streams[stream_id]
            stream["total_viewers"] = len(self.stream_viewers[stream_id])
            stream["peak_viewers"] = max(
                stream["peak_viewers"],
                stream["total_viewers"]
            )
            
            logger.info(f"User {user_id} joined stream {stream_id}")
            return {
                "status": "success",
                "user_id": user_id,
                "stream_id": stream_id,
                "total_viewers": stream["total_viewers"],
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error adding viewer: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def remove_viewer(self, stream_id: str, user_id: int) -> Dict[str, Any]:
        """إزالة مشاهد من البث"""
        try:
            if stream_id in self.stream_viewers:
                self.stream_viewers[stream_id].discard(user_id)
                
                # تحديث الإحصائيات
                if stream_id in self.active_streams:
                    stream = self.active_streams[stream_id]
                    stream["total_viewers"] = len(self.stream_viewers[stream_id])
            
            logger.info(f"User {user_id} left stream {stream_id}")
            return {
                "status": "success",
                "user_id": user_id,
                "stream_id": stream_id,
            }
            
        except Exception as e:
            logger.error(f"Error removing viewer: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_viewers(self, stream_id: str) -> List[Dict[str, Any]]:
        """الحصول على قائمة المشاهدين"""
        try:
            if stream_id not in self.stream_viewers:
                return []
            
            return [
                {
                    "user_id": user_id,
                    "is_banned": user_id in self.banned_users.get(stream_id, set()),
                    "is_muted": user_id in self.muted_users.get(stream_id, set()),
                }
                for user_id in list(self.stream_viewers[stream_id])[:100]
            ]
            
        except Exception as e:
            logger.error(f"Error getting viewers: {e}")
            return []

    # ==================== Moderation ====================

    async def mute_user(
        self,
        stream_id: str,
        user_id: int,
        moderator_id: int,
        reason: Optional[str] = None,
        duration_minutes: int = 5
    ) -> Dict[str, Any]:
        """كتم صوت المستخدم"""
        try:
            if stream_id not in self.active_streams:
                raise HTTPException(status_code=404, detail="البث غير موجود")
            
            # إضافة المستخدم للقائمة المكتومة
            self.muted_users[stream_id].add(user_id)
            
            # جدولة إزالة الكتم
            if duration_minutes > 0:
                asyncio.create_task(
                    self._schedule_unmute(stream_id, user_id, duration_minutes * 60)
                )
            
            logger.info(f"User {user_id} muted in stream {stream_id} by {moderator_id}")
            return {
                "status": "success",
                "user_id": user_id,
                "stream_id": stream_id,
                "action": "muted",
                "reason": reason,
                "duration_minutes": duration_minutes,
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error muting user: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def unmute_user(self, stream_id: str, user_id: int) -> Dict[str, Any]:
        """فك كتم صوت المستخدم"""
        try:
            if stream_id in self.muted_users:
                self.muted_users[stream_id].discard(user_id)
            
            logger.info(f"User {user_id} unmuted in stream {stream_id}")
            return {
                "status": "success",
                "user_id": user_id,
                "stream_id": stream_id,
                "action": "unmuted",
            }
            
        except Exception as e:
            logger.error(f"Error unmuting user: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def ban_user(
        self,
        stream_id: str,
        user_id: int,
        moderator_id: int,
        reason: Optional[str] = None,
        duration: BanDuration = BanDuration.TEMPORARY
    ) -> Dict[str, Any]:
        """حظر المستخدم"""
        try:
            if stream_id not in self.active_streams:
                raise HTTPException(status_code=404, detail="البث غير موجود")
            
            # إضافة المستخدم للقائمة المحظورة
            self.banned_users[stream_id].add(user_id)
            
            # إزالة من المشاهدين
            self.stream_viewers[stream_id].discard(user_id)
            
            # جدولة رفع الحظر إذا لم يكن دائماً
            if duration != BanDuration.PERMANENT:
                duration_seconds = {
                    BanDuration.TEMPORARY: 86400,  # 24 ساعة
                    BanDuration.LONG_TERM: 604800,  # 7 أيام
                }[duration]
                
                asyncio.create_task(
                    self._schedule_unban(stream_id, user_id, duration_seconds)
                )
            
            logger.info(f"User {user_id} banned from stream {stream_id} by {moderator_id}")
            return {
                "status": "success",
                "user_id": user_id,
                "stream_id": stream_id,
                "action": "banned",
                "reason": reason,
                "duration": duration.value,
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error banning user: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def unban_user(self, stream_id: str, user_id: int) -> Dict[str, Any]:
        """رفع حظر المستخدم"""
        try:
            if stream_id in self.banned_users:
                self.banned_users[stream_id].discard(user_id)
            
            logger.info(f"User {user_id} unbanned from stream {stream_id}")
            return {
                "status": "success",
                "user_id": user_id,
                "stream_id": stream_id,
                "action": "unbanned",
            }
            
        except Exception as e:
            logger.error(f"Error unbanning user: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def is_user_banned(self, stream_id: str, user_id: int) -> bool:
        """التحقق من حظر المستخدم"""
        return user_id in self.banned_users.get(stream_id, set())

    async def is_user_muted(self, stream_id: str, user_id: int) -> bool:
        """التحقق من كتم صوت المستخدم"""
        return user_id in self.muted_users.get(stream_id, set())

    # ==================== Camera Management ====================

    async def update_camera_state(
        self,
        stream_id: str,
        request: UpdateCameraStateRequest
    ) -> CameraStateResponse:
        """تحديث حالة الكاميرا"""
        try:
            if stream_id not in self.active_streams:
                raise HTTPException(status_code=404, detail="البث غير موجود")
            
            stream = self.active_streams[stream_id]
            
            if request.camera_enabled is not None:
                stream["camera_enabled"] = request.camera_enabled
            
            if request.microphone_enabled is not None:
                stream["microphone_enabled"] = request.microphone_enabled
            
            if request.screen_share_enabled is not None:
                stream["screen_share_enabled"] = request.screen_share_enabled
            
            if request.video_bitrate is not None:
                stream["video_bitrate"] = request.video_bitrate
            
            if request.audio_bitrate is not None:
                stream["audio_bitrate"] = request.audio_bitrate
            
            logger.info(f"Updated camera state for stream {stream_id}")
            
            return CameraStateResponse(
                camera_enabled=stream.get("camera_enabled", True),
                microphone_enabled=stream.get("microphone_enabled", True),
                screen_share_enabled=stream.get("screen_share_enabled", False),
                video_resolution=stream.get("video_resolution", "1280x720"),
                video_fps=stream.get("video_fps", 30),
                audio_bitrate=stream.get("audio_bitrate", 128),
                video_bitrate=stream.get("video_bitrate", 2500),
                is_recording=stream.get("is_recording", False),
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating camera state: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def close_camera(self, stream_id: str) -> Dict[str, Any]:
        """إغلاق الكاميرا"""
        try:
            if stream_id not in self.active_streams:
                raise HTTPException(status_code=404, detail="البث غير موجود")
            
            stream = self.active_streams[stream_id]
            stream["camera_enabled"] = False
            
            logger.info(f"Closed camera for stream {stream_id}")
            return {
                "status": "success",
                "stream_id": stream_id,
                "camera_enabled": False,
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error closing camera: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # ==================== Statistics ====================

    async def get_stream_stats(self, stream_id: str) -> Dict[str, Any]:
        """الحصول على إحصائيات البث"""
        try:
            if stream_id not in self.active_streams:
                raise HTTPException(status_code=404, detail="البث غير موجود")
            
            stream = self.active_streams[stream_id]
            stats = self.stream_stats.get(stream_id, {})
            
            return {
                "stream_id": stream_id,
                "status": stream.get("status"),
                "total_viewers": stream.get("total_viewers", 0),
                "peak_viewers": stream.get("peak_viewers", 0),
                "unique_viewers": stream.get("unique_viewers", 0),
                "total_hearts": stream.get("total_hearts", 0),
                "total_gifts": stream.get("total_gifts", 0),
                "total_comments": stream.get("total_comments", 0),
                "total_coins_earned": stream.get("total_coins_earned", 0.0),
                "duration_seconds": stream.get("duration_seconds", 0),
                "health_score": stream.get("health_score", 100),
                "bitrate": stats.get("bitrate", 0),
                "fps": stats.get("fps", 30),
                "latency_ms": stats.get("latency_ms", 0),
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting stream stats: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # ==================== Helper Methods ====================

    async def _schedule_unmute(self, stream_id: str, user_id: int, delay_seconds: int):
        """جدولة فك الكتم"""
        await asyncio.sleep(delay_seconds)
        await self.unmute_user(stream_id, user_id)

    async def _schedule_unban(self, stream_id: str, user_id: int, delay_seconds: int):
        """جدولة رفع الحظر"""
        await asyncio.sleep(delay_seconds)
        await self.unban_user(stream_id, user_id)

    async def get_stream(self, stream_id: str) -> Optional[Dict[str, Any]]:
        """الحصول على بيانات البث"""
        return self.active_streams.get(stream_id)

    async def get_active_streams(self, limit: int = 50) -> List[Dict[str, Any]]:
        """الحصول على البثوث النشطة"""
        active = [
            stream for stream in self.active_streams.values()
            if stream.get("status") == StreamStatus.ACTIVE.value
        ]
        return active[:limit]


# ==================== Router ====================

router = APIRouter(prefix="/live", tags=["live"])

# إنشاء خدمة مشتركة
live_service = ComprehensiveLiveService()


@router.post("/create")
async def create_stream(
    host_id: int,
    host_username: str,
    request: CreateStreamRequest
):
    """إنشاء بث مباشر جديد"""
    return await live_service.create_stream(host_id, host_username, request)


@router.post("/{stream_id}/start")
async def start_stream(stream_id: str, request: StartStreamRequest):
    """بدء البث المباشر"""
    return await live_service.start_stream(stream_id, request)


@router.post("/{stream_id}/end")
async def end_stream(stream_id: str):
    """إنهاء البث المباشر"""
    return await live_service.end_stream(stream_id)


@router.post("/{stream_id}/add-viewer")
async def add_viewer(
    stream_id: str,
    user_id: int,
    username: str,
    user_avatar: Optional[str] = None
):
    """إضافة مشاهد"""
    return await live_service.add_viewer(stream_id, user_id, username, user_avatar)


@router.post("/{stream_id}/remove-viewer")
async def remove_viewer(stream_id: str, user_id: int):
    """إزالة مشاهد"""
    return await live_service.remove_viewer(stream_id, user_id)


@router.get("/{stream_id}/viewers")
async def get_viewers(stream_id: str):
    """الحصول على قائمة المشاهدين"""
    return await live_service.get_viewers(stream_id)


@router.post("/{stream_id}/mute")
async def mute_user(
    stream_id: str,
    user_id: int,
    moderator_id: int,
    reason: Optional[str] = None,
    duration_minutes: int = 5
):
    """كتم صوت المستخدم"""
    return await live_service.mute_user(
        stream_id, user_id, moderator_id, reason, duration_minutes
    )


@router.post("/{stream_id}/unmute")
async def unmute_user(stream_id: str, user_id: int):
    """فك كتم صوت المستخدم"""
    return await live_service.unmute_user(stream_id, user_id)


@router.post("/{stream_id}/ban")
async def ban_user(
    stream_id: str,
    user_id: int,
    moderator_id: int,
    reason: Optional[str] = None,
    duration: BanDuration = BanDuration.TEMPORARY
):
    """حظر المستخدم"""
    return await live_service.ban_user(
        stream_id, user_id, moderator_id, reason, duration
    )


@router.post("/{stream_id}/unban")
async def unban_user(stream_id: str, user_id: int):
    """رفع حظر المستخدم"""
    return await live_service.unban_user(stream_id, user_id)


@router.put("/{stream_id}/camera")
async def update_camera_state(stream_id: str, request: UpdateCameraStateRequest):
    """تحديث حالة الكاميرا"""
    return await live_service.update_camera_state(stream_id, request)


@router.post("/{stream_id}/close-camera")
async def close_camera(stream_id: str):
    """إغلاق الكاميرا"""
    return await live_service.close_camera(stream_id)


@router.get("/{stream_id}/stats")
async def get_stream_stats(stream_id: str):
    """الحصول على إحصائيات البث"""
    return await live_service.get_stream_stats(stream_id)


@router.get("/{stream_id}")
async def get_stream(stream_id: str):
    """الحصول على بيانات البث"""
    stream = await live_service.get_stream(stream_id)
    if not stream:
        raise HTTPException(status_code=404, detail="البث غير موجود")
    return stream


@router.get("/")
async def get_active_streams(limit: int = Query(50, le=100)):
    """الحصول على البثوث النشطة"""
    return await live_service.get_active_streams(limit)
