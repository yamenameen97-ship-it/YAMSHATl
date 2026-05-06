from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.follow import Follow
from app.models.user import User
from app.services.notification_service import create_and_send_notification
from app.services.post_service import get_posts_by_username

router = APIRouter()


def _user_payload(user: User, following: bool | None = None) -> dict:
    payload = {
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
    if following is not None:
        payload['following'] = following
    return payload


def _find_active_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username, User.is_active.is_(True)).first()


@router.get('')
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    users = db.query(User).filter(User.is_active.is_(True)).order_by(User.created_at.desc()).all()
    following_ids = {
        follow.following_id
        for follow in db.query(Follow).filter(Follow.follower_id == current_user.id).all()
    }
    return [_user_payload(user, following=user.id in following_ids) for user in users]


@router.get('/me')
def get_me(current_user: User = Depends(get_current_user)):
    return _user_payload(current_user)


@router.patch('/me')
def update_me(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    requested_username = str(payload.get('username') or current_user.username).strip().replace(' ', '_')
    requested_avatar = str(payload.get('avatar') or '').strip() or None

    if not requested_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Username is required')

    existing = db.query(User).filter(User.username == requested_username, User.id != current_user.id).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Username already exists')

    current_user.username = requested_username
    current_user.avatar = requested_avatar
    db.commit()
    db.refresh(current_user)
    return _user_payload(current_user)


@router.get('/followers/{username}')
def get_followers_summary(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ = current_user
    user = _find_active_user_by_username(db, username)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    return {
        'username': user.username,
        'followers': int(user.followers_count or 0),
        'following': int(user.following_count or 0),
    }


@router.get('/relationship/{username}')
def get_relationship(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = _find_active_user_by_username(db, username)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    relation = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.following_id == user.id).first()
    return {'username': username, 'following': relation is not None}


@router.post('/follow')
async def follow_or_unfollow(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_username = str(payload.get('following') or payload.get('username') or '').strip()
    if not target_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Target username is required')
    if current_user.username == target_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='لا يمكن متابعة نفسك')

    target_user = _find_active_user_by_username(db, target_username)
    if target_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    existing = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.following_id == target_user.id).first()
    following = False
    if existing is None:
        db.add(Follow(follower_id=current_user.id, following_id=target_user.id))
        current_user.following_count = (current_user.following_count or 0) + 1
        target_user.followers_count = (target_user.followers_count or 0) + 1
        db.commit()
        db.refresh(current_user)
        db.refresh(target_user)
        following = True
        await create_and_send_notification(
            db=db,
            user_id=target_user.id,
            notification_type='FOLLOW',
            data={
                'from_user_id': current_user.id,
                'username': current_user.username,
            },
        )
    else:
        db.delete(existing)
        current_user.following_count = max((current_user.following_count or 0) - 1, 0)
        target_user.followers_count = max((target_user.followers_count or 0) - 1, 0)
        db.commit()
        db.refresh(current_user)
        db.refresh(target_user)

    return {
        'username': target_user.username,
        'following': following,
        'followers': int(target_user.followers_count or 0),
        'following_count': int(target_user.following_count or 0),
    }


@router.get('/user_posts/{username}')
def get_user_posts(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ = current_user
    return get_posts_by_username(db, username)


@router.get('/by-id/{user_id}')
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ = current_user
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
