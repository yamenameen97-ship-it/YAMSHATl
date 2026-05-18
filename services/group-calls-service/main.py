"""خدمة المكالمات الجماعية - Group Calls Service
يوفر:
- إدارة غرف المكالمات الجماعية (Group Rooms)
- مشاركة الشاشة (Screen Sharing)
- مزامنة المشاركين (Participant Sync)
- إدارة الأذونات (Permissions)
- تسجيل المكالمات الجماعية
"""

from fastapi import FastAPI, HTTPException, Query, WebSocket, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Set
from dataclasses import dataclass, asdict, field
from enum import Enum
import logging
import uuid
import asyncio
from collections import defaultdict

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Yamshat Group Calls Service",
    description="خدمة المكالمات الجماعية مع مشاركة الشاشة والمزامنة",
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

class RoomStatus(str, Enum):
    """حالة الغرفة"""
    IDLE = "idle"
    ACTIVE = "active"
    RECORDING = "recording"
    PAUSED = "paused"
    ENDED = "ended"


class ParticipantRole(str, Enum):
    """دور المشارك"""
    HOST = "host"
    MODERATOR = "moderator"
    SPEAKER = "speaker"
    LISTENER = "listener"


class ScreenShareStatus(str, Enum):
    """حالة مشاركة الشاشة"""
    IDLE = "idle"
    SHARING = "sharing"
    PAUSED = "paused"
    STOPPED = "stopped"


class ParticipantPermission(str, Enum):
    """أذونات المشارك"""
    UNMUTE = "unmute"
    CAMERA_ON = "camera_on"
    SCREEN_SHARE = "screen_share"
    RECORD = "record"
    KICK_PARTICIPANT = "kick_participant"
    MANAGE_PERMISSIONS = "manage_permissions"


@dataclass
class ScreenShareSession:
    """جلسة مشاركة الشاشة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    room_id: str = ""
    user_id: str = ""
    user_name: str = ""
    status: ScreenShareStatus = ScreenShareStatus.IDLE
    started_at: Optional[str] = None
    paused_at: Optional[str] = None
    stopped_at: Optional[str] = None
    stream_url: Optional[str] = None
    resolution: str = "1920x1080"
    fps: int = 30
    bitrate: int = 5000000  # 5 mbps


@dataclass
class GroupCallParticipant:
    """مشارك في المكالمة الجماعية"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    user_name: str = ""
    user_avatar: str = ""
    role: ParticipantRole = ParticipantRole.LISTENER
    is_muted: bool = False
    is_camera_off: bool = False
    is_screen_sharing: bool = False
    permissions: List[ParticipantPermission] = field(default_factory=list)
    joined_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    left_at: Optional[str] = None
    connection_quality: str = "good"  # good, fair, poor
    audio_level: int = 0  # 0-100
    video_bitrate: int = 0
    audio_bitrate: int = 0


@dataclass
class GroupCallRoom:
    """غرفة المكالمة الجماعية"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    description: str = ""
    host_id: str = ""
    host_name: str = ""
    status: RoomStatus = RoomStatus.IDLE
    participants: List[GroupCallParticipant] = field(default_factory=list)
    max_participants: int = 100
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    duration: int = 0  # بالثواني
    is_recording: bool = False
    recording_url: Optional[str] = None
    active_screen_shares: List[ScreenShareSession] = field(default_factory=list)
    metadata: Dict = field(default_factory=dict)


@dataclass
class ParticipantSyncEvent:
    """حدث مزامنة المشاركين"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    room_id: str = ""
    event_type: str = ""  # joined, left, muted, camera_off, screen_share_started, etc.
    participant_id: str = ""
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    data: Dict = field(default_factory=dict)


# ============ مدير المكالمات الجماعية ============

