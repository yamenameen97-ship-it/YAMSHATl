from pathlib import Path
import secrets
import sys
import os

from flask import Flask, jsonify, send_from_directory, abort
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent


def resolve_frontend_path() -> Path:
    candidates = [
        BASE_DIR / 'frontend',
        BASE_DIR.parent / 'frontend',
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[-1]


FRONTEND_PATH = resolve_frontend_path()

app = Flask(
    __name__,
    static_folder=str(FRONTEND_PATH),
    static_url_path=''
)

app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(16))
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
)

allowed_origins = {
    'null',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:5000',
    'http://localhost:5000',
    'https://yamshatl.onrender.com',
    'https://yamshatl-1.onrender.com',
}
render_external = os.environ.get('RENDER_EXTERNAL_URL', '').strip()
if render_external:
    allowed_origins.add(render_external.rstrip('/'))

CORS(
    app,
    supports_credentials=True,
    resources={r'/api/*': {'origins': sorted(allowed_origins)}}
)

if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from models import init_db
from routes.auth import auth_bp
from routes.posts import posts_bp
from routes.social import social_bp
from routes.friends import friends_bp
from routes.groups import groups_bp
from routes.live import live_bp

init_db()

app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(posts_bp, url_prefix='/api')
app.register_blueprint(social_bp, url_prefix='/api')
app.register_blueprint(friends_bp, url_prefix='/api')
app.register_blueprint(groups_bp, url_prefix='/api')
app.register_blueprint(live_bp, url_prefix='/api')


@app.get('/health')
def health():
    return jsonify({
        'status': 'ok',
        'frontend_path': str(FRONTEND_PATH),
    })


@app.route('/', methods=['GET', 'HEAD'])
def index():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/<path:path>', methods=['GET', 'HEAD'])
def serve_files(path):
    requested = FRONTEND_PATH / path

    if requested.exists() and requested.is_file():
        return send_from_directory(app.static_folder, path)

    if '.' in Path(path).name:
        return abort(404)

    return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
