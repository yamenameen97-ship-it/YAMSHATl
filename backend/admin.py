from __future__ import annotations

from pathlib import Path

from flask import Blueprint, jsonify

from config import Config
from db import db_cursor
from media_store import delete_media_file
from utils import require_admin

admin_bp = Blueprint("admin", __name__)
UPLOAD_DIR = Path(Config.UPLOAD_FOLDER)


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
            "stories": _count(cur, "stories"),
        }

        cur.execute("SELECT name, email, role, created_at FROM users ORDER BY id DESC LIMIT 8")
        recent_users = cur.fetchall()
        cur.execute("SELECT id, username, content, media, likes, created_at FROM posts ORDER BY id DESC LIMIT 8")
        recent_posts = cur.fetchall()
        cur.execute("SELECT id, username, video, created_at FROM reels ORDER BY id DESC LIMIT 8")
        recent_reels = cur.fetchall()
        cur.execute(
            "SELECT id, reporter, target_type, target_value, reason, status, created_at FROM reports WHERE status='open' ORDER BY id DESC LIMIT 20"
        )
        reports = cur.fetchall()
        cur.execute(
            """
            SELECT
                lr.id,
                lr.username,
                lr.title,
                lr.status,
                lr.created_at,
                COALESCE(lr.ended_at, NULL) AS ended_at,
                EXISTS(
                    SELECT 1
                    FROM live_viewers lv
                    WHERE lv.room_id = lr.id
                      AND lv.is_host = TRUE
                      AND lv.active = TRUE
                      AND lv.last_seen > NOW() - INTERVAL '90 seconds'
                ) AS host_active,
                (
                    SELECT COUNT(*)
                    FROM live_viewers lv
                    WHERE lv.room_id = lr.id
                      AND lv.is_host = FALSE
                      AND lv.active = TRUE
                      AND lv.last_seen > NOW() - INTERVAL '90 seconds'
                ) AS viewer_count
            FROM live_rooms lr
            ORDER BY lr.id DESC
            LIMIT 12
            """
        )
        live_rooms = cur.fetchall()

        activity_day = {
            "active_users": stats["users"],
            "users": _count(cur, "users", "created_at > NOW() - INTERVAL '1 day'"),
            "posts": _count(cur, "posts", "created_at > NOW() - INTERVAL '1 day'"),
            "comments": _count(cur, "comments", "created_at > NOW() - INTERVAL '1 day'"),
            "messages": _count(cur, "messages", "created_at > NOW() - INTERVAL '1 day'"),
            "reports": _count(cur, "reports", "created_at > NOW() - INTERVAL '1 day' AND status='open'"),
            "reels": _count(cur, "reels", "created_at > NOW() - INTERVAL '1 day'"),
            "stories": _count(cur, "stories", "created_at > NOW() - INTERVAL '1 day'"),
        }
        activity_month = {
            "active_users": stats["users"],
            "users": _count(cur, "users", "created_at > NOW() - INTERVAL '30 days'"),
            "posts": _count(cur, "posts", "created_at > NOW() - INTERVAL '30 days'"),
            "comments": _count(cur, "comments", "created_at > NOW() - INTERVAL '30 days'"),
            "messages": _count(cur, "messages", "created_at > NOW() - INTERVAL '30 days'"),
            "reports": _count(cur, "reports", "created_at > NOW() - INTERVAL '30 days' AND status='open'"),
            "reels": _count(cur, "reels", "created_at > NOW() - INTERVAL '30 days'"),
            "stories": _count(cur, "stories", "created_at > NOW() - INTERVAL '30 days'"),
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
            "recent_reels": recent_reels,
            "live_rooms": live_rooms,
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


@admin_bp.get("/admin_users")
@require_admin
def admin_users():
    with db_cursor() as (_conn, cur):
        cur.execute(
            """
            SELECT name, email, role, created_at,
                   (SELECT COUNT(*) FROM posts p WHERE p.username=u.name) AS posts_count,
                   (SELECT COUNT(*) FROM reels r WHERE r.username=u.name) AS reels_count
            FROM users u
            ORDER BY id DESC
            LIMIT 200
            """
        )
        rows = cur.fetchall()
    return jsonify(rows)


@admin_bp.post("/admin_remove_post/<int:post_id>")
@require_admin
def admin_remove_post(post_id: int):
    media = ""
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id, media FROM posts WHERE id=%s", (post_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"message": "المنشور غير موجود"}), 404
        media = row.get("media") or ""
        cur.execute("DELETE FROM posts WHERE id=%s", (post_id,))
        cur.execute("UPDATE reports SET status='resolved' WHERE target_type='post' AND target_value=%s AND status='open'", (str(post_id),))
    delete_media_file(media, UPLOAD_DIR)
    return jsonify({"ok": True, "message": "تم حذف المنشور من لوحة الإدارة"})


@admin_bp.post("/admin_remove_reel/<int:reel_id>")
@require_admin
def admin_remove_reel(reel_id: int):
    video = ""
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id, video FROM reels WHERE id=%s", (reel_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"message": "الريل غير موجود"}), 404
        video = row.get("video") or ""
        cur.execute("DELETE FROM reels WHERE id=%s", (reel_id,))
        cur.execute("UPDATE reports SET status='resolved' WHERE target_type='reel' AND target_value=%s AND status='open'", (str(reel_id),))
    delete_media_file(video, UPLOAD_DIR)
    return jsonify({"ok": True, "message": "تم حذف الريل من لوحة الإدارة"})


@admin_bp.post("/admin_dismiss_report/<int:report_id>")
@require_admin
def admin_dismiss_report(report_id: int):
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id FROM reports WHERE id=%s", (report_id,))
        if not cur.fetchone():
            return jsonify({"message": "البلاغ غير موجود"}), 404
        cur.execute("UPDATE reports SET status='dismissed' WHERE id=%s", (report_id,))
    return jsonify({"ok": True, "message": "تم إغلاق البلاغ"})


@admin_bp.post("/admin_end_live/<int:room_id>")
@require_admin
def admin_end_live(room_id: int):
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id FROM live_rooms WHERE id=%s LIMIT 1", (room_id,))
        if not cur.fetchone():
            return jsonify({"message": "غرفة البث غير موجودة"}), 404
        cur.execute("UPDATE live_rooms SET status='ended', ended_at=NOW() WHERE id=%s", (room_id,))
        cur.execute("UPDATE live_viewers SET active=FALSE, last_seen=NOW() WHERE room_id=%s", (room_id,))
        cur.execute("UPDATE reports SET status='resolved' WHERE target_type='live' AND target_value=%s AND status='open'", (str(room_id),))
    return jsonify({"ok": True, "message": "تم إنهاء البث من لوحة الإدارة"})
