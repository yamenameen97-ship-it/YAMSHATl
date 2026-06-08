import json
import re
from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.config import settings
from app.core.dependencies import get_current_user, get_current_user_optional, get_db
from app.core.live_store import LiveComment, LiveGift, live_store
from app.core.socket_server import sio
from app.models.live_session import LiveRoomSession
from app.models.user import User

try:
    from livekit import api as livekit_api
except Exception:  # pragma: no cover - handled at runtime if package missing
    livekit_api = None

router = APIRouter()


DEFAULT_STREAM_SETTINGS = {
    'is_public': True,
    'allow_comments': True,
    'allow_gifts': True,
    'require_comment_approval': False,
    'chat_speed_limit': 0,
    'minimum_gift_amount': 0,
    'gift_goal': 0,
}


def _utcnow() -> datetime:
    return datetime.utcnow()


def _iso(value: datetime | None) -> str:
    return value.isoformat() if isinstance(value, datetime) else datetime.utcnow().isoformat()


def _is_livekit_configured() -> bool:
    return bool(settings.LIVEKIT_URL and settings.LIVEKIT_API_KEY and settings.LIVEKIT_API_SECRET and livekit_api)


def _slugify(value: str, fallback: str = 'room') -> str:
    slug = re.sub(r'[^a-zA-Z0-9_-]+', '-', str(value or '').strip()).strip('-').lower()
    return slug or fallback


def _room_name_for(username: str) -> str:
    return f"yamshat-{_slugify(username, 'host')}-{int(datetime.utcnow().timestamp())}"


def _find_room_record(db: Session, room_id: str) -> LiveRoomSession | None:
    return db.query(LiveRoomSession).filter(LiveRoomSession.id == str(room_id)).first()


def _read_extra_snapshot(record: LiveRoomSession) -> dict:
    try:
        return json.loads(record.extra_json or '{}') if record.extra_json else {}
    except Exception:
        return {}


