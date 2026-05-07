from datetime import datetime, timedelta, timezone
import re

from fastapi import HTTPException, status
from sqlalchemy import and_, func, inspect, or_, text
from sqlalchemy.orm import Session

from app.core.admin_access import is_primary_admin_email
from app.core.config import settings
from app.core.request_security import stable_hash
from app.core.security import generate_numeric_code, hash_password, verify_password
from app.models.user import User

VERIFICATION_REQUIRED_DETAIL = 'Email verification required'
EMAIL_REGEX = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$', re.IGNORECASE)


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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Email or username not found')

    password_is_valid = _password_matches(password or '', user.hashed_password)
    if not password_is_valid:
        legacy_password = _load_legacy_password(db, user.id)
        password_is_valid = _password_matches(password or '', legacy_password)

    if not password_is_valid:
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

    return user


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


def store_refresh_token(db: Session, user: User, refresh_token: str, expires_at: datetime, binding_context: dict | None = None) -> None:
    binding_context = binding_context or {}
    user.refresh_token_hash = hash_password(refresh_token)
    user.refresh_token_expires_at = expires_at
    user.refresh_token_device_hash = binding_context.get('device_id_hash') or None
    user.refresh_token_ip_hash = binding_context.get('ip_hash') or None
    user.refresh_token_user_agent_hash = binding_context.get('user_agent_hash') or None
    user.refresh_token_session_id = stable_hash(refresh_token)[:64]
    user.refresh_token_rotated_at = utcnow_naive()
    db.commit()
    db.refresh(user)


def validate_refresh_token(user: User, refresh_token: str, binding_context: dict | None = None) -> None:
    if not user.refresh_token_hash or not user.refresh_token_expires_at:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Refresh session not found')
    if user.refresh_token_expires_at < utcnow_naive():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Refresh token expired')
    if not verify_password(refresh_token, user.refresh_token_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid refresh token')

    binding_context = binding_context or {}
    expected_device = (user.refresh_token_device_hash or '').strip()
    expected_ip = (user.refresh_token_ip_hash or '').strip()
    expected_ua = (user.refresh_token_user_agent_hash or '').strip()
    provided_device = (binding_context.get('device_id_hash') or '').strip()
    provided_ip = (binding_context.get('ip_hash') or '').strip()
    provided_ua = (binding_context.get('user_agent_hash') or '').strip()

    if expected_device and expected_device != provided_device:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Refresh token device mismatch')
    if expected_ua and expected_ua != provided_ua:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Refresh token user agent mismatch')
    if expected_ip and expected_ip != provided_ip:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Refresh token IP mismatch')


def clear_refresh_token(db: Session, user: User) -> None:
    user.refresh_token_hash = None
    user.refresh_token_expires_at = None
    user.refresh_token_device_hash = None
    user.refresh_token_ip_hash = None
    user.refresh_token_user_agent_hash = None
    user.refresh_token_session_id = None
    db.commit()
    db.refresh(user)


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
    db.commit()
    db.refresh(user)
    return user
