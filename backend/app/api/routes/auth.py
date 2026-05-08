from datetime import datetime, timedelta, timezone
import secrets
from threading import Lock

from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.routes.admin import ROLE_PERMISSIONS
from app.core.admin_access import effective_role, permissions_for_user, primary_admin_email
from app.core.admin_mfa import verify_totp
from app.core.config import settings
from app.core.dependencies import get_current_token_payload, get_current_user, get_db
from app.core.rate_limit import allow_min_interval, clear_failed_logins, enforce_rate_limit, is_ip_locked, register_failed_login
from app.core.request_security import ensure_device_cookie, request_binding_context
from app.core.security import REFRESH_TOKEN_TYPE, create_access_token, create_refresh_token, decode_token
from app.models.user import User
from app.services.audit_service import record_audit_log
from app.services.auth_service import (
    VERIFICATION_REQUIRED_DETAIL,
    authenticate_user,
    clear_all_refresh_tokens,
    clear_refresh_token,
    get_active_session,
    get_user_by_email,
    issue_email_verification_code,
    issue_password_reset_code,
    register_user,
    revoke_session,
    store_refresh_token,
    update_password,
    validate_refresh_token,
    verify_email_code,
    verify_password_reset_code,
)
from app.services.email import delivery_provider, send_password_reset_email, send_verification_email, smtp_configured

router = APIRouter()
CSRF_COOKIE_NAME = 'yamshat_csrf_token'

_CAPTCHA_STORE: dict[str, dict] = {}
_CAPTCHA_LOCK = Lock()


class _CaptchaError(HTTPException):
    pass


def utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _cookie_domain() -> str | None:
    return settings.REFRESH_COOKIE_DOMAIN or None


def _refresh_max_age_seconds(remember_me: bool) -> int | None:
    if remember_me:
        return settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    return None


def _refresh_expiry(remember_me: bool) -> datetime:
    if remember_me:
        return utcnow_naive() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return utcnow_naive() + timedelta(hours=settings.SESSION_REFRESH_EXPIRE_HOURS)


def _set_refresh_cookie(response: Response, refresh_token: str, remember_me: bool) -> None:
    kwargs = {
        'key': settings.REFRESH_COOKIE_NAME,
        'value': refresh_token,
        'httponly': True,
        'secure': settings.REFRESH_COOKIE_SECURE,
        'samesite': settings.cookie_samesite,
        'path': '/',
        'domain': _cookie_domain(),
    }
    max_age = _refresh_max_age_seconds(remember_me)
    if max_age is not None:
        kwargs['max_age'] = max_age
    response.set_cookie(**kwargs)


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


def _set_csrf_cookie(response: Response, csrf_token: str, remember_me: bool) -> None:
    kwargs = {
        'key': CSRF_COOKIE_NAME,
        'value': csrf_token,
        'httponly': False,
        'secure': settings.REFRESH_COOKIE_SECURE,
        'samesite': settings.cookie_samesite,
        'path': '/',
        'domain': _cookie_domain(),
    }
    max_age = _refresh_max_age_seconds(remember_me)
    if max_age is not None:
        kwargs['max_age'] = max_age
    response.set_cookie(**kwargs)


def _clear_csrf_cookie(response: Response) -> None:
    response.delete_cookie(
        key=CSRF_COOKIE_NAME,
        path='/',
        domain=_cookie_domain(),
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.cookie_samesite,
    )


def _session_payload(user: User, access_token: str, csrf_token: str = '', *, session_key: str, remember_me: bool) -> dict:
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
        'session_id': session_key,
        'remember_me': bool(remember_me),
    }
    return {
        'token': access_token,
        'access_token': access_token,
        'refresh_token': '',
        'token_type': 'bearer',
        'csrf_token': csrf_token,
        'expires_in_minutes': settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        'refresh_expires_in_days': settings.REFRESH_TOKEN_EXPIRE_DAYS,
        'session_expires_in_hours': settings.SESSION_REFRESH_EXPIRE_HOURS,
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
        'remember_me': bool(remember_me),
        'session_id': session_key,
    }


