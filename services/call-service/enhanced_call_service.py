"""خدمة المكالمات المتقدمة - Enhanced Call Service
يوفر:
- مكالمات صوتية وفيديو فردية وجماعية
- معالجة الإشارات (Signaling) المتقدمة
- إدارة الاتصالات والمشاركين
- معالجة إعادة الاتصال والاستقرار
- تسجيل المكالمات
- كشف جودة الشبكة
- تقليل الضوضاء والصدى
- تبديل الأجهزة
- ضبابية الخلفية
- TURN/STUN servers
"""

from fastapi import FastAPI, WebSocket, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Set, Tuple
from dataclasses import dataclass, asdict, field
from enum import Enum
import logging
import uuid
import hashlib
from collections import defaultdict

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Yamshat Enhanced Call Service",
    description="خدمة مكالمات متقدمة مع دعم كامل للمكالمات الفردية والجماعية",
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

class CallType(str, Enum):
    """أنواع المكالمات"""
    AUDIO = "audio"
    VIDEO = "video"
    SCREEN_SHARE = "screen_share"
    GROUP_AUDIO = "group_audio"
    GROUP_VIDEO = "group_video"


class CallStatus(str, Enum):
    """حالات المكالمة"""
    RINGING = "ringing"
    CONNECTING = "connecting"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    ENDED = "ended"
    FAILED = "failed"
    RECONNECTING = "reconnecting"


class ParticipantStatus(str, Enum):
    """حالات المشارك"""
    INVITED = "invited"
    RINGING = "ringing"
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    RECONNECTING = "reconnecting"


class NetworkQuality(str, Enum):
    """جودة الشبكة"""
    EXCELLENT = "excellent"  # < 50ms latency
    GOOD = "good"  # 50-100ms latency
    FAIR = "fair"  # 100-200ms latency
    POOR = "poor"  # > 200ms latency


class DeviceType(str, Enum):
    """أنواع الأجهزة"""
    MICROPHONE = "microphone"
    SPEAKER = "speaker"
    CAMERA = "camera"


@dataclass
class Device:
    """جهاز صوتي أو فيديو"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    type: DeviceType = DeviceType.MICROPHONE
    name: str = ""
    is_active: bool = True
    is_default: bool = False


@dataclass
class NetworkStats:
    """إحصائيات الشبكة"""
    latency: int = 0  # بالميلي ثانية
    packet_loss: float = 0.0  # النسبة المئوية
    bandwidth_up: int = 0  # بالـ kbps
    bandwidth_down: int = 0  # بالـ kbps
    jitter: int = 0  # بالميلي ثانية
    quality: NetworkQuality = NetworkQuality.GOOD
    last_updated: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class CallParticipant:
    """مشارك في المكالمة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    user_name: str = ""
    user_avatar: str = ""
    status: ParticipantStatus = ParticipantStatus.INVITED
    is_muted: bool = False
    is_camera_off: bool = False
    is_screen_sharing: bool = False
    is_hand_raised: bool = False
    background_blur_enabled: bool = False
    noise_suppression_enabled: bool = False
    echo_cancellation_enabled: bool = False
    joined_at: Optional[str] = None
    left_at: Optional[str] = None
    connection_quality: NetworkStats = field(default_factory=NetworkStats)
    active_device: Optional[Device] = None
    available_devices: List[Device] = field(default_factory=list)
    reconnection_attempts: int = 0
    last_reconnection_time: Optional[str] = None


