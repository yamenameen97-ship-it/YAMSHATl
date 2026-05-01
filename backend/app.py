from __future__ import annotations

import logging
import os
from datetime import timedelta
from pathlib import Path

from flask import Flask, Response, abort, jsonify, send_from_directory, request

try:
    from flask_jwt_extended import JWTManager
except Exception:
    JWTManager = None

from admin import admin_bp
from auth import auth_bp
from chat import chat_bp
from config import Config
from logger import setup_logging
from db import ensure_group_owner_membership, init_db, set_admin_roles
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

setup_logging()
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
    JWT_SECRET_KEY=Config.JWT_SECRET_KEY,
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=Config.JWT_EXPIRE_DAYS),
)

jwt_manager = JWTManager(app) if JWTManager else None

# =========================
# تهيئة النظام
# =========================
init_extensions(app)
init_socket(app)

# تشغيل التهيئة والمهاجرات وإنشاء صلاحيات الأدمن تلقائياً
try:
    init_db()
    set_admin_roles(Config.ADMIN_EMAILS, Config.ADMIN_USERNAMES)
    ensure_group_owner_membership()
except Exception as exc:
    logger.exception("DB bootstrap failed: %s", exc)

# =========================
# تسجيل المسارات
# =========================
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

# =========================
# لوق الطلبات
# =========================
@app.before_request
def log_requests():
    if request.path.startswith("/api/"):
        logger.info(
            "%s %s from %s",
            request.method,
            request.path,
            request.headers.get("X-Forwarded-For", request.remote_addr),
        )

# =========================
# أخطاء
# =========================
@app.errorhandler(413)
def file_too_large(_error):
    return jsonify({"message": "حجم الملف أكبر من الحد المسموح"}), 413


@app.errorhandler(500)
def internal_error(error):
    logger.exception("Unhandled server error: %s", error)
    return jsonify({"message": "حدث خطأ داخلي في الخادم"}), 500

# =========================
# Cache
# =========================
@app.after_request
def add_cache_headers(response):
    path = request.path.lower()
    if path in {"/", "/index.html", "/api/app-config.js", "/site.webmanifest"} or path.endswith((".html", ".js", ".css")):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    return response

# =========================
# Health check
# =========================
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

# =========================
# إعدادات الفرونت
# =========================
@app.get("/api/app-config.js")
def app_config_js():
    runtime_origin = request.host_url.rstrip("/")
    api_base = "/api"
    content = (
        "window.APP_API_BASE = " + repr(api_base) + ";\n"
        "window.YAMSHAT_FRONTEND_ORIGIN = " + repr(runtime_origin) + ";\n"
        "window.YAMSHAT_BACKEND_ORIGIN = " + repr(runtime_origin) + ";\n"
        "window.YAMSHAT_DEPLOY_MODE = 'single-service';\n"
    )
    response = Response(content, mimetype="application/javascript")
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# =========================
# تقديم الفرونت
# =========================
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

# =========================
# تشغيل السيرفر (Render)
# =========================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))

    socketio.run(
        app,
        host="0.0.0.0",
        port=port
    )
