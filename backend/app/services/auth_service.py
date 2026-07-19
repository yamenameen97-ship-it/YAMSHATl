from datetime import datetime, timedelta, timezone
import re
import requests

from fastapi import HTTPException, status
from sqlalchemy import and_, func, inspect, or_, text
from sqlalchemy.orm import Session

from app.core.admin_access import is_primary_admin_email
from app.core.config import settings
from app.core.request_security import stable_hash
from app.core.security import generate_numeric_code, hash_password, verify_password
from app.models.audit_log import AuditLog
from app.models.user import User
from app.models.user_session import UserSession
from app.services.auth_feature_service import social_login_or_register, mark_successful_login, mark_failed_login

VERIFICATION_REQUIRED_DETAIL = 'Email verification required'
EMAIL_REGEX = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$', re.IGNORECASE)
DEMO_ACCOUNT_EMAIL = (settings.DEMO_ACCOUNT_EMAIL or 'yasryameen21@gmail.com').strip().lower()
DEMO_ACCOUNT_BASE_USERNAME = ((DEMO_ACCOUNT_EMAIL.split('@')[0] if '@' in DEMO_ACCOUNT_EMAIL else DEMO_ACCOUNT_EMAIL) or 'yasryameen21').strip().lower()
# v88.18: حساب تجريبي ثانٍ (للاختبار من جهاز ثانٍ - مكالمات/دردشة)
SECONDARY_DEMO_ACCOUNT_EMAIL = (getattr(settings, 'SECONDARY_DEMO_ACCOUNT_EMAIL', '') or 'ameenyamen9@gmail.com').strip().lower()
SECONDARY_DEMO_ACCOUNT_BASE_USERNAME = ((SECONDARY_DEMO_ACCOUNT_EMAIL.split('@')[0] if '@' in SECONDARY_DEMO_ACCOUNT_EMAIL else SECONDARY_DEMO_ACCOUNT_EMAIL) or 'ameenyamen9').strip().lower()
SECONDARY_DEMO_ACCOUNT_PASSWORD = (getattr(settings, 'SECONDARY_DEMO_ACCOUNT_PASSWORD', '') or '123456789').strip()


def utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _normalize_username(value: str) -> str:
    return (value or '').strip().replace(' ', '_')


def looks_like_email(value: str | None) -> bool:
    return '@' in str(value or '')


def is_valid_email(value: str | None) -> bool:
    return bool(EMAIL_REGEX.match((value or '').strip()))


def _password_matches(plain_password: str, stored_password: str | None) -> bool:
    raw = (stored_password or '').strip()
    if not raw:
        return False
    if (plain_password or '') == raw:
        return True
    try:
        return verify_password(plain_password or '', raw)
    except Exception:
        return False


def _looks_like_modern_hash(value: str | None) -> bool:
    raw = (value or '').strip()
    return raw.startswith(('pbkdf2:', 'scrypt:', 'argon2:'))


def _load_legacy_password(db: Session, user_id: int) -> str | None:
    bind = db.get_bind()
    inspector = inspect(bind)
    if 'users' not in inspector.get_table_names():
        return None

    columns = {column['name'] for column in inspector.get_columns('users')}
    if 'password' not in columns:
        return None

    row = db.execute(text('SELECT password FROM users WHERE id = :user_id'), {'user_id': user_id}).mappings().first()
    if not row:
        return None
    value = row.get('password')
    return str(value).strip() if value not in (None, '') else None


def get_user_by_email(db: Session, email: str) -> User | None:
    normalized_email = (email or '').strip().lower()
    if not normalized_email:
        return None
    return db.query(User).filter(func.lower(User.email) == normalized_email).first()


def _sync_primary_admin_flags(user: User) -> bool:
    if user is None or not is_primary_admin_email(getattr(user, 'email', None)):
        return False

    changed = False
    if getattr(user, 'role', None) != 'admin':
        user.role = 'admin'
        changed = True
    if not bool(getattr(user, 'email_verified', False)):
        user.email_verified = True
        changed = True
    if getattr(user, 'email_verification_code', None):
        user.email_verification_code = None
        changed = True
    if getattr(user, 'email_verification_expires_at', None) is not None:
        user.email_verification_expires_at = None
        changed = True
    return changed


def _is_reserved_demo_identifier(value: str | None) -> bool:
    normalized = (value or '').strip().lower()
    return normalized in {DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_BASE_USERNAME}


