from __future__ import annotations

import logging

from flask import request
from flask_socketio import SocketIO, emit, join_room

from admin_utils import enforce_moderation, log_audit
from config import Config
from db import db_cursor
from utils import clean

logger = logging.getLogger(__name__)


def _select_async_mode() -> str:
    try:
        import eventlet.green.threading  # noqa: F401
        return "eventlet"
    except Exception as exc:  # pragma: no cover - compatibility fallback
        logger.warning("eventlet unavailable, falling back to threading async mode: %s", exc)
        return "threading"


_SOCKET_FALLBACK_ORIGINS = [origin for origin in (Config.ALLOWED_ORIGINS or []) if origin]
if not _SOCKET_FALLBACK_ORIGINS or all(
    any(token in origin for token in ["localhost", "127.0.0.1", "capacitor://", "ionic://"])
    for origin in _SOCKET_FALLBACK_ORIGINS
):
    _ALLOWED_SOCKET_ORIGINS = "*"
else:
    _ALLOWED_SOCKET_ORIGINS = _SOCKET_FALLBACK_ORIGINS

socketio = SocketIO(cors_allowed_origins=_ALLOWED_SOCKET_ORIGINS, async_mode=_select_async_mode())


GIFT_VALUES = {
    "🌹": 10,
    "💎": 100,
    "👑": 500,
}


def room_channel(room_id) -> str:
    return f"live:{room_id}"


def user_channel(username: str) -> str:
    return f"user:{username}"


def _active_host_socket_ids(cur, room_id) -> list[str]:
    cur.execute(
        """
        SELECT socket_id
        FROM live_viewers
        WHERE room_id=%s
          AND is_host=TRUE
          AND active=TRUE
          AND socket_id IS NOT NULL
          AND socket_id<>''
          AND last_seen > NOW() - INTERVAL '90 seconds'
        ORDER BY id ASC
        """,
        (room_id,),
    )
    return [str(row.get("socket_id") or "").strip() for row in (cur.fetchall() or []) if str(row.get("socket_id") or "").strip()]


def init_socket(app):
    socketio.init_app(app, cors_allowed_origins=_ALLOWED_SOCKET_ORIGINS)


@socketio.on("register_user")
def register_user(data):
    username = clean((data or {}).get("user") or (data or {}).get("username") or "")
    if not username:
        return
    join_room(user_channel(username))
    emit("user_registered", {"user": username}, to=request.sid)


@socketio.on("like_post")
def like_post_event(data):
    payload = data or {}
    username = clean(payload.get("user") or payload.get("username") or "")
    post_id = int(payload.get("post_id") or payload.get("postId") or 0)
    if not username or not post_id:
        emit("socket_error", {"message": "بيانات الإعجاب غير مكتملة"}, to=request.sid)
        return

    with db_cursor(commit=True) as (_conn, cur):
        moderation_error = enforce_moderation(cur, username, "social")
        if moderation_error:
            emit("socket_error", {"message": moderation_error}, to=request.sid)
            return

        cur.execute("SELECT id, username FROM posts WHERE id=%s LIMIT 1", (post_id,))
        post = cur.fetchone()
        if not post:
            emit("socket_error", {"message": "المنشور غير موجود"}, to=request.sid)
            return

        cur.execute("SELECT id FROM post_likes WHERE post_id=%s AND username=%s LIMIT 1", (post_id, username))
        existing = cur.fetchone()
        if existing:
            cur.execute("DELETE FROM post_likes WHERE post_id=%s AND username=%s", (post_id, username))
            cur.execute("UPDATE posts SET likes = GREATEST(COALESCE(likes, 0) - 1, 0) WHERE id=%s", (post_id,))
            liked = False
        else:
            cur.execute("INSERT INTO post_likes(post_id, username) VALUES(%s, %s)", (post_id, username))
            cur.execute("UPDATE posts SET likes = COALESCE(likes, 0) + 1 WHERE id=%s", (post_id,))
            liked = True
            if post["username"] != username:
                note = f"❤️ {username} أعجب بمنشورك"
                cur.execute(
                    """
                    INSERT INTO notifications(username,text,message,seen,is_read)
                    VALUES(%s,%s,%s,FALSE,FALSE)
                    RETURNING id, message, text, seen, created_at
                    """,
                    (post["username"], note, note),
                )
                notification = cur.fetchone()
                if notification:
                    socketio.emit(
                        "new_notification",
                        {
                            "id": notification["id"],
                            "message": notification.get("message") or notification.get("text") or note,
                            "text": notification.get("text") or notification.get("message") or note,
                            "seen": bool(notification.get("seen")),
                            "created_at": notification.get("created_at"),
                        },
                        room=user_channel(post["username"]),
                    )

        cur.execute("SELECT likes FROM posts WHERE id=%s", (post_id,))
        likes_row = cur.fetchone() or {"likes": 0}

    socketio.emit(
        "post_liked",
        {
            "post_id": post_id,
            "likes": int(likes_row.get("likes") or 0),
            "liked": liked,
            "username": username,
        },
    )


