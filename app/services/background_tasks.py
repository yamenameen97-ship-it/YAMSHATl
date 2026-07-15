"""
Scheduled post publishing + expired stories purge — v84.0 stories audit.

Replaces the previous print() placeholder with a real DB-backed job that:
  1) Persists scheduled_at on the Post row (already handled by create_post/update_post).
  2) On every publish() sweep, queries the DB for due posts and marks them published.
  3) Provides a lightweight startup hook that spawns a background thread to sweep
     every 60 seconds so scheduled posts are actually published without a Celery/RQ worker.
  4) v84.0 — also purges expired stories every sweep (was previously only
     triggered on user reads → stories from inactive users piled up forever).

Everything is DB-persistent — scheduling survives restarts.
"""
from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

_SCHEDULER_LOCK = threading.Lock()
_SCHEDULER_STARTED = False
_SWEEP_INTERVAL_SECONDS = 60
# v84.0 — القصص المنتهية تُنظَّف كل 5 دقائق (أخف على DB من كل 60s)
_STORIES_PURGE_INTERVAL_SECONDS = 300
_LAST_STORIES_PURGE_TS = 0.0


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def schedule_post_publishing(post_id: int, scheduled_at: datetime) -> dict:
    """
    Register a scheduled post. Persistence is already guaranteed by the Post row
    (posts.scheduled_at column). We simply confirm the entry and let the sweeper
    publish it when the time comes.
    """
    logger.info("Post %s scheduled for publishing at %s (UTC)", post_id, scheduled_at)
    _ensure_scheduler_running()
    return {"post_id": post_id, "scheduled_at": scheduled_at.isoformat() if scheduled_at else None, "queued": True}


def publish_due_posts_once() -> int:
    """
    Sweep once: publish any posts whose scheduled_at has passed and are not yet published.
    Returns the number of posts that were flipped to published.
    Safe to call from HTTP handlers, cron, or background thread.
    """
    from app.db.session import SessionLocal  # local import to avoid circular
    from app.models.post import Post

    published_count = 0
    now = _utcnow_naive()
    db = SessionLocal()
    try:
        due_posts = (
            db.query(Post)
            .filter(
                Post.is_draft.is_(False),
                Post.scheduled_at.isnot(None),
                Post.scheduled_at <= now,
                Post.published_at.is_(None),
            )
            .all()
        )
        for post in due_posts:
            post.published_at = post.scheduled_at or now
            post.updated_at = now
            published_count += 1
        if published_count:
            db.commit()
            logger.info("Sweeper published %s scheduled posts", published_count)
    except Exception as exc:
        logger.exception("Scheduled-posts sweeper failed: %s", exc)
        try:
            db.rollback()
        except Exception:
            pass
    finally:
        db.close()
    return published_count


def purge_expired_stories_once() -> int:
    """
    v84.0 — يحذف القصص المنتهية (باستثناء highlights) من Postgres وينظّف
    وسائطها من Cloudinary. لا يعتمد على أن يفتح مستخدم قائمة قصص.

    Returns: عدد القصص المحذوفة.
    Safe to call from HTTP handlers, cron, or background thread.
    """
    from app.db.session import SessionLocal  # local import to avoid circular

    db = SessionLocal()
    try:
        # الاستيراد داخل الدالة لتفادي أي دوائر استيراد
        from app.services.story_db_service import purge_expired
        count = purge_expired(db)
        if count:
            logger.info("Stories sweeper purged %s expired stories", count)
        return count
    except Exception as exc:
        logger.exception("Expired-stories sweeper failed: %s", exc)
        try:
            db.rollback()
        except Exception:
            pass
        return 0
    finally:
        db.close()


def _scheduler_loop() -> None:
    global _LAST_STORIES_PURGE_TS
    while True:
        try:
            publish_due_posts_once()
        except Exception as exc:  # defensive — never let the thread die
            logger.exception("Scheduler loop error: %s", exc)
        try:
            now_ts = time.time()
            if now_ts - _LAST_STORIES_PURGE_TS >= _STORIES_PURGE_INTERVAL_SECONDS:
                purge_expired_stories_once()
                _LAST_STORIES_PURGE_TS = now_ts
        except Exception as exc:
            logger.exception("Stories purge loop error: %s", exc)
        time.sleep(_SWEEP_INTERVAL_SECONDS)


def _ensure_scheduler_running() -> None:
    global _SCHEDULER_STARTED
    if _SCHEDULER_STARTED:
        return
    with _SCHEDULER_LOCK:
        if _SCHEDULER_STARTED:
            return
        try:
            thread = threading.Thread(target=_scheduler_loop, name="post-scheduler-sweeper", daemon=True)
            thread.start()
            _SCHEDULER_STARTED = True
            logger.info("Post scheduler background sweeper started (interval=%ss)", _SWEEP_INTERVAL_SECONDS)
        except Exception as exc:
            logger.exception("Failed to start post scheduler thread: %s", exc)


def start_post_scheduler() -> None:
    """
    Public hook to call at FastAPI startup so the sweeper is running even
    before the first scheduled post is created.

    v84.0: نفس الـsweeper يعالج تنظيف القصص المنتهية كل 5 دقائق.
    """
    _ensure_scheduler_running()


def start_all_schedulers() -> None:
    """Alias واضح — يبدأ كل مهام الخلفية (منشورات + قصص)."""
    _ensure_scheduler_running()


# =========================================================================
# ✅ v85.4 FIX #4 — Celery task لتنظيف القصص المنتهية
# =========================================================================
# المشكلة السابقة: _scheduler_loop() يعمل داخل thread داخل كل واحد من
# workers gunicorn — أي أنه يُشغَّل N مرة (مرة لكل worker) → احتمال
# race conditions في purge_expired وتفويت موارد. الأدق أن يُشغل مرة
# واحدة مركزية من خلال celery beat.
#
# يبقى thread الداخلي fallback لافتراضية في حال لم يتوفر celery beat.

try:
    from app.celery_app import celery_app as _celery_app  # type: ignore

    @_celery_app.task(name='app.services.background_tasks.purge_expired_stories_task')
    def purge_expired_stories_task() -> int:  # pragma: no cover
        """Celery beat task — يحذف القصص المنتهية مرة كل 5 دقائق."""
        return purge_expired_stories_once()
except Exception as _exc:  # pragma: no cover
    logger.debug('Celery task registration skipped: %s', _exc)
