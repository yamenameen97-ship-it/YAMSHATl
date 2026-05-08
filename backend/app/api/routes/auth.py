from datetime import datetime, timedelta, timezone
import secrets

from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.routes.admin import ROLE_PERMISSIONS
from app.core.admin_access import effective_role, permissions_for_user
from app.core.admin_mfa import verify_totp
from app.core.config import settings
from app.core.dependencies import get_current_user, get_db
from app.core.rate_limit import allow_min_interval, clear_failed_logins, enforce_rate_limit, is_ip_locked, register_failed_login
from app.core.request_security import ensure_device_cookie, request_binding_context
from app.core.security import REFRESH_TOKEN_TYPE, create_access_token, create_refresh_token, decode_token
from app.models.user import User
from app.services.audit_service import record_audit_log
from app.services.auth_service import (
    VERIFICATION_REQUIRED_DETAIL,
    authenticate_user,
    clear_refresh_token,
    get_user_by_email,
    issue_email_verification_code,
    issue_password_reset_code,
    register_user,
    store_refresh_token,
    update_password,
    validate_refresh_token,
    verify_email_code,
    verify_password_reset_code,
)
from app.services.email import send_password_reset_email, send_verification_email, smtp_configured

router = APIRouter()
CSRF_COOKIE_NAME = 'yamshat_csrf_token'


def utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _cookie_domain() -> str | None:
    return settings.REFRESH_COOKIE_DOMAIN or None


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.cookie_samesite,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path='/',
        domain=_cookie_domain(),
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        path='/',
        domain=_cookie_domain(),
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.cookie_samesite,
    )


def _issue_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def _set_csrf_cookie(response: Response, csrf_token: str) -> None:
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.cookie_samesite,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path='/',
        domain=_cookie_domain(),
    )


def _clear_csrf_cookie(response: Response) -> None:
    response.delete_cookie(
        key=CSRF_COOKIE_NAME,
        path='/',
        domain=_cookie_domain(),
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.cookie_samesite,
    )


def _session_payload(user: User, access_token: str, csrf_token: str = '') -> dict:
    effective_user_role = effective_role(user)
    effective_permissions = permissions_for_user(user, ROLE_PERMISSIONS)
    user_payload = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'avatar': user.avatar,
        'role': effective_user_role,
        'is_active': user.is_active,
        'email_verified': bool(user.email_verified),
        'permissions': effective_permissions,
        'followers_count': user.followers_count,
        'following_count': user.following_count,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'last_login_at': user.last_login_at.isoformat() if user.last_login_at else None,
        'csrf_token': csrf_token,
    }
    return {
        'token': access_token,
        'access_token': access_token,
        'refresh_token': '',
        'token_type': 'bearer',
        'csrf_token': csrf_token,
        'expires_in_minutes': settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        'refresh_expires_in_days': settings.REFRESH_TOKEN_EXPIRE_DAYS,
        'user': user.username,
        'username': user.username,
        'email': user.email,
        'avatar': user.avatar,
        'id': user.id,
        'role': effective_user_role,
        'permissions': effective_permissions,
        'email_verified': bool(user.email_verified),
        'profile': user_payload,
        'device_bound': True,
    }


def _issue_session(db: Session, user: User, response: Response, request: Request) -> dict:
    binding = request_binding_context(request)
    device_id = ensure_device_cookie(response, request)
    binding['device_id'] = device_id
    binding['device_id_hash'] = binding.get('device_id_hash') or ''
    is_admin_session = effective_role(user) == 'admin'
    access_token = create_access_token({
        'user_id': user.id,
        'username': user.username,
        'role': user.role,
        'device_id_hash': binding.get('device_id_hash') or '',
        'user_agent_hash': binding.get('user_agent_hash') or '',
        'admin_session': is_admin_session,
    })
    refresh_token = create_refresh_token({
        'user_id': user.id,
        'username': user.username,
        'role': user.role,
        'device_id_hash': binding.get('device_id_hash') or '',
        'ip_hash': binding.get('ip_hash') or '',
        'user_agent_hash': binding.get('user_agent_hash') or '',
        'admin_session': is_admin_session,
    })
    csrf_token = _issue_csrf_token()
    store_refresh_token(db, user, refresh_token, utcnow_naive() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS), binding_context=binding)
    _set_refresh_cookie(response, refresh_token)
    _set_csrf_cookie(response, csrf_token)
    return _session_payload(user, access_token=access_token, csrf_token=csrf_token)


