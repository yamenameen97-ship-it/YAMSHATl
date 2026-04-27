from flask import Blueprint, jsonify, request

from auth_utils import current_user
from models import get_connection
from push_utils import send_push_to_user, store_user_device_token

mobile_compat_bp = Blueprint("mobile_compat", __name__)


@mobile_compat_bp.route("/save_device_token", methods=["POST"])
def save_device_token():
    user = current_user()
    if not user:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    data = request.get_json(silent=True) or {}
    token = (data.get("token") or "").strip()
    platform = (data.get("platform") or "android").strip() or "android"
    app_version = (data.get("app_version") or "").strip()
    if not token:
        return jsonify({"message": "رمز الجهاز غير صالح"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET fcm_token=? WHERE name=?", (token, user))
    store_user_device_token(cursor, user, token, platform=platform, app_version=app_version)
    conn.commit()
    conn.close()
    return jsonify({"ok": True, "message": "تم حفظ رمز الجهاز"})


@mobile_compat_bp.route("/track", methods=["POST"])
def track_event():
    user = current_user() or "guest"
    data = request.get_json(silent=True) or {}
    event = (data.get("event") or "").strip()
    if not event:
        return jsonify({"ok": True, "message": "لا يوجد حدث للتسجيل"})

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO analytics ("user", event) VALUES (?, ?)', (user, event))
    conn.commit()
    conn.close()
    return jsonify({"ok": True, "message": "تم تسجيل الحدث"})


@mobile_compat_bp.route("/post", methods=["POST"])
def legacy_add_post():
    user = current_user()
    if not user:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    media = (data.get("media") or "").strip()
    if not content and not media:
        return jsonify({"message": "لا يمكن نشر محتوى فارغ"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO posts (username, content, media) VALUES (?, ?, ?)", (user, content, media))
    conn.commit()
    conn.close()
    return jsonify({"ok": True, "message": "تم النشر"})


@mobile_compat_bp.route("/messages", methods=["GET"])
def legacy_messages():
    user = current_user()
    if not user:
        return jsonify([])

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
        (user, receiver, receiver, user),
    )
    rows = cursor.fetchall()
    conn.close()
    return jsonify([
        {
            "sender": row["sender"],
            "receiver": row["receiver"],
            "message": row["message"],
            "created_at": row["created_at"],
        }
        for row in rows
    ])


@mobile_compat_bp.route("/like", methods=["POST"])
def legacy_like():
    user = current_user()
    if not user:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    data = request.get_json(silent=True) or {}
    post_id = int(data.get("post_id") or 0)
    if not post_id:
        return jsonify({"message": "معرّف المنشور غير صالح"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM posts WHERE id=?", (post_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"message": "المنشور غير موجود"}), 404

    cursor.execute("UPDATE posts SET likes = COALESCE(likes, 0) + 1 WHERE id=?", (post_id,))
    if row["username"] != user:
        cursor.execute(
            "INSERT INTO notifications (username, message) VALUES (?, ?)",
            (row["username"], f"❤️ {user} أعجب بمنشورك"),
        )
        send_push_to_user(
            cursor,
            row["username"],
            "إعجاب جديد",
            f"{user} أعجب بمنشورك",
            {"type": "like", "post_id": post_id, "screen": "notifications"},
        )
    conn.commit()
    conn.close()
    return jsonify({"ok": True, "message": "تم الإعجاب"})


@mobile_compat_bp.route("/comment", methods=["POST"])
def legacy_comment():
    user = current_user()
    if not user:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    data = request.get_json(silent=True) or {}
    post_id = int(data.get("post_id") or 0)
    comment = (data.get("comment") or "").strip()
    if not post_id or not comment:
        return jsonify({"message": "بيانات التعليق غير مكتملة"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM posts WHERE id=?", (post_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"message": "المنشور غير موجود"}), 404

    cursor.execute("INSERT INTO comments (post_id, username, comment) VALUES (?, ?, ?)", (post_id, user, comment))
    if row["username"] != user:
        cursor.execute(
            "INSERT INTO notifications (username, message) VALUES (?, ?)",
            (row["username"], f"💬 {user} علّق على منشورك"),
        )
        send_push_to_user(
            cursor,
            row["username"],
            "تعليق جديد",
            f"{user} علّق على منشورك",
            {"type": "comment", "post_id": post_id, "screen": "notifications"},
        )
    conn.commit()
    conn.close()
    return jsonify({"ok": True, "message": "تم التعليق"})
