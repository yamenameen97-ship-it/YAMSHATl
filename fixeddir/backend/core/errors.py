
from typing import Optional

class APIException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 500, trace_id: Optional[str] = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.trace_id = trace_id

    def to_dict(self):
        return {
            "success": False,
            "error": {
                "code": self.code,
                "message": self.message,
                "trace_id": self.trace_id
            }
        }

# Define common error codes
class ErrorCode:
    INVALID_INPUT = "INVALID_INPUT"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    INVALID_TOKEN = "INVALID_TOKEN"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    BRUTE_FORCE_DETECTED = "BRUTE_FORCE_DETECTED"
