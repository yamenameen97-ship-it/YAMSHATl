from pathlib import Path
import time
from urllib.parse import urlparse

from flask import Blueprint, jsonify, request, send_from_directory, session
from werkzeug.utils import secure_filename

from auth_utils import current_user
from extensions import limiter
from models import UPLOAD_FOLDER, get_connection, insert_and_get_id
from push_utils import send_push_to_user

posts_bp = Blueprint("posts", __name__)
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "mp4", "mov", "webm", "mkv"}


def _logged_in_user():
    return current_user()


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


def _extract_upload_filename(content: str) -> str | None:
    value = str(content or "").strip()
    if not value:
        return None
    parsed = urlparse(value)
    path = parsed.path or value
    if "/uploads/" not in path:
        return None
    return path.split("/uploads/")[-1].split("?")[0]


def _delete_file_if_exists(filename: str | None) -> None:
    if not filename:
        return
    file_path = UPLOAD_FOLDER / filename
    if file_path.exists() and file_path.is_file():
        try:
            file_path.unlink()
        except OSError:
            pass


def _reel_stats(cursor, reel_id: int):
    cursor.execute("SELECT COUNT(*) AS total FROM reel_likes WHERE reel_id=?", (reel_id,))
    likes = cursor.fetchone()["total"]
    cursor.execute("SELECT COUNT(*) AS total FROM reel_comments WHERE reel_id=?", (reel_id,))
    comments = cursor.fetchone()["total"]
    return likes, comments


def _is_blocked(cursor, current_user: str, other_user: str) -> bool:
    if not current_user or not other_user:
        return False
    cursor.execute(
        """
        SELECT 1 FROM blocked_users
        WHERE (blocker=? AND blocked=?) OR (blocker=? AND blocked=?)
        LIMIT 1
        """,
        (current_user, other_user, other_user, current_user),
    )
    return bool(cursor.fetchone())


@posts_bp.route("/posts", methods=["GET"])
def get_posts():
    current = _logged_in_user()
    conn = get_connection()
    cursor = conn.cursor()

    if current:
        cursor.execute(
            """
            SELECT p.id, p.username, p.content, p.media, p.likes
            FROM posts p
            WHERE NOT EXISTS (
                SELECT 1 FROM blocked_users b
                WHERE (b.blocker=? AND b.blocked=p.username)
                   OR (b.blocker=p.username AND b.blocked=?)
            )
            ORDER BY p.id DESC
            """,
            (current, current),
        )
    else:
        cursor.execute("SELECT id, username, content, media, likes FROM posts ORDER BY id DESC")

    posts = cursor.fetchall()
    conn.close()

    return jsonify(
        [
            {
                "id": post["id"],
                "username": post["username"],
                "content": post["content"],
                "media": post["media"],
                "likes": post["likes"],
            }
            for post in posts
        ]
    )


