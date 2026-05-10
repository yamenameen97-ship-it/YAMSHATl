import hashlib
import time
from collections import defaultdict, deque
from threading import Lock

from app.core.config import settings
from app.core.redis import redis_client

_state_lock = Lock()
_failed_attempts: dict[str, deque[float]] = defaultdict(deque)
_last_seen: dict[str, float] = {}
_socket_nonces: dict[str, float] = {}
_abuse_blocks: dict[str, float] = {}
_recent_socket_messages: dict[str, deque[tuple[float, str]]] = defaultdict(deque)
_rate_limit_events: dict[str, deque[float]] = defaultdict(deque)


def _now() -> float:
    return time.time()


def _prune_expired(mapping: dict[str, float], now: float | None = None) -> None:
    current = _now() if now is None else now
    expired = [key for key, expires_at in mapping.items() if expires_at <= current]
    for key in expired:
        mapping.pop(key, None)


async def enforce_rate_limit(key: str, limit: int, window_seconds: int) -> bool:
    now_ms = int(_now() * 1000)
    if redis_client is not None:
        try:
            redis_key = f'rate_limit:{key}:events'
            async with redis_client.pipeline() as pipe:
                pipe.zremrangebyscore(redis_key, 0, now_ms - window_seconds * 1000)
                pipe.zadd(redis_key, {str(now_ms): now_ms})
                pipe.zcard(redis_key)
                pipe.expire(redis_key, window_seconds + 1)
                results = await pipe.execute()
            return int(results[2]) <= limit
        except Exception:
            pass

    now = _now()
    with _state_lock:
        events = _rate_limit_events[key]
        while events and events[0] <= now - window_seconds:
            events.popleft()
        events.append(now)
        return len(events) <= limit


async def allow_min_interval(key: str, min_interval_seconds: float) -> bool:
    now = _now()
    if redis_client is not None:
        try:
            redis_key = f'min_interval:{key}'
            last_seen = await redis_client.get(redis_key)
            if last_seen and (now - float(last_seen)) < max(float(min_interval_seconds or 0), 0.0):
                return False
            await redis_client.set(redis_key, now, ex=max(int(min_interval_seconds * 2 + 5), 5))
            return True
        except Exception:
            pass

    with _state_lock:
        last_seen = _last_seen.get(key)
        if last_seen is not None and (now - float(last_seen)) < max(float(min_interval_seconds or 0), 0.0):
            return False
        _last_seen[key] = now
        return True


async def is_ip_locked(ip_address: str) -> bool:
    now = _now()
    if redis_client is not None:
        try:
            locked_until = await redis_client.get(f'ip_lock:{ip_address}')
            return bool(locked_until and float(locked_until) > now)
        except Exception:
            pass

    with _state_lock:
        _prune_expired(_abuse_blocks, now)
        return (_abuse_blocks.get(f'ip_lock:{ip_address}') or 0) > now


async def register_failed_login(ip_address: str) -> None:
    now = _now()
    if redis_client is not None:
        try:
            key_attempts = f'failed_login:{ip_address}:attempts'
            key_lock = f'ip_lock:{ip_address}'
            attempts = await redis_client.incr(key_attempts)
            await redis_client.expire(key_attempts, settings.BRUTE_FORCE_LOCKOUT_SECONDS * 2)
            if attempts >= settings.BRUTE_FORCE_MAX_ATTEMPTS:
                await redis_client.set(
                    key_lock,
                    now + settings.BRUTE_FORCE_LOCKOUT_SECONDS,
                    ex=settings.BRUTE_FORCE_LOCKOUT_SECONDS,
                )
            return
        except Exception:
            pass

    with _state_lock:
        attempts = _failed_attempts[ip_address]
        while attempts and attempts[0] <= now - settings.BRUTE_FORCE_LOCKOUT_SECONDS * 2:
            attempts.popleft()
        attempts.append(now)
        if len(attempts) >= settings.BRUTE_FORCE_MAX_ATTEMPTS:
            _abuse_blocks[f'ip_lock:{ip_address}'] = now + settings.BRUTE_FORCE_LOCKOUT_SECONDS


async def clear_failed_logins(ip_address: str) -> None:
    if redis_client is not None:
        try:
            await redis_client.delete(f'failed_login:{ip_address}:attempts')
            await redis_client.delete(f'ip_lock:{ip_address}')
            return
        except Exception:
            pass

    with _state_lock:
        _failed_attempts.pop(ip_address, None)
        _abuse_blocks.pop(f'ip_lock:{ip_address}', None)


