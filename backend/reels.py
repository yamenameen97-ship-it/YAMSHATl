from __future__ import annotations

import uuid
from pathlib import Path

from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename

from config import Config
from db import db_cursor
from utils import current_user, json_error, rate_limit, require_auth

reels_bp = Blueprint("reels", __name__)
UPLOAD_DIR = Path(Config.UPLOAD_FOLDER)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@reels_bp.post("/add_reel")
@require_auth
@rate_limit(20, 3600)
def add_reel():
    if "file" not in request.files:
        return json_error("لم يتم اختيار ملف", 400)

    file_storage = request.files["file"]
    raw_name = secure_filename(file_storage.filename or "")
    if not raw_name:
        return json_error("اسم الملف غير صالح", 400)

    ext = Path(raw_name).suffix.lower().replace(".", "")
    if ext not in Config.ALLOWED_VIDEO_EXTENSIONS:
        return json_error("الملف يجب أن يكون فيديو صالحاً", 400)

    filename = f"reel_{uuid.uuid4().hex}.{ext}"
    save_path = UPLOAD_DIR / filename
    file_storage.save(save_path)
    video_url = f"{request.host_url.rstrip('/')}/api/uploads/{filename}"

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            "INSERT INTO reels(username,video) VALUES(%s,%s)",
            (current_user(), video_url),
        )

    return jsonify({"ok": True, "message": "تم رفع الريل", "video": video_url})


@reels_bp.get("/reels")
def get_reels():
    with db_cursor() as (_conn, cur):
        cur.execute("SELECT id, username, video, created_at FROM reels ORDER BY id DESC LIMIT 200")
        rows = cur.fetchall()
    return jsonify(rows)