# v88.18: مطابق لـ _is_reserved_demo_identifier لكن للحساب الثاني
def _is_reserved_secondary_demo_identifier(value: str | None) -> bool:
    normalized = (value or '').strip().lower()
    return normalized in {SECONDARY_DEMO_ACCOUNT_EMAIL, SECONDARY_DEMO_ACCOUNT_BASE_USERNAME}


def _allocate_demo_username(db: Session) -> str:
    base_username = DEMO_ACCOUNT_BASE_USERNAME
    candidate = base_username
    suffix = 1
    while db.query(User).filter(func.lower(User.username) == candidate.lower()).first() is not None:
        candidate = f'{base_username}_{suffix}'
        suffix += 1
    return candidate


# v88.18: مطابق لـ _allocate_demo_username لكن للحساب الثاني
def _allocate_secondary_demo_username(db: Session) -> str:
    base_username = SECONDARY_DEMO_ACCOUNT_BASE_USERNAME
    candidate = base_username
    suffix = 1
    while db.query(User).filter(func.lower(User.username) == candidate.lower()).first() is not None:
        candidate = f'{base_username}_{suffix}'
        suffix += 1
    return candidate


def _provision_reserved_demo_user(db: Session, identifier: str, password: str) -> User | None:
    if not _is_reserved_demo_identifier(identifier):
        return None

    existing = get_user_by_email(db, DEMO_ACCOUNT_EMAIL)
    if existing is None:
        existing = db.query(User).filter(func.lower(User.username) == DEMO_ACCOUNT_BASE_USERNAME.lower()).first()

    if existing is not None:
        changed = False
        if not bool(existing.is_active):
            existing.is_active = True
            changed = True
        if not bool(existing.email_verified):
            existing.email_verified = True
            changed = True
        if getattr(existing, 'email_verification_code', None):
            existing.email_verification_code = None
            changed = True
        if getattr(existing, 'email_verification_expires_at', None) is not None:
            existing.email_verification_expires_at = None
            changed = True
        desired_demo_password = (settings.DEMO_ACCOUNT_PASSWORD or '').strip()
        if desired_demo_password and not _password_matches(desired_demo_password, existing.hashed_password):
            existing.hashed_password = hash_password(desired_demo_password)
            existing.password_changed_at = utcnow_naive()
            changed = True
        if changed:
            db.commit()
            db.refresh(existing)
        return existing

    user = register_user(
        db,
        username=_allocate_demo_username(db),
        email=DEMO_ACCOUNT_EMAIL,
        password=(password or '').strip() or settings.DEMO_ACCOUNT_PASSWORD or '12345678',
    )
    user.email_verified = True
    user.is_active = True
    user.email_verification_code = None
    user.email_verification_expires_at = None
    db.commit()
    db.refresh(user)
    return user


# v88.18: توفير تلقائي للحساب التجريبي الثاني
def _provision_reserved_secondary_demo_user(db: Session, identifier: str, password: str) -> User | None:
    if not _is_reserved_secondary_demo_identifier(identifier):
        return None

    existing = get_user_by_email(db, SECONDARY_DEMO_ACCOUNT_EMAIL)
    if existing is None:
        existing = db.query(User).filter(func.lower(User.username) == SECONDARY_DEMO_ACCOUNT_BASE_USERNAME.lower()).first()

    if existing is not None:
        changed = False
        if not bool(existing.is_active):
            existing.is_active = True
            changed = True
        if not bool(existing.email_verified):
            existing.email_verified = True
            changed = True
        if getattr(existing, 'email_verification_code', None):
            existing.email_verification_code = None
            changed = True
        if getattr(existing, 'email_verification_expires_at', None) is not None:
            existing.email_verification_expires_at = None
            changed = True
        desired_password = SECONDARY_DEMO_ACCOUNT_PASSWORD
        if desired_password and not _password_matches(desired_password, existing.hashed_password):
            existing.hashed_password = hash_password(desired_password)
            existing.password_changed_at = utcnow_naive()
            changed = True
        if changed:
            db.commit()
            db.refresh(existing)
        return existing

    user = register_user(
        db,
        username=_allocate_secondary_demo_username(db),
        email=SECONDARY_DEMO_ACCOUNT_EMAIL,
        password=(password or '').strip() or SECONDARY_DEMO_ACCOUNT_PASSWORD or '123456789',
    )
    user.email_verified = True
    user.is_active = True
    user.email_verification_code = None
    user.email_verification_expires_at = None
    db.commit()
    db.refresh(user)
    return user