def _hydrate_runtime_room(record: LiveRoomSession):
    runtime_room = live_store.get_room(record.id)
    snapshot = _read_extra_snapshot(record)
    snapshot_thumbnail = str(
        snapshot.get('thumbnail_url')
        or snapshot.get('cover_url')
        or snapshot.get('preview_url')
        or ''
    ).strip()

    if runtime_room:
        runtime_room.title = record.title
        runtime_room.livekit_room = record.livekit_room
        runtime_room.livekit_url = record.livekit_url or settings.LIVEKIT_URL or ''
        runtime_room.stream_status = record.stream_status
        runtime_room.active = bool(record.is_active)
        runtime_room.recording_status = record.recording_status or runtime_room.recording_status
        runtime_room.recording_url = record.recording_url or runtime_room.recording_url
        runtime_room.last_activity_at = _iso(record.last_activity_at)
    else:
        runtime_room = live_store.create_room(
            record.host_user_id,
            record.host_username,
            record.title,
            room_id=record.id,
            created_at=_iso(record.created_at),
            last_activity_at=_iso(record.last_activity_at),
            livekit_room=record.livekit_room,
            livekit_url=record.livekit_url or settings.LIVEKIT_URL or '',
            stream_status=record.stream_status,
            active=record.is_active,
            viewer_count=record.viewer_count,
            peak_viewer_count=record.peak_viewer_count,
            hearts_count=record.hearts_count,
            recording_status=record.recording_status,
            recording_url=record.recording_url,
        )

    runtime_room.thumbnail_url = str(getattr(runtime_room, 'thumbnail_url', '') or snapshot_thumbnail or '').strip()

    if snapshot:
        snapshot_comments = [LiveComment(**comment) for comment in snapshot.get('comments', []) if isinstance(comment, dict)]
        if snapshot_comments and not getattr(runtime_room, 'comments', None):
            runtime_room.comments = snapshot_comments
        elif snapshot_comments:
            existing_comment_ids = {str(comment.id) for comment in (runtime_room.comments or [])}
            runtime_room.comments.extend([comment for comment in snapshot_comments if str(comment.id) not in existing_comment_ids])

        snapshot_gifts = [LiveGift(**gift) for gift in snapshot.get('gifts', []) if isinstance(gift, dict)]
        if snapshot_gifts and not getattr(runtime_room, 'gifts', None):
            runtime_room.gifts = snapshot_gifts
        elif snapshot_gifts:
            existing_gift_ids = {str(gift.id) for gift in (runtime_room.gifts or [])}
            runtime_room.gifts.extend([gift for gift in snapshot_gifts if str(gift.id) not in existing_gift_ids])

        snapshot_viewers = {str(key): value for key, value in (snapshot.get('viewers') or {}).items() if isinstance(value, dict)}
        if snapshot_viewers:
            runtime_room.viewers = {
                **snapshot_viewers,
                **(runtime_room.viewers or {}),
            }

        runtime_room.muted_users = set(runtime_room.muted_users or set()) | set(snapshot.get('muted_users') or [])
        runtime_room.kicked_users = set(runtime_room.kicked_users or set()) | set(snapshot.get('kicked_users') or [])

        merged_co_hosts = []
        for username in [*(snapshot.get('co_hosts') or []), *(runtime_room.co_hosts or [])]:
            candidate = str(username or '').strip()
            if candidate and candidate not in merged_co_hosts:
                merged_co_hosts.append(candidate)
        if record.host_username and record.host_username not in merged_co_hosts:
            merged_co_hosts.insert(0, record.host_username)
        runtime_room.co_hosts = merged_co_hosts or [record.host_username]

        runtime_room.economy = {
            **runtime_room.economy,
            **(snapshot.get('economy') or {}),
            'top_gifters': {
                **((snapshot.get('economy') or {}).get('top_gifters') or {}),
                **(runtime_room.economy.get('top_gifters') or {}),
            },
        }
        runtime_room.recovery_data = {**runtime_room.recovery_data, **(snapshot.get('recovery_data') or {})}
        runtime_room.multi_host_config = {**runtime_room.multi_host_config, **(snapshot.get('multi_host_config') or {})}
        runtime_room.settings = {**DEFAULT_STREAM_SETTINGS, **(snapshot.get('settings') or {}), **(getattr(runtime_room, 'settings', None) or {})}
        analytics = snapshot.get('stream_analytics') or {}
        runtime_unique_viewers = set((runtime_room.stream_analytics or {}).get('unique_viewers') or set())
        snapshot_unique_viewers = set(analytics.get('unique_viewers') or [])
        runtime_room.stream_analytics = {
            **runtime_room.stream_analytics,
            **analytics,
            'unique_viewers': runtime_unique_viewers | snapshot_unique_viewers,
        }
        if runtime_room.co_hosts:
            runtime_room.multi_host_config['current_hosts'] = list(runtime_room.co_hosts)

    runtime_room.viewer_count = max(
        len(runtime_room.viewers or {}),
        int(runtime_room.viewer_count or 0),
        int(record.viewer_count or 0),
    )
    runtime_room.peak_viewer_count = max(
        int(runtime_room.peak_viewer_count or 0),
        int(record.peak_viewer_count or 0),
        int(runtime_room.viewer_count or 0),
    )
    runtime_room.hearts_count = max(int(record.hearts_count or 0), int(runtime_room.hearts_count or 0))
    runtime_room.settings = {
        **DEFAULT_STREAM_SETTINGS,
        **(getattr(runtime_room, 'settings', None) or {}),
    }

    return runtime_room


