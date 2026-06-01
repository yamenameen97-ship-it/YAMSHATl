from datetime import datetime, timedelta, timezone
import secrets

import jwt
from werkzeug.security import check_password_hash, generate_password_hash

from app.core.config import settings


class TokenError(Exception):
    pass


ACCESS_TOKEN_TYPE = 'access'
REFRESH_TOKEN_TYPE = 'refresh'


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    return generate_password_hash(password, method='scrypt')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return check_password_hash(hashed_password, plain_password)


def _base_claims(token_type: str, expire: datetime, issued_at: datetime, data: dict) -> dict:
    subject = str(data.get('user_id') or data.get('sub') or '')
    return {
        'iss': settings.JWT_ISSUER,
        'aud': settings.JWT_AUDIENCE,
        'sub': subject,
        'typ': token_type,
        'iat': int(issued_at.timestamp()),
        'nbf': int((issued_at - timedelta(seconds=5)).timestamp()),
        'exp': int(expire.timestamp()),
        'jti': secrets.token_urlsafe(16),
    }


def _create_jwt_token(data: dict, expires_delta: timedelta | None = None, token_type: str = ACCESS_TOKEN_TYPE) -> str:
    issued_at = utcnow()
    default_delta = (
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        if token_type == ACCESS_TOKEN_TYPE
        else timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    expire = issued_at + (expires_delta or default_delta)
    to_encode = data.copy()
    to_encode.update(_base_claims(token_type, expire, issued_at, data))
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    return _create_jwt_token(data, expires_delta=expires_delta, token_type=ACCESS_TOKEN_TYPE)


def create_refresh_token(data: dict, expires_delta: timedelta | None = None) -> str:
    return _create_jwt_token(data, expires_delta=expires_delta, token_type=REFRESH_TOKEN_TYPE)


def log_security_event_to_siem(event_type: str, details: dict):
    """
    إرسال الأحداث الأمنية إلى نظام SIEM (محاكاة).
    """
    # في الإنتاج، سيتم إرسال هذا إلى Splunk أو ELK أو Datadog
    import json
    print(f"SIEM_EVENT: {event_type} - {json.dumps(details)}")

def decode_token(token: str, expected_type: str | None = None) -> dict:
    raw_token = (token or '').replace('Bearer ', '').replace('bearer ', '').strip()
    if not raw_token:
        raise TokenError('Missing token')

    try:
        payload = jwt.decode(
            raw_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            audience=settings.JWT_AUDIENCE,
            issuer=settings.JWT_ISSUER,
            options={
                'require': ['exp', 'iat', 'nbf', 'jti', 'typ', 'aud', 'iss'],
            },
        )
    except jwt.InvalidTokenError as exc:
        raise TokenError('Invalid or expired token') from exc

    token_type = payload.get('typ') or ACCESS_TOKEN_TYPE
    if expected_type and token_type != expected_type:
        raise TokenError('Invalid token type')
    return payload


create_token = create_access_token


def generate_numeric_code(length: int = 6) -> str:
    digits = '0123456789'
    return ''.join(secrets.choice(digits) for _ in range(max(4, length)))
