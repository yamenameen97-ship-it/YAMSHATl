from __future__ import annotations

import os
import secrets
from typing import Any

from flask import Blueprint, jsonify, request

from db import db_cursor
from utils import current_user, json_error, normalize_text, require_auth

try:
    from livekit import AccessToken, VideoGrant
except Exception:  # pragma: no cover - fallback when dependency is absent during static checks
    AccessToken = None
    VideoGrant = None


live_bp = Blueprint("live", __name__)


def _livekit_ws_url() -> str:
    return (
        os.getenv("LIVEKIT_WS_URL")
        or os.getenv("LIVEKIT_URL")
        or os.getenv("LIVEKIT_HOST")
        or "wss://your-livekit-server"
    ).strip()


def _livekit_api_key() -> str:
    return (os.getenv("LIVEKIT_API_KEY") or "LIVEKIT_API_KEY").strip()


def _livekit_secret() -> str:
    return (os.getenv("LIVEKIT_SECRET") or "LIVEKIT_SECRET").strip()


def create_token(room: str, user: str, can_publish: bool = True) -> str:
    if AccessToken is None or VideoGrant is None:
        raise RuntimeError("livekit dependency is not installed")

    token = AccessToken(
        _livekit_api_key(),
        _livekit_secret(),
        identity=user,
    )

    grant = VideoGrant(
        room_join=True,
        room=room,
        can_publish=can_publish,
        can_subscribe=True,
    )

    token.add_grant(grant)
    return token.to_jwt()


def _find_user(cur, username: str) -> dict[str, Any] | None:
    cur.execute("SELECT id, name, email FROM users WHERE name=%s LIMIT 1", (username,))
    return cur.fetchone()


def _room_payload(cur, room_id: int) -> dict[str, Any] | None:
    cur.execute(
        """
        SELECT
            lr.id,
            lr.host_id,
            lr.username,
            lr.title,
            lr.status,
            lr.stream_mode,
            lr.livekit_room,
            lr.platform,
            lr.created_at,
            (
                SELECT COUNT(*)
                FROM live_viewers lv
                WHERE lv.room_id = lr.id
                  AND lv.active = TRUE
                  AND lv.last_seen > NOW() - INTERVAL '90 seconds'
                  AND lv.is_host = FALSE
            ) AS viewer_count,
            (
                SELECT COUNT(*)
                FROM live_likes ll
                WHERE ll.room_id = lr.id
                  AND ll.created_at > NOW() - INTERVAL '60 minutes'
            ) AS hearts_count
        FROM live_rooms lr
        WHERE lr.id = %s
        LIMIT 1
        """,
        (room_id,),
    )
    return cur.fetchone()


@live_bp.post("/create_live")
@require_auth
def create_live():
    username = current_user() or ""
    data = request.get_json(silent=True) or {}
    title = normalize_text(data.get("title"), 120) or f"بث مباشر - {username}"
    platform = normalize_text(data.get("platform"), 40) or "web"

    with db_cursor(commit=True) as (_conn, cur):
        user = _find_user(cur, username)
        cur.execute(
            "SELECT id, livekit_room FROM live_rooms WHERE username=%s AND status='live' ORDER BY id DESC LIMIT 1",
            (username,),
        )
        existing = cur.fetchone()
        if existing:
            token = create_token(existing["livekit_room"], username, can_publish=True)
            return jsonify(
                {
                    "ok": True,
                    "message": "لديك بث مباشر نشط بالفعل",
                    "room_id": str(existing["id"]),
                    "livekit_room": existing["livekit_room"],
                    "livekit_url": _livekit_ws_url(),
                    "token": token,
                }
            )

        room_slug = f"yamshat-live-{secrets.token_hex(6)}"
        cur.execute(
            """
            INSERT INTO live_rooms(host_id, username, title, status, stream_mode, livekit_room, platform)
            VALUES(%s,%s,%s,'live','livekit_sfu',%s,%s)
            RETURNING id
            """,
            (user["id"] if user else None, username, title, room_slug, platform),
        )
        room_id = cur.fetchone()["id"]
        cur.execute(
            "INSERT INTO live_messages(room_id, user_id, username, message) VALUES(%s,%s,%s,%s)",
            (room_id, user["id"] if user else None, username, "بدأ البث المباشر الآن"),
        )
        cur.execute(
            "INSERT INTO live_comments(room_id, user_id, username, comment) VALUES(%s,%s,%s,%s)",
            (room_id, user["id"] if user else None, username, "بدأ البث المباشر الآن"),
        )

    token = create_token(room_slug, username, can_publish=True)
    return jsonify(
        {
            "ok": True,
            "message": "تم تجهيز غرفة البث باستخدام LiveKit + Socket.IO",
            "room_id": str(room_id),
            "host": username,
            "livekit_room": room_slug,
            "livekit_url": _livekit_ws_url(),
            "token": token,
        }
    )


