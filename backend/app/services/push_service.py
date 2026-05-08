from __future__ import annotations

import logging
from typing import Any

from app.core.config import settings
from app.core.firebase import get_firebase_messaging

logger = logging.getLogger(__name__)


def push_provider_status() -> dict[str, Any]:
    messaging = get_firebase_messaging() if settings.PUSH_PROVIDER == 'firebase' else None
    return {
        'provider': settings.PUSH_PROVIDER,
        'configured': messaging is not None if settings.PUSH_PROVIDER == 'firebase' else False,
        'platforms': ['android', 'web'] if settings.PUSH_PROVIDER == 'firebase' else [],
    }


def _stringify_payload(data: dict | None) -> dict[str, str]:
    return {
        str(key): str(value)
        for key, value in (data or {}).items()
        if value is not None
    }


def send_push_notification(token: str | None, title: str, body: str, data: dict | None = None) -> bool:
    if not token:
        return False

    if settings.PUSH_PROVIDER != 'firebase':
        logger.warning('unsupported_push_provider %s', settings.PUSH_PROVIDER)
        return False

    messaging = get_firebase_messaging()
    if messaging is None:
        logger.info('push_skipped_firebase_not_configured')
        return False

    payload = _stringify_payload(data)
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
        response_id = messaging.send(message)
        logger.info('push_sent provider=%s response_id=%s', settings.PUSH_PROVIDER, response_id)
        return True
    except Exception as exc:  # pragma: no cover - provider/network failure path
        logger.warning('push_failed provider=%s error=%s', settings.PUSH_PROVIDER, str(exc)[:400])
        return False
