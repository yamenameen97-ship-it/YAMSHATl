from __future__ import annotations

import os
import uuid
from pathlib import Path

from flask import Blueprint, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename

from config import Config
from db import db_cursor
from extensions import limiter
from utils import clean, current_user, json_error, normalize_text, require_auth

posts_bp = Blueprint("posts", __name__)
UPLOAD_DIR = Path(Config.UPLOAD_FOLDER)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _allowed_file(filename: str) -> bool:
    ext = Path(filename).suffix.lower().replace(".", "")
    return ext in Config.ALLOWED_EXTENSIONS


def _save_upload(file_storage, allowed_exts: set[str] | None = None) -> str:
    raw_name = secure_filename(file_storage.filename or "")
    if not raw_name:
        raise ValueError("اسم الملف غير صالح")
    ext = Path(raw_name).suffix.lower().replace(".", "")
    valid_exts = allowed_exts or Config.ALLOWED_EXTENSIONS
    if ext not in valid_exts:
        raise ValueError("نوع الملف غير مدعوم")
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    save_path = UPLOAD_DIR / unique_name
    file_storage.save(save_path)
    return unique_name


def _extract_upload_name(media_value: str | None) -> str | None:
    media = str(media_value or "").strip()
    if not media:
        return None
    if "/uploads/" in media:
        return media.split("/uploads/")[-1].split("?")[0]
    return media if (UPLOAD_DIR / media).exists() else None


def _delete_upload_if_exists(media_value: str | None):
    file_name = _extract_upload_name(media_value)
    if not file_name:
        return
    file_path = UPLOAD_DIR / file_name
    if file_path.exists() and file_path.is_file():
        try:
            os.remove(file_path)
        except OSError:
            pass


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


@posts_bp.get("/posts")
def get_posts():
    username = current_user()
    with db_cursor() as (_conn, cur):
        if username:
            cur.execute(
                """
                SELECT p.id, p.username, p.content, p.media, p.likes, p.created_at
                FROM posts p
                WHERE NOT EXISTS (
                    SELECT 1 FROM blocked_users b
                    WHERE (b.blocker=%s AND b.blocked=p.username)
                       OR (b.blocker=p.username AND b.blocked=%s)
                )
                ORDER BY p.id DESC
                LIMIT 200
                """,
                (username, username),
            )
        else:
            cur.execute(
                "SELECT id, username, content, media, likes, created_at FROM posts ORDER BY id DESC LIMIT 200"
            )
        rows = cur.fetchall()
    return jsonify(rows)


@posts_bp.post("/add_post")
@require_auth
@limiter.limit("30/hour")
def add_post():
    data = request.get_json(silent=True) or {}
    username = current_user()
    content = normalize_text(data.get("content"), 4000, escape_html=True)
    media = normalize_text(data.get("media"), 1024)

    if not content and not media:
        return json_error("لا يمكن نشر محتوى فارغ", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            "INSERT INTO posts(username,content,media) VALUES(%s,%s,%s)",
            (username, content, media or None),
        )
    return jsonify({"ok": True, "message": "تم النشر", "username": username})


@posts_bp.post("/upload")
@require_auth
@limiter.limit("20/hour")
def upload_file():
    if "file" not in request.files:
        return json_error("لم يتم اختيار ملف", 400)
    file_storage = request.files["file"]
    try:
        filename = _save_upload(file_storage)
    except ValueError as exc:
        return json_error(str(exc), 400)
    url = f"{request.host_url.rstrip('/')}/api/uploads/{filename}"
    return jsonify({"ok": True, "message": "تم رفع الملف", "file_url": url, "url": url, "filename": filename})


@posts_bp.get("/uploads/<path:filename>")
def uploaded_file(filename: str):
    return send_from_directory(UPLOAD_DIR, filename)


@posts_bp.post("/like/<int:post_id>")
@require_auth
@limiter.limit("120/hour")
def like(post_id: int):
    username = current_user()
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id, username FROM posts WHERE id=%s", (post_id,))
        post = cur.fetchone()
        if not post:
            return json_error("المنشور غير موجود", 404)
        if _is_blocked(cur, username, post["username"]):
            return json_error("لا يمكن التفاعل مع هذا الحساب", 403)

        cur.execute("SELECT id FROM post_likes WHERE post_id=%s AND username=%s", (post_id, username))
        if cur.fetchone():
            return jsonify({"ok": True, "message": "تم تسجيل الإعجاب سابقاً"})

        cur.execute("INSERT INTO post_likes(post_id,username) VALUES(%s,%s)", (post_id, username))
        cur.execute("UPDATE posts SET likes = likes + 1 WHERE id=%s", (post_id,))
        if post["username"] != username:
            note = f"❤️ {username} أعجب بمنشورك"
            cur.execute(
                "INSERT INTO notifications(username,text,message,seen,is_read) VALUES(%s,%s,%s,FALSE,FALSE)",
                (post["username"], note, note),
            )

    return jsonify({"ok": True, "message": "تم الإعجاب"})


