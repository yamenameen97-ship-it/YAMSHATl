from __future__ import annotations

import os
import uuid
from pathlib import Path

from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename

from config import Config
from db import db_cursor
from extensions import limiter
from utils import current_user, json_error, normalize_text, require_auth

reels_bp = Blueprint("reels", __name__)
UPLOAD_DIR = Path(Config.UPLOAD_FOLDER)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


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


def _save_video(file_storage) -> str:
    raw_name = secure_filename(file_storage.filename or "")
    if not raw_name:
        raise ValueError("اسم الملف غير صالح")
    ext = Path(raw_name).suffix.lower().replace(".", "")
    if ext not in Config.ALLOWED_VIDEO_EXTENSIONS:
        raise ValueError("الملف يجب أن يكون فيديو صالحاً")
    filename = f"reel_{uuid.uuid4().hex}.{ext}"
    save_path = UPLOAD_DIR / filename
    file_storage.save(save_path)
    return filename


def _delete_video_file(video_value: str | None):
    video = str(video_value or "").strip()
    if not video:
        return
    file_name = video.split("/uploads/")[-1].split("?")[0] if "/uploads/" in video else video
    file_path = UPLOAD_DIR / file_name
    if file_path.exists() and file_path.is_file():
        try:
            os.remove(file_path)
        except OSError:
            pass


def _reel_stats(cur, reel_id: int, username: str | None = None) -> dict:
    cur.execute("SELECT COUNT(*) AS total FROM reel_likes WHERE reel_id=%s", (reel_id,))
    likes = int((cur.fetchone() or {}).get("total") or 0)
    cur.execute("SELECT COUNT(*) AS total FROM reel_comments WHERE reel_id=%s", (reel_id,))
    comments_count = int((cur.fetchone() or {}).get("total") or 0)
    liked = False
    if username:
        cur.execute("SELECT 1 FROM reel_likes WHERE reel_id=%s AND username=%s LIMIT 1", (reel_id, username))
        liked = bool(cur.fetchone())
    return {"likes": likes, "comments_count": comments_count, "liked": liked}


@reels_bp.post("/add_reel")
@require_auth
@limiter.limit("20/hour")
def add_reel():
    if "file" not in request.files:
        return json_error("لم يتم اختيار ملف", 400)

    file_storage = request.files["file"]
    try:
        filename = _save_video(file_storage)
    except ValueError as exc:
        return json_error(str(exc), 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            "INSERT INTO reels(username,video) VALUES(%s,%s) RETURNING id",
            (current_user(), filename),
        )
        reel_id = cur.fetchone()["id"]

    return jsonify({"ok": True, "message": "تم رفع الريل", "video": filename, "id": reel_id})


@reels_bp.get("/reels")
def get_reels():
    username = current_user()
    with db_cursor() as (_conn, cur):
        if username:
            cur.execute(
                """
                SELECT r.id, r.username, r.video, r.created_at
                FROM reels r
                WHERE NOT EXISTS (
                    SELECT 1 FROM blocked_users b
                    WHERE (b.blocker=%s AND b.blocked=r.username)
                       OR (b.blocker=r.username AND b.blocked=%s)
                )
                ORDER BY r.id DESC
                LIMIT 200
                """,
                (username, username),
            )
        else:
            cur.execute("SELECT id, username, video, created_at FROM reels ORDER BY id DESC LIMIT 200")
        reels = cur.fetchall()

        result = []
        for reel in reels:
            stats = _reel_stats(cur, reel["id"], username)
            result.append(
                {
                    "id": reel["id"],
                    "username": reel["username"],
                    "video": reel["video"],
                    "video_url": f"{request.host_url.rstrip('/')}/api/uploads/{reel['video']}" if reel["video"] else "",
                    "likes": stats["likes"],
                    "comments_count": stats["comments_count"],
                    "liked_by_current_user": stats["liked"],
                    "created_at": reel.get("created_at"),
                }
            )
    return jsonify(result)


