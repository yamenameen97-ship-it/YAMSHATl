"""خدمة استقرار البث - Stream Stability Service
يوفر:
- إعادة الاتصال التلقائي (Reconnect)
- استرجاع البث (Stream Recovery)
- مراقبة معدل البت (Bitrate Monitoring)
- كشف التأخير (Lag Detection)
- معالجة فقدان الحزم (Packet Loss Handling)
"""

from fastapi import FastAPI, HTTPException, Query, WebSocket, status
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Set
from dataclasses import dataclass, asdict, field
from enum import Enum
import logging
import uuid
from collections import deque

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Yamshat Stream Stability Service",
    description="خدمة استقرار البث مع المراقبة والاسترجاع التلقائي",
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

class ConnectionStatus(str, Enum):
    """حالة الاتصال"""
    CONNECTED = "connected"
    RECONNECTING = "reconnecting"
    DISCONNECTED = "disconnected"
    FAILED = "failed"


class NetworkQuality(str, Enum):
    """جودة الشبكة"""
    EXCELLENT = "excellent"  # < 50ms, < 1% loss
    GOOD = "good"            # 50-100ms, 1-3% loss
    FAIR = "fair"            # 100-200ms, 3-5% loss
    POOR = "poor"            # > 200ms, > 5% loss


@dataclass
class NetworkMetrics:
    """مقاييس الشبكة"""
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    latency: int = 0  # بالميلي ثانية
    jitter: int = 0  # تذبذب التأخير
    packet_loss: float = 0.0  # نسبة فقدان الحزم (0-100)
    bandwidth: int = 0  # بالـ bps
    bitrate: int = 0  # معدل البت الفعلي
    fps: int = 0  # عدد الإطارات في الثانية
    resolution: str = ""


@dataclass
class ReconnectConfig:
    """إعدادات إعادة الاتصال"""
    max_retries: int = 5
    initial_delay: int = 1000  # ميلي ثانية
    max_delay: int = 30000  # ميلي ثانية
    backoff_multiplier: float = 2.0
    enable_exponential_backoff: bool = True


