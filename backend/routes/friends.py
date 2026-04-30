from __future__ import annotations

from flask import Blueprint, jsonify, request

from db import db_cursor
from push_utils import send_push_to_user
from utils import current_user, json_error, normalize_text, require_auth

friends_bp = Blueprint("friends", __name__)


def _safe_user(value: str | None) -> str:
    return normalize_text(value, 80)


def _notify(cur, username: str, message: str, title: str, data: dict | None = None) -> None:
    safe_user = _safe_user(username)
    safe_message = str(message or "").strip()
    if not safe_user or not safe_message:
        return
    cur.execute(
        "INSERT INTO notifications(username,text,message,seen,is_read) VALUES(%s,%s,%s,FALSE,FALSE)",
        (safe_user, safe_message, safe_message),
    )
    send_push_to_user(cur, safe_user, title, safe_message, data or {})


@friends_bp.post("/send_friend_request")
@require_auth
def send_friend_request():
    data = request.get_json(silent=True) or {}
    sender = _safe_user(current_user())
    receiver = _safe_user(data.get("receiver") or data.get("username") or data.get("to_user"))

    if not sender or not receiver:
        return json_error("بيانات الطلب غير مكتملة", 400)
    if sender == receiver:
        return json_error("لا يمكنك إرسال طلب صداقة لنفسك", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id FROM users WHERE name=%s LIMIT 1", (receiver,))
        if not cur.fetchone():
            return json_error("المستخدم غير موجود", 404)

        cur.execute(
            """
            SELECT id, status, sender, receiver
            FROM friend_requests
            WHERE (sender=%s AND receiver=%s) OR (sender=%s AND receiver=%s)
            ORDER BY id DESC
            LIMIT 1
            """,
            (sender, receiver, receiver, sender),
        )
        existing = cur.fetchone()

        if existing:
            status = str(existing.get("status") or "").strip().lower()
            if status == "accepted":
                return jsonify({"ok": True, "message": "أنتم أصدقاء بالفعل"})
            if existing.get("sender") == sender and existing.get("receiver") == receiver and status == "pending":
                return jsonify({"ok": True, "message": "تم إرسال الطلب مسبقاً", "request_id": existing.get("id")})
            if existing.get("sender") == receiver and existing.get("receiver") == sender and status == "pending":
                return jsonify({"ok": True, "message": "لديك طلب وارد من هذا المستخدم بالفعل", "incoming_request_id": existing.get("id")})

        cur.execute(
            """
            INSERT INTO friend_requests(sender, receiver, status)
            VALUES(%s, %s, 'pending')
            RETURNING id
            """,
            (sender, receiver),
        )
        request_id = (cur.fetchone() or {}).get("id")
        _notify(
            cur,
            receiver,
            f"🤝 {sender} أرسل لك طلب صداقة",
            "طلب صداقة جديد",
            {"type": "friend_request", "from_user": sender, "screen": "notifications"},
        )

    return jsonify({"ok": True, "message": "تم إرسال طلب الصداقة", "request_id": request_id})


@friends_bp.post("/handle_friend_request")
@require_auth
def handle_friend_request():
    data = request.get_json(silent=True) or {}
    request_id = int(data.get("id") or 0)
    status = str(data.get("status") or "").strip().lower()
    current_user_name = _safe_user(current_user())

    if not request_id or status not in {"accepted", "rejected"}:
        return json_error("بيانات التحديث غير صحيحة", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            "SELECT id, sender, receiver, status FROM friend_requests WHERE id=%s LIMIT 1",
            (request_id,),
        )
        row = cur.fetchone()
        if not row:
            return json_error("طلب الصداقة غير موجود", 404)
        if row.get("receiver") != current_user_name:
            return json_error("غير مصرح لك بتعديل هذا الطلب", 403)
        if str(row.get("status") or "").strip().lower() != "pending":
            return json_error("تمت معالجة هذا الطلب بالفعل", 400)

        cur.execute("UPDATE friend_requests SET status=%s WHERE id=%s", (status, request_id))
        if status == "accepted":
            _notify(
                cur,
                row.get("sender") or "",
                f"✅ {row.get('receiver')} قبل طلب الصداقة",
                "تم قبول طلب الصداقة",
                {"type": "friend_request_accepted", "screen": "notifications"},
            )
        else:
            _notify(
                cur,
                row.get("sender") or "",
                f"❌ {row.get('receiver')} رفض طلب الصداقة",
                "تم رفض طلب الصداقة",
                {"type": "friend_request_rejected", "screen": "notifications"},
            )

    return jsonify({"ok": True, "message": "تم التحديث"})


@friends_bp.get("/friend_requests/<username>")
@require_auth
def friend_requests(username: str):
    target_user = _safe_user(current_user() or username)
    with db_cursor() as (_conn, cur):
        cur.execute(
            """
            SELECT id, sender
            FROM friend_requests
            WHERE receiver=%s AND status='pending'
            ORDER BY id DESC
            """,
            (target_user,),
        )
        data = cur.fetchall() or []
    return jsonify([
        {
            "id": row.get("id"),
            "sender": row.get("sender", ""),
        }
        for row in data
    ])


@friends_bp.get("/friends/<username>")
def friends(username: str):
    target_user = _safe_user(username)
    if not target_user:
        return json_error("اسم المستخدم غير صالح", 400)

    with db_cursor() as (_conn, cur):
        cur.execute(
            """
            SELECT sender, receiver
            FROM friend_requests
            WHERE status='accepted' AND (sender=%s OR receiver=%s)
            ORDER BY id DESC
            """,
            (target_user, target_user),
        )
        data = cur.fetchall() or []

    result = []
    for row in data:
        friend = row.get("sender") if row.get("sender") != target_user else row.get("receiver")
        if friend:
            result.append(friend)
    return jsonify(result)
