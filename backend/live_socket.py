from __future__ import annotations

from flask import request
from flask_socketio import SocketIO, emit, join_room

from db import db_cursor

socketio = SocketIO(cors_allowed_origins="*", async_mode="eventlet")


GIFT_VALUES = {
    "🌹": 10,
    "💎": 100,
    "👑": 500,
}


def room_channel(room_id) -> str:
    return f"live:{room_id}"


def init_socket(app):
    socketio.init_app(app, cors_allowed_origins="*")


@socketio.on("join_live")
def join_live_event(data):
    room_id = str(data.get("room_id") or "").strip()
    if not room_id:
        emit("socket_error", {"message": "room_id is required"})
        return

    username = str(data.get("user") or "Guest").strip() or "Guest"
    platform = str(data.get("platform") or "web").strip() or "web"
    role = str(data.get("role") or "viewer").strip() or "viewer"
    device_type = str(data.get("device_type") or "browser").strip() or "browser"

    join_room(room_channel(room_id))

    with db_cursor(commit=True) as (_conn, cur):
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


@socketio.on("send_comment")
def send_comment(data):
    room_id = str(data.get("room_id") or "").strip()
    user = str(data.get("user") or "Guest").strip() or "Guest"
    text = str(data.get("text") or "").strip()
    if not room_id or not text:
        return

    payload = {"user": user, "text": text}
    with db_cursor(commit=True) as (_conn, cur):
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

    emit("new_comment", payload, room=room_channel(room_id))


@socketio.on("send_heart")
def send_heart(data):
    room_id = str(data.get("room_id") or "").strip()
    user = str(data.get("user") or "Guest").strip() or "Guest"
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

    emit("new_heart", {"user": user, "count": hearts_count}, room=room_channel(room_id))
    emit("room_stats", {"room_id": room_id, "hearts_count": hearts_count}, room=room_channel(room_id))


@socketio.on("send_gift")
def send_gift(data):
    room_id = str(data.get("room_id") or "").strip()
    user = str(data.get("user") or "Guest").strip() or "Guest"
    gift = str(data.get("gift") or "").strip()
    if not room_id or not gift:
        return

    payload = {
        "user": user,
        "gift": gift,
        "gift_value": GIFT_VALUES.get(gift, 0),
    }

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id FROM users WHERE name=%s LIMIT 1", (user,))
        row = cur.fetchone()
        cur.execute(
            "INSERT INTO live_gifts(room_id, sender, username, gift_name, gift_value) VALUES(%s,%s,%s,%s,%s)",
            (room_id, row["id"] if row else None, user, gift, payload["gift_value"]),
        )

    emit("new_gift", payload, room=room_channel(room_id))


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
            RETURNING room_id
            """,
            (sid,),
        )
        room_updates = [str(row["room_id"]) for row in cur.fetchall()]

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