@dataclass
class StreamConnection:
    """اتصال البث"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    stream_id: str = ""
    user_id: str = ""
    connection_status: ConnectionStatus = ConnectionStatus.CONNECTED
    network_quality: NetworkQuality = NetworkQuality.GOOD
    connected_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    disconnected_at: Optional[str] = None
    reconnect_attempts: int = 0
    last_reconnect_at: Optional[str] = None
    metrics_history: deque = field(default_factory=lambda: deque(maxlen=300))  # آخر 5 دقائق
    is_recovering: bool = False
    recovery_start_time: Optional[str] = None


@dataclass
class BitrateAdaptation:
    """تكيف معدل البت"""
    stream_id: str = ""
    current_bitrate: int = 2500000
    target_bitrate: int = 2500000
    min_bitrate: int = 500000
    max_bitrate: int = 10000000
    adaptation_factor: float = 0.95  # معامل التكيف
    last_adjustment_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    adjustment_count: int = 0


# ============ مدير استقرار البث ============

class StreamStabilityManager:
    """مدير استقرار البث"""

    def __init__(self):
        # الاتصالات النشطة
        self.connections: Dict[str, StreamConnection] = {}
        
        # إعدادات إعادة الاتصال
        self.reconnect_configs: Dict[str, ReconnectConfig] = {}
        
        # تكيف معدل البت
        self.bitrate_adaptations: Dict[str, BitrateAdaptation] = {}
        
        # مهام إعادة الاتصال
        self.reconnect_tasks: Dict[str, asyncio.Task] = {}
        
        # مهام المراقبة
        self.monitoring_tasks: Dict[str, asyncio.Task] = {}

    async def register_connection(
        self,
        stream_id: str,
        user_id: str,
        reconnect_config: Optional[ReconnectConfig] = None
    ) -> StreamConnection:
        """تسجيل اتصال جديد"""
        connection = StreamConnection(
            stream_id=stream_id,
            user_id=user_id
        )
        
        self.connections[connection.id] = connection
        self.reconnect_configs[connection.id] = reconnect_config or ReconnectConfig()
        self.bitrate_adaptations[connection.id] = BitrateAdaptation(
            stream_id=stream_id
        )
        
        # بدء مراقبة الاتصال
        await self.start_monitoring(connection.id)
        
        logger.info(f"Connection registered: {connection.id}")
        return connection

    async def start_monitoring(self, connection_id: str):
        """بدء مراقبة الاتصال"""
        if connection_id in self.monitoring_tasks:
            return
        
        async def monitor():
            while connection_id in self.connections:
                try:
                    connection = self.connections[connection_id]
                    
                    # تحديث جودة الشبكة
                    if connection.metrics_history:
                        latest_metrics = connection.metrics_history[-1]
                        connection.network_quality = self._calculate_network_quality(
                            latest_metrics
                        )
                    
                    await asyncio.sleep(5)  # مراقبة كل 5 ثوانٍ
                except Exception as e:
                    logger.error(f"Error monitoring connection {connection_id}: {str(e)}")
        
        task = asyncio.create_task(monitor())
        self.monitoring_tasks[connection_id] = task

    async def record_metrics(
        self,
        connection_id: str,
        metrics: NetworkMetrics
    ) -> bool:
        """تسجيل مقاييس الشبكة"""
        if connection_id not in self.connections:
            return False
        
        connection = self.connections[connection_id]
        connection.metrics_history.append(metrics)
        
        # التحقق من جودة الشبكة
        if metrics.packet_loss > 5.0 or metrics.latency > 200:
            logger.warning(
                f"Poor network quality for connection {connection_id}: "
                f"latency={metrics.latency}ms, loss={metrics.packet_loss}%"
            )
            
            # تفعيل تكيف معدل البت
            await self.adapt_bitrate(connection_id, metrics)
        
        return True

    def _calculate_network_quality(self, metrics: NetworkMetrics) -> NetworkQuality:
        """حساب جودة الشبكة بناءً على المقاييس"""
        if metrics.latency < 50 and metrics.packet_loss < 1:
            return NetworkQuality.EXCELLENT
        elif metrics.latency < 100 and metrics.packet_loss < 3:
            return NetworkQuality.GOOD
        elif metrics.latency < 200 and metrics.packet_loss < 5:
            return NetworkQuality.FAIR
        else:
            return NetworkQuality.POOR

    async def adapt_bitrate(
        self,
        connection_id: str,
        metrics: NetworkMetrics
    ) -> bool:
        """تكيف معدل البت بناءً على جودة الشبكة"""
        if connection_id not in self.bitrate_adaptations:
            return False
        
        adaptation = self.bitrate_adaptations[connection_id]
        
        # حساب معامل التكيف
        if metrics.packet_loss > 5.0:
            # تقليل معدل البت بنسبة 10%
            new_bitrate = int(adaptation.current_bitrate * 0.9)
        elif metrics.latency > 200:
            # تقليل معدل البت بنسبة 5%
            new_bitrate = int(adaptation.current_bitrate * 0.95)
        elif metrics.packet_loss < 1.0 and metrics.latency < 50:
            # زيادة معدل البت بنسبة 5%
            new_bitrate = int(adaptation.current_bitrate * 1.05)
        else:
            return False
        
        # التأكد من أن معدل البت ضمن الحدود المسموحة
        new_bitrate = max(adaptation.min_bitrate, min(adaptation.max_bitrate, new_bitrate))
        
        if new_bitrate != adaptation.current_bitrate:
            adaptation.current_bitrate = new_bitrate
            adaptation.target_bitrate = new_bitrate
            adaptation.last_adjustment_at = datetime.utcnow().isoformat()
            adaptation.adjustment_count += 1
            
            logger.info(
                f"Bitrate adapted for connection {connection_id}: "
                f"{adaptation.current_bitrate} bps"
            )
        
        return True

    async def handle_disconnect(self, connection_id: str) -> bool:
        """معالجة قطع الاتصال"""
        if connection_id not in self.connections:
            return False
        
        connection = self.connections[connection_id]
        connection.connection_status = ConnectionStatus.DISCONNECTED
        connection.disconnected_at = datetime.utcnow().isoformat()
        
        logger.warning(f"Connection disconnected: {connection_id}")
        
        # بدء إعادة الاتصال
        await self.start_reconnect(connection_id)
        
        return True

    async def start_reconnect(self, connection_id: str) -> bool:
        """بدء إعادة الاتصال"""
        if connection_id not in self.connections:
            return False
        
        connection = self.connections[connection_id]
        config = self.reconnect_configs.get(connection_id, ReconnectConfig())
        
        # إذا كانت هناك مهمة إعادة اتصال جارية، أوقفها
        if connection_id in self.reconnect_tasks:
            self.reconnect_tasks[connection_id].cancel()
        
        async def reconnect_loop():
            delay = config.initial_delay
            
            for attempt in range(config.max_retries):
                try:
                    connection.connection_status = ConnectionStatus.RECONNECTING
                    connection.is_recovering = True
                    connection.recovery_start_time = datetime.utcnow().isoformat()
                    
                    logger.info(
                        f"Reconnection attempt {attempt + 1}/{config.max_retries} "
                        f"for connection {connection_id} (delay: {delay}ms)"
                    )
                    
                    await asyncio.sleep(delay / 1000)
                    
                    # محاولة إعادة الاتصال
                    if await self._attempt_reconnect(connection_id):
                        connection.connection_status = ConnectionStatus.CONNECTED
                        connection.is_recovering = False
                        connection.reconnect_attempts = attempt + 1
                        connection.last_reconnect_at = datetime.utcnow().isoformat()
                        logger.info(f"Connection restored: {connection_id}")
                        return True
                    
                    # زيادة التأخير للمحاولة القادمة
                    if config.enable_exponential_backoff:
                        delay = min(
                            int(delay * config.backoff_multiplier),
                            config.max_delay
                        )
                
                except asyncio.CancelledError:
                    logger.info(f"Reconnection cancelled for {connection_id}")
                    return False
                except Exception as e:
                    logger.error(f"Error during reconnection: {str(e)}")
            
            # فشل إعادة الاتصال بعد جميع المحاولات
            connection.connection_status = ConnectionStatus.FAILED
            connection.is_recovering = False
            logger.error(f"Failed to reconnect after {config.max_retries} attempts: {connection_id}")
            return False
        
        task = asyncio.create_task(reconnect_loop())
        self.reconnect_tasks[connection_id] = task
        return True

    async def _attempt_reconnect(self, connection_id: str) -> bool:
        """محاولة إعادة الاتصال (يمكن تجاوزها في الفئات المشتقة)"""
        # هذه دالة وهمية يمكن تجاوزها لتطبيق منطق إعادة الاتصال الفعلي
        # في الواقع، ستتصل بخادم WebSocket أو API
        await asyncio.sleep(0.5)
        return True

    async def detect_lag(self, connection_id: str) -> Optional[int]:
        """كشف التأخير (Lag Detection)"""
        if connection_id not in self.connections:
            return None
        
        connection = self.connections[connection_id]
        
        if not connection.metrics_history:
            return None
        
        # حساب متوسط التأخير من آخر 10 قياسات
        recent_metrics = list(connection.metrics_history)[-10:]
        avg_latency = sum(m.latency for m in recent_metrics) / len(recent_metrics)
        
        return int(avg_latency)

    async def recover_stream(self, connection_id: str) -> bool:
        """استرجاع البث (Stream Recovery)"""
        if connection_id not in self.connections:
            return False
        
        connection = self.connections[connection_id]
        
        # إذا كان الاتصال متصلاً بالفعل، لا حاجة للاسترجاع
        if connection.connection_status == ConnectionStatus.CONNECTED:
            return True
        
        # بدء إعادة الاتصال إذا لم تكن جارية
        if not connection.is_recovering:
            await self.start_reconnect(connection_id)
        
        return True

    def get_connection_status(self, connection_id: str) -> Optional[Dict]:
        """الحصول على حالة الاتصال"""
        if connection_id not in self.connections:
            return None
        
        connection = self.connections[connection_id]
        return {
            "connection_id": connection.id,
            "stream_id": connection.stream_id,
            "user_id": connection.user_id,
            "status": connection.connection_status.value,
            "network_quality": connection.network_quality.value,
            "connected_at": connection.connected_at,
            "disconnected_at": connection.disconnected_at,
            "reconnect_attempts": connection.reconnect_attempts,
            "is_recovering": connection.is_recovering
        }

    def get_connection_metrics(
        self,
        connection_id: str,
        limit: int = 60
    ) -> List[Dict]:
        """الحصول على مقاييس الاتصال"""
        if connection_id not in self.connections:
            return []
        
        connection = self.connections[connection_id]
        recent_metrics = list(connection.metrics_history)[-limit:]
        
        return [asdict(m) for m in recent_metrics]

    async def cleanup_connection(self, connection_id: str):
        """تنظيف الاتصال"""
        if connection_id in self.connections:
            del self.connections[connection_id]
        
        if connection_id in self.reconnect_configs:
            del self.reconnect_configs[connection_id]
        
        if connection_id in self.bitrate_adaptations:
            del self.bitrate_adaptations[connection_id]
        
        if connection_id in self.reconnect_tasks:
            task = self.reconnect_tasks[connection_id]
            if not task.done():
                task.cancel()
            del self.reconnect_tasks[connection_id]
        
        if connection_id in self.monitoring_tasks:
            task = self.monitoring_tasks[connection_id]
            if not task.done():
                task.cancel()
            del self.monitoring_tasks[connection_id]
        
        logger.info(f"Connection cleaned up: {connection_id}")


# ============ مثيل مدير الاستقرار ============

stability_manager = StreamStabilityManager()


# ============ المسارات (Routes) ============

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "stream-stability-service",
        "version": "1.0.0",
        "active_connections": len(stability_manager.connections)
    }


@app.post("/connections")
async def register_connection(
    stream_id: str = Query(...),
    user_id: str = Query(...),
    max_retries: int = Query(5),
    initial_delay: int = Query(1000)
):
    """تسجيل اتصال جديد"""
    try:
        config = ReconnectConfig(
            max_retries=max_retries,
            initial_delay=initial_delay
        )
        connection = await stability_manager.register_connection(
            stream_id,
            user_id,
            config
        )
        return {
            "success": True,
            "connection_id": connection.id,
            "connection": asdict(connection)
        }
    except Exception as e:
        logger.error(f"Error registering connection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/connections/{connection_id}")
async def get_connection_status(connection_id: str):
    """الحصول على حالة الاتصال"""
    try:
        status = stability_manager.get_connection_status(connection_id)
        if status:
            return {"success": True, "status": status}
        else:
            raise HTTPException(status_code=404, detail="الاتصال غير موجود")
    except Exception as e:
        logger.error(f"Error getting connection status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/connections/{connection_id}/metrics")
async def record_metrics(
    connection_id: str,
    latency: int = Query(...),
    jitter: int = Query(...),
    packet_loss: float = Query(...),
    bandwidth: int = Query(...),
    bitrate: int = Query(...),
    fps: int = Query(...),
    resolution: str = Query(...)
):
    """تسجيل مقاييس الشبكة"""
    try:
        metrics = NetworkMetrics(
            latency=latency,
            jitter=jitter,
            packet_loss=packet_loss,
            bandwidth=bandwidth,
            bitrate=bitrate,
            fps=fps,
            resolution=resolution
        )
        if await stability_manager.record_metrics(connection_id, metrics):
            return {"success": True, "message": "تم تسجيل المقاييس"}
        else:
            raise HTTPException(status_code=404, detail="الاتصال غير موجود")
    except Exception as e:
        logger.error(f"Error recording metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/connections/{connection_id}/disconnect")
async def handle_disconnect(connection_id: str):
    """معالجة قطع الاتصال"""
    try:
        if await stability_manager.handle_disconnect(connection_id):
            return {"success": True, "message": "تم معالجة قطع الاتصال"}
        else:
            raise HTTPException(status_code=404, detail="الاتصال غير موجود")
    except Exception as e:
        logger.error(f"Error handling disconnect: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/connections/{connection_id}/recover")
async def recover_stream(connection_id: str):
    """استرجاع البث"""
    try:
        if await stability_manager.recover_stream(connection_id):
            return {"success": True, "message": "تم بدء استرجاع البث"}
        else:
            raise HTTPException(status_code=404, detail="الاتصال غير موجود")
    except Exception as e:
        logger.error(f"Error recovering stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/connections/{connection_id}/metrics")
async def get_metrics(connection_id: str, limit: int = Query(60)):
    """الحصول على مقاييس الاتصال"""
    try:
        metrics = stability_manager.get_connection_metrics(connection_id, limit)
        return {"success": True, "metrics": metrics}
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/connections/{connection_id}/lag")
async def detect_lag(connection_id: str):
    """كشف التأخير"""
    try:
        lag = await stability_manager.detect_lag(connection_id)
        if lag is not None:
            return {"success": True, "lag_ms": lag}
        else:
            raise HTTPException(status_code=404, detail="الاتصال غير موجود")
    except Exception as e:
        logger.error(f"Error detecting lag: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/connections/{connection_id}")
async def cleanup_connection(connection_id: str):
    """تنظيف الاتصال"""
    try:
        await stability_manager.cleanup_connection(connection_id)
        return {"success": True, "message": "تم تنظيف الاتصال"}
    except Exception as e:
        logger.error(f"Error cleaning up connection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
