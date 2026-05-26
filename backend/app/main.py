from contextlib import asynccontextmanager
from pathlib import Path

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

import app.models  # noqa: F401
from app.api.routes import admin, analytics, auth, chat, comments, follow, groups, inbox, live, notifications, posts, search, stories, upload, users, ws
from app.core.api_guard import api_rate_guard
from app.core.config import settings
from app.core.error_handlers import register_error_handlers
from app.core.logging_setup import configure_logging
from app.core.observability import configure_metrics, configure_tracing, make_metrics_router
from app.core.security_extra import security_headers
from app.core.socket_server import sio
from app.db.bootstrap import initialize_database
from app.db.session import engine


@asynccontextmanager
async def lifespan(_app: FastAPI):
    initialize_database(engine)
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
)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost: 3000',
        'http://localhost: 5173',
        'http://127.0.0.1:5173',
        'https://yamshatl-1-yg1o.onrender.com',
        'https://yamshatl-ahj8.onrender.com'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
# دالتان وسيطتان ذكيتان لتخطي فحص الأمان لروابط الكابتشا والـ Refresh والـ OPTIONS
async def smart_rate_guard(request, call_next):
    if request.method.upper() == "OPTIONS" or "captcha" in request.url.path or "refresh" in request.url.path:
        return await call_next(request)
    return await api_rate_guard(request, call_next)

async def smart_security_headers(request, call_next):
    if request.method.upper() == "OPTIONS" or "captcha" in request.url.path or "refresh" in request.url.path:
        return await call_next(request)
    return await security_headers(request, call_next)

# تشغيل الدوال الذكية المطورة (تأكد أن هذه الأسطر الثلاثة تحت الدوال مباشرة)
fastapi_app.middleware('http')(smart_rate_guard)
fastapi_app.middleware('http')(smart_security_headers)
register_error_handlers(fastapi_app)
uploads_dir = Path(__file__).resolve().parents[2] / 'uploads'
uploads_dir.mkdir(exist_ok=True)
fastapi_app.mount('/uploads', StaticFiles(directory=str(uploads_dir)), name='uploads')

fastapi_app.include_router(auth.router, prefix=f'{settings.API_PREFIX}/auth', tags=['auth'])
fastapi_app.include_router(users.router, prefix=f'{settings.API_PREFIX}/users', tags=['users'])
fastapi_app.include_router(posts.router, prefix=f'{settings.API_PREFIX}/posts', tags=['posts'])
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
    status = 'ok' if database_status.get('database') == 'ok' else 'degraded'
    return {
        'status': status,
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