def _normalize_rate_key_part(value: str | None, fallback: str) -> str:
    normalized = (value or '').strip().lower()
    return normalized or fallback


def _delivery_metadata() -> dict:
    return {
        'smtp_configured': smtp_configured(),
        'code_expires_in_minutes': settings.EMAIL_VERIFICATION_CODE_EXPIRE_MINUTES,
    }


def _send_verification_message(user: User, code: str) -> dict:
    delivery = _delivery_metadata()
    delivery['sent'] = False
    try:
    send_verification_email(user.email, code)
    delivery['sent'] = True
except Exception as exc:
    delivery['error'] = str(exc)
    
            send_verification_email(user.email, code)
            delivery['sent'] = True
        except Exception as exc:
            delivery['error'] = str(exc)
    return delivery


def _enforce_admin_mfa(user: User, payload: dict) -> None:
    if effective_role(user) != 'admin' or not settings.ADMIN_MFA_ENABLED:
        return
    secret = settings.ADMIN_MFA_TOTP_SECRET
    if not secret:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin MFA is enabled but not configured')
    mfa_code = str(payload.get('mfa_code') or '').strip()
    if not verify_totp(secret, mfa_code):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin MFA code is required or invalid')


def _enforce_admin_ip_policy(request: Request, user: User) -> None:
    if effective_role(user) != 'admin' or not settings.admin_allowed_ips:
        return
    ip_address = request_binding_context(request).get('ip_address') or 'unknown'
    if ip_address not in settings.admin_allowed_ips:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin login from this IP is not allowed')


@router.post('/register', status_code=status.HTTP_201_CREATED)
def register(request: Request, payload: dict = Body(...), db: Session = Depends(get_db)):
    username = payload.get('username') or payload.get('name') or payload.get('user')
    email = payload.get('email')
    password = payload.get('password')
    avatar = payload.get('avatar')

    if not (username or '').strip() or not (email or '').strip() or len(password or '') < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Missing or invalid registration fields')

    binding = request_binding_context(request)
    identity = _normalize_rate_key_part(email, _normalize_rate_key_part(username, 'anonymous'))
    rate_key = f'register:{binding["ip_address"]}:{identity}'
    if not enforce_rate_limit(rate_key, settings.REGISTER_RATE_LIMIT_PER_MINUTE, 60):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Too many registration attempts')

    user = register_user(db, username=username, email=email, password=password, avatar=avatar)
    code = issue_email_verification_code(db, user)
    delivery = _send_verification_message(user, code)
    record_audit_log(
        db,
        actor_user_id=user.id,
        action='register',
        entity_type='user',
        entity_id=user.id,
        description='New user registered',
        meta={'ip_hash': binding['ip_hash'], 'user_agent_hash': binding['user_agent_hash']},
    )
    response = {
        'message': 'Account created successfully. Please verify your email to continue.',
        'email_verification_required': True,
        'email': user.email,
        'delivery': delivery,
    }
    if settings.DEBUG and not delivery['sent']:
        response['dev_verification_code'] = code
    return response


@router.post('/verify-email')
def verify_email(request: Request, response: Response, payload: dict = Body(...), db: Session = Depends(get_db)):
    email = str(payload.get('email') or '').strip().lower()
    code = str(payload.get('code') or '').strip()
    if not email or not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email and code are required')

    user = get_user_by_email(db, email)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    verify_email_code(db, user, code)
    user.last_login_at = utcnow_naive()
    db.commit()
    db.refresh(user)
    return {
        'message': 'Email verified successfully',
        **_issue_session(db, user, response, request),
    }


