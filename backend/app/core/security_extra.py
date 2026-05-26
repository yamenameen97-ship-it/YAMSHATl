import re
from urllib.parse import urlparse

from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.config import settings

SAFE_METHODS = {'GET', 'HEAD', 'OPTIONS'}
CSRF_COOKIE_NAME = 'yamshat_csrf_token'
PUBLIC_AUTH_PATHS = {
    '/auth/login',
    '/auth/register',
    '/auth/verify-email',
    '/auth/resend-verification',
    '/auth/forgot-password',
    '/auth/verify-reset-code',
    '/auth/reset-password',
}
TRUSTED_NATIVE_CLIENTS = {'android', 'ios', 'mobile'}


def _request_origin(request: Request) -> str:
    return f'{request.url.scheme}://{request.url.netloc}'


def _allowed_origins(request: Request) -> set[str]:
    origins = {origin for origin in settings.cors_origins if origin}
    origins.add(_request_origin(request))
    for candidate in [
        settings.FRONTEND_ORIGIN,
        settings.BACKEND_ORIGIN,
        settings.RENDER_EXTERNAL_URL,
        settings.RAILWAY_STATIC_URL,
    ]:
        if candidate:
            origins.add(candidate)
    return origins


def _normalize_origin(value: str) -> str:
    parsed = urlparse((value or '').strip())
    if not parsed.scheme or not parsed.netloc:
        return ''
    return f'{parsed.scheme}://{parsed.netloc}'


def _origin_matches_regex(candidate: str) -> bool:
    normalized = _normalize_origin(candidate)
    pattern = settings.cors_origin_regex
    if not normalized or not pattern:
        return False
    try:
        return re.match(pattern, normalized) is not None
    except re.error:
        return False


def _is_allowed_origin(candidate: str, request: Request) -> bool:
    allowed = _allowed_origins(request)
    if '*' in allowed:
        return True
    normalized = _normalize_origin(candidate)
    if not normalized:
        return False
    return normalized in allowed or _origin_matches_regex(normalized)


def _content_security_policy(request: Request) -> str:
    connect_sources = ["'self'"]
    for origin in sorted(_allowed_origins(request)):
        if origin != '*':
            connect_sources.append(origin)
    connect_sources.extend(['wss:', 'https:'])
    connect_value = ' '.join(dict.fromkeys(connect_sources))
    directives = [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "frame-src 'none'",
        "manifest-src 'self'",
        "img-src 'self' data: blob: https:",
        f"connect-src {connect_value}",
        "media-src 'self' data: blob: https:",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self' data: https:",
        "worker-src 'self' blob:",
        "object-src 'none'",
    ]
    if settings.REFRESH_COOKIE_SECURE:
        directives.append('upgrade-insecure-requests')
    return '; '.join(directives)


def _csrf_cookie_matches_header(request: Request) -> bool:
    csrf_cookie = str(request.cookies.get(CSRF_COOKIE_NAME) or '').strip()
    csrf_header = str(request.headers.get('x-csrf-token') or '').strip()
    if not csrf_cookie:
        return True
    return bool(csrf_header and csrf_header == csrf_cookie)


async def security_headers(request: Request, call_next):
    path = request.url.path
    
    # --- تعديل: استثناء المسارات الحساسة فوراً لمنع حظر الطلبات الضرورية ---
    safe_paths_keywords = ["captcha", "refresh", "login", "verify", "auth"]
    if any(p in path for p in safe_paths_keywords):
        return await call_next(request)
    # ------------------------------------------------------------------

    method = request.method.upper()

    if path.startswith(settings.API_PREFIX) and method not in SAFE_METHODS:
        short_path = path[len(settings.API_PREFIX):] or '/'
        origin = request.headers.get('origin', '')
        referer = request.headers.get('referer', '')
        authorization = request.headers.get('authorization', '')
        requested_with = request.headers.get('x-requested-with', '')
        client_name = str(request.headers.get('x-yamshat-client') or '').strip().lower()
        is_public_auth = short_path in PUBLIC_AUTH_PATHS
        is_trusted_native = client_name in TRUSTED_NATIVE_CLIENTS

        if origin and not _is_allowed_origin(origin, request):
            return JSONResponse(status_code=403, content={'detail': 'Origin not allowed'})
        if not origin and referer and not _is_allowed_origin(referer, request):
            return JSONResponse(status_code=403, content={'detail': 'Referer not allowed'})
        if not is_public_auth and not is_trusted_native and not _csrf_cookie_matches_header(request):
            return JSONResponse(status_code=403, content={'detail': 'CSRF token mismatch'})
        if not origin and not referer and not authorization and requested_with != 'XMLHttpRequest' and not is_trusted_native:
            return JSONResponse(status_code=403, content={'detail': 'CSRF protection blocked the request'})

    response = await call_next(request)
    
    # إعدادات الرؤوس الأمنية (Security Headers)
    response.headers['Vary'] = 'Origin'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'same-origin'
    response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
    response.headers['Cross-Origin-Resource-Policy'] = 'same-origin'
    response.headers['Origin-Agent-Cluster'] = '?1'
    response.headers['X-Permitted-Cross-Domain-Policies'] = 'none'
    response.headers['Content-Security-Policy'] = _content_security_policy(request)
    
    if request.url.scheme == 'https' or settings.REFRESH_COOKIE_SECURE:
        response.headers['Strict-Transport-Security'] = f"max-age={int(settings.HSTS_MAX_AGE_SECONDS or 31536000)}; includeSubDomains; preload"
    
    return response
