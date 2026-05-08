from __future__ import annotations

import hashlib
import os
import re
import secrets
from collections.abc import Mapping
from typing import Any

from fastapi import Request, Response

from app.core.config import settings

DEVICE_COOKIE_NAME = 'yamshat_device_id'
DEVICE_HEADER_NAME = 'x-device-id'
FORWARDED_FOR_HEADERS = ('x-forwarded-for', 'cf-connecting-ip', 'x-real-ip')


def stable_hash(value: str | None, *, salt: str | None = None) -> str:
    raw = (value or '').strip()
    pepper = salt if salt is not None else os.getenv('SECRET_KEY', '')
    payload = f'{pepper}::{raw}'.encode('utf-8')
    return hashlib.sha256(payload).hexdigest()


def _headers_map(source: Any) -> Mapping[str, Any]:
    if isinstance(source, Request):
        return source.headers
    if isinstance(source, Mapping):
        return source
    return {}


def get_client_ip(source: Any) -> str:
    headers = _headers_map(source)
    for header_name in FORWARDED_FOR_HEADERS:
        raw_value = str(headers.get(header_name) or '').strip()
        if raw_value:
            first = raw_value.split(',')[0].strip()
            if first:
                return first[:120]
    if isinstance(source, Request) and source.client:
        return str(source.client.host or 'unknown')[:120]
    return 'unknown'


def get_user_agent(source: Any) -> str:
    headers = _headers_map(source)
    value = str(headers.get('user-agent') or '').strip()
    return re.sub(r'\s+', ' ', value)[:255] or 'unknown'


def normalize_device_id(value: str | None) -> str:
    raw = re.sub(r'[^a-zA-Z0-9_.:-]+', '', str(value or '').strip())[:128]
    return raw


def get_device_id(source: Any) -> str:
    if isinstance(source, Request):
        header_value = source.headers.get(DEVICE_HEADER_NAME)
        cookie_value = source.cookies.get(DEVICE_COOKIE_NAME)
        normalized = normalize_device_id(header_value or cookie_value)
        if normalized:
            return normalized
    else:
        headers = _headers_map(source)
        normalized = normalize_device_id(headers.get(DEVICE_HEADER_NAME))
        if normalized:
            return normalized
    return ''


def ensure_device_cookie(response: Response, request: Request) -> str:
    existing = get_device_id(request)
    device_id = existing or f'dev_{secrets.token_urlsafe(24)}'
    response.set_cookie(
        key=DEVICE_COOKIE_NAME,
        value=device_id,
        httponly=False,
        secure=bool(settings.REFRESH_COOKIE_SECURE or request.url.scheme == 'https'),
        samesite=settings.cookie_samesite,
        path='/',
        max_age=60 * 60 * 24 * 365,
    )
    return device_id


def request_binding_context(request: Request) -> dict[str, str]:
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    device_id = get_device_id(request)
    return {
        'ip_address': ip_address,
        'device_id': device_id,
        'ip_hash': stable_hash(ip_address),
        'user_agent_hash': stable_hash(user_agent),
        'device_id_hash': stable_hash(device_id) if device_id else '',
        'user_agent': user_agent,
    }
