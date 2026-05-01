from pathlib import Path
from urllib.parse import urlparse

from flask import Blueprint, jsonify, request

from auth_utils import current_user, current_email
from models import UPLOAD_FOLDER, USE_POSTGRES, get_connection, recent_timestamp_condition
from push_utils import send_push_to_user

social_bp = Blueprint("social", __name__)


def _logged_in_user():
    return current_user()


def _is_blocked(cursor, user_a: str, user_b: str) -> bool:
    if not user_a or not user_b:
        return False
    cursor.execute(
        """
        SELECT 1 FROM blocked_users
        WHERE (blocker=? AND blocked=?) OR (blocker=? AND blocked=?)
        LIMIT 1
        """,
        (user_a, user_b, user_b, user_a),
    )
    return bool(cursor.fetchone())


def _ensure_not_blocked(cursor, current: str, other: str):
    if _is_blocked(cursor, current, other):
        return jsonify({"message": "لا يمكن تنفيذ هذا الإجراء بسبب الحظر بين الحسابين"}), 403
    return None


def _is_admin() -> bool:
    active_user = (current_user() or "").strip().lower()
    active_email = (current_email() or "").strip().lower()
    return active_user in {"admin", "adminyamen"} or active_email.startswith("admin")


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


def _count_rows(cursor, table: str, where_clause: str = "", params: tuple = ()) -> int:
    query = f"SELECT COUNT(*) AS total FROM {table}"
    if where_clause:
        query += f" WHERE {where_clause}"
    cursor.execute(query, params)
    return int(cursor.fetchone()["total"] or 0)


def _activity_window(column: str, days: int) -> str:
    return recent_timestamp_condition(column, max(int(days), 1) * 86400)


def _activity_snapshot(cursor, days: int) -> dict:
    posts_window = _activity_window("created_at", days)
    comments_window = _activity_window("created_at", days)
    messages_window = _activity_window("created_at", days)
    reports_window = _activity_window("created_at", days)
    users_window = _activity_window("created_at", days)

    snapshot = {
        "users": _count_rows(cursor, "users", users_window),
        "posts": _count_rows(cursor, "posts", posts_window),
        "comments": _count_rows(cursor, "comments", comments_window),
        "messages": _count_rows(cursor, "messages", messages_window),
        "reports": _count_rows(cursor, "reports", reports_window),
    }

    cursor.execute(
        f"""
        SELECT COUNT(DISTINCT actor) AS total
        FROM (
            SELECT username AS actor FROM posts WHERE {posts_window}
            UNION ALL
            SELECT username AS actor FROM comments WHERE {comments_window}
            UNION ALL
            SELECT sender AS actor FROM messages WHERE {messages_window}
            UNION ALL
            SELECT receiver AS actor FROM messages WHERE {messages_window}
            UNION ALL
            SELECT reporter AS actor FROM reports WHERE {reports_window}
        ) activity
        WHERE actor IS NOT NULL AND TRIM(actor) != ''
        """
    )
    snapshot["active_users"] = int(cursor.fetchone()["total"] or 0)
    return snapshot


def _top_users(cursor, table: str, user_column: str, days: int, limit: int = 5, date_column: str = "created_at") -> list:
    cursor.execute(
        f"""
        SELECT {user_column} AS username, COUNT(*) AS total
        FROM {table}
        WHERE {_activity_window(date_column, days)}
          AND {user_column} IS NOT NULL
          AND TRIM({user_column}) != ''
        GROUP BY {user_column}
        ORDER BY total DESC, username ASC
        LIMIT {int(limit)}
        """
    )
    return [
        {"username": row["username"], "total": int(row["total"] or 0)}
        for row in cursor.fetchall()
    ]


