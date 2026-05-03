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
from app.core.dependencies import get_db

router = APIRouter()


def _session_payload(user: User) -> dict:
    token = create_access_token({'user_id': user.id, 'username': user.username, 'role': user.role})
    user_payload = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'avatar': user.avatar,
        'role': user.role,
        'is_active': user.is_active,
        'permissions': ROLE_PERMISSIONS.get(user.role, ROLE_PERMISSIONS['user']),
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
        'role': user.role,
        'permissions': ROLE_PERMISSIONS.get(user.role, ROLE_PERMISSIONS['user']),
        'profile': user_payload,
    }


@router.post('/register', status_code=status.HTTP_201_CREATED)
def register(request: Request, payload: dict = Body(...), db: Session = Depends(get_db)):
    ip_address = request.client.host if request.client else 'unknown'
    if not enforce_rate_limit(f'register:{ip_address}', 5, 60):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Too many registration attempts')

    username = payload.get('username') or payload.get('name') or payload.get('user')
    email = payload.get('email')
    password = payload.get('password')
    avatar = payload.get('avatar')

    user = register_user(db, username=username, email=email, password=password, avatar=avatar)
    return _session_payload(user)


@router.post('/login')
def login(request: Request, payload: dict = Body(...), db: Session = Depends(get_db)):
    ip_address = request.client.host if request.client else 'unknown'
    if not enforce_rate_limit(f'login:{ip_address}', 5, 60):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Too many login attempts')
    if is_ip_locked(ip_address):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Too many attempts, try again later')

    identifier = payload.get('identifier') or payload.get('email') or payload.get('username')
    password = payload.get('password')

    try:
        user = authenticate_user(db, identifier=identifier, password=password)
    except HTTPException:
        register_failed_login(ip_address)
        raise

    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    clear_failed_logins(ip_address)
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
