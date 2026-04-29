from __future__ import annotations

from flask import Blueprint, jsonify, request

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
    return jsonify({"ok": True, "message": "تم حظر المستخدم"})


@users_bp.post("/report")
@require_auth
@limiter.limit("20/hour")
def report_content():
    reporter = current_user()
    data = request.get_json(silent=True) or {}
    target_type = normalize_text(data.get("target_type"), 40)
    target_value = normalize_text(data.get("target_value"), 255)
    reason = normalize_text(data.get("reason"), 1000, escape_html=True)

    if not target_type or not target_value or not reason:
        return json_error("بيانات التبليغ غير مكتملة", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            "INSERT INTO reports(reporter,target_type,target_value,reason,status) VALUES(%s,%s,%s,%s,'open')",
            (reporter, target_type, target_value, reason),
        )
    return jsonify({"ok": True, "message": "تم إرسال البلاغ"})