@router.post('/resend-verification')
def resend_verification(payload: dict = Body(...), db: Session = Depends(get_db)):
    email = str(payload.get('email') or '').strip().lower()
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email is required')

    user = get_user_by_email(db, email)
    if user is None:
        return {'message': 'If the account exists, a verification code has been sent'}
    if bool(user.email_verified):
        return {'message': 'Email already verified'}

    code = issue_email_verification_code(db, user)
    delivery = _send_verification_message(user, code)
    response = {
        'message': 'Verification code sent',
        'email': user.email,
        'delivery': delivery,
    }
    if settings.DEBUG and not delivery['sent']:
        response['dev_verification_code'] = code
    return response


@router.post('/login')
def login(request: Request, response: Response, payload: dict = Body(...), db: Session = Depends(get_db)):
    identifier = payload.get('identifier') or payload.get('email') or payload.get('username')
    password = payload.get('password')

    if not (identifier or '').strip() or not (password or '').strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Identifier and password are required')

    binding = request_binding_context(request)
    normalized_identifier = _normalize_rate_key_part(identifier, 'anonymous')
    attempt_key = f'{binding["ip_address"]}:{normalized_identifier}'

    if not enforce_rate_limit(f'login:{attempt_key}', settings.LOGIN_RATE_LIMIT_PER_MINUTE, 60):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Too many login attempts')
    if is_ip_locked(attempt_key):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Too many attempts, try again later')

    try:
        user = authenticate_user(db, identifier=identifier, password=password, require_verified=True)
    except HTTPException as exc:
        if exc.detail == VERIFICATION_REQUIRED_DETAIL:
            pending_user = get_user_by_email(db, identifier) if '@' in str(identifier) else None
            if pending_user is None:
                pending_user = db.query(User).filter(User.username == str(identifier).strip()).first()
            if pending_user is not None:
                code = issue_email_verification_code(db, pending_user)
                delivery = _send_verification_message(pending_user, code)
                detail = {
                    'message': VERIFICATION_REQUIRED_DETAIL,
                    'email': pending_user.email,
                    'delivery': delivery,
                }
                if settings.DEBUG and not delivery['sent']:
                    detail['dev_verification_code'] = code
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail) from exc
        register_failed_login(attempt_key)
        record_audit_log(
            db,
            actor_user_id=None,
            action='login_failed',
            entity_type='auth',
            entity_id=normalized_identifier,
            description='Failed login attempt',
            meta={'ip_hash': binding['ip_hash'], 'user_agent_hash': binding['user_agent_hash']},
        )
        raise

    _enforce_admin_ip_policy(request, user)
    _enforce_admin_mfa(user, payload)

    user.last_login_at = utcnow_naive()
    if effective_role(user) == 'admin':
        user.last_admin_ip_hash = binding['ip_hash']
        user.last_admin_user_agent_hash = binding['user_agent_hash']
    db.commit()
    db.refresh(user)
    clear_failed_logins(attempt_key)
    record_audit_log(
        db,
        actor_user_id=user.id,
        action='login_success',
        entity_type='auth',
        entity_id=user.id,
        description='User logged in',
        meta={
            'ip_hash': binding['ip_hash'],
            'user_agent_hash': binding['user_agent_hash'],
            'device_id_hash': binding['device_id_hash'],
            'admin_session': effective_role(user) == 'admin',
        },
    )
    return _issue_session(db, user, response, request)


