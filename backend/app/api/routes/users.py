from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User

router = APIRouter()


def _user_payload(user: User) -> dict:
    return {
        'id': user.id,
        'name': user.username,
        'username': user.username,
        'email': user.email,
        'avatar': user.avatar,
        'role': user.role,
        'is_active': user.is_active,
        'followers_count': user.followers_count,
        'following_count': user.following_count,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'last_login_at': user.last_login_at.isoformat() if user.last_login_at else None,
    }


@router.get('')
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    users = db.query(User).filter(User.is_active.is_(True)).order_by(User.created_at.desc()).all()
    return [_user_payload(user) for user in users]


@router.get('/me')
def get_me(current_user: User = Depends(get_current_user)):
    return _user_payload(current_user)


@router.get('/{user_id}')
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    return _user_payload(user)


@router.post('/fcm-token')
def save_fcm_token(
    token: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.fcm_token = token.strip() or None
    db.commit()
    return {'message': 'Token saved'}
