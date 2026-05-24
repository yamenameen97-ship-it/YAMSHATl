import json
import re
from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user, get_db
from app.core.live_store import LiveComment, LiveGift, live_store
from app.core.socket_server import sio
from app.models.live_session import LiveRoomSession
from app.models.user import User

try:
    from livekit import api as livekit_api
except Exception:  # pragma: no cover
    livekit_api = None

router = APIRouter()


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

    if runtime_room:
        runtime_room.title = record.title
        runtime_room.livekit_room = record.livekit_room
        runtime_room.livekit_url = record.livekit_url or settings.LIVEKIT_URL or ''
        runtime_room.stream_status = record.stream_status
        runtime_room.active = bool(record.is_active)
        runtime_room.viewer_count = int(record.viewer_count or runtime_room.viewer_count)
        runtime_room.peak_viewer_count = max(int(record.peak_viewer_count or 0), int(runtime_room.peak_viewer_count or 0))
        runtime_room.hearts_count = max(int(record.hearts_count or 0), int(runtime_room.hearts_count or 0))
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

    if snapshot:
        runtime_room.comments = [LiveComment(**comment) for comment in snapshot.get('comments', []) if isinstance(comment, dict)]
        runtime_room.gifts = [LiveGift(**gift) for gift in snapshot.get('gifts', []) if isinstance(gift, dict)]
        runtime_room.co_hosts = list(snapshot.get('co_hosts') or runtime_room.co_hosts)
        runtime_room.economy = {**runtime_room.economy, **(snapshot.get('economy') or {})}
        runtime_room.recovery_data = {**runtime_room.recovery_data, **(snapshot.get('recovery_data') or {})}
        runtime_room.multi_host_config = {**runtime_room.multi_host_config, **(snapshot.get('multi_host_config') or {})}
        runtime_room.stream_health = {**runtime_room.stream_health, **(snapshot.get('stream_health') or {})}
        runtime_room.moderation_state = {**runtime_room.moderation_state, **(snapshot.get('moderation_state') or {})}
        analytics = snapshot.get('stream_analytics') or {}
        runtime_room.stream_analytics = {
            **runtime_room.stream_analytics,
            **analytics,
            'unique_viewers': set(analytics.get('unique_viewers') or []),
        }
        viewer_sync = snapshot.get('viewer_sync') or {}
        if isinstance(viewer_sync, dict):
            runtime_room.viewer_sync = viewer_sync
        runtime_room.muted_users = set(snapshot.get('muted_users') or list(runtime_room.muted_users))
        runtime_room.banned_users = set(snapshot.get('banned_users') or list(runtime_room.banned_users))
        runtime_room.kicked_users = set(snapshot.get('kicked_users') or list(runtime_room.kicked_users))
        runtime_room.pinned_comment_id = snapshot.get('pinned_comment_id') or runtime_room.pinned_comment_id
        if runtime_room.co_hosts:
            runtime_room.multi_host_config['current_hosts'] = list(runtime_room.co_hosts)

    return runtime_room


