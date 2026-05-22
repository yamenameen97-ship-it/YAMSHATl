from __future__ import annotations

import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import Request

from app.core.config import settings
from app.core.request_security import get_client_ip, get_user_agent

_SCAN_MARKERS = (
    '/.env',
    '/.git',
    '/wp-admin',
    'wp-login.php',
    'phpmyadmin',
    '/vendor/phpunit',
    '/cgi-bin',
    '/server-status',
    '/actuator',
    '/debug',
    '/boaform',
    '/hudson',
    '/jenkins',
    '/telescope',
)
_BOT_MARKERS = (
    'sqlmap',
    'nikto',
    'masscan',
    'zgrab',
    'nmap',
    'python-requests',
    'go-http-client',
    'aiohttp',
    'httpclient',
    'selenium',
    'phantomjs',
    'headless',
    'scrapy',
)

_state_lock = Lock()
_request_events: dict[str, deque[tuple[float, str]]] = defaultdict(deque)
_ip_stats: dict[str, dict] = {}


def _state_for(ip_address: str) -> dict:
    state = _ip_stats.get(ip_address)
    if state is None:
        state = {
            'blocked_until': 0.0,
            'last_seen_at': 0.0,
            'bot_hits': 0,
            'scan_hits': 0,
            'suspicious_hits': 0,
            'last_reason': '',
            'last_score': 0,
        }
        _ip_stats[ip_address] = state
    return state


def _prune_ip(ip_address: str, now: float) -> tuple[dict, deque]:
    state = _state_for(ip_address)
    queue = _request_events[ip_address]
    boundary = now - max(int(settings.THREAT_MONITOR_WINDOW_SECONDS or 60), 10)
    while queue and queue[0][0] <= boundary:
        queue.popleft()
    if state.get('blocked_until', 0.0) <= now:
        state['blocked_until'] = 0.0
    state['last_seen_at'] = now
    return state, queue


def _recent_count(queue: deque[tuple[float, str]], window_seconds: int) -> int:
    if not queue:
        return 0
    boundary = time.time() - max(int(window_seconds), 1)
    return sum(1 for stamp, _ in queue if stamp > boundary)


def _unique_paths(queue: deque[tuple[float, str]], window_seconds: int) -> int:
    boundary = time.time() - max(int(window_seconds), 1)
    return len({path for stamp, path in queue if stamp > boundary})


def _level_for_score(score: int) -> str:
    if score >= max(int(settings.BOT_SCORE_BLOCK_THRESHOLD or 80), 80):
        return 'critical'
    if score >= 45:
        return 'high'
    if score >= 20:
        return 'medium'
    return 'low'


