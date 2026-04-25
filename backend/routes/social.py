from flask import Blueprint, jsonify, request, session

from models import get_connection

social_bp = Blueprint("social", __name__)


def _logged_in_user():
    return session.get("user")


@social_bp.route("/follow", methods=["POST"])
def follow():
    follower = _logged_in_user()
    if not follower:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    data = request.get_json(silent=True) or {}
    following = (data.get("following") or "").strip()

    if not following:
        return jsonify({"message": "بيانات المتابعة غير مكتملة"}), 400

    if follower == following:
        return jsonify({"message": "لا يمكنك متابعة نفسك"}), 400

    conn = get_connection()
    cursor = conn.cursor()

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
        action = "تمت المتابعة"

    conn.commit()
    conn.close()

    return jsonify({"message": action})


@social_bp.route("/followers/<username>", methods=["GET"])
def followers(username: str):
    conn = get_connection()
    cursor = conn.cursor()

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
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, username, content, likes FROM posts WHERE username=? ORDER BY id DESC",
        (username,),
    )
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


@social_bp.route("/users", methods=["GET"])
def get_users():
    current = _logged_in_user()
    conn = get_connection()
    cursor = conn.cursor()

    if current:
        cursor.execute("SELECT name, email FROM users WHERE name != ? ORDER BY id DESC", (current,))
    else:
        cursor.execute("SELECT name, email FROM users ORDER BY id DESC")

    users = cursor.fetchall()
    conn.close()

    return jsonify([
        {"name": user["name"], "email": user["email"]}
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
    cursor.execute(
        "INSERT INTO messages (sender, receiver, message) VALUES (?, ?, ?)",
        (sender, receiver, message),
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
        WHERE sender=? OR receiver=?
        ORDER BY id DESC
        """,
        (current, current, current),
    )
    rows = cursor.fetchall()
    conn.close()

    return jsonify([{"name": row["contact"]} for row in rows if row["contact"]])
