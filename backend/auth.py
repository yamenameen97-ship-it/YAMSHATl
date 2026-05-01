from __future__ import annotations

import secrets

from flask import Blueprint, jsonify, request

from admin_utils import enforce_moderation, log_audit
from config import Config
from db import db_cursor
from reset_service import generate_reset_code, hash_reset_code, send_reset_code, verify_reset_code
from utils import (
    current_email,
    current_role,
    current_user,
    hash_password,
    is_email_contact,
    is_phone_contact,
    is_privileged_role,
    json_error,
    login_user,
    logout_user,
    normalize_contact,
    normalize_text,
    rate_limit,
    require_auth,
    validate_identity,
    validate_password_strength,
    verify_password,
)

auth_bp = Blueprint("auth", __name__)


GENERIC_RESET_MESSAGE = "إذا كانت البيانات صحيحة فسيصل رمز التحقق خلال لحظات"


def _configured_admin_sets() -> tuple[set[str], set[str]]:
    configured_admin_emails = {normalize_contact(Config.PRIMARY_ADMIN_EMAIL)}
    configured_admin_usernames = {str(Config.PRIMARY_ADMIN_USERNAME or "").strip().lower()}
    return configured_admin_emails, configured_admin_usernames


def _matches_configured_admin(identifier: str) -> bool:
    raw_identifier = str(identifier or "").strip().lower()
    normalized_identifier = normalize_contact(identifier or "")
    admin_emails, admin_usernames = _configured_admin_sets()
    return normalized_identifier in admin_emails or raw_identifier in admin_usernames


def _sync_primary_admin_login(cur, user, identifier: str, password: str):
    if not _matches_configured_admin(identifier) or password != Config.PRIMARY_ADMIN_PASSWORD:
        return None

    password_hash = hash_password(password)
    user_data = dict(user or {})

    if user_data:
        cur.execute(
            "UPDATE users SET password=%s, role='admin', is_online=TRUE, last_seen=NOW() WHERE lower(email)=lower(%s)",
            (password_hash, user_data["email"]),
        )
        user_data["password"] = password_hash
        user_data["role"] = "admin"
        return user_data

    cur.execute(
        "SELECT name,email,password,COALESCE(role,'user') AS role FROM users WHERE lower(email)=lower(%s) OR lower(name)=lower(%s) LIMIT 1",
        (Config.PRIMARY_ADMIN_EMAIL, Config.PRIMARY_ADMIN_USERNAME),
    )
    existing_primary = cur.fetchone()
    if existing_primary:
        user_data = dict(existing_primary)
        cur.execute(
            "UPDATE users SET password=%s, role='admin', is_online=TRUE, last_seen=NOW() WHERE lower(email)=lower(%s)",
            (password_hash, user_data["email"]),
        )
        user_data["password"] = password_hash
        user_data["role"] = "admin"
        return user_data

    cur.execute(
        "INSERT INTO users(name,email,password,role,is_online,last_seen) VALUES(%s,%s,%s,'admin',TRUE,NOW())",
        (Config.PRIMARY_ADMIN_USERNAME, Config.PRIMARY_ADMIN_EMAIL, password_hash),
    )
    return {
        "name": Config.PRIMARY_ADMIN_USERNAME,
        "email": Config.PRIMARY_ADMIN_EMAIL,
        "password": password_hash,
        "role": "admin",
    }


def _role_for_identity(name: str, email: str, current_role_value: str = "user") -> str:
    normalized_name = str(name or "").strip().lower()
    normalized_email = normalize_contact(email or "")
    admin_emails, admin_usernames = _configured_admin_sets()
    if normalized_email in admin_emails or normalized_name in admin_usernames:
        return "admin"
    if is_privileged_role(current_role_value):
        return str(current_role_value).strip().lower()
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


def _is_valid_contact(value: str) -> bool:
    return is_email_contact(value) or is_phone_contact(value)


def _mask_contact(value: str) -> str:
    if is_email_contact(value):
        local, _, domain = value.partition("@")
        if len(local) <= 2:
            masked_local = f"{local[:1]}***"
        else:
            masked_local = f"{local[:2]}***"
        return f"{masked_local}@{domain}"

    normalized = normalize_contact(value)
    if len(normalized) <= 4:
        return "***"
    return f"***{normalized[-4:]}"


