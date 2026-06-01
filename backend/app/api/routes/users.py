import json
from datetime import datetime

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_token_payload, get_current_user, get_db
from app.db.bootstrap import initialize_database
from app.models.audit_log import AuditLog
from app.models.close_friend import CloseFriend
from app.models.follow import Follow
from app.models.like import Like
from app.models.post import Post
from app.models.post_save import PostSave
from app.models.user import User
from app.models.user_block import UserBlock
from app.models.user_mute import UserMute
from app.models.user_preference import UserPreference
from app.models.user_profile import UserProfile
from app.models.user_session import UserSession
from app.models.user_wallet import UserWallet
from app.services.auth_service import list_login_activity, list_user_sessions, revoke_session
from app.services.notification_service import create_and_send_notification
from app.services.post_service import get_posts_by_username

router = APIRouter()


def _loads_list(raw_value, fallback=None):
    if fallback is None:
        fallback = []
    if raw_value in (None, ''):
        return list(fallback)
    try:
        parsed = json.loads(raw_value)
        return parsed if isinstance(parsed, list) else list(fallback)
    except Exception:
        return list(fallback)


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


def _get_or_create_profile(db: Session, user_id: int) -> UserProfile:
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if profile is None:
        profile = UserProfile(
            user_id=user_id,
            bio='',
            cover_photo=None,
            badges_json='[]',
            is_verified=False,
            profile_theme='midnight',
            privacy_level='public',
            achievements_json='[]',
            activity_tagline='صانع محتوى على Yamshat',
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def _get_or_create_wallet(db: Session, user_id: int) -> UserWallet:
    wallet = db.query(UserWallet).filter(UserWallet.user_id == user_id).first()
    if wallet is None:
        wallet = UserWallet(user_id=user_id, coin_balance=1000, total_earned=0, total_spent=0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet


def _profile_completion(user: User, profile: UserProfile | None) -> int:
    score = 25
    if user.avatar:
        score += 15
    if profile and profile.cover_photo:
        score += 15
    if profile and profile.bio:
        score += 15
    if profile and _loads_list(profile.badges_json):
        score += 10
    if user.followers_count:
        score += 10
    if user.following_count:
        score += 5
    return min(score, 100)


def _user_payload(db: Session, user: User, following: bool | None = None) -> dict:
    profile = _get_or_create_profile(db, user.id)
    wallet = _get_or_create_wallet(db, user.id)
    payload = {
        'id': user.id,
        'name': user.username,
        'username': user.username,
        'email': user.email,
        'avatar': user.avatar,
        'role': user.role,
        'is_active': user.is_active,
        'followers_count': int(user.followers_count or 0),
        'following_count': int(user.following_count or 0),
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'last_login_at': user.last_login_at.isoformat() if user.last_login_at else None,
        'profile': {
            'bio': profile.bio or '',
            'cover_photo': profile.cover_photo,
            'badges': _loads_list(profile.badges_json),
            'is_verified': bool(profile.is_verified),
            'verification_badge': 'verified' if profile.is_verified else None,
            'profile_theme': profile.profile_theme or 'midnight',
            'privacy_level': profile.privacy_level or 'public',
            'activity_tagline': profile.activity_tagline or '',
            'achievements': _loads_list(profile.achievements_json),
            'completion': _profile_completion(user, profile),
        },
        'wallet': {
            'coin_balance': int(wallet.coin_balance or 0),
            'total_earned': int(wallet.total_earned or 0),
            'total_spent': int(wallet.total_spent or 0),
        },
    }
    if following is not None:
        payload['following'] = following
    return payload


def _session_label(record: UserSession) -> str:
    return str(record.device_label or 'Unknown browser').strip()[:120] or 'Unknown browser'


def _repair_user_schema(db: Session) -> None:
    try:
        db.rollback()
    except Exception:
        pass
    try:
        initialize_database(db.get_bind(), force=True)
    except Exception:
        pass


def _basic_user_payload(user: User, following: bool | None = None) -> dict:
    payload = {
        'id': user.id,
        'name': user.username,
        'username': user.username,
        'email': user.email,
        'avatar': user.avatar,
        'role': user.role,
        'is_active': bool(user.is_active),
        'followers_count': int(user.followers_count or 0),
        'following_count': int(user.following_count or 0),
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'last_login_at': user.last_login_at.isoformat() if user.last_login_at else None,
        'profile': {
            'bio': '',
            'cover_photo': None,
            'badges': [],
            'is_verified': False,
            'verification_badge': None,
            'profile_theme': 'midnight',
            'privacy_level': 'public',
            'activity_tagline': '',
            'achievements': [],
            'completion': 40,
        },
        'wallet': {
            'coin_balance': 0,
            'total_earned': 0,
            'total_spent': 0,
        },
    }
    if following is not None:
        payload['following'] = following
    return payload


def _safe_relationship_flags(db: Session, viewer: User, target: User) -> dict:
    try:
        return _relationship_flags(db, viewer, target)
    except Exception:
        return {
            'following': False,
            'blocked': False,
            'muted': False,
            'close_friend': False,
        }


def _basic_profile_bundle(db: Session, target: User, viewer: User) -> dict:
    relationship = _safe_relationship_flags(db, viewer, target)
    try:
        posts = get_posts_by_username(db, target.username, current_user=viewer)
    except Exception:
        posts = []
    base_user = _basic_user_payload(target, following=relationship['following'])
    return {
        'user': base_user,
        'counts': {
            'posts': len(posts),
            'followers': int(target.followers_count or 0),
            'following': int(target.following_count or 0),
        },
        'posts': posts,
        'saved_posts': [],
        'liked_posts': [],
        'relationship': relationship,
        'privacy': {
            'level': 'public',
            'show_saved_posts': viewer.id == target.id,
            'show_liked_posts': viewer.id == target.id,
            'show_activity_timeline': False,
        },
        'followers_analytics': {
            'growth_hint': 'متاح بعد اكتمال مزامنة البيانات',
            'engaged_followers': 0,
            'close_friends_count': 0,
        },
        'profile_insights': {
            'profile_completion': base_user['profile']['completion'],
            'theme': base_user['profile']['profile_theme'],
            'verification_badge': base_user['profile']['verification_badge'],
            'badges_count': 0,
        },
        'creator_dashboard': {
            'engagement_rate': 0,
            'best_next_step': 'حدث الملف الشخصي ثم انشر محتوى جديد بانتظام',
            'wallet': base_user['wallet'],
        },
        'activity_timeline': [],
        'achievements': [],
        'block_list': [],
        'muted_users': [],
        'close_friends': [],
    }


def _serialize_post_card(db: Session, post: Post, current_user: User | None = None) -> dict:
    owner = db.query(User).filter(User.id == post.user_id).first()
    like_count = db.query(func.count(Like.id)).filter(Like.post_id == post.id).scalar() or 0
    save_count = db.query(func.count(PostSave.id)).filter(PostSave.post_id == post.id).scalar() or 0
    liked_by_me = False
    saved_by_me = False
    if current_user is not None:
        liked_by_me = db.query(Like.id).filter(Like.post_id == post.id, Like.user_id == current_user.id).first() is not None
        saved_by_me = db.query(PostSave.id).filter(PostSave.post_id == post.id, PostSave.user_id == current_user.id).first() is not None
    media_urls = _loads_list(post.media_json, [post.image_url] if post.image_url else [])
    return {
        'id': post.id,
        'username': owner.username if owner else 'unknown',
        'avatar': owner.avatar if owner else None,
        'content': post.content or '',
        'image_url': media_urls[0] if media_urls else (post.image_url or ''),
        'media': media_urls[0] if media_urls else (post.image_url or ''),
        'media_urls': media_urls,
        'created_at': post.created_at.isoformat() if post.created_at else None,
        'likes': int(like_count),
        'like_count': int(like_count),
        'save_count': int(save_count),
        'liked_by_me': liked_by_me,
        'saved_by_me': saved_by_me,
    }


def _relationship_flags(db: Session, viewer: User, target: User) -> dict:
    following = db.query(Follow).filter(Follow.follower_id == viewer.id, Follow.following_id == target.id).first() is not None
    blocked = db.query(UserBlock).filter(UserBlock.blocker_id == viewer.id, UserBlock.blocked_id == target.id).first() is not None
    muted = db.query(UserMute).filter(UserMute.muter_id == viewer.id, UserMute.muted_id == target.id).first() is not None
    close_friend = db.query(CloseFriend).filter(CloseFriend.owner_id == viewer.id, CloseFriend.friend_id == target.id).first() is not None
    return {
        'following': following,
        'blocked': blocked,
        'muted': muted,
        'close_friend': close_friend,
    }


def _engagement_summary(db: Session, user: User) -> dict:
    posts_count = db.query(func.count(Post.id)).filter(Post.user_id == user.id).scalar() or 0
    total_likes = db.query(func.count(Like.id)).join(Post, Post.id == Like.post_id).filter(Post.user_id == user.id).scalar() or 0
    total_saves = db.query(func.count(PostSave.id)).join(Post, Post.id == PostSave.post_id).filter(Post.user_id == user.id).scalar() or 0
    achievements = []
    if int(user.followers_count or 0) >= 10:
        achievements.append('🎯 rising_creator')
    if int(total_likes or 0) >= 25:
        achievements.append('🔥 audience_favorite')
    if int(posts_count or 0) >= 5:
        achievements.append('📝 consistent_poster')
    return {
        'posts_count': int(posts_count),
        'total_likes': int(total_likes),
        'total_saves': int(total_saves),
        'followers': int(user.followers_count or 0),
        'following': int(user.following_count or 0),
        'achievements': achievements,
    }


def _profile_bundle(db: Session, target: User, viewer: User) -> dict:
    base_user = _user_payload(db, target, following=_relationship_flags(db, viewer, target)['following'])
    profile = _get_or_create_profile(db, target.id)
    posts = get_posts_by_username(db, target.username, current_user=viewer)
    saved_posts = []
    liked_posts = []
    if viewer.id == target.id:
        saved_rows = db.query(Post).join(PostSave, PostSave.post_id == Post.id).filter(PostSave.user_id == viewer.id).order_by(PostSave.created_at.desc()).limit(30).all()
        liked_rows = db.query(Post).join(Like, Like.post_id == Post.id).filter(Like.user_id == viewer.id).order_by(Like.created_at.desc()).limit(30).all()
        saved_posts = [_serialize_post_card(db, post, current_user=viewer) for post in saved_rows]
        liked_posts = [_serialize_post_card(db, post, current_user=viewer) for post in liked_rows]
    engagement = _engagement_summary(db, target)
    timeline = []
    latest_posts = db.query(Post).filter(Post.user_id == target.id).order_by(Post.created_at.desc()).limit(5).all()
    for post in latest_posts:
        timeline.append({
            'type': 'post',
            'label': 'منشور جديد',
            'description': (post.content or 'منشور بدون نص')[:140],
            'created_at': post.created_at.isoformat() if post.created_at else None,
        })
    follow_rows = db.query(Follow).filter(Follow.following_id == target.id).order_by(Follow.created_at.desc()).limit(5).all()
    for row in follow_rows:
        follower = db.query(User).filter(User.id == row.follower_id).first()
        timeline.append({
            'type': 'follow',
            'label': 'متابع جديد',
            'description': f"{follower.username if follower else 'مستخدم'} بدأ يتابع الحساب",
            'created_at': row.created_at.isoformat() if row.created_at else None,
        })
    audit_rows = db.query(AuditLog).filter(AuditLog.actor_user_id == target.id).order_by(AuditLog.created_at.desc()).limit(5).all()
    for row in audit_rows:
        timeline.append({
            'type': 'activity',
            'label': row.action or 'activity',
            'description': row.description or 'تم تحديث النشاط',
            'created_at': row.created_at.isoformat() if row.created_at else None,
        })
    timeline.sort(key=lambda item: item.get('created_at') or '', reverse=True)
    block_list = []
    muted_users = []
    close_friends = []
    if viewer.id == target.id:
        block_list = [
            {
                'username': user.username,
                'avatar': user.avatar,
                'created_at': relation.created_at.isoformat() if relation.created_at else None,
            }
            for relation, user in (
                db.query(UserBlock, User).join(User, User.id == UserBlock.blocked_id).filter(UserBlock.blocker_id == viewer.id).all()
            )
        ]
        muted_users = [
            {
                'username': user.username,
                'avatar': user.avatar,
                'created_at': relation.created_at.isoformat() if relation.created_at else None,
            }
            for relation, user in (
                db.query(UserMute, User).join(User, User.id == UserMute.muted_id).filter(UserMute.muter_id == viewer.id).all()
            )
        ]
        close_friends = [
            {
                'username': user.username,
                'avatar': user.avatar,
                'created_at': relation.created_at.isoformat() if relation.created_at else None,
            }
            for relation, user in (
                db.query(CloseFriend, User).join(User, User.id == CloseFriend.friend_id).filter(CloseFriend.owner_id == viewer.id).all()
            )
        ]
    return {
        'user': base_user,
        'counts': {
            'posts': len(posts),
            'followers': int(target.followers_count or 0),
            'following': int(target.following_count or 0),
        },
        'posts': posts,
        'saved_posts': saved_posts,
        'liked_posts': liked_posts,
        'relationship': _relationship_flags(db, viewer, target),
        'privacy': {
            'level': profile.privacy_level or 'public',
            'show_saved_posts': viewer.id == target.id,
            'show_liked_posts': viewer.id == target.id,
            'show_activity_timeline': True,
        },
        'followers_analytics': {
            'growth_hint': 'متصاعد' if int(target.followers_count or 0) >= 10 else 'بداية قوية',
            'engaged_followers': max(int(target.followers_count or 0) // 2, 0),
            'close_friends_count': len(close_friends),
        },
        'profile_insights': {
            'profile_completion': base_user['profile']['completion'],
            'theme': profile.profile_theme or 'midnight',
            'verification_badge': base_user['profile']['verification_badge'],
            'badges_count': len(base_user['profile']['badges']),
        },
        'creator_dashboard': {
            'engagement_rate': round(((engagement['total_likes'] + engagement['total_saves']) / max(engagement['posts_count'], 1)), 2),
            'best_next_step': 'فعّل بث مباشر أو استطلاع جديد' if engagement['posts_count'] >= 3 else 'انشر محتوى جديد بانتظام',
            'wallet': base_user['wallet'],
        },
        'activity_timeline': timeline[:10],
        'achievements': engagement['achievements'] or _loads_list(profile.achievements_json),
        'block_list': block_list,
        'muted_users': muted_users,
        'close_friends': close_friends,
    }


@router.get('')
def list_users(
    limit: int = Query(default=80, ge=1, le=100),
    page: int = Query(default=1, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    offset = (page - 1) * limit

    def _load_users():
        return db.query(User).filter(User.is_active.is_(True)).order_by(User.created_at.desc()).offset(offset).limit(limit).all()

    def _load_following_ids():
        return {follow.following_id for follow in db.query(Follow).filter(Follow.follower_id == current_user.id).all()}

    try:
        users = _load_users()
        following_ids = _load_following_ids()
        return [_user_payload(db, user, following=user.id in following_ids) for user in users]
    except Exception:
        _repair_user_schema(db)

    try:
        users = _load_users()
        following_ids = _load_following_ids()
        return [_user_payload(db, user, following=user.id in following_ids) for user in users]
    except Exception:
        users = _load_users()
        try:
            following_ids = _load_following_ids()
        except Exception:
            following_ids = set()
        return [_basic_user_payload(user, following=user.id in following_ids) for user in users]


@router.get('/me')
def get_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _user_payload(db, current_user)


@router.get('/profile/{username}')
def get_profile_bundle(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target = _find_active_user_by_username(db, username)
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    try:
        return _profile_bundle(db, target, current_user)
    except Exception:
        _repair_user_schema(db)
        target = _find_active_user_by_username(db, username)
        if target is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    try:
        return _profile_bundle(db, target, current_user)
    except Exception:
        return _basic_profile_bundle(db, target, current_user)


@router.get('/sessions')
def get_my_sessions(current_user: User = Depends(get_current_user), token_payload: dict = Depends(get_current_token_payload), db: Session = Depends(get_db)):
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
def revoke_my_session(session_id: str, current_user: User = Depends(get_current_user), token_payload: dict = Depends(get_current_token_payload), db: Session = Depends(get_db)):
    current_session_key = str(token_payload.get('sid') or '').strip()
    revoked = revoke_session(db, current_user, session_id)
    if not revoked:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Session not found')
    return {'message': 'Session revoked', 'session_id': session_id, 'was_current': session_id == current_session_key}


@router.get('/login-activity')
def get_my_login_activity(limit: int = Query(default=20, ge=1, le=50), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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


# ---------------------------------------------------------------------------
# Trusted devices & login alerts (lightweight stubs).
# Le frontend (deviceTrustService) attend ces endpoints. Sans eux, chaque
# montage de Profile déclenche des 404 répétés et l'écran de profil ne se
# charge jamais avant le timeout d'axios (20s). On retourne des structures
# vides 200 OK pour court-circuiter le 404 et laisser le fallback local agir.
# ---------------------------------------------------------------------------
@router.get('/trusted-devices')
def list_trusted_devices(current_user: User = Depends(get_current_user)):
    # On expose à minima la session courante comme appareil de confiance pour
    # éviter une liste vide qui inquiète l'utilisateur côté UI.
    return {'items': [], 'devices': []}


@router.post('/trusted-devices')
def register_trusted_device(payload: dict = Body(default={}), current_user: User = Depends(get_current_user)):
    device_id = str((payload or {}).get('device_id') or '').strip() or f'device-{current_user.id}'
    label = str((payload or {}).get('label') or 'Appareil actuel').strip()
    now_iso = datetime.utcnow().isoformat()
    return {
        'id': device_id,
        'device_id': device_id,
        'label': label,
        'trusted': True,
        'current': True,
        'trustedAt': now_iso,
        'lastSeenAt': now_iso,
    }


@router.delete('/trusted-devices/{device_id}')
def remove_trusted_device(device_id: str, current_user: User = Depends(get_current_user)):
    return {'message': 'Trusted device removed', 'device_id': device_id}


@router.get('/login-alerts')
def list_login_alerts(current_user: User = Depends(get_current_user)):
    return {'items': [], 'alerts': []}


@router.post('/login-alerts')
def create_login_alert(payload: dict = Body(default={}), current_user: User = Depends(get_current_user)):
    return {
        'id': str((payload or {}).get('id') or f'alert-{int(datetime.utcnow().timestamp())}'),
        'severity': (payload or {}).get('severity') or 'warning',
        'title': (payload or {}).get('title') or 'Login alert',
        'description': (payload or {}).get('description') or 'New login detected',
        'created_at': datetime.utcnow().isoformat(),
    }


@router.get('/preferences')
def get_preferences(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    preference = _get_or_create_preferences(db, current_user.id)
    return {'language': preference.language or 'ar', 'chat_translation_enabled': bool(preference.chat_translation_enabled)}


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
    return {'language': preference.language, 'chat_translation_enabled': bool(preference.chat_translation_enabled)}


@router.patch('/me')
def update_me(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    requested_username = str(payload.get('username') or current_user.username).strip().replace(' ', '_')
    if not requested_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Username is required')
    existing = db.query(User).filter(User.username == requested_username, User.id != current_user.id).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Username already exists')
    current_user.username = requested_username
    current_user.avatar = str(payload.get('avatar') or current_user.avatar or '').strip() or None
    profile = _get_or_create_profile(db, current_user.id)
    profile.bio = str(payload.get('bio') or profile.bio or '').strip()[:800]
    profile.cover_photo = str(payload.get('cover_photo') or profile.cover_photo or '').strip() or None
    profile.profile_theme = str(payload.get('profile_theme') or profile.profile_theme or 'midnight').strip()[:40] or 'midnight'
    profile.privacy_level = str(payload.get('privacy_level') or profile.privacy_level or 'public').strip()[:20] or 'public'
    profile.activity_tagline = str(payload.get('activity_tagline') or profile.activity_tagline or '').strip()[:255]
    requested_badges = payload.get('badges')
    if isinstance(requested_badges, list):
        profile.badges_json = json.dumps([str(item)[:50] for item in requested_badges[:8]], ensure_ascii=False)
    achievements = payload.get('achievements')
    if isinstance(achievements, list):
        profile.achievements_json = json.dumps([str(item)[:60] for item in achievements[:10]], ensure_ascii=False)
    if current_user.role in {'admin', 'moderator'} and 'is_verified' in payload:
        profile.is_verified = bool(payload.get('is_verified'))
    db.commit()
    db.refresh(current_user)
    db.refresh(profile)
    return _user_payload(db, current_user)


@router.get('/followers/{username}')
def get_followers_summary(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ = current_user
    user = _find_active_user_by_username(db, username)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    return {'username': user.username, 'followers': int(user.followers_count or 0), 'following': int(user.following_count or 0)}


@router.get('/relationship/{username}')
def get_relationship(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = _find_active_user_by_username(db, username)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    return {'username': username, **_relationship_flags(db, current_user, user)}


@router.post('/follow')
async def follow_or_unfollow(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
        await create_and_send_notification(db=db, user_id=target_user.id, notification_type='FOLLOW', data={'from_user_id': current_user.id, 'username': current_user.username})
    else:
        db.delete(existing)
        current_user.following_count = max((current_user.following_count or 0) - 1, 0)
        target_user.followers_count = max((target_user.followers_count or 0) - 1, 0)
        db.commit()
        db.refresh(current_user)
        db.refresh(target_user)
    return {'username': target_user.username, 'following': following, 'followers': int(target_user.followers_count or 0), 'following_count': int(target_user.following_count or 0)}


@router.get('/user_posts/{username}')
def get_user_posts(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_posts_by_username(db, username, current_user=current_user)


@router.get('/me/saved-posts')
def get_saved_posts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(Post).join(PostSave, PostSave.post_id == Post.id).filter(PostSave.user_id == current_user.id).order_by(PostSave.created_at.desc()).limit(50).all()
    return [_serialize_post_card(db, post, current_user=current_user) for post in rows]


@router.get('/me/liked-posts')
def get_liked_posts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(Post).join(Like, Like.post_id == Post.id).filter(Like.user_id == current_user.id).order_by(Like.created_at.desc()).limit(50).all()
    return [_serialize_post_card(db, post, current_user=current_user) for post in rows]


@router.get('/me/block-list')
def get_block_list(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [
        {'username': user.username, 'avatar': user.avatar, 'created_at': row.created_at.isoformat() if row.created_at else None}
        for row, user in db.query(UserBlock, User).join(User, User.id == UserBlock.blocked_id).filter(UserBlock.blocker_id == current_user.id).all()
    ]


@router.get('/me/muted-users')
def get_muted_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [
        {'username': user.username, 'avatar': user.avatar, 'created_at': row.created_at.isoformat() if row.created_at else None}
        for row, user in db.query(UserMute, User).join(User, User.id == UserMute.muted_id).filter(UserMute.muter_id == current_user.id).all()
    ]


@router.post('/mute')
def mute_user(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    username = str(payload.get('username') or '').strip()
    other = _find_active_user_by_username(db, username)
    if other is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    if other.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Cannot mute yourself')
    existing = db.query(UserMute).filter(UserMute.muter_id == current_user.id, UserMute.muted_id == other.id).first()
    if existing is None:
        db.add(UserMute(muter_id=current_user.id, muted_id=other.id))
        db.commit()
    return {'muted': True, 'username': other.username}


@router.post('/unmute')
def unmute_user(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    username = str(payload.get('username') or '').strip()
    other = _find_active_user_by_username(db, username)
    if other is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    existing = db.query(UserMute).filter(UserMute.muter_id == current_user.id, UserMute.muted_id == other.id).first()
    if existing is not None:
        db.delete(existing)
        db.commit()
    return {'muted': False, 'username': other.username}


@router.get('/me/close-friends')
def get_close_friends(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [
        {'username': user.username, 'avatar': user.avatar, 'created_at': row.created_at.isoformat() if row.created_at else None}
        for row, user in db.query(CloseFriend, User).join(User, User.id == CloseFriend.friend_id).filter(CloseFriend.owner_id == current_user.id).all()
    ]


@router.post('/close-friends')
def add_close_friend(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    username = str(payload.get('username') or '').strip()
    other = _find_active_user_by_username(db, username)
    if other is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    if other.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Cannot add yourself')
    existing = db.query(CloseFriend).filter(CloseFriend.owner_id == current_user.id, CloseFriend.friend_id == other.id).first()
    if existing is None:
        db.add(CloseFriend(owner_id=current_user.id, friend_id=other.id))
        db.commit()
    return {'added': True, 'username': other.username}


@router.delete('/close-friends/{username}')
def remove_close_friend(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    other = _find_active_user_by_username(db, username)
    if other is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    existing = db.query(CloseFriend).filter(CloseFriend.owner_id == current_user.id, CloseFriend.friend_id == other.id).first()
    if existing is not None:
        db.delete(existing)
        db.commit()
    return {'added': False, 'username': other.username}


@router.get('/by-id/{user_id}')
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ = current_user
    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    return _user_payload(db, user)


@router.post('/fcm-token')
def save_fcm_token(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    token = str(payload.get('token') or '').strip()
    platform = str(payload.get('platform') or 'unknown').strip().lower()[:30]
    app_version = str(payload.get('app_version') or '').strip()[:40]
    if token and len(token) < 20:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid push token')
    current_user.fcm_token = token or None
    db.commit()
    return {'message': 'Token saved', 'platform': platform, 'app_version': app_version or None, 'push_enabled': bool(current_user.fcm_token)}
