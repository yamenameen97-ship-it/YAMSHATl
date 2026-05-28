from contextlib import asynccontextmanager
import logging
from pathlib import Path

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

import app.models  # noqa: F401
from app.api.routes import (
    admin, analytics, auth, chat, comments, follow, groups, inbox,
    live, notifications, posts, reels, search, stories, upload, users, ws,
)
from app.core.api_guard import api_rate_guard
from app.core.config import settings
from app.core.error_handlers import register_error_handlers
from app.core.logging_setup import configure_logging
from app.core.observability import configure_metrics, configure_tracing, make_metrics_router
from app.core.security_extra import security_headers
from app.core.socket_server import sio
from app.db.bootstrap import initialize_database
from app.db.session import engine

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # IMPORTANT: On force toujours la normalisation du schéma au démarrage
    # car la base de données live (PostgreSQL externe) peut être désynchronisée
    # avec les modèles SQLAlchemy. Cela ajoute notamment la colonne
    # `notifications.user_id` manquante qui causait des 500 sur les
    # endpoints /api/notifications et créait des fausses erreurs CORS côté front.
    try:
        initialize_database(engine, force=False)
        logger.info('Database initialized successfully on startup.')
    except Exception as exc:
        logger.exception('Database initialization failed on startup: %s', exc)
        # On ne lève pas l'exception : on laisse le serveur démarrer en mode
        # dégradé pour pouvoir exposer /health avec l'erreur DB et permettre
        # le diagnostic plutôt que d'avoir un crash silencieux de Render.
    yield


def _database_status() -> dict:
    try:
        with engine.connect() as connection:
            connection.execute(text('SELECT 1'))
        return {'database': 'ok'}
    except Exception as exc:
        return {
            'database': 'error',
            'database_error': str(exc)[:300],
        }


configure_logging()

fastapi_app = FastAPI(
    title=settings.PROJECT_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
    # Désactivation du redirect automatique sur trailing slash car il supprime
    # les CORS headers et casse les requêtes avec credentials.
    redirect_slashes=False,
)

# ===========================================================================
# Ordre des middlewares FastAPI/Starlette :
# Les middlewares s'exécutent en LIFO (last added, first executed).
# On ajoute donc d'abord les autres middlewares, et CORSMiddleware en dernier
# pour qu'il soit le premier à recevoir la requête et le dernier à toucher la
# réponse. Ainsi toute erreur (403, 429, 500) revient avec les headers CORS.
# ===========================================================================

# 1. Error handlers en premier (request_context_middleware + exception handlers)
register_error_handlers(fastapi_app)

# 2. Autres middlewares (security_headers + api_rate_guard)
fastapi_app.middleware('http')(security_headers)
fastapi_app.middleware('http')(api_rate_guard)

# 3. CORSMiddleware en dernier ⇒ premier à s'exécuter, dernier à toucher la réponse
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allow_headers=['*'],
    expose_headers=['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-Id'],
    max_age=86400,
)

if settings.ENABLE_METRICS:
    configure_metrics(fastapi_app, settings.SERVICE_NAME)
fastapi_app.include_router(make_metrics_router())
configure_tracing(fastapi_app, settings.SERVICE_NAME)

uploads_dir = Path(__file__).resolve().parents[2] / 'uploads'
uploads_dir.mkdir(exist_ok=True)
fastapi_app.mount('/uploads', StaticFiles(directory=str(uploads_dir)), name='uploads')

fastapi_app.include_router(auth.router, prefix=f'{settings.API_PREFIX}/auth', tags=['auth'])
fastapi_app.include_router(users.router, prefix=f'{settings.API_PREFIX}/users', tags=['users'])
fastapi_app.include_router(posts.router, prefix=f'{settings.API_PREFIX}/posts', tags=['posts'])
fastapi_app.include_router(reels.router, prefix=settings.API_PREFIX, tags=['reels'])
fastapi_app.include_router(comments.router, prefix=f'{settings.API_PREFIX}/comments', tags=['comments'])
fastapi_app.include_router(inbox.router, prefix=f'{settings.API_PREFIX}/inbox', tags=['inbox'])
fastapi_app.include_router(follow.router, prefix=f'{settings.API_PREFIX}/follows', tags=['follows'])
fastapi_app.include_router(notifications.router, prefix=f'{settings.API_PREFIX}/notifications', tags=['notifications'])
fastapi_app.include_router(search.router, prefix=f'{settings.API_PREFIX}/search', tags=['search'])
fastapi_app.include_router(upload.router, prefix=f'{settings.API_PREFIX}/upload', tags=['upload'])
fastapi_app.include_router(analytics.router, prefix=f'{settings.API_PREFIX}/analytics', tags=['analytics'])
fastapi_app.include_router(admin.router, prefix=f'{settings.API_PREFIX}/admin', tags=['admin'])
fastapi_app.include_router(live.router, prefix=settings.API_PREFIX, tags=['live'])
fastapi_app.include_router(chat.router, prefix=settings.API_PREFIX, tags=['chat'])
fastapi_app.include_router(stories.router, prefix=settings.API_PREFIX, tags=['stories'])
fastapi_app.include_router(groups.router, prefix=settings.API_PREFIX, tags=['groups'])
fastapi_app.include_router(ws.router, tags=['ws'])


@fastapi_app.api_route('/', methods=['GET', 'HEAD'])
def root() -> dict:
    return {
        'message': 'YAMSHAT FastAPI backend is running',
        'docs': '/docs',
        'health': '/health',
        'metrics': '/metrics',
        'service': settings.SERVICE_NAME,
        'socketio': '/socket.io',
        'uploads': '/uploads',
        'analytics': f'{settings.API_PREFIX}/analytics/events',
    }


@fastapi_app.api_route('/health', methods=['GET', 'HEAD'])
def health() -> dict:
    database_status = _database_status()
    status_label = 'ok' if database_status.get('database') == 'ok' else 'degraded'
    return {
        'status': status_label,
        **database_status,
        'docs': '/docs',
        'metrics': '/metrics',
        'service': settings.SERVICE_NAME,
        'livekit_configured': bool(settings.LIVEKIT_URL and settings.LIVEKIT_API_KEY and settings.LIVEKIT_API_SECRET),
        'cloudinary_configured': bool(settings.cloudinary_configured),
        'analytics_enabled': bool(settings.ANALYTICS_ENABLED),
        'push_provider': settings.PUSH_PROVIDER,
    }


app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app, socketio_path='socket.io')
