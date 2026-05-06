import time
from collections import defaultdict, deque
from threading import Lock

from app.core.config import settings


class SlidingWindowLimiter:
    def __init__(self) -> None:
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def allow(self, key: str, limit: int, window_seconds: int) -> bool:
        now = time.time()
        boundary = now - window_seconds
        with self._lock:
            bucket = self._events[key]
            while bucket and bucket[0] <= boundary:
                bucket.popleft()
            if len(bucket) >= limit:
                return False
            bucket.append(now)
            return True


_limiter = SlidingWindowLimiter()
_failed_attempts: dict[str, list[float | int]] = {}
_last_message_at: dict[str, float] = {}
_state_lock = Lock()


def enforce_rate_limit(key: str, limit: int, window_seconds: int) -> bool:
    return _limiter.allow(key, limit, window_seconds)


def is_ip_locked(ip_address: str) -> bool:
    now = time.time()
    with _state_lock:
        entry = _failed_attempts.get(ip_address)
        if not entry:
            return False
        attempts, locked_until = int(entry[0]), float(entry[1])
        if locked_until and locked_until > now:
            return True
        if locked_until and locked_until <= now:
            _failed_attempts.pop(ip_address, None)
        return False


def register_failed_login(ip_address: str) -> None:
    now = time.time()
    with _state_lock:
        attempts, locked_until = _failed_attempts.get(ip_address, [0, 0.0])
        attempts = int(attempts) + 1
        if attempts >= settings.BRUTE_FORCE_MAX_ATTEMPTS:
            locked_until = now + settings.BRUTE_FORCE_LOCKOUT_SECONDS
        _failed_attempts[ip_address] = [attempts, float(locked_until)]


def clear_failed_logins(ip_address: str) -> None:
    with _state_lock:
        _failed_attempts.pop(ip_address, None)


def allow_socket_message(user_key: str, min_interval_seconds: float | None = None) -> bool:
    interval = min_interval_seconds or settings.SOCKET_MESSAGE_MIN_INTERVAL_SECONDS
    now = time.time()
    with _state_lock:
        last_seen = _last_message_at.get(user_key)
        if last_seen is not None and now - last_seen < interval:
            return False
        _last_message_at[user_key] = now
        return True
