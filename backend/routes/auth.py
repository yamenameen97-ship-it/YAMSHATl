from flask import Blueprint, jsonify, request, session

from models import get_connection, hash_password

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    password = (data.get("password") or "").strip()

    if not name or not email or not password:
        return jsonify({"message": "يرجى إدخال الاسم وبيانات الدخول وكلمة المرور"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email=?", (email,))

    if cursor.fetchone():
        conn.close()
        return jsonify({"message": "هذا الحساب مسجل بالفعل"}), 409

    cursor.execute(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        (name, email, hash_password(password)),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم التسجيل بنجاح", "user": name})


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()
    password = (data.get("password") or "").strip()

    if not email or not password:
        return jsonify({"message": "يرجى إدخال بيانات تسجيل الدخول"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name, email, password FROM users WHERE email=?", (email,))
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
        cursor.execute("UPDATE users SET password=? WHERE email=?", (hashed_input, email))
        conn.commit()

    conn.close()

    session.clear()
    session.permanent = True
    session["user"] = user["name"]
    session["email"] = user["email"]
    session.modified = True

    return jsonify(
        {
            "message": "تم تسجيل الدخول",
            "user": user["name"],
        }
    )


@auth_bp.route("/me")
def me():
    if "user" in session:
        session.permanent = True
        return jsonify(
            {
                "user": session["user"],
                "email": session.get("email"),
            }
        )
    return jsonify({"user": None})


@auth_bp.route("/logout")
def logout():
    session.clear()
    return jsonify({"message": "تم تسجيل الخروج"})
