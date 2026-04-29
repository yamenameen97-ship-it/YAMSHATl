from __future__ import annotations

from functools import wraps

from flask import request

from utils import json_error, verify_token


def auth_required(view=None):
    def decorator(func):
        @wraps(func)
        def wrapped(*args, **kwargs):
            token = request.headers.get("Authorization")
            if not token:
                return json_error("unauthorized", 401)
            if token.lower().startswith("bearer "):
                token_value = token.split(" ", 1)[1].strip()
            else:
                token_value = token.strip()
            user = verify_token(token_value)
            if not user:
                return json_error("invalid token", 401)
            return func(*args, **kwargs)

        return wrapped

    if view is None:
        return decorator
    return decorator(view)
