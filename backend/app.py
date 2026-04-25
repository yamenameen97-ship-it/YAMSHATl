from pathlib import Path
import secrets
import sys

from flask import Flask, jsonify
from flask_cors import CORS

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from models import init_db
from routes.auth import auth_bp
from routes.posts import posts_bp
from routes.social import social_bp

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
)

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

init_db()

app.register_blueprint(auth_bp)
app.register_blueprint(posts_bp)
app.register_blueprint(social_bp)


@app.get("/")
def home():
    return jsonify({"message": "Social App API is running"})


if __name__ == "__main__":
    app.run(debug=True)
