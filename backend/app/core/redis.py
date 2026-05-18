import logging
import os

try:
    import redis.asyncio as redis
except Exception:  # pragma: no cover
    redis = None

logger = logging.getLogger(__name__)

REDIS_CLUSTER_URL = (os.getenv('REDIS_CLUSTER_URL') or '').strip()
REDIS_URL = (REDIS_CLUSTER_URL or os.getenv('REDIS_URL') or 'redis://localhost:6379').strip()

if redis is not None:
    redis_client = redis.from_url(
        REDIS_URL,
        decode_responses=True,
        health_check_interval=30,
        socket_connect_timeout=2,
        socket_timeout=2,
    )
else:  # pragma: no cover
    redis_client = None
    logger.warning('redis.asyncio is unavailable; Redis-backed features will use fallback logic.')