def _sync_record_from_runtime(db: Session, record: LiveRoomSession, runtime_room) -> None:
    if not runtime_room:
        return
    previous_snapshot = _read_extra_snapshot(record)
    thumbnail_url = str(
        getattr(runtime_room, 'thumbnail_url', '')
        or previous_snapshot.get('thumbnail_url')
        or previous_snapshot.get('cover_url')
        or previous_snapshot.get('preview_url')
        or ''
    ).strip()
    record.viewer_count = max(int(runtime_room.viewer_count or 0), len(runtime_room.viewers or {}))
    record.peak_viewer_count = max(int(record.peak_viewer_count or 0), int(runtime_room.peak_viewer_count or 0), int(record.viewer_count or 0))
    record.hearts_count = int(runtime_room.hearts_count or 0)
    record.recording_status = runtime_room.recording_status or record.recording_status
    record.recording_url = runtime_room.recording_url or record.recording_url
    record.stream_status = runtime_room.stream_status or record.stream_status
    record.last_activity_at = _utcnow()
    record.extra_json = json.dumps({
        'thumbnail_url': thumbnail_url,
        'cover_url': thumbnail_url,
        'preview_url': thumbnail_url,
        'comments': [comment.__dict__ for comment in (runtime_room.comments or [])],
        'gifts': [gift.__dict__ for gift in (runtime_room.gifts or [])],
        'viewers': runtime_room.viewers or {},
        'muted_users': list(runtime_room.muted_users or []),
        'kicked_users': list(runtime_room.kicked_users or []),
        'co_hosts': list(runtime_room.co_hosts or []),
        'economy': runtime_room.economy or {},
        'recovery_data': runtime_room.recovery_data or {},
        'multi_host_config': runtime_room.multi_host_config or {},
        'settings': getattr(runtime_room, 'settings', DEFAULT_STREAM_SETTINGS) or DEFAULT_STREAM_SETTINGS,
        'stream_analytics': {
            **(runtime_room.stream_analytics or {}),
            'unique_viewers': list((runtime_room.stream_analytics or {}).get('unique_viewers') or []),
        },
    }, ensure_ascii=False)
    db.add(record)


def _serialize_record(db: Session, record: LiveRoomSession) -> dict:
    runtime_room = _hydrate_runtime_room(record)
    _sync_record_from_runtime(db, record, runtime_room)
    payload = live_store.serialize_room(runtime_room)
    # جلب بيانات المضيف (الصورة الشخصية)
    host_user = db.query(User).filter(User.id == record.host_user_id).first()
    host_avatar = ""
    if host_user:
        try:
            profile_data = json.loads(host_user.profile_json or '{}') if hasattr(host_user, 'profile_json') else {}
            host_avatar = profile_data.get('avatar') or host_user.avatar_url if hasattr(host_user, 'avatar_url') else ""
        except:
            pass

    snapshot = _read_extra_snapshot(record)
    thumbnail_url = str(
        getattr(runtime_room, 'thumbnail_url', '')
        or snapshot.get('thumbnail_url')
        or snapshot.get('cover_url')
        or snapshot.get('preview_url')
        or ''
    ).strip()

    payload.update({
        'id': record.id,
        'host': record.host_username,
        'username': record.host_username,
        'host_username': record.host_username,
        'host_avatar': host_avatar,
        'title': record.title,
        'thumbnail_url': thumbnail_url,
        'cover_url': thumbnail_url,
        'preview_url': thumbnail_url,
        'image_url': thumbnail_url,
        'created_at': _iso(record.created_at),
        'started_at': _iso(record.created_at),
        'last_activity_at': _iso(record.last_activity_at),
        'active': bool(record.is_active),
        'is_active': bool(record.is_active),
        'is_public': bool(getattr(record, 'is_public', True)),
        'livekit_room': record.livekit_room,
        'livekit_url': record.livekit_url or settings.LIVEKIT_URL or '',
        'stream_status': record.stream_status,
        'viewer_count': int(record.viewer_count or payload.get('viewer_count') or 0),
        'viewers_count': int(record.viewer_count or payload.get('viewer_count') or 0),
        'peak_viewer_count': int(record.peak_viewer_count or payload.get('peak_viewer_count') or 0),
        'hearts_count': int(record.hearts_count or payload.get('hearts_count') or 0),
        'comments_count': len(runtime_room.comments) if hasattr(runtime_room, 'comments') else 0,
        'recording': {
            'status': record.recording_status or payload.get('recording', {}).get('status') or 'idle',
            'url': record.recording_url or payload.get('recording', {}).get('url'),
        },
        'settings': getattr(runtime_room, 'settings', DEFAULT_STREAM_SETTINGS) or DEFAULT_STREAM_SETTINGS,
        'livekit_configured': _is_livekit_configured(),
    })
    db.commit()
    return payload


