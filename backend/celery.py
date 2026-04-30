from __future__ import annotations

import logging
import os

from celery import Celery

from config import Config

logger = logging.getLogger(__name__)

BROKER_URL = Config.CELERY_BROKER_URL or Config.REDIS_URL or "redis://localhost:6379/0"
RESULT_BACKEND = Config.CELERY_RESULT_BACKEND or Config.REDIS_URL or BROKER_URL

celery_app = Celery(
    "yamshat",
    broker=BROKER_URL,
    backend=RESULT_BACKEND,
    include=["celery"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_ignore_result=False,
)


@celery_app.task(name="yamshat.healthcheck")
def healthcheck() -> dict:
    return {
        "ok": True,
        "broker": BROKER_URL,
        "result_backend": RESULT_BACKEND,
        "redis_env": bool(os.getenv("REDIS_URL") or os.getenv("CELERY_BROKER_URL")),
    }