@socketio.on("add_comment")
def add_comment_event(data):
    payload = data or {}
    username = clean(payload.get("user") or payload.get("username") or "")
    post_id = int(payload.get("post_id") or payload.get("postId") or 0)
    text = clean(payload.get("text") or payload.get("comment") or "")
    if not username or not post_id or not text:
        emit("socket_error", {"message": "بيانات التعليق غير مكتملة"}, to=request.sid)
        return

    with db_cursor(commit=True) as (_conn, cur):
        moderation_error = enforce_moderation(cur, username, "social")
        if moderation_error:
            emit("socket_error", {"message": moderation_error}, to=request.sid)
            return

        cur.execute("SELECT id, username FROM posts WHERE id=%s LIMIT 1", (post_id,))
        post = cur.fetchone()
        if not post:
            emit("socket_error", {"message": "المنشور غير موجود"}, to=request.sid)
            return

        cur.execute(
            """
            INSERT INTO comments(post_id, username, comment)
            VALUES(%s, %s, %s)
            RETURNING id, post_id, username, comment, created_at
            """,
            (post_id, username, text),
        )
        comment = cur.fetchone()

        if post["username"] != username:
            note = f"💬 {username} علّق على منشورك"
            cur.execute(
                """
                INSERT INTO notifications(username,text,message,seen,is_read)
                VALUES(%s,%s,%s,FALSE,FALSE)
                RETURNING id, message, text, seen, created_at
                """,
                (post["username"], note, note),
            )
            notification = cur.fetchone()
            if notification:
                socketio.emit(
                    "new_notification",
                    {
                        "id": notification["id"],
                        "message": notification.get("message") or notification.get("text") or note,
                        "text": notification.get("text") or notification.get("message") or note,
                        "seen": bool(notification.get("seen")),
                        "created_at": notification.get("created_at"),
                    },
                    room=user_channel(post["username"]),
                )

    socketio.emit("comment_added", {"post_id": post_id, "comment": comment})


@socketio.on("follow_user")
def follow_user_event(data):
    payload = data or {}
    username = clean(payload.get("user") or payload.get("username") or payload.get("current_user") or "")
    target_username = clean(payload.get("target_username") or payload.get("following") or payload.get("to_user") or "")
    if not username or not target_username:
        emit("socket_error", {"message": "بيانات المتابعة غير مكتملة"}, to=request.sid)
        return
    if username == target_username:
        emit("socket_error", {"message": "لا يمكنك متابعة نفسك"}, to=request.sid)
        return

    with db_cursor(commit=True) as (_conn, cur):
        moderation_error = enforce_moderation(cur, username, "social")
        if moderation_error:
            emit("socket_error", {"message": moderation_error}, to=request.sid)
            return

        cur.execute("SELECT id FROM users WHERE name=%s LIMIT 1", (target_username,))
        if not cur.fetchone():
            emit("socket_error", {"message": "المستخدم غير موجود"}, to=request.sid)
            return

        cur.execute("SELECT id FROM followers WHERE follower=%s AND following=%s LIMIT 1", (username, target_username))
        existing = cur.fetchone()
        if existing:
            cur.execute("DELETE FROM followers WHERE follower=%s AND following=%s", (username, target_username))
            following = False
            message = "تم إلغاء المتابعة"
        else:
            cur.execute("INSERT INTO followers(follower, following) VALUES(%s, %s)", (username, target_username))
            following = True
            message = "تمت المتابعة"
            note = f"{username} started following you"
            cur.execute(
                """
                INSERT INTO notifications(username,text,message,seen,is_read)
                VALUES(%s,%s,%s,FALSE,FALSE)
                RETURNING id, message, text, seen, created_at
                """,
                (target_username, note, note),
            )
            notification = cur.fetchone()
            if notification:
                socketio.emit(
                    "new_notification",
                    {
                        "id": notification["id"],
                        "message": notification.get("message") or notification.get("text") or note,
                        "text": notification.get("text") or notification.get("message") or note,
                        "seen": bool(notification.get("seen")),
                        "created_at": notification.get("created_at"),
                    },
                    room=user_channel(target_username),
                )

        cur.execute("SELECT COUNT(*) AS total FROM followers WHERE following=%s", (target_username,))
        followers_count = int((cur.fetchone() or {}).get("total") or 0)
        cur.execute("SELECT COUNT(*) AS total FROM followers WHERE follower=%s", (target_username,))
        following_count = int((cur.fetchone() or {}).get("total") or 0)
        log_audit(cur, action="follow_toggle_socket", actor=username, target_type="user", target_value=target_username, details=message)

    socketio.emit(
        "user_follow_update",
        {
            "username": username,
            "target_username": target_username,
            "following": following,
            "followers_count": followers_count,
            "following_count": following_count,
        },
    )


