from contextlib import asynccontextmanager

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401
from app.api.routes import auth, chat, comments, follow, inbox, notifications, posts, users, ws
from app.api.routes import admin, live, search, upload
from app.core.config import settings
from app.core.observability import configure_metrics, configure_tracing, make_metrics_router
from app.core.security_extra import security_headers
from app.core.socket_server import sio
from app.db.bootstrap import initialize_database
from app.db.session import engine


@asynccontextmanager
async def lifespan(_app: FastAPI):
    initialize_database(engine)
    yield


fastapi_app = FastAPI(
    title=settings.PROJECT_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
fastapi_app.middleware('http')(security_headers)

if settings.ENABLE_METRICS:
    configure_metrics(fastapi_app, settings.SERVICE_NAME)
fastapi_app.include_router(make_metrics_router())
configure_tracing(fastapi_app, settings.SERVICE_NAME)

fastapi_app.include_router(auth.router, prefix=f'{settings.API_PREFIX}/auth', tags=['auth'])
fastapi_app.include_router(users.router, prefix=f'{settings.API_PREFIX}/users', tags=['users'])
fastapi_app.include_router(posts.router, prefix=f'{settings.API_PREFIX}/posts', tags=['posts'])
fastapi_app.include_router(comments.router, prefix=f'{settings.API_PREFIX}/comments', tags=['comments'])
fastapi_app.include_router(inbox.router, prefix=f'{settings.API_PREFIX}/inbox', tags=['inbox'])
fastapi_app.include_router(follow.router, prefix=f'{settings.API_PREFIX}/follows', tags=['follows'])
fastapi_app.include_router(notifications.router, prefix=f'{settings.API_PREFIX}/notifications', tags=['notifications'])
fastapi_app.include_router(search.router, prefix=f'{settings.API_PREFIX}/search', tags=['search'])
fastapi_app.include_router(upload.router, prefix=f'{settings.API_PREFIX}/upload', tags=['upload'])
fastapi_app.include_router(admin.router, prefix=f'{settings.API_PREFIX}/admin', tags=['admin'])
fastapi_app.include_router(live.router, prefix=settings.API_PREFIX, tags=['live'])
fastapi_app.include_router(chat.router, prefix=settings.API_PREFIX, tags=['chat'])
fastapi_app.include_router(ws.router, tags=['ws'])


@fastapi_app.get('/')
def root() -> dict:
    return {
        'message': 'YAMSHAT FastAPI backend is running',
        'docs': '/docs',
        'health': '/health',
        'metrics': '/metrics',
        'service': settings.SERVICE_NAME,
        'socketio': '/socket.io',
    }


@fastapi_app.get('/health')
def health() -> dict:
    return {
        'status': 'ok',
        'database': 'configured',
        'docs': '/docs',
        'metrics': '/metrics',
        'service': settings.SERVICE_NAME,
        'livekit_configured': bool(settings.LIVEKIT_URL and settings.LIVEKIT_API_KEY and settings.LIVEKIT_API_SECRET),
    }


app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app, socketio_path='socket.io')
