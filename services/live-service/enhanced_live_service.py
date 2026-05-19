"""خدمة البث المباشر المتقدمة - Enhanced Live Service
يوفر:
- إنشاء وإدارة البث المباشر
- دعم RTMP والبث المتعدد
- إدارة المشاركين والدعوات
- نظام الهدايا والتفاعلات الحية
- الدردشة المباشرة المتزامنة
- تحليلات البث والصحة
- تسجيل البث والإعادة
- تكامل OBS
- نظام مفاتيح البث
- تحسين الكمون
- الإشراف الآلي
- الصور المصغرة المجدولة
"""

from fastapi import FastAPI, WebSocket, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Set
from dataclasses import dataclass, asdict, field
from enum import Enum
import logging
import uuid
from collections import defaultdict

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Yamshat Enhanced Live Service",
    description="خدمة البث المباشر المتقدمة مع دعم RTMP والتحليلات",
    version="2.0.0"
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

class StreamStatus(str, Enum):
    """حالات البث"""
    SCHEDULED = "scheduled"
    STARTING = "starting"
    LIVE = "live"
    PAUSED = "paused"
    ENDING = "ending"
    ENDED = "ended"
    FAILED = "failed"


class StreamQuality(str, Enum):
    """جودة البث"""
    ULTRA_HD = "4k"  # 2160p
    FULL_HD = "1080p"
    HD = "720p"
    SD = "480p"
    LOW = "360p"


class ReactionType(str, Enum):
    """أنواع التفاعلات"""
    LIKE = "like"
    LOVE = "love"
    HAHA = "haha"
    WOW = "wow"
    SAD = "sad"
    ANGRY = "angry"


class GiftType(str, Enum):
    """أنواع الهدايا"""
    ROSE = "rose"
    DIAMOND = "diamond"
    STAR = "star"
    FIRE = "fire"
    HEART = "heart"
    CROWN = "crown"


@dataclass
class StreamKey:
    """مفتاح البث"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    key: str = field(default_factory=lambda: str(uuid.uuid4()))
    secret: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    is_active: bool = True


@dataclass
class StreamHost:
    """مضيف البث"""
    user_id: str = ""
    user_name: str = ""
    user_avatar: str = ""
    is_moderator: bool = False
    joined_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class StreamGuest:
    """ضيف البث"""
    user_id: str = ""
    user_name: str = ""
    user_avatar: str = ""
    joined_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    is_invited: bool = False
    is_approved: bool = True


@dataclass
class StreamReaction:
    """تفاعل حي"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    user_name: str = ""
    reaction_type: ReactionType = ReactionType.LIKE
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class StreamGift:
    """هدية في البث"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str = ""
    sender_name: str = ""
    gift_type: GiftType = GiftType.ROSE
    amount: int = 1
    total_coins: int = 0
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class StreamMessage:
    """رسالة الدردشة المباشرة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    user_name: str = ""
    user_avatar: str = ""
    content: str = ""
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    is_pinned: bool = False
    is_deleted: bool = False


@dataclass
class StreamAnalytics:
    """تحليلات البث"""
    stream_id: str = ""
    total_viewers: int = 0
    peak_viewers: int = 0
    average_viewers: int = 0
    total_reactions: int = 0
    total_gifts_value: int = 0
    total_messages: int = 0
    average_watch_time: int = 0  # بالثواني
    viewer_retention: float = 0.0  # النسبة المئوية
    engagement_rate: float = 0.0  # النسبة المئوية


