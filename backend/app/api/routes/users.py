from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_token_payload, get_current_user, get_db
from app.core.request_security import stable_hash
from app.models.audit_log import AuditLog
from app.models.follow import Follow
from app.models.user import User
from app.models.user_preference import UserPreference
from app.models.user_session import UserSession
from app.services.auth_service import list_login_activity, list_user_sessions, revoke_session
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


def _get_or_create_preferences(db: Session, user_id: int) -> UserPreference:
    preference = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    if preference is None:
        preference = UserPreference(user_id=user_id, language='ar', chat_translation_enabled=True)
        db.add(preference)
        db.commit()
        db.refresh(preference)
    return preference


def _session_label(record: UserSession) -> str:
    return str(record.device_label or 'Unknown browser').strip()[:120] or 'Unknown browser'


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


@router.get('/sessions')
def get_my_sessions(
    current_user: User = Depends(get_current_user),
    token_payload: dict = Depends(get_current_token_payload),
    db: Session = Depends(get_db),
):
    current_session_key = str(token_payload.get('sid') or '').strip()
    items = list_user_sessions(db, current_user)
    return {
        'sessions': [
            {
                'session_id': record.session_key,
                'label': _session_label(record),
                'login_method': record.login_method,
                'remember_me': bool(record.remember_me),
                'created_at': record.created_at.isoformat() if record.created_at else None,
                'last_seen_at': record.last_seen_at.isoformat() if record.last_seen_at else None,
                'expires_at': record.expires_at.isoformat() if record.expires_at else None,
                'is_current': record.session_key == current_session_key,
            }
            for record in items
        ],
        'current_session_id': current_session_key or None,
    }


@router.delete('/sessions/{session_id}')
def revoke_my_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    token_payload: dict = Depends(get_current_token_payload),
    db: Session = Depends(get_db),
):
    current_session_key = str(token_payload.get('sid') or '').strip()
    revoked = revoke_session(db, current_user, session_id)
    if not revoked:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Session not found')
    return {
        'message': 'Session revoked',
        'session_id': session_id,
        'was_current': session_id == current_session_key,
    }


@router.get('/login-activity')
def get_my_login_activity(
    limit: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = list_login_activity(db, current_user, limit=limit)
    return {
        'activity': [
            {
                'id': row.id,
                'action': row.action,
                'description': row.description,
                'created_at': row.created_at.isoformat() if row.created_at else None,
                'remember_me': bool((row.meta or {}).get('remember_me')),
                'login_method': (row.meta or {}).get('login_method') or (row.action.replace('_', '-') if row.action else 'unknown'),
            }
            for row in rows
        ]
    }


@router.get('/preferences')
def get_preferences(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    preference = _get_or_create_preferences(db, current_user.id)
    return {
        'language': preference.language or 'ar',
        'chat_translation_enabled': bool(preference.chat_translation_enabled),
    }


@router.put('/preferences')
def update_preferences(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    preference = _get_or_create_preferences(db, current_user.id)
    requested_language = str(payload.get('language') or preference.language or 'ar').strip().lower()
    if requested_language not in {'ar', 'en'}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Unsupported language')

    preference.language = requested_language
    preference.chat_translation_enabled = bool(payload.get('chat_translation_enabled', preference.chat_translation_enabled))
    db.commit()
    db.refresh(preference)
    return {
        'language': preference.language,
        'chat_translation_enabled': bool(preference.chat_translation_enabled),
    }


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
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    token = str(payload.get('token') or '').strip()
    platform = str(payload.get('platform') or 'unknown').strip().lower()[:30]
    app_version = str(payload.get('app_version') or '').strip()[:40]
    if token and len(token) < 20:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid push token')
    current_user.fcm_token = token or None
    db.commit()
    return {
        'message': 'Token saved',
        'platform': platform,
        'app_version': app_version or None,
        'push_enabled': bool(current_user.fcm_token),
    }
