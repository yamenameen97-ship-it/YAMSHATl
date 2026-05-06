from urllib.parse import urlparse

from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.config import settings

SAFE_METHODS = {'GET', 'HEAD', 'OPTIONS'}
CSRF_COOKIE_NAME = 'yamshat_csrf_token'


def _request_origin(request: Request) -> str:
    return f'{request.url.scheme}://{request.url.netloc}'


def _allowed_origins(request: Request) -> set[str]:
    origins = {origin for origin in settings.cors_origins if origin}
    origins.add(_request_origin(request))
    if settings.BACKEND_ORIGIN:
        origins.add(settings.BACKEND_ORIGIN)
    return origins


def _normalize_origin(value: str) -> str:
    parsed = urlparse((value or '').strip())
    if not parsed.scheme or not parsed.netloc:
        return ''
    return f'{parsed.scheme}://{parsed.netloc}'


def _is_allowed_origin(candidate: str, request: Request) -> bool:
    allowed = _allowed_origins(request)
    if '*' in allowed:
        return True
    normalized = _normalize_origin(candidate)
    return bool(normalized and normalized in allowed)


def _content_security_policy(request: Request) -> str:
    connect_sources = ["'self'"]
    for origin in sorted(_allowed_origins(request)):
        if origin != '*':
            connect_sources.append(origin)
    connect_sources.extend(['wss:', 'https:'])
    connect_value = ' '.join(dict.fromkeys(connect_sources))
    return '; '.join([
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "img-src 'self' data: blob: https:",
        f"connect-src {connect_value}",
        "media-src 'self' data: blob: https:",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self' data: https:",
        "object-src 'none'",
    ])


def _csrf_cookie_matches_header(request: Request) -> bool:
    csrf_cookie = str(request.cookies.get(CSRF_COOKIE_NAME) or '').strip()
    csrf_header = str(request.headers.get('x-csrf-token') or '').strip()
    if not csrf_cookie:
        return True
    return bool(csrf_header and csrf_header == csrf_cookie)


async def security_headers(request: Request, call_next):
    path = request.url.path
    method = request.method.upper()

    if path.startswith(settings.API_PREFIX) and method not in SAFE_METHODS:
        origin = request.headers.get('origin', '')
        referer = request.headers.get('referer', '')
        authorization = request.headers.get('authorization', '')
        requested_with = request.headers.get('x-requested-with', '')

        if origin and not _is_allowed_origin(origin, request):
            return JSONResponse(status_code=403, content={'detail': 'Origin not allowed'})
        if not origin and referer and not _is_allowed_origin(referer, request):
            return JSONResponse(status_code=403, content={'detail': 'Referer not allowed'})
        if not _csrf_cookie_matches_header(request):
            return JSONResponse(status_code=403, content={'detail': 'CSRF token mismatch'})
        if not origin and not referer and not authorization and requested_with != 'XMLHttpRequest':
            return JSONResponse(status_code=403, content={'detail': 'CSRF protection blocked the request'})

    response = await call_next(request)
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'same-origin'
    response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
    response.headers['Cross-Origin-Resource-Policy'] = 'same-origin'
    response.headers['Content-Security-Policy'] = _content_security_policy(request)
    return response
