from __future__ import annotations

from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix

from config import Config

limiter = Limiter(key_func=get_remote_address, default_limits=[])


def init_extensions(app):
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    allowed_origins = sorted(
        {
            *Config.ALLOWED_ORIGINS,
            Config.FRONTEND_ORIGIN,
            Config.BACKEND_ORIGIN,
            Config.RENDER_EXTERNAL_URL,
        }
        - {""}
    )

    CORS(
        app,
        supports_credentials=True,
        resources={r"/api/*": {"origins": allowed_origins}, r"/socket.io/*": {"origins": allowed_origins}},
    )
    limiter.init_app(app)

    @app.after_request
    def apply_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(self), camera=(self), autoplay=(self)"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self' https: data: blob:; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' https: data: blob:; "
            "media-src 'self' https: data: blob:; "
            "connect-src 'self' https: ws: wss:; "
            "frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        )
        content_type = response.headers.get("Content-Type", "")
        if (
            content_type.startswith("application/json")
            or content_type.startswith("text/html")
            or "javascript" in content_type
            or content_type.startswith("text/css")
        ):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        if Config.SESSION_COOKIE_SECURE:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        return response
