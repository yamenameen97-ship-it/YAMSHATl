
from flask import Flask
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from auth import auth
from posts import posts
from reels import reels
from chat import chat
from live import socketio, init_socket

app = Flask(__name__)
app.secret_key="secret"

CORS(app, supports_credentials=True)

limiter = Limiter(get_remote_address, app=app, default_limits=["200 per day","50 per hour"])

app.register_blueprint(auth, url_prefix="/api")
app.register_blueprint(posts, url_prefix="/api")
app.register_blueprint(reels, url_prefix="/api")
app.register_blueprint(chat, url_prefix="/api")

init_socket(app)

@app.route("/")
def home():
    return {"status":"running"}

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000)
