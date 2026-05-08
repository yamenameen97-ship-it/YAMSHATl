import re

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user, get_db
from app.core.live_store import live_store
from app.core.socket_server import sio
from app.models.user import User
from app.models.user_block import UserBlock
from app.models.user_wallet import UserWallet

try:
    from livekit import api as livekit_api
except Exception:  # pragma: no cover
    livekit_api = None

router = APIRouter()
DEFAULT_GIFT_PRICES = {
    'rose': 10,
    'star': 50,
    'crown': 150,
    'rocket': 300,
}


def _emit(event_name: str, payload: dict, room: str | None = None) -> None:
    try:
        if room:
            sio.start_background_task(sio.emit, event_name, payload, room=room)
        else:
            sio.start_background_task(sio.emit, event_name, payload)
    except Exception:
        pass


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


def _is_call_blocked(db: Session, current_user_id: int, other_user_id: int) -> bool:
    return db.query(UserBlock).filter(
        ((UserBlock.blocker_id == current_user_id) & (UserBlock.blocked_id == other_user_id))
        | ((UserBlock.blocker_id == other_user_id) & (UserBlock.blocked_id == current_user_id))
    ).first() is not None


def _wallet_for(db: Session, user: User) -> UserWallet:
    wallet = db.query(UserWallet).filter(UserWallet.user_id == user.id).first()
    if wallet is None:
        wallet = UserWallet(user_id=user.id, coin_balance=1000, total_earned=0, total_spent=0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet


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
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    return live_store.serialize_room(room)


@router.post('/create_live', status_code=status.HTTP_201_CREATED)
def create_live(payload: dict = Body(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    title = (payload.get('title') or '').strip() or f'بث {current_user.username}'
    room = live_store.create_room(
        current_user.id,
        current_user.username,
        title,
        scheduled_for=str(payload.get('scheduled_for') or '').strip() or None,
        recording_enabled=bool(payload.get('recording_enabled', False)),
        live_notifications_enabled=bool(payload.get('live_notifications_enabled', True)),
        background_streaming_enabled=bool(payload.get('background_streaming_enabled', True)),
        auto_reconnect_enabled=bool(payload.get('auto_reconnect_enabled', True)),
        adaptive_bitrate_enabled=bool(payload.get('adaptive_bitrate_enabled', True)),
        cdn_url=str(payload.get('cdn_url') or settings.CDN_BASE_URL or '').strip() or None,
    )
    token = create_livekit_token(current_user.id, current_user.username, room.id)
    wallet = _wallet_for(db, current_user)
    response = {
        **live_store.serialize_room(room),
        'token': token,
        'livekit_url': settings.LIVEKIT_URL,
        'wallet': {
            'coin_balance': int(wallet.coin_balance or 0),
            'total_earned': int(wallet.total_earned or 0),
            'total_spent': int(wallet.total_spent or 0),
        },
    }
    _emit('live_room_created', response, room='admins')
    return response


@router.post('/live_token')
def get_live_token(payload: dict = Body(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    room_id = str(payload.get('room_id') or '')
    role = (payload.get('role') or 'viewer').strip() or 'viewer'
    room = live_store.get_room(room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    token = create_livekit_token(current_user.id, current_user.username, room.id)
    wallet = _wallet_for(db, current_user)
    return {
        'room': room.id,
        'room_id': room.id,
        'role': role,
        'token': token,
        'livekit_url': settings.LIVEKIT_URL,
        'wallet': {
            'coin_balance': int(wallet.coin_balance or 0),
            'total_earned': int(wallet.total_earned or 0),
            'total_spent': int(wallet.total_spent or 0),
        },
    }


@router.post('/create_call_token')
async def create_call_token(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    receiver_username = str(payload.get('receiver') or '').strip()
    if not receiver_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='receiver is required')
    receiver = db.query(User).filter(User.username == receiver_username, User.is_active.is_(True)).first()
    if receiver is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Receiver not found')
    if receiver.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Cannot call yourself')
    if _is_call_blocked(db, current_user.id, receiver.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Call is blocked between these users')
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
    await sio.emit('incoming_call', {
        'room_id': room_name,
        'room_name': room_name,
        'caller': current_user.username,
        'receiver': receiver.username,
        'call_type': call_type,
    }, room=f'username:{receiver.username}')
    return response


@router.get('/live_comments/{room_id}')
def get_live_comments(room_id: str, current_user: User = Depends(get_current_user)):
    _ = current_user
    return live_store.get_comments(room_id)


@router.post('/live_presence')
def update_live_presence(payload: dict = Body(...), request: Request | None = None, current_user: User = Depends(get_current_user)):
    room_id = str(payload.get('room_id') or '')
    socket_id = payload.get('socket_id') or (request.headers.get('x-socket-id') if request else None)
    if not room_id or not socket_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='room_id and socket_id are required')
    active = bool(payload.get('active', True))
    is_host = bool(payload.get('is_host', False))
    try:
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
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='You are removed from this live room')
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    _emit('room_stats', {'room_id': room_id, 'viewer_count': room['viewer_count'], 'hearts_count': room['hearts_count']}, room=room_id)
    return room


@router.post('/live_reaction')
def add_live_reaction(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    room_id = str(payload.get('room_id') or '')
    reaction = str(payload.get('reaction') or 'heart').strip().lower()
    try:
        room = live_store.add_reaction(room_id, reaction)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    _emit('live_reaction', {'room_id': room_id, 'reaction': reaction, 'counts': room.get('live_reactions')}, room=room_id)
    return room


@router.post('/live_gift')
def send_live_gift(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    room_id = str(payload.get('room_id') or '')
    gift_name = str(payload.get('gift_name') or 'rose').strip().lower() or 'rose'
    room = live_store.get_room(room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    sender_wallet = _wallet_for(db, current_user)
    host = db.query(User).filter(User.id == room.host_user_id).first()
    if host is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Host not found')
    host_wallet = _wallet_for(db, host)
    coins = int(payload.get('coins') or DEFAULT_GIFT_PRICES.get(gift_name, 25))
    if coins <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid gift amount')
    if int(sender_wallet.coin_balance or 0) < coins:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='رصيدك من العملات غير كافٍ')
    sender_wallet.coin_balance = int(sender_wallet.coin_balance or 0) - coins
    sender_wallet.total_spent = int(sender_wallet.total_spent or 0) + coins
    host_wallet.coin_balance = int(host_wallet.coin_balance or 0) + coins
    host_wallet.total_earned = int(host_wallet.total_earned or 0) + coins
    db.commit()
    room_payload = live_store.send_gift(room_id, current_user.username, gift_name, coins)
    _emit('live_gift', {'room_id': room_id, 'gift_name': gift_name, 'coins': coins, 'user': current_user.username, 'room': room_payload}, room=room_id)
    return {
        'room': room_payload,
        'sender_wallet': {
            'coin_balance': int(sender_wallet.coin_balance or 0),
            'total_spent': int(sender_wallet.total_spent or 0),
        },
        'host_wallet': {
            'coin_balance': int(host_wallet.coin_balance or 0),
            'total_earned': int(host_wallet.total_earned or 0),
        },
    }


@router.post('/live_poll')
def create_live_poll(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    room_id = str(payload.get('room_id') or '')
    question = str(payload.get('question') or '').strip()
    options = [str(item).strip() for item in (payload.get('options') or []) if str(item).strip()]
    if not question or len(options) < 2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Question and at least 2 options are required')
    try:
        room = live_store.create_poll(room_id, current_user.username, question, options)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    _emit('live_poll', {'room_id': room_id, 'room': room}, room=room_id)
    return room


@router.post('/live_poll/{poll_id}/vote')
def vote_live_poll(poll_id: str, payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    room_id = str(payload.get('room_id') or '')
    option_id = str(payload.get('option_id') or '')
    try:
        room = live_store.vote_poll(room_id, poll_id, current_user.username, option_id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    _emit('live_poll', {'room_id': room_id, 'room': room}, room=room_id)
    return room


@router.post('/live_share')
def share_live_room(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    _ = current_user
    room_id = str(payload.get('room_id') or '')
    try:
        room = live_store.share_room(room_id)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    share_url = f"{settings.FRONTEND_ORIGIN or settings.BACKEND_ORIGIN or ''}/live?room={room_id}".rstrip('/')
    _emit('live_share', {'room_id': room_id, 'share_count': room.get('live_share_count')}, room=room_id)
    return {'room': room, 'share_url': share_url or f'/live?room={room_id}'}


@router.post('/live_cohost')
def add_live_cohost(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    room_id = str(payload.get('room_id') or '')
    username = str(payload.get('username') or '').strip()
    room = live_store.get_room(room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    if room.host_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only host can add co-hosts')
    updated = live_store.add_cohost(room_id, username)
    _emit('live_cohost', {'room_id': room_id, 'room': updated}, room=room_id)
    return updated


@router.post('/live_battle')
def start_live_battle(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    room_id = str(payload.get('room_id') or '')
    opponent_room_id = str(payload.get('opponent_room_id') or '')
    room = live_store.get_room(room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    if room.host_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only host can start battles')
    try:
        updated = live_store.start_battle(room_id, opponent_room_id)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Opponent room not found')
    _emit('live_battle', {'room_id': room_id, 'room': updated}, room=room_id)
    return updated


@router.post('/live_moderation')
def moderate_live_user(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    room_id = str(payload.get('room_id') or '')
    username = str(payload.get('username') or '').strip()
    action = str(payload.get('action') or '').strip().lower()
    room = live_store.get_room(room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    if room.host_user_id != current_user.id and current_user.username not in room.co_hosts:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only host or co-host can moderate viewers')
    try:
        updated = live_store.moderate_user(room_id, username, action)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    _emit('live_moderation', {'room_id': room_id, 'room': updated, 'target': username, 'action': action}, room=room_id)
    return updated


@router.post('/live_health')
def update_live_health(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    room_id = str(payload.get('room_id') or '')
    room = live_store.get_room(room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    if room.host_user_id != current_user.id and current_user.username not in room.co_hosts:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only host or co-host can update stream health')
    updated = live_store.update_health(
        room_id,
        bitrate_kbps=int(payload.get('bitrate_kbps') or 0),
        packet_loss=float(payload.get('packet_loss') or 0),
        rtt_ms=int(payload.get('rtt_ms') or 0),
        reconnecting=bool(payload.get('reconnecting', False)),
    )
    _emit('live_health', {'room_id': room_id, 'stream_health': updated.get('stream_health')}, room=room_id)
    return updated


@router.post('/live_recording')
def toggle_live_recording(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    room_id = str(payload.get('room_id') or '')
    enabled = bool(payload.get('enabled', True))
    room = live_store.get_room(room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    if room.host_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only host can control recording')
    updated = live_store.toggle_recording(room_id, enabled, str(payload.get('recording_url') or '').strip() or None)
    _emit('live_recording', {'room_id': room_id, 'recording': updated.get('recording')}, room=room_id)
    return updated


@router.get('/live_dashboard')
def get_live_dashboard(room_id: str = Query(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    room = live_store.get_room(room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    if room.host_user_id != current_user.id and current_user.username not in room.co_hosts:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only host or co-host can view dashboard')
    wallet = _wallet_for(db, current_user)
    dashboard = live_store.dashboard(room_id)
    dashboard['wallet'] = {
        'coin_balance': int(wallet.coin_balance or 0),
        'total_earned': int(wallet.total_earned or 0),
        'total_spent': int(wallet.total_spent or 0),
    }
    return dashboard


@router.get('/live_schedule')
def get_live_schedule(current_user: User = Depends(get_current_user)):
    return [
        room for room in live_store.list_rooms()
        if room.get('username') == current_user.username and room.get('scheduling', {}).get('scheduled_for')
    ]


@router.post('/end_live/{room_id}')
def end_live(room_id: str, current_user: User = Depends(get_current_user)):
    room = live_store.get_room(room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    if room.host_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only host can end live room')
    updated = live_store.end_room(room_id)
    _emit('admin:live_updated', {'room': updated}, room='admins')
    _emit('live_ended', {'room_id': room_id, 'room': updated}, room=room_id)
    return updated
