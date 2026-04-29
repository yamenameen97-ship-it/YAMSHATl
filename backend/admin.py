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
            "live_rooms": _count(cur, "live_rooms", "status='live'"),
            "reports": _count(cur, "reports", "status='open'"),
            "follows": _count(cur, "followers"),
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

        activity_day = {
            "active_users": stats["users"],
            "users": _count(cur, "users", "created_at > NOW() - INTERVAL '1 day'"),
            "posts": _count(cur, "posts", "created_at > NOW() - INTERVAL '1 day'"),
            "comments": _count(cur, "comments", "created_at > NOW() - INTERVAL '1 day'"),
            "messages": _count(cur, "messages", "created_at > NOW() - INTERVAL '1 day'"),
            "reports": _count(cur, "reports", "created_at > NOW() - INTERVAL '1 day' AND status='open'"),
        }
        activity_month = {
            "active_users": stats["users"],
            "users": _count(cur, "users", "created_at > NOW() - INTERVAL '30 days'"),
            "posts": _count(cur, "posts", "created_at > NOW() - INTERVAL '30 days'"),
            "comments": _count(cur, "comments", "created_at > NOW() - INTERVAL '30 days'"),
            "messages": _count(cur, "messages", "created_at > NOW() - INTERVAL '30 days'"),
            "reports": _count(cur, "reports", "created_at > NOW() - INTERVAL '30 days' AND status='open'"),
        }

        cur.execute("SELECT username, COUNT(*) AS total FROM comments GROUP BY username ORDER BY total DESC LIMIT 5")
        top_commenters = cur.fetchall()
        cur.execute("SELECT username, COUNT(*) AS total FROM posts GROUP BY username ORDER BY total DESC LIMIT 5")
        top_posters = cur.fetchall()
        cur.execute("SELECT sender AS username, COUNT(*) AS total FROM messages GROUP BY sender ORDER BY total DESC LIMIT 5")
        top_messengers = cur.fetchall()

    return jsonify(
        {
            "stats": stats,
            "recent_users": recent_users,
            "recent_posts": recent_posts,
            "activity": {"day": activity_day, "month": activity_month},
            "reports": reports,
            "leaderboards": {
                "commenters": top_commenters,
                "posters": top_posters,
                "messengers": top_messengers,
            },
            "system": {
                "security": "enabled",
                "jwt": True,
                "rate_limit": True,
                "tracking_window_day": "آخر 24 ساعة",
                "tracking_window_month": "آخر 30 يوم",
            },
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