def _require_room(room_id: str, db: Session) -> LiveRoomSession:
    record = _find_room_record(db, room_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    return record


def _require_host(record: LiveRoomSession, current_user: User):
    if record.host_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only host can manage this live room')
    return _hydrate_runtime_room(record)


def _serialize_viewers(runtime_room) -> list[dict]:
    viewers = []
    for key, viewer in (runtime_room.viewers or {}).items():
        if not isinstance(viewer, dict):
            continue
        username = str(viewer.get('username') or viewer.get('user_id') or key)
        user_key = str(viewer.get('user_id') or viewer.get('sid') or key)
        viewers.append({
            'user_id': user_key,
            'sid': str(viewer.get('sid') or key),
            'username': username,
            'user_avatar': viewer.get('user_avatar') or '',
            'joined_at': viewer.get('joined_at') or _iso(_utcnow()),
            'platform': viewer.get('platform') or 'web',
            'device_type': viewer.get('device_type') or 'browser',
            'is_host': bool(viewer.get('is_host')),
            'is_muted': username in (runtime_room.muted_users or set()) or user_key in (runtime_room.muted_users or set()),
            'is_banned': username in (runtime_room.kicked_users or set()) or user_key in (runtime_room.kicked_users or set()),
            'is_active': True,
        })
    return viewers


def _find_viewer(runtime_room, user_id: str):
    target = str(user_id)
    for key, viewer in (runtime_room.viewers or {}).items():
        if not isinstance(viewer, dict):
            continue
        candidates = {
            str(key),
            str(viewer.get('user_id') or ''),
            str(viewer.get('sid') or ''),
            str(viewer.get('username') or ''),
        }
        if target in candidates:
            return key, viewer
    return None, None


@router.get('/live_rooms')
def get_live_rooms(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user_optional)
):
    """
    الحصول على البثوث النشطة.
    - السماح بالوصول للبثوث العامة بدون تسجيل دخول.
    - إذا كان المستخدم مسجل دخول، يرى البثوث العامة والخاصة به.
    """
    query = db.query(LiveRoomSession).filter(LiveRoomSession.is_active.is_(True))
    
    if not current_user:
        query = query.filter(LiveRoomSession.is_public.is_(True))
    else:
        query = query.filter(
            or_(
                LiveRoomSession.is_public.is_(True),
                LiveRoomSession.host_user_id == current_user.id
            )
        )
    
    records = query.order_by(LiveRoomSession.last_activity_at.desc()).all()
    return [_serialize_record(db, record) for record in records]


@router.get('/live_room/{room_id}')
def get_live_room(
    room_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user_optional)
):
    """
    الحصول على تفاصيل البث.
    """
    record = _find_room_record(db, room_id)
    if not record or not record.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    
    if not getattr(record, 'is_public', True):
        if not current_user or current_user.id != record.host_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='This stream is private')
            
    return _serialize_record(db, record)


@router.get('/live_comments/{room_id}')
def get_live_comments(
    room_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user_optional)
):
    """
    الحصول على التعليقات في البث.
    """
    record = _find_room_record(db, room_id)
    if not record or not record.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    
    if not getattr(record, 'is_public', True):
        if not current_user or current_user.id != record.host_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='This stream is private')

    room = _hydrate_runtime_room(record)
    return [comment.__dict__ for comment in (room.comments or [])]


@router.get('/live/{room_id}/analytics')
def get_stream_analytics(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """الحصول على إحصائيات البث"""
    record = _find_room_record(db, room_id)
    if not record or not record.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    
    if not getattr(record, 'is_public', True):
        if not current_user or current_user.id != record.host_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='This stream is private')
    
    room = _hydrate_runtime_room(record)
    return {
        'stream_id': room.id,
        'viewer_count': room.viewer_count or 0,
        'peak_viewer_count': room.peak_viewer_count or 0,
        'hearts_count': room.hearts_count or 0,
        'comments_count': len(room.comments or []),
        'gifts_count': len(room.gifts or []),
    }


