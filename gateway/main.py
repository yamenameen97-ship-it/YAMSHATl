import os
import time
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

from rate_limiter import consume

AUTH_SERVICE_URL = os.getenv('AUTH_SERVICE_URL', 'http://auth-service:8000')
USER_SERVICE_URL = os.getenv('USER_SERVICE_URL', 'http://user-service:8000')
POST_SERVICE_URL = os.getenv('POST_SERVICE_URL', 'http://post-service:8000')
# v59.4: المصدر الموحّد للدردشة هو الـ monolith backend (chat-service القديم محذوف).
BACKEND_SERVICE_URL = os.getenv('BACKEND_SERVICE_URL', 'http://backend:8000')
CHAT_SERVICE_URL = os.getenv('CHAT_SERVICE_URL', BACKEND_SERVICE_URL)
NOTIFICATION_SERVICE_URL = os.getenv('NOTIFICATION_SERVICE_URL', 'http://notification-service:8000')
MEDIA_SERVICE_URL = os.getenv('MEDIA_SERVICE_URL', 'http://media-service:8000')
SEARCH_SERVICE_URL = os.getenv('SEARCH_SERVICE_URL', 'http://search-service:8000')

ROUTE_TABLE = {
    '/auth': AUTH_SERVICE_URL,
    '/users': USER_SERVICE_URL,
    '/posts': POST_SERVICE_URL,
    # v59.4: الدردشة موحّدة في الـ monolith backend (مصدر حقيقة وحيد).
    '/chat': CHAT_SERVICE_URL,
    '/messages': CHAT_SERVICE_URL,
    '/conversations': CHAT_SERVICE_URL,
    '/inbox': CHAT_SERVICE_URL,
    '/ws': CHAT_SERVICE_URL,
    '/notifications': NOTIFICATION_SERVICE_URL,
    '/media': MEDIA_SERVICE_URL,
    '/search': SEARCH_SERVICE_URL,
    '/billing': os.getenv('BILLING_SERVICE_URL', 'http://billing-service:8000'),
    '/identity': os.getenv('IDENTITY_SERVICE_URL', 'http://identity-service:8000'),
    '/i18n': os.getenv('I18N_SERVICE_URL', 'http://i18n-service:8000'),
    '/discovery': os.getenv('DISCOVERY_SERVICE_URL', 'http://discovery-ai-service:8000'),
    '/api/auth': AUTH_SERVICE_URL,
    '/api/users': USER_SERVICE_URL,
    '/api/posts': POST_SERVICE_URL,
    '/api/comments': USER_SERVICE_URL,
    '/api/follows': USER_SERVICE_URL,
    '/api/inbox': CHAT_SERVICE_URL,
    '/api/chat': CHAT_SERVICE_URL,
    '/api/messages': CHAT_SERVICE_URL,
    '/api/conversations': CHAT_SERVICE_URL,
    '/api/ws': CHAT_SERVICE_URL,
    '/api/notifications': NOTIFICATION_SERVICE_URL,
    '/api/search': SEARCH_SERVICE_URL,
    '/api/upload': MEDIA_SERVICE_URL,
    '/api/billing': os.getenv('BILLING_SERVICE_URL', 'http://billing-service:8000'),
    '/api/identity': os.getenv('IDENTITY_SERVICE_URL', 'http://identity-service:8000'),
    '/api/i18n': os.getenv('I18N_SERVICE_URL', 'http://i18n-service:8000'),
    '/api/discovery': os.getenv('DISCOVERY_SERVICE_URL', 'http://discovery-ai-service:8000'),
}

REQUEST_COUNT = Counter(
    'yamshat_gateway_requests_total',
    'Total gateway requests',
    ['method', 'path', 'status_code'],
)
REQUEST_LATENCY = Histogram(
    'yamshat_gateway_latency_seconds',
    'Gateway latency',
    ['method', 'path'],
)

def _csv_list(value: str) -> list[str]:
    return [item.strip() for item in (value or '').split(',') if item.strip()]


