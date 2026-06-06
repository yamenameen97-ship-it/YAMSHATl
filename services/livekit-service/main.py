"""خدمة LiveKit Production - LiveKit Production Service
يوفر:
- إدارة غرف البث المباشر (Live Rooms)
- إدارة الجودة التكيفية (Adaptive Bitrate)
- إدارة خوادم TURN/STUN
- إدارة SFU (Selective Forwarding Unit)
- تسجيل البث (Stream Recording)
- معالجة الأخطاء والإعادة التلقائية
"""

from fastapi import FastAPI, HTTPException, Query, Depends, WebSocket, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Set
from dataclasses import dataclass, asdict, field
from enum import Enum
import logging
import uuid
import aiohttp
from functools import lru_cache

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# إعدادات LiveKit
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "devkey")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "secret")
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
LIVEKIT_HTTP_URL = os.getenv("LIVEKIT_HTTP_URL", "http://localhost:7880")

app = FastAPI(
    title="Yamshat LiveKit Production Service",
    description="خدمة البث المباشر مع LiveKit Production",
    version="1.0.0"
)

# إضافة CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ تعريفات الأنواع ============

class StreamQuality(str, Enum):
    """جودة البث"""
    LOW = "low"          # 360p
    MEDIUM = "medium"    # 720p
    HIGH = "high"        # 1080p
    ULTRA = "ultra"      # 2K/4K


class StreamStatus(str, Enum):
    """حالة البث"""
    IDLE = "idle"
    STARTING = "starting"
    LIVE = "live"
    PAUSED = "paused"
    STOPPING = "stopping"
    STOPPED = "stopped"
    ERROR = "error"


class BitrateProfile(str, Enum):
    """ملف تعريف معدل البت"""
    ULTRA_LOW = "ultra_low"      # 500 kbps
    LOW = "low"                  # 1 mbps
    MEDIUM = "medium"            # 2.5 mbps
    HIGH = "high"                # 5 mbps
    ULTRA_HIGH = "ultra_high"    # 10+ mbps


@dataclass
class BitrateConfig:
    """إعدادات معدل البت التكيفي"""
    profile: BitrateProfile = BitrateProfile.MEDIUM
    min_bitrate: int = 500000      # 500 kbps
    max_bitrate: int = 5000000     # 5 mbps
    target_bitrate: int = 2500000  # 2.5 mbps
    fps: int = 30
    resolution: str = "1280x720"   # 720p
    codec: str = "h264"


@dataclass
class TURNServer:
    """خادم TURN"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    host: str = ""
    port: int = 3478
    username: str = ""
    password: str = ""
    protocol: str = "udp"  # udp, tcp, tls
    priority: int = 100
    is_active: bool = True
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class STUNServer:
    """خادم STUN"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    host: str = ""
    port: int = 3478
    protocol: str = "udp"
    priority: int = 100
    is_active: bool = True
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class StreamParticipant:
    """مشارك في البث"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    user_name: str = ""
    user_avatar: str = ""
    role: str = "viewer"  # broadcaster, moderator, viewer
    is_muted: bool = False
    is_camera_off: bool = False
    bitrate: int = 2500000
    quality: StreamQuality = StreamQuality.MEDIUM
    connection_quality: str = "good"  # good, fair, poor
    joined_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    left_at: Optional[str] = None


@dataclass
class LiveStream:
    """جلسة البث المباشر"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    room_name: str = ""
    title: str = ""
    description: str = ""
    broadcaster_id: str = ""
    broadcaster_name: str = ""
    status: StreamStatus = StreamStatus.IDLE
    participants: List[StreamParticipant] = field(default_factory=list)
    bitrate_config: BitrateConfig = field(default_factory=BitrateConfig)
    viewers_count: int = 0
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    duration: int = 0  # بالثواني
    is_recording: bool = False
    recording_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    metadata: Dict = field(default_factory=dict)


@dataclass
class StreamMetrics:
    """مقاييس البث"""
    stream_id: str = ""
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    bitrate: int = 0
    fps: int = 0
    resolution: str = ""
    packet_loss: float = 0.0  # نسبة فقدان الحزم (0-100)
    latency: int = 0  # بالميلي ثانية
    jitter: int = 0  # تذبذب التأخير
    connection_quality: str = "good"


# ============ مدير البث المباشر ============