class GroupCallsManager:
    """مدير المكالمات الجماعية"""

    def __init__(self):
        # الغرف النشطة
        self.active_rooms: Dict[str, GroupCallRoom] = {}
        
        # الاتصالات النشطة
        self.active_connections: Dict[str, List[WebSocket]] = {}
        
        # جلسات مشاركة الشاشة
        self.screen_share_sessions: Dict[str, ScreenShareSession] = {}
        
        # أحداث المزامنة
        self.sync_events: Dict[str, List[ParticipantSyncEvent]] = defaultdict(list)
        
        # سجل المكالمات
        self.call_history: List[GroupCallRoom] = []

    async def create_room(
        self,
        name: str,
        description: str,
        host_id: str,
        host_name: str,
        max_participants: int = 100
    ) -> GroupCallRoom:
        """إنشاء غرفة مكالمة جماعية"""
        room = GroupCallRoom(
            name=name,
            description=description,
            host_id=host_id,
            host_name=host_name,
            max_participants=max_participants
        )
        
        # إضافة المضيف كمشارك
        host = GroupCallParticipant(
            user_id=host_id,
            user_name=host_name,
            role=ParticipantRole.HOST,
            permissions=[
                ParticipantPermission.UNMUTE,
                ParticipantPermission.CAMERA_ON,
                ParticipantPermission.SCREEN_SHARE,
                ParticipantPermission.RECORD,
                ParticipantPermission.KICK_PARTICIPANT,
                ParticipantPermission.MANAGE_PERMISSIONS
            ]
        )
        room.participants.append(host)
        
        self.active_rooms[room.id] = room
        self.active_connections[room.id] = []
        self.sync_events[room.id] = []
        
        logger.info(f"Group call room created: {room.id}")
        return room

    async def start_room(self, room_id: str) -> bool:
        """بدء المكالمة الجماعية"""
        if room_id not in self.active_rooms:
            return False
        
        room = self.active_rooms[room_id]
        room.status = RoomStatus.ACTIVE
        room.started_at = datetime.utcnow().isoformat()
        
        await self._broadcast_event(room_id, {
            "type": "room_started",
            "data": asdict(room)
        })
        
        logger.info(f"Group call room started: {room_id}")
        return True

    async def end_room(self, room_id: str) -> bool:
        """إنهاء المكالمة الجماعية"""
        if room_id not in self.active_rooms:
            return False
        
        room = self.active_rooms[room_id]
        room.status = RoomStatus.ENDED
        room.ended_at = datetime.utcnow().isoformat()
        
        # حساب المدة
        if room.started_at:
            start = datetime.fromisoformat(room.started_at)
            end = datetime.fromisoformat(room.ended_at)
            room.duration = int((end - start).total_seconds())
        
        # إضافة إلى السجل
        self.call_history.append(room)
        
        await self._broadcast_event(room_id, {
            "type": "room_ended",
            "data": asdict(room)
        })
        
        logger.info(f"Group call room ended: {room_id}")
        return True

    async def add_participant(
        self,
        room_id: str,
        user_id: str,
        user_name: str,
        user_avatar: str = "",
        role: ParticipantRole = ParticipantRole.LISTENER
    ) -> bool:
        """إضافة مشارك للغرفة"""
        if room_id not in self.active_rooms:
            return False
        
        room = self.active_rooms[room_id]
        
        # التحقق من عدم تجاوز الحد الأقصى للمشاركين
        if len(room.participants) >= room.max_participants:
            return False
        
        # التحقق من عدم وجود المشارك بالفعل
        if any(p.user_id == user_id for p in room.participants):
            return False
        
        participant = GroupCallParticipant(
            user_id=user_id,
            user_name=user_name,
            user_avatar=user_avatar,
            role=role
        )
        
        # تعيين الأذونات بناءً على الدور
        if role == ParticipantRole.MODERATOR:
            participant.permissions = [
                ParticipantPermission.UNMUTE,
                ParticipantPermission.CAMERA_ON,
                ParticipantPermission.SCREEN_SHARE,
                ParticipantPermission.KICK_PARTICIPANT,
                ParticipantPermission.MANAGE_PERMISSIONS
            ]
        elif role == ParticipantRole.SPEAKER:
            participant.permissions = [
                ParticipantPermission.UNMUTE,
                ParticipantPermission.CAMERA_ON,
                ParticipantPermission.SCREEN_SHARE
            ]
        
        room.participants.append(participant)
        
        await self._record_sync_event(room_id, {
            "event_type": "participant_joined",
            "participant_id": participant.id,
            "data": asdict(participant)
        })
        
        await self._broadcast_event(room_id, {
            "type": "participant_joined",
            "data": asdict(participant)
        })
        
        logger.info(f"Participant {user_id} joined room {room_id}")
        return True

    async def remove_participant(self, room_id: str, user_id: str) -> bool:
        """إزالة مشارك من الغرفة"""
        if room_id not in self.active_rooms:
            return False
        
        room = self.active_rooms[room_id]
        for participant in room.participants:
            if participant.user_id == user_id:
                participant.left_at = datetime.utcnow().isoformat()
                
                # إيقاف مشاركة الشاشة إذا كانت نشطة
                if participant.is_screen_sharing:
                    await self.stop_screen_share(room_id, user_id)
                
                await self._record_sync_event(room_id, {
                    "event_type": "participant_left",
                    "participant_id": participant.id,
                    "data": asdict(participant)
                })
                
                await self._broadcast_event(room_id, {
                    "type": "participant_left",
                    "data": asdict(participant)
                })
                
                logger.info(f"Participant {user_id} left room {room_id}")
                return True
        
        return False

    async def start_screen_share(
        self,
        room_id: str,
        user_id: str,
        user_name: str,
        resolution: str = "1920x1080",
        fps: int = 30
    ) -> Optional[ScreenShareSession]:
        """بدء مشاركة الشاشة"""
        if room_id not in self.active_rooms:
            return None
        
        room = self.active_rooms[room_id]
        
        # التحقق من وجود المشارك
        participant = next((p for p in room.participants if p.user_id == user_id), None)
        if not participant:
            return None
        
        # التحقق من الأذونات
        if ParticipantPermission.SCREEN_SHARE not in participant.permissions:
            return None
        
        # إيقاف أي مشاركة شاشة سابقة من نفس المستخدم
        for session in room.active_screen_shares:
            if session.user_id == user_id:
                await self.stop_screen_share(room_id, user_id)
        
        session = ScreenShareSession(
            room_id=room_id,
            user_id=user_id,
            user_name=user_name,
            status=ScreenShareStatus.SHARING,
            started_at=datetime.utcnow().isoformat(),
            resolution=resolution,
            fps=fps
        )
        
        room.active_screen_shares.append(session)
        participant.is_screen_sharing = True
        
        self.screen_share_sessions[session.id] = session
        
        await self._record_sync_event(room_id, {
            "event_type": "screen_share_started",
            "participant_id": participant.id,
            "data": asdict(session)
        })
        
        await self._broadcast_event(room_id, {
            "type": "screen_share_started",
            "data": asdict(session)
        })
        
        logger.info(f"Screen share started in room {room_id} by user {user_id}")
        return session

    async def stop_screen_share(self, room_id: str, user_id: str) -> bool:
        """إيقاف مشاركة الشاشة"""
        if room_id not in self.active_rooms:
            return False
        
        room = self.active_rooms[room_id]
        
        for session in room.active_screen_shares:
            if session.user_id == user_id:
                session.status = ScreenShareStatus.STOPPED
                session.stopped_at = datetime.utcnow().isoformat()
                
                # تحديث حالة المشارك
                participant = next((p for p in room.participants if p.user_id == user_id), None)
                if participant:
                    participant.is_screen_sharing = False
                
                room.active_screen_shares.remove(session)
                
                await self._record_sync_event(room_id, {
                    "event_type": "screen_share_stopped",
                    "participant_id": participant.id if participant else "",
                    "data": asdict(session)
                })
                
                await self._broadcast_event(room_id, {
                    "type": "screen_share_stopped",
                    "data": asdict(session)
                })
                
                logger.info(f"Screen share stopped in room {room_id} by user {user_id}")
                return True
        
        return False

    async def toggle_mute(self, room_id: str, user_id: str, is_muted: bool) -> bool:
        """تفعيل/تعطيل الصوت"""
        if room_id not in self.active_rooms:
            return False
        
        room = self.active_rooms[room_id]
        participant = next((p for p in room.participants if p.user_id == user_id), None)
        
        if not participant:
            return False
        
        participant.is_muted = is_muted
        
        await self._record_sync_event(room_id, {
            "event_type": "mute_toggled",
            "participant_id": participant.id,
            "data": {"is_muted": is_muted}
        })
        
        await self._broadcast_event(room_id, {
            "type": "mute_toggled",
            "data": {
                "user_id": user_id,
                "is_muted": is_muted
            }
        })
        
        return True

    async def toggle_camera(self, room_id: str, user_id: str, is_camera_off: bool) -> bool:
        """تفعيل/تعطيل الكاميرا"""
        if room_id not in self.active_rooms:
            return False
        
        room = self.active_rooms[room_id]
        participant = next((p for p in room.participants if p.user_id == user_id), None)
        
        if not participant:
            return False
        
        participant.is_camera_off = is_camera_off
        
        await self._record_sync_event(room_id, {
            "event_type": "camera_toggled",
            "participant_id": participant.id,
            "data": {"is_camera_off": is_camera_off}
        })
        
        await self._broadcast_event(room_id, {
            "type": "camera_toggled",
            "data": {
                "user_id": user_id,
                "is_camera_off": is_camera_off
            }
        })
        
        return True

    async def _record_sync_event(self, room_id: str, event_data: Dict):
        """تسجيل حدث مزامنة"""
        event = ParticipantSyncEvent(
            room_id=room_id,
            event_type=event_data.get("event_type", ""),
            participant_id=event_data.get("participant_id", ""),
            data=event_data.get("data", {})
        )
        
        if room_id not in self.sync_events:
            self.sync_events[room_id] = []
        
        self.sync_events[room_id].append(event)

    async def _broadcast_event(self, room_id: str, message: Dict):
        """بث حدث إلى جميع المشاركين"""
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting event: {str(e)}")

    def get_room(self, room_id: str) -> Optional[Dict]:
        """الحصول على معلومات الغرفة"""
        if room_id not in self.active_rooms:
            return None
        
        room = self.active_rooms[room_id]
        return {
            "room_id": room.id,
            "name": room.name,
            "status": room.status.value,
            "participants_count": len(room.participants),
            "participants": [asdict(p) for p in room.participants],
            "active_screen_shares": [asdict(s) for s in room.active_screen_shares],
            "duration": room.duration
        }

    def get_sync_events(self, room_id: str, limit: int = 100) -> List[Dict]:
        """الحصول على أحداث المزامنة"""
        if room_id not in self.sync_events:
            return []
        
        events = self.sync_events[room_id][-limit:]
        return [asdict(event) for event in events]


