from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.rate_limit import enforce_rate_limit


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


async def api_rate_guard(request: Request, call_next):
    path = request.url.path
    if path.startswith(settings.API_PREFIX):
        short_path = path[len(settings.API_PREFIX):] or '/'
        rate_limit = settings.API_RATE_LIMIT_PER_MINUTE
        if short_path in PUBLIC_AUTH_PATHS:
            rate_limit = max(rate_limit, settings.LOGIN_RATE_LIMIT_PER_MINUTE * 3)

        key = f'api:{client_ip(request)}:{request.method}:{short_path}'
        if not enforce_rate_limit(key, rate_limit, 60):
            return JSONResponse(status_code=429, content={'detail': 'Too many requests'})

    response = await call_next(request)
    if path.startswith(f'{settings.API_PREFIX}/auth'):
        response.headers['Cache-Control'] = 'no-store'
    return response
