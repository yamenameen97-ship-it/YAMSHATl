import json
import aioredis
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class DistributedSocketManager:
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.redis = None
        self.pubsub = None

    async def connect(self):
        self.redis = await aioredis.from_url(self.redis_url, decode_responses=True)
        self.pubsub = self.redis.pubsub()
        await self.pubsub.subscribe("websocket_broadcast")
        logger.info("Connected to Redis Pub/Sub for Distributed WebSockets")

    async def broadcast(self, message: Dict[str, Any]):
        """بث رسالة لجميع النسخ (Multi-instance sync)"""
        if self.redis:
            await self.redis.publish("websocket_broadcast", json.dumps(message))

    async def listen_for_messages(self, socket_callback):
        """الاستماع للرسائل القادمة من النسخ الأخرى"""
        async for message in self.pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                await socket_callback(data)

    async def track_active_user(self, user_id: int):
        """تتبع المستخدمين النشطين عبر Redis"""
        if self.redis:
            await self.redis.sadd("active_users", user_id)
            await self.redis.expire("active_users", 3600)

    async def remove_active_user(self, user_id: int):
        if self.redis:
            await self.redis.srem("active_users", user_id)