@router.get('/live/{room_id}/viewers')
def get_stream_viewers(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """الحصول على قائمة المشاهدين"""
    record = _find_room_record(db, room_id)
    if not record or not record.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    
    if not getattr(record, 'is_public', True):
        if not current_user or current_user.id != record.host_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='This stream is private')
    
    room = _hydrate_runtime_room(record)
    return _serialize_viewers(room)


@router.post('/live_rooms')
def create_live_room(
    title: str = Body(..., embed=True),
    is_public: bool = Body(True, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _is_livekit_configured():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail='Live streaming is not configured')

    room_id = str(uuid4())
    lk_room_name = _room_name_for(current_user.username)

    record = LiveRoomSession(
        id=room_id,
        host_user_id=current_user.id,
        host_username=current_user.username,
        title=title or f"{current_user.username}'s Room",
        livekit_room=lk_room_name,
        livekit_url=settings.LIVEKIT_URL,
        is_active=True,
        is_public=is_public,
        stream_status='active',
        created_at=_utcnow(),
        last_activity_at=_utcnow(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return _serialize_record(db, record)


@router.post('/live_room/{room_id}/token')
def get_live_token(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = _require_room(room_id, db)
    if not record.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Room is not active')

    if not _is_livekit_configured():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail='Live streaming is not configured')

    # التحقق من الصلاحيات للبثوث الخاصة
    if not record.is_public and record.host_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='This stream is private')

    grant = livekit_api.VideoGrant(
        room_join=True,
        room=record.livekit_room,
        can_publish=(record.host_user_id == current_user.id),
        can_subscribe=True,
    )
    access_token = livekit_api.AccessToken(
        settings.LIVEKIT_API_KEY,
        settings.LIVEKIT_API_SECRET,
        identity=current_user.username,
        name=current_user.username,
    )
    access_token.add_grant(grant)
    return {'token': access_token.to_jwt()}


@router.post('/live_room/{room_id}/end')
def end_live_room(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = _require_room(room_id, db)
    _require_host(record, current_user)

    record.is_active = False
    record.stream_status = 'ended'
    record.ended_at = _utcnow()
    db.commit()

    live_store.remove_room(room_id)
    return {'status': 'success'}


@router.post('/live_room/{room_id}/gift')
def send_live_gift(
    room_id: str,
    gift_id: str = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = _require_room(room_id, db)
    if not record.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Room is not active')

    room = _hydrate_runtime_room(record)
    gift = LiveGift(
        id=str(uuid4()),
        room_id=room_id,
        user_id=current_user.id,
        username=current_user.username,
        gift_id=gift_id,
        amount=10,  # Default amount
        created_at=_iso(_utcnow()),
    )
    
    if not hasattr(room, 'gifts') or room.gifts is None:
        room.gifts = []
    room.gifts.append(gift)
    
    record.hearts_count += 1
    db.commit()
    
    return {'status': 'success', 'gift': gift.__dict__}


@router.post('/live_room/{room_id}/comment')
def add_live_comment(
    room_id: str,
    content: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = _require_room(room_id, db)
    if not record.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Room is not active')

    room = _hydrate_runtime_room(record)
    comment = LiveComment(
        id=str(uuid4()),
        room_id=room_id,
        user_id=current_user.id,
        username=current_user.username,
        content=content,
        created_at=_iso(_utcnow()),
    )
    
    if not hasattr(room, 'comments') or room.comments is None:
        room.comments = []
    room.comments.append(comment)
    
    # Notify via Socket.IO
    try:
        sio.emit('live_comment', comment.__dict__, room=record.livekit_room)
    except:
        pass
        
    return {'status': 'success', 'comment': comment.__dict__}
