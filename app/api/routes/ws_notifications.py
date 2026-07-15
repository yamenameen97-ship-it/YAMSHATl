"""
WebSocket endpoint للإشعارات اللحظية - Realtime Notifications WS.

Endpoint: /ws/notifications?token=<JWT>

يدعم:
- مصادقة JWT عبر query param
- Heartbeat (ping/pong) كل 25 ثانية
- إعادة الاتصال التلقائي من العميل
- بث متعدد الأجهزة (نفس المستخدم على أجهزة مختلفة يستلم على كلها)
"""
from __future__ import annotations

import asyncio
import logging
from typing import Optional

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from app.services.realtime_hub import realtime_hub

logger = logging.getLogger(__name__)

router = APIRouter(tags=["realtime"])

HEARTBEAT_SECONDS = 25


def _decode_user_from_token(token: Optional[str]) -> Optional[int]:
    """فك تشفير JWT لاستخراج user_id بدون كسر التطبيق إن فشل."""
    if not token:
        return None
    try:
        from app.core.security import decode_access_token  # type: ignore
        payload = decode_access_token(token)
        if not payload:
            return None
        uid = payload.get("sub") or payload.get("user_id") or payload.get("id")
        return int(uid) if uid is not None else None
    except Exception:
        pass

    # محاولة احتياطية: بعض المشاريع تستخدم jose مباشرة
    try:
        from jose import jwt  # type: ignore
        from app.core.config import settings  # type: ignore
        payload = jwt.decode(
            token,
            getattr(settings, "JWT_SECRET", getattr(settings, "SECRET_KEY", "")),
            algorithms=[getattr(settings, "JWT_ALGORITHM", "HS256")],
        )
        uid = payload.get("sub") or payload.get("user_id")
        return int(uid) if uid is not None else None
    except Exception as exc:
        logger.warning("ws_jwt_decode_failed err=%s", exc)
        return None


@router.websocket("/ws/notifications")
async def notifications_websocket(
    websocket: WebSocket,
    token: Optional[str] = Query(default=None),
):
    """WebSocket اتصال الإشعارات اللحظية."""

    # 1) مصادقة
    user_id = _decode_user_from_token(token)
    if user_id is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2) تسجيل الاتصال
    await realtime_hub.connect(user_id, websocket)

    heartbeat_task: Optional[asyncio.Task] = None

    async def _heartbeat() -> None:
        """نبضة دورية للتأكد من حيوية الاتصال."""
        try:
            while True:
                await asyncio.sleep(HEARTBEAT_SECONDS)
                try:
                    await websocket.send_json({"type": "ping"})
                except Exception:
                    return
        except asyncio.CancelledError:
            return

    try:
        heartbeat_task = asyncio.create_task(_heartbeat())
        while True:
            # استقبال رسائل العميل (pong, mark_read, subscribe, ...)
            msg = await websocket.receive_json()
            mtype = msg.get("type")

            if mtype == "pong":
                continue

            if mtype == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if mtype == "ack":
                # تأكيد استلام إشعار محدد - يمكن استخدامه لـ delivery receipts
                notif_id = msg.get("notification_id")
                logger.debug("ws_ack user_id=%s notif_id=%s", user_id, notif_id)
                continue

            if mtype == "mark_read":
                # العميل يضع علامة قراءة - فقط لتحديث المتصفّحات الأخرى
                await realtime_hub.publish(
                    user_id,
                    {
                        "type": "notification_read",
                        "notification_id": msg.get("notification_id"),
                    },
                )
                continue

    except WebSocketDisconnect:
        logger.info("ws_client_disconnect user_id=%s", user_id)
    except Exception as exc:
        logger.warning("ws_loop_error user_id=%s err=%s", user_id, exc)
    finally:
        if heartbeat_task and not heartbeat_task.done():
            heartbeat_task.cancel()
        await realtime_hub.disconnect(user_id, websocket)
