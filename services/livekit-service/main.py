"""خدمة البث المباشر المحسّنة - Enhanced Live Service
يوفر:
- إنشاء وإدارة غرف البث المباشر
- توليد توكنات الوصول
- التعليقات والهدايا
- التحليلات والإحصائيات
- التسجيل والاسترجاع
- دعم المضيفين المتعددين
"""

from fastapi import FastAPI, HTTPException, Query, Form
from fastapi.middleware.cors import CORSMiddleware
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from dataclasses import dataclass, asdict, field
from enum import Enum
import logging
import uuid
import random
import string

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Yamshat Enhanced Live Service",
    description="خدمة البث المباشر المحسّنة",
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

class RoomStatus(str, Enum):
    """حالة الغرفة"""
    IDLE = "idle"
    LIVE = "live"
    ENDED = "ended"
    ARCHIVED = "archived"


class StreamQuality(str, Enum):
    """جودة البث"""
    ULTRA_HD = "4k"
    FULL_HD = "1080p"
    HD = "720p"
    SD = "480p"
    LOW = "360p"


@dataclass
class LiveToken:
    """توكن البث المباشر"""
    token: str = field(default_factory=lambda: ''.join(random.choices(string.ascii_letters + string.digits, k=32)))
    room_id: str = ""
    user_id: str = ""
    role: str = "viewer"  # host, cohost, viewer
    expires_at: str = field(default_factory=lambda: (datetime.utcnow() + timedelta(hours=24)).isoformat())
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class LiveComment:
    """تعليق على البث المباشر"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    room_id: str = ""
    user_id: str = ""
    username: str = ""
    user_avatar: str = ""
    content: str = ""
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class LiveGift:
    """هدية للبث المباشر"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    room_id: str = ""
    sender_id: str = ""
    sender_name: str = ""
    gift_type: str = ""
    gift_icon: str = ""
    amount: int = 0
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class LiveRoom:
    """غرفة البث المباشر"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    host_id: str = ""
    host_username: str = ""
    host_avatar: str = ""
    title: str = ""
    description: str = ""
    status: RoomStatus = RoomStatus.IDLE
    quality: StreamQuality = StreamQuality.HD
    
    # الإحصائيات
    viewers_count: int = 0
    likes_count: int = 0
    comments_count: int = 0
    gifts_count: int = 0
    total_gifts_value: int = 0
    
    # البث
    stream_url: str = ""
    thumbnail_url: str = ""
    is_recording: bool = False
    recording_url: str = ""
    
    # المضيفون الإضافيون
    cohosts: List[str] = field(default_factory=list)
    
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    started_at: Optional[str] = None
    ended_at: Optional[str] = None


# ============ مدير البث المباشر ============

class LiveManager:
    """مدير البث المباشر"""

    def __init__(self):
        self.rooms: Dict[str, LiveRoom] = {}
        self.comments: Dict[str, List[LiveComment]] = {}  # {room_id: [comments]}
        self.gifts: Dict[str, List[LiveGift]] = {}  # {room_id: [gifts]}
        self.tokens: Dict[str, LiveToken] = {}  # {token: token_obj}
        self.viewers: Dict[str, set] = {}  # {room_id: {user_ids}}

    async def create_room(
        self,
        host_id: str,
        host_username: str,
        host_avatar: str,
        title: str,
        description: str = "",
        quality: str = "720p"
    ) -> LiveRoom:
        """إنشاء غرفة بث جديدة"""
        room = LiveRoom(
            host_id=host_id,
            host_username=host_username,
            host_avatar=host_avatar,
            title=title,
            description=description,
            quality=StreamQuality(quality) if quality in [q.value for q in StreamQuality] else StreamQuality.HD
        )

        self.rooms[room.id] = room
        self.comments[room.id] = []
        self.gifts[room.id] = []
        self.viewers[room.id] = set()

        logger.info(f"✅ Live room created: {room.id} by {host_username}")
        return room

    async def get_room(self, room_id: str) -> Optional[LiveRoom]:
        """الحصول على غرفة"""
        return self.rooms.get(room_id)

    async def get_rooms(self, filter_type: str = "all") -> List[LiveRoom]:
        """الحصول على قائمة الغرف"""
        rooms_list = list(self.rooms.values())
        
        if filter_type == "active":
            rooms_list = [r for r in rooms_list if r.status == RoomStatus.LIVE]
        elif filter_type == "ended":
            rooms_list = [r for r in rooms_list if r.status == RoomStatus.ENDED]
        
        rooms_list.sort(key=lambda r: r.created_at, reverse=True)
        return rooms_list

    async def start_room(self, room_id: str) -> bool:
        """بدء البث المباشر"""
        if room_id not in self.rooms:
            return False

        room = self.rooms[room_id]
        room.status = RoomStatus.LIVE
        room.started_at = datetime.utcnow().isoformat()
        
        logger.info(f"🔴 Live room started: {room_id}")
        return True

    async def end_room(self, room_id: str) -> bool:
        """إنهاء البث المباشر"""
        if room_id not in self.rooms:
            return False

        room = self.rooms[room_id]
        room.status = RoomStatus.ENDED
        room.ended_at = datetime.utcnow().isoformat()
        
        logger.info(f"⚫ Live room ended: {room_id}")
        return True

    async def generate_token(
        self,
        room_id: str,
        user_id: str,
        role: str = "viewer"
    ) -> LiveToken:
        """توليد توكن الوصول"""
        token = LiveToken(
            room_id=room_id,
            user_id=user_id,
            role=role
        )

        self.tokens[token.token] = token
        logger.info(f"🔑 Token generated for {user_id} (role: {role})")
        return token

    async def add_comment(
        self,
        room_id: str,
        user_id: str,
        username: str,
        user_avatar: str,
        content: str
    ) -> Optional[LiveComment]:
        """إضافة تعليق"""
        if room_id not in self.comments:
            return None

        comment = LiveComment(
            room_id=room_id,
            user_id=user_id,
            username=username,
            user_avatar=user_avatar,
            content=content
        )

        self.comments[room_id].append(comment)
        
        room = await self.get_room(room_id)
        if room:
            room.comments_count += 1

        logger.info(f"💬 Comment added to room {room_id}")
        return comment

    async def get_comments(self, room_id: str) -> List[LiveComment]:
        """الحصول على التعليقات"""
        if room_id not in self.comments:
            return []

        return self.comments[room_id]

    async def send_gift(
        self,
        room_id: str,
        sender_id: str,
        sender_name: str,
        gift_type: str,
        gift_icon: str,
        amount: int
    ) -> Optional[LiveGift]:
        """إرسال هدية"""
        if room_id not in self.gifts:
            return None

        gift = LiveGift(
            room_id=room_id,
            sender_id=sender_id,
            sender_name=sender_name,
            gift_type=gift_type,
            gift_icon=gift_icon,
            amount=amount
        )

        self.gifts[room_id].append(gift)
        
        room = await self.get_room(room_id)
        if room:
            room.gifts_count += 1
            room.total_gifts_value += amount

        logger.info(f"🎁 Gift sent to room {room_id}: {gift_type}")
        return gift

    async def get_gifts(self, room_id: str) -> List[LiveGift]:
        """الحصول على الهدايا"""
        if room_id not in self.gifts:
            return []

        return self.gifts[room_id]

    async def add_viewer(self, room_id: str, user_id: str) -> bool:
        """إضافة مشاهد"""
        if room_id not in self.viewers:
            return False

        self.viewers[room_id].add(user_id)
        
        room = await self.get_room(room_id)
        if room:
            room.viewers_count = len(self.viewers[room_id])

        logger.info(f"👁️ Viewer added to room {room_id}")
        return True

    async def remove_viewer(self, room_id: str, user_id: str) -> bool:
        """إزالة مشاهد"""
        if room_id not in self.viewers:
            return False

        self.viewers[room_id].discard(user_id)
        
        room = await self.get_room(room_id)
        if room:
            room.viewers_count = len(self.viewers[room_id])

        logger.info(f"👁️ Viewer removed from room {room_id}")
        return True

    async def get_analytics(self, room_id: str) -> Dict:
        """الحصول على التحليلات"""
        room = await self.get_room(room_id)
        if not room:
            return {}

        return {
            "room_id": room_id,
            "viewers": room.viewers_count,
            "likes": room.likes_count,
            "comments": room.comments_count,
            "gifts": room.gifts_count,
            "total_gifts_value": room.total_gifts_value,
            "status": room.status.value,
            "created_at": room.created_at,
            "started_at": room.started_at,
            "ended_at": room.ended_at
        }


# إنشاء مدير البث
live_manager = LiveManager()


# ============ الـ Routes ============

@app.post('/create_live')
async def create_live_room(
    host_id: str = Form("user_1"),
    host_username: str = Form("user"),
    host_avatar: str = Form(""),
    title: str = Form(""),
    description: str = Form(""),
    quality: str = Form("720p")
):
    """إنشاء غرفة بث جديدة"""
    try:
        room = await live_manager.create_room(
            host_id=host_id,
            host_username=host_username,
            host_avatar=host_avatar,
            title=title,
            description=description,
            quality=quality
        )

        return {
            "success": True,
            "room": asdict(room),
            "message": "تم إنشاء غرفة البث"
        }
    except Exception as error:
        logger.error(f"❌ Error creating live room: {error}")
        raise HTTPException(status_code=400, detail=str(error))


@app.get('/live_rooms')
async def get_live_rooms(filter_type: str = Query("all")):
    """الحصول على قائمة غرف البث"""
    try:
        rooms = await live_manager.get_rooms(filter_type)
        return {
            "rooms": [asdict(r) for r in rooms],
            "total": len(rooms)
        }
    except Exception as error:
        logger.error(f"❌ Error fetching live rooms: {error}")
        raise HTTPException(status_code=400, detail=str(error))


@app.get('/live_room/{room_id}')
async def get_live_room(room_id: str):
    """الحصول على غرفة بث محددة"""
    room = await live_manager.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="غرفة البث غير موجودة")
    return asdict(room)


@app.post('/live/{room_id}/start')
async def start_live_room(room_id: str):
    """بدء البث المباشر"""
    room = await live_manager.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="غرفة البث غير موجودة")
    
    await live_manager.start_room(room_id)
    
    return {
        "success": True,
        "message": "تم بدء البث المباشر"
    }


@app.post('/end_live/{room_id}')
async def end_live_room(room_id: str):
    """إنهاء البث المباشر"""
    room = await live_manager.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="غرفة البث غير موجودة")
    
    await live_manager.end_room(room_id)
    
    return {
        "success": True,
        "message": "تم إنهاء البث المباشر"
    }


@app.post('/live/{room_id}/token')
async def get_live_token(
    room_id: str,
    user_id: str = Form("user_1"),
    role: str = Form("viewer")
):
    """الحصول على توكن البث"""
    room = await live_manager.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="غرفة البث غير موجودة")
    
    token = await live_manager.generate_token(room_id, user_id, role)
    
    return {
        "success": True,
        "token": asdict(token)
    }


@app.post('/live/{room_id}/comment')
async def add_live_comment(
    room_id: str,
    user_id: str = Form("user_1"),
    username: str = Form("user"),
    user_avatar: str = Form(""),
    content: str = Form("")
):
    """إضافة تعليق على البث"""
    room = await live_manager.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="غرفة البث غير موجودة")
    
    comment = await live_manager.add_comment(
        room_id=room_id,
        user_id=user_id,
        username=username,
        user_avatar=user_avatar,
        content=content
    )
    
    return {
        "success": True,
        "comment": asdict(comment) if comment else None
    }


@app.get('/live_comments/{room_id}')
async def get_live_comments(room_id: str):
    """الحصول على تعليقات البث"""
    comments = await live_manager.get_comments(room_id)
    
    return {
        "comments": [asdict(c) for c in comments],
        "total": len(comments)
    }


@app.post('/live/{room_id}/gift')
async def send_live_gift(
    room_id: str,
    sender_id: str = Form("user_1"),
    sender_name: str = Form("user"),
    gift_type: str = Form(""),
    gift_icon: str = Form(""),
    amount: int = Form(0)
):
    """إرسال هدية للبث"""
    room = await live_manager.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="غرفة البث غير موجودة")
    
    gift = await live_manager.send_gift(
        room_id=room_id,
        sender_id=sender_id,
        sender_name=sender_name,
        gift_type=gift_type,
        gift_icon=gift_icon,
        amount=amount
    )
    
    return {
        "success": True,
        "gift": asdict(gift) if gift else None
    }


@app.get('/live/{room_id}/analytics')
async def get_live_analytics(room_id: str):
    """الحصول على تحليلات البث"""
    analytics = await live_manager.get_analytics(room_id)
    if not analytics:
        raise HTTPException(status_code=404, detail="غرفة البث غير موجودة")
    
    return analytics


@app.post('/live/{room_id}/viewer/add')
async def add_live_viewer(room_id: str, user_id: str = Form("user_1")):
    """إضافة مشاهد"""
    success = await live_manager.add_viewer(room_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="غرفة البث غير موجودة")
    
    return {
        "success": True,
        "message": "تم إضافة المشاهد"
    }


@app.post('/live/{room_id}/viewer/remove')
async def remove_live_viewer(room_id: str, user_id: str = Form("user_1")):
    """إزالة مشاهد"""
    success = await live_manager.remove_viewer(room_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="غرفة البث غير موجودة")
    
    return {
        "success": True,
        "message": "تم إزالة المشاهد"
    }


@app.post('/live/{room_id}/recording/start')
async def start_recording(room_id: str):
    """بدء التسجيل"""
    room = await live_manager.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="غرفة البث غير موجودة")
    
    room.is_recording = True
    
    return {
        "success": True,
        "message": "تم بدء التسجيل"
    }


@app.post('/live/{room_id}/recording/stop')
async def stop_recording(room_id: str):
    """إيقاف التسجيل"""
    room = await live_manager.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="غرفة البث غير موجودة")
    
    room.is_recording = False
    
    return {
        "success": True,
        "message": "تم إيقاف التسجيل"
    }


@app.post('/live/{room_id}/recovery')
async def trigger_live_recovery(room_id: str):
    """تفعيل استرجاع البث"""
    room = await live_manager.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="غرفة البث غير موجودة")
    
    return {
        "success": True,
        "message": "تم تفعيل استرجاع البث"
    }


@app.get('/health')
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "live-service",
        "version": "2.0.0",
        "active_rooms": len([r for r in live_manager.rooms.values() if r.status == RoomStatus.LIVE])
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
