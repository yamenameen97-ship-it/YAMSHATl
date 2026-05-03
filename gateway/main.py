import os
import time
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

from rate_limiter import consume

AUTH_SERVICE_URL = os.getenv('AUTH_SERVICE_URL', 'http://auth-service:8000')
USER_SERVICE_URL = os.getenv('USER_SERVICE_URL', 'http://user-service:8000')
POST_SERVICE_URL = os.getenv('POST_SERVICE_URL', 'http://post-service:8000')
CHAT_SERVICE_URL = os.getenv('CHAT_SERVICE_URL', 'http://chat-service:8000')
NOTIFICATION_SERVICE_URL = os.getenv('NOTIFICATION_SERVICE_URL', 'http://notification-service:8000')
MEDIA_SERVICE_URL = os.getenv('MEDIA_SERVICE_URL', 'http://media-service:8000')
SEARCH_SERVICE_URL = os.getenv('SEARCH_SERVICE_URL', 'http://search-service:8000')

ROUTE_TABLE = {
    '/auth': AUTH_SERVICE_URL,
    '/users': USER_SERVICE_URL,
    '/posts': POST_SERVICE_URL,
    '/chat': CHAT_SERVICE_URL,
    '/notifications': NOTIFICATION_SERVICE_URL,
    '/media': MEDIA_SERVICE_URL,
    '/search': SEARCH_SERVICE_URL,
    '/api/auth': AUTH_SERVICE_URL,
    '/api/users': USER_SERVICE_URL,
    '/api/posts': POST_SERVICE_URL,
    '/api/comments': USER_SERVICE_URL,
    '/api/follows': USER_SERVICE_URL,
    '/api/inbox': CHAT_SERVICE_URL,
    '/api/chat': CHAT_SERVICE_URL,
    '/api/notifications': NOTIFICATION_SERVICE_URL,
    '/api/search': SEARCH_SERVICE_URL,
    '/api/upload': MEDIA_SERVICE_URL,
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

app = FastAPI(title='YAMSHAT Gateway', version='2.0.0')
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


@app.api_route('/{path:path}', methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])
async def proxy(path: str, request: Request):
    full_path = '/' + path
    upstream = resolve_upstream(full_path)
    target_url = f'{upstream}{full_path}'

    body = await request.body()
    headers = dict(request.headers)
    headers.pop('host', None)

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
