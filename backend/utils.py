from __future__ import annotations

import hashlib
import html
import re
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Callable

import jwt

try:
    from flask_jwt_extended import create_access_token, decode_token as flask_jwt_decode_token
except Exception:  # pragma: no cover
    create_access_token = None
    flask_jwt_decode_token = None
from flask import jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from config import Config

_RATE_BUCKETS: dict[str, deque[float]] = defaultdict(deque)
_RATE_LOCK = threading.Lock()
IDENTITY_RE = re.compile(r"^[^\s]{3,255}$")
EMAIL_CONTACT_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_CONTACT_RE = re.compile(r"^\+?[0-9]{8,20}$")


def json_error(message: str, status: int = 400):
    return jsonify({"message": message}), status


def clean(text) -> str:
    return html.escape(str(text or "").strip(), quote=True)


def normalize_text(value, max_length: int | None = None, escape_html: bool = False) -> str:
    text = str(value or "").strip()
    if max_length is not None:
        text = text[:max_length]
    return clean(text) if escape_html else text


def normalize_contact(value: str) -> str:
    text = normalize_text(value, 255)
    if not text:
        return ""
    if "@" in text:
        return text.lower()

    text = text.replace(" ", "")
    if text.startswith("00"):
        text = f"+{text[2:]}"

    if text.startswith("+"):
        digits = re.sub(r"\D", "", text[1:])
        return f"+{digits}" if digits else ""

    return re.sub(r"\D", "", text)


def validate_identity(value: str) -> bool:
    return bool(IDENTITY_RE.match(str(value or "").strip()))


def is_email_contact(value: str) -> bool:
    return bool(EMAIL_CONTACT_RE.match(normalize_text(value, 255).lower()))


def is_phone_contact(value: str) -> bool:
    return bool(PHONE_CONTACT_RE.match(normalize_contact(value)))


def validate_password_strength(password: str) -> bool:
    password = str(password or "")
    return len(password) >= 6


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(password: str, stored_password: str) -> tuple[bool, bool]:
    stored_password = str(stored_password or "")
    if not stored_password:
        return False, False

    try:
        if stored_password.startswith(("pbkdf2:", "scrypt:")):
            return check_password_hash(stored_password, password), False
    except Exception:
        pass

    sha256_match = hashlib.sha256(password.encode()).hexdigest() == stored_password
    if sha256_match:
        return True, True

    if password == stored_password:
        return True, True

    return False, False


def create_token(user: str, email: str, role: str = "user") -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user,
        "user": user,
        "email": email,
        "role": role,
        "iat": now,
        "exp": now + timedelta(days=Config.JWT_EXPIRE_DAYS),
    }
    if create_access_token is not None:
        return create_access_token(identity=user, additional_claims={"user": user, "email": email, "role": role})
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")


def decode_token(token: str | None):
    if not token:
        return None

    if flask_jwt_decode_token is not None:
        try:
            decoded = flask_jwt_decode_token(token)
            if isinstance(decoded, dict):
                return decoded
        except Exception:
            pass

    for secret in [Config.JWT_SECRET_KEY, Config.SECRET_KEY]:
        if not secret:
            continue
        try:
            return jwt.decode(token, secret, algorithms=["HS256"])
        except Exception:
            continue
    return None


def verify_token(token: str | None):
    return decode_token(token)


def get_bearer_token() -> str | None:
    header = normalize_text(request.headers.get("Authorization"), 4096)
    if not header:
        return None
    if header.lower().startswith("bearer "):
        return header.split(" ", 1)[1].strip()
    return header


def _parse_identity_datetime(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value, tz=timezone.utc)
    text = str(value or "").strip()
    if not text:
        return None
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00"))
    except Exception:
        return None



def _identity_force_logged_out(identity: dict | None) -> bool:
    if not identity:
        return False
    try:
        from db import get_force_logout_at

        issued_at = _parse_identity_datetime(identity.get("login_at") or identity.get("iat"))
        force_logout_at = _parse_identity_datetime(get_force_logout_at())
        if not issued_at or not force_logout_at:
            return False
        return issued_at <= force_logout_at
    except Exception:
        return False



def current_identity() -> dict | None:
    if session.get("user"):
        identity = {
            "user": session.get("user"),
            "email": session.get("email"),
            "role": session.get("role", "user"),
            "login_at": session.get("login_at"),
        }
        if _identity_force_logged_out(identity):
            session.clear()
            return None
        return identity
    identity = decode_token(get_bearer_token())
    if _identity_force_logged_out(identity):
        return None
    return identity


def current_user() -> str | None:
    identity = current_identity() or {}
    return identity.get("user")


def current_email() -> str | None:
    identity = current_identity() or {}
    return identity.get("email")


def current_role() -> str:
    identity = current_identity() or {}
    return identity.get("role", "user")


def is_privileged_role(role: str | None) -> bool:
    return str(role or "").strip().lower() in {"admin", "security", "moderator", "superadmin"}


def login_user(user: str, email: str, role: str = "user") -> str:
    session.clear()
    session.permanent = True
    session["user"] = user
    session["email"] = email
    session["role"] = role
    session["login_at"] = datetime.now(timezone.utc).isoformat()
    session.modified = True
    return create_token(user, email, role)


def logout_user() -> None:
    session.clear()


def require_auth(view: Callable):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not current_user():
            return json_error("يجب تسجيل الدخول أولاً", 401)
        return view(*args, **kwargs)

    return wrapped


def require_admin(view: Callable):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not current_user():
            return json_error("يجب تسجيل الدخول أولاً", 401)
        if not is_privileged_role(current_role()):
            return json_error("غير مصرح لك بهذا الإجراء", 403)
        return view(*args, **kwargs)

    return wrapped


def rate_limit(limit: int, window_seconds: int):
    def decorator(view: Callable):
        @wraps(view)
        def wrapped(*args, **kwargs):
            ip = request.headers.get("X-Forwarded-For", request.remote_addr or "unknown").split(",")[0].strip()
            bucket_key = f"{view.__name__}:{ip}"
            now = time.time()
            with _RATE_LOCK:
                bucket = _RATE_BUCKETS[bucket_key]
                while bucket and bucket[0] <= now - window_seconds:
                    bucket.popleft()
                if len(bucket) >= limit:
                    return json_error("عدد الطلبات كبير جداً، حاول بعد قليل", 429)
                bucket.append(now)
            return view(*args, **kwargs)

        return wrapped

    return decorator
