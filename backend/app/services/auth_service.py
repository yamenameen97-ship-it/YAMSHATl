from fastapi import HTTPException, status
from sqlalchemy import and_, func, inspect, or_, text
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User


def _normalize_username(value: str) -> str:
    return (value or '').strip().replace(' ', '_')


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


def register_user(db: Session, username: str, email: str, password: str, avatar: str | None = None) -> User:
    normalized_username = _normalize_username(username)
    email = (email or '').strip().lower()
    password = password or ''

    if not normalized_username or not email or len(password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Missing or invalid registration fields')

    existing_user = db.query(User).filter((User.email == email) | (User.username == normalized_username)).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email or username already exists')

    role = 'admin' if (db.query(User).count() or 0) == 0 else 'user'
    user = User(
        username=normalized_username,
        email=email,
        avatar=avatar,
        role=role,
        hashed_password=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, identifier: str, password: str) -> User:
    normalized_identifier = (identifier or '').strip()
    lowered_identifier = normalized_identifier.lower()
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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

    password_is_valid = _password_matches(password or '', user.hashed_password)
    if not password_is_valid:
        legacy_password = _load_legacy_password(db, user.id)
        password_is_valid = _password_matches(password or '', legacy_password)

    if not password_is_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

    if not _looks_like_modern_hash(user.hashed_password):
        user.hashed_password = hash_password(password or '')
        db.commit()
        db.refresh(user)

    return user
