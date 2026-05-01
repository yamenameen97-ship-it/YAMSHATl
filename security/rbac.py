
from flask import request, abort

def require_role(role):
    def decorator(f):
        def wrapper(*args, **kwargs):
            if request.user.get("role") != role:
                abort(403)
            return f(*args, **kwargs)
        return wrapper
    return decorator
