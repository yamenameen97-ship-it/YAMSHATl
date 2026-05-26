from __future__ import annotations

import logging
import uuid

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


def register_error_handlers(app: FastAPI) -> None:
    @app.middleware('http')
    async def request_context_middleware(request: Request, call_next):
        request_id = request.headers.get('x-request-id') or str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers['X-Request-Id'] = request_id
        return response

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        request_id = getattr(request.state, 'request_id', None)
        return JSONResponse(
            status_code=exc.status_code,
            content={
                'error': 'http_error',
                'detail': exc.detail,
                'request_id': request_id,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        request_id = getattr(request.state, 'request_id', None)
        return JSONResponse(
            status_code=422,
            content={
                'error': 'validation_error',
                'detail': 'Request validation failed',
                'request_id': request_id,
                'fields': exc.errors(),
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        request_id = getattr(request.state, 'request_id', None)
        logger.exception('Unhandled application exception request_id=%s path=%s', request_id, request.url.path)
        return JSONResponse(
            status_code=500,
            content={
                'error': 'internal_server_error',
                'detail': 'حدث خطأ داخلي غير متوقع.',
                'request_id': request_id,
            },
        )