@auth_bp.post("/register")
@rate_limit(10, 60)
def register():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name") or "").strip()
    email = normalize_contact(data.get("email") or "")
    password = str(data.get("password") or "")

    if not name or not email or not password:
        return json_error("الاسم والبريد أو الجوال وكلمة المرور مطلوبة", 400)
    if not validate_identity(name) or len(name) > 80:
        return json_error("اسم المستخدم غير صالح", 400)
    if not _is_valid_contact(email):
        return json_error("البريد الإلكتروني أو رقم الجوال غير صالح", 400)
    if not validate_password_strength(password):
        return json_error("كلمة المرور يجب أن تكون 6 أحرف على الأقل", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id FROM users WHERE lower(email)=lower(%s)", (email,))
        if cur.fetchone():
            return json_error("هذا الحساب مسجل بالفعل", 409)
        cur.execute("SELECT id FROM users WHERE lower(name)=lower(%s)", (name,))
        if cur.fetchone():
            return json_error("اسم المستخدم مستخدم بالفعل", 409)

        role = _role_for_identity(name, email, "user")
        cur.execute(
            "INSERT INTO users(name,email,password,role,is_online,last_seen) VALUES(%s,%s,%s,%s,TRUE,NOW())",
            (name, email, hash_password(password), role),
        )
        log_audit(cur, action="register", actor=name, target_type="account", target_value=email, details="إنشاء حساب جديد")

    token = login_user(name, email, role)
    return jsonify({"ok": True, "message": "تم التسجيل بنجاح", "user": name, "email": email, "role": role, "token": token, "access_token": token})


@auth_bp.post("/login")
@rate_limit(10, 60)
def login():
    data = request.get_json(silent=True) or {}
    identifier = str(data.get("email") or data.get("username") or data.get("identifier") or "").strip()
    password = str(data.get("password") or "")

    if not identifier or not password:
        return json_error("يرجى إدخال بيانات تسجيل الدخول", 400)

    normalized_identifier = normalize_contact(identifier)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            "SELECT name,email,password,COALESCE(role,'user') AS role FROM users WHERE lower(email)=lower(%s) OR lower(name)=lower(%s) LIMIT 1",
            (normalized_identifier, identifier),
        )
        user = cur.fetchone()

        admin_override = _sync_primary_admin_login(cur, user, identifier, password)
        if admin_override:
            user = admin_override
            is_valid, needs_upgrade = True, False
        else:
            if not user:
                return json_error("بيانات غير صحيحة", 401)
            is_valid, needs_upgrade = verify_password(password, user["password"])
            if not is_valid:
                return json_error("بيانات غير صحيحة", 401)

        moderation_error = enforce_moderation(cur, user["name"], "login")
        if moderation_error:
            log_audit(cur, action="login_blocked", actor=user["name"], target_type="account", target_value=user["email"], details=moderation_error, severity="warning")
            return json_error(moderation_error, 403)

        role = _role_for_identity(user["name"], user["email"], user.get("role") or "user")
        if needs_upgrade or role != (user.get("role") or "user"):
            cur.execute("UPDATE users SET password=%s, role=%s, is_online=TRUE, last_seen=NOW() WHERE email=%s", (hash_password(password), role, user["email"]))
        else:
            cur.execute("UPDATE users SET is_online=TRUE, last_seen=NOW() WHERE email=%s", (user["email"],))
        log_audit(cur, action="login", actor=user["name"], target_type="account", target_value=user["email"], details="نجاح تسجيل الدخول")

    token = login_user(user["name"], user["email"], role)
    return jsonify({"ok": True, "message": "تم تسجيل الدخول", "user": user["name"], "email": user["email"], "role": role, "token": token, "access_token": token})


@auth_bp.get("/me")
def me():
    user = current_user()
    email = current_email()
    role = current_role()
    if not user:
        return jsonify({"user": None})
    with db_cursor(commit=True) as (_conn, cur):
        moderation_error = enforce_moderation(cur, user, "login")
        if moderation_error:
            log_audit(cur, action="session_revoked", actor=user, target_type="account", target_value=email or "", details=moderation_error, severity="warning")
            logout_user()
            return json_error(moderation_error, 403)
        cur.execute("UPDATE users SET is_online=TRUE, last_seen=NOW() WHERE name=%s", (user,))
    token = login_user(user, email or "", role)
    return jsonify({"user": user, "email": email, "role": role, "token": token, "access_token": token})


