from __future__ import annotations

from flask import Blueprint, jsonify

from db import db_cursor
from utils import require_admin

admin_bp = Blueprint("admin", __name__)


def _count(cur, table_name: str) -> int:
    cur.execute(f"SELECT COUNT(*) AS total FROM {table_name}")
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
        }

        cur.execute("SELECT name, email, role, created_at FROM users ORDER BY id DESC LIMIT 5")
        recent_users = cur.fetchall()
        cur.execute("SELECT id, username, content, media, likes, created_at FROM posts ORDER BY id DESC LIMIT 5")
        recent_posts = cur.fetchall()

    return jsonify(
        {
            "stats": stats,
            "recent_users": recent_users,
            "recent_posts": recent_posts,
            "activity": {},
            "reports": [],
            "leaderboards": {},
            "system": {"security": "enabled"},
        }
    )
