"""
========================================================================
 Middleware عالمي لاعتراض أخطاء قاعدة البيانات (v61)
========================================================================
يمنع تسرب رسائل SQLAlchemy الخام إلى المستخدم النهائي،
ويرجع 503 منظم بدل 500 عند أخطاء الاتصال.

CORS-aware: يضيف headers الـ CORS حتى عند الأخطاء حتى لا يرى المتصفح
"CORS blocked" بدل الخطأ الحقيقي.
"""

import logging

from fastapi import Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import (
    DBAPIError,
    DisconnectionError,
    InterfaceError,
    OperationalError,
    TimeoutError as SATimeoutError,
)

logger = logging.getLogger('yamshat.middleware.db')


def _cors_headers(request: Request) -> dict:
    origin = request.headers.get('origin', '*')
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Vary': 'Origin',
    }


def register_db_exception_handlers(app):
    """يسجل معالجات أخطاء DB على تطبيق FastAPI.

    ملاحظة: لا يلغي معالجات HTTPException الموجودة — فقط يضيف
    معالجات لأنواع SQLAlchemy.
    """

    @app.exception_handler(DisconnectionError)
    async def _h_disconnect(request: Request, exc: Exception):
        return _build_503(request, exc, code='db_disconnected')

    @app.exception_handler(OperationalError)
    async def _h_operational(request: Request, exc: Exception):
        return _build_503(request, exc, code='db_operational')

    @app.exception_handler(InterfaceError)
    async def _h_interface(request: Request, exc: Exception):
        return _build_503(request, exc, code='db_interface')

    @app.exception_handler(SATimeoutError)
    async def _h_timeout(request: Request, exc: Exception):
        return _build_503(request, exc, code='db_timeout')

    @app.exception_handler(DBAPIError)
    async def _h_dbapi(request: Request, exc: DBAPIError):
        invalidated = getattr(exc, 'connection_invalidated', False)
        logger.exception(
            'DBAPIError on %s %s (invalidated=%s): %s',
            request.method, request.url.path, invalidated, exc,
        )
        if invalidated:
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={
                    'error': 'db_connection_invalidated',
                    'message': 'انقطع الاتصال بقاعدة البيانات. حاول مرة أخرى.',
                    'detail': 'Authentication service is temporarily unavailable. Please try again.',
                    'retry_after': 2,
                },
                headers={**_cors_headers(request), 'Retry-After': '2'},
            )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                'error': 'internal_db_error',
                'message': 'حدث خطأ داخلي. تواصل مع الدعم إذا تكرر.',
                'detail': 'Internal database error.',
            },
            headers=_cors_headers(request),
        )


def _build_503(request: Request, exc: Exception, code: str) -> JSONResponse:
    logger.exception(
        'DB unavailable [%s] on %s %s: %s',
        code, request.method, request.url.path, exc,
    )
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            'error': code,
            'message': 'خدمة قاعدة البيانات غير متاحة مؤقتاً. حاول مرة أخرى.',
            'detail': 'Authentication service is temporarily unavailable. Please try again.',
            'retry_after': 3,
        },
        headers={**_cors_headers(request), 'Retry-After': '3'},
    )
