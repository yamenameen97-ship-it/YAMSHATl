from __future__ import annotations

from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

from config import Config


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
        if response.headers.get("Content-Type", "").startswith("application/json"):
            response.headers["Cache-Control"] = "no-store"
        return response
