from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


ALLOWED_EVENT_NAME_CHARS = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-:/')


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _sanitize_scalar(value: Any) -> str | int | float | bool | None:
    if value is None:
        return None
    if isinstance(value, (bool, int, float)):
        return value
    return str(value).strip()[:500]


def sanitize_event_name(name: Any) -> str:
    raw = str(name or '').strip()[:100]
    if not raw:
        return 'unknown_event'
    cleaned = ''.join(char if char in ALLOWED_EVENT_NAME_CHARS else '_' for char in raw)
    return cleaned or 'unknown_event'


def normalize_properties(properties: Any) -> dict[str, str | int | float | bool | None]:
    if not isinstance(properties, dict):
        return {}
    normalized: dict[str, str | int | float | bool | None] = {}
    for key, value in properties.items():
        normalized_key = sanitize_event_name(key)[:60]
        normalized[normalized_key] = _sanitize_scalar(value)
    return normalized


def build_event(payload: dict[str, Any] | None, request_meta: dict[str, Any] | None = None, user_id: int | None = None) -> dict[str, Any]:
    payload = payload or {}
    request_meta = request_meta or {}
    event = {
        'event_name': sanitize_event_name(payload.get('event_name') or payload.get('event') or 'unknown_event'),
        'category': sanitize_event_name(payload.get('category') or 'general'),
        'route': str(payload.get('route') or request_meta.get('route') or '/').strip()[:300],
        'platform': str(payload.get('platform') or request_meta.get('platform') or 'web').strip()[:32],
        'session_id': str(payload.get('session_id') or request_meta.get('session_id') or '').strip()[:120],
        'anonymous_id': str(payload.get('anonymous_id') or request_meta.get('anonymous_id') or '').strip()[:120],
        'user_id': user_id,
        'properties': normalize_properties(payload.get('properties')),
        'context': normalize_properties(payload.get('context')),
        'received_at': _now_iso(),
        'provider': settings.ANALYTICS_PROVIDER,
        'service': settings.SERVICE_NAME,
        'client_ip': str(request_meta.get('client_ip') or '').strip()[:120],
        'user_agent': str(request_meta.get('user_agent') or '').strip()[:300],
        'referer': str(request_meta.get('referer') or '').strip()[:300],
    }
    return event


def provider_status() -> dict[str, Any]:
    return {
        'enabled': bool(settings.ANALYTICS_ENABLED),
        'provider': settings.ANALYTICS_PROVIDER,
        'forwarding': bool(settings.ANALYTICS_FORWARD_URL),
        'forward_url': settings.ANALYTICS_FORWARD_URL or None,
    }


async def dispatch_event(event: dict[str, Any]) -> dict[str, Any]:
    status = provider_status()
    if not settings.ANALYTICS_ENABLED:
        return {
            'accepted': False,
            'reason': 'analytics_disabled',
            **status,
        }

    logger.info('analytics_event %s', {
        'event_name': event.get('event_name'),
        'category': event.get('category'),
        'route': event.get('route'),
        'user_id': event.get('user_id'),
        'provider': status.get('provider'),
    })

    if not settings.ANALYTICS_FORWARD_URL:
        return {
            'accepted': True,
            'delivery': 'logged_only',
            **status,
        }

    headers = {'Content-Type': 'application/json'}
    if settings.ANALYTICS_SHARED_SECRET:
        headers['X-Analytics-Secret'] = settings.ANALYTICS_SHARED_SECRET

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(settings.ANALYTICS_FORWARD_URL, json=event, headers=headers)
            response.raise_for_status()
        return {
            'accepted': True,
            'delivery': 'forwarded',
            **status,
        }
    except Exception as exc:  # pragma: no cover - network failure path
        logger.warning('analytics_forward_failed %s', str(exc)[:400])
        return {
            'accepted': True,
            'delivery': 'forward_failed_logged_locally',
            'error': str(exc)[:400],
            **status,
        }
