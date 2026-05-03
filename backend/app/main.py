from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401
from app.api.routes import auth, chat, comments, follow, inbox, notifications, posts, users, ws
from app.api.routes import search, upload
from app.core.config import settings
from app.core.observability import configure_metrics, configure_tracing, make_metrics_router
from app.core.security_extra import security_headers
from app.db.bootstrap import initialize_database
from app.db.session import engine


@asynccontextmanager
async def lifespan(_app: FastAPI):
    initialize_database(engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
app.middleware('http')(security_headers)

if settings.ENABLE_METRICS:
    configure_metrics(app, settings.SERVICE_NAME)
app.include_router(make_metrics_router())
configure_tracing(app, settings.SERVICE_NAME)

app.include_router(auth.router, prefix=f'{settings.API_PREFIX}/auth', tags=['auth'])
app.include_router(users.router, prefix=f'{settings.API_PREFIX}/users', tags=['users'])
app.include_router(posts.router, prefix=f'{settings.API_PREFIX}/posts', tags=['posts'])
app.include_router(comments.router, prefix=f'{settings.API_PREFIX}/comments', tags=['comments'])
app.include_router(inbox.router, prefix=f'{settings.API_PREFIX}/inbox', tags=['inbox'])
app.include_router(follow.router, prefix=f'{settings.API_PREFIX}/follows', tags=['follows'])
app.include_router(notifications.router, prefix=f'{settings.API_PREFIX}/notifications', tags=['notifications'])
app.include_router(search.router, prefix=f'{settings.API_PREFIX}/search', tags=['search'])
app.include_router(upload.router, prefix=f'{settings.API_PREFIX}/upload', tags=['upload'])
app.include_router(chat.router, tags=['chat'])
app.include_router(ws.router, tags=['ws'])


@app.get('/')
def root() -> dict:
    return {
        'message': 'YAMSHAT FastAPI backend is running',
        'docs': '/docs',
        'health': '/health',
        'metrics': '/metrics',
        'service': settings.SERVICE_NAME,
    }


@app.get('/health')
def health() -> dict:
    return {
        'status': 'ok',
        'database': 'configured',
        'docs': '/docs',
        'metrics': '/metrics',
        'service': settings.SERVICE_NAME,
    }
