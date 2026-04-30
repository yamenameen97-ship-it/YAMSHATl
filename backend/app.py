from flask import Flask
import os

from config import Config
from logger import setup_logging
from db import init_db, set_admin_roles
from extensions import init_extensions

from admin import admin_bp
from auth import auth_bp
from chat import chat_bp
from live import live_api_bp
from notifications import notifications_bp
from posts import posts_bp

# سوكيت
from live_socket import init_socket, socketio


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Logging
    setup_logging(app)

    # Extensions
    init_extensions(app)

    # Blueprints
    app.register_blueprint(admin_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(live_api_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(posts_bp)

    # Socket
    init_socket(app)

    return app


app = create_app()

# ⚠️ شغل قاعدة البيانات مرة واحدة فقط
if os.environ.get("RUN_DB_INIT") == "true":
    init_db()
    set_admin_roles([], [])


# =========================
# تشغيل السيرفر (Render)
# =========================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))

    socketio.run(
        app,
        host="0.0.0.0",
        port=port,
        debug=False
    )