# ============ مثيل مدير المكالمات الجماعية ============

group_calls_manager = GroupCallsManager()


# ============ المسارات (Routes) ============

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "group-calls-service",
        "version": "1.0.0",
        "active_rooms": len(group_calls_manager.active_rooms)
    }


@app.post("/rooms")
async def create_room(
    name: str = Query(...),
    description: str = Query(...),
    host_id: str = Query(...),
    host_name: str = Query(...),
    max_participants: int = Query(100)
):
    """إنشاء غرفة مكالمة جماعية"""
    try:
        room = await group_calls_manager.create_room(
            name,
            description,
            host_id,
            host_name,
            max_participants
        )
        return {
            "success": True,
            "room_id": room.id,
            "room": asdict(room)
        }
    except Exception as e:
        logger.error(f"Error creating room: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/rooms/{room_id}")
async def get_room(room_id: str):
    """الحصول على معلومات الغرفة"""
    try:
        room = group_calls_manager.get_room(room_id)
        if room:
            return {"success": True, "room": room}
        else:
            raise HTTPException(status_code=404, detail="الغرفة غير موجودة")
    except Exception as e:
        logger.error(f"Error getting room: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rooms/{room_id}/start")
async def start_room(room_id: str):
    """بدء المكالمة الجماعية"""
    try:
        if await group_calls_manager.start_room(room_id):
            return {"success": True, "message": "تم بدء المكالمة"}
        else:
            raise HTTPException(status_code=404, detail="الغرفة غير موجودة")
    except Exception as e:
        logger.error(f"Error starting room: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rooms/{room_id}/end")
