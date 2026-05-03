import random

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.redis import redis_client
from app.core.security import create_access_token
from app.schemas.user import Token, UserCreate, UserLogin, UserOut
from app.services.auth_service import authenticate_user, register_user
from app.services.email import send_email

router = APIRouter()


@router.post('/register', response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    return register_user(db, payload)


@router.post('/login', response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    token = create_access_token({'user_id': user.id})
    return {'access_token': token, 'token_type': 'bearer'}


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