def assess_request(request: Request, short_path: str) -> dict:
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    lowered_ua = user_agent.lower()
    lowered_path = f"/{str(short_path or '').lstrip('/')}".lower()
    now = time.time()

    with _state_lock:
        state, queue = _prune_ip(ip_address, now)
        queue.append((now, lowered_path))

        request_burst = _recent_count(queue, 10)
        unique_paths = _unique_paths(queue, 60)
        score = 0
        reasons: list[str] = []

        if request_burst > int(settings.DDOS_BURST_LIMIT_PER_10_SECONDS or 80):
            score += 100
            reasons.append('ddos_burst')

        if unique_paths > int(settings.THREAT_UNIQUE_PATH_THRESHOLD or 20):
            score += 35
            reasons.append('path_sweep')

        if any(marker in lowered_path for marker in _SCAN_MARKERS):
            score += 65
            state['scan_hits'] = int(state.get('scan_hits', 0)) + 1
            reasons.append('attack_path')

        if '..' in lowered_path or '%2e%2e' in lowered_path or '%00' in lowered_path:
            score += 70
            reasons.append('path_traversal')

        if any(marker in lowered_ua for marker in _BOT_MARKERS):
            score += 35
            state['bot_hits'] = int(state.get('bot_hits', 0)) + 1
            reasons.append('bot_signature')

        if user_agent == 'unknown':
            score += 20
            reasons.append('missing_user_agent')

        accept = str(request.headers.get('accept') or '').strip().lower()
        if not accept:
            score += 10
            reasons.append('missing_accept')

        if request.method.upper() in {'POST', 'PUT', 'PATCH', 'DELETE'} and not (
            request.headers.get('origin') or request.headers.get('x-requested-with') or request.headers.get('authorization')
        ):
            score += 15
            reasons.append('missing_browser_context')

        if state.get('bot_hits', 0) >= 3:
            score += 15
            reasons.append('repeated_bot_signature')
        if state.get('scan_hits', 0) >= 2:
            score += 20
            reasons.append('repeated_scan')

        if score >= 20:
            state['suspicious_hits'] = int(state.get('suspicious_hits', 0)) + 1
        state['last_score'] = score
        state['last_reason'] = ','.join(reasons[:4])

        if state.get('blocked_until', 0.0) > now:
            return {
                'blocked': True,
                'status_code': 429,
                'detail': 'Security shield temporarily blocked this IP',
                'reason': 'temporary_block',
                'score': 100,
                'level': 'critical',
                'ip_address': ip_address,
            }

        if 'ddos_burst' in reasons:
            state['blocked_until'] = now + max(int(settings.DDOS_BLOCK_SECONDS or 180), 30)
            return {
                'blocked': True,
                'status_code': 429,
                'detail': 'DDoS protection triggered',
                'reason': 'ddos_burst',
                'score': score,
                'level': 'critical',
                'ip_address': ip_address,
            }

        if score >= int(settings.BOT_SCORE_BLOCK_THRESHOLD or 80):
            state['blocked_until'] = now + max(int(settings.DDOS_BLOCK_SECONDS or 180) // 2, 30)
            return {
                'blocked': True,
                'status_code': 403,
                'detail': 'Suspicious activity detected',
                'reason': 'risk_score',
                'score': score,
                'level': 'critical',
                'ip_address': ip_address,
            }

        return {
            'blocked': False,
            'status_code': 200,
            'detail': '',
            'reason': ','.join(reasons[:3]),
            'score': score,
            'level': _level_for_score(score),
            'ip_address': ip_address,
            'request_burst': request_burst,
            'unique_paths': unique_paths,
        }


def get_threat_monitor_snapshot() -> dict:
    now = time.time()
    with _state_lock:
        snapshots = []
        for ip_address in list(set(_ip_stats.keys()) | set(_request_events.keys())):
            state, queue = _prune_ip(ip_address, now)
            if not queue and not state.get('blocked_until') and not state.get('suspicious_hits'):
                continue
            snapshots.append({
                'ip': ip_address,
                'blocked_until': state.get('blocked_until', 0.0),
                'recent_requests': len(queue),
                'bot_hits': int(state.get('bot_hits', 0) or 0),
                'scan_hits': int(state.get('scan_hits', 0) or 0),
                'suspicious_hits': int(state.get('suspicious_hits', 0) or 0),
                'last_reason': str(state.get('last_reason') or ''),
                'last_score': int(state.get('last_score', 0) or 0),
            })

    snapshots.sort(key=lambda item: (item['blocked_until'] > now, item['last_score'], item['recent_requests']), reverse=True)
    blocked_ips = [item for item in snapshots if item['blocked_until'] > now]
    suspicious_ips = [item for item in snapshots if item['last_score'] >= 20]
    return {
        'blocked_ip_count': len(blocked_ips),
        'suspicious_ip_count': len(suspicious_ips),
        'top_suspicious_ips': [
            {
                'ip': item['ip'],
                'last_score': item['last_score'],
                'recent_requests': item['recent_requests'],
                'reason': item['last_reason'],
                'blocked': item['blocked_until'] > now,
            }
            for item in snapshots[:5]
        ],
        'ddos_strategy': {
            'burst_limit_10s': int(settings.DDOS_BURST_LIMIT_PER_10_SECONDS or 80),
            'temporary_block_seconds': int(settings.DDOS_BLOCK_SECONDS or 180),
            'bot_score_block_threshold': int(settings.BOT_SCORE_BLOCK_THRESHOLD or 80),
        },
    }
