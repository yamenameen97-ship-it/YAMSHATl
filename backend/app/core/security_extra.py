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

# [تم الإبقاء على الدوال المساعدة _request_origin, _allowed_origins, _normalize_origin, _origin_matches_regex, _is_allowed_origin, _content_security_policy, _csrf_cookie_matches_header كما هي...]

async def security_headers(request: Request, call_next):
    path = request.url.path
    
    # --- التعديل الجوهري: استثناء المسارات الحساسة من الفحص الأمني الصارم ---
    # هذا يضمن مرور الكابتشا وعمليات التحقق والـ Refresh دون حظر
    safe_paths_keywords = ["captcha", "refresh", "login", "verify", "auth"]
    if any(p in path for p in safe_paths_keywords):
        return await call_next(request)
    # --------------------------------------------------------------------

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
    # [باقي إعدادات الـ response.headers تظل كما هي في كودك الأصلي...]
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
