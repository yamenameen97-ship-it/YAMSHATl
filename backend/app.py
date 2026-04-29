from __future__ import annotations

import logging
import os
from datetime import timedelta
from pathlib import Path

from flask import Flask, Response, abort, jsonify, send_from_directory, request

from admin import admin_bp
from auth import auth_bp
from chat import chat_bp
from config import Config
from db import init_db, set_admin_roles
from extensions import init_extensions
from live import live_api_bp
from live_socket import init_socket, socketio
from notifications import notifications_bp
from posts import posts_bp
from reels import reels_bp
from routes.friends import friends_bp
from routes.groups import groups_bp
from routes.live import live_bp as live_stream_bp
from users import users_bp

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"

logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
app.config.from_object(Config)
app.secret_key = Config.SECRET_KEY
app.config.update(
    MAX_CONTENT_LENGTH=Config.MAX_CONTENT_LENGTH,
    SESSION_COOKIE_HTTPONLY=Config.SESSION_COOKIE_HTTPONLY,
    SESSION_COOKIE_SAMESITE=Config.SESSION_COOKIE_SAMESITE,
    SESSION_COOKIE_SECURE=Config.SESSION_COOKIE_SECURE,
    PERMANENT_SESSION_LIFETIME=timedelta(days=Config.SESSION_DAYS),
    JSON_AS_ASCII=False,
)

init_extensions(app)
init_db()
set_admin_roles(Config.ADMIN_EMAILS, Config.ADMIN_USERNAMES)
init_socket(app)

app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(posts_bp, url_prefix="/api")
app.register_blueprint(reels_bp, url_prefix="/api")
app.register_blueprint(chat_bp, url_prefix="/api")
app.register_blueprint(admin_bp, url_prefix="/api")
app.register_blueprint(users_bp, url_prefix="/api")
app.register_blueprint(notifications_bp, url_prefix="/api")
app.register_blueprint(live_api_bp, url_prefix="/api")
app.register_blueprint(live_stream_bp, url_prefix="/api")
app.register_blueprint(friends_bp, url_prefix="/api")
app.register_blueprint(groups_bp, url_prefix="/api")


@app.before_request
def log_requests():
    if request.path.startswith("/api/"):
        logger.info("%s %s from %s", request.method, request.path, request.headers.get("X-Forwarded-For", request.remote_addr))


@app.errorhandler(413)
def file_too_large(_error):
    return jsonify({"message": "حجم الملف أكبر من الحد المسموح"}), 413


@app.get("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "backend_origin": Config.BACKEND_ORIGIN,
            "frontend_origin": Config.FRONTEND_ORIGIN,
            "secure_cookie": Config.SESSION_COOKIE_SECURE,
            "max_upload_mb": int(Config.MAX_CONTENT_LENGTH / (1024 * 1024)),
            "livekit_url": (os.getenv("LIVEKIT_WS_URL") or os.getenv("LIVEKIT_URL") or "").strip(),
            "socketio": True,
            "default_coin_balance": Config.DEFAULT_COIN_BALANCE,
        }
    )


@app.get("/app-config.js")
def app_config_js():
    api_base = f"{Config.BACKEND_ORIGIN}/api" if Config.BACKEND_ORIGIN else "/api"
    content = (
        "window.APP_API_BASE = " + repr(api_base) + ";\n"
        "window.YAMSHAT_FRONTEND_ORIGIN = " + repr(Config.FRONTEND_ORIGIN) + ";\n"
        "window.YAMSHAT_BACKEND_ORIGIN = " + repr(Config.BACKEND_ORIGIN) + ";\n"
    )
    return Response(content, mimetype="application/javascript")


@app.get("/")
def home():
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return send_from_directory(FRONTEND_DIR, "index.html")
    return jsonify({"status": "running"})


@app.route("/<path:path>")
def serve_frontend(path: str):
    requested = FRONTEND_DIR / path
    if requested.exists() and requested.is_file():
        return send_from_directory(FRONTEND_DIR, path)
    if "." in Path(path).name:
        return abort(404)
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return send_from_directory(FRONTEND_DIR, "index.html")
    return abort(404)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port)
