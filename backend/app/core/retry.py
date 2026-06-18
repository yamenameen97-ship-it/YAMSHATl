"""
========================================================================
 Retry Decorator للعمليات الحرجة على قاعدة البيانات (v61)
========================================================================
يعالج هذا الـ decorator حالة فشل الاتصال اللحظي (transient errors)
ويعيد المحاولة مع backoff تصاعدي. مهم لـ /api/auth/login لأنه أول
endpoint يطلبه المستخدم بعد فترة خمول طويلة على Render.
"""

import functools
import logging
import time
from typing import Any, Callable, TypeVar

from sqlalchemy.exc import (
    DBAPIError,
    DisconnectionError,
    InterfaceError,
    OperationalError,
)

logger = logging.getLogger('yamshat.retry')

T = TypeVar('T')

TRANSIENT_EXCEPTIONS = (
    DisconnectionError,
    OperationalError,
    InterfaceError,
)


def db_retry(
    max_attempts: int = 3,
    initial_delay: float = 0.3,
    backoff_factor: float = 2.0,
) -> Callable:
    """Decorator يعيد محاولة دالة عند أخطاء الاتصال اللحظية.

    Example:
        @db_retry(max_attempts=3)
        def get_user(db, email):
            return db.query(User).filter_by(email=email).first()
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            delay = initial_delay
            last_exc: Exception | None = None

            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except TRANSIENT_EXCEPTIONS as exc:
                    last_exc = exc
                    logger.warning(
                        'Transient DB error in %s (attempt %d/%d): %s',
                        func.__name__, attempt, max_attempts, exc,
                    )
                    # حاول rollback إذا كان أول argument هو Session
                    _try_rollback(args)
                    if attempt < max_attempts:
                        time.sleep(delay)
                        delay *= backoff_factor
                        continue
                except DBAPIError as exc:
                    # نعيد المحاولة فقط إذا كان الخطأ "connection_invalidated"
                    if getattr(exc, 'connection_invalidated', False):
                        last_exc = exc
                        logger.warning(
                            'Connection invalidated in %s (attempt %d/%d)',
                            func.__name__, attempt, max_attempts,
                        )
                        _try_rollback(args)
                        if attempt < max_attempts:
                            time.sleep(delay)
                            delay *= backoff_factor
                            continue
                    raise

            logger.error(
                'All %d retries failed for %s', max_attempts, func.__name__,
            )
            assert last_exc is not None
            raise last_exc

        return wrapper
    return decorator


def _try_rollback(args: tuple) -> None:
    """إذا كان أول argument هو SQLAlchemy Session، نفذ rollback بأمان."""
    if not args:
        return
    first = args[0]
    rollback = getattr(first, 'rollback', None)
    if callable(rollback):
        try:
            rollback()
        except Exception:
            pass