def register_user(db: Session, username: str, email: str, password: str, avatar: str | None = None) -> User:
    normalized_username = _normalize_username(username)
    email = (email or '').strip().lower()
    password = password or ''

    if not normalized_username or not email or len(password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Missing or invalid registration fields')
    if not is_valid_email(email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid email format')

    existing_email = db.query(User).filter(func.lower(User.email) == email).first()
    if existing_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email already exists')
    existing_username = db.query(User).filter(func.lower(User.username) == normalized_username.lower()).first()
    if existing_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Username already exists')

    role = 'admin' if is_primary_admin_email(email) else 'user'
    user = User(
        username=normalized_username,
        email=email,
        avatar=avatar,
        role=role,
        email_verified=bool(role == 'admin'),
        hashed_password=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, identifier: str, password: str, require_verified: bool = True) -> User:
    normalized_identifier = (identifier or '').strip()
    lowered_identifier = normalized_identifier.lower()

    if looks_like_email(lowered_identifier) and not is_valid_email(lowered_identifier):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid email address')

    user = db.query(User).filter(
        and_(
            User.is_active.is_(True),
            or_(
                func.lower(User.email) == lowered_identifier,
                func.lower(User.username) == lowered_identifier,
            ),
        )
    ).first()

    if user is None:
        user = _provision_reserved_demo_user(db, lowered_identifier, password or '')
    # v88.18: توفير تلقائي للحساب التجريبي الثاني عند أول تسجيل دخول
    if user is None:
        user = _provision_reserved_secondary_demo_user(db, lowered_identifier, password or '')
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Email or username not found')

    password_is_valid = _password_matches(password or '', user.hashed_password)
    if not password_is_valid:
        legacy_password = _load_legacy_password(db, user.id)
        password_is_valid = _password_matches(password or '', legacy_password)

    if not password_is_valid:
        if user: # Mark failed login attempt for adaptive authentication
            mark_failed_login(db, user)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Incorrect password')

    desired_role = 'admin' if is_primary_admin_email(user.email) else 'user'
    updated = False
    if user.role != desired_role:
        user.role = desired_role
        updated = True

    if not _looks_like_modern_hash(user.hashed_password):
        user.hashed_password = hash_password(password or '')
        updated = True

    updated = _sync_primary_admin_flags(user) or updated

    if require_verified and not bool(user.email_verified):
        if updated:
            db.commit()
            db.refresh(user)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=VERIFICATION_REQUIRED_DETAIL)

    if updated:
        db.commit()
        db.refresh(user)

    # Mark successful login for adaptive authentication
    # The binding context is passed from the route handler
    # This will be called in the route after successful authentication
    # For now, we'll call it here with dummy binding for direct password logins
    # The actual binding will be passed from the route in the next phase
    # mark_successful_login(db, user, {}) # This will be handled in auth.py
    return user


def get_google_oauth_user_info(access_token: str) -> dict:
    response = requests.get(settings.GOOGLE_USERINFO_URL, headers={'Authorization': f'Bearer {access_token}'})
    response.raise_for_status()
    user_info = response.json()
    return {
        'email': user_info['email'],
        'username_hint': user_info.get('name', user_info['email'].split('@')[0]),
        'avatar': user_info.get('picture'),
        'social_subject': user_info['sub'],
    }


def get_facebook_oauth_user_info(access_token: str) -> dict:
    response = requests.get(settings.FACEBOOK_USERINFO_URL, params={'fields': 'id,name,email,picture', 'access_token': access_token})
    response.raise_for_status()
    user_info = response.json()
    return {
        'email': user_info['email'],
        'username_hint': user_info.get('name', user_info['email'].split('@')[0]),
        'avatar': user_info.get('picture', {}).get('data', {}).get('url'),
        'social_subject': user_info['id'],
    }


def social_authenticate_or_register_user(
    db: Session,
    provider: str,
    email: str,
    username_hint: str | None = None,
    avatar: str | None = None,
    social_subject: str | None = None,
) -> User:
    return social_login_or_register(
        db,
        provider=provider,
        email=email,
        username_hint=username_hint,
        avatar=avatar,
        social_subject=social_subject,
    )


def issue_email_verification_code(db: Session, user: User) -> str:
    code = generate_numeric_code(6)
    user.email_verification_code = hash_password(code)
    user.email_verification_expires_at = utcnow_naive() + timedelta(minutes=settings.EMAIL_VERIFICATION_CODE_EXPIRE_MINUTES)
    db.commit()
    db.refresh(user)
    return code


def verify_email_code(db: Session, user: User, code: str) -> User:
    if bool(user.email_verified):
        return user
    if not user.email_verification_code or not user.email_verification_expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Verification code not found')
    if user.email_verification_expires_at < utcnow_naive():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Verification code expired')
    if not verify_password((code or '').strip(), user.email_verification_code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid verification code')

    user.email_verified = True
    user.email_verification_code = None
    user.email_verification_expires_at = None
    db.commit()
    db.refresh(user)
    return user


def issue_password_reset_code(db: Session, user: User) -> str:
    code = generate_numeric_code(6)
    user.password_reset_code = hash_password(code)
    user.password_reset_expires_at = utcnow_naive() + timedelta(minutes=settings.PASSWORD_RESET_CODE_EXPIRE_MINUTES)
    db.commit()
    db.refresh(user)
    return code


def verify_password_reset_code(user: User, code: str) -> None:
    if not user.password_reset_code or not user.password_reset_expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Reset code not found')
    if user.password_reset_expires_at < utcnow_naive():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Reset code expired')
    if not verify_password((code or '').strip(), user.password_reset_code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid reset code')


def _device_label(binding_context: dict | None = None) -> str:
    binding_context = binding_context or {}
    user_agent = str(binding_context.get('user_agent') or 'Unknown browser').strip()
    return user_agent[:255] or 'Unknown browser'


def prune_expired_sessions(db: Session, user: User | None = None) -> None:
    now = utcnow_naive()
    query = db.query(UserSession).filter(
        or_(
            UserSession.expires_at < now,
            UserSession.revoked_at.isnot(None),
        )
    )
    if user is not None:
        query = query.filter(UserSession.user_id == user.id)
    query.delete(synchronize_session=False)
    db.commit()


def store_refresh_token(
    db: Session,
    user: User,
    refresh_token: str,
    expires_at: datetime,
    binding_context: dict | None = None,
    *,
    session_key: str,
    remember_me: bool,
    login_method: str = 'password',
) -> None:
    binding_context = binding_context or {}
    prune_expired_sessions(db, user)
    record = db.query(UserSession).filter(UserSession.user_id == user.id, UserSession.session_key == session_key).first()
    if record is None:
        record = UserSession(user_id=user.id, session_key=session_key)
        db.add(record)

    record.refresh_token_hash = hash_password(refresh_token)
    record.expires_at = expires_at
    record.remember_me = bool(remember_me)
    record.device_id_hash = binding_context.get('device_id_hash') or None
    record.ip_hash = binding_context.get('ip_hash') or None
    record.user_agent_hash = binding_context.get('user_agent_hash') or None
    record.device_label = _device_label(binding_context)
    record.login_method = str(login_method or 'password')[:40]
    record.last_seen_at = utcnow_naive()
    record.revoked_at = None

    user.refresh_token_hash = hash_password(refresh_token)
    user.refresh_token_expires_at = expires_at
    user.refresh_token_device_hash = binding_context.get('device_id_hash') or None
    user.refresh_token_ip_hash = binding_context.get('ip_hash') or None
    user.refresh_token_user_agent_hash = binding_context.get('user_agent_hash') or None
    user.refresh_token_session_id = session_key
    user.refresh_token_rotated_at = utcnow_naive()
    db.commit()
    db.refresh(user)


def _validate_session_binding(record: UserSession, binding_context: dict | None = None) -> None:
    binding_context = binding_context or {}
    expected_device = (record.device_id_hash or '').strip()
    expected_ip = (record.ip_hash or '').strip()
    expected_ua = (record.user_agent_hash or '').strip()
    provided_device = (binding_context.get('device_id_hash') or '').strip()
    provided_ip = (binding_context.get('ip_hash') or '').strip()
    provided_ua = (binding_context.get('user_agent_hash') or '').strip()

    if expected_device and expected_device != provided_device:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Refresh token device mismatch')
    if expected_ua and expected_ua != provided_ua:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Refresh token user agent mismatch')
    if expected_ip and expected_ip != provided_ip:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Refresh token IP mismatch')


def get_active_session(db: Session, user: User, session_key: str | None) -> UserSession | None:
    if not session_key:
        return None
    return db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.session_key == str(session_key).strip(),
        UserSession.revoked_at.is_(None),
    ).first()


def validate_refresh_token(
    user: User,
    refresh_token: str,
    *,
    db: Session,
    binding_context: dict | None = None,
    session_key: str | None = None,
) -> UserSession:
    record = get_active_session(db, user, session_key)
    if record is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Refresh session not found')
    if record.expires_at < utcnow_naive():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Refresh token expired')
    if not verify_password(refresh_token, record.refresh_token_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid refresh token')

    _validate_session_binding(record, binding_context)
    record.last_seen_at = utcnow_naive()
    return record


def revoke_session(db: Session, user: User, session_key: str) -> bool:
    record = db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.session_key == str(session_key).strip(),
        UserSession.revoked_at.is_(None),
    ).first()
    if record is None:
        return False

    record.revoked_at = utcnow_naive()
    record.last_seen_at = utcnow_naive()
    if user.refresh_token_session_id == record.session_key:
        user.refresh_token_hash = None
        user.refresh_token_expires_at = None
        user.refresh_token_device_hash = None
        user.refresh_token_ip_hash = None
        user.refresh_token_user_agent_hash = None
        user.refresh_token_session_id = None
    db.commit()
    return True


def clear_refresh_token(db: Session, user: User, session_key: str | None = None) -> None:
    if session_key:
        revoke_session(db, user, session_key)
        return

    user.refresh_token_hash = None
    user.refresh_token_expires_at = None
    user.refresh_token_device_hash = None
    user.refresh_token_ip_hash = None
    user.refresh_token_user_agent_hash = None
    user.refresh_token_session_id = None
    db.query(UserSession).filter(UserSession.user_id == user.id, UserSession.revoked_at.is_(None)).update(
        {
            UserSession.revoked_at: utcnow_naive(),
            UserSession.last_seen_at: utcnow_naive(),
        },
        synchronize_session=False,
    )
    db.commit()
    db.refresh(user)


def clear_all_refresh_tokens(db: Session, user: User) -> int:
    active_sessions = db.query(UserSession).filter(UserSession.user_id == user.id, UserSession.revoked_at.is_(None))
    count = active_sessions.count()
    now = utcnow_naive()
    active_sessions.update({UserSession.revoked_at: now, UserSession.last_seen_at: now}, synchronize_session=False)
    user.refresh_token_hash = None
    user.refresh_token_expires_at = None
    user.refresh_token_device_hash = None
    user.refresh_token_ip_hash = None
    user.refresh_token_user_agent_hash = None
    user.refresh_token_session_id = None
    db.commit()
    db.refresh(user)
    return count


def list_user_sessions(db: Session, user: User) -> list[UserSession]:
    prune_expired_sessions(db, user)
    return db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.revoked_at.is_(None),
    ).order_by(UserSession.last_seen_at.desc(), UserSession.created_at.desc()).all()


def list_login_activity(db: Session, user: User, limit: int = 20) -> list[AuditLog]:
    safe_limit = max(1, min(int(limit or 20), 50))
    return db.query(AuditLog).filter(
        AuditLog.actor_user_id == user.id,
        AuditLog.action.in_(['login_success', 'refresh_success', 'logout', 'logout_all', 'dev_login', 'login_failed']),
    ).order_by(AuditLog.created_at.desc()).limit(safe_limit).all()


def update_password(db: Session, user: User, new_password: str) -> User:
    if len(new_password or '') < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Password must be at least 6 characters')

    user.hashed_password = hash_password(new_password)
    user.password_changed_at = utcnow_naive()
    user.password_reset_code = None
    user.password_reset_expires_at = None
    user.refresh_token_hash = None
    user.refresh_token_expires_at = None
    user.refresh_token_device_hash = None
    user.refresh_token_ip_hash = None
    user.refresh_token_user_agent_hash = None
    user.refresh_token_session_id = None
    db.query(UserSession).filter(UserSession.user_id == user.id, UserSession.revoked_at.is_(None)).update(
        {UserSession.revoked_at: utcnow_naive(), UserSession.last_seen_at: utcnow_naive()},
        synchronize_session=False,
    )
    db.commit()
    db.refresh(user)
    return user
