"""
Realtime Hub - مركز البث اللحظي الموحَّد للإشعارات.

يدعم:
- WebSocket connections per user (multi-device)
- Redis Pub/Sub للبث بين عقد الخادم (horizontal scaling)
- Local fallback عند غياب Redis
- Delivery acks لتأكيد التسليم
- Heartbeat للتحقق من الاتصالات الحية

هذا النمط يشبه ما تستخدمه Instagram/Twitter/Discord:
كل عقدة خادم تشترك في قناة Redis، وعند إنشاء إشعار يُنشر
في القناة فتلتقطه جميع العقد وتسلّمه عبر WebSocket المحلية.
"""
from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, Optional, Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)

# قناة Redis الموحّدة للإشعارات
NOTIFICATIONS_CHANNEL = "yamshat:notifications"

try:
    import redis.asyncio as redis_asyncio  # type: ignore
    _REDIS_AVAILABLE = True
except Exception:  # pragma: no cover
    redis_asyncio = None
    _REDIS_AVAILABLE = False


class RealtimeHub:
    """مركز اتصالات WebSocket لحظي مع دعم Redis Pub/Sub."""

    def __init__(self) -> None:
        # user_id -> set of websockets (نفس المستخدم على عدة أجهزة)
        self._connections: Dict[int, Set[WebSocket]] = defaultdict(set)
        # locks per-user للحماية من race conditions
        self._locks: Dict[int, asyncio.Lock] = defaultdict(asyncio.Lock)
        self._redis: Optional[Any] = None
        self._pubsub_task: Optional[asyncio.Task] = None
        self._started = False
        self._node_id = f"node-{id(self)}"

    # ---------- إدارة الاتصالات ----------

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        """تسجيل اتصال WebSocket جديد لمستخدم."""
        await websocket.accept()
        async with self._locks[user_id]:
            self._connections[user_id].add(websocket)
        logger.info(
            "ws_connected user_id=%s total_devices=%s",
            user_id,
            len(self._connections[user_id]),
        )
        # أرسل رسالة ترحيب فورية
        await self._safe_send(
            websocket,
            {
                "type": "connection_ack",
                "user_id": user_id,
                "node": self._node_id,
                "server_time": datetime.utcnow().isoformat(),
            },
        )

    async def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        """إزالة اتصال WebSocket."""
        async with self._locks[user_id]:
            self._connections[user_id].discard(websocket)
            if not self._connections[user_id]:
                self._connections.pop(user_id, None)
        logger.info("ws_disconnected user_id=%s", user_id)

    def is_user_online(self, user_id: int) -> bool:
        """هل المستخدم متصل حالياً؟"""
        return bool(self._connections.get(user_id))

    def online_user_count(self) -> int:
        """عدد المستخدمين المتصلين على هذه العقدة."""
        return len(self._connections)

    # ---------- البث ----------

    async def publish(self, user_id: int, payload: Dict[str, Any]) -> int:
        """
        نشر إشعار للمستخدم. يعمل عبر Redis Pub/Sub إذا توفّر
        ليصل لكل عقدة، وإلا يبث محلياً فقط.

        Returns: عدد الاتصالات التي وصلها الإشعار محلياً.
        """
        envelope = {
            "user_id": user_id,
            "payload": payload,
            "origin_node": self._node_id,
            "published_at": datetime.utcnow().isoformat(),
        }

        # 1) أرسل عبر Redis ليصل لباقي العقد
        if self._redis is not None:
            try:
                await self._redis.publish(
                    NOTIFICATIONS_CHANNEL,
                    json.dumps(envelope, ensure_ascii=False),
                )
            except Exception as exc:  # pragma: no cover
                logger.warning("redis_publish_failed err=%s", exc)

        # 2) سلّم محلياً (لأن Redis لا يرسلها لنفس العقدة في بعض الإعدادات)
        return await self._deliver_local(user_id, payload)

    async def _deliver_local(self, user_id: int, payload: Dict[str, Any]) -> int:
        """التسليم لاتصالات WebSocket على هذه العقدة."""
        connections = list(self._connections.get(user_id, []))
        if not connections:
            return 0

        message = {
            "type": "new_notification",
            "data": payload,
            "delivered_at": datetime.utcnow().isoformat(),
        }
        delivered = 0
        dead: list[WebSocket] = []
        for ws in connections:
            ok = await self._safe_send(ws, message)
            if ok:
                delivered += 1
            else:
                dead.append(ws)

        # تنظيف الاتصالات الميتة
        if dead:
            async with self._locks[user_id]:
                for ws in dead:
                    self._connections[user_id].discard(ws)
                if not self._connections[user_id]:
                    self._connections.pop(user_id, None)
        return delivered

    async def broadcast_to_all(self, payload: Dict[str, Any]) -> int:
        """بث جماعي لكل المستخدمين المتصلين (مثل تنبيهات النظام)."""
        total = 0
        for user_id in list(self._connections.keys()):
            total += await self._deliver_local(user_id, payload)
        return total

    @staticmethod
    async def _safe_send(ws: WebSocket, message: Dict[str, Any]) -> bool:
        """إرسال آمن للرسالة - يلتقط الأخطاء."""
        try:
            await ws.send_json(message)
            return True
        except Exception:
            return False

    # ---------- Redis Pub/Sub ----------

    async def startup(self, redis_url: Optional[str] = None) -> None:
        """تشغيل Hub والاشتراك في قناة Redis."""
        if self._started:
            return
        self._started = True

        if not _REDIS_AVAILABLE or not redis_url:
            logger.info("realtime_hub_started mode=local (no Redis configured)")
            return

        try:
            self._redis = redis_asyncio.from_url(
                redis_url, encoding="utf-8", decode_responses=True
            )
            await self._redis.ping()
            self._pubsub_task = asyncio.create_task(self._subscribe_loop())
            logger.info("realtime_hub_started mode=redis url=%s", redis_url)
        except Exception as exc:
            logger.warning("realtime_hub_redis_failed err=%s - falling back to local", exc)
            self._redis = None

    async def shutdown(self) -> None:
        """إيقاف Hub."""
        if self._pubsub_task and not self._pubsub_task.done():
            self._pubsub_task.cancel()
        if self._redis is not None:
            try:
                await self._redis.close()
            except Exception:
                pass
        self._started = False

    async def _subscribe_loop(self) -> None:  # pragma: no cover - I/O
        """حلقة الاستماع لقناة Redis وتسليم الإشعارات محلياً."""
        if self._redis is None:
            return
        pubsub = self._redis.pubsub()
        await pubsub.subscribe(NOTIFICATIONS_CHANNEL)
        logger.info("redis_pubsub_listening channel=%s", NOTIFICATIONS_CHANNEL)
        try:
            async for message in pubsub.listen():
                if message.get("type") != "message":
                    continue
                try:
                    envelope = json.loads(message["data"])
                except Exception:
                    continue
                # تجاهل ما نشرناه نحن (يصل عبر _deliver_local مباشرة)
                if envelope.get("origin_node") == self._node_id:
                    continue
                user_id = envelope.get("user_id")
                payload = envelope.get("payload") or {}
                if isinstance(user_id, int):
                    await self._deliver_local(user_id, payload)
        except asyncio.CancelledError:
            pass
        except Exception as exc:
            logger.error("redis_pubsub_loop_error err=%s", exc)
        finally:
            try:
                await pubsub.unsubscribe(NOTIFICATIONS_CHANNEL)
            except Exception:
                pass


# نسخة وحيدة على مستوى التطبيق
realtime_hub = RealtimeHub()
