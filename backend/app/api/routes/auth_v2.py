import sys

from flask import Blueprint, jsonify, request, session


auth = Blueprint("auth", __name__)


def chat_runtime():
    return sys.modules.get("chat_server") or sys.modules.get("__main__")


@auth.route("/login", methods=["POST"])
def login_route():
    runtime = chat_runtime()

    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = runtime.authenticate_credentials(username, password)
    if not user:
        return jsonify({"status": "error", "message": "اسم المستخدم أو كلمة المرور غير صحيحين"}), 401

    session["user"] = user["username"]
    token = runtime.create_access_token(user["username"])
    return jsonify(
        {
            "status": "ok",
            "access_token": token,
            "token": token,
            "user": user["username"],
            "email": user.get("email", ""),
            "role": user.get("role", "user"),
            "profile": runtime.serialize_user(user),
        }
    )


@auth.route("/logout", methods=["POST"])
def logout_route():
    session.pop("user", None)
    return jsonify({"status": "ok"})


@auth.route("/me", methods=["GET"])
def me_route():
    runtime = chat_runtime()

    username = runtime.resolve_request_user()
    if not username:
        return jsonify({"error": "not logged in"}), 401

    user = runtime.get_user_by_username(username)
    return jsonify({"username": username, "profile": runtime.serialize_user(user) if user else None})
