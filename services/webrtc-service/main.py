"""خدمة WebRTC Production - WebRTC Production Service
يوفر:
- إدارة اتصالات WebRTC
- خوادم TURN للـ NAT Traversal
- استرجاع الحزم (Packet Recovery)
- معالجة الأخطاء والإعادة التلقائية
- مراقبة جودة الاتصال
"""

from fastapi import FastAPI, HTTPException, Query, WebSocket, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Set, Tuple
from dataclasses import dataclass, asdict, field
from enum import Enum
import logging
import uuid
import asyncio
import json
from collections import defaultdict, deque

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Yamshat WebRTC Production Service",
    description="خدمة WebRTC Production مع دعم TURN وNAT Traversal",
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

class ICEConnectionState(str, Enum):
    """حالات اتصال ICE"""
    NEW = "new"
    CHECKING = "checking"
    CONNECTED = "connected"
    COMPLETED = "completed"
    FAILED = "failed"
    DISCONNECTED = "disconnected"
    CLOSED = "closed"


class ICEGatheringState(str, Enum):
    """حالات جمع ICE Candidates"""
    NEW = "new"
    GATHERING = "gathering"
    COMPLETE = "complete"


class DTLSTransportState(str, Enum):
    """حالات DTLS Transport"""
    NEW = "new"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    CLOSED = "closed"
    FAILED = "failed"


@dataclass
class ICECandidate:
    """مرشح ICE"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    candidate: str = ""  # صيغة WebRTC ICE candidate
    sdp_mid: str = ""
    sdp_mline_index: int = 0
    username_fragment: str = ""
    priority: int = 0
    address: str = ""
    protocol: str = ""  # udp, tcp
    port: int = 0
    type: str = ""  # host, srflx, prflx, relay
    tcp_type: Optional[str] = None  # active, passive, so
    related_address: Optional[str] = None
    related_port: Optional[int] = None
    foundation: str = ""
    component: str = "rtp"  # rtp, rtcp
    discovered_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class TURNServerConfig:
    """إعدادات خادم TURN"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    urls: List[str] = field(default_factory=list)  # turn:host:port, turns:host:port
    username: str = ""
    credential: str = ""
    credential_type: str = "password"  # password, oauth
    priority: int = 100
    is_active: bool = True
    max_connections: int = 1000
    current_connections: int = 0
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class STUNServerConfig:
    """إعدادات خادم STUN"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    urls: List[str] = field(default_factory=list)  # stun:host:port
    priority: int = 100
    is_active: bool = True
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class RTCPeerConnection:
    """اتصال WebRTC Peer"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    local_peer_id: str = ""
    remote_peer_id: str = ""
    ice_connection_state: ICEConnectionState = ICEConnectionState.NEW
    ice_gathering_state: ICEGatheringState = ICEGatheringState.NEW
    dtls_transport_state: DTLSTransportState = DTLSTransportState.NEW
    ice_candidates: List[ICECandidate] = field(default_factory=list)
    local_description: Optional[str] = None  # SDP
    remote_description: Optional[str] = None  # SDP
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    connected_at: Optional[str] = None
    closed_at: Optional[str] = None
    selected_candidate_pair: Optional[Tuple[str, str]] = None  # (local, remote)
    rtt: int = 0  # Round Trip Time بالميلي ثانية
    available_outgoing_bitrate: int = 0
    available_incoming_bitrate: int = 0


@dataclass
class PacketLossInfo:
    """معلومات فقدان الحزم"""
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    packets_lost: int = 0
    packets_sent: int = 0
    packets_received: int = 0
    loss_percentage: float = 0.0


