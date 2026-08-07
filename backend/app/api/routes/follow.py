from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.follow import Follow
from app.models.friendship import FRIENDSHIP_STATUS_ACCEPTED, Friendship
from app.models.user import User
from app.services.notification_service import create_and_send_notification

router = APIRouter()


# ============================================================================
# ✅ v89.45 ROOT FIX — حساب العدادات من المصدر الحقيقي (Follow + Friendship، حيث
# الصداقة المقبولة تُعتبر متابعة ثنائية تلقائية للطرفين).
# ============================================================================

def _friend_ids_of(db: Session, user_id: int) -> set[int]:
    rows = db.query(Friendship).filter(
        Friendship.status == FRIENDSHIP_STATUS_ACCEPTED,
        or_(Friendship.requester_id == user_id, Friendship.addressee_id == user_id),
    ).all()
    ids: set[int] = set()
    for row in rows:
        ids.add(row.addressee_id if row.requester_id == user_id else row.requester_id)
    return ids


def _real_followers_ids(db: Session, target_id: int) -> set[int]:
    return {row.follower_id for row in db.query(Follow).filter(Follow.following_id == target_id).all()} | _friend_ids_of(db, target_id)


def _real_following_ids(db: Session, user_id: int) -> set[int]:
    return {row.following_id for row in db.query(Follow).filter(Follow.follower_id == user_id).all()} | _friend_ids_of(db, user_id)


def _sync_counts(db: Session, user: User) -> None:
    followers = len(_real_followers_ids(db, user.id))
    following = len(_real_following_ids(db, user.id))
    if int(user.followers_count or 0) != followers or int(user.following_count or 0) != following:
        user.followers_count = followers
        user.following_count = following
        db.commit()
        db.refresh(user)


def _public_user_payload(user: User, followed_at=None) -> dict:
    payload = {
        'id': user.id,
        'username': user.username,
        'avatar': user.avatar,
        'followers_count': int(user.followers_count or 0),
        'following_count': int(user.following_count or 0),
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
    db.commit()
    db.refresh(follow)

    # ✅ v89.45: احتساب العدادات من الجدول الحقيقي (متابعون + أصدقاء)
    _sync_counts(db, current_user)
    _sync_counts(db, target_user)

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
    db.commit()
    # ✅ v89.45: إعادة احتساب العدادات من المصدر الحقيقي بعد الحذف
    _sync_counts(db, current_user)
    _sync_counts(db, target_user)

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

    # ✅ v89.45: متابعون صريحون + أصدقاء مقبولون
    ids = _real_followers_ids(db, user_id)
    _sync_counts(db, user)
    if not ids:
        return []
    rows = db.query(User).filter(User.id.in_(ids), User.is_active.is_(True)).all()
    return [_public_user_payload(u) for u in rows]


@router.get('/{user_id}/following')
def get_following(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    # ✅ v89.45: متابَعون صريحون + أصدقاء مقبولون
    ids = _real_following_ids(db, user_id)
    _sync_counts(db, user)
    if not ids:
        return []
    rows = db.query(User).filter(User.id.in_(ids), User.is_active.is_(True)).all()
    return [_public_user_payload(u) for u in rows]
