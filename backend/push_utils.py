from __future__ import annotations

import json
import logging
import os
from functools import lru_cache

logger = logging.getLogger(__name__)

try:
    import firebase_admin
    from firebase_admin import credentials, messaging
except Exception:  # pragma: no cover
    firebase_admin = None
    credentials = None
    messaging = None


def _normalize_tokens(tokens):
    seen = set()
    result = []
    for token in tokens or []:
        safe = str(token or "").strip()
        if safe and safe not in seen:
            seen.add(safe)
            result.append(safe)
    return result


@lru_cache(maxsize=1)
def _firebase_app():
    if firebase_admin is None:
        logger.warning("firebase_admin is not installed")
        return None

    try:
        return firebase_admin.get_app()
    except Exception:
        pass

    raw_json = (os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON") or "").strip()
    json_file = (os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH") or "").strip()

    cred = None
    if raw_json:
        try:
            cred = credentials.Certificate(json.loads(raw_json))
        except Exception as exc:
            logger.exception("Invalid FIREBASE_SERVICE_ACCOUNT_JSON: %s", exc)
            return None
    elif json_file and os.path.exists(json_file):
        try:
            cred = credentials.Certificate(json_file)
        except Exception as exc:
            logger.exception("Invalid FIREBASE_SERVICE_ACCOUNT_PATH: %s", exc)
            return None
    else:
        logger.info("Firebase service account is not configured")
        return None

    try:
        return firebase_admin.initialize_app(cred)
    except Exception as exc:
        logger.exception("Failed to initialize Firebase app: %s", exc)
        return None


def firebase_enabled() -> bool:
    return _firebase_app() is not None


def store_user_device_token(cursor, username: str, token: str, platform: str = "android", app_version: str = "") -> bool:
    safe_username = str(username or "").strip()
    safe_token = str(token or "").strip()
    safe_platform = str(platform or "android").strip() or "android"
    safe_app_version = str(app_version or "").strip()
    if not safe_username or not safe_token:
        return False

    cursor.execute("SELECT id FROM user_devices WHERE token=? LIMIT 1", (safe_token,))
    existing = cursor.fetchone()
    if existing:
        cursor.execute(
            "UPDATE user_devices SET username=?, platform=?, app_version=?, last_seen=CURRENT_TIMESTAMP WHERE token=?",
            (safe_username, safe_platform, safe_app_version, safe_token),
        )
    else:
        cursor.execute(
            "INSERT INTO user_devices (username, token, platform, app_version) VALUES (?, ?, ?, ?)",
            (safe_username, safe_token, safe_platform, safe_app_version),
        )
    return True


def get_user_device_tokens(cursor, username: str):
    safe_username = str(username or "").strip()
    if not safe_username:
        return []

    tokens = []
    try:
        cursor.execute("SELECT token FROM user_devices WHERE username=? ORDER BY id DESC", (safe_username,))
        rows = cursor.fetchall()
        tokens.extend([row["token"] for row in rows if row.get("token")])
    except Exception:
        logger.exception("Failed to fetch tokens from user_devices for %s", safe_username)

    try:
        cursor.execute("SELECT fcm_token FROM users WHERE name=? LIMIT 1", (safe_username,))
        row = cursor.fetchone()
        if row and row.get("fcm_token"):
            tokens.append(row["fcm_token"])
    except Exception:
        logger.exception("Failed to fetch fallback users.fcm_token for %s", safe_username)

    return _normalize_tokens(tokens)


def send_push_tokens(tokens, title: str, body: str, data: dict | None = None) -> bool:
    app = _firebase_app()
    normalized = _normalize_tokens(tokens)
    if app is None or not normalized:
        return False

    payload = {str(k): str(v) for k, v in (data or {}).items() if v is not None}
    success = False

    for token in normalized:
        try:
            message = messaging.Message(
                token=token,
                notification=messaging.Notification(title=str(title or "").strip(), body=str(body or "").strip()),
                data=payload,
                android=messaging.AndroidConfig(priority="high"),
                apns=messaging.APNSConfig(headers={"apns-priority": "10"}),
            )
            messaging.send(message, app=app)
            success = True
        except Exception:
            logger.exception("Failed to send push notification to token")
    return success


def send_push_to_user(cursor, username: str, title: str, body: str, data: dict | None = None) -> bool:
    return send_push_tokens(get_user_device_tokens(cursor, username), title, body, data=data)


def send_push_to_users(cursor, usernames, title: str, body: str, data: dict | None = None) -> bool:
    tokens = []
    for username in usernames or []:
        tokens.extend(get_user_device_tokens(cursor, username))
    return send_push_tokens(tokens, title, body, data=data)
