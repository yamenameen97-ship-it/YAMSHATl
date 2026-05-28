from __future__ import annotations

import logging
import re
import uuid
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.config import settings

logger = logging.getLogger(__name__)


def _normalize_origin(value: str) -> str:
    parsed = urlparse((value or '').strip())
    if not parsed.scheme or not parsed.netloc:
        return ''
    return f'{parsed.scheme}://{parsed.netloc}'


def _is_allowed_origin(candidate: str) -> bool:
    normalized = _normalize_origin(candidate)
    if not normalized:
        return False
    allowed = {o for o in settings.cors_origins if o and o != '*'}
    if '*' in settings.cors_origins:
        return True
    if normalized in allowed:
        return True
    pattern = settings.cors_origin_regex
    if pattern:
        try:
            if re.match(pattern, normalized):
                return True
        except re.error:
            pass
    return False


def _attach_cors_headers(request: Request, response: JSONResponse) -> JSONResponse:
    """
    CRITICAL: Lorsque le backend renvoie une erreur (4xx/5xx), il DOIT inclure
    les en-têtes CORS, sinon le navigateur affichera une fausse erreur CORS
    qui masque l'erreur réelle (DB, validation, etc.).
    """
    origin = request.headers.get('origin', '')
    if origin and _is_allowed_origin(origin):
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Vary'] = 'Origin'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Authorization, X-CSRF-Token, X-Request-Id'
    return response


def register_error_handlers(app: FastAPI) -> None:
    @app.middleware('http')
    async def request_context_middleware(request: Request, call_next):
        request_id = request.headers.get('x-request-id') or str(uuid.uuid4())
        request.state.request_id = request_id
        try:
            response = await call_next(request)
        except Exception:
            # Si une exception remonte jusqu'ici, on la laisse au handler global
            # qui se chargera de la réponse. Mais on log au passage.
            logger.exception('Middleware caught unhandled exception request_id=%s path=%s',
                             request_id, request.url.path)
            raise
        response.headers['X-Request-Id'] = request_id
        return response

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        request_id = getattr(request.state, 'request_id', None)
        response = JSONResponse(
            status_code=exc.status_code,
            content={
                'error': 'http_error',
                'detail': exc.detail,
                'request_id': request_id,
            },
        )
        return _attach_cors_headers(request, response)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        request_id = getattr(request.state, 'request_id', None)
        response = JSONResponse(
            status_code=422,
            content={
                'error': 'validation_error',
                'detail': 'Request validation failed',
                'request_id': request_id,
                'fields': exc.errors(),
            },
        )
        return _attach_cors_headers(request, response)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        request_id = getattr(request.state, 'request_id', None)
        logger.exception('Unhandled application exception request_id=%s path=%s',
                         request_id, request.url.path)
        response = JSONResponse(
            status_code=500,
            content={
                'error': 'internal_server_error',
                'detail': 'حدث خطأ داخلي غير متوقع.',
                'request_id': request_id,
            },
        )
        return _attach_cors_headers(request, response)
