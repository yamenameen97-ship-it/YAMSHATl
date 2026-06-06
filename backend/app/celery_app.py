from celery import Celery
from celery.schedules import crontab
import os

REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

celery_app = Celery(
    'yamshat_tasks',
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        'app.services.email',
        'app.services.media_service',
        'app.services.notification_service',
        'app.services.analytics_service'
    ]
)

celery_app.conf.update(
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='UTC',
    enable_utc=True,
)

# جدولة مهام التنظيف التلقائية
celery_app.conf.beat_schedule = {
    'cleanup-media-every-night': {
        'task': 'app.services.media_service.cleanup_job',
        'schedule': crontab(hour=2, minute=0),
    },
    'cleanup-expired-sessions': {
        'task': 'app.services.auth_service.cleanup_sessions',
        'schedule': crontab(hour=3, minute=0),
    },
    'cleanup-dead-rooms': {
        'task': 'app.services.live_service.cleanup_dead_rooms',
        'schedule': crontab(minute='*/30'),
    }
}
