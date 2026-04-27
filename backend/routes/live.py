import json
import uuid

from flask import Blueprint, jsonify, request, session

from auth_utils import current_user
from models import get_connection, insert_and_get_id, recent_timestamp_condition
from push_utils import send_push_to_users

live_bp = Blueprint("live", __name__)
RECENT_VIEWER_THRESHOLD = recent_timestamp_condition("last_seen", 35)


def _logged_in_user():
    return current_user()


def _host_key(room_id: int) -> str:
    return f"host:{room_id}"


def _get_room(cursor, room_id: int):
    cursor.execute(
        "SELECT id, username, title, status FROM live_rooms WHERE id=?",
        (room_id,),
    )
    return cursor.fetchone()


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

    room_id = insert_and_get_id(
        cursor,
        "INSERT INTO live_rooms (username, title) VALUES (?, ?)",
        (username, title),
    )
    cursor.execute(
        "INSERT INTO live_messages (room_id, username, message) VALUES (?, ?, ?)",
        (room_id, username, "بدأ البث المباشر الآن"),
    )
    cursor.execute(
        "SELECT follower FROM follows WHERE following=? ORDER BY id DESC",
        (username,),
    )
    followers = [row["follower"] for row in cursor.fetchall() if row["follower"] != username]
    for follower in followers:
        cursor.execute(
            "INSERT INTO notifications (username, message) VALUES (?, ?)",
            (follower, f"🔴 {username} بدأ بثاً مباشراً بعنوان: {title}"),
        )
    send_push_to_users(
        cursor,
        followers,
        "بث مباشر الآن",
        f"{username} بدأ بثاً مباشراً: {title}",
        {"type": "live", "room_id": room_id, "screen": "live"},
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم بدء البث الحقيقي داخل المتصفح", "room_id": room_id})


@live_bp.route("/live_rooms")
def live_rooms():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        f"""
        SELECT lr.id, lr.username, lr.title,
               (
                 SELECT COUNT(*)
                 FROM live_viewers lv
                 WHERE lv.room_id = lr.id
                   AND {RECENT_VIEWER_THRESHOLD}
               ) AS viewer_count
        FROM live_rooms lr
        WHERE lr.status='live'
        ORDER BY lr.id DESC
        """
    )
    rows = cursor.fetchall()
    conn.close()

    return jsonify([
        {
            "id": row["id"],
            "username": row["username"],
            "title": row["title"],
            "viewer_count": row["viewer_count"],
        }
        for row in rows
    ])


