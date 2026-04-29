from __future__ import annotations

import os
import uuid
from pathlib import Path

from flask import Blueprint, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename

from config import Config
from db import db_cursor
from utils import current_user, json_error, normalize_text, rate_limit, require_auth

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


@posts_bp.get("/posts")
def get_posts():
    with db_cursor() as (_conn, cur):
        cur.execute(
            "SELECT id, username, content, media, likes, created_at FROM posts ORDER BY id DESC LIMIT 200"
        )
        rows = cur.fetchall()
    return jsonify(rows)


@posts_bp.post("/add_post")
@require_auth
@rate_limit(30, 3600)
def add_post():
    data = request.get_json(silent=True) or {}
    username = current_user()
    content = normalize_text(data.get("content"), 4000)
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
@rate_limit(20, 3600)
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
@rate_limit(120, 3600)
def like(post_id: int):
    username = current_user()
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id FROM posts WHERE id=%s", (post_id,))
        if not cur.fetchone():
            return json_error("المنشور غير موجود", 404)

        cur.execute("SELECT id FROM post_likes WHERE post_id=%s AND username=%s", (post_id, username))
        if cur.fetchone():
            return jsonify({"ok": True, "message": "تم تسجيل الإعجاب سابقاً"})

        cur.execute("INSERT INTO post_likes(post_id,username) VALUES(%s,%s)", (post_id, username))
        cur.execute("UPDATE posts SET likes = likes + 1 WHERE id=%s", (post_id,))

    return jsonify({"ok": True, "message": "تم الإعجاب"})


@posts_bp.post("/add_comment")
@require_auth
@rate_limit(60, 3600)
def add_comment():
    data = request.get_json(silent=True) or {}
    post_id = data.get("post_id")
    comment = normalize_text(data.get("comment"), 2000)
    username = current_user()

    if not post_id or not comment:
        return json_error("بيانات التعليق غير مكتملة", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id FROM posts WHERE id=%s", (post_id,))
        if not cur.fetchone():
            return json_error("المنشور غير موجود", 404)
        cur.execute(
            "INSERT INTO comments(post_id,username,comment) VALUES(%s,%s,%s)",
            (post_id, username, comment),
        )

    return jsonify({"ok": True, "message": "تم التعليق", "username": username})


@posts_bp.get("/comments/<int:post_id>")
def get_comments(post_id: int):
    with db_cursor() as (_conn, cur):
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

    if "/uploads/" in media:
        file_name = media.split("/uploads/")[-1].split("?")[0]
        file_path = UPLOAD_DIR / file_name
        if file_path.exists() and file_path.is_file():
            try:
                os.remove(file_path)
            except OSError:
                pass

    return jsonify({"ok": True, "message": "تم حذف المنشور"})


@posts_bp.get("/search")
def search():
    query = normalize_text(request.args.get("q"), 120)
    if not query:
        return jsonify({"users": [], "posts": []})
    needle = f"%{query}%"
    with db_cursor() as (_conn, cur):
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
    with db_cursor() as (_conn, cur):
        cur.execute(
            "SELECT id, username, content, media, likes, created_at FROM posts WHERE username=%s ORDER BY id DESC LIMIT 100",
            (username,),
        )
        rows = cur.fetchall()
    return jsonify(rows)