async def end_room(room_id: str):
    """إنهاء المكالمة الجماعية"""
    try:
        if await group_calls_manager.end_room(room_id):
            return {"success": True, "message": "تم إنهاء المكالمة"}
        else:
            raise HTTPException(status_code=404, detail="الغرفة غير موجودة")
    except Exception as e:
        logger.error(f"Error ending room: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rooms/{room_id}/participants")
async def add_participant(
    room_id: str,
    user_id: str = Query(...),
    user_name: str = Query(...),
    user_avatar: str = Query(""),
    role: ParticipantRole = Query(ParticipantRole.LISTENER)
):
    """إضافة مشارك للغرفة"""
    try:
        if await group_calls_manager.add_participant(
            room_id,
            user_id,
            user_name,
            user_avatar,
            role
        ):
            return {"success": True, "message": "تم إضافة المشارك"}
        else:
            raise HTTPException(status_code=400, detail="فشل إضافة المشارك")
    except Exception as e:
        logger.error(f"Error adding participant: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/rooms/{room_id}/participants/{user_id}")
async def remove_participant(room_id: str, user_id: str):
    """إزالة مشارك من الغرفة"""
    try:
        if await group_calls_manager.remove_participant(room_id, user_id):
            return {"success": True, "message": "تم إزالة المشارك"}
        else:
            raise HTTPException(status_code=400, detail="فشل إزالة المشارك")
    except Exception as e:
        logger.error(f"Error removing participant: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rooms/{room_id}/screen-share/start")
