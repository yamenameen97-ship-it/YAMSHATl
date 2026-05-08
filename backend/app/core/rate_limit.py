import hashlib
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
_socket_nonces: dict[str, float] = {}
_abuse_blocks: dict[str, float] = {}
_recent_socket_messages: dict[str, deque[tuple[float, str]]] = defaultdict(deque)
_state_lock = Lock()


def enforce_rate_limit(key: str, limit: int, window_seconds: int) -> bool:
    return _limiter.allow(key, limit, window_seconds)


def allow_min_interval(key: str, min_interval_seconds: float) -> bool:
    now = time.time()
    with _state_lock:
        last_seen = _last_message_at.get(key)
        if last_seen is not None and now - last_seen < max(float(min_interval_seconds or 0), 0.0):
            return False
        _last_message_at[key] = now
        return True


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


def register_socket_nonce(key: str, nonce: str, ttl_seconds: int | None = None) -> bool:
    nonce = str(nonce or '').strip()[:128]
    if not nonce:
        return False
    ttl = max(int(ttl_seconds or settings.SOCKET_NONCE_TTL_SECONDS), 1)
    now = time.time()
    nonce_key = f'{key}:{nonce}'
    with _state_lock:
        expired = [item for item, until in _socket_nonces.items() if until <= now]
        for item in expired:
            _socket_nonces.pop(item, None)
        if nonce_key in _socket_nonces:
            return False
        _socket_nonces[nonce_key] = now + ttl
        return True


def block_socket_subject(*subjects: str, seconds: int | None = None) -> None:
    now = time.time()
    block_for = max(int(seconds or settings.SOCKET_ABUSE_BLOCK_SECONDS), 1)
    with _state_lock:
        for subject in subjects:
            normalized = str(subject or '').strip()[:180]
            if normalized:
                _abuse_blocks[normalized] = now + block_for


def is_socket_subject_blocked(*subjects: str) -> bool:
    now = time.time()
    with _state_lock:
        expired = [subject for subject, until in _abuse_blocks.items() if until <= now]
        for subject in expired:
            _abuse_blocks.pop(subject, None)
        return any(subject and _abuse_blocks.get(str(subject).strip()[:180], 0) > now for subject in subjects)


def score_socket_spam(subject: str, message: str, *, duplicate_window_seconds: int | None = None) -> dict:
    window = max(int(duplicate_window_seconds or settings.SOCKET_DUPLICATE_WINDOW_SECONDS), 1)
    now = time.time()
    normalized_message = ' '.join(str(message or '').strip().lower().split())[:500]
    fingerprint = hashlib.sha256(normalized_message.encode('utf-8')).hexdigest() if normalized_message else ''
    key = str(subject or 'anonymous')[:180]
    score = 0
    reasons: list[str] = []

    with _state_lock:
        bucket = _recent_socket_messages[key]
        while bucket and bucket[0][0] <= now - window:
            bucket.popleft()
        duplicate_count = sum(1 for _, item in bucket if item == fingerprint and fingerprint)
        recent_count = len(bucket)
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
        bucket.append((now, fingerprint))

    return {
        'score': score,
        'duplicate': duplicate_count > 0,
        'reasons': reasons,
        'blocked': score >= settings.SPAM_SCORE_BLOCK_THRESHOLD,
    }


def allow_socket_message(
    user_key: str,
    min_interval_seconds: float | None = None,
    burst_limit: int | None = None,
    window_seconds: int | None = None,
) -> bool:
    interval = float(min_interval_seconds or settings.SOCKET_MESSAGE_MIN_INTERVAL_SECONDS)
    burst = int(burst_limit or settings.SOCKET_EVENT_BURST_LIMIT)
    window = int(window_seconds or settings.SOCKET_EVENT_WINDOW_SECONDS)
    if burst > 0 and window > 0 and not _limiter.allow(f'socket-burst:{user_key}', burst, window):
        return False
    return allow_min_interval(f'socket-interval:{user_key}', interval)
