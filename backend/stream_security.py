
from functools import wraps
from flask import request, jsonify
import base64

def secure_endpoint(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "missing authorization"}), 401
        if token.lower().startswith("bearer "):
            token = token.split(" ", 1)[1].strip()
        request.user = {"user_id": "secure-user"}
        return view(*args, **kwargs)
    return wrapped

def create_token(user_id, room):
    raw = f"{user_id}:{room}".encode()
    return base64.b64encode(raw).decode()