async def start_screen_share(
    room_id: str,
    user_id: str = Query(...),
    user_name: str = Query(...),
    resolution: str = Query("1920x1080"),
    fps: int = Query(30)
):
    """بدء مشاركة الشاشة"""
    try:
        session = await group_calls_manager.start_screen_share(
            room_id,
            user_id,
            user_name,
            resolution,
            fps
        )
        if session:
            return {"success": True, "session": asdict(session)}
        else:
            raise HTTPException(status_code=400, detail="فشل بدء مشاركة الشاشة")
    except Exception as e:
        logger.error(f"Error starting screen share: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rooms/{room_id}/screen-share/stop")
async def stop_screen_share(room_id: str, user_id: str = Query(...)):
    """إيقاف مشاركة الشاشة"""
    try:
        if await group_calls_manager.stop_screen_share(room_id, user_id):
            return {"success": True, "message": "تم إيقاف مشاركة الشاشة"}
        else:
            raise HTTPException(status_code=400, detail="فشل إيقاف مشاركة الشاشة")
    except Exception as e:
        logger.error(f"Error stopping screen share: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rooms/{room_id}/participants/{user_id}/mute")
async def toggle_mute(
    room_id: str,
    user_id: str,
    is_muted: bool = Query(...)
):
    """تفعيل/تعطيل الصوت"""
    try:
        if await group_calls_manager.toggle_mute(room_id, user_id, is_muted):
            return {"success": True, "message": "تم تحديث حالة الصوت"}
        else:
            raise HTTPException(status_code=400, detail="فشل تحديث حالة الصوت")
    except Exception as e:
        logger.error(f"Error toggling mute: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rooms/{room_id}/participants/{user_id}/camera")
async def toggle_camera(
    room_id: str,
    user_id: str,
    is_camera_off: bool = Query(...)
):
    """تفعيل/تعطيل الكاميرا"""
    try:
        if await group_calls_manager.toggle_camera(room_id, user_id, is_camera_off):
            return {"success": True, "message": "تم تحديث حالة الكاميرا"}
        else:
            raise HTTPException(status_code=400, detail="فشل تحديث حالة الكاميرا")
    except Exception as e:
        logger.error(f"Error toggling camera: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/rooms/{room_id}/sync-events")
async def get_sync_events(room_id: str, limit: int = Query(100)):
    """الحصول على أحداث المزامنة"""
    try:
        events = group_calls_manager.get_sync_events(room_id, limit)
        return {"success": True, "events": events}
    except Exception as e:
        logger.error(f"Error getting sync events: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