def _sync_record_from_runtime(db: Session, record: LiveRoomSession, runtime_room) -> None:
    if not runtime_room:
        return
    record.viewer_count = int(runtime_room.viewer_count or 0)
    record.peak_viewer_count = max(int(record.peak_viewer_count or 0), int(runtime_room.peak_viewer_count or 0))
    record.hearts_count = int(runtime_room.hearts_count or 0)
    record.recording_status = runtime_room.recording_status or record.recording_status
    record.recording_url = runtime_room.recording_url or record.recording_url
    record.stream_status = getattr(runtime_room, 'stream_status', record.stream_status) or record.stream_status
    record.last_activity_at = _utcnow()
    record.extra_json = json.dumps({
        'comments': [comment.__dict__ for comment in (runtime_room.comments or [])],
        'gifts': [gift.__dict__ for gift in (runtime_room.gifts or [])],
        'co_hosts': list(runtime_room.co_hosts or []),
        'economy': runtime_room.economy or {},
        'recovery_data': runtime_room.recovery_data or {},
        'multi_host_config': runtime_room.multi_host_config or {},
        'stream_health': runtime_room.stream_health or {},
        'moderation_state': runtime_room.moderation_state or {},
        'viewer_sync': runtime_room.viewer_sync or {},
        'muted_users': sorted(runtime_room.muted_users or []),
        'banned_users': sorted(runtime_room.banned_users or []),
        'kicked_users': sorted(runtime_room.kicked_users or []),
        'pinned_comment_id': runtime_room.pinned_comment_id,
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
    payload.update({
        'id': record.id,
        'host': record.host_username,
        'username': record.host_username,
        'title': record.title,
        'created_at': _iso(record.created_at),
        'last_activity_at': _iso(record.last_activity_at),
        'active': bool(record.is_active),
        'livekit_room': record.livekit_room,
        'livekit_url': record.livekit_url or settings.LIVEKIT_URL or '',
        'stream_status': record.stream_status,
        'viewer_count': int(record.viewer_count or payload.get('viewer_count') or 0),
        'peak_viewer_count': int(record.peak_viewer_count or payload.get('peak_viewer_count') or 0),
        'hearts_count': int(record.hearts_count or payload.get('hearts_count') or 0),
        'recording': {
            'status': record.recording_status or payload.get('recording', {}).get('status') or 'idle',
            'url': record.recording_url or payload.get('recording', {}).get('url'),
        },
        'livekit_configured': _is_livekit_configured(),
    })
    db.commit()
    return payload


@router.get('/live_rooms')
def get_live_rooms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ = current_user
    records = db.query(LiveRoomSession).filter(LiveRoomSession.is_active.is_(True)).order_by(LiveRoomSession.last_activity_at.desc()).all()
    return [_serialize_record(db, record) for record in records]


@router.get('/live_room/{room_id}')
def get_live_room(room_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ = current_user
    record = _find_room_record(db, room_id)
    if not record or not record.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    return _serialize_record(db, record)


@router.get('/live_comments/{room_id}')
def get_live_comments(room_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ = current_user
    record = _find_room_record(db, room_id)
    if not record or not record.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    room = _hydrate_runtime_room(record)
    return [comment.__dict__ for comment in room.comments]


@router.post('/create_live', status_code=status.HTTP_201_CREATED)
def create_live(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    title = str(payload.get('title') or '').strip() or f'بث مباشر مع {current_user.username}'

    existing = db.query(LiveRoomSession).filter(
        LiveRoomSession.host_user_id == current_user.id,
        LiveRoomSession.is_active.is_(True),
    ).order_by(LiveRoomSession.created_at.desc()).first()

    if existing:
        existing.title = title
        existing.livekit_url = settings.LIVEKIT_URL or existing.livekit_url
        existing.stream_status = 'ready' if _is_livekit_configured() else 'setup_required'
        existing.last_activity_at = _utcnow()
        room = _hydrate_runtime_room(existing)
        room.title = existing.title
        room.livekit_url = existing.livekit_url or settings.LIVEKIT_URL or ''
        room.stream_status = existing.stream_status
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return _serialize_record(db, existing)

    room_id = uuid4().hex[:12]
    livekit_room = _room_name_for(current_user.username)
    livekit_url = settings.LIVEKIT_URL or ''
    stream_status = 'ready' if _is_livekit_configured() else 'setup_required'

    live_store.create_room(
        current_user.id,
        current_user.username,
        title,
        room_id=room_id,
        livekit_room=livekit_room,
        livekit_url=livekit_url,
        stream_status=stream_status,
    )

    record = LiveRoomSession(
        id=room_id,
        host_user_id=current_user.id,
        host_username=current_user.username,
        title=title,
        livekit_room=livekit_room,
        livekit_url=livekit_url,
        stream_status=stream_status,
        is_active=True,
        last_activity_at=_utcnow(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _serialize_record(db, record)


@router.post('/live/{room_id}/token')
def get_live_token(room_id: str, payload: dict = Body(default={}), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = _find_room_record(db, room_id)
    if not record or not record.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    if not _is_livekit_configured():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail='LiveKit keys are not configured on the backend')

    requested_role = str(payload.get('role') or '').strip().lower()
    is_host = record.host_user_id == current_user.id
    role = 'host' if is_host else 'viewer'
    if requested_role == 'host' and not is_host:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only the host can publish this live stream')

    try:
        token = (
            livekit_api.AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
            .with_identity(f'{current_user.username}-{role}-{room_id}')
            .with_name(current_user.username)
            .with_metadata(json.dumps({'room_id': room_id, 'role': role, 'username': current_user.username}, ensure_ascii=False))
            .with_attributes({'room_id': room_id, 'role': role, 'username': current_user.username})
            .with_ttl(timedelta(hours=6))
            .with_grants(
                livekit_api.VideoGrants(
                    room_join=True,
                    room=record.livekit_room,
                    room_create=is_host,
                    can_publish=is_host,
                    can_subscribe=True,
                    can_publish_data=True,
                )
            )
            .to_jwt()
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f'Failed to generate live token: {exc}') from exc

    room = _hydrate_runtime_room(record)
    room.stream_status = 'live' if is_host else (room.stream_status or 'live')
    room.last_activity_at = _iso(_utcnow())
    record.stream_status = room.stream_status
    record.livekit_url = settings.LIVEKIT_URL
    record.last_activity_at = _utcnow()
    _sync_record_from_runtime(db, record, room)
    db.commit()

    return {
        'room_id': record.id,
        'role': role,
        'livekit_room': record.livekit_room,
        'livekit_url': settings.LIVEKIT_URL,
        'token': token,
        'configured': True,
    }


@router.post('/end_live/{room_id}')
def end_live(room_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = _find_room_record(db, room_id)
    if not record or record.host_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only host can end live room')
    room = _hydrate_runtime_room(record)
    room.active = False
    room.stream_status = 'ended'
    room.last_activity_at = _iso(_utcnow())

    record.is_active = False
    record.stream_status = 'ended'
    record.ended_at = _utcnow()
    record.last_activity_at = _utcnow()
    _sync_record_from_runtime(db, record, room)
    db.commit()
    return {'status': 'ended', 'room_id': room_id}


@router.post('/live/{room_id}/recording/{action}')
def manage_recording(room_id: str, action: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = _find_room_record(db, room_id)
    if not record or record.host_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only host can manage recording')
    if action not in {'start', 'stop'}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid action')
    room = _hydrate_runtime_room(record)
    live_store.orchestrate_recording(room_id, action)
    record.recording_status = room.recording_status
    record.recording_url = room.recording_url
    record.last_activity_at = _utcnow()
    _sync_record_from_runtime(db, record, room)
    db.commit()
    return {'status': 'success', 'recording_status': room.recording_status, 'recording_url': room.recording_url}


@router.get('/live/{room_id}/analytics')
def get_stream_analytics(room_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = _find_room_record(db, room_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    room = _hydrate_runtime_room(record)
    if room.username != current_user.username and current_user.username not in room.co_hosts:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Access denied')
    return room.stream_analytics


@router.get('/live/{room_id}/health')
def get_live_health(room_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ = current_user
    record = _find_room_record(db, room_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    room = _hydrate_runtime_room(record)
    return {'health': room.stream_health, 'recovery': room.recovery_data, 'viewer_sync': room.viewer_sync}


@router.post('/live/{room_id}/health')
def update_live_health(room_id: str, payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = _find_room_record(db, room_id)
    if not record or record.host_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only host can update health metrics')
    room = _hydrate_runtime_room(record)
    health = live_store.update_health(room_id, payload) or room.stream_health
    _sync_record_from_runtime(db, record, live_store.get_room(room_id))
    db.commit()
    return {'status': 'success', 'health': health}


@router.post('/live/{room_id}/sync')
def sync_live_viewer(room_id: str, payload: dict = Body(default={}), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = _find_room_record(db, room_id)
    if not record or not record.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    room = _hydrate_runtime_room(record)
    result = live_store.sync_viewer(
        room_id,
        current_user.username,
        str(payload.get('sid') or current_user.username),
        payload,
    )
    room.last_activity_at = _iso(_utcnow())
    _sync_record_from_runtime(db, record, live_store.get_room(room_id))
    db.commit()
    return {'status': 'synced', **(result or {})}


@router.post('/live/{room_id}/gift')
def send_gift(room_id: str, payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = _find_room_record(db, room_id)
    if not record or not record.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    gift_name = str(payload.get('gift_name') or payload.get('name') or '').strip() or 'هدية'
    coins = int(payload.get('coins') or payload.get('price') or 0)
    _hydrate_runtime_room(record)
    result = live_store.send_gift(room_id, current_user.username, gift_name, coins)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    _sync_record_from_runtime(db, record, live_store.get_room(room_id))
    db.commit()
    return result


@router.post('/live/{room_id}/multi-host')
def manage_multi_host(room_id: str, payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = _find_room_record(db, room_id)
    action = payload.get('action')
    target = payload.get('username')
    if not record or record.host_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only host can manage co-hosts')
    _hydrate_runtime_room(record)
    success = live_store.manage_multi_host(room_id, action, target)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Failed to update multi-host config')
    record.last_activity_at = _utcnow()
    room = live_store.get_room(room_id)
    _sync_record_from_runtime(db, record, room)
    db.commit()
    return {'status': 'success', 'multi_host': room.multi_host_config}


@router.post('/live/{room_id}/recovery')
def trigger_recovery(room_id: str, payload: dict = Body(default={}), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = _find_room_record(db, room_id)
    if not record or record.host_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied')
    room = _hydrate_runtime_room(record)
    room.recovery_data['reconnect_attempts'] += 1
    room.recovery_data['last_stable_timestamp'] = _iso(_utcnow())
    room.recovery_data['last_recovery_reason'] = str(payload.get('reason') or 'manual_recovery')
    record.last_activity_at = _utcnow()
    _sync_record_from_runtime(db, record, room)
    db.commit()
    return {'status': 'recovering', 'recovery_data': room.recovery_data}


@router.post('/live/{room_id}/moderate')
async def moderate_live_room(room_id: str, payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = _find_room_record(db, room_id)
    if not record or not record.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    room = _hydrate_runtime_room(record)
    if record.host_user_id != current_user.id and current_user.username not in room.co_hosts:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only host or co-host can moderate this stream')
    action = str(payload.get('action') or '').strip()
    target_username = str(payload.get('username') or '').strip() or None
    comment_id = str(payload.get('comment_id') or '').strip() or None
    result = live_store.moderate(room_id, action, target_username=target_username, comment_id=comment_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid moderation action')
    _sync_record_from_runtime(db, record, live_store.get_room(room_id))
    db.commit()
    await sio.emit('live_moderation', {'room_id': room_id, **result}, room=room_id)
    return {'status': 'success', 'moderation': result}


@router.post('/live/{room_id}/comment')
async def add_comment(room_id: str, payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = _find_room_record(db, room_id)
    if not record or not record.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    text = str(payload.get('text') or '').strip()
    if not text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Comment text is required')
    room = _hydrate_runtime_room(record)
    comment = live_store.add_comment(room_id, current_user.username, text)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    record.last_activity_at = _utcnow()
    _sync_record_from_runtime(db, record, live_store.get_room(room_id))
    db.commit()
    if comment.moderation_score > 0.8:
        return {'status': 'blocked', 'reason': 'AI Moderation flagged this content', 'comment': comment.__dict__}
    await sio.emit('new_comment', comment.__dict__, room=room_id)
    return {'status': 'success', 'comment': comment.__dict__}
