
import jwt, os
from functools import wraps
from flask import request, abort

SECRET = os.getenv("JWT_SECRET", "dev")

def secure_endpoint(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            abort(401)
        try:
            payload = jwt.decode(token, SECRET, algorithms=["HS256"])
            request.user = payload
        except:
            abort(403)
        return f(*args, **kwargs)
    return wrapper
