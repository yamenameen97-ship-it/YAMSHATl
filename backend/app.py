from pathlib import Path
import secrets
import sys
import os

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

# ====== إعداد المسارات ======
BASE_DIR = Path(__file__).resolve().parent

# 👇 إذا نقلت frontend داخل backend خله "frontend"
# 👇 إذا ما نقلته خله "../frontend"
FRONTEND_PATH = BASE_DIR / "frontend"

# ====== إنشاء التطبيق ======
app = Flask(
    __name__,
    static_folder=str(FRONTEND_PATH),
    static_url_path=""
)

app.secret_key = secrets.token_hex(16)
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
)

# ====== CORS ======
CORS(
    app,
    supports_credentials=True,
    resources={
        r"/*": {
            "origins": [
                "null",
                "http://127.0.0.1:5500",
                "http://localhost:5500",
                "http://127.0.0.1:5000",
                "http://localhost:5000",
            ]
        }
    },
)

# ====== استيراد الموديولات ======
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from models import init_db
from routes.auth import auth_bp
from routes.posts import posts_bp
from routes.social import social_bp
from routes.friends import friends_bp
from routes.groups import groups_bp
from routes.live import live_bp

# ====== تهيئة قاعدة البيانات ======
init_db()

# ====== تسجيل الـ APIs ======
app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(posts_bp, url_prefix="/api")
app.register_blueprint(social_bp, url_prefix="/api")
app.register_blueprint(friends_bp, url_prefix="/api")
app.register_blueprint(groups_bp, url_prefix="/api")
app.register_blueprint(live_bp, url_prefix="/api")

# ====== عرض الفرونت ======

# الصفحة الرئيسية
@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

# باقي الملفات (CSS / JS / صفحات)
@app.route('/<path:path>')
def serve_files(path):
    file_path = os.path.join(app.static_folder, path)

    if os.path.exists(file_path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


# ====== تشغيل السيرفر ======
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