@social_bp.route("/follow", methods=["POST"])
def follow():
    follower = _logged_in_user()
    if not follower:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    data = request.get_json(silent=True) or {}
    following = (data.get("following") or data.get("to_user") or "").strip()

    if not following:
        return jsonify({"message": "بيانات المتابعة غير مكتملة"}), 400

    if follower == following:
        return jsonify({"message": "لا يمكنك متابعة نفسك"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    blocked_response = _ensure_not_blocked(cursor, follower, following)
    if blocked_response:
        conn.close()
        return blocked_response

    cursor.execute(
        "SELECT id FROM follows WHERE follower=? AND following=?",
        (follower, following),
    )
    exists = cursor.fetchone()

    if exists:
        cursor.execute(
            "DELETE FROM follows WHERE follower=? AND following=?",
            (follower, following),
        )
        action = "تم إلغاء المتابعة"
    else:
        cursor.execute(
            "INSERT INTO follows (follower, following) VALUES (?, ?)",
            (follower, following),
        )
        cursor.execute(
            "INSERT INTO notifications (username, message) VALUES (?, ?)",
            (following, f"➕ {follower} بدأ بمتابعتك"),
        )
        send_push_to_user(
            cursor,
            following,
            "متابع جديد",
            f"{follower} بدأ بمتابعتك",
            {"type": "follow", "from_user": follower, "screen": "notifications"},
        )
        action = "تمت المتابعة"

    conn.commit()
    conn.close()

    return jsonify({"message": action})


@social_bp.route("/followers/<username>", methods=["GET"])
def followers(username: str):
    current = _logged_in_user()
    conn = get_connection()
    cursor = conn.cursor()

    if current and _is_blocked(cursor, current, username):
        conn.close()
        return jsonify({"followers": 0, "following": 0, "blocked": True})

    cursor.execute("SELECT COUNT(*) AS total FROM follows WHERE following=?", (username,))
    followers_count = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) AS total FROM follows WHERE follower=?", (username,))
    following_count = cursor.fetchone()["total"]

    conn.close()

    return jsonify({
        "followers": followers_count,
        "following": following_count,
    })


@social_bp.route("/user_posts/<username>", methods=["GET"])
def user_posts(username: str):
    current = _logged_in_user()
    conn = get_connection()
    cursor = conn.cursor()

    if current and _is_blocked(cursor, current, username):
        conn.close()
        return jsonify({"message": "هذا الحساب غير متاح لك حالياً"}), 403

    cursor.execute(
        "SELECT id, username, content, media, likes FROM posts WHERE username=? ORDER BY id DESC",
        (username,),
    )
    posts = cursor.fetchall()
    conn.close()

    return jsonify([
        {
            "id": post["id"],
            "username": post["username"],
            "content": post["content"],
            "media": post["media"],
            "likes": post["likes"],
        }
        for post in posts
    ])


@social_bp.route("/users", methods=["GET"])
def get_users():
    current = _logged_in_user()
    conn = get_connection()
    cursor = conn.cursor()

    if current:
        cursor.execute(
            """
            SELECT name FROM users
            WHERE name != ?
              AND NOT EXISTS (
                SELECT 1 FROM blocked_users b
                WHERE (b.blocker=? AND b.blocked=users.name)
                   OR (b.blocker=users.name AND b.blocked=?)
              )
            ORDER BY id DESC
            """,
            (current, current, current),
        )
    else:
        cursor.execute("SELECT name FROM users ORDER BY id DESC")

    users = cursor.fetchall()
    conn.close()

    return jsonify([
        {"name": user["name"]}
        for user in users
    ])


@social_bp.route("/send_message", methods=["POST"])
def send_message():
    sender = _logged_in_user()
    if not sender:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    data = request.get_json(silent=True) or {}
    receiver = (data.get("receiver") or "").strip()
    message = (data.get("message") or "").strip()

    if not receiver or not message:
        return jsonify({"message": "بيانات الرسالة غير مكتملة"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    blocked_response = _ensure_not_blocked(cursor, sender, receiver)
    if blocked_response:
        conn.close()
        return blocked_response

    cursor.execute(
        "INSERT INTO messages (sender, receiver, message) VALUES (?, ?, ?)",
        (sender, receiver, message),
    )
    cursor.execute(
        "INSERT INTO notifications (username, message) VALUES (?, ?)",
        (receiver, f"📩 رسالة جديدة من {sender}"),
    )
    send_push_to_user(
        cursor,
        receiver,
        "رسالة جديدة",
        f"{sender}: {message[:80]}",
        {"type": "message", "from_user": sender, "screen": "chat"},
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم إرسال الرسالة"})


@social_bp.route("/get_messages", methods=["GET"])
def get_messages():
    sender = _logged_in_user()
    if not sender:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    receiver = (request.args.get("receiver") or "").strip()
    if not receiver:
        return jsonify([])

    conn = get_connection()
    cursor = conn.cursor()
    blocked_response = _ensure_not_blocked(cursor, sender, receiver)
    if blocked_response:
        conn.close()
        return blocked_response

    cursor.execute(
        """
        SELECT sender, receiver, message, created_at FROM messages
        WHERE (sender=? AND receiver=?)
           OR (sender=? AND receiver=?)
        ORDER BY id ASC
        """,
        (sender, receiver, receiver, sender),
    )
    data = cursor.fetchall()
    conn.close()

    return jsonify([
        {
            "sender": message["sender"],
            "receiver": message["receiver"],
            "message": message["message"],
            "created_at": message["created_at"],
        }
        for message in data
    ])


@social_bp.route("/chat_threads", methods=["GET"])
def chat_threads():
    current = _logged_in_user()
    if not current:
        return jsonify([])

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT DISTINCT
            CASE WHEN sender=? THEN receiver ELSE sender END AS contact
        FROM messages
        WHERE (sender=? OR receiver=?)
          AND NOT EXISTS (
                SELECT 1 FROM blocked_users b
                WHERE (b.blocker=? AND b.blocked=CASE WHEN sender=? THEN receiver ELSE sender END)
                   OR (b.blocker=CASE WHEN sender=? THEN receiver ELSE sender END AND b.blocked=?)
          )
        ORDER BY id DESC
        """,
        (current, current, current, current, current, current, current),
    )
    rows = cursor.fetchall()
    conn.close()

    return jsonify([{"name": row["contact"]} for row in rows if row["contact"]])


@social_bp.route("/block_user", methods=["POST"])
def block_user():
    blocker = _logged_in_user()
    if not blocker:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    data = request.get_json(silent=True) or {}
    blocked = (data.get("username") or "").strip()
    if not blocked:
        return jsonify({"message": "اسم المستخدم غير صالح"}), 400
    if blocked == blocker:
        return jsonify({"message": "لا يمكنك حظر نفسك"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR IGNORE INTO blocked_users (blocker, blocked) VALUES (?, ?)",
        (blocker, blocked),
    )
    cursor.execute(
        "DELETE FROM follows WHERE (follower=? AND following=?) OR (follower=? AND following=?)",
        (blocker, blocked, blocked, blocker),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم حظر المستخدم"})


@social_bp.route("/report", methods=["POST"])
def report_content():
    reporter = _logged_in_user()
    if not reporter:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    data = request.get_json(silent=True) or {}
    target_type = (data.get("target_type") or "").strip()
    target_value = str(data.get("target_value") or "").strip()
    reason = (data.get("reason") or "").strip()

    if not target_type or not target_value or not reason:
        return jsonify({"message": "بيانات التبليغ غير مكتملة"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO reports (reporter, target_type, target_value, reason) VALUES (?, ?, ?, ?)",
        (reporter, target_type, target_value, reason),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم إرسال البلاغ للإدارة"})


@social_bp.route("/search", methods=["GET"])
def search():
    current = _logged_in_user()
    query = (request.args.get("q") or "").strip()
    if not query:
        return jsonify({"users": [], "posts": []})

    like_query = f"%{query}%"
    conn = get_connection()
    cursor = conn.cursor()

    if current:
        cursor.execute(
            """
            SELECT name FROM users
            WHERE (name LIKE ? OR email LIKE ?)
              AND name != ?
              AND NOT EXISTS (
                    SELECT 1 FROM blocked_users b
                    WHERE (b.blocker=? AND b.blocked=users.name)
                       OR (b.blocker=users.name AND b.blocked=?)
              )
            ORDER BY id DESC
            LIMIT 12
            """,
            (like_query, like_query, current, current, current),
        )
        users = cursor.fetchall()

        cursor.execute(
            """
            SELECT p.id, p.username, p.content, p.likes
            FROM posts p
            WHERE (p.username LIKE ? OR p.content LIKE ?)
              AND NOT EXISTS (
                    SELECT 1 FROM blocked_users b
                    WHERE (b.blocker=? AND b.blocked=p.username)
                       OR (b.blocker=p.username AND b.blocked=?)
              )
            ORDER BY p.id DESC
            LIMIT 12
            """,
            (like_query, like_query, current, current),
        )
        posts = cursor.fetchall()
    else:
        cursor.execute(
            "SELECT name FROM users WHERE name LIKE ? OR email LIKE ? ORDER BY id DESC LIMIT 12",
            (like_query, like_query),
        )
        users = cursor.fetchall()
        cursor.execute(
            "SELECT id, username, content, likes FROM posts WHERE username LIKE ? OR content LIKE ? ORDER BY id DESC LIMIT 12",
            (like_query, like_query),
        )
        posts = cursor.fetchall()

    conn.close()

    return jsonify(
        {
            "users": [{"name": row["name"]} for row in users],
            "posts": [
                {
                    "id": row["id"],
                    "username": row["username"],
                    "content": row["content"],
                    "likes": row["likes"],
                }
                for row in posts
            ],
        }
    )


@social_bp.route("/admin_remove_post/<int:post_id>", methods=["POST"])
def admin_remove_post(post_id: int):
    if not _is_admin():
        return jsonify({"message": "هذا الإجراء متاح للمشرف فقط"}), 403

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT media FROM posts WHERE id=?", (post_id,))
    post = cursor.fetchone()
    if not post:
        conn.close()
        return jsonify({"message": "المنشور غير موجود"}), 404

    filename = _extract_upload_filename(post["media"])
    cursor.execute("DELETE FROM comments WHERE post_id=?", (post_id,))
    cursor.execute("DELETE FROM reports WHERE target_type='post' AND target_value=?", (str(post_id),))
    cursor.execute("DELETE FROM posts WHERE id=?", (post_id,))
    conn.commit()
    conn.close()
    _delete_file_if_exists(filename)

    return jsonify({"message": "تم حذف المنشور من لوحة الإدارة"})


@social_bp.route("/admin_dismiss_report/<int:report_id>", methods=["POST"])
def admin_dismiss_report(report_id: int):
    if not _is_admin():
        return jsonify({"message": "هذا الإجراء متاح للمشرف فقط"}), 403

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM reports WHERE id=?", (report_id,))
    conn.commit()
    changed = getattr(cursor, "rowcount", 0)
    conn.close()
    if not changed:
        return jsonify({"message": "البلاغ غير موجود"}), 404
    return jsonify({"message": "تمت أرشفة البلاغ"})


@social_bp.route("/admin_overview", methods=["GET"])
def admin_overview():
    if not _is_admin():
        return jsonify({"message": "لوحة الإدارة متاحة للمشرف فقط"}), 403

    conn = get_connection()
    cursor = conn.cursor()

    stats = {
        "users": _count_rows(cursor, "users"),
        "posts": _count_rows(cursor, "posts"),
        "comments": _count_rows(cursor, "comments"),
        "messages": _count_rows(cursor, "messages"),
        "reels": _count_rows(cursor, "reels"),
        "reports": _count_rows(cursor, "reports"),
        "live_rooms": _count_rows(cursor, "live_rooms"),
        "follows": _count_rows(cursor, "follows"),
    }

    cursor.execute(
        "SELECT id, reporter, target_type, target_value, reason, created_at FROM reports ORDER BY id DESC LIMIT 20"
    )
    reports = cursor.fetchall()

    cursor.execute(
        "SELECT id, username, content, likes, media, created_at FROM posts ORDER BY id DESC LIMIT 12"
    )
    recent_posts = cursor.fetchall()

    cursor.execute(
        "SELECT id, name, email, created_at FROM users ORDER BY id DESC LIMIT 12"
    )
    recent_users = cursor.fetchall()

    leaderboards = {
        "commenters": _top_users(cursor, "comments", "username", 30),
        "posters": _top_users(cursor, "posts", "username", 30),
        "messengers": _top_users(cursor, "messages", "sender", 30),
    }

    activity = {
        "day": _activity_snapshot(cursor, 1),
        "month": _activity_snapshot(cursor, 30),
    }

    conn.close()

    return jsonify(
        {
            "stats": stats,
            "activity": activity,
            "leaderboards": leaderboards,
            "reports": [
                {
                    "id": row["id"],
                    "reporter": row["reporter"],
                    "target_type": row["target_type"],
                    "target_value": row["target_value"],
                    "reason": row["reason"],
                    "created_at": row["created_at"],
                }
                for row in reports
            ],
            "recent_posts": [
                {
                    "id": row["id"],
                    "username": row["username"],
                    "content": row["content"],
                    "likes": row["likes"],
                    "media": row["media"],
                    "created_at": row["created_at"],
                }
                for row in recent_posts
            ],
            "recent_users": [
                {
                    "id": row["id"],
                    "name": row["name"],
                    "email": row["email"],
                    "created_at": row["created_at"],
                }
                for row in recent_users
            ],
            "system": {
                "db_engine": "postgres" if USE_POSTGRES else "sqlite",
                "tracking_window_day": "آخر 24 ساعة",
                "tracking_window_month": "آخر 30 يوم",
            },
        }
    )