class LiveStreamManager:
    """مدير البث المباشر"""

    def __init__(self):
        # البث النشط
        self.active_streams: Dict[str, LiveStream] = {}
        
        # الاتصالات النشطة
        self.active_connections: Dict[str, List[WebSocket]] = {}
        
        # سجل البث
        self.stream_history: List[LiveStream] = []
        
        # خوادم TURN
        self.turn_servers: List[TURNServer] = []
        
        # خوادم STUN
        self.stun_servers: List[STUNServer] = []
        
        # مقاييس البث
        self.stream_metrics: Dict[str, List[StreamMetrics]] = {}
        
        # حالة الاتصال
        self.connection_status: Dict[str, str] = {}

    async def initialize_servers(self):
        """تهيئة خوادم TURN/STUN الافتراضية"""
        # خوادم STUN العامة
        default_stun_servers = [
            {"host": "stun.l.google.com", "port": 19302},
            {"host": "stun1.l.google.com", "port": 19302},
            {"host": "stun2.l.google.com", "port": 19302},
            {"host": "stun3.l.google.com", "port": 19302},
            {"host": "stun4.l.google.com", "port": 19302},
        ]
        
        for i, server_config in enumerate(default_stun_servers):
            stun = STUNServer(
                host=server_config["host"],
                port=server_config["port"],
                priority=100 - i
            )
            self.stun_servers.append(stun)
        
        logger.info(f"Initialized {len(self.stun_servers)} STUN servers")

    async def create_stream(
        self,
        title: str,
        description: str,
        broadcaster_id: str,
        broadcaster_name: str,
        quality: StreamQuality = StreamQuality.HIGH
    ) -> LiveStream:
        """إنشاء بث مباشر جديد"""
        room_name = f"room_{uuid.uuid4().hex[:8]}"
        
        stream = LiveStream(
            room_name=room_name,
            title=title,
            description=description,
            broadcaster_id=broadcaster_id,
            broadcaster_name=broadcaster_name,
            status=StreamStatus.STARTING
        )
        
        # تعيين ملف تعريف معدل البت بناءً على الجودة
        stream.bitrate_config = self._get_bitrate_config(quality)
        
        # إضافة المبث كمشارك
        broadcaster = StreamParticipant(
            user_id=broadcaster_id,
            user_name=broadcaster_name,
            role="broadcaster"
        )
        stream.participants.append(broadcaster)
        
        self.active_streams[stream.id] = stream
        self.active_connections[stream.id] = []
        self.stream_metrics[stream.id] = []
        
        logger.info(f"Stream created: {stream.id} ({room_name})")
        return stream

    def _get_bitrate_config(self, quality: StreamQuality) -> BitrateConfig:
        """الحصول على إعدادات معدل البت بناءً على الجودة"""
        configs = {
            StreamQuality.LOW: BitrateConfig(
                profile=BitrateProfile.LOW,
                min_bitrate=500000,
                max_bitrate=1500000,
                target_bitrate=1000000,
                fps=24,
                resolution="854x480"
            ),
            StreamQuality.MEDIUM: BitrateConfig(
                profile=BitrateProfile.MEDIUM,
                min_bitrate=1000000,
                max_bitrate=3000000,
                target_bitrate=2500000,
                fps=30,
                resolution="1280x720"
            ),
            StreamQuality.HIGH: BitrateConfig(
                profile=BitrateProfile.HIGH,
                min_bitrate=2500000,
                max_bitrate=6000000,
                target_bitrate=5000000,
                fps=30,
                resolution="1920x1080"
            ),
            StreamQuality.ULTRA: BitrateConfig(
                profile=BitrateProfile.ULTRA_HIGH,
                min_bitrate=5000000,
                max_bitrate=15000000,
                target_bitrate=10000000,
                fps=60,
                resolution="3840x2160"
            ),
        }
        return configs.get(quality, BitrateConfig())

    async def start_stream(self, stream_id: str) -> bool:
        """بدء البث المباشر"""
        if stream_id not in self.active_streams:
            return False
        
        stream = self.active_streams[stream_id]
        stream.status = StreamStatus.LIVE
        stream.started_at = datetime.utcnow().isoformat()
        
        logger.info(f"Stream started: {stream_id}")
        return True

    async def stop_stream(self, stream_id: str) -> bool:
        """إيقاف البث المباشر"""
        if stream_id not in self.active_streams:
            return False
        
        stream = self.active_streams[stream_id]
        stream.status = StreamStatus.STOPPED
        stream.ended_at = datetime.utcnow().isoformat()
        
        # حساب المدة
        if stream.started_at:
            start = datetime.fromisoformat(stream.started_at)
            end = datetime.fromisoformat(stream.ended_at)
            stream.duration = int((end - start).total_seconds())
        
        # إضافة إلى السجل
        self.stream_history.append(stream)
        
        # تنظيف الاتصالات
        if stream_id in self.active_connections:
            del self.active_connections[stream_id]
        
        logger.info(f"Stream stopped: {stream_id}")
        return True

    async def add_viewer(
        self,
        stream_id: str,
        user_id: str,
        user_name: str
    ) -> bool:
        """إضافة مشاهد للبث"""
        if stream_id not in self.active_streams:
            return False
        
        stream = self.active_streams[stream_id]
        
        # التحقق من عدم وجود المشاهد بالفعل
        if any(p.user_id == user_id for p in stream.participants):
            return False
        
        viewer = StreamParticipant(
            user_id=user_id,
            user_name=user_name,
            role="viewer"
        )
        stream.participants.append(viewer)
        stream.viewers_count += 1
        
        logger.info(f"Viewer {user_id} joined stream {stream_id}")
        return True

    async def remove_viewer(self, stream_id: str, user_id: str) -> bool:
        """إزالة مشاهد من البث"""
        if stream_id not in self.active_streams:
            return False
        
        stream = self.active_streams[stream_id]
        for participant in stream.participants:
            if participant.user_id == user_id and participant.role == "viewer":
                participant.left_at = datetime.utcnow().isoformat()
                stream.viewers_count = max(0, stream.viewers_count - 1)
                logger.info(f"Viewer {user_id} left stream {stream_id}")
                return True
        
        return False

    async def update_bitrate(
        self,
        stream_id: str,
        new_bitrate: int,
        quality: Optional[StreamQuality] = None
    ) -> bool:
        """تحديث معدل البت (Adaptive Bitrate)"""
        if stream_id not in self.active_streams:
            return False
        
        stream = self.active_streams[stream_id]
        
        if quality:
            stream.bitrate_config = self._get_bitrate_config(quality)
        else:
            # تحديث معدل البت فقط
            stream.bitrate_config.target_bitrate = new_bitrate
            stream.bitrate_config.max_bitrate = max(
                stream.bitrate_config.max_bitrate,
                new_bitrate
            )
        
        logger.info(f"Bitrate updated for stream {stream_id}: {new_bitrate} bps")
        return True

    async def record_metrics(self, stream_id: str, metrics: StreamMetrics) -> bool:
        """تسجيل مقاييس البث"""
        if stream_id not in self.stream_metrics:
            return False
        
        self.stream_metrics[stream_id].append(metrics)
        
        # الاحتفاظ بآخر 1000 قياس فقط
        if len(self.stream_metrics[stream_id]) > 1000:
            self.stream_metrics[stream_id] = self.stream_metrics[stream_id][-1000:]
        
        return True

    def get_stream(self, stream_id: str) -> Optional[LiveStream]:
        """الحصول على تفاصيل البث"""
        return self.active_streams.get(stream_id)

    def get_stream_metrics(
        self,
        stream_id: str,
        limit: int = 100
    ) -> List[StreamMetrics]:
        """الحصول على مقاييس البث"""
        if stream_id not in self.stream_metrics:
            return []
        return self.stream_metrics[stream_id][-limit:]

    def get_turn_servers(self) -> List[Dict]:
        """الحصول على قائمة خوادم TURN النشطة"""
        return [
            asdict(server) for server in self.turn_servers
            if server.is_active
        ]

    def get_stun_servers(self) -> List[Dict]:
        """الحصول على قائمة خوادم STUN النشطة"""
        return [
            asdict(server) for server in self.stun_servers
            if server.is_active
        ]