@auth_bp.route("/logout", methods=["GET", "POST"])
def logout():
    user = current_user()
    if user:
        with db_cursor(commit=True) as (_conn, cur):
            cur.execute("UPDATE users SET is_online=FALSE, last_seen=NOW() WHERE name=%s", (user,))
            log_audit(cur, action="logout", actor=user, target_type="session", target_value=current_email() or "", details="إنهاء الجلسة")
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
    new_email = normalize_contact(data.get("email") or active_email or "")
    new_password = str(data.get("password") or "")

    if not new_name or not new_email:
        return json_error("الاسم والبريد أو الجوال مطلوبان", 400)
    if not validate_identity(new_name) or len(new_name) > 80:
        return json_error("اسم المستخدم غير صالح", 400)
    if not _is_valid_contact(new_email):
        return json_error("البريد الإلكتروني أو رقم الجوال غير صالح", 400)
    if new_password and not validate_password_strength(new_password):
        return json_error("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل", 400)

    with db_cursor(commit=True) as (_conn, cur):
        moderation_error = enforce_moderation(cur, active_user, "profile_edit")
        if moderation_error:
            return json_error(moderation_error, 403)
        cur.execute("SELECT id FROM users WHERE lower(email)=lower(%s) AND lower(email)<>lower(%s)", (new_email, active_email))
        if cur.fetchone():
            return json_error("هذا البريد أو الجوال مستخدم بالفعل", 409)
        cur.execute("SELECT id FROM users WHERE lower(name)=lower(%s) AND lower(name)<>lower(%s)", (new_name, active_user))
        if cur.fetchone():
            return json_error("اسم المستخدم مستخدم بالفعل", 409)

        if new_name != active_user:
            _rename_user_references(cur, active_user, new_name)

        role = _role_for_identity(new_name, new_email, active_role)
        if new_password:
            cur.execute(
                "UPDATE users SET name=%s, email=%s, password=%s, role=%s, is_online=TRUE, last_seen=NOW() WHERE email=%s",
                (new_name, new_email, hash_password(new_password), role, active_email),
            )
        else:
            cur.execute(
                "UPDATE users SET name=%s, email=%s, role=%s, is_online=TRUE, last_seen=NOW() WHERE email=%s",
                (new_name, new_email, role, active_email),
            )
        log_audit(cur, action="profile_updated", actor=new_name, target_type="account", target_value=new_email, details="تم تحديث الملف الشخصي")

    token = login_user(new_name, new_email, role)
    return jsonify({"ok": True, "message": "تم تحديث الملف الشخصي", "user": new_name, "email": new_email, "role": role, "token": token, "access_token": token})