@live_bp.get("/live_rooms")
def live_rooms():
    with db_cursor() as (_conn, cur):
        cur.execute(
            """
            SELECT
                lr.id,
                lr.username,
                lr.title,
                lr.status,
                lr.stream_mode,
                lr.livekit_room,
                lr.created_at,
                (
                    SELECT COUNT(*)
                    FROM live_viewers lv
                    WHERE lv.room_id = lr.id
                      AND lv.active = TRUE
                      AND lv.last_seen > NOW() - INTERVAL '90 seconds'
                      AND lv.is_host = FALSE
                ) AS viewer_count
            FROM live_rooms lr
            WHERE lr.status='live'
            ORDER BY lr.id DESC
            LIMIT 100
            """
        )
        rows = cur.fetchall()
    return jsonify(rows)


@live_bp.get("/live_room/<int:room_id>")
def live_room(room_id: int):
    with db_cursor() as (_conn, cur):
        room = _room_payload(cur, room_id)
        if not room:
            return json_error("غرفة البث غير موجودة", 404)

        cur.execute(
            """
            SELECT username, platform, device_type, last_seen
            FROM live_viewers
            WHERE room_id=%s
              AND active=TRUE
              AND last_seen > NOW() - INTERVAL '90 seconds'
              AND is_host=FALSE
            ORDER BY last_seen DESC
            LIMIT 30
            """,
            (room_id,),
        )
        viewers = cur.fetchall()

    room["livekit_url"] = _livekit_ws_url()
    room["viewers"] = viewers
    return jsonify(room)


@live_bp.post("/live_token")
@require_auth
def live_token():
    username = current_user() or ""
    data = request.get_json(silent=True) or {}
    room_id = int(data.get("room_id") or 0)
    requested_role = normalize_text(data.get("role"), 20) or "viewer"
    platform = normalize_text(data.get("platform"), 40) or "web"

    with db_cursor() as (_conn, cur):
        room = _room_payload(cur, room_id)
        if not room or room["status"] != "live":
            return json_error("هذا البث غير متاح حالياً", 404)

    is_host = room["username"] == username or requested_role == "host"
    token = create_token(room["livekit_room"], username, can_publish=is_host)
    return jsonify(
        {
            "ok": True,
            "message": "تم إنشاء توكن البث",
            "room_id": str(room_id),
            "role": "host" if is_host else "viewer",
            "livekit_room": room["livekit_room"],
            "livekit_url": _livekit_ws_url(),
            "platform": platform,
            "token": token,
        }
    )


