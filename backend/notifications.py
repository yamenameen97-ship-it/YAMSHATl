from __future__ import annotations

from flask import Blueprint, jsonify

from db import db_cursor
from utils import current_user, require_auth

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.get("/notifications")
@notifications_bp.get("/notifications/<username>")
def get_notifications(username: str | None = None):
    target = current_user() or username
    if not target:
        return jsonify([])

    with db_cursor(commit=bool(current_user())) as (_conn, cur):
        cur.execute(
            "SELECT id, username, text, message, seen, is_read, created_at FROM notifications WHERE username=%s ORDER BY id DESC LIMIT 100",
            (target,),
        )
        rows = cur.fetchall()
        if current_user() and current_user() == target:
            cur.execute("UPDATE notifications SET seen=TRUE, is_read=TRUE WHERE username=%s AND seen=FALSE", (target,))

    return jsonify(
        [
            {
                "id": row["id"],
                "message": row.get("message") or row.get("text") or "",
                "text": row.get("text") or row.get("message") or "",
                "seen": bool(row.get("seen") or row.get("is_read")),
                "created_at": row.get("created_at"),
            }
            for row in rows
        ]
    )


@notifications_bp.post("/notifications/mark_all_seen")
@require_auth
def mark_all_seen():
    username = current_user()
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("UPDATE notifications SET seen=TRUE, is_read=TRUE WHERE username=%s", (username,))
    return jsonify({"ok": True})