@router.post('/refresh')
def refresh_session(request: Request, response: Response, payload: dict = Body(default={}), db: Session = Depends(get_db)):
    binding = request_binding_context(request)
    ip_address = binding['ip_address']
    if not enforce_rate_limit(f'refresh:{ip_address}', settings.REFRESH_RATE_LIMIT_PER_MINUTE, 60):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Too many refresh attempts')

    refresh_token = str(payload.get('refresh_token') or payload.get('token') or request.cookies.get(settings.REFRESH_COOKIE_NAME) or '').strip()
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Refresh token is required')

    try:
        token_payload = decode_token(refresh_token, expected_type=REFRESH_TOKEN_TYPE)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid refresh token') from exc

    user_id = token_payload.get('user_id')
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid refresh token payload')

    user = db.query(User).filter(User.id == int(user_id), User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    if not bool(user.email_verified):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Email verification required')
    if not allow_min_interval(f'refresh-user:{user.id}:{ip_address}', settings.REFRESH_MIN_INTERVAL_SECONDS):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Refresh cooldown active')

    validate_refresh_token(user, refresh_token, binding_context=binding)
    issued_at = token_payload.get('iat')
    password_changed_at = user.password_changed_at
    if issued_at and password_changed_at:
        token_iat = datetime.fromtimestamp(float(issued_at), tz=timezone.utc).replace(tzinfo=None) if isinstance(issued_at, (int, float)) else None
        if token_iat and password_changed_at > token_iat:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Refresh token revoked')

    user.last_login_at = utcnow_naive()
    db.commit()
    db.refresh(user)
    record_audit_log(
        db,
        actor_user_id=user.id,
        action='refresh_success',
        entity_type='auth',
        entity_id=user.id,
        description='Session refreshed',
        meta={'ip_hash': binding['ip_hash'], 'device_id_hash': binding['device_id_hash']},
    )
    return _issue_session(db, user, response, request)


@router.post('/logout')
def logout(
    response: Response,
    request: Request,
    payload: dict | None = Body(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ = payload or {}
    clear_refresh_token(db, current_user)
    _clear_refresh_cookie(response)
    _clear_csrf_cookie(response)
    binding = request_binding_context(request)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action='logout',
        entity_type='auth',
        entity_id=current_user.id,
        description='User logged out',
        meta={'ip_hash': binding['ip_hash'], 'user_agent_hash': binding['user_agent_hash']},
    )
    return {'message': 'Logged out'}


@router.post('/forgot-password')
def forgot_password(payload: dict = Body(...), db: Session = Depends(get_db)):
    email = str(payload.get('email') or '').strip().lower()
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email is required')

    user = get_user_by_email(db, email)
    if user is None:
        return {'message': 'If the account exists, a reset code has been sent'}

    code = issue_password_reset_code(db, user)
    delivery = {
        'smtp_configured': smtp_configured(),
        'sent': False,
        'code_expires_in_minutes': settings.PASSWORD_RESET_CODE_EXPIRE_MINUTES,
    }
    try:
    send_verification_email(user.email, code)
    delivery['sent'] = True
except Exception as exc:
    delivery['error'] = str(exc)
            send_password_reset_email(user.email, code)
            delivery['sent'] = True
        except Exception as exc:
            delivery['error'] = str(exc)

    response = {
        'message': 'If the account exists, a reset code has been sent',
        'email': user.email,
        'delivery': delivery,
    }
    if settings.DEBUG and not delivery['sent']:
        response['dev_reset_code'] = code
    return response


@router.post('/verify-reset-code')
def verify_reset_code_endpoint(payload: dict = Body(...), db: Session = Depends(get_db)):
    email = str(payload.get('email') or '').strip().lower()
    code = str(payload.get('code') or '').strip()
    if not email or not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email and code are required')

    user = get_user_by_email(db, email)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    verify_password_reset_code(user, code)
    return {'message': 'Reset code verified'}


@router.post('/reset-password')
def reset_password(payload: dict = Body(...), db: Session = Depends(get_db)):
    email = str(payload.get('email') or '').strip().lower()
    code = str(payload.get('code') or '').strip()
    new_password = str(payload.get('new_password') or payload.get('password') or '')
    if not email or not code or not new_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email, code and new_password are required')

    user = get_user_by_email(db, email)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    verify_password_reset_code(user, code)
    update_password(db, user, new_password)
    record_audit_log(
        db,
        actor_user_id=user.id,
        action='password_changed',
        entity_type='auth',
        entity_id=user.id,
        description='Password reset completed',
        meta={},
    )
    return {'message': 'Password reset successfully'}
