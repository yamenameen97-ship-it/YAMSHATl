"""
Group WebSocket Manager — Yamshat v59.2
========================================
يدير اتصالات WebSocket لكل مجموعة، ويبث الأحداث في الزمن الحقيقي
(رسائل جديدة، تفاعلات، كتابة، انضمام/مغادرة، تعديلات إدارية).

الاستخدام:
    from app.core.group_ws_manager import group_ws_manager
    await group_ws_manager.broadcast(group_id, {"type": "new_message", ...})
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Dict, Set, Any

from fastapi import WebSocket

logger = logging.getLogger("yamshat.groups.ws")


class GroupConnectionManager:
    """مدير اتصالات WebSocket لكل مجموعة."""

    def __init__(self) -> None:
        # {group_id: {user_id: {WebSocket, ...}}}
        self._connections: Dict[str, Dict[str, Set[WebSocket]]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, group_id: str, user_id: str, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._connections.setdefault(str(group_id), {}).setdefault(str(user_id), set()).add(ws)
        logger.info(f"[group-ws] connected group={group_id} user={user_id}")

    async def disconnect(self, group_id: str, user_id: str, ws: WebSocket) -> None:
        async with self._lock:
            users = self._connections.get(str(group_id))
            if not users:
                return
            sockets = users.get(str(user_id))
            if not sockets:
                return
            sockets.discard(ws)
            if not sockets:
                users.pop(str(user_id), None)
            if not users:
                self._connections.pop(str(group_id), None)
        logger.info(f"[group-ws] disconnected group={group_id} user={user_id}")

    async def broadcast(self, group_id: str, event: Dict[str, Any], exclude_user: str | None = None) -> int:
        """يبث حدثًا لكل المتصلين بالمجموعة. يعيد عدد المستلمين."""
        payload = json.dumps(event, ensure_ascii=False)
        delivered = 0
        async with self._lock:
            users = dict(self._connections.get(str(group_id), {}))
        for uid, sockets in users.items():
            if exclude_user and str(uid) == str(exclude_user):
                continue
            for ws in list(sockets):
                try:
                    await ws.send_text(payload)
                    delivered += 1
                except Exception as e:
                    logger.warning(f"[group-ws] send failed group={group_id} user={uid}: {e}")
                    # إزالة الاتصال المعطّل بصمت
                    try:
                        await self.disconnect(group_id, uid, ws)
                    except Exception:
                        pass
        return delivered

    async def send_personal(self, group_id: str, user_id: str, event: Dict[str, Any]) -> int:
        payload = json.dumps(event, ensure_ascii=False)
        delivered = 0
        async with self._lock:
            sockets = set(self._connections.get(str(group_id), {}).get(str(user_id), set()))
        for ws in sockets:
            try:
                await ws.send_text(payload)
                delivered += 1
            except Exception:
                try:
                    await self.disconnect(group_id, user_id, ws)
                except Exception:
                    pass
        return delivered

    def online_users(self, group_id: str) -> list[str]:
        users = self._connections.get(str(group_id), {})
        return list(users.keys())

    def stats(self) -> Dict[str, Any]:
        return {
            "groups": len(self._connections),
            "connections": sum(
                len(sockets)
                for users in self._connections.values()
                for sockets in users.values()
            ),
        }


# Singleton
group_ws_manager = GroupConnectionManager()