@socketio.on("join_live")
def join_live_event(data):
    room_id = str(data.get("room_id") or "").strip()
    if not room_id:
        emit("socket_error", {"message": "room_id is required"})
        return

    username = clean(data.get("user") or "Guest") or "Guest"
    platform = clean(data.get("platform") or "web") or "web"
    role = clean(data.get("role") or "viewer") or "viewer"
    device_type = clean(data.get("device_type") or "browser") or "browser"

    join_room(room_channel(room_id))

    with db_cursor(commit=True) as (_conn, cur):
        moderation_error = enforce_moderation(cur, username, "live")
        if moderation_error and username != "Guest":
            emit("socket_error", {"message": moderation_error}, to=request.sid)
            return
        cur.execute("SELECT id FROM users WHERE name=%s LIMIT 1", (username,))
        user = cur.fetchone()
        cur.execute("SELECT id FROM live_rooms WHERE id=%s LIMIT 1", (room_id,))
        if cur.fetchone():
            cur.execute(
                "SELECT id FROM live_viewers WHERE room_id=%s AND username=%s LIMIT 1",
                (room_id, username),
            )
            existing = cur.fetchone()
            if existing:
                cur.execute(
                    """
                    UPDATE live_viewers
                    SET user_id=%s, socket_id=%s, platform=%s, device_type=%s, is_host=%s, active=TRUE, last_seen=NOW()
                    WHERE id=%s
                    """,
                    (user["id"] if user else None, request.sid, platform, device_type, role == "host", existing["id"]),
                )
            else:
                cur.execute(
                    """
                    INSERT INTO live_viewers(room_id, user_id, username, socket_id, platform, device_type, is_host, active)
                    VALUES(%s,%s,%s,%s,%s,%s,%s,TRUE)
                    """,
                    (room_id, user["id"] if user else None, username, request.sid, platform, device_type, role == "host"),
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
        else:
            total = 0

    emit("joined_live", {"room_id": room_id, "socket_id": request.sid}, room=room_channel(room_id))
    emit("room_stats", {"room_id": room_id, "viewer_count": total}, room=room_channel(room_id))

    if role != "host":
        with db_cursor() as (_conn, cur):
            for host_socket_id in _active_host_socket_ids(cur, room_id):
                if host_socket_id != request.sid:
                    emit(
                        "viewer_joined",
                        {"room_id": room_id, "viewer_socket_id": request.sid, "viewer": username},
                        to=host_socket_id,
                    )


@socketio.on("send_comment")
def send_comment(data):
    room_id = str(data.get("room_id") or "").strip()
    user = clean(data.get("user") or "Guest") or "Guest"
    text = clean(data.get("text") or "")
    if not room_id or not text:
        return

    payload = {"room_id": room_id, "user": user, "text": text}
    with db_cursor(commit=True) as (_conn, cur):
        moderation_error = enforce_moderation(cur, user, "live_comment")
        if moderation_error and user != "Guest":
            emit("socket_error", {"message": moderation_error}, to=request.sid)
            return
        cur.execute("SELECT id FROM users WHERE name=%s LIMIT 1", (user,))
        row = cur.fetchone()
        cur.execute(
            "INSERT INTO live_comments(room_id, user_id, username, comment) VALUES(%s,%s,%s,%s)",
            (room_id, row["id"] if row else None, user, text),
        )
        cur.execute(
            "INSERT INTO live_messages(room_id, user_id, username, message) VALUES(%s,%s,%s,%s)",
            (room_id, row["id"] if row else None, user, text),
        )
        log_audit(cur, action="live_comment", actor=user, target_type="live_room", target_value=room_id, details=text[:140])

    emit("new_comment", payload, room=room_channel(room_id))


@socketio.on("send_heart")
def send_heart(data):
    room_id = str(data.get("room_id") or "").strip()
    user = clean(data.get("user") or "Guest") or "Guest"
    if not room_id:
        return

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id FROM users WHERE name=%s LIMIT 1", (user,))
        row = cur.fetchone()
        cur.execute(
            "INSERT INTO live_likes(room_id, user_id, username) VALUES(%s,%s,%s)",
            (room_id, row["id"] if row else None, user),
        )
        cur.execute(
            """
            SELECT COUNT(*) AS total
            FROM live_likes
            WHERE room_id=%s AND created_at > NOW() - INTERVAL '60 minutes'
            """,
            (room_id,),
        )
        hearts_count = cur.fetchone()["total"]

    emit("new_heart", {"room_id": room_id, "user": user, "count": hearts_count}, room=room_channel(room_id))
    emit("room_stats", {"room_id": room_id, "hearts_count": hearts_count}, room=room_channel(room_id))


@socketio.on("send_gift")
def send_gift(data):
    room_id = str(data.get("room_id") or "").strip()
    user = clean(data.get("user") or "Guest") or "Guest"
    gift = clean(data.get("gift") or "")
    if not room_id or not gift:
        return

    gift_value = GIFT_VALUES.get(gift, 0)
    payload = {
        "room_id": room_id,
        "user": user,
        "gift": gift,
        "gift_value": gift_value,
    }

    with db_cursor(commit=True) as (_conn, cur):
        moderation_error = enforce_moderation(cur, user, "live")
        if moderation_error and user != "Guest":
            emit("socket_error", {"message": moderation_error}, to=request.sid)
            return
        cur.execute("SELECT id, username FROM live_rooms WHERE id=%s LIMIT 1", (room_id,))
        room = cur.fetchone()
        if not room:
            emit("socket_error", {"message": "غرفة البث غير موجودة"}, to=request.sid)
            return

        cur.execute("SELECT id FROM users WHERE name=%s LIMIT 1", (user,))
        row = cur.fetchone()
        cur.execute(
            "INSERT INTO coins(username,balance,updated_at) VALUES(%s,%s,NOW()) ON CONFLICT (username) DO NOTHING",
            (user, Config.DEFAULT_COIN_BALANCE),
        )
        cur.execute(
            "INSERT INTO coins(username,balance,updated_at) VALUES(%s,%s,NOW()) ON CONFLICT (username) DO NOTHING",
            (room["username"], Config.DEFAULT_COIN_BALANCE),
        )
        cur.execute("SELECT balance FROM coins WHERE username=%s", (user,))
        balance = int((cur.fetchone() or {}).get("balance") or 0)
        if balance < gift_value:
            emit("socket_error", {"message": "رصيد العملات غير كافٍ"}, to=request.sid)
            return

        cur.execute("UPDATE coins SET balance=balance-%s, updated_at=NOW() WHERE username=%s", (gift_value, user))
        cur.execute("UPDATE coins SET balance=balance+%s, updated_at=NOW() WHERE username=%s", (gift_value, room["username"]))
        cur.execute(
            "INSERT INTO live_gifts(room_id, sender, username, gift_name, gift_value) VALUES(%s,%s,%s,%s,%s)",
            (room_id, row["id"] if row else None, user, gift, gift_value),
        )
        cur.execute(
            "INSERT INTO gifts(sender,receiver,gift,value) VALUES(%s,%s,%s,%s)",
            (user, room["username"], gift, gift_value),
        )
        if room["username"] != user:
            note = f"🎁 {user} أرسل لك {gift}"
            cur.execute(
                "INSERT INTO notifications(username,text,message,seen,is_read) VALUES(%s,%s,%s,FALSE,FALSE)",
                (room["username"], note, note),
            )
        cur.execute("SELECT balance FROM coins WHERE username=%s", (user,))
        payload["balance"] = int((cur.fetchone() or {}).get("balance") or 0)
        payload["receiver"] = room["username"]
        log_audit(cur, action="live_gift", actor=user, target_type="live_room", target_value=room_id, details=f"{gift}:{gift_value}")

    emit("new_gift", payload, room=room_channel(room_id))


@socketio.on("webrtc_signal")
def relay_webrtc_signal(data):
    room_id = str(data.get("room_id") or "").strip()
    target_socket_id = clean(data.get("target_socket_id") or "")
    username = clean(data.get("user") or "Guest") or "Guest"
    signal = data.get("signal") or {}
    if not room_id or not target_socket_id or not isinstance(signal, dict):
        return
    emit(
        "webrtc_signal",
        {
            "room_id": room_id,
            "sender_socket_id": request.sid,
            "user": username,
            "signal": signal,
        },
        to=target_socket_id,
    )


@socketio.on("disconnect")
def on_disconnect():
    sid = request.sid
    room_updates = []

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            """
            UPDATE live_viewers
            SET active=FALSE, last_seen=NOW()
            WHERE socket_id=%s
            RETURNING room_id, is_host, username
            """,
            (sid,),
        )
        disconnected_rows = cur.fetchall() or []
        room_updates = [str(row["room_id"]) for row in disconnected_rows]

        for disconnected in disconnected_rows:
            if not disconnected.get("is_host"):
                for host_socket_id in _active_host_socket_ids(cur, disconnected["room_id"]):
                    emit(
                        "viewer_left",
                        {
                            "room_id": str(disconnected["room_id"]),
                            "viewer_socket_id": sid,
                            "viewer": disconnected.get("username") or "",
                        },
                        to=host_socket_id,
                    )

        for room_id in room_updates:
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
            emit("room_stats", {"room_id": room_id, "viewer_count": total}, room=room_channel(room_id))