# ============ مثيل مدير البث ============

stream_manager = LiveStreamManager()


# ============ المسارات (Routes) ============

@app.on_event("startup")
async def startup_event():
    """تهيئة الخدمة عند البدء"""
    await stream_manager.initialize_servers()
    logger.info("LiveKit Production Service started")


@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "livekit-production-service",
        "version": "1.0.0",
        "livekit_url": LIVEKIT_URL,
        "active_streams": len(stream_manager.active_streams)
    }


@app.post("/streams")
async def create_stream(
    title: str = Query(...),
    description: str = Query(...),
    broadcaster_id: str = Query(...),
    broadcaster_name: str = Query(...),
    quality: StreamQuality = Query(StreamQuality.HIGH)
):
    """إنشاء بث مباشر جديد"""
    try:
        stream = await stream_manager.create_stream(
            title,
            description,
            broadcaster_id,
            broadcaster_name,
            quality
        )
        return {
            "success": True,
            "stream_id": stream.id,
            "room_name": stream.room_name,
            "stream": asdict(stream)
        }
    except Exception as e:
        logger.error(f"Error creating stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/streams/{stream_id}")
async def get_stream(stream_id: str):
    """الحصول على تفاصيل البث"""
    try:
        stream = stream_manager.get_stream(stream_id)
        if stream:
            return {
                "success": True,
                "stream": asdict(stream)
            }
        else:
            raise HTTPException(status_code=404, detail="البث غير موجود")
    except Exception as e:
        logger.error(f"Error getting stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/streams/{stream_id}/start")