@dataclass
class CallSession:
    """جلسة المكالمة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    call_type: CallType = CallType.VIDEO
    initiator_id: str = ""
    initiator_name: str = ""
    recipient_id: Optional[str] = None  # للمكالمات الفردية
    status: CallStatus = CallStatus.RINGING
    participants: List[CallParticipant] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    duration: int = 0  # بالثواني
    is_group_call: bool = False
    group_id: Optional[str] = None
    max_participants: int = 100
    recording_enabled: bool = False
    recording_url: Optional[str] = None
    recording_start_time: Optional[str] = None
    turn_servers: List[Dict] = field(default_factory=list)
    stun_servers: List[Dict] = field(default_factory=list)
    metadata: Dict = field(default_factory=dict)
    bitrate_adaptation_enabled: bool = True
    auto_reconnect_enabled: bool = True
    reconnection_timeout: int = 30  # بالثواني


@dataclass
class CallSignal:
    """إشارة المكالمة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    call_id: str = ""
    from_user_id: str = ""
    to_user_id: str = ""
    signal_type: str = ""  # offer, answer, ice-candidate, etc.
    data: Dict = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class MissedCall:
    """مكالمة فائتة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    caller_id: str = ""
    caller_name: str = ""
    caller_avatar: str = ""
    recipient_id: str = ""
    call_type: CallType = CallType.VIDEO
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    is_read: bool = False


# ============ مدير المكالمات ============

class EnhancedCallManager:
    """مدير المكالمات المتقدم"""

    def __init__(self):
        # المكالمات النشطة
        self.active_calls: Dict[str, CallSession] = {}
        
        # الاتصالات النشطة
        self.active_connections: Dict[str, List[WebSocket]] = {}  # {call_id: [ws]}
        
        # خريطة المستخدمين إلى المكالمات
        self.user_calls: Dict[str, str] = {}  # {user_id: call_id}
        
        # سجل المكالمات
        self.call_history: List[CallSession] = []
        
        # المكالمات الفائتة
        self.missed_calls: Dict[str, List[MissedCall]] = defaultdict(list)
        
        # الإشارات المعلقة
        self.pending_signals: Dict[str, List[CallSignal]] = defaultdict(list)
        
        # إعدادات الخادم
        self.turn_servers = [
            {
                "urls": "turn:turn.yamshat.com:3478",
                "username": "yamshat",
                "credential": "yamshat_secret"
            }
        ]
        
        self.stun_servers = [
            {"urls": "stun:stun.l.google.com:19302"},
            {"urls": "stun:stun1.l.google.com:19302"},
            {"urls": "stun:stun2.l.google.com:19302"}
        ]

    async def create_call(
        self,
        call_type: CallType,
        initiator_id: str,
        initiator_name: str,
        initiator_avatar: str = "",
        recipient_id: Optional[str] = None,
        group_id: Optional[str] = None
    ) -> CallSession:
        """إنشاء مكالمة جديدة"""
        call = CallSession(
            call_type=call_type,
            initiator_id=initiator_id,
            initiator_name=initiator_name,
            recipient_id=recipient_id,
            is_group_call=group_id is not None,
            group_id=group_id,
            turn_servers=self.turn_servers,
            stun_servers=self.stun_servers
        )

        # إضافة المبادر كمشارك
        initiator = CallParticipant(
            user_id=initiator_id,
            user_name=initiator_name,
            user_avatar=initiator_avatar,
            status=ParticipantStatus.CONNECTED,
            joined_at=datetime.utcnow().isoformat()
        )
        call.participants.append(initiator)

        # إضافة المستقبل (للمكالمات الفردية)
        if recipient_id and not group_id:
            recipient = CallParticipant(
                user_id=recipient_id,
                status=ParticipantStatus.RINGING
            )
            call.participants.append(recipient)

        self.active_calls[call.id] = call
        self.active_connections[call.id] = []
        self.user_calls[initiator_id] = call.id
        
        # إضافة المكالمة الفائتة للمستقبل إذا لم يرد
        if recipient_id and not group_id:
            asyncio.create_task(
                self._add_missed_call_if_not_answered(call)
            )
        
        logger.info(f"✅ Call created: {call.id} (Type: {call_type})")
        return call

    async def _add_missed_call_if_not_answered(self, call: CallSession):
        """إضافة المكالمة إلى قائمة المكالمات الفائتة إذا لم يتم الرد عليها"""
        await asyncio.sleep(call.reconnection_timeout)
        
        if call.id in self.active_calls and call.status == CallStatus.RINGING:
            missed_call = MissedCall(
                caller_id=call.initiator_id,
                caller_name=call.initiator_name,
                recipient_id=call.recipient_id,
                call_type=call.call_type
            )
            if call.recipient_id:
                self.missed_calls[call.recipient_id].append(missed_call)
                logger.info(f"📞 Missed call recorded for {call.recipient_id}")

    async def connect(self, call_id: str, websocket: WebSocket):
        """الاتصال بمكالمة"""
        await websocket.accept()
        if call_id not in self.active_connections:
            self.active_connections[call_id] = []
        self.active_connections[call_id].append(websocket)
        logger.info(f"✅ Client connected to call {call_id}")

    async def disconnect(self, call_id: str, websocket: WebSocket):
        """قطع الاتصال عن مكالمة"""
        if call_id in self.active_connections:
            self.active_connections[call_id].remove(websocket)
            if not self.active_connections[call_id]:
                # إنهاء المكالمة إذا لم يتبقَ أحد
                await self.end_call(call_id)
        logger.info(f"❌ Client disconnected from call {call_id}")

    async def broadcast(
        self,
        call_id: str,
        message: dict,
        exclude_user: Optional[str] = None
    ):
        """بث رسالة إلى جميع المشاركين"""
        if call_id in self.active_connections:
            for connection in self.active_connections[call_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"❌ Error broadcasting message: {str(e)}")

    async def start_call(self, call_id: str) -> bool:
        """بدء المكالمة"""
        if call_id not in self.active_calls:
            return False

        call = self.active_calls[call_id]
        call.status = CallStatus.ACTIVE
        call.started_at = datetime.utcnow().isoformat()

        # تحديث حالة المشاركين
        for participant in call.participants:
            participant.status = ParticipantStatus.CONNECTED
            if not participant.joined_at:
                participant.joined_at = datetime.utcnow().isoformat()

        await self.broadcast(call_id, {
            "type": "call_started",
            "data": asdict(call)
        })
        logger.info(f"✅ Call started: {call_id}")
        return True

    async def end_call(self, call_id: str) -> bool:
        """إنهاء المكالمة"""
        if call_id not in self.active_calls:
            return False

        call = self.active_calls[call_id]
        call.status = CallStatus.ENDED
        call.ended_at = datetime.utcnow().isoformat()

        # حساب المدة
        if call.started_at:
            start = datetime.fromisoformat(call.started_at)
            end = datetime.fromisoformat(call.ended_at)
            call.duration = int((end - start).total_seconds())

        # تحديث حالة المشاركين
        for participant in call.participants:
            if participant.status != ParticipantStatus.DISCONNECTED:
                participant.status = ParticipantStatus.DISCONNECTED
                participant.left_at = datetime.utcnow().isoformat()

        # إضافة إلى السجل
        self.call_history.append(call)
        
        # تنظيف خريطة المستخدمين
        for participant in call.participants:
            if participant.user_id in self.user_calls:
                del self.user_calls[participant.user_id]

        await self.broadcast(call_id, {
            "type": "call_ended",
            "data": asdict(call)
        })
        logger.info(f"✅ Call ended: {call_id} (Duration: {call.duration}s)")
        return True

    async def add_participant(
        self,
        call_id: str,
        user_id: str,
        user_name: str,
        user_avatar: str = ""
    ) -> bool:
        """إضافة مشارك إلى مكالمة جماعية"""
        if call_id not in self.active_calls:
            return False

        call = self.active_calls[call_id]
        if not call.is_group_call:
            return False

        # التحقق من عدم تجاوز الحد الأقصى
        if len(call.participants) >= call.max_participants:
            return False

        # التحقق من عدم وجود المشارك بالفعل
        if any(p.user_id == user_id for p in call.participants):
            return False

        participant = CallParticipant(
            user_id=user_id,
            user_name=user_name,
            user_avatar=user_avatar,
            status=ParticipantStatus.CONNECTED,
            joined_at=datetime.utcnow().isoformat()
        )
        call.participants.append(participant)
        self.user_calls[user_id] = call_id

        await self.broadcast(call_id, {
            "type": "participant_joined",
            "data": asdict(participant)
        })
        logger.info(f"✅ Participant {user_id} joined call {call_id}")
        return True

    async def remove_participant(
        self,
        call_id: str,
        user_id: str
    ) -> bool:
        """إزالة مشارك من مكالمة"""
        if call_id not in self.active_calls:
            return False

        call = self.active_calls[call_id]
        for participant in call.participants:
            if participant.user_id == user_id:
                participant.status = ParticipantStatus.DISCONNECTED
                participant.left_at = datetime.utcnow().isoformat()

                if user_id in self.user_calls:
                    del self.user_calls[user_id]

                await self.broadcast(call_id, {
                    "type": "participant_left",
                    "data": asdict(participant)
                })
                logger.info(f"✅ Participant {user_id} left call {call_id}")
                return True
        return False

    async def toggle_mute(
        self,
        call_id: str,
        user_id: str,
        is_muted: bool
    ) -> bool:
        """تفعيل/تعطيل الصوت"""
        if call_id not in self.active_calls:
            return False

        call = self.active_calls[call_id]
        for participant in call.participants:
            if participant.user_id == user_id:
                participant.is_muted = is_muted
                await self.broadcast(call_id, {
                    "type": "mute_toggled",
                    "data": {
                        "user_id": user_id,
                        "is_muted": is_muted
                    }
                })
                return True
        return False

    async def toggle_camera(
        self,
        call_id: str,
        user_id: str,
        is_camera_off: bool
    ) -> bool:
        """تفعيل/تعطيل الكاميرا"""
        if call_id not in self.active_calls:
            return False

        call = self.active_calls[call_id]
        for participant in call.participants:
            if participant.user_id == user_id:
                participant.is_camera_off = is_camera_off
                await self.broadcast(call_id, {
                    "type": "camera_toggled",
                    "data": {
                        "user_id": user_id,
                        "is_camera_off": is_camera_off
                    }
                })
                return True
        return False

    async def toggle_screen_share(
        self,
        call_id: str,
        user_id: str,
        is_sharing: bool
    ) -> bool:
        """تفعيل/تعطيل مشاركة الشاشة"""
        if call_id not in self.active_calls:
            return False

        call = self.active_calls[call_id]
        for participant in call.participants:
            if participant.user_id == user_id:
                participant.is_screen_sharing = is_sharing
                await self.broadcast(call_id, {
                    "type": "screen_share_toggled",
                    "data": {
                        "user_id": user_id,
                        "is_sharing": is_sharing
                    }
                })
                return True
        return False

    async def raise_hand(
        self,
        call_id: str,
        user_id: str,
        is_raised: bool
    ) -> bool:
        """رفع اليد"""
        if call_id not in self.active_calls:
            return False

        call = self.active_calls[call_id]
        for participant in call.participants:
            if participant.user_id == user_id:
                participant.is_hand_raised = is_raised
                await self.broadcast(call_id, {
                    "type": "hand_raised",
                    "data": {
                        "user_id": user_id,
                        "is_raised": is_raised
                    }
                })
                return True
        return False

    async def toggle_background_blur(
        self,
        call_id: str,
        user_id: str,
        enabled: bool
    ) -> bool:
        """تفعيل/تعطيل ضبابية الخلفية"""
        if call_id not in self.active_calls:
            return False

        call = self.active_calls[call_id]
        for participant in call.participants:
            if participant.user_id == user_id:
                participant.background_blur_enabled = enabled
                await self.broadcast(call_id, {
                    "type": "background_blur_toggled",
                    "data": {
                        "user_id": user_id,
                        "enabled": enabled
                    }
                })
                return True
        return False

    async def toggle_noise_suppression(
        self,
        call_id: str,
        user_id: str,
        enabled: bool
    ) -> bool:
        """تفعيل/تعطيل تقليل الضوضاء"""
        if call_id not in self.active_calls:
            return False

        call = self.active_calls[call_id]
        for participant in call.participants:
            if participant.user_id == user_id:
                participant.noise_suppression_enabled = enabled
                await self.broadcast(call_id, {
                    "type": "noise_suppression_toggled",
                    "data": {
                        "user_id": user_id,
                        "enabled": enabled
                    }
                })
                return True
        return False

    async def toggle_echo_cancellation(
        self,
        call_id: str,
        user_id: str,
        enabled: bool
    ) -> bool:
        """تفعيل/تعطيل إلغاء الصدى"""
        if call_id not in self.active_calls:
            return False

        call = self.active_calls[call_id]
        for participant in call.participants:
            if participant.user_id == user_id:
                participant.echo_cancellation_enabled = enabled
                await self.broadcast(call_id, {
                    "type": "echo_cancellation_toggled",
                    "data": {
                        "user_id": user_id,
                        "enabled": enabled
                    }
                })
                return True
        return False

    async def switch_device(
        self,
        call_id: str,
        user_id: str,
        device: Device
    ) -> bool:
        """تبديل الجهاز (ميكروفون أو كاميرا أو سماعة)"""
        if call_id not in self.active_calls:
            return False

        call = self.active_calls[call_id]
        for participant in call.participants:
            if participant.user_id == user_id:
                participant.active_device = device
                await self.broadcast(call_id, {
                    "type": "device_switched",
                    "data": {
                        "user_id": user_id,
                        "device": asdict(device)
                    }
                })
                return True
        return False

    async def update_network_quality(
        self,
        call_id: str,
        user_id: str,
        stats: NetworkStats
    ) -> bool:
        """تحديث جودة الشبكة للمشارك"""
        if call_id not in self.active_calls:
            return False

        call = self.active_calls[call_id]
        for participant in call.participants:
            if participant.user_id == user_id:
                participant.connection_quality = stats
                
                # تحديد جودة الشبكة بناءً على الكمون
                if stats.latency < 50:
                    stats.quality = NetworkQuality.EXCELLENT
                elif stats.latency < 100:
                    stats.quality = NetworkQuality.GOOD
                elif stats.latency < 200:
                    stats.quality = NetworkQuality.FAIR
                else:
                    stats.quality = NetworkQuality.POOR
                
                await self.broadcast(call_id, {
                    "type": "network_quality_updated",
                    "data": {
                        "user_id": user_id,
                        "stats": asdict(stats)
                    }
                })
                return True
        return False

    async def handle_reconnection(
        self,
        call_id: str,
        user_id: str
    ) -> bool:
        """معالجة إعادة الاتصال"""
        if call_id not in self.active_calls:
            return False

        call = self.active_calls[call_id]
        for participant in call.participants:
            if participant.user_id == user_id:
                if participant.status == ParticipantStatus.DISCONNECTED:
                    participant.status = ParticipantStatus.RECONNECTING
                    participant.reconnection_attempts += 1
                    participant.last_reconnection_time = datetime.utcnow().isoformat()
                    
                    await self.broadcast(call_id, {
                        "type": "participant_reconnecting",
                        "data": {
                            "user_id": user_id,
                            "attempt": participant.reconnection_attempts
                        }
                    })
                    
                    # محاولة إعادة الاتصال
                    await asyncio.sleep(2)
                    participant.status = ParticipantStatus.CONNECTED
                    
                    await self.broadcast(call_id, {
                        "type": "participant_reconnected",
                        "data": {
                            "user_id": user_id
                        }
                    })
                    logger.info(f"✅ Participant {user_id} reconnected to call {call_id}")
                    return True
        return False

    async def start_recording(self, call_id: str) -> bool:
        """بدء تسجيل المكالمة"""
        if call_id not in self.active_calls:
            return False

        call = self.active_calls[call_id]
        call.recording_enabled = True
        call.recording_start_time = datetime.utcnow().isoformat()
        call.recording_url = f"https://recordings.yamshat.com/{call_id}.mp4"

        await self.broadcast(call_id, {
            "type": "recording_started",
            "data": {
                "recording_url": call.recording_url
            }
        })
        logger.info(f"🔴 Recording started for call {call_id}")
        return True

    async def stop_recording(self, call_id: str) -> bool:
        """إيقاف تسجيل المكالمة"""
        if call_id not in self.active_calls:
            return False

        call = self.active_calls[call_id]
        call.recording_enabled = False

        await self.broadcast(call_id, {
            "type": "recording_stopped",
            "data": {
                "recording_url": call.recording_url
            }
        })
        logger.info(f"⏹️ Recording stopped for call {call_id}")
        return True

    def get_call(self, call_id: str) -> Optional[CallSession]:
        """الحصول على تفاصيل المكالمة"""
        return self.active_calls.get(call_id)

    def get_call_history(
        self,
        user_id: str,
        limit: int = 50
    ) -> List[CallSession]:
        """الحصول على سجل المكالمات"""
        user_calls = [
            call for call in self.call_history
            if call.initiator_id == user_id or
            any(p.user_id == user_id for p in call.participants)
        ]
        return user_calls[-limit:]

    def get_missed_calls(
        self,
        user_id: str,
        limit: int = 50
    ) -> List[MissedCall]:
        """الحصول على المكالمات الفائتة"""
        return self.missed_calls[user_id][-limit:]

    async def mark_missed_call_as_read(
        self,
        user_id: str,
        missed_call_id: str
    ) -> bool:
        """وضع علامة على المكالمة الفائتة كمقروءة"""
        for missed_call in self.missed_calls[user_id]:
            if missed_call.id == missed_call_id:
                missed_call.is_read = True
                return True
        return False


# ============ مثيل مدير المكالمات ============

call_manager = EnhancedCallManager()


# ============ المسارات (Routes) ============

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "enhanced-call-service",
        "version": "2.0.0",
        "active_calls": len(call_manager.active_calls),
        "connected_users": len(call_manager.user_calls)
    }


@app.post("/calls")
async def create_call(
    call_type: CallType = Query(...),
    initiator_id: str = Query(...),
    initiator_name: str = Query(...),
    initiator_avatar: str = Query(""),
    recipient_id: Optional[str] = Query(None),
    group_id: Optional[str] = Query(None)
):
    """إنشاء مكالمة جديدة"""
    try:
        call = await call_manager.create_call(
            call_type,
            initiator_id,
            initiator_name,
            initiator_avatar,
            recipient_id,
            group_id
        )
        return {
            "success": True,
            "call_id": call.id,
            "call": asdict(call)
        }
    except Exception as e:
        logger.error(f"❌ Error creating call: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/calls/{call_id}")
async def get_call(call_id: str):
    """الحصول على تفاصيل المكالمة"""
    try:
        call = call_manager.get_call(call_id)
        if call:
            return {
                "success": True,
                "call": asdict(call)
            }
        else:
            raise HTTPException(status_code=404, detail="المكالمة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error getting call: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calls/{call_id}/start")
async def start_call(call_id: str):
    """بدء المكالمة"""
    try:
        if await call_manager.start_call(call_id):
            return {"success": True, "message": "تم بدء المكالمة"}
        else:
            raise HTTPException(status_code=404, detail="المكالمة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error starting call: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calls/{call_id}/end")
async def end_call(call_id: str):
    """إنهاء المكالمة"""
    try:
        if await call_manager.end_call(call_id):
            return {"success": True, "message": "تم إنهاء المكالمة"}
        else:
            raise HTTPException(status_code=404, detail="المكالمة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error ending call: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calls/{call_id}/participants")
async def add_participant(
    call_id: str,
    user_id: str = Query(...),
    user_name: str = Query(...),
    user_avatar: str = Query("")
):
    """إضافة مشارك إلى مكالمة جماعية"""
    try:
        if await call_manager.add_participant(call_id, user_id, user_name, user_avatar):
            return {"success": True, "message": "تم إضافة المشارك"}
        else:
            raise HTTPException(status_code=400, detail="فشل إضافة المشارك")
    except Exception as e:
        logger.error(f"❌ Error adding participant: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/calls/{call_id}/participants/{user_id}")
async def remove_participant(call_id: str, user_id: str):
    """إزالة مشارك من مكالمة"""
    try:
        if await call_manager.remove_participant(call_id, user_id):
            return {"success": True, "message": "تم إزالة المشارك"}
        else:
            raise HTTPException(status_code=404, detail="المشارك غير موجود")
    except Exception as e:
        logger.error(f"❌ Error removing participant: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calls/{call_id}/mute")
async def toggle_mute(
    call_id: str,
    user_id: str = Query(...),
    is_muted: bool = Query(...)
):
    """تفعيل/تعطيل الصوت"""
    try:
        if await call_manager.toggle_mute(call_id, user_id, is_muted):
            return {"success": True, "message": "تم تحديث الصوت"}
        else:
            raise HTTPException(status_code=404, detail="المشارك غير موجود")
    except Exception as e:
        logger.error(f"❌ Error toggling mute: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calls/{call_id}/camera")
async def toggle_camera(
    call_id: str,
    user_id: str = Query(...),
    is_camera_off: bool = Query(...)
):
    """تفعيل/تعطيل الكاميرا"""
    try:
        if await call_manager.toggle_camera(call_id, user_id, is_camera_off):
            return {"success": True, "message": "تم تحديث الكاميرا"}
        else:
            raise HTTPException(status_code=404, detail="المشارك غير موجود")
    except Exception as e:
        logger.error(f"❌ Error toggling camera: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calls/{call_id}/screen-share")
async def toggle_screen_share(
    call_id: str,
    user_id: str = Query(...),
    is_sharing: bool = Query(...)
):
    """تفعيل/تعطيل مشاركة الشاشة"""
    try:
        if await call_manager.toggle_screen_share(call_id, user_id, is_sharing):
            return {"success": True, "message": "تم تحديث مشاركة الشاشة"}
        else:
            raise HTTPException(status_code=404, detail="المشارك غير موجود")
    except Exception as e:
        logger.error(f"❌ Error toggling screen share: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calls/{call_id}/raise-hand")
async def raise_hand(
    call_id: str,
    user_id: str = Query(...),
    is_raised: bool = Query(...)
):
    """رفع اليد"""
    try:
        if await call_manager.raise_hand(call_id, user_id, is_raised):
            return {"success": True, "message": "تم تحديث حالة اليد"}
        else:
            raise HTTPException(status_code=404, detail="المشارك غير موجود")
    except Exception as e:
        logger.error(f"❌ Error raising hand: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calls/{call_id}/background-blur")
async def toggle_background_blur(
    call_id: str,
    user_id: str = Query(...),
    enabled: bool = Query(...)
):
    """تفعيل/تعطيل ضبابية الخلفية"""
    try:
        if await call_manager.toggle_background_blur(call_id, user_id, enabled):
            return {"success": True, "message": "تم تحديث ضبابية الخلفية"}
        else:
            raise HTTPException(status_code=404, detail="المشارك غير موجود")
    except Exception as e:
        logger.error(f"❌ Error toggling background blur: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calls/{call_id}/noise-suppression")
async def toggle_noise_suppression(
    call_id: str,
    user_id: str = Query(...),
    enabled: bool = Query(...)
):
    """تفعيل/تعطيل تقليل الضوضاء"""
    try:
        if await call_manager.toggle_noise_suppression(call_id, user_id, enabled):
            return {"success": True, "message": "تم تحديث تقليل الضوضاء"}
        else:
            raise HTTPException(status_code=404, detail="المشارك غير موجود")
    except Exception as e:
        logger.error(f"❌ Error toggling noise suppression: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calls/{call_id}/echo-cancellation")
async def toggle_echo_cancellation(
    call_id: str,
    user_id: str = Query(...),
    enabled: bool = Query(...)
):
    """تفعيل/تعطيل إلغاء الصدى"""
    try:
        if await call_manager.toggle_echo_cancellation(call_id, user_id, enabled):
            return {"success": True, "message": "تم تحديث إلغاء الصدى"}
        else:
            raise HTTPException(status_code=404, detail="المشارك غير موجود")
    except Exception as e:
        logger.error(f"❌ Error toggling echo cancellation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calls/{call_id}/switch-device")
async def switch_device(
    call_id: str,
    user_id: str = Query(...),
    device_id: str = Query(...),
    device_type: DeviceType = Query(...),
    device_name: str = Query(...)
):
    """تبديل الجهاز"""
    try:
        device = Device(
            id=device_id,
            type=device_type,
            name=device_name,
            is_active=True
        )
        if await call_manager.switch_device(call_id, user_id, device):
            return {"success": True, "message": "تم تبديل الجهاز"}
        else:
            raise HTTPException(status_code=404, detail="المشارك غير موجود")
    except Exception as e:
        logger.error(f"❌ Error switching device: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calls/{call_id}/network-quality")
async def update_network_quality(
    call_id: str,
    user_id: str = Query(...),
    latency: int = Query(...),
    packet_loss: float = Query(...),
    bandwidth_up: int = Query(...),
    bandwidth_down: int = Query(...),
    jitter: int = Query(...)
):
    """تحديث جودة الشبكة"""
    try:
        stats = NetworkStats(
            latency=latency,
            packet_loss=packet_loss,
            bandwidth_up=bandwidth_up,
            bandwidth_down=bandwidth_down,
            jitter=jitter
        )
        if await call_manager.update_network_quality(call_id, user_id, stats):
            return {"success": True, "message": "تم تحديث جودة الشبكة"}
        else:
            raise HTTPException(status_code=404, detail="المشارك غير موجود")
    except Exception as e:
        logger.error(f"❌ Error updating network quality: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calls/{call_id}/reconnect")
async def reconnect(call_id: str, user_id: str = Query(...)):
    """إعادة الاتصال"""
    try:
        if await call_manager.handle_reconnection(call_id, user_id):
            return {"success": True, "message": "تم إعادة الاتصال"}
        else:
            raise HTTPException(status_code=404, detail="المشارك غير موجود")
    except Exception as e:
        logger.error(f"❌ Error reconnecting: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calls/{call_id}/recording/start")
async def start_recording(call_id: str):
    """بدء تسجيل المكالمة"""
    try:
        if await call_manager.start_recording(call_id):
            return {"success": True, "message": "تم بدء التسجيل"}
        else:
            raise HTTPException(status_code=404, detail="المكالمة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error starting recording: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calls/{call_id}/recording/stop")
async def stop_recording(call_id: str):
    """إيقاف تسجيل المكالمة"""
    try:
        if await call_manager.stop_recording(call_id):
            return {"success": True, "message": "تم إيقاف التسجيل"}
        else:
            raise HTTPException(status_code=404, detail="المكالمة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error stopping recording: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/calls/history/{user_id}")
async def get_call_history(
    user_id: str,
    limit: int = Query(50, ge=1, le=100)
):
    """الحصول على سجل المكالمات"""
    try:
        calls = call_manager.get_call_history(user_id, limit)
        return {
            "success": True,
            "calls": [asdict(call) for call in calls]
        }
    except Exception as e:
        logger.error(f"❌ Error getting call history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/calls/missed/{user_id}")
async def get_missed_calls(
    user_id: str,
    limit: int = Query(50, ge=1, le=100)
):
    """الحصول على المكالمات الفائتة"""
    try:
        missed_calls = call_manager.get_missed_calls(user_id, limit)
        return {
            "success": True,
            "missed_calls": [asdict(call) for call in missed_calls]
        }
    except Exception as e:
        logger.error(f"❌ Error getting missed calls: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calls/missed/{user_id}/{missed_call_id}/read")
async def mark_missed_call_as_read(user_id: str, missed_call_id: str):
    """وضع علامة على المكالمة الفائتة كمقروءة"""
    try:
        if await call_manager.mark_missed_call_as_read(user_id, missed_call_id):
            return {"success": True, "message": "تم وضع علامة على المكالمة"}
        else:
            raise HTTPException(status_code=404, detail="المكالمة الفائتة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error marking missed call as read: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/calls/{call_id}/{user_id}")
async def websocket_endpoint(call_id: str, user_id: str, websocket: WebSocket):
    """نقطة نهاية WebSocket للمكالمات"""
    await call_manager.connect(call_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")

            if message_type == "signal":
                # إشارة WebRTC
                await call_manager.broadcast(call_id, {
                    "type": "signal",
                    "from_user_id": user_id,
                    "data": data.get("data", {})
                })

            elif message_type == "ice-candidate":
                # مرشح ICE
                await call_manager.broadcast(call_id, {
                    "type": "ice-candidate",
                    "from_user_id": user_id,
                    "candidate": data.get("candidate", {})
                })

            elif message_type == "ping":
                # اختبار الاتصال
                await websocket.send_json({"type": "pong"})

    except Exception as e:
        logger.error(f"❌ WebSocket error: {str(e)}")
    finally:
        await call_manager.disconnect(call_id, websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
