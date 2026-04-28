
from flask import request
from utils import verify_token

def auth_required():
    token = request.headers.get("Authorization")
    if not token:
        return None
    return verify_token(token)
