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
        'app.services.analytics_service',
        # ✅ v85.4 FIX #4: تسجيل background_tasks لـ stories purge
        'app.services.background_tasks',
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
    },
    # ✅ v85.4 FIX #4: تنظيف القصص المنتهية كل 5 دقائق (إذا توفر celery beat).
    # في background_tasks._scheduler_loop هناك thread يقوم بالمهمة
    # لكنه يفشل مع gunicorn multi-worker (كل worker يشغل نسخته).
    # مع celery beat تُضمن تشغيلة واحدة مركزية.
    'purge-expired-stories': {
        'task': 'app.services.background_tasks.purge_expired_stories_task',
        'schedule': crontab(minute='*/5'),
    },
}
