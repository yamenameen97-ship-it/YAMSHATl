from __future__ import annotations

import hashlib
import re
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Callable

import jwt
from flask import jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from config import Config

_RATE_BUCKETS: dict[str, deque[float]] = defaultdict(deque)
_RATE_LOCK = threading.Lock()
IDENTITY_RE = re.compile(r"^[^\s]{3,255}$")


def json_error(message: str, status: int = 400):
    return jsonify({"message": message}), status


def normalize_text(value, max_length: int | None = None) -> str:
    text = str(value or "").strip()
    if max_length is not None:
        text = text[:max_length]
    return text


def validate_identity(value: str) -> bool:
    return bool(IDENTITY_RE.match(str(value or "").strip()))


def validate_password_strength(password: str) -> bool:
    password = str(password or "")
    return len(password) >= 8


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
    return jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")


def decode_token(token: str | None):
    if not token:
        return None
    try:
        return jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
    except Exception:
        return None


def get_bearer_token() -> str | None:
    header = normalize_text(request.headers.get("Authorization"), 4096)
    if not header:
        return None
    if header.lower().startswith("bearer "):
        return header.split(" ", 1)[1].strip()
    return header


def current_identity() -> dict | None:
    if session.get("user"):
        return {
            "user": session.get("user"),
            "email": session.get("email"),
            "role": session.get("role", "user"),
        }
    return decode_token(get_bearer_token())


def current_user() -> str | None:
    identity = current_identity() or {}
    return identity.get("user")


def current_email() -> str | None:
    identity = current_identity() or {}
    return identity.get("email")


def current_role() -> str:
    identity = current_identity() or {}
    return identity.get("role", "user")


def login_user(user: str, email: str, role: str = "user") -> str:
    session.clear()
    session.permanent = True
    session["user"] = user
    session["email"] = email
    session["role"] = role
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
        if current_role() != "admin":
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
