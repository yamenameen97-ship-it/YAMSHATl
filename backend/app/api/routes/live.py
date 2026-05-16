from datetime import datetime

from fastapi import APIRouter, Body, Depends, HTTPException, status

from app.core.dependencies import get_current_user
from app.core.live_store import live_store
from app.models.user import User

router = APIRouter()


def _utcnow() -> str:
    return datetime.utcnow().isoformat()


@router.get('/live_rooms')
def get_live_rooms(current_user: User = Depends(get_current_user)):
    _ = current_user
    return live_store.list_rooms()


@router.get('/live_room/{room_id}')
def get_live_room(room_id: str, current_user: User = Depends(get_current_user)):
    _ = current_user
    room = live_store.get_room(room_id)
    if not room or not room.active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    return live_store.serialize_room(room)


@router.get('/live_comments/{room_id}')
def get_live_comments(room_id: str, current_user: User = Depends(get_current_user)):
    _ = current_user
    room = live_store.get_room(room_id)
    if not room or not room.active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    return [comment.__dict__ for comment in room.comments]


@router.post('/create_live', status_code=status.HTTP_201_CREATED)
def create_live(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    title = str(payload.get('title') or '').strip()
    room = live_store.create_room(current_user.id, current_user.username, title)
    return live_store.serialize_room(room)


@router.post('/end_live/{room_id}')
def end_live(room_id: str, current_user: User = Depends(get_current_user)):
    room = live_store.get_room(room_id)
    if not room or room.username != current_user.username:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only host can end live room')
    room.active = False
    room.last_activity_at = _utcnow()
    return {'status': 'ended', 'room_id': room_id}


@router.post('/live/{room_id}/recording/{action}')
def manage_recording(room_id: str, action: str, current_user: User = Depends(get_current_user)):
    room = live_store.get_room(room_id)
    if not room or room.username != current_user.username:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only host can manage recording')
    if action not in {'start', 'stop'}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid action')
    live_store.orchestrate_recording(room_id, action)
    return {'status': 'success', 'recording_status': room.recording_status, 'recording_url': room.recording_url}


@router.get('/live/{room_id}/analytics')
def get_stream_analytics(room_id: str, current_user: User = Depends(get_current_user)):
    room = live_store.get_room(room_id)
    if not room or (room.username != current_user.username and current_user.username not in room.co_hosts):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Access denied')
    return room.stream_analytics


@router.post('/live/{room_id}/gift')
def send_gift(room_id: str, payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    gift_name = str(payload.get('gift_name') or payload.get('name') or '').strip() or 'هدية'
    coins = int(payload.get('coins') or payload.get('price') or 0)
    result = live_store.send_gift(room_id, current_user.username, gift_name, coins)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    return result


@router.post('/live/{room_id}/multi-host')
def manage_multi_host(room_id: str, payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    action = payload.get('action')
    target = payload.get('username')
    room = live_store.get_room(room_id)
    if not room or room.username != current_user.username:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only host can manage co-hosts')
    success = live_store.manage_multi_host(room_id, action, target)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Failed to update multi-host config')
    return {'status': 'success', 'multi_host': room.multi_host_config}


@router.post('/live/{room_id}/recovery')
def trigger_recovery(room_id: str, current_user: User = Depends(get_current_user)):
    room = live_store.get_room(room_id)
    if not room or room.username != current_user.username:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied')
    room.recovery_data['reconnect_attempts'] += 1
    room.recovery_data['last_stable_timestamp'] = _utcnow()
    return {'status': 'recovering', 'recovery_data': room.recovery_data}


@router.post('/live/{room_id}/comment')
def add_comment(room_id: str, payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    text = str(payload.get('text') or '').strip()
    comment = live_store.add_comment(room_id, current_user.username, text)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')
    if comment.moderation_score > 0.8:
        return {'status': 'blocked', 'reason': 'AI Moderation flagged this content'}
    return {'status': 'success', 'comment': comment.__dict__}