@live_bp.post("/live_presence")
@require_auth
def live_presence():
    username = current_user() or ""
    data = request.get_json(silent=True) or {}
    room_id = int(data.get("room_id") or 0)
    socket_id = normalize_text(data.get("socket_id"), 200)
    platform = normalize_text(data.get("platform"), 40) or "web"
    device_type = normalize_text(data.get("device_type"), 40) or "browser"
    is_host = bool(data.get("is_host"))
    active = data.get("active") is not False

    if not room_id:
        return json_error("رقم الغرفة غير صالح", 400)

    with db_cursor(commit=True) as (_conn, cur):
        room = _room_payload(cur, room_id)
        if not room:
            return json_error("غرفة البث غير موجودة", 404)

        user = _find_user(cur, username)
        cur.execute(
            "SELECT id FROM live_viewers WHERE room_id=%s AND username=%s LIMIT 1",
            (room_id, username),
        )
        existing = cur.fetchone()
        if existing:
            cur.execute(
                """
                UPDATE live_viewers
                SET user_id=%s, socket_id=%s, platform=%s, device_type=%s, is_host=%s, active=%s, last_seen=NOW()
                WHERE id=%s
                """,
                (user["id"] if user else None, socket_id or None, platform, device_type, is_host, active, existing["id"]),
            )
        else:
            cur.execute(
                """
                INSERT INTO live_viewers(room_id, user_id, username, socket_id, platform, device_type, is_host, active)
                VALUES(%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (room_id, user["id"] if user else None, username, socket_id or None, platform, device_type, is_host, active),
            )

        cur.execute(
            """
            SELECT COUNT(*) AS total
            FROM live_viewers
            WHERE room_id=%s
              AND active=TRUE
              AND last_seen > NOW() - INTERVAL '90 seconds'
              AND is_host=FALSE
            """,
            (room_id,),
        )
        total = cur.fetchone()["total"]

    return jsonify({"ok": True, "viewer_count": total})


@live_bp.get("/live_viewers/<int:room_id>")
@require_auth
def live_viewers(room_id: int):
    with db_cursor() as (_conn, cur):
        room = _room_payload(cur, room_id)
        if not room:
            return json_error("غرفة البث غير موجودة", 404)
        cur.execute(
            """
            SELECT username, platform, device_type, last_seen
            FROM live_viewers
            WHERE room_id=%s
              AND active=TRUE
              AND last_seen > NOW() - INTERVAL '90 seconds'
              AND is_host=FALSE
            ORDER BY last_seen DESC
            LIMIT 100
            """,
            (room_id,),
        )
        rows = cur.fetchall()
    return jsonify(rows)


@live_bp.get("/live_comments/<int:room_id>")
def live_comments(room_id: int):
    with db_cursor() as (_conn, cur):
        cur.execute(
            """
            SELECT id, username AS user, comment AS text, created_at
            FROM live_comments
            WHERE room_id=%s
            ORDER BY id DESC
            LIMIT 100
            """,
            (room_id,),
        )
        rows = list(reversed(cur.fetchall()))
    return jsonify(rows)


@live_bp.get("/live_gifts/<int:room_id>")
def live_gifts(room_id: int):
    with db_cursor() as (_conn, cur):
        cur.execute(
            """
            SELECT id, username AS user, gift_name AS gift, gift_value, created_at
            FROM live_gifts
            WHERE room_id=%s
            ORDER BY id DESC
            LIMIT 50
            """,
            (room_id,),
        )
        rows = list(reversed(cur.fetchall()))
    return jsonify(rows)


@live_bp.post("/end_live/<int:room_id>")
@require_auth
def end_live(room_id: int):
    username = current_user() or ""

    with db_cursor(commit=True) as (_conn, cur):
        room = _room_payload(cur, room_id)
        if not room:
            return json_error("غرفة البث غير موجودة", 404)
        if room["username"] != username:
            return json_error("لا يمكنك إنهاء هذا البث", 403)

        cur.execute("UPDATE live_rooms SET status='ended', ended_at=NOW() WHERE id=%s", (room_id,))
        cur.execute("UPDATE live_viewers SET active=FALSE, last_seen=NOW() WHERE room_id=%s", (room_id,))
        cur.execute(
            "INSERT INTO live_messages(room_id, username, message) VALUES(%s,%s,%s)",
            (room_id, username, "تم إنهاء البث"),
        )
        cur.execute(
            "INSERT INTO live_comments(room_id, username, comment) VALUES(%s,%s,%s)",
            (room_id, username, "تم إنهاء البث"),
        )

    return jsonify({"ok": True, "message": "تم إنهاء البث"})
