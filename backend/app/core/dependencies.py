from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import ACCESS_TOKEN_TYPE, TokenError, decode_token
from app.db.session import SessionLocal
from app.models.user import User
from app.models.user_session import UserSession

security = HTTPBearer(auto_error=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _token_issued_at(payload: dict) -> datetime | None:
    issued_at = payload.get('iat')
    if not isinstance(issued_at, (int, float)):
        return None
    return datetime.fromtimestamp(float(issued_at), tz=timezone.utc).replace(tzinfo=None)


def _require_active_access_session(db: Session, user: User, token_payload: dict) -> UserSession:
    session_key = str(token_payload.get('sid') or '').strip()
    if not session_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Legacy session expired, please login again')

    session_record = db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.session_key == session_key,
        UserSession.revoked_at.is_(None),
    ).first()
    if session_record is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Session revoked or expired, please login again')

    if session_record.expires_at <= datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Session expired, please login again')

    token_issued_at = _token_issued_at(token_payload)
    if token_issued_at and user.password_changed_at and user.password_changed_at > token_issued_at:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token expired after password change, please login again')

    return session_record


def get_current_token_payload(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Authentication required')

    try:
        payload = decode_token(credentials.credentials, expected_type=ACCESS_TOKEN_TYPE)
    except TokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    user_id = payload.get('user_id')
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token payload')
    return payload


def get_current_user(
    token_payload: dict = Depends(get_current_token_payload),
    db: Session = Depends(get_db),
) -> User:
    user_id = token_payload.get('user_id')
    user = db.query(User).filter(User.id == int(user_id), User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    if not bool(user.email_verified):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Email verification required')

    _require_active_access_session(db, user, token_payload)
    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    الحصول على المستخدم الحالي (اختياري) للسماح بالوصول العام.
    """
    if not credentials:
        return None

    try:
        payload = decode_token(credentials.credentials, expected_type=ACCESS_TOKEN_TYPE)
        user_id = payload.get('user_id')
        if not user_id:
            return None
            
        user = db.query(User).filter(User.id == int(user_id), User.is_active.is_(True)).first()
        if not user or not bool(user.email_verified):
            return None

        # التحقق من الجلسة (اختياري في حالة الـ optional لتقليل القيود)
        try:
            _require_active_access_session(db, user, payload)
        except:
            return None

        return user
    except:
        return None
