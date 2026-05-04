from datetime import datetime, timedelta, timezone

import jwt
from werkzeug.security import check_password_hash, generate_password_hash

from app.core.config import settings


class TokenError(Exception):
    pass


def hash_password(password: str) -> str:
    return generate_password_hash(password, method='pbkdf2:sha256')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return check_password_hash(hashed_password, plain_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({'exp': expire, 'iat': datetime.now(timezone.utc)})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


create_token = create_access_token


def decode_token(token: str) -> dict:
    raw_token = (token or '').replace('Bearer ', '').replace('bearer ', '').strip()
    if not raw_token:
        raise TokenError('Missing token')

    try:
        return jwt.decode(raw_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.InvalidTokenError as exc:
        raise TokenError('Invalid or expired token') from exc