def _issue_session(
    db: Session,
    user: User,
    response: Response,
    request: Request,
    *,
    remember_me: bool,
    session_key: str | None = None,
    login_method: str = 'password',
) -> dict:
    binding = request_binding_context(request)
    device_id = ensure_device_cookie(response, request)
    binding['device_id'] = device_id
    binding['device_id_hash'] = binding.get('device_id_hash') or ''
    is_admin_session = effective_role(user) == 'admin'
    active_session_key = str(session_key or secrets.token_urlsafe(24)).strip()[:96]
    access_token = create_access_token({
        'user_id': user.id,
        'username': user.username,
        'role': user.role,
        'device_id_hash': binding.get('device_id_hash') or '',
        'user_agent_hash': binding.get('user_agent_hash') or '',
        'admin_session': is_admin_session,
        'sid': active_session_key,
    })
    refresh_token = create_refresh_token({
        'user_id': user.id,
        'username': user.username,
        'role': user.role,
        'device_id_hash': binding.get('device_id_hash') or '',
        'ip_hash': binding.get('ip_hash') or '',
        'user_agent_hash': binding.get('user_agent_hash') or '',
        'admin_session': is_admin_session,
        'sid': active_session_key,
        'remember_me': bool(remember_me),
    })
    csrf_token = _issue_csrf_token()
    expires_at = _refresh_expiry(remember_me)
    store_refresh_token(
        db,
        user,
        refresh_token,
        expires_at,
        binding_context=binding,
        session_key=active_session_key,
        remember_me=remember_me,
        login_method=login_method,
    )
    _set_refresh_cookie(response, refresh_token, remember_me=remember_me)
    _set_csrf_cookie(response, csrf_token, remember_me=remember_me)
    return _session_payload(user, access_token=access_token, csrf_token=csrf_token, session_key=active_session_key, remember_me=remember_me)


def _normalize_rate_key_part(value: str | None, fallback: str) -> str:
    normalized = (value or '').strip().lower()
    return normalized or fallback


def _delivery_metadata() -> dict:
    return {
        'smtp_configured': smtp_configured(),
        'provider': delivery_provider(),
        'code_expires_in_minutes': settings.EMAIL_VERIFICATION_CODE_EXPIRE_MINUTES,
    }


def _send_verification_message(user: User, code: str) -> dict:
    delivery = _delivery_metadata()
    delivery['sent'] = False
    if delivery['smtp_configured']:
        try:
            send_verification_email(user.email, code)
            delivery['sent'] = True
        except Exception as exc:
            import logging
            logging.getLogger(__name__).error(f'Verification email failed: {str(exc)}')
            delivery['error'] = str(exc)
            delivery['provider'] = delivery_provider()
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


def _prune_captchas() -> None:
    now = utcnow_naive()
    with _CAPTCHA_LOCK:
        expired = [key for key, item in _CAPTCHA_STORE.items() if item['expires_at'] <= now]
        for key in expired:
            _CAPTCHA_STORE.pop(key, None)


def _issue_captcha() -> dict:
    _prune_captchas()
    left = secrets.randbelow(8) + 1
    right = secrets.randbelow(8) + 1
    operator = secrets.choice(['+', '-'])
    answer = left + right if operator == '+' else left - right
    captcha_id = secrets.token_urlsafe(18)
    with _CAPTCHA_LOCK:
        _CAPTCHA_STORE[captcha_id] = {
            'answer_hash': str(answer),
            'expires_at': utcnow_naive() + timedelta(minutes=settings.CAPTCHA_EXPIRE_MINUTES),
        }
    return {
        'captcha_id': captcha_id,
        'question': f'{left} {operator} {right}',
        'expires_in_seconds': settings.CAPTCHA_EXPIRE_MINUTES * 60,
    }