async def start_stream(stream_id: str):
    """بدء البث المباشر"""
    try:
        if await stream_manager.start_stream(stream_id):
            return {"success": True, "message": "تم بدء البث"}
        else:
            raise HTTPException(status_code=404, detail="البث غير موجود")
    except Exception as e:
        logger.error(f"Error starting stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/streams/{stream_id}/stop")
async def stop_stream(stream_id: str):
    """إيقاف البث المباشر"""
    try:
        if await stream_manager.stop_stream(stream_id):
            return {"success": True, "message": "تم إيقاف البث"}
        else:
            raise HTTPException(status_code=404, detail="البث غير موجود")
    except Exception as e:
        logger.error(f"Error stopping stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/streams/{stream_id}/viewers")
async def add_viewer(
    stream_id: str,
    user_id: str = Query(...),
    user_name: str = Query(...)
):
    """إضافة مشاهد للبث"""
    try:
        if await stream_manager.add_viewer(stream_id, user_id, user_name):
            return {"success": True, "message": "تم إضافة المشاهد"}
        else:
            raise HTTPException(status_code=400, detail="فشل إضافة المشاهد")
    except Exception as e:
        logger.error(f"Error adding viewer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/streams/{stream_id}/viewers/{user_id}")
async def remove_viewer(stream_id: str, user_id: str):
    """إزالة مشاهد من البث"""
    try:
        if await stream_manager.remove_viewer(stream_id, user_id):
            return {"success": True, "message": "تم إزالة المشاهد"}
        else:
            raise HTTPException(status_code=400, detail="فشل إزالة المشاهد")
    except Exception as e:
        logger.error(f"Error removing viewer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/streams/{stream_id}/bitrate")
async def update_bitrate(
    stream_id: str,
    bitrate: int = Query(...),
    quality: Optional[StreamQuality] = Query(None)
):
    """تحديث معدل البت (Adaptive Bitrate)"""
    try:
        if await stream_manager.update_bitrate(stream_id, bitrate, quality):
            return {"success": True, "message": "تم تحديث معدل البت"}
        else:
            raise HTTPException(status_code=404, detail="البث غير موجود")
    except Exception as e:
        logger.error(f"Error updating bitrate: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/streams/{stream_id}/metrics")
async def get_stream_metrics(stream_id: str, limit: int = Query(100)):
    """الحصول على مقاييس البث"""
    try:
        metrics = stream_manager.get_stream_metrics(stream_id, limit)
        return {
            "success": True,
            "metrics": [asdict(m) for m in metrics]
        }
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/servers/turn")
async def get_turn_servers():
    """الحصول على قائمة خوادم TURN"""
    try:
        servers = stream_manager.get_turn_servers()
        return {
            "success": True,
            "servers": servers
        }
    except Exception as e:
        logger.error(f"Error getting TURN servers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/servers/stun")
async def get_stun_servers():
    """الحصول على قائمة خوادم STUN"""
    try:
        servers = stream_manager.get_stun_servers()
        return {
            "success": True,
            "servers": servers
        }
    except Exception as e:
        logger.error(f"Error getting STUN servers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