@live_bp.route("/live_room/<int:room_id>")
def live_room(room_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    room = _get_room(cursor, room_id)
    if not room:
        conn.close()
        return jsonify({"message": "غرفة البث غير موجودة"}), 404

    cursor.execute(
        f"SELECT COUNT(*) AS total FROM live_viewers WHERE room_id=? AND {RECENT_VIEWER_THRESHOLD}",
        (room_id,),
    )
    viewer_count = cursor.fetchone()["total"]
    conn.close()

    return jsonify(
        {
            "id": room["id"],
            "username": room["username"],
            "title": room["title"],
            "status": room["status"],
            "viewer_count": viewer_count,
            "host_target": _host_key(room_id),
        }
    )


@live_bp.route("/end_live/<int:room_id>", methods=["POST"])
def end_live(room_id):
    current_user = _logged_in_user()
    if not current_user:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    conn = get_connection()
    cursor = conn.cursor()
    room = _get_room(cursor, room_id)

    if not room:
        conn.close()
        return jsonify({"message": "غرفة البث غير موجودة"}), 404

    if room["username"] != current_user:
        conn.close()
        return jsonify({"message": "لا يمكنك إنهاء هذا البث"}), 403

    cursor.execute("UPDATE live_rooms SET status='ended' WHERE id=?", (room_id,))
    cursor.execute(
        "INSERT INTO live_messages (room_id, username, message) VALUES (?, ?, ?)",
        (room_id, current_user, "تم إنهاء البث"),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم إنهاء البث"})


@live_bp.route("/live_viewer_join", methods=["POST"])
def live_viewer_join():
    username = _logged_in_user()
    if not username:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    data = request.get_json(silent=True) or {}
    room_id = int(data.get("room_id") or 0)
    if not room_id:
        return jsonify({"message": "رقم الغرفة غير صالح"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    room = _get_room(cursor, room_id)
    if not room or room["status"] != "live":
        conn.close()
        return jsonify({"message": "هذا البث غير متاح حالياً"}), 404

    if room["username"] == username:
        conn.close()
        return jsonify({"message": "صاحب البث لا يحتاج للانضمام كمشاهد", "role": "host", "room_id": room_id})

    viewer_token = f"viewer:{uuid.uuid4().hex}"
    cursor.execute(
        "INSERT INTO live_viewers (room_id, viewer_token, username) VALUES (?, ?, ?)",
        (room_id, viewer_token, username),
    )
    cursor.execute(
        "INSERT INTO live_messages (room_id, username, message) VALUES (?, ?, ?)",
        (room_id, username, "انضم إلى البث")
    )
    conn.commit()
    conn.close()

    return jsonify({
        "message": "تم الانضمام إلى البث",
        "role": "viewer",
        "viewer_token": viewer_token,
        "room_id": room_id,
        "host_target": _host_key(room_id),
    })


@live_bp.route("/live_viewer_ping", methods=["POST"])
def live_viewer_ping():
    username = _logged_in_user()
    if not username:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    data = request.get_json(silent=True) or {}
    room_id = int(data.get("room_id") or 0)
    viewer_token = (data.get("viewer_token") or "").strip()
    if not room_id or not viewer_token:
        return jsonify({"message": "بيانات المشاهد غير مكتملة"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE live_viewers SET last_seen=CURRENT_TIMESTAMP WHERE room_id=? AND viewer_token=? AND username=?",
        (room_id, viewer_token, username),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم تحديث حالة المشاهد"})


@live_bp.route("/live_viewers/<int:room_id>")
def live_viewers(room_id: int):
    current_user = _logged_in_user()
    if not current_user:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    conn = get_connection()
    cursor = conn.cursor()
    room = _get_room(cursor, room_id)
    if not room:
        conn.close()
        return jsonify({"message": "غرفة البث غير موجودة"}), 404

    if room["username"] != current_user:
        conn.close()
        return jsonify({"message": "هذه القائمة متاحة لصاحب البث فقط"}), 403

    cursor.execute(
        f"""
        SELECT viewer_token, username, last_seen
        FROM live_viewers
        WHERE room_id=? AND {RECENT_VIEWER_THRESHOLD}
        ORDER BY id ASC
        """,
        (room_id,),
    )
    rows = cursor.fetchall()
    conn.close()

    return jsonify([
        {
            "viewer_token": row["viewer_token"],
            "username": row["username"],
            "last_seen": row["last_seen"],
        }
        for row in rows
    ])


@live_bp.route("/live_signal", methods=["POST"])
def live_signal():
    current_user = _logged_in_user()
    if not current_user:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    data = request.get_json(silent=True) or {}
    room_id = int(data.get("room_id") or 0)
    sender = (data.get("sender") or "").strip()
    target = (data.get("target") or "").strip()
    signal_type = (data.get("signal_type") or "").strip()
    signal_data = data.get("data")

    if not room_id or not sender or not target or not signal_type:
        return jsonify({"message": "إشارة البث غير مكتملة"}), 400

    payload = json.dumps(signal_data or {}, ensure_ascii=False)

    conn = get_connection()
    cursor = conn.cursor()
    room = _get_room(cursor, room_id)
    if not room or room["status"] != "live":
        conn.close()
        return jsonify({"message": "هذا البث غير متاح حالياً"}), 404

    cursor.execute(
        "INSERT INTO live_signals (room_id, sender, target, signal_type, data) VALUES (?, ?, ?, ?, ?)",
        (room_id, sender, target, signal_type, payload),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم إرسال إشارة البث"})


@live_bp.route("/live_signals/<int:room_id>")
def live_signals(room_id: int):
    current_user = _logged_in_user()
    if not current_user:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    target = (request.args.get("target") or "").strip()
    after_id = int(request.args.get("after_id") or 0)
    if not target:
        return jsonify([])

    conn = get_connection()
    cursor = conn.cursor()
    room = _get_room(cursor, room_id)
    if not room or room["status"] != "live":
        conn.close()
        return jsonify([])

    cursor.execute(
        """
        SELECT id, sender, target, signal_type, data, created_at
        FROM live_signals
        WHERE room_id=? AND target=? AND id>?
        ORDER BY id ASC
        LIMIT 100
        """,
        (room_id, target, after_id),
    )
    rows = cursor.fetchall()
    conn.close()

    results = []
    for row in rows:
        try:
            payload = json.loads(row["data"])
        except json.JSONDecodeError:
            payload = row["data"]
        results.append(
            {
                "id": row["id"],
                "sender": row["sender"],
                "target": row["target"],
                "signal_type": row["signal_type"],
                "data": payload,
                "created_at": row["created_at"],
            }
        )
    return jsonify(results)


@live_bp.route("/live_message", methods=["POST"])
def live_message():
    current_user = _logged_in_user()
    if not current_user:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    data = request.get_json(silent=True) or {}
    room_id = int(data.get("room_id") or 0)
    message = (data.get("message") or "").strip()
    if not room_id or not message:
        return jsonify({"message": "رسالة البث غير مكتملة"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    room = _get_room(cursor, room_id)
    if not room:
        conn.close()
        return jsonify({"message": "غرفة البث غير موجودة"}), 404

    cursor.execute(
        "INSERT INTO live_messages (room_id, username, message) VALUES (?, ?, ?)",
        (room_id, current_user, message),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم إرسال الرسالة"})


@live_bp.route("/live_messages/<int:room_id>")
def live_messages(room_id: int):
    after_id = int(request.args.get("after_id") or 0)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, username, message, created_at
        FROM live_messages
        WHERE room_id=? AND id>?
        ORDER BY id ASC
        LIMIT 100
        """,
        (room_id, after_id),
    )
    rows = cursor.fetchall()
    conn.close()

    return jsonify([
        {
            "id": row["id"],
            "username": row["username"],
            "message": row["message"],
            "created_at": row["created_at"],
        }
        for row in rows
    ])