def _require_captcha(payload: dict, *, context: str) -> None:
    if not settings.CAPTCHA_ENABLED:
        return
    captcha_id = str(payload.get('captcha_id') or '').strip()
    captcha_answer = str(payload.get('captcha_answer') or '').strip()
    if not captcha_id or captcha_answer == '':
        raise _CaptchaError(status_code=status.HTTP_400_BAD_REQUEST, detail='Captcha is required')

    _prune_captchas()
    with _CAPTCHA_LOCK:
        entry = _CAPTCHA_STORE.get(captcha_id)
        if entry is None:
            raise _CaptchaError(status_code=status.HTTP_400_BAD_REQUEST, detail='Captcha expired or missing')
        if entry['expires_at'] <= utcnow_naive():
            _CAPTCHA_STORE.pop(captcha_id, None)
            raise _CaptchaError(status_code=status.HTTP_400_BAD_REQUEST, detail='Captcha expired or missing')
        if str(captcha_answer).strip() != str(entry['answer_hash']):
            raise _CaptchaError(status_code=status.HTTP_400_BAD_REQUEST, detail='Captcha answer is incorrect')
        _CAPTCHA_STORE.pop(captcha_id, None)

    _ = context


def _dev_login_allowed() -> bool:
    return settings.dev_login_enabled


def _resolve_dev_user(db: Session, payload: dict) -> User:
    preset = str(payload.get('preset') or '').strip().lower()
    identifier = str(payload.get('identifier') or payload.get('email') or '').strip()

    if preset == 'subscriber':
        user = get_user_by_email(db, 'yasryameen97@gmail.com')
        if user is None:
            user = register_user(db, username='yasr', email='yasryameen97@gmail.com', password='123456')
            user.email_verified = True
            db.commit()
            db.refresh(user)
        return user

    if preset == 'admin':
        user = get_user_by_email(db, primary_admin_email())
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Primary admin account not found')
        return user

    if identifier:
        user = get_user_by_email(db, identifier)
        if user is None:
            user = db.query(User).filter(User.username == identifier).first()
        if user is not None and user.is_active:
            return user

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Development account not found')


@router.get('/captcha')
def get_captcha(request: Request):
    binding = request_binding_context(request)
    rate_key = f"captcha:{binding['ip_address']}"
    if not enforce_rate_limit(rate_key, settings.CAPTCHA_RATE_LIMIT_PER_MINUTE, 60):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Too many captcha requests')
    return _issue_captcha()


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
    rate_key = f"register:{binding['ip_address']}:{identity}"
    if not enforce_rate_limit(rate_key, settings.REGISTER_RATE_LIMIT_PER_MINUTE, 60):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Too many registration attempts')

    _require_captcha(payload, context='register')
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

    binding = request_binding_context(request)
    rate_key = f"verify:{binding['ip_address']}:{email}"
    if not enforce_rate_limit(rate_key, settings.VERIFY_RATE_LIMIT_PER_MINUTE, 60):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Too many verification attempts')

    user = get_user_by_email(db, email)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    verify_email_code(db, user, code)
    user.last_login_at = utcnow_naive()
    db.commit()
    db.refresh(user)
    return {
        'message': 'Email verified successfully',
        **_issue_session(db, user, response, request, remember_me=bool(payload.get('remember_me', True)), login_method='verify-email'),
    }


@router.post('/resend-verification')
def resend_verification(request: Request, payload: dict = Body(...), db: Session = Depends(get_db)):
    email = str(payload.get('email') or '').strip().lower()
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email is required')

    binding = request_binding_context(request)
    rate_key = f"resend:{binding['ip_address']}:{email}"
    if not enforce_rate_limit(rate_key, settings.RESEND_RATE_LIMIT_PER_MINUTE, 60):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Too many resend attempts')

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
    remember_me = bool(payload.get('remember_me', True))

    if not (identifier or '').strip() or not (password or '').strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Identifier and password are required')

    binding = request_binding_context(request)
    normalized_identifier = _normalize_rate_key_part(identifier, 'anonymous')
    attempt_key = f"{binding['ip_address']}:{normalized_identifier}"

    if not enforce_rate_limit(f'login:{attempt_key}', settings.LOGIN_RATE_LIMIT_PER_MINUTE, 60):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Too many login attempts')
    if is_ip_locked(attempt_key):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Too many attempts, try again later')

    _require_captcha(payload, context='login')

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
            'remember_me': remember_me,
        },
    )
    return _issue_session(db, user, response, request, remember_me=remember_me, login_method='password')


