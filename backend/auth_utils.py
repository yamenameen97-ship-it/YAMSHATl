from __future__ import annotations

from datetime import datetime, timedelta, timezone
import os
import secrets
from typing import Any

import jwt
from flask import request, session

SECRET_KEY = os.environ.get("JWT_SECRET_KEY") or os.environ.get("SECRET_KEY") or secrets.token_hex(32)
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = int(os.environ.get("JWT_EXPIRE_DAYS", "30"))


def create_token(user: str, email: str = "") -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "user": user,
        "email": email or "",
        "iat": now,
        "exp": now + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def _extract_token() -> str | None:
    auth_header = (request.headers.get("Authorization") or "").strip()
    if not auth_header:
        return None
    if auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return auth_header


def decode_token(token: str | None) -> dict[str, Any] | None:
    if not token:
        return None
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except Exception:
        return None


def token_identity() -> dict[str, Any] | None:
    return decode_token(_extract_token())


def current_user() -> str | None:
    if session.get("user"):
        return session.get("user")
    data = token_identity()
    return data.get("user") if data else None


def current_email() -> str | None:
    if session.get("email"):
        return session.get("email")
    data = token_identity()
    return data.get("email") if data else None
