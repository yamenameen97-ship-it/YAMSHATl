from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User


def _normalize_username(value: str) -> str:
    return (value or '').strip().replace(' ', '_')


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
    user = db.query(User).filter(
        ((User.email == normalized_identifier.lower()) | (User.username == normalized_identifier))
        & (User.is_active.is_(True))
    ).first()

    if user is None or not verify_password(password or '', user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

    return user
