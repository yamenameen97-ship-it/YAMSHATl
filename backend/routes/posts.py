from pathlib import Path
import time

from flask import Blueprint, jsonify, request, send_from_directory, session
from werkzeug.utils import secure_filename

from models import UPLOAD_FOLDER, get_connection

posts_bp = Blueprint("posts", __name__)
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "mp4", "mov", "webm", "mkv"}


def _logged_in_user():
    return session.get("user")


def _save_file(file):
    filename = secure_filename(file.filename or "")
    if not filename:
        return None, (jsonify({"message": "اسم الملف غير صالح"}), 400)

    extension = Path(filename).suffix.lower().replace(".", "")
    if extension not in ALLOWED_EXTENSIONS:
        return None, (jsonify({"message": "نوع الملف غير مدعوم"}), 400)

    unique_name = f"{int(time.time() * 1000)}_{filename}"
    save_path = UPLOAD_FOLDER / unique_name
    file.save(save_path)
    return unique_name, None


@posts_bp.route("/posts", methods=["GET"])
def get_posts():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, content, likes FROM posts ORDER BY id DESC")
    posts = cursor.fetchall()
    conn.close()

    return jsonify([
        {
            "id": post["id"],
            "username": post["username"],
            "content": post["content"],
            "likes": post["likes"],
        }
        for post in posts
    ])


@posts_bp.route("/add_post", methods=["POST"])
def add_post():
    username = _logged_in_user()
    if not username:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()

    if not content:
        return jsonify({"message": "لا يمكن نشر محتوى فارغ"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO posts (username, content) VALUES (?, ?)",
        (username, content),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم النشر", "username": username})


@posts_bp.route("/upload", methods=["POST"])
def upload_file():
    if not _logged_in_user():
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    if "file" not in request.files:
        return jsonify({"message": "لم يتم اختيار ملف"}), 400

    file = request.files["file"]
    filename, error = _save_file(file)
    if error:
        return error

    host = request.host_url.rstrip("/")
    return jsonify({
        "message": "تم رفع الملف",
        "file_url": f"{host}/uploads/{filename}",
        "filename": filename,
    })


@posts_bp.route("/uploads/<path:filename>", methods=["GET"])
def uploaded_file(filename: str):
    return send_from_directory(str(UPLOAD_FOLDER), filename)


@posts_bp.route("/like/<int:post_id>", methods=["POST"])
def like(post_id: int):
    if not _logged_in_user():
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT username FROM posts WHERE id=?", (post_id,))
    owner_row = cursor.fetchone()

    if not owner_row:
        conn.close()
        return jsonify({"message": "المنشور غير موجود"}), 404

    post_owner = owner_row["username"]
    cursor.execute("UPDATE posts SET likes = likes + 1 WHERE id=?", (post_id,))
    cursor.execute(
        "INSERT INTO notifications (username, message) VALUES (?, ?)",
        (post_owner, "❤️ تم الإعجاب بمنشورك"),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم الإعجاب"})


@posts_bp.route("/add_comment", methods=["POST"])
def add_comment():
    username = _logged_in_user()
    if not username:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    data = request.get_json(silent=True) or {}
    post_id = data.get("post_id")
    comment = (data.get("comment") or "").strip()

    if not post_id or not comment:
        return jsonify({"message": "يرجى إدخال التعليق بشكل صحيح"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT username FROM posts WHERE id=?", (post_id,))
    owner_row = cursor.fetchone()

    if not owner_row:
        conn.close()
        return jsonify({"message": "المنشور غير موجود"}), 404

    cursor.execute(
        "INSERT INTO comments (post_id, username, comment) VALUES (?, ?, ?)",
        (post_id, username, comment),
    )
    cursor.execute(
        "INSERT INTO notifications (username, message) VALUES (?, ?)",
        (owner_row["username"], "💬 تم التعليق على منشورك"),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم التعليق", "username": username})


@posts_bp.route("/comments/<int:post_id>", methods=["GET"])
def get_comments(post_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT username, comment FROM comments WHERE post_id=? ORDER BY id ASC",
        (post_id,),
    )
    comments = cursor.fetchall()
    conn.close()

    return jsonify([
        {"username": comment["username"], "comment": comment["comment"]}
        for comment in comments
    ])


@posts_bp.route("/notifications", methods=["GET"])
@posts_bp.route("/notifications/<username>", methods=["GET"])
def get_notifications(username: str | None = None):
    current = _logged_in_user()
    target_user = current or username

    if not target_user:
        return jsonify([])

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, message FROM notifications WHERE username=? ORDER BY id DESC",
        (target_user,),
    )
    notifications = cursor.fetchall()
    conn.close()

    return jsonify([
        {"id": item["id"], "message": item["message"]}
        for item in notifications
    ])


@posts_bp.route("/add_story", methods=["POST"])
def add_story():
    username = _logged_in_user()
    if not username:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    if "file" not in request.files:
        return jsonify({"message": "لم يتم اختيار ملف"}), 400

    file = request.files["file"]
    filename, error = _save_file(file)
    if error:
        return error

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO stories (username, media) VALUES (?, ?)",
        (username, filename),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم إضافة الستوري", "media": filename})


@posts_bp.route("/stories", methods=["GET"])
def get_stories():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username, media FROM stories ORDER BY id DESC")
    data = cursor.fetchall()
    conn.close()

    return jsonify([
        {"username": story["username"], "media": story["media"]}
        for story in data
    ])


@posts_bp.route("/add_reel", methods=["POST"])
def add_reel():
    username = _logged_in_user()
    if not username:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    if "file" not in request.files:
        return jsonify({"message": "لم يتم اختيار ملف"}), 400

    file = request.files["file"]
    filename, error = _save_file(file)
    if error:
        return error

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO reels (username, video) VALUES (?, ?)",
        (username, filename),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم إضافة الريل", "video": filename})


@posts_bp.route("/reels", methods=["GET"])
def get_reels():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username, video FROM reels ORDER BY id DESC")
    data = cursor.fetchall()
    conn.close()

    return jsonify([
        {"username": reel["username"], "video": reel["video"]}
        for reel in data
    ])
