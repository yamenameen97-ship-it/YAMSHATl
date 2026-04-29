from __future__ import annotations

from flask import Blueprint, jsonify, request

from config import Config
from db import db_cursor
from utils import (
    current_email,
    current_role,
    current_user,
    hash_password,
    json_error,
    login_user,
    logout_user,
    rate_limit,
    require_auth,
    validate_identity,
    validate_password_strength,
    verify_password,
)

auth_bp = Blueprint("auth", __name__)


def _role_for_identity(name: str, email: str, current_role_value: str = "user") -> str:
    if email in Config.ADMIN_EMAILS or name in Config.ADMIN_USERNAMES:
        return "admin"
    return current_role_value or "user"


def _rename_user_references(cur, old_name: str, new_name: str):
    for table_name, column_name in [
        ("users", "name"),
        ("posts", "username"),
        ("comments", "username"),
        ("reels", "username"),
        ("messages", "sender"),
        ("messages", "receiver"),
        ("post_likes", "username"),
    ]:
        cur.execute(f"UPDATE {table_name} SET {column_name}=%s WHERE {column_name}=%s", (new_name, old_name))


@auth_bp.post("/register")
@rate_limit(10, 60)
def register():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name") or "").strip()
    email = str(data.get("email") or "").strip().lower()
    password = str(data.get("password") or "")

    if not name or not email or not password:
        return json_error("الاسم والبريد أو الجوال وكلمة المرور مطلوبة", 400)
    if not validate_identity(name) or len(name) > 80:
        return json_error("اسم المستخدم غير صالح", 400)
    if not validate_identity(email):
        return json_error("البريد أو رقم الجوال غير صالح", 400)
    if not validate_password_strength(password):
        return json_error("كلمة المرور يجب أن تكون 8 أحرف على الأقل", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id FROM users WHERE email=%s", (email,))
        if cur.fetchone():
            return json_error("هذا الحساب مسجل بالفعل", 409)
        cur.execute("SELECT id FROM users WHERE name=%s", (name,))
        if cur.fetchone():
            return json_error("اسم المستخدم مستخدم بالفعل", 409)

        role = _role_for_identity(name, email, "user")
        cur.execute(
            "INSERT INTO users(name,email,password,role) VALUES(%s,%s,%s,%s)",
            (name, email, hash_password(password), role),
        )

    token = login_user(name, email, role)
    return jsonify({"ok": True, "message": "تم التسجيل بنجاح", "user": name, "email": email, "role": role, "token": token})


@auth_bp.post("/login")
@rate_limit(10, 60)
def login():
    data = request.get_json(silent=True) or {}
    identifier = str(data.get("email") or data.get("username") or data.get("identifier") or "").strip()
    password = str(data.get("password") or "")

    if not identifier or not password:
        return json_error("يرجى إدخال بيانات تسجيل الدخول", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            "SELECT name,email,password,COALESCE(role,'user') AS role FROM users WHERE email=%s OR name=%s LIMIT 1",
            (identifier.lower(), identifier),
        )
        user = cur.fetchone()
        if not user:
            return json_error("بيانات غير صحيحة", 401)

        is_valid, needs_upgrade = verify_password(password, user["password"])
        if not is_valid:
            return json_error("بيانات غير صحيحة", 401)

        role = _role_for_identity(user["name"], user["email"], user.get("role") or "user")
        if needs_upgrade or role != (user.get("role") or "user"):
            cur.execute("UPDATE users SET password=%s, role=%s WHERE email=%s", (hash_password(password), role, user["email"]))

    token = login_user(user["name"], user["email"], role)
    return jsonify({"ok": True, "message": "تم تسجيل الدخول", "user": user["name"], "email": user["email"], "role": role, "token": token})


@auth_bp.get("/me")
def me():
    user = current_user()
    email = current_email()
    role = current_role()
    if not user:
        return jsonify({"user": None})
    token = login_user(user, email or "", role)
    return jsonify({"user": user, "email": email, "role": role, "token": token})


@auth_bp.route("/logout", methods=["GET", "POST"])
def logout():
    logout_user()
    return jsonify({"ok": True, "message": "تم تسجيل الخروج"})


@auth_bp.post("/update_profile")
@require_auth
@rate_limit(10, 3600)
def update_profile():
    active_user = current_user()
    active_email = current_email()
    active_role = current_role()
    data = request.get_json(silent=True) or {}

    new_name = str(data.get("name") or active_user or "").strip()
    new_email = str(data.get("email") or active_email or "").strip().lower()
    new_password = str(data.get("password") or "")

    if not new_name or not new_email:
        return json_error("الاسم والبريد أو الجوال مطلوبان", 400)
    if not validate_identity(new_name) or len(new_name) > 80:
        return json_error("اسم المستخدم غير صالح", 400)
    if not validate_identity(new_email):
        return json_error("البريد أو رقم الجوال غير صالح", 400)
    if new_password and not validate_password_strength(new_password):
        return json_error("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id FROM users WHERE email=%s AND email<>%s", (new_email, active_email))
        if cur.fetchone():
            return json_error("هذا البريد أو الجوال مستخدم بالفعل", 409)
        cur.execute("SELECT id FROM users WHERE name=%s AND name<>%s", (new_name, active_user))
        if cur.fetchone():
            return json_error("اسم المستخدم مستخدم بالفعل", 409)

        if new_name != active_user:
            _rename_user_references(cur, active_user, new_name)

        role = _role_for_identity(new_name, new_email, active_role)
        if new_password:
            cur.execute(
                "UPDATE users SET name=%s, email=%s, password=%s, role=%s WHERE email=%s",
                (new_name, new_email, hash_password(new_password), role, active_email),
            )
        else:
            cur.execute(
                "UPDATE users SET name=%s, email=%s, role=%s WHERE email=%s",
                (new_name, new_email, role, active_email),
            )

    token = login_user(new_name, new_email, role)
    return jsonify({"ok": True, "message": "تم تحديث الملف الشخصي", "user": new_name, "email": new_email, "role": role, "token": token})
