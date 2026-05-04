import random
from datetime import datetime

from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.rate_limit import clear_failed_logins, enforce_rate_limit, is_ip_locked, register_failed_login
from app.core.redis import redis_client
from app.core.security import create_access_token
from app.models.user import User
from app.services.auth_service import authenticate_user, register_user
from app.services.email import send_email

from app.api.routes.admin import ROLE_PERMISSIONS
from app.core.admin_access import effective_role, permissions_for_user
from app.core.config import settings
from app.core.dependencies import get_db

router = APIRouter()


def _session_payload(user: User) -> dict:
    token = create_access_token({'user_id': user.id, 'username': user.username, 'role': user.role})
    effective_user_role = effective_role(user)
    effective_permissions = permissions_for_user(user, ROLE_PERMISSIONS)
    user_payload = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'avatar': user.avatar,
        'role': effective_user_role,
        'is_active': user.is_active,
        'permissions': effective_permissions,
        'followers_count': user.followers_count,
        'following_count': user.following_count,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'last_login_at': user.last_login_at.isoformat() if user.last_login_at else None,
    }
    return {
        'token': token,
        'access_token': token,
        'token_type': 'bearer',
        'user': user.username,
        'username': user.username,
        'email': user.email,
        'avatar': user.avatar,
        'id': user.id,
        'role': effective_user_role,
        'permissions': effective_permissions,
        'profile': user_payload,
    }


def _client_ip(request: Request) -> str:
    forwarded_for = (request.headers.get('x-forwarded-for') or '').strip()
    if forwarded_for:
        first = forwarded_for.split(',')[0].strip()
        if first:
            return first

    real_ip = (request.headers.get('x-real-ip') or request.headers.get('cf-connecting-ip') or '').strip()
    if real_ip:
        return real_ip

    return request.client.host if request.client else 'unknown'


def _normalize_rate_key_part(value: str | None, fallback: str) -> str:
    normalized = (value or '').strip().lower()
    return normalized or fallback


@router.post('/register', status_code=status.HTTP_201_CREATED)
def register(request: Request, payload: dict = Body(...), db: Session = Depends(get_db)):
    username = payload.get('username') or payload.get('name') or payload.get('user')
    email = payload.get('email')
    password = payload.get('password')
    avatar = payload.get('avatar')

    if not (username or '').strip() or not (email or '').strip() or len(password or '') < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Missing or invalid registration fields')

    ip_address = _client_ip(request)
    identity = _normalize_rate_key_part(email, _normalize_rate_key_part(username, 'anonymous'))
    rate_key = f'register:{ip_address}:{identity}'
    if not enforce_rate_limit(rate_key, settings.REGISTER_RATE_LIMIT_PER_MINUTE, 60):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Too many registration attempts')

    user = register_user(db, username=username, email=email, password=password, avatar=avatar)
    return _session_payload(user)


@router.post('/login')
def login(request: Request, payload: dict = Body(...), db: Session = Depends(get_db)):
    identifier = payload.get('identifier') or payload.get('email') or payload.get('username')
    password = payload.get('password')

    if not (identifier or '').strip() or not (password or '').strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Identifier and password are required')

    ip_address = _client_ip(request)
    normalized_identifier = _normalize_rate_key_part(identifier, 'anonymous')
    attempt_key = f'{ip_address}:{normalized_identifier}'

    if not enforce_rate_limit(f'login:{attempt_key}', settings.LOGIN_RATE_LIMIT_PER_MINUTE, 60):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Too many login attempts')
    if is_ip_locked(attempt_key):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Too many attempts, try again later')

    try:
        user = authenticate_user(db, identifier=identifier, password=password)
    except HTTPException:
        register_failed_login(attempt_key)
        raise

    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    clear_failed_logins(attempt_key)
    return _session_payload(user)


@router.post('/logout')
def logout():
    return {'message': 'Logged out'}


@router.post('/forgot-password')
def forgot(email: str):
    code = str(random.randint(100000, 999999))
    redis_client.setex(f'reset:{email}', 300, code)
    send_email(email, 'Reset Code', f'Your code is: {code}')
    return {'msg': 'Code sent'}


@router.post('/verify-code')
def verify(email: str, code: str):
    saved = redis_client.get(f'reset:{email}')

    if not saved:
        return {'error': 'expired'}

    if saved != code:
        return {'error': 'invalid code'}

    return {'msg': 'verified'}
