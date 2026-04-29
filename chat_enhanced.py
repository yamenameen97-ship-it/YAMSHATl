
# Enhanced Chat Features (Voice, Media, AI, Offline-ready scaffold)

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import base64
import os

chat_enhanced_bp = Blueprint("chat_enhanced", __name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 1. Voice Message
@chat_enhanced_bp.route("/send_voice", methods=["POST"])
@jwt_required()
def send_voice():
    user_id = get_jwt_identity()
    data = request.json

    audio_base64 = data.get("audio")
    file_path = f"{UPLOAD_FOLDER}/voice_{user_id}.wav"

    with open(file_path, "wb") as f:
        f.write(base64.b64decode(audio_base64))

    return jsonify({"msg": "Voice message saved", "file": file_path})


# 2. Media إرسال صور + فيديو
@chat_enhanced_bp.route("/send_media", methods=["POST"])
@jwt_required()
def send_media():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file"}), 400

    path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(path)

    return jsonify({"msg": "Media uploaded", "path": path})


# 3. Placeholder End-to-End Encryption (simple demo)
def simple_encrypt(message):
    return message[::-1]

def simple_decrypt(message):
    return message[::-1]


# 4. AI Smart Reply (mock)
@chat_enhanced_bp.route("/ai_reply", methods=["POST"])
@jwt_required()
def ai_reply():
    data = request.json
    msg = data.get("message")

    # placeholder AI logic
    reply = "🤖 AI: يبدو أنك تقول: " + msg

    return jsonify({"reply": reply})


# 5. Offline caching hint (client side)
@chat_enhanced_bp.route("/sync_messages", methods=["POST"])
@jwt_required()
def sync_messages():
    return jsonify({"msg": "Sync endpoint ready"})
