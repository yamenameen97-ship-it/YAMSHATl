from __future__ import annotations

from flask import Blueprint, jsonify

from db import db_cursor
from utils import require_admin

admin_bp = Blueprint("admin", __name__)


def _count(cur, table_name: str, where_clause: str = "", params: tuple = ()) -> int:
    query = f"SELECT COUNT(*) AS total FROM {table_name}"
    if where_clause:
        query += f" WHERE {where_clause}"
    cur.execute(query, params)
    row = cur.fetchone() or {}
    return int(row.get("total") or 0)


@admin_bp.get("/admin_overview")
@require_admin
def admin_overview():
    with db_cursor() as (_conn, cur):
        stats = {
            "users": _count(cur, "users"),
            "posts": _count(cur, "posts"),
            "comments": _count(cur, "comments"),
            "messages": _count(cur, "messages"),
            "reels": _count(cur, "reels"),
            "reports": _count(cur, "reports", "status='open'"),
            "followers": _count(cur, "followers"),
            "gifts": _count(cur, "gifts"),
        }

        cur.execute("SELECT name, email, role, created_at FROM users ORDER BY id DESC LIMIT 5")
        recent_users = cur.fetchall()
        cur.execute("SELECT id, username, content, media, likes, created_at FROM posts ORDER BY id DESC LIMIT 5")
        recent_posts = cur.fetchall()
        cur.execute(
            "SELECT id, reporter, target_type, target_value, reason, status, created_at FROM reports WHERE status='open' ORDER BY id DESC LIMIT 20"
        )
        reports = cur.fetchall()

    return jsonify(
        {
            "stats": stats,
            "recent_users": recent_users,
            "recent_posts": recent_posts,
            "activity": {},
            "reports": reports,
            "leaderboards": {},
            "system": {"security": "enabled", "jwt": True, "rate_limit": True},
        }
    )


@admin_bp.post("/admin_remove_post/<int:post_id>")
@require_admin
def admin_remove_post(post_id: int):
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id FROM posts WHERE id=%s", (post_id,))
        if not cur.fetchone():
            return jsonify({"message": "المنشور غير موجود"}), 404
        cur.execute("DELETE FROM posts WHERE id=%s", (post_id,))
    return jsonify({"ok": True, "message": "تم حذف المنشور من لوحة الإدارة"})


@admin_bp.post("/admin_dismiss_report/<int:report_id>")
@require_admin
def admin_dismiss_report(report_id: int):
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id FROM reports WHERE id=%s", (report_id,))
        if not cur.fetchone():
            return jsonify({"message": "البلاغ غير موجود"}), 404
        cur.execute("UPDATE reports SET status='dismissed' WHERE id=%s", (report_id,))
    return jsonify({"ok": True, "message": "تم إغلاق البلاغ"})