@router.post('/dev-login')
def dev_login(request: Request, response: Response, payload: dict = Body(default={}), db: Session = Depends(get_db)):
    if not _dev_login_allowed():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Development login is disabled')

    user = _resolve_dev_user(db, payload or {})
    user.last_login_at = utcnow_naive()
    db.commit()
    db.refresh(user)
    binding = request_binding_context(request)
    record_audit_log(
        db,
        actor_user_id=user.id,
        action='dev_login',
        entity_type='auth',
        entity_id=user.id,
        description='Development login used',
        meta={'ip_hash': binding['ip_hash'], 'user_agent_hash': binding['user_agent_hash']},
    )
    return _issue_session(
        db,
        user,
        response,
        request,
        remember_me=bool((payload or {}).get('remember_me', True)),
        login_method='development',
    )


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
    session_key = str(token_payload.get('sid') or '').strip() or None
    remember_me = bool(token_payload.get('remember_me', True))
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid refresh token payload')

    user = db.query(User).filter(User.id == int(user_id), User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    if not bool(user.email_verified):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Email verification required')
    if not allow_min_interval(f'refresh-user:{user.id}:{ip_address}', settings.REFRESH_MIN_INTERVAL_SECONDS):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Refresh cooldown active')

    session_record = validate_refresh_token(
        user,
        refresh_token,
        db=db,
        binding_context=binding,
        session_key=session_key,
    )
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
    return _issue_session(
        db,
        user,
        response,
        request,
        remember_me=bool(session_record.remember_me if session_record else remember_me),
        session_key=session_key,
        login_method='refresh',
    )


@router.post('/logout')
def logout(
    response: Response,
    request: Request,
    payload: dict | None = Body(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    token_payload: dict = Depends(get_current_token_payload),
):
    current_session_key = str(token_payload.get('sid') or '').strip() or None
    _ = payload or {}
    clear_refresh_token(db, current_user, session_key=current_session_key)
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
        meta={'ip_hash': binding['ip_hash'], 'user_agent_hash': binding['user_agent_hash'], 'session_id': current_session_key},
    )
    return {'message': 'Logged out'}


@router.post('/logout-all')
def logout_all_devices(
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    revoked = clear_all_refresh_tokens(db, current_user)
    _clear_refresh_cookie(response)
    _clear_csrf_cookie(response)
    binding = request_binding_context(request)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action='logout_all',
        entity_type='auth',
        entity_id=current_user.id,
        description='User logged out from all devices',
        meta={'ip_hash': binding['ip_hash'], 'user_agent_hash': binding['user_agent_hash'], 'revoked_sessions': revoked},
    )
    return {'message': 'Logged out from all devices', 'revoked_sessions': revoked}


def _password_reset_delivery_metadata() -> dict:
    return {
        'smtp_configured': smtp_configured(),
        'provider': delivery_provider(),
        'sent': False,
        'code_expires_in_minutes': settings.PASSWORD_RESET_CODE_EXPIRE_MINUTES,
    }


@router.post('/forgot-password')
def forgot_password(payload: dict = Body(...), db: Session = Depends(get_db)):
    email = str(payload.get('email') or '').strip().lower()
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email is required')

    user = get_user_by_email(db, email)
    if user is None:
        return {'message': 'If the account exists, a reset code has been sent'}

    code = issue_password_reset_code(db, user)
    delivery = _password_reset_delivery_metadata()
    if delivery['smtp_configured']:
        try:
            send_password_reset_email(user.email, code)
            delivery['sent'] = True
        except Exception as exc:
            delivery['error'] = str(exc)
            delivery['provider'] = delivery_provider()

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