CORS_ORIGINS = _csv_list(
    os.getenv(
        'CORS_ORIGINS',
        'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173',
    )
)
CORS_ORIGIN_REGEX = (os.getenv('CORS_ORIGIN_REGEX') or r'^https://.*\.onrender\.com$').strip()

app = FastAPI(title='YAMSHAT Gateway', version='2.0.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=CORS_ORIGIN_REGEX or None,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
    expose_headers=['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
)
http_client = httpx.AsyncClient(timeout=30.0)


def resolve_upstream(path: str) -> str:
    for prefix, url in sorted(ROUTE_TABLE.items(), key=lambda item: len(item[0]), reverse=True):
        if path.startswith(prefix):
            return url
    raise HTTPException(status_code=404, detail='No upstream route configured')


@app.get('/')
async def root() -> dict[str, Any]:
    return {
        'service': 'gateway',
        'status': 'ok',
        'health': '/health',
        'metrics': '/metrics',
        'routes': list(ROUTE_TABLE.keys()),
    }


@app.get('/health')
async def health() -> dict[str, str]:
    return {'service': 'gateway', 'status': 'ok'}


@app.get('/metrics', include_in_schema=False)
async def metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.middleware('http')
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path in {'/', '/health', '/metrics', '/docs', '/openapi.json'}:
        return await call_next(request)

    user_id = request.headers.get('X-User-ID', 'anonymous')
    client_ip = request.headers.get('X-Forwarded-For', request.client.host if request.client else 'unknown')
    identity = f'{user_id}:{client_ip}'
    allowed, limit_value, remaining = consume(identity, request.url.path, time.time())
    if not allowed:
        return JSONResponse(
            status_code=429,
            content={'detail': 'Too many requests'},
            headers={
                'X-RateLimit-Limit': str(limit_value),
                'X-RateLimit-Remaining': str(remaining),
            },
        )

    response = await call_next(request)
    response.headers['X-RateLimit-Limit'] = str(limit_value)
    response.headers['X-RateLimit-Remaining'] = str(remaining)
    return response


# v59.4: رؤوس حساسة لا تُمرّر إلى الـ upstream (تمنع spoofing لـ X-User-ID وغيرها).
_HEADERS_TO_STRIP = {
    'host',
    'content-length',
    # رؤوس تحديد الهوية تُعيّن فقط عبر middleware بعد التحقق من JWT
    'x-user-id',
    'x-user-username',
    'x-internal-token',
}


@app.api_route('/{path:path}', methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])
async def proxy(path: str, request: Request):
    full_path = '/' + path
    upstream = resolve_upstream(full_path)
    target_url = f'{upstream}{full_path}'

    body = await request.body()
    # v59.4: حد أقصى للجسم (دفاع على مستوى الـ gateway مع ingress).
    max_body = int(os.getenv('GATEWAY_MAX_BODY_BYTES', '20971520'))  # 20 MB
    if len(body) > max_body:
        raise HTTPException(status_code=413, detail='Payload too large')

    headers = {k: v for k, v in request.headers.items() if k.lower() not in _HEADERS_TO_STRIP}
    headers['X-Forwarded-For'] = request.headers.get(
        'X-Forwarded-For', request.client.host if request.client else 'unknown'
    )
    headers['X-Forwarded-Proto'] = request.url.scheme
    headers['X-Forwarded-Host'] = request.headers.get('host', '')

    start = time.perf_counter()
    upstream_response = await http_client.request(
        request.method,
        target_url,
        params=request.query_params,
        content=body,
        headers=headers,
    )
    elapsed = time.perf_counter() - start
    REQUEST_LATENCY.labels(method=request.method, path=full_path).observe(elapsed)
    REQUEST_COUNT.labels(
        method=request.method,
        path=full_path,
        status_code=str(upstream_response.status_code),
    ).inc()

    excluded_headers = {'content-encoding', 'transfer-encoding', 'connection'}
    response_headers = {
        key: value
        for key, value in upstream_response.headers.items()
        if key.lower() not in excluded_headers
    }
    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
        headers=response_headers,
        media_type=upstream_response.headers.get('content-type'),
    )
