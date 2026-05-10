from __future__ import annotations

import logging
from typing import Any, List, Dict, Optional
from datetime import datetime
import uuid
import asyncio

from app.core.config import settings
from app.core.firebase import get_firebase_messaging

logger = logging.getLogger(__name__)

class PushNotificationEngine:
    def __init__(self):
        self.delivery_stats = {
            "sent": 0,
            "failed": 0,
            "retried": 0,
            "dlq_count": 0
        }
        self.dead_letter_queue = []
        self.analytics_logs = []

    def _stringify_payload(self, data: dict | None) -> dict[str, str]:
        return {
            str(key): str(value)
            for key, value in (data or {}).items()
            if value is not None
        }

    async def send_push_batch(self, tokens: List[str], title: str, body: str, data: Dict[str, Any]):
        """إرسال الإشعارات بشكل جماعي (Batching) مع التقسيم (Segmentation)"""
        logger.info(f"Batching push for {len(tokens)} users")
        chunks = [tokens[i:i + 100] for i in range(0, len(tokens), 100)]
        
        tasks = []
        for chunk in chunks:
            for token in chunk:
                tasks.append(self.send_with_retry(token, title, body, data))
        
        await asyncio.gather(*tasks)

    async def send_with_retry(self, token: str | None, title: str, body: str, data: dict | None = None, max_retries: int = 3) -> bool:
        if not token:
            return False

        notification_id = str(uuid.uuid4())
        attempt = 0
        
        while attempt < max_retries:
            success = self._send_to_provider(token, title, body, data)
            if success:
                self._log_delivery(notification_id, token, "delivered")
                self.delivery_stats["sent"] += 1
                return True
            
            attempt += 1
            logger.warning(f"Attempt {attempt} failed for {token}")
            self.delivery_stats["retried"] += 1
            await asyncio.sleep(1 * attempt) # Exponential backoff
        
        self._move_to_dlq(notification_id, token, title, body, data)
        return False

    def _send_to_provider(self, token: str, title: str, body: str, data: dict | None = None) -> bool:
        if settings.PUSH_PROVIDER != 'firebase':
            return False

        messaging = get_firebase_messaging()
        if messaging is None:
            return False

        payload = self._stringify_payload(data)
        message = messaging.Message(
            token=token,
            notification=messaging.Notification(title=title, body=body),
            data=payload,
            android=messaging.AndroidConfig(priority='high'),
            webpush=messaging.WebpushConfig(
                headers={'Urgency': 'high'},
                notification=messaging.WebpushNotification(title=title, body=body),
                fcm_options=messaging.WebpushFCMOptions(link=payload.get('path') or '/notifications'),
            ),
        )

        try:
            messaging.send(message)
            return True
        except Exception as exc:
            logger.warning('push_provider_error: %s', str(exc)[:200])
            return False

    def _log_delivery(self, notification_id: str, token: str, status: str):
        log_entry = {
            "id": notification_id,
            "token": token,
            "status": status,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.analytics_logs.append(log_entry)
        if len(self.analytics_logs) > 1000:
            self.analytics_logs.pop(0)

    def _move_to_dlq(self, notification_id: str, token: str, title: str, body: str, data: Dict[str, Any]):
        entry = {
            "id": notification_id,
            "token": token,
            "payload": {"title": title, "body": body, "data": data},
            "failed_at": datetime.utcnow().isoformat(),
            "reason": "Max retries exceeded"
        }
        self.dead_letter_queue.append(entry)
        self.delivery_stats["failed"] += 1
        self.delivery_stats["dlq_count"] += 1

    def get_analytics(self) -> Dict[str, Any]:
        return {
            "stats": self.delivery_stats,
            "recent_logs": self.analytics_logs[-50:],
            "dlq_size": len(self.dead_letter_queue)
        }

# Instance of the engine
push_engine = PushNotificationEngine()

def push_provider_status() -> dict[str, Any]:
    messaging = get_firebase_messaging() if settings.PUSH_PROVIDER == 'firebase' else None
    return {
        'provider': settings.PUSH_PROVIDER,
        'configured': messaging is not None if settings.PUSH_PROVIDER == 'firebase' else False,
        'platforms': ['android', 'web'] if settings.PUSH_PROVIDER == 'firebase' else [],
    }

def send_push_notification(token: str | None, title: str, body: str, data: dict | None = None) -> bool:
    """الدالة الأساسية المتوافقة مع الكود القديم"""
    if not token: return False
    # تشغيل في خلفية المهام لعدم تعطيل الاستجابة
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(push_engine.send_with_retry(token, title, body, data))
        else:
            asyncio.run(push_engine.send_with_retry(token, title, body, data))
        return True
    except Exception:
        return False