async def register_socket_nonce(key: str, nonce: str, ttl_seconds: int | None = None) -> bool:
    nonce = str(nonce or '').strip()
    if not nonce:
        return False
    ttl = max(int(ttl_seconds or settings.SOCKET_NONCE_TTL_SECONDS), 1)
    nonce_key = f'socket_nonce:{key}:{nonce}'

    if redis_client is not None:
        try:
            result = await redis_client.set(nonce_key, 1, nx=True, ex=ttl)
            return bool(result)
        except Exception:
            pass

    now = _now()
    with _state_lock:
        _prune_expired(_socket_nonces, now)
        if nonce_key in _socket_nonces:
            return False
        _socket_nonces[nonce_key] = now + ttl
        return True


async def block_socket_subject(*subjects: str, seconds: int | None = None) -> None:
    block_for = max(int(seconds or settings.SOCKET_ABUSE_BLOCK_SECONDS), 1)
    now = _now()
    if redis_client is not None:
        try:
            async with redis_client.pipeline() as pipe:
                for subject in subjects:
                    normalized = str(subject or '').strip()[:180]
                    if normalized:
                        pipe.set(f'abuse_block:{normalized}', 1, ex=block_for)
                await pipe.execute()
            return
        except Exception:
            pass

    with _state_lock:
        for subject in subjects:
            normalized = str(subject or '').strip()[:180]
            if normalized:
                _abuse_blocks[f'abuse_block:{normalized}'] = now + block_for


async def is_socket_subject_blocked(*subjects: str) -> bool:
    now = _now()
    if redis_client is not None:
        try:
            for subject in subjects:
                normalized = str(subject or '').strip()[:180]
                if normalized and await redis_client.exists(f'abuse_block:{normalized}'):
                    return True
            return False
        except Exception:
            pass

    with _state_lock:
        _prune_expired(_abuse_blocks, now)
        for subject in subjects:
            normalized = str(subject or '').strip()[:180]
            if normalized and (_abuse_blocks.get(f'abuse_block:{normalized}') or 0) > now:
                return True
        return False


async def score_socket_spam(subject: str, message: str, *, duplicate_window_seconds: int | None = None) -> dict:
    window = max(int(duplicate_window_seconds or settings.SOCKET_DUPLICATE_WINDOW_SECONDS), 1)
    now = _now()
    normalized_subject = str(subject or 'anonymous').strip()[:180] or 'anonymous'
    normalized_message = str(message or '').strip()
    fingerprint = hashlib.sha256(normalized_message.encode('utf-8')).hexdigest() if normalized_message else ''
    recent_messages: list[str] = []

    if redis_client is not None:
        try:
            redis_key = f'socket_spam:{normalized_subject}'
            async with redis_client.pipeline() as pipe:
                pipe.zremrangebyscore(redis_key, 0, now - window)
                if normalized_message:
                    pipe.zadd(redis_key, {f'{now}:{fingerprint}': now})
                pipe.zrange(redis_key, 0, -1)
                pipe.expire(redis_key, window + 5)
                results = await pipe.execute()
            raw_items = results[2] if normalized_message else results[1]
            recent_messages = [str(item).split(':', 1)[1] for item in raw_items if ':' in str(item)]
        except Exception:
            pass

    if not recent_messages:
        with _state_lock:
            queue = _recent_socket_messages[normalized_subject]
            while queue and queue[0][0] <= now - window:
                queue.popleft()
            if fingerprint:
                queue.append((now, fingerprint))
            recent_messages = [item[1] for item in queue]

    duplicate_count = recent_messages.count(fingerprint) - 1 if fingerprint and fingerprint in recent_messages else 0
    recent_count = len(recent_messages)
    score = 0
    reasons: list[str] = []

    if duplicate_count >= 1:
        score += 35 + min(duplicate_count * 10, 30)
        reasons.append('duplicate-message')
    if recent_count >= 6:
        score += 20
        reasons.append('rapid-burst')
    if normalized_message and len(set(normalized_message)) <= 3 and len(normalized_message) >= 12:
        score += 20
        reasons.append('low-entropy')
    if normalized_message and normalized_message.count('http') >= 2:
        score += 15
        reasons.append('multi-link')

    return {
        'score': score,
        'duplicate': duplicate_count > 0,
        'reasons': reasons,
        'blocked': score >= settings.SPAM_SCORE_BLOCK_THRESHOLD,
    }


async def allow_socket_message(
    user_key: str,
    min_interval_seconds: float | None = None,
    burst_limit: int | None = None,
    window_seconds: int | None = None,
) -> bool:
    interval = float(min_interval_seconds or settings.SOCKET_MESSAGE_MIN_INTERVAL_SECONDS)
    burst = int(burst_limit or settings.SOCKET_EVENT_BURST_LIMIT)
    window = int(window_seconds or settings.SOCKET_EVENT_WINDOW_SECONDS)
    if burst > 0 and window > 0 and not await enforce_rate_limit(f'socket-burst:{user_key}', burst, window):
        return False
    return await allow_min_interval(f'socket-interval:{user_key}', interval)