@posts_bp.post("/add_comment")
@require_auth
@limiter.limit("60/hour")
def add_comment():
    data = request.get_json(silent=True) or {}
    post_id = data.get("post_id")
    comment = normalize_text(data.get("comment"), 2000, escape_html=True)
    username = current_user()

    if not post_id or not comment:
        return json_error("بيانات التعليق غير مكتملة", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id, username FROM posts WHERE id=%s", (post_id,))
        post = cur.fetchone()
        if not post:
            return json_error("المنشور غير موجود", 404)
        if _is_blocked(cur, username, post["username"]):
            return json_error("لا يمكن التعليق على هذا الحساب", 403)
        cur.execute(
            "INSERT INTO comments(post_id,username,comment) VALUES(%s,%s,%s)",
            (post_id, username, comment),
        )
        if post["username"] != username:
            note = f"💬 {username} علّق على منشورك"
            cur.execute(
                "INSERT INTO notifications(username,text,message,seen,is_read) VALUES(%s,%s,%s,FALSE,FALSE)",
                (post["username"], note, note),
            )

    return jsonify({"ok": True, "message": "تم التعليق", "username": username})


@posts_bp.get("/comments/<int:post_id>")
def get_comments(post_id: int):
    username = current_user()
    with db_cursor() as (_conn, cur):
        if username:
            cur.execute(
                """
                SELECT c.id, c.post_id, c.username, c.comment, c.created_at
                FROM comments c
                WHERE c.post_id=%s
                  AND NOT EXISTS (
                        SELECT 1 FROM blocked_users b
                        WHERE (b.blocker=%s AND b.blocked=c.username)
                           OR (b.blocker=c.username AND b.blocked=%s)
                  )
                ORDER BY c.id ASC
                """,
                (post_id, username, username),
            )
        else:
            cur.execute(
                "SELECT id, post_id, username, comment, created_at FROM comments WHERE post_id=%s ORDER BY id ASC",
                (post_id,),
            )
        rows = cur.fetchall()
    return jsonify(rows)


@posts_bp.delete("/delete_post/<int:post_id>")
@require_auth
def delete_post(post_id: int):
    username = current_user()
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT username, media FROM posts WHERE id=%s", (post_id,))
        row = cur.fetchone()
        if not row:
            return json_error("المنشور غير موجود", 404)
        if row["username"] != username:
            return json_error("لا يمكنك حذف هذا المنشور", 403)
        media = row.get("media") or ""
        cur.execute("DELETE FROM posts WHERE id=%s", (post_id,))

    _delete_upload_if_exists(media)
    return jsonify({"ok": True, "message": "تم حذف المنشور"})


@posts_bp.get("/search")
def search():
    query = normalize_text(request.args.get("q"), 120, escape_html=False)
    if not query:
        return jsonify({"users": [], "posts": []})
    needle = f"%{query}%"
    username = current_user()
    with db_cursor() as (_conn, cur):
        if username:
            cur.execute(
                """
                SELECT name
                FROM users u
                WHERE name ILIKE %s
                  AND NOT EXISTS (
                        SELECT 1 FROM blocked_users b
                        WHERE (b.blocker=%s AND b.blocked=u.name)
                           OR (b.blocker=u.name AND b.blocked=%s)
                  )
                ORDER BY id DESC
                LIMIT 20
                """,
                (needle, username, username),
            )
            users = cur.fetchall()
            cur.execute(
                """
                SELECT p.id, p.username, p.content, p.media, p.likes, p.created_at
                FROM posts p
                WHERE (p.content ILIKE %s OR p.username ILIKE %s)
                  AND NOT EXISTS (
                        SELECT 1 FROM blocked_users b
                        WHERE (b.blocker=%s AND b.blocked=p.username)
                           OR (b.blocker=p.username AND b.blocked=%s)
                  )
                ORDER BY p.id DESC
                LIMIT 20
                """,
                (needle, needle, username, username),
            )
            posts = cur.fetchall()
        else:
            cur.execute("SELECT name FROM users WHERE name ILIKE %s ORDER BY id DESC LIMIT 20", (needle,))
            users = cur.fetchall()
            cur.execute(
                "SELECT id, username, content, media, likes, created_at FROM posts WHERE content ILIKE %s OR username ILIKE %s ORDER BY id DESC LIMIT 20",
                (needle, needle),
            )
            posts = cur.fetchall()
    return jsonify({"users": users, "posts": posts})


@posts_bp.get("/user_posts/<username>")
def user_posts(username: str):
    viewer = current_user()
    with db_cursor() as (_conn, cur):
        if viewer and _is_blocked(cur, viewer, username):
            return json_error("هذا الحساب غير متاح لك حالياً", 403)
        cur.execute(
            "SELECT id, username, content, media, likes, created_at FROM posts WHERE username=%s ORDER BY id DESC LIMIT 100",
            (username,),
        )
        rows = cur.fetchall()
    return jsonify(rows)


@posts_bp.post("/add_story")
@require_auth
@limiter.limit("20/hour")
def add_story():
    if "file" not in request.files:
        return json_error("لم يتم اختيار ملف", 400)
    file_storage = request.files["file"]
    try:
        filename = _save_upload(file_storage, Config.ALLOWED_IMAGE_EXTENSIONS | Config.ALLOWED_VIDEO_EXTENSIONS)
    except ValueError as exc:
        return json_error(str(exc), 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("INSERT INTO stories(username,media) VALUES(%s,%s)", (current_user(), filename))

    return jsonify({"ok": True, "message": "تم إضافة الستوري", "media": filename})


@posts_bp.get("/stories")
def get_stories():
    username = current_user()
    with db_cursor() as (_conn, cur):
        if username:
            cur.execute(
                """
                SELECT s.id, s.username, s.media, s.created_at
                FROM stories s
                WHERE NOT EXISTS (
                    SELECT 1 FROM blocked_users b
                    WHERE (b.blocker=%s AND b.blocked=s.username)
                       OR (b.blocker=s.username AND b.blocked=%s)
                )
                ORDER BY s.id DESC
                LIMIT 100
                """,
                (username, username),
            )
        else:
            cur.execute("SELECT id, username, media, created_at FROM stories ORDER BY id DESC LIMIT 100")
        rows = cur.fetchall()
    return jsonify(rows)
