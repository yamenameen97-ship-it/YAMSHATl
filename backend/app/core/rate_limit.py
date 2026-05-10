import hashlib
import time
from collections import defaultdict, deque
from threading import Lock
import asyncio

from app.core.config import settings
from app.core.redis import redis_client


# No longer using in-memory SlidingWindowLimiter for distributed rate limiting
# _limiter = SlidingWindowLimiter() # Removed

# Using Redis for distributed state management
# _failed_attempts: dict[str, list[float | int]] = {} # Removed
# _last_message_at: dict[str, float] = {} # Removed
# _socket_nonces: dict[str, float] = {} # Removed
# _abuse_blocks: dict[str, float] = {} # Removed
# _recent_socket_messages: dict[str, deque[tuple[float, str]]] = defaultdict(deque) # Removed
# _state_lock = Lock() # Removed



async def enforce_rate_limit(key: str, limit: int, window_seconds: int) -> bool:
    # Using Redis for distributed sliding window rate limiting
    now = int(time.time() * 1000)  # Milliseconds
    key_events = f"rate_limit:{key}:events"
    key_count = f"rate_limit:{key}:count"

    # Remove old timestamps and count new ones in a transaction
    async with redis_client.pipeline() as pipe:
        pipe.zremrangebyscore(key_events, 0, now - window_seconds * 1000)
        pipe.zadd(key_events, {now: now})
        pipe.zcard(key_events)
        pipe.expire(key_events, window_seconds + 1) # +1 to ensure key doesn't expire prematurely
        results = await pipe.execute()
    
    current_requests = results[2]
    return current_requests <= limit



async def allow_min_interval(key: str, min_interval_seconds: float) -> bool:
    # Using Redis for distributed minimum interval limiting
    last_seen = await redis_client.get(f"min_interval:{key}")
    now = time.time()
    if last_seen and (now - float(last_seen)) < max(float(min_interval_seconds or 0), 0.0):
        return False
    await redis_client.set(f"min_interval:{key}", now, ex=int(min_interval_seconds * 2 + 5)) # Expire after a reasonable time
    return True



async def is_ip_locked(ip_address: str) -> bool:
    # Using Redis for distributed IP locking
    locked_until = await redis_client.get(f"ip_lock:{ip_address}")
    if locked_until and float(locked_until) > time.time():
        return True
    return False



async def register_failed_login(ip_address: str) -> None:
    # Using Redis for distributed failed login tracking
    key_attempts = f"failed_login:{ip_address}:attempts"
    key_lock = f"ip_lock:{ip_address}"

    attempts = await redis_client.incr(key_attempts)
    await redis_client.expire(key_attempts, settings.BRUTE_FORCE_LOCKOUT_SECONDS * 2) # Keep attempts for longer

    if attempts >= settings.BRUTE_FORCE_MAX_ATTEMPTS:
        await redis_client.set(key_lock, time.time() + settings.BRUTE_FORCE_LOCKOUT_SECONDS, ex=settings.BRUTE_FORCE_LOCKOUT_SECONDS)



async def clear_failed_logins(ip_address: str) -> None:
    # Clear failed login attempts and IP lock from Redis
    await redis_client.delete(f"failed_login:{ip_address}:attempts")
    await redis_client.delete(f"ip_lock:{ip_address}")



async def register_socket_nonce(key: str, nonce: str, ttl_seconds: int | None = None) -> bool:
    nonce = str(nonce or "").strip()
    if not nonce:
        return False
    ttl = max(int(ttl_seconds or settings.SOCKET_NONCE_TTL_SECONDS), 1)
    nonce_key = f"socket_nonce:{key}:{nonce}"
    # Set if not exists (NX) and set expiry (EX)
    result = await redis_client.set(nonce_key, 1, nx=True, ex=ttl)
    return result is not None # Returns 1 if set, None if already exists



async def block_socket_subject(*subjects: str, seconds: int | None = None) -> None:
    block_for = max(int(seconds or settings.SOCKET_ABUSE_BLOCK_SECONDS), 1)
    for subject in subjects:
        normalized = str(subject or \'\').strip()[:180]
        if normalized:
            await redis_client.set(f"abuse_block:{normalized}", 1, ex=block_for)



async def is_socket_subject_blocked(*subjects: str) -> bool:
    for subject in subjects:
        normalized = str(subject or \'\').strip()[:180]
        if normalized and await redis_client.exists(f"abuse_block:{normalized}"):
            return True
    return False



async def score_socket_spam(subject: str, message: str, *, duplicate_window_seconds: int | None = None) -> dict:
    window = max(int(duplicate_window_seconds or settings.SOCKET_DUPLICATE_WINDOW_SECONDS), 1)
    now = time.time()
    normalized = str(subject or '').strip()[:180]
    fingerprint = hashlib.sha256(normalized_message.encode(\'utf-8\')).hexdigest() if normalized_message else \'\'
    key = str(subject or \'anonymous\')[:180]
    score = 0
    reasons: list[str] = []

    # Use Redis Sorted Set for recent messages to track duplicates and rapid bursts
    redis_key = f"socket_spam:{key}"
    
    async with redis_client.pipeline() as pipe:
        pipe.zremrangebyscore(redis_key, 0, now - window)
        if normalized_message:
            pipe.zadd(redis_key, {f"{now}:{fingerprint}": now})
        pipe.zrange(redis_key, 0, -1, withscores=False)
        pipe.expire(redis_key, window + 5) # Keep for a bit longer than window
        results = await pipe.execute()
    
    recent_messages_raw = results[2] if normalized_message else results[1]
    recent_messages = [item.split(":")[1] for item in recent_messages_raw]

    duplicate_count = recent_messages.count(fingerprint) - 1 if fingerprint in recent_messages else 0
    recent_count = len(recent_messages)

    if duplicate_count >= 1:
        score += 35 + min(duplicate_count * 10, 30)
        reasons.append(\'duplicate-message\')
    if recent_count >= 6:
        score += 20
        reasons.append(\'rapid-burst\')
    if normalized_message and len(set(normalized_message)) <= 3 and len(normalized_message) >= 12:
        score += 20
        reasons.append(\'low-entropy\')
    if normalized_message and normalized_message.count(\'http\') >= 2:
        score += 15
        reasons.append(\'multi-link\')

    return {
        \'score\': score,
        \'duplicate\': duplicate_count > 0,
        \'reasons\': reasons,
        \'blocked\': score >= settings.SPAM_SCORE_BLOCK_THRESHOLD,
    }



def allow_socket_message(
    user_key: str,
    min_interval_seconds: float | None = None,
    burst_limit: int | None = None,
    window_seconds: int | None = None,
) -> bool:
    interval = float(min_interval_seconds or settings.SOCKET_MESSAGE_MIN_INTERVAL_SECONDS)
    burst = int(burst_limit or settings.SOCKET_EVENT_BURST_LIMIT)
    window = int(window_seconds or settings.SOCKET_EVENT_WINDOW_SECONDS)    if burst > 0 and window > 0 and not await enforce_rate_limit(f\'socket-burst:{user_key}\' burst, window):
        return False
    return allow_min_interval(f'socket-interval:{user_key}', interval)
