from __future__ import annotations

from flask import Blueprint, jsonify, request

from admin_utils import enforce_moderation, log_audit
from db import db_cursor
from extensions import limiter
from utils import current_user, json_error, normalize_text, require_auth

users_bp = Blueprint("users", __name__)


def _is_blocked(cur, user_a: str | None, user_b: str | None) -> bool:
    a = str(user_a or "").strip()
    b = str(user_b or "").strip()
    if not a or not b:
        return False
    cur.execute(
        """
        SELECT 1
        FROM blocked_users
        WHERE (blocker=%s AND blocked=%s) OR (blocker=%s AND blocked=%s)
        LIMIT 1
        """,
        (a, b, b, a),
    )
    return bool(cur.fetchone())


def _submit_report(reporter: str, target_type: str, target_value: str, reason: str):
    safe_target_type = normalize_text(target_type, 40)
    safe_target_value = normalize_text(target_value, 255)
    safe_reason = normalize_text(reason, 1000, escape_html=True)

    if not safe_target_type or not safe_target_value or not safe_reason:
        return json_error("بيانات التبليغ غير مكتملة", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            "INSERT INTO reports(reporter,target_type,target_value,reason,status) VALUES(%s,%s,%s,%s,'open')",
            (reporter, safe_target_type, safe_target_value, safe_reason),
        )
        log_audit(
            cur,
            action="report_submitted",
            actor=reporter,
            target_type=safe_target_type,
            target_value=safe_target_value,
            details=safe_reason,
            severity="warning",
        )
    return jsonify({"ok": True, "message": "تم إرسال البلاغ"})


@users_bp.post("/follow")
@require_auth
@limiter.limit("60/hour")
def follow():
    follower = current_user()
    data = request.get_json(silent=True) or {}
    following = normalize_text(data.get("following") or data.get("to_user"), 80)

    if not following:
        return json_error("بيانات المتابعة غير مكتملة", 400)
    if follower == following:
        return json_error("لا يمكنك متابعة نفسك", 400)

    with db_cursor(commit=True) as (_conn, cur):
        moderation_error = enforce_moderation(cur, follower, "social")
        if moderation_error:
            return json_error(moderation_error, 403)
        cur.execute("SELECT id FROM users WHERE name=%s LIMIT 1", (following,))
        if not cur.fetchone():
            return json_error("المستخدم غير موجود", 404)
        if _is_blocked(cur, follower, following):
            return json_error("لا يمكن تنفيذ هذا الإجراء بسبب الحظر بين الحسابين", 403)

        cur.execute("SELECT id FROM followers WHERE follower=%s AND following=%s", (follower, following))
        existing = cur.fetchone()
        if existing:
            cur.execute("DELETE FROM followers WHERE follower=%s AND following=%s", (follower, following))
            message = "تم إلغاء المتابعة"
        else:
            cur.execute("INSERT INTO followers(follower,following) VALUES(%s,%s)", (follower, following))
            note = f"{follower} followed you"
            cur.execute(
                "INSERT INTO notifications(username,text,message,seen,is_read) VALUES(%s,%s,%s,FALSE,FALSE)",
                (following, note, note),
            )
            message = "تمت المتابعة"
        log_audit(cur, action="follow_toggle", actor=follower, target_type="user", target_value=following, details=message)

    return jsonify({"ok": True, "message": message})


@users_bp.get("/followers/<username>")
def followers(username: str):
    viewer = current_user()
    with db_cursor() as (_conn, cur):
        if viewer and _is_blocked(cur, viewer, username):
            return jsonify({"followers": 0, "following": 0, "blocked": True})
        cur.execute("SELECT COUNT(*) AS total FROM followers WHERE following=%s", (username,))
        followers_count = int((cur.fetchone() or {}).get("total") or 0)
        cur.execute("SELECT COUNT(*) AS total FROM followers WHERE follower=%s", (username,))
        following_count = int((cur.fetchone() or {}).get("total") or 0)
    return jsonify({"followers": followers_count, "following": following_count})




