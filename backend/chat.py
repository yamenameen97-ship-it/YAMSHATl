from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path

from flask import Blueprint, jsonify, request
from flask_socketio import emit, join_room, leave_room

from admin_utils import enforce_moderation, log_audit, record_spam_violation
from db import db_cursor
from push_utils import send_push_to_user, store_user_device_token
from routes.live import _livekit_ws_url, create_token
from socket_server import socketio
from utils import current_user, decode_token, json_error, normalize_text, rate_limit, require_auth

chat_bp = Blueprint("chat", __name__)

ALLOWED_MESSAGE_TYPES = {"text", "image", "video", "voice", "file", "call"}
ALLOWED_REACTIONS = {"👍", "❤️", "😂", "😮", "😢", "🔥", "👏"}
AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".aac", ".ogg", ".oga", ".opus", ".3gp", ".amr", ".weba"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm", ".mkv"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
SOCKET_USERS: dict[str, str] = {}
BANNED_WORDS = {
    "spam",
    "scam",
    "fraud",
    "شتيمة",
    "أكرهك",
    "تفجير",
    "ابتزاز",
    "احتيال",
}
URL_RE = re.compile(r"(?:https?://\S+|www\.\S+)", re.IGNORECASE)
CLIENT_ID_RE = re.compile(r"[^a-zA-Z0-9_\-:.]")



def _chat_room(a: str, b: str) -> str:
    users = sorted([a.strip(), b.strip()])
    return f"chat:{users[0]}:{users[1]}"



def _call_room(a: str, b: str) -> str:
    users = sorted([a.strip(), b.strip()])
    return f"call:{users[0]}:{users[1]}"



def _normalize_message_type(value: str, media_url: str = "") -> str:
    safe = str(value or "text").strip().lower() or "text"
    if safe in ALLOWED_MESSAGE_TYPES:
        return safe
    suffix = Path(media_url.split("?")[0]).suffix.lower()
    if suffix in AUDIO_EXTENSIONS:
        return "voice"
    if suffix in VIDEO_EXTENSIONS:
        return "video"
    if suffix in IMAGE_EXTENSIONS:
        return "image"
    return "file" if media_url else "text"



def _normalize_client_id(value: str | None) -> str:
    safe = normalize_text(value, 120)
    if not safe:
        return ""
    return CLIENT_ID_RE.sub("", safe)[:120]



def _normalize_reaction(value: str | None) -> str:
    safe = normalize_text(value, 16)
    return safe if safe in ALLOWED_REACTIONS else ""



