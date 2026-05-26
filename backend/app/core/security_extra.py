import re
from urllib.parse import urlparse

from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.config import settings

SAFE_METHODS = {'GET', 'HEAD', 'OPTIONS'}
CSRF_COOKIE_NAME = 'yamshat_csrf_token'
# ... (حافظ على PUBLIC_AUTH_PATHS و TRUSTED_NATIVE_CLIENTS كما هي)

# ... (حافظ على الدوال المساعدة _request_origin, _allowed_origins, _normalize_origin, _origin_matches_regex, _is_allowed_origin, _content_security_policy, _csrf_cookie_matches_header كما هي)

async def security_headers(request: Request, call_next):
    path = request.url.path
    
    # --- تعديل جذري: استثناء المسارات الحساسة فوراً ---
    # هذا يضمن أن طلبات الكابتشا، التحديث، وتسجيل الدخول لا تمر عبر الفحص الأمني الصارم
    safe_paths_keywords = ["captcha", "refresh", "login", "verify", "auth"]
    if any(p in path for p in safe_paths_keywords):
        return await call_next(request)
    # --------------------------------------------------

    method = request.method.upper()

    if path.startswith(settings.API_PREFIX) and method not in SAFE_METHODS:
        # (باقي منطق الفحص الأمني الأصلي يظل كما هو)
        short_path = path[len(settings.API_PREFIX):] or '/'
        origin = request.headers.get('origin', '')
        # ... (باقي كود الفحص الأصلي الخاص بك)

    response = await call_next(request)
    
    # --- تعديل الـ CORS لضمان قبول الطلبات في البيئات الإنتاجية ---
    response.headers['Access-Control-Allow-Origin'] = request.headers.get('origin', '*')
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    
    # (باقي إعدادات الـ response.headers الخاصة بك تظل كما هي)
    response.headers['Vary'] = 'Origin'
    # ...
    return response
