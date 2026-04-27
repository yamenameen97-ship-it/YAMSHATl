from flask import Blueprint, jsonify, request, session

from auth_utils import current_user
from models import get_connection
from push_utils import send_push_to_user

friends_bp = Blueprint("friends", __name__)


def _logged_in_user():
    return current_user()


@friends_bp.route("/send_friend_request", methods=["POST"])
def send_friend_request():
    data = request.get_json(silent=True) or {}
    sender = (_logged_in_user() or data.get("sender") or "").strip()
    receiver = (data.get("receiver") or "").strip()

    if not sender or not receiver:
        return jsonify({"message": "بيانات الطلب غير مكتملة"}), 400

    if sender == receiver:
        return jsonify({"message": "لا يمكنك إرسال طلب صداقة لنفسك"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id FROM users WHERE name=?",
        (receiver,),
    )
    if not cursor.fetchone():
        conn.close()
        return jsonify({"message": "المستخدم غير موجود"}), 404

    cursor.execute(
        """
        SELECT id, status, sender, receiver FROM friend_requests
        WHERE (sender=? AND receiver=?) OR (sender=? AND receiver=?)
        ORDER BY id DESC
        LIMIT 1
        """,
        (sender, receiver, receiver, sender),
    )
    existing = cursor.fetchone()

    if existing:
        if existing["status"] == "accepted":
            conn.close()
            return jsonify({"message": "أنتم أصدقاء بالفعل"})

        if existing["sender"] == sender and existing["receiver"] == receiver and existing["status"] == "pending":
            conn.close()
            return jsonify({"message": "تم إرسال الطلب مسبقاً"})

        if existing["sender"] == receiver and existing["receiver"] == sender and existing["status"] == "pending":
            conn.close()
            return jsonify({"message": "لديك طلب وارد من هذا المستخدم بالفعل"})

    cursor.execute(
        "INSERT INTO friend_requests (sender, receiver) VALUES (?, ?)",
        (sender, receiver),
    )
    cursor.execute(
        "INSERT INTO notifications (username, message) VALUES (?, ?)",
        (receiver, f"🤝 {sender} أرسل لك طلب صداقة"),
    )
    send_push_to_user(
        cursor,
        receiver,
        "طلب صداقة جديد",
        f"{sender} أرسل لك طلب صداقة",
        {"type": "friend_request", "from_user": sender, "screen": "notifications"},
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "تم إرسال طلب الصداقة"})


@friends_bp.route("/handle_friend_request", methods=["POST"])
def handle_friend_request():
    data = request.get_json(silent=True) or {}
    request_id = data.get("id")
    status = (data.get("status") or "").strip().lower()
    current_user_name = _logged_in_user()

    if not request_id or status not in {"accepted", "rejected"}:
        return jsonify({"message": "بيانات التحديث غير صحيحة"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, sender, receiver, status FROM friend_requests WHERE id=?",
        (request_id,),
    )
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({"message": "طلب الصداقة غير موجود"}), 404

    if current_user_name and row["receiver"] != current_user_name:
        conn.close()
        return jsonify({"message": "غير مصرح لك بتعديل هذا الطلب"}), 403

    cursor.execute(
        "UPDATE friend_requests SET status=? WHERE id=?",
        (status, request_id),
    )

    if status == "accepted":
        cursor.execute(
            "INSERT INTO notifications (username, message) VALUES (?, ?)",
            (row["sender"], f"✅ {row['receiver']} قبل طلب الصداقة"),
        )
        send_push_to_user(
            cursor,
            row["sender"],
            "تم قبول طلب الصداقة",
            f"{row['receiver']} قبل طلب الصداقة",
            {"type": "friend_request_accepted", "screen": "notifications"},
        )
    else:
        cursor.execute(
            "INSERT INTO notifications (username, message) VALUES (?, ?)",
            (row["sender"], f"❌ {row['receiver']} رفض طلب الصداقة"),
        )
        send_push_to_user(
            cursor,
            row["sender"],
            "تم رفض طلب الصداقة",
            f"{row['receiver']} رفض طلب الصداقة",
            {"type": "friend_request_rejected", "screen": "notifications"},
        )

    conn.commit()
    conn.close()

    return jsonify({"message": "تم التحديث"})


@friends_bp.route("/friend_requests/<username>")
def friend_requests(username):
    target_user = _logged_in_user() or username
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, sender FROM friend_requests
        WHERE receiver=? AND status='pending'
        ORDER BY id DESC
        """,
        (target_user,),
    )

    data = cursor.fetchall()
    conn.close()

    return jsonify([
        {
            "id": row["id"],
            "sender": row["sender"],
        }
        for row in data
    ])


@friends_bp.route("/friends/<username>")
def friends(username):
    target_user = username.strip()
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT sender, receiver FROM friend_requests
        WHERE status='accepted' AND (sender=? OR receiver=?)
        ORDER BY id DESC
        """,
        (target_user, target_user),
    )

    data = cursor.fetchall()
    conn.close()

    result = []
    for row in data:
        friend = row["sender"] if row["sender"] != target_user else row["receiver"]
        result.append(friend)

    return jsonify(result)
