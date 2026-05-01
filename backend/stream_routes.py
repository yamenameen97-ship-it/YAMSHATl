
from flask import Blueprint, request, jsonify
from stream_security import secure_endpoint, create_token

stream_bp = Blueprint("stream_bp", __name__)

@stream_bp.get("/stream/token")
@secure_endpoint
def stream_token():
    user_id = request.user["user_id"]
    room = request.args.get("room", "default")
    return jsonify({"token": create_token(user_id, room)})