@dataclass
class PacketRecoveryStrategy:
    """استراتيجية استرجاع الحزم"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    connection_id: str = ""
    strategy_type: str = ""  # retransmission, fec, redundancy
    enabled: bool = True
    retransmission_timeout: int = 100  # ميلي ثانية
    fec_overhead: float = 0.1  # 10% overhead
    redundancy_level: int = 1  # عدد نسخ البيانات الزائدة
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class NATTraversalInfo:
    """معلومات NAT Traversal"""
    connection_id: str = ""
    local_candidate_type: str = ""  # host, srflx, prflx, relay
    remote_candidate_type: str = ""
    selected_pair_protocol: str = ""  # udp, tcp
    nat_type: str = ""  # open, cone, symmetric
    traversal_method: str = ""  # direct, stun, turn
    traversal_success: bool = False
    traversal_time_ms: int = 0


# ============ مدير WebRTC ============

class WebRTCManager:
    """مدير WebRTC Production"""

    def __init__(self):
        # اتصالات Peer
        self.peer_connections: Dict[str, RTCPeerConnection] = {}
        
        # خوادم TURN
        self.turn_servers: Dict[str, TURNServerConfig] = {}
        
        # خوادم STUN
        self.stun_servers: Dict[str, STUNServerConfig] = {}
        
        # استراتيجيات استرجاع الحزم
        self.recovery_strategies: Dict[str, PacketRecoveryStrategy] = {}
        
        # معلومات فقدان الحزم
        self.packet_loss_info: Dict[str, deque] = defaultdict(lambda: deque(maxlen=300))
        
        # معلومات NAT Traversal
        self.nat_traversal_info: Dict[str, NATTraversalInfo] = {}
        
        # تهيئة الخوادم الافتراضية
        self._initialize_default_servers()

    def _initialize_default_servers(self):
        """تهيئة خوادم STUN/TURN الافتراضية"""
        # خوادم STUN العامة
        stun_servers_config = [
            {"urls": ["stun:stun.l.google.com:19302"]},
            {"urls": ["stun:stun1.l.google.com:19302"]},
            {"urls": ["stun:stun2.l.google.com:19302"]},
            {"urls": ["stun:stun3.l.google.com:19302"]},
            {"urls": ["stun:stun4.l.google.com:19302"]},
        ]
        
        for i, config in enumerate(stun_servers_config):
            stun = STUNServerConfig(
                urls=config["urls"],
                priority=100 - i
            )
            self.stun_servers[stun.id] = stun
        
        logger.info(f"Initialized {len(self.stun_servers)} STUN servers")

    async def create_peer_connection(
        self,
        local_peer_id: str,
        remote_peer_id: str
    ) -> RTCPeerConnection:
        """إنشاء اتصال WebRTC Peer"""
        connection = RTCPeerConnection(
            local_peer_id=local_peer_id,
            remote_peer_id=remote_peer_id
        )
        
        self.peer_connections[connection.id] = connection
        
        # إنشاء استراتيجية استرجاع الحزم
        recovery_strategy = PacketRecoveryStrategy(
            connection_id=connection.id,
            strategy_type="retransmission"
        )
        self.recovery_strategies[connection.id] = recovery_strategy
        
        logger.info(f"Peer connection created: {connection.id}")
        return connection

    async def add_ice_candidate(
        self,
        connection_id: str,
        candidate_str: str,
        sdp_mid: str = "",
        sdp_mline_index: int = 0
    ) -> bool:
        """إضافة مرشح ICE"""
        if connection_id not in self.peer_connections:
            return False
        
        connection = self.peer_connections[connection_id]
        
        # تحليل مرشح ICE
        candidate = self._parse_ice_candidate(candidate_str, sdp_mid, sdp_mline_index)
        connection.ice_candidates.append(candidate)
        
        logger.info(f"ICE candidate added to connection {connection_id}: {candidate.type}")
        return True

    def _parse_ice_candidate(
        self,
        candidate_str: str,
        sdp_mid: str,
        sdp_mline_index: int
    ) -> ICECandidate:
        """تحليل مرشح ICE"""
        candidate = ICECandidate(
            candidate=candidate_str,
            sdp_mid=sdp_mid,
            sdp_mline_index=sdp_mline_index
        )
        
        # استخراج معلومات المرشح من النص
        parts = candidate_str.split()
        
        for i, part in enumerate(parts):
            if part == "candidate:":
                candidate.foundation = parts[i + 1].split(":")[0]
            elif part == "typ":
                candidate.type = parts[i + 1]
            elif part == "raddr":
                candidate.related_address = parts[i + 1]
            elif part == "rport":
                candidate.related_port = int(parts[i + 1])
        
        return candidate

    async def set_local_description(
        self,
        connection_id: str,
        sdp: str
    ) -> bool:
        """تعيين الوصف المحلي (Local SDP)"""
        if connection_id not in self.peer_connections:
            return False
        
        connection = self.peer_connections[connection_id]
        connection.local_description = sdp
        connection.ice_gathering_state = ICEGatheringState.GATHERING
        
        logger.info(f"Local description set for connection {connection_id}")
        return True

    async def set_remote_description(
        self,
        connection_id: str,
        sdp: str
    ) -> bool:
        """تعيين الوصف البعيد (Remote SDP)"""
        if connection_id not in self.peer_connections:
            return False
        
        connection = self.peer_connections[connection_id]
        connection.remote_description = sdp
        connection.ice_connection_state = ICEConnectionState.CHECKING
        
        logger.info(f"Remote description set for connection {connection_id}")
        return True

    async def on_ice_connection_state_change(
        self,
        connection_id: str,
        new_state: ICEConnectionState
    ) -> bool:
        """معالجة تغيير حالة اتصال ICE"""
        if connection_id not in self.peer_connections:
            return False
        
        connection = self.peer_connections[connection_id]
        old_state = connection.ice_connection_state
        connection.ice_connection_state = new_state
        
        if new_state == ICEConnectionState.CONNECTED:
            connection.connected_at = datetime.utcnow().isoformat()
            logger.info(f"ICE connection established: {connection_id}")
        elif new_state == ICEConnectionState.FAILED:
            logger.warning(f"ICE connection failed: {connection_id}")
        
        return True

    async def record_packet_loss(
        self,
        connection_id: str,
        packets_lost: int,
        packets_sent: int,
        packets_received: int
    ) -> bool:
        """تسجيل معلومات فقدان الحزم"""
        if connection_id not in self.peer_connections:
            return False
        
        loss_percentage = 0.0
        if packets_sent > 0:
            loss_percentage = (packets_lost / packets_sent) * 100
        
        info = PacketLossInfo(
            packets_lost=packets_lost,
            packets_sent=packets_sent,
            packets_received=packets_received,
            loss_percentage=loss_percentage
        )
        
        self.packet_loss_info[connection_id].append(info)
        
        # إذا كان فقدان الحزم مرتفعاً، تفعيل استرجاع الحزم
        if loss_percentage > 5.0:
            await self._enable_packet_recovery(connection_id)
        
        return True

    async def _enable_packet_recovery(self, connection_id: str) -> bool:
        """تفعيل استرجاع الحزم"""
        if connection_id not in self.recovery_strategies:
            return False
        
        strategy = self.recovery_strategies[connection_id]
        strategy.enabled = True
        
        logger.warning(f"Packet recovery enabled for connection {connection_id}")
        return True

    async def record_nat_traversal_info(
        self,
        connection_id: str,
        local_candidate_type: str,
        remote_candidate_type: str,
        selected_pair_protocol: str,
        nat_type: str,
        traversal_method: str,
        traversal_success: bool,
        traversal_time_ms: int
    ) -> bool:
        """تسجيل معلومات NAT Traversal"""
        if connection_id not in self.peer_connections:
            return False
        
        info = NATTraversalInfo(
            connection_id=connection_id,
            local_candidate_type=local_candidate_type,
            remote_candidate_type=remote_candidate_type,
            selected_pair_protocol=selected_pair_protocol,
            nat_type=nat_type,
            traversal_method=traversal_method,
            traversal_success=traversal_success,
            traversal_time_ms=traversal_time_ms
        )
        
        self.nat_traversal_info[connection_id] = info
        
        logger.info(
            f"NAT traversal info recorded for connection {connection_id}: "
            f"method={traversal_method}, success={traversal_success}, time={traversal_time_ms}ms"
        )
        return True

    async def close_peer_connection(self, connection_id: str) -> bool:
        """إغلاق اتصال Peer"""
        if connection_id not in self.peer_connections:
            return False
        
        connection = self.peer_connections[connection_id]
        connection.ice_connection_state = ICEConnectionState.CLOSED
        connection.dtls_transport_state = DTLSTransportState.CLOSED
        connection.closed_at = datetime.utcnow().isoformat()
        
        logger.info(f"Peer connection closed: {connection_id}")
        return True

    def get_peer_connection(self, connection_id: str) -> Optional[Dict]:
        """الحصول على معلومات اتصال Peer"""
        if connection_id not in self.peer_connections:
            return None
        
        connection = self.peer_connections[connection_id]
        return {
            "connection_id": connection.id,
            "local_peer_id": connection.local_peer_id,
            "remote_peer_id": connection.remote_peer_id,
            "ice_connection_state": connection.ice_connection_state.value,
            "ice_gathering_state": connection.ice_gathering_state.value,
            "dtls_transport_state": connection.dtls_transport_state.value,
            "ice_candidates_count": len(connection.ice_candidates),
            "connected_at": connection.connected_at,
            "rtt": connection.rtt
        }

    def get_ice_candidates(self, connection_id: str) -> List[Dict]:
        """الحصول على مرشحات ICE"""
        if connection_id not in self.peer_connections:
            return []
        
        connection = self.peer_connections[connection_id]
        return [asdict(candidate) for candidate in connection.ice_candidates]

    def get_packet_loss_stats(self, connection_id: str, limit: int = 60) -> List[Dict]:
        """الحصول على إحصائيات فقدان الحزم"""
        if connection_id not in self.packet_loss_info:
            return []
        
        recent_info = list(self.packet_loss_info[connection_id])[-limit:]
        return [asdict(info) for info in recent_info]

    def get_turn_servers(self) -> List[Dict]:
        """الحصول على قائمة خوادم TURN"""
        return [
            asdict(server) for server in self.turn_servers.values()
            if server.is_active
        ]

    def get_stun_servers(self) -> List[Dict]:
        """الحصول على قائمة خوادم STUN"""
        return [
            asdict(server) for server in self.stun_servers.values()
            if server.is_active
        ]

    async def add_turn_server(
        self,
        urls: List[str],
        username: str = "",
        credential: str = ""
    ) -> TURNServerConfig:
        """إضافة خادم TURN"""
        turn = TURNServerConfig(
            urls=urls,
            username=username,
            credential=credential
        )
        self.turn_servers[turn.id] = turn
        logger.info(f"TURN server added: {turn.id}")
        return turn


# ============ مثيل مدير WebRTC ============

webrtc_manager = WebRTCManager()


# ============ المسارات (Routes) ============

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "webrtc-production-service",
        "version": "1.0.0",
        "active_connections": len(webrtc_manager.peer_connections),
        "turn_servers": len(webrtc_manager.turn_servers),
        "stun_servers": len(webrtc_manager.stun_servers)
    }


@app.post("/connections")
async def create_peer_connection(
    local_peer_id: str = Query(...),
    remote_peer_id: str = Query(...)
):
    """إنشاء اتصال WebRTC Peer"""
    try:
        connection = await webrtc_manager.create_peer_connection(
            local_peer_id,
            remote_peer_id
        )
        return {
            "success": True,
            "connection_id": connection.id,
            "connection": asdict(connection)
        }
    except Exception as e:
        logger.error(f"Error creating peer connection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/connections/{connection_id}")
async def get_peer_connection(connection_id: str):
    """الحصول على معلومات اتصال Peer"""
    try:
        connection = webrtc_manager.get_peer_connection(connection_id)
        if connection:
            return {"success": True, "connection": connection}
        else:
            raise HTTPException(status_code=404, detail="الاتصال غير موجود")
    except Exception as e:
        logger.error(f"Error getting peer connection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/connections/{connection_id}/ice-candidates")
async def add_ice_candidate(
    connection_id: str,
    candidate: str = Query(...),
    sdp_mid: str = Query(""),
    sdp_mline_index: int = Query(0)
):
    """إضافة مرشح ICE"""
    try:
        if await webrtc_manager.add_ice_candidate(
            connection_id,
            candidate,
            sdp_mid,
            sdp_mline_index
        ):
            return {"success": True, "message": "تم إضافة مرشح ICE"}
        else:
            raise HTTPException(status_code=404, detail="الاتصال غير موجود")
    except Exception as e:
        logger.error(f"Error adding ICE candidate: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/connections/{connection_id}/ice-candidates")
async def get_ice_candidates(connection_id: str):
    """الحصول على مرشحات ICE"""
    try:
        candidates = webrtc_manager.get_ice_candidates(connection_id)
        return {"success": True, "candidates": candidates}
    except Exception as e:
        logger.error(f"Error getting ICE candidates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/connections/{connection_id}/packet-loss")
async def record_packet_loss(
    connection_id: str,
    packets_lost: int = Query(...),
    packets_sent: int = Query(...),
    packets_received: int = Query(...)
):
    """تسجيل معلومات فقدان الحزم"""
    try:
        if await webrtc_manager.record_packet_loss(
            connection_id,
            packets_lost,
            packets_sent,
            packets_received
        ):
            return {"success": True, "message": "تم تسجيل معلومات فقدان الحزم"}
        else:
            raise HTTPException(status_code=404, detail="الاتصال غير موجود")
    except Exception as e:
        logger.error(f"Error recording packet loss: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/connections/{connection_id}/packet-loss-stats")
async def get_packet_loss_stats(connection_id: str, limit: int = Query(60)):
    """الحصول على إحصائيات فقدان الحزم"""
    try:
        stats = webrtc_manager.get_packet_loss_stats(connection_id, limit)
        return {"success": True, "stats": stats}
    except Exception as e:
        logger.error(f"Error getting packet loss stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/connections/{connection_id}/nat-traversal")
async def record_nat_traversal_info(
    connection_id: str,
    local_candidate_type: str = Query(...),
    remote_candidate_type: str = Query(...),
    selected_pair_protocol: str = Query(...),
    nat_type: str = Query(...),
    traversal_method: str = Query(...),
    traversal_success: bool = Query(...),
    traversal_time_ms: int = Query(...)
):
    """تسجيل معلومات NAT Traversal"""
    try:
        if await webrtc_manager.record_nat_traversal_info(
            connection_id,
            local_candidate_type,
            remote_candidate_type,
            selected_pair_protocol,
            nat_type,
            traversal_method,
            traversal_success,
            traversal_time_ms
        ):
            return {"success": True, "message": "تم تسجيل معلومات NAT Traversal"}
        else:
            raise HTTPException(status_code=404, detail="الاتصال غير موجود")
    except Exception as e:
        logger.error(f"Error recording NAT traversal info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/connections/{connection_id}")
async def close_peer_connection(connection_id: str):
    """إغلاق اتصال Peer"""
    try:
        if await webrtc_manager.close_peer_connection(connection_id):
            return {"success": True, "message": "تم إغلاق الاتصال"}
        else:
            raise HTTPException(status_code=404, detail="الاتصال غير موجود")
    except Exception as e:
        logger.error(f"Error closing peer connection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/servers/turn")
async def get_turn_servers():
    """الحصول على قائمة خوادم TURN"""
    try:
        servers = webrtc_manager.get_turn_servers()
        return {"success": True, "servers": servers}
    except Exception as e:
        logger.error(f"Error getting TURN servers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/servers/stun")
async def get_stun_servers():
    """الحصول على قائمة خوادم STUN"""
    try:
        servers = webrtc_manager.get_stun_servers()
        return {"success": True, "servers": servers}
    except Exception as e:
        logger.error(f"Error getting STUN servers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/servers/turn")
async def add_turn_server(
    urls: List[str] = Query(...),
    username: str = Query(""),
    credential: str = Query("")
):
    """إضافة خادم TURN"""
    try:
        server = await webrtc_manager.add_turn_server(urls, username, credential)
        return {
            "success": True,
            "server_id": server.id,
            "server": asdict(server)
        }
    except Exception as e:
        logger.error(f"Error adding TURN server: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