def _ensure_chat_tables():
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS typing_status (
                id SERIAL PRIMARY KEY,
                sender TEXT NOT NULL,
                receiver TEXT NOT NULL,
                is_typing BOOLEAN NOT NULL DEFAULT FALSE,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(sender, receiver)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS analytics (
                id SERIAL PRIMARY KEY,
                "user" TEXT,
                event TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS message_reactions (
                id SERIAL PRIMARY KEY,
                message_id INT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
                username TEXT NOT NULL,
                emoji TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(message_id, username)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS chat_spam_locks (
                username TEXT PRIMARY KEY,
                strike_count INT NOT NULL DEFAULT 0,
                muted_until TIMESTAMP,
                reason TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        for statement in [
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'text'",
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT",
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE",
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent'",
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS client_id TEXT",
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id INT",
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP",
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS seen_at TIMESTAMP",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT FALSE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT",
        ]:
            cur.execute(statement)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_messages_pair_id ON messages(sender, receiver, id DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON messages(reply_to_id)")
        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_sender_client ON messages(sender, client_id) WHERE client_id IS NOT NULL")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id)")



def _is_blocked(cur, user_a: str, user_b: str) -> bool:
    cur.execute(
        """
        SELECT 1
        FROM blocked_users
        WHERE (blocker=%s AND blocked=%s) OR (blocker=%s AND blocked=%s)
        LIMIT 1
        """,
        (user_a, user_b, user_b, user_a),
    )
    return bool(cur.fetchone())



def _looks_like_encrypted(message: str) -> bool:
    return str(message or "").startswith("ENCv1:")



def _presence_payload(cur, username: str) -> dict:
    cur.execute(
        "SELECT name, COALESCE(is_online, FALSE) AS is_online, last_seen FROM users WHERE name=%s LIMIT 1",
        (username,),
    )
    row = cur.fetchone() or {}
    return {
        "user": row.get("name") or username,
        "is_online": bool(row.get("is_online")),
        "last_seen": row.get("last_seen"),
    }



def _set_user_online(cur, username: str, online: bool):
    cur.execute(
        "UPDATE users SET is_online=%s, last_seen=NOW() WHERE name=%s",
        (online, username),
    )



def _reply_preview(row: dict | None) -> dict | None:
    if not row:
        return None
    deleted = bool(row.get("deleted"))
    base_message = row.get("message") or ""
    preview = "تم حذف هذه الرسالة" if deleted else base_message
    if not preview:
        msg_type = row.get("type") or "text"
        preview = {
            "image": "📷 صورة",
            "video": "🎥 فيديو",
            "voice": "🎤 رسالة صوتية",
            "file": "📎 ملف",
            "call": "📞 مكالمة",
        }.get(msg_type, "رسالة")
    return {
        "id": row.get("id"),
        "sender": row.get("sender") or "",
        "type": row.get("type") or "text",
        "deleted": deleted,
        "content": str(preview)[:140],
        "media_url": None if deleted else row.get("media_url"),
    }



def _reaction_state(cur, message_ids: list[int], username: str | None = None) -> dict[int, dict]:
    if not message_ids:
        return {}
    cur.execute(
        "SELECT message_id, username, emoji FROM message_reactions WHERE message_id = ANY(%s) ORDER BY id ASC",
        (message_ids,),
    )
    state: dict[int, dict] = {mid: {"counts": {}, "my_reaction": None} for mid in message_ids}
    for row in cur.fetchall() or []:
        mid = int(row.get("message_id") or 0)
        emoji = row.get("emoji") or ""
        if mid not in state or not emoji:
            continue
        counts = state[mid]["counts"]
        counts[emoji] = int(counts.get(emoji) or 0) + 1
        if username and row.get("username") == username:
            state[mid]["my_reaction"] = emoji
    for value in state.values():
        items = [{"emoji": emoji, "count": count} for emoji, count in sorted(value["counts"].items(), key=lambda item: (-item[1], item[0]))]
        value["items"] = items
    return state



def _serialize_message(row: dict, reply_map: dict[int, dict] | None = None, reaction_map: dict[int, dict] | None = None) -> dict:
    deleted = bool(row.get("deleted"))
    base_message = row.get("message") or ""
    message_id = int(row.get("id") or 0)
    reaction_state = (reaction_map or {}).get(message_id, {})
    reply_to_id = int(row.get("reply_to_id") or 0) or None
    return {
        "id": row.get("id"),
        "client_id": row.get("client_id") or None,
        "sender": row.get("sender") or "",
        "receiver": row.get("receiver") or "",
        "message": "تم حذف هذه الرسالة" if deleted else base_message,
        "content": "تم حذف هذه الرسالة" if deleted else base_message,
        "type": row.get("type") or "text",
        "media_url": None if deleted else row.get("media_url"),
        "deleted": deleted,
        "status": row.get("status") or "sent",
        "is_e2e": _looks_like_encrypted(base_message),
        "reply_to_id": reply_to_id,
        "reply_to": (reply_map or {}).get(reply_to_id or 0),
        "reactions": reaction_state.get("items") or [],
        "my_reaction": reaction_state.get("my_reaction"),
        "delivered_at": row.get("delivered_at"),
        "seen_at": row.get("seen_at"),
        "created_at": row.get("created_at"),
    }



def _hydrate_messages(cur, rows: list[dict], username: str | None = None) -> list[dict]:
    if not rows:
        return []
    reply_ids = [int(row.get("reply_to_id") or 0) for row in rows if row.get("reply_to_id")]
    reply_map: dict[int, dict] = {}
    if reply_ids:
        cur.execute(
            "SELECT id, sender, message, type, media_url, deleted FROM messages WHERE id = ANY(%s)",
            (reply_ids,),
        )
        reply_map = {int(row.get("id") or 0): _reply_preview(row) for row in cur.fetchall() or []}
    reaction_map = _reaction_state(cur, [int(row.get("id") or 0) for row in rows], username=username)
    return [_serialize_message(row, reply_map=reply_map, reaction_map=reaction_map) for row in rows]



def _spam_lock_message(row: dict | None) -> str | None:
    if not row or not row.get("muted_until"):
        return None
    return f"تم تقييد إرسال الرسائل مؤقتاً حتى {str(row.get('muted_until')).replace('T', ' ')[:16]} بسبب محاولات مزعجة"



def _current_spam_lock(cur, username: str) -> dict | None:
    cur.execute(
        "SELECT username, strike_count, muted_until, reason, updated_at FROM chat_spam_locks WHERE username=%s LIMIT 1",
        (username,),
    )
    row = cur.fetchone() or {}
    if row.get("muted_until"):
        cur.execute("SELECT NOW() < %s AS active", (row.get("muted_until"),))
        active = bool((cur.fetchone() or {}).get("active"))
        if active:
            return row
    return None



def _register_spam_lock(cur, username: str, reason: str) -> dict:
    cur.execute(
        "SELECT strike_count, updated_at FROM chat_spam_locks WHERE username=%s LIMIT 1",
        (username,),
    )
    row = cur.fetchone() or {}
    strike_count = int(row.get("strike_count") or 0)
    recent = False
    if row.get("updated_at"):
        cur.execute("SELECT %s > NOW() - INTERVAL '30 minutes' AS recent", (row.get("updated_at"),))
        recent = bool((cur.fetchone() or {}).get("recent"))
    strike_count = (strike_count + 1) if recent else 1
    mute_minutes = 1 if strike_count == 1 else 5 if strike_count == 2 else 15
    cur.execute(
        """
        INSERT INTO chat_spam_locks(username, strike_count, muted_until, reason, created_at, updated_at)
        VALUES(%s,%s,NOW() + (%s || ' minutes')::interval,%s,NOW(),NOW())
        ON CONFLICT (username)
        DO UPDATE SET
            strike_count=EXCLUDED.strike_count,
            muted_until=EXCLUDED.muted_until,
            reason=EXCLUDED.reason,
            updated_at=NOW()
        RETURNING username, strike_count, muted_until, reason, updated_at
        """,
        (username, strike_count, str(mute_minutes), reason),
    )
    return cur.fetchone() or {}



def _detect_spam(cur, sender: str, receiver: str, message: str, media_url: str = "") -> str | None:
    lowered = str(message or "").strip().lower()
    if lowered and any(word in lowered for word in BANNED_WORDS):
        return "تم حظر الرسالة لمخالفة سياسة المحتوى"
    if re.search(r"(.)\1{10,}", lowered):
        return "تم رفض الرسالة لأنها تبدو مزعجة"
    if len(URL_RE.findall(lowered)) >= 3:
        return "لا يمكن إرسال هذا العدد من الروابط في رسالة واحدة"
    if lowered and sum(1 for ch in lowered if ch in "!؟?.") >= 20:
        return "الرسالة تبدو مزعجة بشكل مبالغ فيه"

    cur.execute(
        """
        SELECT COUNT(*) AS total
        FROM messages
        WHERE sender=%s
          AND receiver=%s
          AND created_at > NOW() - INTERVAL '8 seconds'
        """,
        (sender, receiver),
    )
    burst_pair = int((cur.fetchone() or {}).get("total") or 0)
    if burst_pair >= 4:
        return "تم اكتشاف إرسال سريع جداً لنفس المستخدم"

    cur.execute(
        """
        SELECT COUNT(*) AS total
        FROM messages
        WHERE sender=%s
          AND created_at > NOW() - INTERVAL '1 minute'
        """,
        (sender,),
    )
    global_burst = int((cur.fetchone() or {}).get("total") or 0)
    if global_burst >= 20:
        return "تجاوزت الحد المسموح للرسائل خلال الدقيقة الأخيرة"

    if lowered:
        cur.execute(
            """
            SELECT COUNT(*) AS total
            FROM messages
            WHERE sender=%s
              AND receiver=%s
              AND lower(message)=lower(%s)
              AND created_at > NOW() - INTERVAL '2 minutes'
            """,
            (sender, receiver, lowered),
        )
        duplicate_count = int((cur.fetchone() or {}).get("total") or 0)
        if duplicate_count >= 1:
            return "تم رفض الرسالة المكررة لتقليل السبام"
    elif media_url:
        cur.execute(
            """
            SELECT COUNT(*) AS total
            FROM messages
            WHERE sender=%s
              AND receiver=%s
              AND COALESCE(media_url,'')=%s
              AND created_at > NOW() - INTERVAL '5 minutes'
            """,
            (sender, receiver, media_url),
        )
        media_dup = int((cur.fetchone() or {}).get("total") or 0)
        if media_dup >= 1:
            return "تم رفض الملف المكرر لتقليل السبام"
    return None



def _parse_positive_int(value) -> int:
    try:
        parsed = int(value)
        return parsed if parsed > 0 else 0
    except Exception:
        return 0



def _message_event_payload(message_ids: list[int], sender: str, viewer: str, status: str) -> dict:
    return {"sender": sender, "viewer": viewer, "status": status, "message_ids": message_ids}



def _reaction_payload(cur, message_id: int, username: str | None = None) -> dict:
    state = _reaction_state(cur, [message_id], username=username).get(message_id, {"items": [], "my_reaction": None})
    return {
        "message_id": message_id,
        "reactions": state.get("items") or [],
        "my_reaction": state.get("my_reaction"),
    }


@chat_bp.post("/send_message")
@require_auth
@rate_limit(120, 60)
def send_message():
    _ensure_chat_tables()
    data = request.get_json(silent=True) or {}
    sender = current_user() or ""
    receiver = normalize_text(data.get("receiver") or data.get("receiver_id"), 80)
    message = normalize_text(data.get("message") or data.get("content"), 8000)
    media_url = normalize_text(data.get("media_url"), 2000)
    client_id = _normalize_client_id(data.get("client_id"))
    msg_type = _normalize_message_type(data.get("type") or "text", media_url)
    reply_to_id = _parse_positive_int(data.get("reply_to_id"))

    if not receiver:
        return json_error("المستلم مطلوب", 400)
    if sender == receiver:
        return json_error("لا يمكن إرسال رسالة إلى نفسك", 400)
    if not message and not media_url:
        return json_error("الرسالة فارغة", 400)
    if msg_type == "text" and not message and media_url:
        msg_type = _normalize_message_type("file", media_url)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id FROM users WHERE name=%s LIMIT 1", (receiver,))
        if not cur.fetchone():
            return json_error("المستخدم غير موجود", 404)
        if _is_blocked(cur, sender, receiver):
            return json_error("لا يمكن إرسال الرسائل لهذا المستخدم", 403)

        lock_row = _current_spam_lock(cur, sender)
        if lock_row:
            return json_error(_spam_lock_message(lock_row) or "تم تقييد الرسائل مؤقتاً", 429)

        moderation_error = enforce_moderation(cur, sender, "chat")
        if moderation_error:
            log_audit(cur, action="message_denied", actor=sender, target_type="user", target_value=receiver, details=moderation_error, severity="warning")
            return json_error(moderation_error, 403)

        moderation_error = _detect_spam(cur, sender, receiver, message, media_url)
        if moderation_error:
            cur.execute('INSERT INTO analytics("user", event) VALUES(%s,%s)', (sender, f"chat_blocked:{receiver}"))
            auto_action = record_spam_violation(cur, sender, {"receiver": receiver, "message_type": msg_type}, moderation_error)
            lock_info = _register_spam_lock(cur, sender, moderation_error)
            if auto_action:
                moderation_error = f"{moderation_error} — تم تفعيل {auto_action['auto_action']} تلقائي لمدة {auto_action['duration_minutes']} دقيقة"
            elif lock_info.get("muted_until"):
                moderation_error = f"{moderation_error} — تم إيقاف الإرسال مؤقتاً حتى {str(lock_info.get('muted_until')).replace('T', ' ')[:16]}"
            return json_error(moderation_error, 429)

        if client_id:
            cur.execute(
                """
                SELECT id, client_id, sender, receiver, message, type, media_url, deleted, status,
                       reply_to_id, delivered_at, seen_at, created_at
                FROM messages
                WHERE sender=%s AND client_id=%s
                LIMIT 1
                """,
                (sender, client_id),
            )
            duplicate = cur.fetchone()
            if duplicate:
                payload = _hydrate_messages(cur, [duplicate], username=sender)[0]
                return jsonify({"ok": True, "duplicate": True, "message": "تمت مزامنة الرسالة مسبقاً", "data": payload, **payload})

        if reply_to_id:
            cur.execute(
                "SELECT id, sender, receiver FROM messages WHERE id=%s LIMIT 1",
                (reply_to_id,),
            )
            reply_row = cur.fetchone()
            if not reply_row:
                return json_error("الرسالة المراد الرد عليها غير موجودة", 404)
            participants = {reply_row.get("sender"), reply_row.get("receiver")}
            if participants != {sender, receiver}:
                return json_error("لا يمكن الرد على رسالة خارج هذه المحادثة", 403)

        cur.execute(
            """
            INSERT INTO messages(
                sender, receiver, message, type, media_url, deleted, status,
                client_id, reply_to_id, delivered_at, seen_at
            )
            VALUES(%s,%s,%s,%s,%s,FALSE,'sent',%s,%s,NULL,NULL)
            RETURNING id, client_id, sender, receiver, message, type, media_url, deleted, status,
                      reply_to_id, delivered_at, seen_at, created_at
            """,
            (sender, receiver, message, msg_type, media_url or None, client_id or None, reply_to_id or None),
        )
        row = cur.fetchone() or {}

        note_title = "رسالة جديدة"
        note_body = f"{sender} أرسل لك رسالة جديدة"
        if msg_type == "voice":
            note_body = f"{sender} أرسل لك رسالة صوتية"
        elif msg_type == "image":
            note_body = f"{sender} أرسل لك صورة"
        elif msg_type == "video":
            note_body = f"{sender} أرسل لك فيديو"
        elif msg_type == "call":
            note_title = "اتصال جديد"
            note_body = f"{sender} بدأ اتصال {normalize_text(data.get('call_type'), 20) or 'صوتي/فيديو'}"

        cur.execute(
            "INSERT INTO notifications(username,text,message,seen,is_read) VALUES(%s,%s,%s,FALSE,FALSE)",
            (receiver, note_body, note_body),
        )
        cur.execute('INSERT INTO analytics("user", event) VALUES(%s,%s)', (sender, f"chat_send:{msg_type}"))
        log_audit(cur, action="message_sent", actor=sender, target_type="user", target_value=receiver, details=f"type={msg_type}")
        _set_user_online(cur, sender, True)
        payload = _hydrate_messages(cur, [row], username=sender)[0]
        payload["notification_title"] = note_title
        payload["notification_body"] = note_body
        send_push_to_user(
            cur,
            receiver,
            note_title,
            note_body,
            {
                "type": msg_type,
                "sender": sender,
                "receiver": receiver,
                "screen": "chat",
                "message_id": payload.get("id"),
                "client_id": payload.get("client_id"),
            },
        )

    try:
        socketio.emit("new_private_message", payload, room=_chat_room(sender, receiver))
        socketio.emit("presence_update", {"user": sender, "is_online": True}, room=_chat_room(sender, receiver))
    except Exception:
        pass

    return jsonify({"ok": True, "message": "تم إرسال الرسالة", "data": payload, **payload})


@chat_bp.post("/delete_message")
@require_auth
@rate_limit(60, 60)
def delete_message():
    _ensure_chat_tables()
    username = current_user() or ""
    message_id = _parse_positive_int((request.get_json(silent=True) or {}).get("message_id"))
    if not message_id:
        return json_error("معرّف الرسالة غير صالح", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            "SELECT id, sender, receiver FROM messages WHERE id=%s LIMIT 1",
            (message_id,),
        )
        row = cur.fetchone()
        if not row:
            return json_error("الرسالة غير موجودة", 404)
        if row.get("sender") != username:
            return json_error("غير مسموح لك بحذف هذه الرسالة", 403)
        cur.execute(
            "UPDATE messages SET deleted=TRUE, message='', media_url=NULL, status='deleted' WHERE id=%s",
            (message_id,),
        )
        cur.execute('INSERT INTO analytics("user", event) VALUES(%s,%s)', (username, "chat_delete"))
        log_audit(cur, action="message_deleted", actor=username, target_type="message", target_value=str(message_id), details=f"receiver={row.get('receiver')}")
        payload = {
            "id": message_id,
            "sender": row.get("sender"),
            "receiver": row.get("receiver"),
            "deleted": True,
            "status": "deleted",
            "message": "تم حذف هذه الرسالة",
            "content": "تم حذف هذه الرسالة",
        }

    try:
        socketio.emit("message_deleted", payload, room=_chat_room(row.get("sender") or "", row.get("receiver") or ""))
    except Exception:
        pass

    return jsonify({"ok": True, "message": "تم حذف الرسالة للجميع", **payload})


@chat_bp.post("/message_seen")
@require_auth
def message_seen():
    _ensure_chat_tables()
    viewer = current_user() or ""
    sender = normalize_text((request.get_json(silent=True) or {}).get("sender"), 80)
    if not sender:
        return json_error("المرسل مطلوب", 400)
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            """
            UPDATE messages
            SET status='seen',
                delivered_at=COALESCE(delivered_at, NOW()),
                seen_at=COALESCE(seen_at, NOW())
            WHERE sender=%s AND receiver=%s AND deleted=FALSE AND status <> 'seen'
            RETURNING id
            """,
            (sender, viewer),
        )
        rows = cur.fetchall() or []
        ids = [int(row.get("id") or 0) for row in rows if row.get("id")]
        _set_user_online(cur, viewer, True)
    try:
        socketio.emit("messages_seen", _message_event_payload(ids, sender, viewer, "seen"), room=_chat_room(sender, viewer))
    except Exception:
        pass
    return jsonify({"ok": True, "status": "seen", "message_ids": ids})


@chat_bp.post("/typing")
@require_auth
def typing_status():
    _ensure_chat_tables()
    data = request.get_json(silent=True) or {}
    sender = current_user() or ""
    receiver = normalize_text(data.get("receiver"), 80)
    is_typing = bool(data.get("is_typing"))
    if not receiver:
        return json_error("المستلم مطلوب", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            """
            INSERT INTO typing_status(sender, receiver, is_typing, updated_at)
            VALUES(%s,%s,%s,NOW())
            ON CONFLICT (sender, receiver)
            DO UPDATE SET is_typing=EXCLUDED.is_typing, updated_at=NOW()
            """,
            (sender, receiver, is_typing),
        )
        _set_user_online(cur, sender, True)

    payload = {"sender": sender, "receiver": receiver, "is_typing": is_typing}
    try:
        socketio.emit("typing_update", payload, room=_chat_room(sender, receiver))
    except Exception:
        pass
    return jsonify({"ok": True, **payload})


@chat_bp.post("/message_reaction")
@require_auth
@rate_limit(180, 60)
def message_reaction():
    _ensure_chat_tables()
    username = current_user() or ""
    data = request.get_json(silent=True) or {}
    message_id = _parse_positive_int(data.get("message_id"))
    emoji = _normalize_reaction(data.get("emoji"))
    if not message_id:
        return json_error("معرّف الرسالة غير صالح", 400)
    if not emoji:
        return json_error("الرمز التفاعلي غير مدعوم", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            "SELECT id, sender, receiver, deleted FROM messages WHERE id=%s LIMIT 1",
            (message_id,),
        )
        message_row = cur.fetchone()
        if not message_row:
            return json_error("الرسالة غير موجودة", 404)
        if username not in {message_row.get("sender"), message_row.get("receiver")}:
            return json_error("غير مصرح لك بالتفاعل مع هذه الرسالة", 403)
        if bool(message_row.get("deleted")):
            return json_error("لا يمكن التفاعل مع رسالة محذوفة", 400)

        cur.execute(
            "SELECT id, emoji FROM message_reactions WHERE message_id=%s AND username=%s LIMIT 1",
            (message_id, username),
        )
        existing = cur.fetchone() or {}
        action = "added"
        if existing and existing.get("emoji") == emoji:
            cur.execute("DELETE FROM message_reactions WHERE id=%s", (existing.get("id"),))
            action = "removed"
        elif existing:
            cur.execute("UPDATE message_reactions SET emoji=%s, created_at=NOW() WHERE id=%s", (emoji, existing.get("id")))
            action = "updated"
        else:
            cur.execute(
                "INSERT INTO message_reactions(message_id, username, emoji) VALUES(%s,%s,%s)",
                (message_id, username, emoji),
            )
        cur.execute('INSERT INTO analytics("user", event) VALUES(%s,%s)', (username, f"chat_reaction:{action}"))
        payload = _reaction_payload(cur, message_id, username=username) | {
            "ok": True,
            "action": action,
            "sender": message_row.get("sender"),
            "receiver": message_row.get("receiver"),
        }

    try:
        socketio.emit("message_reaction_update", payload, room=_chat_room(payload.get("sender") or "", payload.get("receiver") or ""))
    except Exception:
        pass
    return jsonify(payload)


@chat_bp.get("/get_messages")
@chat_bp.get("/messages")
@require_auth
def get_messages():
    _ensure_chat_tables()
    username = current_user() or ""
    receiver = normalize_text(request.args.get("receiver"), 80)
    limit = min(max(_parse_positive_int(request.args.get("limit") or 30), 1), 100)
    before_id = _parse_positive_int(request.args.get("before_id"))
    paginated = str(request.args.get("paginated") or "").lower() in {"1", "true", "yes"}
    if not receiver:
        return jsonify({"items": [], "meta": {"has_more": False, "next_before_id": None, "limit": limit}} if paginated else [])

    with db_cursor(commit=True) as (_conn, cur):
        if before_id:
            cur.execute(
                """
                SELECT id, client_id, sender, receiver, message, type, media_url, deleted, status,
                       reply_to_id, delivered_at, seen_at, created_at
                FROM messages
                WHERE ((sender=%s AND receiver=%s) OR (sender=%s AND receiver=%s))
                  AND id < %s
                ORDER BY id DESC
                LIMIT %s
                """,
                (username, receiver, receiver, username, before_id, limit + 1),
            )
        else:
            cur.execute(
                """
                SELECT id, client_id, sender, receiver, message, type, media_url, deleted, status,
                       reply_to_id, delivered_at, seen_at, created_at
                FROM messages
                WHERE (sender=%s AND receiver=%s)
                   OR (sender=%s AND receiver=%s)
                ORDER BY id DESC
                LIMIT %s
                """,
                (username, receiver, receiver, username, limit + 1),
            )
        rows = cur.fetchall() or []
        has_more = len(rows) > limit
        rows = rows[:limit]
        rows.reverse()

        cur.execute(
            """
            UPDATE messages
            SET status='delivered', delivered_at=COALESCE(delivered_at, NOW())
            WHERE sender=%s AND receiver=%s AND status='sent' AND deleted=FALSE
            RETURNING id
            """,
            (receiver, username),
        )
        delivered_rows = cur.fetchall() or []
        delivered_ids = [int(row.get("id") or 0) for row in delivered_rows if row.get("id")]
        _set_user_online(cur, username, True)
        serialized = _hydrate_messages(cur, rows, username=username)

    if delivered_ids:
        try:
            socketio.emit("messages_delivered", _message_event_payload(delivered_ids, receiver, username, "delivered"), room=_chat_room(username, receiver))
        except Exception:
            pass

    if paginated:
        oldest_id = serialized[0]["id"] if serialized else None
        return jsonify({
            "items": serialized,
            "meta": {
                "has_more": has_more,
                "next_before_id": oldest_id if has_more else None,
                "limit": limit,
            },
        })
    return jsonify(serialized)


@chat_bp.get("/chat_threads")
@require_auth
def chat_threads():
    username = current_user() or ""
    with db_cursor() as (_conn, cur):
        cur.execute(
            """
            SELECT DISTINCT CASE WHEN sender=%s THEN receiver ELSE sender END AS name
            FROM messages
            WHERE sender=%s OR receiver=%s
            ORDER BY name ASC
            """,
            (username, username, username),
        )
        rows = [row for row in cur.fetchall() if row.get("name")]
    return jsonify(rows)


@chat_bp.post("/update_online")
@require_auth
def update_online():
    _ensure_chat_tables()
    username = current_user() or ""
    online = bool((request.get_json(silent=True) or {}).get("online", True))
    with db_cursor(commit=True) as (_conn, cur):
        _set_user_online(cur, username, online)
        payload = _presence_payload(cur, username)
    try:
        socketio.emit("presence_update", payload, broadcast=True)
    except Exception:
        pass
    return jsonify({"ok": True, **payload})


@chat_bp.get("/presence/<username>")
def user_presence(username: str):
    _ensure_chat_tables()
    safe_username = normalize_text(username, 80)
    with db_cursor() as (_conn, cur):
        cur.execute(
            "SELECT name FROM users WHERE name=%s LIMIT 1",
            (safe_username,),
        )
        if not cur.fetchone():
            return json_error("المستخدم غير موجود", 404)
        payload = _presence_payload(cur, safe_username)
    return jsonify(payload)


@chat_bp.post("/save_device_token")
@require_auth
def save_device_token():
    _ensure_chat_tables()
    username = current_user() or ""
    data = request.get_json(silent=True) or {}
    token = normalize_text(data.get("token"), 500)
    platform = normalize_text(data.get("platform"), 40) or "android"
    app_version = normalize_text(data.get("app_version"), 50)
    if not token:
        return json_error("رمز الجهاز غير صالح", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("UPDATE users SET fcm_token=%s, last_seen=NOW() WHERE name=%s", (token, username))
        store_user_device_token(cur, username, token, platform=platform, app_version=app_version)
        cur.execute('INSERT INTO analytics("user", event) VALUES(%s,%s)', (username, f"device_token:{platform}"))
    return jsonify({"ok": True, "message": "تم حفظ رمز الجهاز"})


@chat_bp.post("/track")
@require_auth
def track_event():
    _ensure_chat_tables()
    username = current_user() or ""
    event = normalize_text((request.get_json(silent=True) or {}).get("event"), 120)
    if not event:
        return jsonify({"ok": True, "message": "لا يوجد حدث للتسجيل"})
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute('INSERT INTO analytics("user", event) VALUES(%s,%s)', (username, event))
        _set_user_online(cur, username, True)
    return jsonify({"ok": True, "message": "تم تسجيل الحدث"})


@chat_bp.post("/create_call_token")
@require_auth
@rate_limit(30, 60)
def create_call_token_route():
    _ensure_chat_tables()
    username = current_user() or ""
    data = request.get_json(silent=True) or {}
    receiver = normalize_text(data.get("receiver") or data.get("peer") or data.get("username"), 80)
    call_type = normalize_text(data.get("call_type"), 20).lower() or "video"
    if call_type not in {"audio", "video"}:
        call_type = "video"
    if not receiver:
        return json_error("المستخدم المطلوب للاتصال غير محدد", 400)
    if receiver == username:
        return json_error("لا يمكنك إنشاء مكالمة مع نفسك", 400)

    room_name = normalize_text(data.get("room_name"), 120) or _call_room(username, receiver)
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id FROM users WHERE name=%s LIMIT 1", (receiver,))
        if not cur.fetchone():
            return json_error("المستخدم غير موجود", 404)
        if _is_blocked(cur, username, receiver):
            return json_error("لا يمكن بدء مكالمة مع هذا المستخدم", 403)
        _set_user_online(cur, username, True)
        note = f"📞 مكالمة واردة من {username}"
        cur.execute(
            "INSERT INTO notifications(username,text,message,seen,is_read) VALUES(%s,%s,%s,FALSE,FALSE)",
            (receiver, note, note),
        )
        send_push_to_user(
            cur,
            receiver,
            "مكالمة واردة",
            f"اتصال {('صوتي' if call_type == 'audio' else 'فيديو')} جديد من {username}",
            {
                "type": "call",
                "call_type": call_type,
                "sender": username,
                "receiver": receiver,
                "room_name": room_name,
                "screen": "call",
            },
        )
        cur.execute('INSERT INTO analytics("user", event) VALUES(%s,%s)', (username, f"call_create:{call_type}"))

    try:
        token = create_token(room_name, username, can_publish=True)
    except RuntimeError as exc:
        return json_error(str(exc), 503)

    payload = {
        "ok": True,
        "message": "تم إنشاء توكن المكالمة",
        "room_name": room_name,
        "receiver": receiver,
        "call_type": call_type,
        "livekit_url": _livekit_ws_url(),
        "token": token,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        socketio.emit("incoming_call", payload | {"sender": username}, room=_chat_room(username, receiver))
    except Exception:
        pass
    return jsonify(payload)


@socketio.on("join_chat")
def join_chat_event(data):
    data = data or {}
    token = normalize_text(data.get("token"), 4096)
    identity = decode_token(token) if token else None
    user = normalize_text((identity or {}).get("user") or data.get("user") or current_user(), 80)
    peer = normalize_text(data.get("peer") or data.get("receiver"), 80)
    if not user or not peer:
        emit("socket_error", {"message": "user and peer are required"}, to=request.sid)
        return

    room = _chat_room(user, peer)
    SOCKET_USERS[request.sid] = user
    join_room(room)

    with db_cursor(commit=True) as (_conn, cur):
        _set_user_online(cur, user, True)
        payload = _presence_payload(cur, user)

    emit("chat_joined", {"room": room, "user": user, "peer": peer}, to=request.sid)
    socketio.emit("presence_update", payload, room=room)


@socketio.on("leave_chat")
def leave_chat_event(data):
    data = data or {}
    user = normalize_text(data.get("user") or SOCKET_USERS.get(request.sid), 80)
    peer = normalize_text(data.get("peer") or data.get("receiver"), 80)
    if user and peer:
        leave_room(_chat_room(user, peer))
    emit("chat_left", {"user": user, "peer": peer}, to=request.sid)


@socketio.on("chat_presence")
def chat_presence_event(data):
    data = data or {}
    user = normalize_text(data.get("user") or SOCKET_USERS.get(request.sid), 80)
    peer = normalize_text(data.get("peer") or data.get("receiver"), 80)
    online = bool(data.get("online", True))
    if not user:
        return
    room = _chat_room(user, peer) if peer else None
    with db_cursor(commit=True) as (_conn, cur):
        _set_user_online(cur, user, online)
        payload = _presence_payload(cur, user)
    if room:
        socketio.emit("presence_update", payload, room=room)
    else:
        socketio.emit("presence_update", payload, broadcast=True)


@socketio.on("chat_typing")
def chat_typing_event(data):
    data = data or {}
    sender = normalize_text(data.get("sender") or SOCKET_USERS.get(request.sid), 80)
    receiver = normalize_text(data.get("receiver") or data.get("peer"), 80)
    is_typing = bool(data.get("is_typing"))
    if not sender or not receiver:
        return
    payload = {"sender": sender, "receiver": receiver, "is_typing": is_typing}
    socketio.emit("typing_update", payload, room=_chat_room(sender, receiver))