@reels_bp.delete("/delete_reel/<int:reel_id>")
@require_auth
def delete_reel(reel_id: int):
    username = current_user()
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT username, video FROM reels WHERE id=%s", (reel_id,))
        reel = cur.fetchone()
        if not reel:
            return json_error("الريل غير موجود", 404)
        if reel["username"] != username:
            return json_error("لا يمكنك حذف هذا الريل", 403)
        cur.execute("DELETE FROM reels WHERE id=%s", (reel_id,))
        video = reel.get("video") or ""

    _delete_video_file(video)
    return jsonify({"ok": True, "message": "تم حذف الريل"})


@reels_bp.post("/reels/<int:reel_id>/like")
@require_auth
@limiter.limit("120/hour")
def like_reel(reel_id: int):
    username = current_user()
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT username FROM reels WHERE id=%s", (reel_id,))
        reel = cur.fetchone()
        if not reel:
            return json_error("الريل غير موجود", 404)
        if _is_blocked(cur, username, reel["username"]):
            return json_error("لا يمكن التفاعل مع هذا الريل", 403)

        cur.execute("SELECT id FROM reel_likes WHERE reel_id=%s AND username=%s", (reel_id, username))
        existing = cur.fetchone()
        if existing:
            cur.execute("DELETE FROM reel_likes WHERE reel_id=%s AND username=%s", (reel_id, username))
            liked = False
            message = "تم إلغاء الإعجاب من الريل"
        else:
            cur.execute("INSERT INTO reel_likes(reel_id,username) VALUES(%s,%s)", (reel_id, username))
            liked = True
            message = "تم الإعجاب بالريل"
            if reel["username"] != username:
                note = f"🎬 {username} أعجب بالريل الخاص بك"
                cur.execute(
                    "INSERT INTO notifications(username,text,message,seen,is_read) VALUES(%s,%s,%s,FALSE,FALSE)",
                    (reel["username"], note, note),
                )

        stats = _reel_stats(cur, reel_id, username)

    return jsonify(
        {
            "ok": True,
            "message": message,
            "liked": liked,
            "likes": stats["likes"],
            "comments_count": stats["comments_count"],
        }
    )


@reels_bp.post("/reels/<int:reel_id>/comment")
@require_auth
@limiter.limit("60/hour")
def add_reel_comment(reel_id: int):
    username = current_user()
    data = request.get_json(silent=True) or {}
    comment = normalize_text(data.get("comment"), 2000, escape_html=True)
    if not comment:
        return json_error("اكتب تعليقاً أولاً", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT username FROM reels WHERE id=%s", (reel_id,))
        reel = cur.fetchone()
        if not reel:
            return json_error("الريل غير موجود", 404)
        if _is_blocked(cur, username, reel["username"]):
            return json_error("لا يمكن التعليق على هذا الريل", 403)

        cur.execute(
            "INSERT INTO reel_comments(reel_id,username,comment) VALUES(%s,%s,%s)",
            (reel_id, username, comment),
        )
        if reel["username"] != username:
            note = f"💬 {username} علّق على الريل الخاص بك"
            cur.execute(
                "INSERT INTO notifications(username,text,message,seen,is_read) VALUES(%s,%s,%s,FALSE,FALSE)",
                (reel["username"], note, note),
            )
        stats = _reel_stats(cur, reel_id, username)

    return jsonify(
        {
            "ok": True,
            "message": "تمت إضافة التعليق على الريل",
            "likes": stats["likes"],
            "comments_count": stats["comments_count"],
        }
    )


@reels_bp.get("/reels/<int:reel_id>/comments")
def get_reel_comments(reel_id: int):
    username = current_user()
    with db_cursor() as (_conn, cur):
        if username:
            cur.execute(
                """
                SELECT rc.id, rc.username, rc.comment, rc.created_at
                FROM reel_comments rc
                WHERE rc.reel_id=%s
                  AND NOT EXISTS (
                        SELECT 1 FROM blocked_users b
                        WHERE (b.blocker=%s AND b.blocked=rc.username)
                           OR (b.blocker=rc.username AND b.blocked=%s)
                  )
                ORDER BY rc.id ASC
                """,
                (reel_id, username, username),
            )
        else:
            cur.execute(
                "SELECT id, username, comment, created_at FROM reel_comments WHERE reel_id=%s ORDER BY id ASC",
                (reel_id,),
            )
        rows = cur.fetchall()
    return jsonify(rows)