@users_bp.get("/relationship/<username>")
@require_auth
def relationship(username: str):
    viewer = current_user() or ""
    target = normalize_text(username, 80)
    if not target:
        return json_error("اسم المستخدم غير صالح", 400)
    if viewer == target:
        return jsonify({
            "same_user": True,
            "following": False,
            "is_friend": False,
            "outgoing_request_id": None,
            "incoming_request_id": None,
        })

    with db_cursor() as (_conn, cur):
        cur.execute("SELECT id FROM users WHERE name=%s LIMIT 1", (target,))
        if not cur.fetchone():
            return json_error("المستخدم غير موجود", 404)

        cur.execute("SELECT 1 FROM followers WHERE follower=%s AND following=%s LIMIT 1", (viewer, target))
        following = bool(cur.fetchone())

        cur.execute(
            """
            SELECT id, sender, receiver, status
            FROM friend_requests
            WHERE ((sender=%s AND receiver=%s) OR (sender=%s AND receiver=%s))
              AND status IN ('pending', 'accepted')
            ORDER BY id DESC
            LIMIT 20
            """,
            (viewer, target, target, viewer),
        )
        rows = cur.fetchall() or []

    outgoing_request_id = None
    incoming_request_id = None
    is_friend = False
    for row in rows:
        status = str(row.get("status") or "").strip().lower()
        sender = row.get("sender")
        receiver = row.get("receiver")
        if status == 'accepted':
            is_friend = True
            break
        if status == 'pending' and sender == viewer and receiver == target and outgoing_request_id is None:
            outgoing_request_id = row.get("id")
        if status == 'pending' and sender == target and receiver == viewer and incoming_request_id is None:
            incoming_request_id = row.get("id")

    return jsonify({
        "same_user": False,
        "following": following,
        "is_friend": is_friend,
        "outgoing_request_id": outgoing_request_id,
        "incoming_request_id": incoming_request_id,
    })


@users_bp.post("/cancel_friend_request")
@require_auth
def cancel_friend_request():
    viewer = current_user() or ""
    data = request.get_json(silent=True) or {}
    request_id = int(data.get("id") or 0)
    receiver = normalize_text(data.get("receiver"), 80)

    with db_cursor(commit=True) as (_conn, cur):
        if request_id:
            cur.execute(
                """
                SELECT id, sender, receiver, status
                FROM friend_requests
                WHERE id=%s
                LIMIT 1
                """,
                (request_id,),
            )
        elif receiver:
            cur.execute(
                """
                SELECT id, sender, receiver, status
                FROM friend_requests
                WHERE sender=%s AND receiver=%s AND status='pending'
                ORDER BY id DESC
                LIMIT 1
                """,
                (viewer, receiver),
            )
        else:
            return json_error("بيانات الطلب غير مكتملة", 400)

        row = cur.fetchone()
        if not row:
            return json_error("طلب الصداقة غير موجود", 404)
        if row.get("sender") != viewer:
            return json_error("لا يمكنك إلغاء هذا الطلب", 403)
        if str(row.get("status") or '').lower() != 'pending':
            return json_error("لا يمكن إلغاء هذا الطلب بعد الآن", 400)

        cur.execute("DELETE FROM friend_requests WHERE id=%s", (row.get("id"),))

    return jsonify({"ok": True, "message": "تم إلغاء طلب الصداقة"})

@users_bp.get("/users")
def list_users():
    viewer = current_user()
    with db_cursor() as (_conn, cur):
        if viewer:
            cur.execute(
                """
                SELECT name
                FROM users u
                WHERE u.name <> %s
                  AND NOT EXISTS (
                        SELECT 1 FROM blocked_users b
                        WHERE (b.blocker=%s AND b.blocked=u.name)
                           OR (b.blocker=u.name AND b.blocked=%s)
                  )
                ORDER BY id DESC
                LIMIT 300
                """,
                (viewer, viewer, viewer),
            )
        else:
            cur.execute("SELECT name FROM users ORDER BY id DESC LIMIT 300")
        rows = cur.fetchall()
    return jsonify(rows)


@users_bp.post("/block_user")
@require_auth
@limiter.limit("20/hour")
def block_user():
    blocker = current_user()
    data = request.get_json(silent=True) or {}
    blocked = normalize_text(data.get("username"), 80)
    if not blocked:
        return json_error("اسم المستخدم غير صالح", 400)
    if blocked == blocker:
        return json_error("لا يمكنك حظر نفسك", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            "INSERT INTO blocked_users(blocker,blocked) VALUES(%s,%s) ON CONFLICT (blocker,blocked) DO NOTHING",
            (blocker, blocked),
        )
        cur.execute(
            "DELETE FROM followers WHERE (follower=%s AND following=%s) OR (follower=%s AND following=%s)",
            (blocker, blocked, blocked, blocker),
        )
        log_audit(cur, action="user_block", actor=blocker, target_type="user", target_value=blocked, details="حظر مباشر من المستخدم")
    return jsonify({"ok": True, "message": "تم حظر المستخدم"})


@users_bp.post("/report")
@require_auth
@limiter.limit("20/hour")
def report_content():
    reporter = current_user()
    data = request.get_json(silent=True) or {}
    return _submit_report(
        reporter,
        data.get("target_type") or "",
        data.get("target_value") or "",
        data.get("reason") or "",
    )


@users_bp.post("/report_user")
@require_auth
@limiter.limit("20/hour")
def report_user():
    reporter = current_user()
    data = request.get_json(silent=True) or {}
    return _submit_report(reporter, "user", data.get("username") or data.get("target_value") or "", data.get("reason") or "")


@users_bp.post("/report_message")
@require_auth
@limiter.limit("20/hour")
def report_message():
    reporter = current_user()
    data = request.get_json(silent=True) or {}
    return _submit_report(reporter, "message", data.get("message_id") or data.get("target_value") or "", data.get("reason") or "")
