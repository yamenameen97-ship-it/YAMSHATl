import re

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user, get_db
from app.core.live_store import live_store
from app.core.socket_server import sio
from app.models.user import User

try:
    from livekit import api as livekit_api
except Exception:  # pragma: no cover
    livekit_api = None

router = APIRouter()


def _sanitize_room_segment(value: str) -> str:
    cleaned = re.sub(r'[^a-zA-Z0-9_-]+', '-', value.strip().lower())
    return cleaned.strip('-') or 'user'


def _build_private_call_room(first_username: str, second_username: str, call_type: str) -> str:
    users = sorted([
        _sanitize_room_segment(first_username),
        _sanitize_room_segment(second_username),
    ])
    mode = 'video' if str(call_type).lower() == 'video' else 'audio'
    return f"call-{users[0]}-{users[1]}-{mode}"


def create_livekit_token(user_id: int, username: str, room_name: str) -> str:
    if not settings.LIVEKIT_API_KEY or not settings.LIVEKIT_API_SECRET or livekit_api is None:
        return ''

    token = livekit_api.AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
    token = token.with_identity(str(user_id)).with_name(username)
    token = token.with_grants(livekit_api.VideoGrants(room_join=True, room=room_name))
    return token.to_jwt()


@router.get('/live_rooms')
def get_live_rooms(current_user: User = Depends(get_current_user)):
    _ = current_user
    return live_store.list_rooms()


@router.get('/live_room/{room_id}')
def get_live_room(room_id: str, current_user: User = Depends(get_current_user)):
    _ = current_user
    room = live_store.get_room(room_id)
    if room is None or not room.active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    return live_store.serialize_room(room)


@router.post('/create_live', status_code=status.HTTP_201_CREATED)
def create_live(payload: dict, current_user: User = Depends(get_current_user)):
    title = (payload.get('title') or '').strip() or f'بث {current_user.username}'
    room = live_store.create_room(current_user.id, current_user.username, title)
    token = create_livekit_token(current_user.id, current_user.username, room.id)
    return {
        **live_store.serialize_room(room),
        'token': token,
        'livekit_url': settings.LIVEKIT_URL,
    }


@router.post('/live_token')
def get_live_token(payload: dict, current_user: User = Depends(get_current_user)):
    room_id = str(payload.get('room_id') or '')
    role = (payload.get('role') or 'viewer').strip() or 'viewer'
    room = live_store.get_room(room_id)
    if room is None or not room.active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')

    token = create_livekit_token(current_user.id, current_user.username, room.id)
    return {
        'room': room.id,
        'room_id': room.id,
        'role': role,
        'token': token,
        'livekit_url': settings.LIVEKIT_URL,
    }


@router.post('/create_call_token')
async def create_call_token(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    receiver_username = str(payload.get('receiver') or '').strip()
    if not receiver_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='receiver is required')

    receiver = db.query(User).filter(User.username == receiver_username, User.is_active.is_(True)).first()
    if receiver is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Receiver not found')

    if receiver.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Cannot call yourself')

    call_type = 'video' if str(payload.get('call_type') or '').strip().lower() == 'video' else 'audio'
    requested_room_id = str(payload.get('room_id') or '').strip()
    room_name = requested_room_id or _build_private_call_room(current_user.username, receiver.username, call_type)

    token = create_livekit_token(current_user.id, current_user.username, room_name)
    response = {
        'ok': True,
        'message': 'Call session prepared',
        'room_id': room_name,
        'room_name': room_name,
        'receiver': receiver.username,
        'call_type': call_type,
        'token': token,
        'livekit_url': settings.LIVEKIT_URL,
    }

    await sio.emit(
        'incoming_call',
        {
            'room_id': room_name,
            'room_name': room_name,
            'caller': current_user.username,
            'receiver': receiver.username,
            'call_type': call_type,
        },
        room=f'username:{receiver.username}',
    )
    return response


@router.get('/live_comments/{room_id}')
def get_live_comments(room_id: str, current_user: User = Depends(get_current_user)):
    _ = current_user
    return live_store.get_comments(room_id)


@router.post('/live_presence')
def update_live_presence(payload: dict, request: Request, current_user: User = Depends(get_current_user)):
    room_id = str(payload.get('room_id') or '')
    socket_id = payload.get('socket_id') or request.headers.get('x-socket-id')
    if not room_id or not socket_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='room_id and socket_id are required')

    active = bool(payload.get('active', True))
    is_host = bool(payload.get('is_host', False))
    if active:
        room = live_store.activate_presence(
            room_id=room_id,
            sid=socket_id,
            username=current_user.username,
            is_host=is_host,
            platform=str(payload.get('platform') or 'web'),
            device_type=str(payload.get('device_type') or 'browser'),
        )
    else:
        room = live_store.deactivate_presence(room_id=room_id, sid=socket_id)

    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    return room


@router.post('/end_live/{room_id}')
def end_live(room_id: str, current_user: User = Depends(get_current_user)):
    room = live_store.get_room(room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    if room.host_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only host can end live room')
    return live_store.end_room(room_id)
