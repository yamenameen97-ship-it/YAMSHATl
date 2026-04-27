from flask import Blueprint, jsonify, request, session

from auth_utils import create_token, current_email, current_user
from models import get_connection, hash_password

auth_bp = Blueprint("auth", __name__)


def _rename_user_references(cursor, old_name: str, new_name: str) -> None:
    updates = [
        ("users", "name"),
        ("posts", "username"),
        ("comments", "username"),
        ("follows", "follower"),
        ("follows", "following"),
        ("notifications", "username"),
        ("stories", "username"),
        ("reels", "username"),
        ("reel_likes", "username"),
        ("reel_comments", "username"),
        ("messages", "sender"),
        ("messages", "receiver"),
        ("friend_requests", "sender"),
        ("friend_requests", "receiver"),
        ("groups", "owner"),
        ("group_members", "username"),
        ("group_posts", "username"),
        ("live_rooms", "username"),
        ("live_messages", "username"),
        ("live_viewers", "username"),
        ("blocked_users", "blocker"),
        ("blocked_users", "blocked"),
        ("reports", "reporter"),
    ]

    for table, column in updates:
        cursor.execute(
            f"UPDATE {table} SET {column}=? WHERE {column}=?",
            (new_name, old_name),
        )


def _normalize_name(data):
    return (data.get("name") or data.get("username") or data.get("user") or "").strip()


def _normalize_email(data, fallback_name: str = ""):
    email = (data.get("email") or "").strip()
    if email:
        return email
    if fallback_name:
        safe = fallback_name.replace(" ", "_")
        return f"{safe}@mobile.local"
    return ""


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name = _normalize_name(data)
    email = _normalize_email(data, name)
    password = (data.get("password") or "").strip()

    if not name or not password:
        return jsonify({"message": "يرجى إدخال الاسم وكلمة المرور"}), 400

    if not email:
        return jsonify({"message": "تعذر تجهيز بريد لهذا الحساب"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email=?", (email,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"message": "هذا الحساب مسجل بالفعل"}), 409

    cursor.execute("SELECT id FROM users WHERE name=?", (name,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"message": "اسم المستخدم مستخدم بالفعل"}), 409

    cursor.execute(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        (name, email, hash_password(password)),
    )
    conn.commit()
    conn.close()

    session.clear()
    session.permanent = True
    session["user"] = name
    session["email"] = email
    token = create_token(name, email)

    return jsonify({
        "ok": True,
        "message": "تم التسجيل بنجاح",
        "user": name,
        "email": email,
        "token": token,
    })


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    identifier = (data.get("email") or data.get("username") or data.get("identifier") or "").strip()
    password = (data.get("password") or "").strip()

    if not identifier or not password:
        return jsonify({"message": "يرجى إدخال بيانات تسجيل الدخول"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT name, email, password FROM users WHERE email=? OR name=? LIMIT 1",
        (identifier, identifier),
    )
    user = cursor.fetchone()

    if not user:
        conn.close()
        return jsonify({"message": "بيانات غير صحيحة"}), 401

    hashed_input = hash_password(password)
    stored_password = user["password"]
    is_valid = stored_password == hashed_input or stored_password == password

    if not is_valid:
        conn.close()
        return jsonify({"message": "بيانات غير صحيحة"}), 401

    if stored_password == password:
        cursor.execute("UPDATE users SET password=? WHERE email=?", (hashed_input, user["email"]))
        conn.commit()

    conn.close()

    session.clear()
    session.permanent = True
    session["user"] = user["name"]
    session["email"] = user["email"]
    session.modified = True

    token = create_token(user["name"], user["email"])

    return jsonify({
        "ok": True,
        "message": "تم تسجيل الدخول",
        "user": user["name"],
        "email": user["email"],
        "token": token,
    })


@auth_bp.route("/me")
def me():
    user = current_user()
    email = current_email()
    if user:
        return jsonify({"user": user, "email": email, "token": create_token(user, email or "")})
    return jsonify({"user": None})


@auth_bp.route("/update_profile", methods=["POST"])
def update_profile():
    active_user = current_user()
    active_email = current_email()
    if not active_user or not active_email:
        return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

    data = request.get_json(silent=True) or {}
    new_name = (data.get("name") or active_user).strip()
    new_email = (data.get("email") or active_email).strip()
    new_password = (data.get("password") or "").strip()

    if not new_name or not new_email:
        return jsonify({"message": "الاسم والبريد مطلوبان"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE email=? AND email<>?", (new_email, active_email))
    if cursor.fetchone():
        conn.close()
        return jsonify({"message": "هذا البريد مستخدم بالفعل"}), 409

    cursor.execute("SELECT id FROM users WHERE name=? AND name<>?", (new_name, active_user))
    if cursor.fetchone():
        conn.close()
        return jsonify({"message": "اسم المستخدم مستخدم بالفعل"}), 409

    if new_name != active_user:
        _rename_user_references(cursor, active_user, new_name)

    if new_password:
        cursor.execute(
            "UPDATE users SET name=?, email=?, password=? WHERE email=?",
            (new_name, new_email, hash_password(new_password), active_email),
        )
    else:
        cursor.execute(
            "UPDATE users SET name=?, email=? WHERE email=?",
            (new_name, new_email, active_email),
        )

    conn.commit()
    conn.close()

    session["user"] = new_name
    session["email"] = new_email
    session.modified = True

    return jsonify({
        "message": "تم تحديث الملف الشخصي",
        "user": new_name,
        "email": new_email,
        "token": create_token(new_name, new_email),
    })


@auth_bp.route("/logout")
def logout():
    session.clear()
    return jsonify({"message": "تم تسجيل الخروج"})
