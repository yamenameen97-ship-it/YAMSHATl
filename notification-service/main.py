from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401
from app.api.routes import notifications
from app.core.config import settings
from app.core.observability import configure_metrics, configure_tracing, make_metrics_router
from app.db.bootstrap import initialize_database
from app.db.session import engine


@asynccontextmanager
async def lifespan(_app: FastAPI):
    initialize_database(engine)
    yield


app = FastAPI(title='YAMSHAT Notification Service', debug=settings.DEBUG, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
configure_metrics(app, 'notification-service')
configure_tracing(app, 'notification-service')
app.include_router(make_metrics_router())
app.include_router(notifications.router, prefix=f'{settings.API_PREFIX}/notifications', tags=['notifications'])


@app.get('/')
def root():
    return {'service': 'notification-service', 'status': 'ok', 'docs': '/docs', 'metrics': '/metrics'}


@app.get('/health')
def health():
    return {'service': 'notification-service', 'status': 'ok'}
