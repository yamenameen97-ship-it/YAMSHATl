
from fastapi import Request, status
from fastapi.responses import JSONResponse
from backend.core.errors import APIException, ErrorCode
import uuid

async def api_exception_handler(request: Request, exc: APIException):
    trace_id = str(uuid.uuid4())
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "trace_id": trace_id
            }
        },
    )

async def http_exception_handler(request: Request, exc: Exception):
    trace_id = str(uuid.uuid4())
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code = ErrorCode.INTERNAL_SERVER_ERROR
    message = "An unexpected error occurred."

    if hasattr(exc, 'status_code'):
        status_code = exc.status_code
    if hasattr(exc, 'detail'):
        message = exc.detail

    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": error_code,
                "message": message,
                "trace_id": trace_id
            }
        },
    )
