from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.rate_limit import enforce_rate_limit
from app.core.threat_monitor import assess_request


PUBLIC_AUTH_PATHS = {
    '/auth/login',
    '/auth/register',
    '/auth/verify-email',
    '/auth/resend-verification',
    '/auth/refresh',
    '/auth/forgot-password',
    '/auth/verify-reset-code',
    '/auth/reset-password',
}

# Endpoints à haut volume (chat, présence, upload, notifications) — on leur
# accorde un quota plus large car le frontend peut légitimement envoyer
# plusieurs requêtes par seconde (offline-queue flush, polling présence,
# upload chunké, etc.). Sans cela, /api/send_message déclenche en boucle
# des 429 (Too Many Requests) puis la file d'attente offline retente
# indéfiniment.
HIGH_VOLUME_PATHS = (
    '/send_message',
    '/message_seen',
    '/upload',
    '/notifications',
    '/presence',
    '/chat_threads',
    '/messages',
    '/update_online',
    '/typing',
    '/live',
)

# Endpoints quasi-statiques (lectures profile, prefs) — limite généreuse
# pour ne jamais bloquer le chargement initial.
READ_ONLY_PATHS = (
    '/users/profile/',
    '/users/preferences',
    '/users/trusted-devices',
    '/users/login-alerts',
    '/users/sessions',
    '/users/login-activity',
    '/users/me',
)


def client_ip(request: Request) -> str:
    forwarded_for = (request.headers.get('x-forwarded-for') or '').strip()
    if forwarded_for:
        first = forwarded_for.split(',')[0].strip()
        if first:
            return first

    real_ip = (request.headers.get('x-real-ip') or request.headers.get('cf-connecting-ip') or '').strip()
    if real_ip:
        return real_ip

    return request.client.host if request.client else 'unknown'


def _rate_limit_for_path(short_path: str, method: str) -> int:
    """Renvoie la limite/minute appropriée selon la route et la méthode."""
    base = settings.API_RATE_LIMIT_PER_MINUTE

    if short_path in PUBLIC_AUTH_PATHS:
        return max(base, settings.LOGIN_RATE_LIMIT_PER_MINUTE * 3)

    # GET en lecture seule : limite très haute (10x base)
    if method.upper() == 'GET' and any(short_path.startswith(p) for p in READ_ONLY_PATHS):
        return max(base * 10, 1200)

    # Lecture live/polling (analytics, viewers, comments) : quota bien plus large
    # pour éviter les 429 quand le studio recharge plusieurs panneaux.
    if method.upper() == 'GET' and short_path.startswith('/live'):
        return max(base * 12, 1800)

    # Endpoints chat/upload/live haute fréquence : 5x la base
    if any(short_path.startswith(p) for p in HIGH_VOLUME_PATHS):
        return max(base * 8, 1200)

    return base


async def api_rate_guard(request: Request, call_next):
    path = request.url.path
    # CRITICAL: تجاوز OPTIONS preflight requests - CORS يتولى معالجتها
    if request.method.upper() == 'OPTIONS':
        return await call_next(request)
    assessment = None
    if path.startswith(settings.API_PREFIX):
        short_path = path[len(settings.API_PREFIX):] or '/'
        assessment = assess_request(request, short_path)
        if assessment.get('blocked'):
            return JSONResponse(
                status_code=int(assessment.get('status_code') or 403),
                content={
                    'detail': assessment.get('detail') or 'Request blocked',
                    'reason': assessment.get('reason') or 'security_policy',
                },
            )

        rate_limit = _rate_limit_for_path(short_path, request.method)

        key = f'api:{client_ip(request)}:{request.method}:{short_path}'
        if not await enforce_rate_limit(key, rate_limit, 60):
            return JSONResponse(
                status_code=429,
                content={'detail': 'Too many requests', 'retry_after': 30},
                headers={'Retry-After': '30'},
            )

    response = await call_next(request)
    if path.startswith(f'{settings.API_PREFIX}/auth'):
        response.headers['Cache-Control'] = 'no-store'
    if assessment is not None:
        response.headers['X-Yamshat-Threat-Level'] = str(assessment.get('level') or 'low')
    return response