@posts_bp.route("/add_post", methods=["POST"])
@limiter.limit("30 per hour")
def add_post():
    username = _logged_in_user()
    if not username:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    media = (data.get("media") or "").strip()

    if not content and not media:
        return jsonify({"message": "لا يمكن نشر محتوى فارغ"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO posts (username, content, media) VALUES (?, ?, ?)", (username, content, media))
    conn.commit()
    conn.close()

    return jsonify({"message": "تم النشر", "username": username})


@posts_bp.route("/delete_post/<int:post_id>", methods=["DELETE"])
def delete_post(post_id: int):
    username = _logged_in_user()
    if not username:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username, media FROM posts WHERE id=?", (post_id,))
    post = cursor.fetchone()
    if not post:
        conn.close()
        return jsonify({"message": "المنشور غير موجود"}), 404
    if post["username"] != username:
        conn.close()
        return jsonify({"message": "لا يمكنك حذف هذا المنشور"}), 403

    filename = _extract_upload_filename(post["media"])
    cursor.execute("DELETE FROM comments WHERE post_id=?", (post_id,))
    cursor.execute("DELETE FROM posts WHERE id=?", (post_id,))
    conn.commit()
    conn.close()
    _delete_file_if_exists(filename)

    return jsonify({"message": "تم حذف المنشور"})


@posts_bp.route("/upload", methods=["POST"])
@limiter.limit("20 per hour")
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
    file_url = f"{host}/api/uploads/{filename}"
    return jsonify({
        "message": "تم رفع الملف",
        "file_url": file_url,
        "url": file_url,
        "filename": filename,
    })


@posts_bp.route("/uploads/<path:filename>", methods=["GET"])
def uploaded_file(filename: str):
    return send_from_directory(str(UPLOAD_FOLDER), filename)


@posts_bp.route("/like/<int:post_id>", methods=["POST"])
def like(post_id: int):
    username = _logged_in_user()
    if not username:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT username FROM posts WHERE id=?", (post_id,))
    owner_row = cursor.fetchone()
    if not owner_row:
        conn.close()
        return jsonify({"message": "المنشور غير موجود"}), 404

    if _is_blocked(cursor, username, owner_row["username"]):
        conn.close()
        return jsonify({"message": "لا يمكن التفاعل مع هذا الحساب"}), 403

    post_owner = owner_row["username"]
    cursor.execute("UPDATE posts SET likes = likes + 1 WHERE id=?", (post_id,))
    if post_owner != username:
        cursor.execute(
            "INSERT INTO notifications (username, message) VALUES (?, ?)",
            (post_owner, "❤️ تم الإعجاب بمنشورك"),
        )
        send_push_to_user(
            cursor,
            post_owner,
            "إعجاب جديد",
            f"{username} أعجب بمنشورك",
            {"type": "like", "post_id": post_id, "screen": "notifications"},
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

    if _is_blocked(cursor, username, owner_row["username"]):
        conn.close()
        return jsonify({"message": "لا يمكن التعليق على هذا المنشور"}), 403

    cursor.execute(
        "INSERT INTO comments (post_id, username, comment) VALUES (?, ?, ?)",
        (post_id, username, comment),
    )
    if owner_row["username"] != username:
        cursor.execute(
            "INSERT INTO notifications (username, message) VALUES (?, ?)",
            (owner_row["username"], "💬 تم التعليق على منشورك"),
        )
        send_push_to_user(
            cursor,
            owner_row["username"],
            "تعليق جديد",
            f"{username} علّق على منشورك",
            {"type": "comment", "post_id": post_id, "screen": "notifications"},
        )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم التعليق", "username": username})


@posts_bp.route("/comments/<int:post_id>", methods=["GET"])
def get_comments(post_id: int):
    current = _logged_in_user()
    conn = get_connection()
    cursor = conn.cursor()

    if current:
        cursor.execute(
            """
            SELECT c.username, c.comment
            FROM comments c
            WHERE c.post_id=?
              AND NOT EXISTS (
                    SELECT 1 FROM blocked_users b
                    WHERE (b.blocker=? AND b.blocked=c.username)
                       OR (b.blocker=c.username AND b.blocked=?)
              )
            ORDER BY c.id ASC
            """,
            (post_id, current, current),
        )
    else:
        cursor.execute(
            "SELECT username, comment FROM comments WHERE post_id=? ORDER BY id ASC",
            (post_id,),
        )

    comments = cursor.fetchall()
    conn.close()

    return jsonify([{"username": comment["username"], "comment": comment["comment"]} for comment in comments])


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
        "SELECT id, message, is_read, created_at FROM notifications WHERE username=? ORDER BY id DESC",
        (target_user,),
    )
    notifications = cursor.fetchall()
    conn.close()

    return jsonify([{
        "id": item["id"],
        "from_user": "",
        "type": "info",
        "message": item["message"],
        "seen": item["is_read"],
        "created_at": item["created_at"],
    } for item in notifications])


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
    cursor.execute("INSERT INTO stories (username, media) VALUES (?, ?)", (username, filename))
    conn.commit()
    conn.close()

    return jsonify({"message": "تم إضافة الستوري", "media": filename})


@posts_bp.route("/stories", methods=["GET"])
def get_stories():
    current = _logged_in_user()
    conn = get_connection()
    cursor = conn.cursor()

    if current:
        cursor.execute(
            """
            SELECT s.username, s.media
            FROM stories s
            WHERE NOT EXISTS (
                SELECT 1 FROM blocked_users b
                WHERE (b.blocker=? AND b.blocked=s.username)
                   OR (b.blocker=s.username AND b.blocked=?)
            )
            ORDER BY s.id DESC
            """,
            (current, current),
        )
    else:
        cursor.execute("SELECT username, media FROM stories ORDER BY id DESC")

    data = cursor.fetchall()
    conn.close()

    return jsonify([{"username": story["username"], "media": story["media"]} for story in data])


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
    reel_id = insert_and_get_id(
        cursor,
        "INSERT INTO reels (username, video) VALUES (?, ?)",
        (username, filename),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم إضافة الريل", "video": filename, "id": reel_id})


@posts_bp.route("/delete_reel/<int:reel_id>", methods=["DELETE"])
def delete_reel(reel_id: int):
    username = _logged_in_user()
    if not username:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username, video FROM reels WHERE id=?", (reel_id,))
    reel = cursor.fetchone()
    if not reel:
        conn.close()
        return jsonify({"message": "الريل غير موجود"}), 404
    if reel["username"] != username:
        conn.close()
        return jsonify({"message": "لا يمكنك حذف هذا الريل"}), 403

    cursor.execute("DELETE FROM reel_likes WHERE reel_id=?", (reel_id,))
    cursor.execute("DELETE FROM reel_comments WHERE reel_id=?", (reel_id,))
    cursor.execute("DELETE FROM reels WHERE id=?", (reel_id,))
    conn.commit()
    conn.close()
    _delete_file_if_exists(reel["video"])

    return jsonify({"message": "تم حذف الريل"})


@posts_bp.route("/reels", methods=["GET"])
def get_reels():
    current_user = _logged_in_user() or ""
    conn = get_connection()
    cursor = conn.cursor()

    if current_user:
        cursor.execute(
            """
            SELECT r.id, r.username, r.video
            FROM reels r
            WHERE NOT EXISTS (
                SELECT 1 FROM blocked_users b
                WHERE (b.blocker=? AND b.blocked=r.username)
                   OR (b.blocker=r.username AND b.blocked=?)
            )
            ORDER BY r.id DESC
            """,
            (current_user, current_user),
        )
    else:
        cursor.execute("SELECT id, username, video FROM reels ORDER BY id DESC")

    data = cursor.fetchall()

    results = []
    for reel in data:
        likes_count, comments_count = _reel_stats(cursor, reel["id"])
        cursor.execute(
            "SELECT 1 AS liked FROM reel_likes WHERE reel_id=? AND username=? LIMIT 1",
            (reel["id"], current_user),
        )
        liked_by_current_user = bool(cursor.fetchone()) if current_user else False
        results.append(
            {
                "id": reel["id"],
                "username": reel["username"],
                "video": reel["video"],
                "video_url": f"{request.host_url.rstrip('/')}/api/uploads/{reel['video']}" if reel["video"] else "",
                "likes": likes_count,
                "comments_count": comments_count,
                "liked_by_current_user": liked_by_current_user,
            }
        )

    conn.close()
    return jsonify(results)


@posts_bp.route("/reels/<int:reel_id>/like", methods=["POST"])
def like_reel(reel_id: int):
    username = _logged_in_user()
    if not username:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM reels WHERE id=?", (reel_id,))
    reel = cursor.fetchone()

    if not reel:
        conn.close()
        return jsonify({"message": "الريل غير موجود"}), 404

    if _is_blocked(cursor, username, reel["username"]):
        conn.close()
        return jsonify({"message": "لا يمكن التفاعل مع هذا الريل"}), 403

    cursor.execute(
        "SELECT id FROM reel_likes WHERE reel_id=? AND username=?",
        (reel_id, username),
    )
    existing = cursor.fetchone()

    if existing:
        cursor.execute("DELETE FROM reel_likes WHERE reel_id=? AND username=?", (reel_id, username))
        liked = False
        message = "تم إلغاء الإعجاب من الريل"
    else:
        cursor.execute("INSERT INTO reel_likes (reel_id, username) VALUES (?, ?)", (reel_id, username))
        if reel["username"] and reel["username"] != username:
            cursor.execute(
                "INSERT INTO notifications (username, message) VALUES (?, ?)",
                (reel["username"], f"🎬 {username} أعجب بالريل الخاص بك"),
            )
        liked = True
        message = "تم الإعجاب بالريل"

    conn.commit()
    likes_count, comments_count = _reel_stats(cursor, reel_id)
    conn.close()

    return jsonify({
        "message": message,
        "liked": liked,
        "likes": likes_count,
        "comments_count": comments_count,
    })


@posts_bp.route("/reels/<int:reel_id>/comment", methods=["POST"])
def add_reel_comment(reel_id: int):
    username = _logged_in_user()
    if not username:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    data = request.get_json(silent=True) or {}
    comment = (data.get("comment") or "").strip()
    if not comment:
        return jsonify({"message": "اكتب تعليقاً أولاً"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM reels WHERE id=?", (reel_id,))
    reel = cursor.fetchone()

    if not reel:
        conn.close()
        return jsonify({"message": "الريل غير موجود"}), 404

    if _is_blocked(cursor, username, reel["username"]):
        conn.close()
        return jsonify({"message": "لا يمكن التعليق على هذا الريل"}), 403

    cursor.execute(
        "INSERT INTO reel_comments (reel_id, username, comment) VALUES (?, ?, ?)",
        (reel_id, username, comment),
    )
    if reel["username"] and reel["username"] != username:
        cursor.execute(
            "INSERT INTO notifications (username, message) VALUES (?, ?)",
            (reel["username"], f"💬 {username} علّق على الريل الخاص بك"),
        )
    conn.commit()
    likes_count, comments_count = _reel_stats(cursor, reel_id)
    conn.close()

    return jsonify({
        "message": "تمت إضافة التعليق على الريل",
        "likes": likes_count,
        "comments_count": comments_count,
    })


@posts_bp.route("/reels/<int:reel_id>/comments", methods=["GET"])
def get_reel_comments(reel_id: int):
    current = _logged_in_user()
    conn = get_connection()
    cursor = conn.cursor()

    if current:
        cursor.execute(
            """
            SELECT rc.id, rc.username, rc.comment, rc.created_at
            FROM reel_comments rc
            WHERE rc.reel_id=?
              AND NOT EXISTS (
                    SELECT 1 FROM blocked_users b
                    WHERE (b.blocker=? AND b.blocked=rc.username)
                       OR (b.blocker=rc.username AND b.blocked=?)
              )
            ORDER BY rc.id ASC
            """,
            (reel_id, current, current),
        )
    else:
        cursor.execute(
            "SELECT id, username, comment, created_at FROM reel_comments WHERE reel_id=? ORDER BY id ASC",
            (reel_id,),
        )

    comments = cursor.fetchall()
    conn.close()

    return jsonify([
        {
            "id": comment["id"],
            "username": comment["username"],
            "comment": comment["comment"],
            "created_at": comment["created_at"],
        }
        for comment in comments
    ])
