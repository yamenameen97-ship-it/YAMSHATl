from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import TokenError, decode_token
from app.db.session import SessionLocal
from app.models.user import User

security = HTTPBearer(auto_error=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Authentication required')

    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get('user_id')
    except TokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token payload')

    user = db.query(User).filter(User.id == int(user_id), User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    return user
