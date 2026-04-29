from __future__ import annotations

from flask import Blueprint, jsonify, request

from db import db_cursor
from utils import current_user, json_error, rate_limit, require_auth

chat_bp = Blueprint("chat", __name__)


@chat_bp.post("/send_message")
@require_auth
@rate_limit(60, 60)
def send_message():
    data = request.get_json(silent=True) or {}
    sender = current_user()
    receiver = str(data.get("receiver") or "").strip()
    message = str(data.get("message") or "").strip()

    if not receiver or not message:
        return json_error("بيانات الرسالة غير مكتملة", 400)
    if len(message) > 3000:
        return json_error("الرسالة طويلة جداً", 400)
    if sender == receiver:
        return json_error("لا يمكن إرسال رسالة إلى نفسك", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id FROM users WHERE name=%s", (receiver,))
        if not cur.fetchone():
            return json_error("المستخدم غير موجود", 404)
        cur.execute(
            "INSERT INTO messages(sender,receiver,message) VALUES(%s,%s,%s)",
            (sender, receiver, message),
        )

    return jsonify({"ok": True, "message": "تم إرسال الرسالة"})


@chat_bp.get("/get_messages")
@require_auth
def get_messages():
    sender = current_user()
    receiver = str(request.args.get("receiver") or "").strip()
    if not receiver:
        return jsonify([])

    with db_cursor() as (_conn, cur):
        cur.execute(
            """
            SELECT sender, receiver, message, created_at
            FROM messages
            WHERE (sender=%s AND receiver=%s)
               OR (sender=%s AND receiver=%s)
            ORDER BY id ASC
            """,
            (sender, receiver, receiver, sender),
        )
        rows = cur.fetchall()

    return jsonify(rows)


@chat_bp.get("/chat_threads")
@require_auth
def chat_threads():
    username = current_user()
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