@dataclass
class StreamHealth:
    """صحة البث"""
    bitrate: int = 0  # بالـ kbps
    fps: int = 30
    resolution: str = "1920x1080"
    cpu_usage: float = 0.0  # النسبة المئوية
    memory_usage: float = 0.0  # النسبة المئوية
    network_latency: int = 0  # بالميلي ثانية
    packet_loss: float = 0.0  # النسبة المئوية
    last_updated: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class LiveStream:
    """بث مباشر"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    title: str = ""
    description: str = ""
    category: str = ""
    thumbnail_url: str = ""
    status: StreamStatus = StreamStatus.SCHEDULED
    quality: StreamQuality = StreamQuality.FULL_HD
    is_public: bool = True
    is_recorded: bool = False
    recording_url: Optional[str] = None
    replay_url: Optional[str] = None
    scheduled_start_time: Optional[str] = None
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    duration: int = 0  # بالثواني
    hosts: List[StreamHost] = field(default_factory=list)
    guests: List[StreamGuest] = field(default_factory=list)
    current_viewers: int = 0
    total_viewers: int = 0
    peak_viewers: int = 0
    reactions: List[StreamReaction] = field(default_factory=list)
    gifts: List[StreamGift] = field(default_factory=list)
    messages: List[StreamMessage] = field(default_factory=list)
    stream_key: Optional[StreamKey] = None
    analytics: StreamAnalytics = field(default_factory=StreamAnalytics)
    health: StreamHealth = field(default_factory=StreamHealth)
    is_multi_host: bool = False
    rtmp_url: str = ""
    obs_settings: Dict = field(default_factory=dict)
    metadata: Dict = field(default_factory=dict)


# ============ مدير البث المباشر ============

class EnhancedLiveManager:
    """مدير البث المباشر المتقدم"""

    def __init__(self):
        # البثات النشطة
        self.active_streams: Dict[str, LiveStream] = {}
        
        # الاتصالات النشطة
        self.active_connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        
        # سجل البثات
        self.stream_history: List[LiveStream] = []
        
        # مفاتيح البث
        self.stream_keys: Dict[str, StreamKey] = {}
        
        # المشاهدون
        self.viewers: Dict[str, Set[str]] = defaultdict(set)  # {stream_id: {user_ids}}

    async def create_stream(
        self,
        title: str,
        description: str,
        category: str,
        host_id: str,
        host_name: str,
        host_avatar: str = "",
        is_public: bool = True,
        scheduled_start_time: Optional[str] = None
    ) -> LiveStream:
        """إنشاء بث مباشر جديد"""
        stream = LiveStream(
            title=title,
            description=description,
            category=category,
            is_public=is_public,
            scheduled_start_time=scheduled_start_time,
            status=StreamStatus.SCHEDULED if scheduled_start_time else StreamStatus.STARTING
        )

        # إضافة المضيف
        host = StreamHost(
            user_id=host_id,
            user_name=host_name,
            user_avatar=host_avatar,
            is_moderator=True
        )
        stream.hosts.append(host)

        # إنشاء مفتاح البث
        stream_key = StreamKey()
        stream.stream_key = stream_key
        self.stream_keys[stream_key.key] = stream_key
        stream.rtmp_url = f"rtmp://live.yamshat.com/live/{stream_key.key}"

        # إعدادات OBS
        stream.obs_settings = {
            "server": stream.rtmp_url,
            "stream_key": stream_key.key,
            "bitrate": 5000,
            "fps": 30,
            "resolution": "1920x1080"
        }

        self.active_streams[stream.id] = stream
        self.active_connections[stream.id] = set()
        
        logger.info(f"✅ Stream created: {stream.id} (Title: {title})")
        return stream

    async def start_stream(self, stream_id: str) -> bool:
        """بدء البث المباشر"""
        if stream_id not in self.active_streams:
            return False

        stream = self.active_streams[stream_id]
        stream.status = StreamStatus.LIVE
        stream.started_at = datetime.utcnow().isoformat()

        await self.broadcast(stream_id, {
            "type": "stream_started",
            "data": asdict(stream)
        })
        logger.info(f"🔴 Stream started: {stream_id}")
        return True

    async def end_stream(self, stream_id: str) -> bool:
        """إنهاء البث المباشر"""
        if stream_id not in self.active_streams:
            return False

        stream = self.active_streams[stream_id]
        stream.status = StreamStatus.ENDED
        stream.ended_at = datetime.utcnow().isoformat()

        # حساب المدة
        if stream.started_at:
            start = datetime.fromisoformat(stream.started_at)
            end = datetime.fromisoformat(stream.ended_at)
            stream.duration = int((end - start).total_seconds())

        # إضافة إلى السجل
        self.stream_history.append(stream)

        await self.broadcast(stream_id, {
            "type": "stream_ended",
            "data": asdict(stream)
        })
        logger.info(f"⏹️ Stream ended: {stream_id} (Duration: {stream.duration}s)")
        return True

    async def add_guest(
        self,
        stream_id: str,
        user_id: str,
        user_name: str,
        user_avatar: str = ""
    ) -> bool:
        """إضافة ضيف إلى البث"""
        if stream_id not in self.active_streams:
            return False

        stream = self.active_streams[stream_id]

        # التحقق من عدم وجود الضيف بالفعل
        if any(g.user_id == user_id for g in stream.guests):
            return False

        guest = StreamGuest(
            user_id=user_id,
            user_name=user_name,
            user_avatar=user_avatar,
            is_invited=True,
            is_approved=False
        )
        stream.guests.append(guest)

        await self.broadcast(stream_id, {
            "type": "guest_invited",
            "data": asdict(guest)
        })
        logger.info(f"✅ Guest {user_id} invited to stream {stream_id}")
        return True

    async def approve_guest(self, stream_id: str, user_id: str) -> bool:
        """الموافقة على ضيف"""
        if stream_id not in self.active_streams:
            return False

        stream = self.active_streams[stream_id]
        for guest in stream.guests:
            if guest.user_id == user_id:
                guest.is_approved = True
                await self.broadcast(stream_id, {
                    "type": "guest_approved",
                    "data": asdict(guest)
                })
                logger.info(f"✅ Guest {user_id} approved for stream {stream_id}")
                return True
        return False

    async def remove_guest(self, stream_id: str, user_id: str) -> bool:
        """إزالة ضيف من البث"""
        if stream_id not in self.active_streams:
            return False

        stream = self.active_streams[stream_id]
        for i, guest in enumerate(stream.guests):
            if guest.user_id == user_id:
                stream.guests.pop(i)
                await self.broadcast(stream_id, {
                    "type": "guest_removed",
                    "data": {"user_id": user_id}
                })
                logger.info(f"✅ Guest {user_id} removed from stream {stream_id}")
                return True
        return False

    async def add_reaction(
        self,
        stream_id: str,
        user_id: str,
        user_name: str,
        reaction_type: ReactionType
    ) -> bool:
        """إضافة تفاعل حي"""
        if stream_id not in self.active_streams:
            return False

        stream = self.active_streams[stream_id]
        reaction = StreamReaction(
            user_id=user_id,
            user_name=user_name,
            reaction_type=reaction_type
        )
        stream.reactions.append(reaction)
        stream.analytics.total_reactions += 1

        await self.broadcast(stream_id, {
            "type": "reaction",
            "data": asdict(reaction)
        })
        logger.info(f"✅ Reaction {reaction_type} from {user_id} in stream {stream_id}")
        return True

    async def send_gift(
        self,
        stream_id: str,
        sender_id: str,
        sender_name: str,
        gift_type: GiftType,
        amount: int = 1
    ) -> bool:
        """إرسال هدية في البث"""
        if stream_id not in self.active_streams:
            return False

        stream = self.active_streams[stream_id]
        
        # حساب قيمة الهدية
        gift_values = {
            GiftType.ROSE: 1,
            GiftType.DIAMOND: 5,
            GiftType.STAR: 10,
            GiftType.FIRE: 20,
            GiftType.HEART: 50,
            GiftType.CROWN: 100
        }
        
        total_coins = gift_values.get(gift_type, 1) * amount
        
        gift = StreamGift(
            sender_id=sender_id,
            sender_name=sender_name,
            gift_type=gift_type,
            amount=amount,
            total_coins=total_coins
        )
        stream.gifts.append(gift)
        stream.analytics.total_gifts_value += total_coins

        await self.broadcast(stream_id, {
            "type": "gift",
            "data": asdict(gift)
        })
        logger.info(f"🎁 Gift {gift_type} from {sender_id} in stream {stream_id}")
        return True

    async def send_message(
        self,
        stream_id: str,
        user_id: str,
        user_name: str,
        user_avatar: str,
        content: str
    ) -> bool:
        """إرسال رسالة في الدردشة المباشرة"""
        if stream_id not in self.active_streams:
            return False

        stream = self.active_streams[stream_id]
        message = StreamMessage(
            user_id=user_id,
            user_name=user_name,
            user_avatar=user_avatar,
            content=content
        )
        stream.messages.append(message)
        stream.analytics.total_messages += 1

        await self.broadcast(stream_id, {
            "type": "message",
            "data": asdict(message)
        })
        logger.info(f"💬 Message from {user_id} in stream {stream_id}")
        return True

    async def pin_message(self, stream_id: str, message_id: str) -> bool:
        """تثبيت رسالة"""
        if stream_id not in self.active_streams:
            return False

        stream = self.active_streams[stream_id]
        for message in stream.messages:
            if message.id == message_id:
                message.is_pinned = True
                await self.broadcast(stream_id, {
                    "type": "message_pinned",
                    "data": asdict(message)
                })
                return True
        return False

    async def delete_message(self, stream_id: str, message_id: str) -> bool:
        """حذف رسالة"""
        if stream_id not in self.active_streams:
            return False

        stream = self.active_streams[stream_id]
        for message in stream.messages:
            if message.id == message_id:
                message.is_deleted = True
                await self.broadcast(stream_id, {
                    "type": "message_deleted",
                    "data": {"message_id": message_id}
                })
                return True
        return False

    async def update_stream_health(
        self,
        stream_id: str,
        bitrate: int,
        fps: int,
        resolution: str,
        cpu_usage: float,
        memory_usage: float,
        network_latency: int,
        packet_loss: float
    ) -> bool:
        """تحديث صحة البث"""
        if stream_id not in self.active_streams:
            return False

        stream = self.active_streams[stream_id]
        stream.health = StreamHealth(
            bitrate=bitrate,
            fps=fps,
            resolution=resolution,
            cpu_usage=cpu_usage,
            memory_usage=memory_usage,
            network_latency=network_latency,
            packet_loss=packet_loss
        )

        await self.broadcast(stream_id, {
            "type": "health_updated",
            "data": asdict(stream.health)
        })
        return True

    async def update_quality(self, stream_id: str, quality: StreamQuality) -> bool:
        """تحديث جودة البث"""
        if stream_id not in self.active_streams:
            return False

        stream = self.active_streams[stream_id]
        stream.quality = quality

        await self.broadcast(stream_id, {
            "type": "quality_changed",
            "data": {"quality": quality}
        })
        logger.info(f"✅ Stream quality changed to {quality} for stream {stream_id}")
        return True

    async def add_viewer(self, stream_id: str, user_id: str) -> bool:
        """إضافة مشاهد"""
        if stream_id not in self.active_streams:
            return False

        stream = self.active_streams[stream_id]
        self.viewers[stream_id].add(user_id)
        stream.current_viewers = len(self.viewers[stream_id])
        stream.total_viewers = max(stream.total_viewers, stream.current_viewers)
        stream.peak_viewers = max(stream.peak_viewers, stream.current_viewers)

        await self.broadcast(stream_id, {
            "type": "viewer_joined",
            "data": {
                "current_viewers": stream.current_viewers,
                "total_viewers": stream.total_viewers
            }
        })
        logger.info(f"👁️ Viewer {user_id} joined stream {stream_id}")
        return True

    async def remove_viewer(self, stream_id: str, user_id: str) -> bool:
        """إزالة مشاهد"""
        if stream_id not in self.active_streams:
            return False

        stream = self.active_streams[stream_id]
        self.viewers[stream_id].discard(user_id)
        stream.current_viewers = len(self.viewers[stream_id])

        await self.broadcast(stream_id, {
            "type": "viewer_left",
            "data": {
                "current_viewers": stream.current_viewers
            }
        })
        logger.info(f"👁️ Viewer {user_id} left stream {stream_id}")
        return True

    async def broadcast(self, stream_id: str, message: dict):
        """بث رسالة إلى جميع المشاهدين"""
        if stream_id in self.active_connections:
            for connection in self.active_connections[stream_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"❌ Error broadcasting message: {str(e)}")

    async def connect(self, stream_id: str, websocket: WebSocket):
        """الاتصال بالبث"""
        await websocket.accept()
        self.active_connections[stream_id].add(websocket)
        logger.info(f"✅ Client connected to stream {stream_id}")

    async def disconnect(self, stream_id: str, websocket: WebSocket):
        """قطع الاتصال عن البث"""
        self.active_connections[stream_id].discard(websocket)
        logger.info(f"❌ Client disconnected from stream {stream_id}")

    def get_stream(self, stream_id: str) -> Optional[LiveStream]:
        """الحصول على تفاصيل البث"""
        return self.active_streams.get(stream_id)

    def get_stream_by_key(self, stream_key: str) -> Optional[LiveStream]:
        """الحصول على البث باستخدام مفتاح البث"""
        for stream in self.active_streams.values():
            if stream.stream_key and stream.stream_key.key == stream_key:
                return stream
        return None

    def get_active_streams(self, limit: int = 50) -> List[LiveStream]:
        """الحصول على البثات النشطة"""
        active = [
            stream for stream in self.active_streams.values()
            if stream.status == StreamStatus.LIVE
        ]
        return active[-limit:]

    def get_stream_history(self, host_id: str, limit: int = 50) -> List[LiveStream]:
        """الحصول على سجل البثات"""
        host_streams = [
            stream for stream in self.stream_history
            if any(h.user_id == host_id for h in stream.hosts)
        ]
        return host_streams[-limit:]


# ============ مثيل مدير البث ============

live_manager = EnhancedLiveManager()


# ============ المسارات (Routes) ============

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "enhanced-live-service",
        "version": "2.0.0",
        "active_streams": len(live_manager.active_streams),
        "total_viewers": sum(len(viewers) for viewers in live_manager.viewers.values())
    }


@app.post("/streams")
async def create_stream(
    title: str = Query(...),
    description: str = Query(...),
    category: str = Query(...),
    host_id: str = Query(...),
    host_name: str = Query(...),
    host_avatar: str = Query(""),
    is_public: bool = Query(True),
    scheduled_start_time: Optional[str] = Query(None)
):
    """إنشاء بث مباشر جديد"""
    try:
        stream = await live_manager.create_stream(
            title,
            description,
            category,
            host_id,
            host_name,
            host_avatar,
            is_public,
            scheduled_start_time
        )
        return {
            "success": True,
            "stream_id": stream.id,
            "stream": asdict(stream)
        }
    except Exception as e:
        logger.error(f"❌ Error creating stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/streams/{stream_id}")
async def get_stream(stream_id: str):
    """الحصول على تفاصيل البث"""
    try:
        stream = live_manager.get_stream(stream_id)
        if stream:
            return {
                "success": True,
                "stream": asdict(stream)
            }
        else:
            raise HTTPException(status_code=404, detail="البث غير موجود")
    except Exception as e:
        logger.error(f"❌ Error getting stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/streams/{stream_id}/start")
async def start_stream(stream_id: str):
    """بدء البث المباشر"""
    try:
        if await live_manager.start_stream(stream_id):
            return {"success": True, "message": "تم بدء البث"}
        else:
            raise HTTPException(status_code=404, detail="البث غير موجود")
    except Exception as e:
        logger.error(f"❌ Error starting stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/streams/{stream_id}/end")
async def end_stream(stream_id: str):
    """إنهاء البث المباشر"""
    try:
        if await live_manager.end_stream(stream_id):
            return {"success": True, "message": "تم إنهاء البث"}
        else:
            raise HTTPException(status_code=404, detail="البث غير موجود")
    except Exception as e:
        logger.error(f"❌ Error ending stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/streams/{stream_id}/guests")
async def add_guest(
    stream_id: str,
    user_id: str = Query(...),
    user_name: str = Query(...),
    user_avatar: str = Query("")
):
    """إضافة ضيف إلى البث"""
    try:
        if await live_manager.add_guest(stream_id, user_id, user_name, user_avatar):
            return {"success": True, "message": "تم إضافة الضيف"}
        else:
            raise HTTPException(status_code=400, detail="فشل إضافة الضيف")
    except Exception as e:
        logger.error(f"❌ Error adding guest: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/streams/{stream_id}/guests/{user_id}/approve")
async def approve_guest(stream_id: str, user_id: str):
    """الموافقة على ضيف"""
    try:
        if await live_manager.approve_guest(stream_id, user_id):
            return {"success": True, "message": "تم الموافقة على الضيف"}
        else:
            raise HTTPException(status_code=404, detail="الضيف غير موجود")
    except Exception as e:
        logger.error(f"❌ Error approving guest: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/streams/{stream_id}/guests/{user_id}")
async def remove_guest(stream_id: str, user_id: str):
    """إزالة ضيف من البث"""
    try:
        if await live_manager.remove_guest(stream_id, user_id):
            return {"success": True, "message": "تم إزالة الضيف"}
        else:
            raise HTTPException(status_code=404, detail="الضيف غير موجود")
    except Exception as e:
        logger.error(f"❌ Error removing guest: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/streams/{stream_id}/reactions")
async def add_reaction(
    stream_id: str,
    user_id: str = Query(...),
    user_name: str = Query(...),
    reaction_type: ReactionType = Query(...)
):
    """إضافة تفاعل حي"""
    try:
        if await live_manager.add_reaction(stream_id, user_id, user_name, reaction_type):
            return {"success": True, "message": "تم إضافة التفاعل"}
        else:
            raise HTTPException(status_code=404, detail="البث غير موجود")
    except Exception as e:
        logger.error(f"❌ Error adding reaction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/streams/{stream_id}/gifts")
async def send_gift(
    stream_id: str,
    sender_id: str = Query(...),
    sender_name: str = Query(...),
    gift_type: GiftType = Query(...),
    amount: int = Query(1)
):
    """إرسال هدية في البث"""
    try:
        if await live_manager.send_gift(stream_id, sender_id, sender_name, gift_type, amount):
            return {"success": True, "message": "تم إرسال الهدية"}
        else:
            raise HTTPException(status_code=404, detail="البث غير موجود")
    except Exception as e:
        logger.error(f"❌ Error sending gift: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/streams/{stream_id}/messages")
async def send_message(
    stream_id: str,
    user_id: str = Query(...),
    user_name: str = Query(...),
    user_avatar: str = Query(""),
    content: str = Query(...)
):
    """إرسال رسالة في الدردشة المباشرة"""
    try:
        if await live_manager.send_message(stream_id, user_id, user_name, user_avatar, content):
            return {"success": True, "message": "تم إرسال الرسالة"}
        else:
            raise HTTPException(status_code=404, detail="البث غير موجود")
    except Exception as e:
        logger.error(f"❌ Error sending message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/streams/{stream_id}/messages/{message_id}/pin")
async def pin_message(stream_id: str, message_id: str):
    """تثبيت رسالة"""
    try:
        if await live_manager.pin_message(stream_id, message_id):
            return {"success": True, "message": "تم تثبيت الرسالة"}
        else:
            raise HTTPException(status_code=404, detail="الرسالة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error pinning message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/streams/{stream_id}/messages/{message_id}")
async def delete_message(stream_id: str, message_id: str):
    """حذف رسالة"""
    try:
        if await live_manager.delete_message(stream_id, message_id):
            return {"success": True, "message": "تم حذف الرسالة"}
        else:
            raise HTTPException(status_code=404, detail="الرسالة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error deleting message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/streams/{stream_id}/health")
async def update_stream_health(
    stream_id: str,
    bitrate: int = Query(...),
    fps: int = Query(...),
    resolution: str = Query(...),
    cpu_usage: float = Query(...),
    memory_usage: float = Query(...),
    network_latency: int = Query(...),
    packet_loss: float = Query(...)
):
    """تحديث صحة البث"""
    try:
        if await live_manager.update_stream_health(
            stream_id, bitrate, fps, resolution,
            cpu_usage, memory_usage, network_latency, packet_loss
        ):
            return {"success": True, "message": "تم تحديث صحة البث"}
        else:
            raise HTTPException(status_code=404, detail="البث غير موجود")
    except Exception as e:
        logger.error(f"❌ Error updating stream health: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/streams/{stream_id}/quality")
async def update_quality(stream_id: str, quality: StreamQuality = Query(...)):
    """تحديث جودة البث"""
    try:
        if await live_manager.update_quality(stream_id, quality):
            return {"success": True, "message": "تم تحديث الجودة"}
        else:
            raise HTTPException(status_code=404, detail="البث غير موجود")
    except Exception as e:
        logger.error(f"❌ Error updating quality: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/streams/active")
async def get_active_streams(limit: int = Query(50)):
    """الحصول على البثات النشطة"""
    try:
        streams = live_manager.get_active_streams(limit)
        return {
            "success": True,
            "streams": [asdict(stream) for stream in streams]
        }
    except Exception as e:
        logger.error(f"❌ Error getting active streams: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/streams/history/{host_id}")
async def get_stream_history(host_id: str, limit: int = Query(50)):
    """الحصول على سجل البثات"""
    try:
        streams = live_manager.get_stream_history(host_id, limit)
        return {
            "success": True,
            "streams": [asdict(stream) for stream in streams]
        }
    except Exception as e:
        logger.error(f"❌ Error getting stream history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/streams/{stream_id}/{user_id}")
async def websocket_stream(stream_id: str, user_id: str, websocket: WebSocket):
    """نقطة نهاية WebSocket للبث المباشر"""
    await live_manager.connect(stream_id, websocket)
    await live_manager.add_viewer(stream_id, user_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")

            if message_type == "message":
                await live_manager.send_message(
                    stream_id,
                    user_id,
                    data.get("user_name", ""),
                    data.get("user_avatar", ""),
                    data.get("content", "")
                )

            elif message_type == "reaction":
                await live_manager.add_reaction(
                    stream_id,
                    user_id,
                    data.get("user_name", ""),
                    ReactionType(data.get("reaction_type", "like"))
                )

            elif message_type == "gift":
                await live_manager.send_gift(
                    stream_id,
                    user_id,
                    data.get("sender_name", ""),
                    GiftType(data.get("gift_type", "rose")),
                    data.get("amount", 1)
                )

            elif message_type == "ping":
                await websocket.send_json({"type": "pong"})

    except Exception as e:
        logger.error(f"❌ WebSocket error: {str(e)}")
    finally:
        await live_manager.remove_viewer(stream_id, user_id)
        await live_manager.disconnect(stream_id, websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8007)