@auth_bp.post("/password_reset/request")
@rate_limit(5, 900)
def password_reset_request():
    data = request.get_json(silent=True) or {}
    identifier = normalize_contact(data.get("identifier") or data.get("email") or data.get("contact") or "")
    requested_channel = normalize_text(data.get("channel") or "auto", 20).lower() or "auto"

    if not identifier:
        return json_error("أدخل البريد الإلكتروني أو رقم الجوال", 400)
    if requested_channel not in {"auto", "email", "whatsapp"}:
        return json_error("قناة الإرسال غير مدعومة", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id, name, email FROM users WHERE lower(email)=lower(%s) LIMIT 1", (identifier,))
        user = cur.fetchone()
        if not user:
            return jsonify({"ok": True, "message": GENERIC_RESET_MESSAGE})

        delivery_target = normalize_contact(user["email"])
        available_channel = "email" if is_email_contact(delivery_target) else "whatsapp" if is_phone_contact(delivery_target) else ""
        selected_channel = available_channel if requested_channel == "auto" else requested_channel

        if not available_channel:
            return json_error("بيانات الحساب الحالية لا تدعم الاستعادة. حدّث البريد الإلكتروني أو رقم الجوال أولاً", 400)
        if selected_channel != available_channel:
            if available_channel == "email":
                return json_error("هذا الحساب مرتبط ببريد إلكتروني فقط. اختر البريد الإلكتروني", 400)
            return json_error("هذا الحساب مرتبط برقم جوال فقط. اختر واتساب", 400)

        code = generate_reset_code()
        request_token = secrets.token_urlsafe(32)

        cur.execute("UPDATE password_reset_codes SET consumed_at=NOW() WHERE user_id=%s AND consumed_at IS NULL", (user["id"],))
        cur.execute(
            """
            INSERT INTO password_reset_codes(user_id, identifier, delivery_target, channel, code_hash, request_token, expires_at)
            VALUES(%s,%s,%s,%s,%s,%s,CURRENT_TIMESTAMP + (%s * INTERVAL '1 minute'))
            """,
            (
                user["id"],
                identifier,
                delivery_target,
                selected_channel,
                hash_reset_code(code),
                request_token,
                Config.RESET_CODE_EXPIRE_MINUTES,
            ),
        )

    try:
        send_reset_code(delivery_target, selected_channel, code)
    except Exception:
        with db_cursor(commit=True) as (_conn, cur):
            cur.execute("UPDATE password_reset_codes SET consumed_at=NOW() WHERE request_token=%s", (request_token,))
        if selected_channel == "email":
            return json_error("تعذر إرسال البريد. تأكد من إعدادات SMTP في Render", 500)
        return json_error("تعذر إرسال رسالة واتساب. تأكد من إعدادات Twilio/WhatsApp في Render", 500)

    return jsonify(
        {
            "ok": True,
            "message": f"تم إرسال رمز التحقق إلى { _mask_contact(delivery_target) }",
            "request_token": request_token,
            "channel": selected_channel,
            "masked_target": _mask_contact(delivery_target),
        }
    )


@auth_bp.post("/password_reset/verify")
@rate_limit(10, 900)
def password_reset_verify():
    data = request.get_json(silent=True) or {}
    request_token = normalize_text(data.get("request_token"), 255)
    code = normalize_text(data.get("code"), 20)

    if not request_token or not code:
        return json_error("أدخل رمز التحقق أولاً", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            """
            SELECT id, code_hash, attempts
            FROM password_reset_codes
            WHERE request_token=%s
              AND consumed_at IS NULL
              AND expires_at > CURRENT_TIMESTAMP
            LIMIT 1
            """,
            (request_token,),
        )
        reset_row = cur.fetchone()
        if not reset_row:
            return json_error("انتهت صلاحية الرمز أو الطلب غير صالح", 400)

        attempts = int(reset_row.get("attempts") or 0)
        if attempts >= Config.RESET_MAX_VERIFY_ATTEMPTS:
            cur.execute("UPDATE password_reset_codes SET consumed_at=NOW() WHERE id=%s", (reset_row["id"],))
            return json_error("تم تجاوز عدد المحاولات المسموح", 429)

        if not verify_reset_code(code, reset_row["code_hash"]):
            attempts += 1
            if attempts >= Config.RESET_MAX_VERIFY_ATTEMPTS:
                cur.execute(
                    "UPDATE password_reset_codes SET attempts=%s, consumed_at=NOW() WHERE id=%s",
                    (attempts, reset_row["id"]),
                )
                return json_error("رمز التحقق غير صحيح وتم إلغاء الطلب بعد عدة محاولات", 400)

            cur.execute("UPDATE password_reset_codes SET attempts=%s WHERE id=%s", (attempts, reset_row["id"]))
            return json_error("رمز التحقق غير صحيح", 400)

        reset_token = secrets.token_urlsafe(32)
        cur.execute(
            "UPDATE password_reset_codes SET verified_at=NOW(), reset_token=%s WHERE id=%s",
            (reset_token, reset_row["id"]),
        )

    return jsonify({"ok": True, "message": "تم التحقق من الرمز", "reset_token": reset_token})


@auth_bp.post("/password_reset/reset")
@rate_limit(5, 1800)
def password_reset_reset():
    data = request.get_json(silent=True) or {}
    reset_token = normalize_text(data.get("reset_token"), 255)
    new_password = str(data.get("new_password") or data.get("password") or "")

    if not reset_token or not new_password:
        return json_error("أدخل كلمة المرور الجديدة", 400)
    if not validate_password_strength(new_password):
        return json_error("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            """
            SELECT pr.id, pr.user_id, u.name, u.email, COALESCE(u.role, 'user') AS role
            FROM password_reset_codes pr
            JOIN users u ON u.id = pr.user_id
            WHERE pr.reset_token=%s
              AND pr.verified_at IS NOT NULL
              AND pr.consumed_at IS NULL
              AND pr.expires_at > CURRENT_TIMESTAMP
            LIMIT 1
            """,
            (reset_token,),
        )
        reset_row = cur.fetchone()
        if not reset_row:
            return json_error("انتهت صلاحية طلب الاستعادة أو تم استخدامه بالفعل", 400)

        cur.execute("UPDATE users SET password=%s WHERE id=%s", (hash_password(new_password), reset_row["user_id"]))
        cur.execute("UPDATE password_reset_codes SET consumed_at=NOW() WHERE id=%s", (reset_row["id"],))

    return jsonify({"ok": True, "message": "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن"})
