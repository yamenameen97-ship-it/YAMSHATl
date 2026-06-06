from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.follow import Follow
from app.models.user import User
from app.services.notification_service import create_and_send_notification

router = APIRouter()


def _public_user_payload(user: User, followed_at=None) -> dict:
    payload = {
        'id': user.id,
        'username': user.username,
        'avatar': user.avatar,
        'followers_count': user.followers_count,
        'following_count': user.following_count,
    }
    if followed_at is not None:
        payload['followed_at'] = followed_at
    return payload


@router.post('/{user_id}')
async def follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='لا يمكن متابعة نفسك')

    target_user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if target_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    exists = db.query(Follow).filter_by(
        follower_id=current_user.id,
        following_id=user_id,
    ).first()
    if exists:
        return {
            'message': 'Already following',
            'target_user': _public_user_payload(target_user, exists.created_at.isoformat()),
        }

    follow = Follow(
        follower_id=current_user.id,
        following_id=user_id,
    )
    db.add(follow)

    current_user.following_count = (current_user.following_count or 0) + 1
    target_user.followers_count = (target_user.followers_count or 0) + 1

    db.commit()
    db.refresh(follow)
    db.refresh(current_user)
    db.refresh(target_user)

    await create_and_send_notification(
        db=db,
        user_id=user_id,
        notification_type='FOLLOW',
        data={
            'from_user_id': current_user.id,
            'username': current_user.username,
        },
    )

    return {
        'message': 'Followed',
        'target_user': _public_user_payload(target_user, follow.created_at.isoformat()),
        'current_user': _public_user_payload(current_user),
    }


@router.delete('/{user_id}')
def unfollow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='لا يمكن إلغاء متابعة نفسك')

    target_user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if target_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    follow = db.query(Follow).filter_by(
        follower_id=current_user.id,
        following_id=user_id,
    ).first()
    if follow is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Not following')

    db.delete(follow)
    target_user.followers_count = max((target_user.followers_count or 0) - 1, 0)
    current_user.following_count = max((current_user.following_count or 0) - 1, 0)
    db.commit()
    db.refresh(current_user)
    db.refresh(target_user)

    return {
        'message': 'Unfollowed',
        'target_user': _public_user_payload(target_user),
        'current_user': _public_user_payload(current_user),
    }


@router.get('/{user_id}/followers')
def get_followers(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    followers = db.query(User, Follow.created_at).join(
        Follow,
        Follow.follower_id == User.id,
    ).filter(
        Follow.following_id == user_id,
        User.is_active.is_(True),
    ).order_by(Follow.created_at.desc()).all()

    return [_public_user_payload(follower, followed_at.isoformat()) for follower, followed_at in followers]


@router.get('/{user_id}/following')
def get_following(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    following = db.query(User, Follow.created_at).join(
        Follow,
        Follow.following_id == User.id,
    ).filter(
        Follow.follower_id == user_id,
        User.is_active.is_(True),
    ).order_by(Follow.created_at.desc()).all()

    return [_public_user_payload(followed_user, followed_at.isoformat()) for followed_user, followed_at in following]
