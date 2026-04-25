from flask import Blueprint, jsonify, request, session

from models import get_connection

live_bp = Blueprint("live", __name__)


def _logged_in_user():
    return session.get("user")


@live_bp.route("/create_live", methods=["POST"])
def create_live():
    data = request.get_json(silent=True) or {}
    username = (_logged_in_user() or data.get("username") or "").strip()
    title = (data.get("title") or "").strip()

    if not username or not title:
        return jsonify({"message": "بيانات البث غير مكتملة"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id FROM live_rooms WHERE username=? AND status='live' ORDER BY id DESC LIMIT 1",
        (username,),
    )
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return jsonify({"message": "لديك بث مباشر نشط بالفعل", "room_id": existing["id"]})

    cursor.execute(
        "INSERT INTO live_rooms (username, title) VALUES (?, ?)",
        (username, title),
    )
    room_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({"message": "تم بدء البث", "room_id": room_id})


@live_bp.route("/live_rooms")
def live_rooms():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, username, title FROM live_rooms WHERE status='live' ORDER BY id DESC"
    )
    rows = cursor.fetchall()
    conn.close()

    return jsonify([
        {
            "id": row["id"],
            "username": row["username"],
            "title": row["title"],
        }
        for row in rows
    ])


@live_bp.route("/end_live/<int:room_id>", methods=["POST"])
def end_live(room_id):
    current_user = _logged_in_user()
    if not current_user:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT username FROM live_rooms WHERE id=?",
        (room_id,),
    )
    room = cursor.fetchone()

    if not room:
        conn.close()
        return jsonify({"message": "غرفة البث غير موجودة"}), 404

    if room["username"] != current_user:
        conn.close()
        return jsonify({"message": "لا يمكنك إنهاء هذا البث"}), 403

    cursor.execute(
        "UPDATE live_rooms SET status='ended' WHERE id=?",
        (room_id,),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم إنهاء البث"})
