from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401
from app.api.routes import auth, comments, follow, posts, users
from app.core.config import settings
from app.core.observability import configure_metrics, configure_tracing, make_metrics_router
from app.db.bootstrap import initialize_database
from app.db.session import engine


@asynccontextmanager
async def lifespan(_app: FastAPI):
    initialize_database(engine)
    yield


app = FastAPI(title='YAMSHAT User Service', debug=settings.DEBUG, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
configure_metrics(app, 'user-service')
configure_tracing(app, 'user-service')
app.include_router(make_metrics_router())
app.include_router(auth.router, prefix=f'{settings.API_PREFIX}/auth', tags=['auth'])
app.include_router(users.router, prefix=f'{settings.API_PREFIX}/users', tags=['users'])
app.include_router(posts.router, prefix=f'{settings.API_PREFIX}/posts', tags=['posts'])
app.include_router(comments.router, prefix=f'{settings.API_PREFIX}/comments', tags=['comments'])
app.include_router(follow.router, prefix=f'{settings.API_PREFIX}/follows', tags=['follows'])


@app.get('/')
def root():
    return {'service': 'user-service', 'status': 'ok', 'docs': '/docs', 'metrics': '/metrics'}


@app.get('/health')
def health():
    return {'service': 'user-service', 'status': 'ok'}
