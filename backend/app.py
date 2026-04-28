from __future__ import annotations

from pathlib import Path
from datetime import timedelta
import logging
import os
import sys

from flask import Flask, abort, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

from config import Config
from extensions import limiter

BASE_DIR = Path(__file__).resolve().parent


def resolve_frontend_path() -> Path:
    candidates = [
        BASE_DIR / "frontend",
        BASE_DIR.parent / "frontend",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[-1]


FRONTEND_PATH = resolve_frontend_path()

logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(
    __name__,
    static_folder=str(FRONTEND_PATH),
    static_url_path="",
)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
app.config.from_object(Config)
app.secret_key = app.config["SECRET_KEY"]
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE=app.config["SESSION_COOKIE_SAMESITE"],
    SESSION_COOKIE_SECURE=app.config["SESSION_COOKIE_SECURE"],
    SESSION_REFRESH_EACH_REQUEST=True,
    PERMANENT_SESSION_LIFETIME=timedelta(days=app.config["SESSION_DAYS"]),
    JSON_AS_ASCII=False,
    PREFERRED_URL_SCHEME="https" if app.config["SESSION_COOKIE_SECURE"] else "http",
)

allowed_origins = set(app.config["ALLOWED_ORIGINS"])
render_external = app.config["RENDER_EXTERNAL_URL"]
if render_external:
    allowed_origins.add(render_external)
allowed_origins.add("null")

CORS(
    app,
    supports_credentials=True,
    resources={r"/api/*": {"origins": sorted(allowed_origins)}},
)

limiter.init_app(app)

if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from models import DATABASE_URL, USE_POSTGRES, init_db  # noqa: E402
from routes.auth import auth_bp  # noqa: E402
from routes.posts import posts_bp  # noqa: E402
from routes.social import social_bp  # noqa: E402
from routes.friends import friends_bp  # noqa: E402
from routes.groups import groups_bp  # noqa: E402
from routes.live import live_bp  # noqa: E402
from routes.mobile_compat import mobile_compat_bp  # noqa: E402

try:
    init_db()
except Exception as e:
    print("DB ERROR:", e)

app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(posts_bp, url_prefix="/api")
app.register_blueprint(social_bp, url_prefix="/api")
app.register_blueprint(friends_bp, url_prefix="/api")
app.register_blueprint(groups_bp, url_prefix="/api")
app.register_blueprint(live_bp, url_prefix="/api")
app.register_blueprint(mobile_compat_bp, url_prefix="/api")


@app.before_request
def log_api_requests():
    if request.path.startswith("/api/"):
        logger.info("%s %s from %s", request.method, request.path, request.headers.get("X-Forwarded-For", request.remote_addr))


@app.errorhandler(413)
def file_too_large(_error):
    return jsonify({"message": "حجم الملف أكبر من الحد المسموح"}), 413


@app.errorhandler(429)
def rate_limit_exceeded(_error):
    return jsonify({"message": "عدد الطلبات كبير جداً، حاول بعد قليل"}), 429


@app.get("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "frontend_path": str(FRONTEND_PATH),
            "session_cookie_secure": app.config["SESSION_COOKIE_SECURE"],
            "db_engine": "postgres" if USE_POSTGRES else "sqlite",
            "database_configured": bool(DATABASE_URL),
            "backend_origin": app.config["BACKEND_ORIGIN"],
            "frontend_origin": app.config["FRONTEND_ORIGIN"],
        }
    )


@app.route("/", methods=["GET", "HEAD"])
def index():
    # FIX: serve correct HTML pages instead of always index
    if path.endswith(".html"):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")


@app.route("/<path:path>", methods=["GET", "HEAD"])
def serve_files(path):
    requested = FRONTEND_PATH / path

    if requested.exists() and requested.is_file():
        return send_from_directory(app.static_folder, path)

    if "." in Path(path).name:
        return abort(404)

    # FIX: serve correct HTML pages instead of always index
    if path.endswith(".html"):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
