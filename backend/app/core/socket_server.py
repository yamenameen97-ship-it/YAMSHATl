from __future__ import annotations

from datetime import datetime
import hashlib
import re
import time
from urllib.parse import urlparse

import bleach
import socketio
from sqlalchemy import func

try:
    import redis
except Exception:  # pragma: no cover - optional dependency safety
    redis = None

from app.core.admin_access import effective_role, is_primary_admin_user
from app.core.config import settings
from app.core.content_sanitizer import sanitize_text
from app.core.live_store import live_store
from app.core.rate_limit import (
    allow_socket_message,
    block_socket_subject,
    is_socket_subject_blocked,
    register_socket_nonce,
    score_socket_spam,
)
from app.core.request_security import get_client_ip
from app.core.security import ACCESS_TOKEN_TYPE, TokenError, decode_token
from app.db.session import SessionLocal
from app.models.comment import Comment
from app.models.follow import Follow
from app.models.like import Like
from app.models.message import Message
from app.models.notification import Notification
from app.models.post import Post
from app.models.user import User
from app.services.chat_realtime import mark_messages_delivered, serialize_message

# Distributed WebSocket Scaling with Redis Pub/Sub
mgr = None
if settings.REDIS_URL and redis is not None:
    try:
        probe = redis.Redis.from_url(
            settings.REDIS_URL,
            socket_connect_timeout=1,
            socket_timeout=1,
            health_check_interval=15,
        )
        probe.ping()
        mgr = socketio.AsyncRedisManager(settings.REDIS_URL)
    except Exception:
        mgr = None

sio = socketio.AsyncServer(
    async_mode='asgi', 
    cors_allowed_origins='*',
    client_manager=mgr
)
sio_app = socketio.ASGIApp(sio)


def _normalize_origin(value: str | None) -> str:
    raw = str(value or '').strip().rstrip('/')
    if not raw:
        return ''
    parsed = urlparse(raw)
    if parsed.scheme and parsed.netloc:
        return f'{parsed.scheme}://{parsed.netloc}'.rstrip('/')
    return raw


def _origin_from_environ(environ: dict | None) -> str:
    source = environ or {}
    origin = _normalize_origin(source.get('HTTP_ORIGIN') or source.get('ORIGIN'))
    if origin:
        return origin
    referer = str(source.get('HTTP_REFERER') or '').strip()
    if not referer:
        return ''
    parsed = urlparse(referer)
    if parsed.scheme and parsed.netloc:
        return f'{parsed.scheme}://{parsed.netloc}'.rstrip('/')
    return ''


def _origin_matches_regex(origin: str) -> bool:
    regex = str(settings.cors_origin_regex or '').strip()
    if not origin or not regex:
        return False
    try:
        return re.match(regex, origin) is not None
    except re.error:
        return False


def _socket_origin_allowed(origin: str | None) -> bool:
    normalized = _normalize_origin(origin)
    if not normalized:
        return True
    if '*' in settings.cors_origins:
        return True

    allowed_origins = {
        _normalize_origin(candidate)
        for candidate in settings.cors_origins
        if candidate and candidate != '*'
    }
    if normalized in allowed_origins:
        return True
    return _origin_matches_regex(normalized)


def _room_has_members(room_name: str, namespace: str = '/') -> bool:
    namespace_rooms = getattr(getattr(sio, 'manager', None), 'rooms', {}).get(namespace, {})
    room = namespace_rooms.get(room_name)
    return bool(room)


def is_user_online(*, username: str | None = None, user_id: int | None = None) -> bool:
    if user_id is not None and _room_has_members(f'user:{user_id}'):
        return True
    if username and _room_has_members(f'username:{username}'):
        return True
    return False


async def _get_session_user(sid: str) -> dict | None:
    session = await sio.get_session(sid)
    if session and session.get('user_id') and session.get('username'):
        return session
    return None


async def _save_user_session(
    sid: str,
    user: User,
    live_room_id: str | None = None,
    access_exp: int | float | None = None,
    client_ip: str | None = None,
    token_jti: str | None = None,
) -> dict:
    session = {
        'user_id': user.id,
        'username': user.username,
        'role': effective_role(user),
        'live_room_id': live_room_id,
        'access_exp': float(access_exp) if access_exp else None,
        'client_ip': str(client_ip or '').strip()[:120] or None,
        'token_jti': str(token_jti or '').strip()[:120] or None,
        'auth_checked_at': time.time(),
    }
    await sio.save_session(sid, session)
    await sio.enter_room(sid, f'user:{user.id}')
    await sio.enter_room(sid, f'username:{user.username}')
    if is_primary_admin_user(user):
        await sio.enter_room(sid, 'admins')
    return session


def _session_access_expired(session: dict | None) -> bool:
    if not session:
        return False
    access_exp = session.get('access_exp')
    if not access_exp:
        return False
    try:
        return float(access_exp) <= datetime.utcnow().timestamp()
    except (TypeError, ValueError):
        return False


async def _emit_auth_expired(sid: str, detail: str = 'Session expired') -> None:
    await sio.emit('auth_expired', {'detail': detail}, room=sid)
    await sio.disconnect(sid)


def _event_signature(event_name: str, nonce: str, timestamp: int | str, token_jti: str) -> str:
    value = f'{event_name}|{nonce}|{timestamp}|{token_jti}'
    hashed = 0x811C9DC5
    for char in value:
        hashed ^= ord(char)
        hashed = (hashed * 0x01000193) & 0xFFFFFFFF
    return f'{hashed:08x}'


def _event_subjects(session: dict | None, user: User, room_id: str | None = None) -> list[str]:
    subjects = [f'user:{user.id}', f'account:{user.username}']
    client_ip = str((session or {}).get('client_ip') or '').strip()
    if client_ip:
        subjects.append(f'ip:{client_ip}')
    if room_id:
        subjects.append(f'room:{room_id}')
    return subjects


async def _enforce_realtime_security(sid: str, event_name: str, data: dict | None, session: dict | None, user: User, room_id: str | None = None) -> bool:
    subjects = _event_subjects(session, user, room_id=room_id)
    if await is_socket_subject_blocked(*subjects):
        await sio.emit('realtime_blocked', {'detail': 'Realtime access temporarily blocked'}, room=sid)
        return False

    token_jti = str((session or {}).get('token_jti') or '').strip()
    timestamp = int((data or {}).get('_ts') or 0)
    nonce = str((data or {}).get('_nonce') or '').strip()[:128]
    signature = str((data or {}).get('_sig') or '').strip()[:64]
    if token_jti:
        now_ms = int(time.time() * 1000)
        replay_window_ms = max(int(settings.SOCKET_REPLAY_WINDOW_SECONDS), 1) * 1000
        if not timestamp or abs(now_ms - timestamp) > replay_window_ms:
            await block_socket_subject(*subjects)
            await sio.emit('chat_error', {'detail': 'Invalid realtime timestamp'}, room=sid)
            return False
        if not nonce or not await register_socket_nonce(f'{user.id}:{event_name}', nonce, settings.SOCKET_NONCE_TTL_SECONDS):
            await block_socket_subject(*subjects)
            await sio.emit('chat_error', {'detail': 'Replay attack detected'}, room=sid)
            return False
        if signature != _event_signature(event_name, nonce, timestamp, token_jti):
            await block_socket_subject(*subjects)
            await sio.emit('chat_error', {'detail': 'Invalid realtime signature'}, room=sid)
            return False
    return True


async def _enforce_message_spam_policy(sid: str, session: dict | None, user: User, scope: str, content: str, room_id: str | None = None) -> bool:
    subjects = _event_subjects(session, user, room_id=room_id)
    result = await score_socket_spam(f'{scope}:{user.id}:{room_id or "global"}', content)
    if result.get('blocked'):
        block_socket_subject(*subjects)
        await sio.emit('chat_error', {'detail': 'Message blocked as spam', 'reasons': result.get('reasons') or []}, room=sid)
        return False
    return True


async def _resolve_authenticated_user(sid: str, token: str | None = None, *, client_ip: str | None = None) -> tuple[dict | None, User | None]:
    session = await sio.get_session(sid)
    if session and session.get('user_id'):
        if _session_access_expired(session):
            await _emit_auth_expired(sid)
            return None, None
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == int(session['user_id']), User.is_active.is_(True)).first()
            return session, user
        finally:
            db.close()

    if not token:
        return None, None

    try:
        payload = decode_token(token, expected_type=ACCESS_TOKEN_TYPE)
    except TokenError:
        return None, None

    user_id = payload.get('user_id')
    if not user_id:
        return None, None

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == int(user_id), User.is_active.is_(True)).first()
        if user is None:
            return None, None
        session = await _save_user_session(
            sid,
            user,
            access_exp=payload.get('exp'),
            client_ip=client_ip,
            token_jti=payload.get('jti'),
        )
        return session, user
    finally:
        db.close()


async def _emit_pending_delivery_receipts(user: User, peer: str | None = None) -> None:
    db = SessionLocal()
    try:
        peer_user_id = None
        if peer:
            peer_user = db.query(User).filter(User.username == str(peer).strip(), User.is_active.is_(True)).first()
            peer_user_id = peer_user.id if peer_user else None
        receipts = mark_messages_delivered(db, user, peer_user_id=peer_user_id)
    finally:
        db.close()

    for receipt in receipts:
        await sio.emit('messages_delivered', receipt, room=f'username:{receipt["sender"]}')


@sio.event
async def connect(sid, environ, auth):
    if not _socket_origin_allowed(_origin_from_environ(environ)):
        return False

    token = (auth or {}).get('token') if isinstance(auth, dict) else None
    if token:
        client_ip = get_client_ip(environ or {})
        _, user = await _resolve_authenticated_user(sid, token, client_ip=client_ip)
        if user is None:
            return False
        await _emit_pending_delivery_receipts(user)
        await sio.emit('presence_update', {'user': user.username, 'is_online': True, 'last_seen': user.last_login_at.isoformat() if user.last_login_at else None})
    return True


@sio.event
async def disconnect(sid):
    session = await sio.get_session(sid)
    room_id = session.get('live_room_id') if session else None
    username = session.get('username') if session else None
    user_id = session.get('user_id') if session else None

    if room_id:
        room = live_store.deactivate_presence(room_id, sid)
        if room:
            await sio.emit('room_stats', {'room_id': room_id, 'viewer_count': room['viewer_count'], 'hearts_count': room['hearts_count']}, room=room_id)

    if user_id:
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == int(user_id)).first()
            if user is not None:
                user.last_login_at = datetime.utcnow()
                db.commit()
                last_seen = user.last_login_at.isoformat()
            else:
                last_seen = datetime.utcnow().isoformat()
        finally:
            db.close()
        if username:
            await sio.emit('presence_update', {'user': username, 'is_online': False, 'last_seen': last_seen})


@sio.on('register_user')
async def register_user_event(sid, data):
    token = (data or {}).get('token')
    session, user = await _resolve_authenticated_user(sid, token, client_ip=get_client_ip(sio.get_environ(sid) or {}))
    if user is None:
        username = (data or {}).get('user')
        if username:
            await sio.save_session(sid, {'username': username, 'user_id': None, 'role': 'guest', 'live_room_id': None})
            await sio.enter_room(sid, f'username:{username}')
        return
    await _save_user_session(
        sid,
        user,
        live_room_id=(session or {}).get('live_room_id'),
        access_exp=(session or {}).get('access_exp'),
        client_ip=(session or {}).get('client_ip'),
        token_jti=(session or {}).get('token_jti'),
    )
    await _emit_pending_delivery_receipts(user)
    await sio.emit('presence_update', {'user': user.username, 'is_online': True, 'last_seen': user.last_login_at.isoformat() if user.last_login_at else None})


@sio.on('join_live')
async def join_live_event(sid, data):
    token = (data or {}).get('token')
    session, user = await _resolve_authenticated_user(sid, token, client_ip=get_client_ip(sio.get_environ(sid) or {}))
    room_id = str((data or {}).get('room_id') or '')
    if user is None or not room_id:
        return
    if not await _enforce_realtime_security(sid, 'join_live', data or {}, session, user, room_id=room_id):
        return
    role = (data or {}).get('role') or 'viewer'
    await sio.enter_room(sid, room_id)
    room = live_store.activate_presence(
        room_id=room_id,
        sid=sid,
        username=user.username,
        is_host=role == 'host',
        platform=str((data or {}).get('platform') or 'web'),
        device_type=str((data or {}).get('device_type') or 'browser'),
    )
    await _save_user_session(
        sid,
        user,
        live_room_id=room_id,
        access_exp=(session or {}).get('access_exp'),
        client_ip=(session or {}).get('client_ip'),
        token_jti=(session or {}).get('token_jti'),
    )
    await sio.emit('room_stats', {'room_id': room_id, 'viewer_count': room['viewer_count'], 'hearts_count': room['hearts_count']}, room=room_id)


@sio.on('leave_live')
async def leave_live_event(sid, data):
    session = await sio.get_session(sid)
    user = None
    if session and session.get('user_id'):
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == int(session['user_id']), User.is_active.is_(True)).first()
        finally:
            db.close()
    room_id = str((data or {}).get('room_id') or '')
    if not room_id:
        return
    if user is not None and not await _enforce_realtime_security(sid, 'leave_live', data or {}, session, user, room_id=room_id):
        return
    await sio.leave_room(sid, room_id)
    room = live_store.deactivate_presence(room_id, sid)
    if room:
        await sio.emit('room_stats', {'room_id': room_id, 'viewer_count': room['viewer_count'], 'hearts_count': room['hearts_count']}, room=room_id)


@sio.on('send_comment')
async def send_comment_event(sid, data):
    token = (data or {}).get('token')
    session, user = await _resolve_authenticated_user(sid, token, client_ip=get_client_ip(sio.get_environ(sid) or {}))
    room_id = str((data or {}).get('room_id') or '')
    raw_text = str((data or {}).get('text') or '')
    if user is None or not room_id or not raw_text.strip():
        return
    if not await _enforce_realtime_security(sid, 'send_comment', data or {}, session, user, room_id=room_id):
        return
    if not await _enforce_message_spam_policy(sid, session, user, 'live-comment', raw_text, room_id=room_id):
        return
    if not await allow_socket_message(f'live-comment:{user.id}:{room_id}', burst_limit=8, window_seconds=12):
        return
    clean_text = sanitize_text(raw_text.strip(), max_length=600)
    comment = live_store.add_comment(room_id, user.username, clean_text)
    await sio.emit('new_comment', comment, room=room_id)


@sio.on('send_heart')
async def send_heart_event(sid, data):
    token = (data or {}).get('token')
    session, user = await _resolve_authenticated_user(sid, token, client_ip=get_client_ip(sio.get_environ(sid) or {}))
    room_id = str((data or {}).get('room_id') or '')
    if user is None or not room_id:
        return
    if not await _enforce_realtime_security(sid, 'send_heart', data or {}, session, user, room_id=room_id):
        return
    if not await allow_socket_message(f'live-heart:{user.id}:{room_id}', min_interval_seconds=0.6, burst_limit=10, window_seconds=12):
        return
    room = live_store.add_heart(room_id)
    await sio.emit('new_heart', {'count': room['hearts_count']}, room=room_id)
    await sio.emit('room_stats', {'room_id': room_id, 'viewer_count': room['viewer_count'], 'hearts_count': room['hearts_count']}, room=room_id)


@sio.on('chat_typing')
async def chat_typing_event(sid, data):
    token = (data or {}).get('token')
    session, user = await _resolve_authenticated_user(sid, token, client_ip=get_client_ip(sio.get_environ(sid) or {}))
    receiver = (data or {}).get('receiver')
    if user is None or not receiver:
        return
    if not await _enforce_realtime_security(sid, 'chat_typing', data or {}, session, user, room_id=str(receiver)):
        return
    if not await allow_socket_message(
        f'chat-typing:{user.id}:{receiver}',
        min_interval_seconds=settings.SOCKET_TYPING_MIN_INTERVAL_SECONDS,
        burst_limit=24,
        window_seconds=12,
    ):
        return
    await sio.emit(
        'typing_update',
        {
            'sender': user.username,
            'receiver': receiver,
            'is_typing': bool((data or {}).get('is_typing')),
        },
        room=f'username:{receiver}',
    )


@sio.on('join_chat')
async def join_chat_event(sid, data):
    token = (data or {}).get('token')
    session, user = await _resolve_authenticated_user(sid, token, client_ip=get_client_ip(sio.get_environ(sid) or {}))
    peer = (data or {}).get('peer')
    if user is None or not peer:
        return
    if not await _enforce_realtime_security(sid, 'join_chat', data or {}, session, user, room_id=str(peer)):
        return
    room_name = ':'.join(sorted([user.username, peer]))
    await sio.enter_room(sid, f'chat:{room_name}')
    await _emit_pending_delivery_receipts(user, peer=peer)
    await sio.emit('presence_update', {'user': user.username, 'is_online': True, 'last_seen': None})


@sio.on('leave_chat')
async def leave_chat_event(sid, data):
    session = await sio.get_session(sid)
    peer = (data or {}).get('peer')
    user = None
    if session and session.get('user_id'):
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == int(session['user_id']), User.is_active.is_(True)).first()
        finally:
            db.close()
    username = session.get('username') if session else None
    if not username or not peer:
        return
    if user is not None and not await _enforce_realtime_security(sid, 'leave_chat', data or {}, session, user, room_id=str(peer)):
        return
    room_name = ':'.join(sorted([username, peer]))
    await sio.leave_room(sid, f'chat:{room_name}')


@sio.on('sync_chat_state')
async def sync_chat_state_event(sid, data):
    token = (data or {}).get('token')
    session, user = await _resolve_authenticated_user(sid, token, client_ip=get_client_ip(sio.get_environ(sid) or {}))
    peer = (data or {}).get('peer')
    if user is None:
        return
    if not await _enforce_realtime_security(sid, 'sync_chat_state', data or {}, session, user, room_id=str(peer or '')):
        return
    await _emit_pending_delivery_receipts(user, peer=peer)


@sio.on('chat_message')
async def chat_message_event(sid, data):
    token = (data or {}).get('token')
    session, user = await _resolve_authenticated_user(sid, token, client_ip=get_client_ip(sio.get_environ(sid) or {}))
    receiver_username = str((data or {}).get('receiver') or '').strip()
    raw_message = str((data or {}).get('message') or '').strip()
    media_url = str((data or {}).get('media_url') or '').strip()
    message_type = str((data or {}).get('type') or ('image' if media_url else 'text')).strip() or 'text'
    client_id = str((data or {}).get('client_id') or '').strip() or None
    if user is None or not receiver_username or (not raw_message and not media_url):
        return
    if not await _enforce_realtime_security(sid, 'chat_message', data or {}, session, user, room_id=receiver_username):
        return
    if raw_message and not await _enforce_message_spam_policy(sid, session, user, 'chat-message', raw_message, room_id=receiver_username):
        return
    if not await allow_socket_message(f'socket-chat:{user.id}:{receiver_username}', burst_limit=10, window_seconds=15):
        await sio.emit('chat_error', {'detail': 'You are sending messages too quickly'}, room=sid)
        return

    db = SessionLocal()
    try:
        receiver = db.query(User).filter(User.username == receiver_username, User.is_active.is_(True)).first()
        if receiver is None:
            await sio.emit('chat_error', {'detail': 'Receiver not found'}, room=sid)
            return

        existing = None
        if client_id:
            existing = db.query(Message).filter(Message.sender_id == user.id, Message.client_id == client_id).first()

        if existing is None:
            delivered_now = is_user_online(username=receiver.username, user_id=receiver.id)
            message = Message(
                sender_id=user.id,
                receiver_id=receiver.id,
                client_id=client_id,
                content=sanitize_text(raw_message, max_length=2000),
                media_url=media_url or None,
                message_type=message_type,
                is_delivered=delivered_now,
                delivered_at=datetime.utcnow() if delivered_now else None,
                is_seen=False,
            )
            db.add(message)
            db.commit()
            db.refresh(message)
        else:
            message = existing
            delivered_now = bool(message.is_delivered)

        serialized = serialize_message(message, db)
    finally:
        db.close()

    await sio.emit('new_private_message', serialized, room=f'username:{receiver_username}')
    await sio.emit('new_private_message', serialized, room=f'username:{user.username}')
    await sio.emit('chat_message_ack', {'client_id': client_id, 'message': serialized}, room=sid)
    if delivered_now:
        await sio.emit(
            'messages_delivered',
            {'sender': user.username, 'viewer': receiver_username, 'message_ids': [serialized['id']]},
            room=f'username:{user.username}',
        )


@sio.on('like_post')
async def like_post_event(sid, data):
    token = (data or {}).get('token')
    session, user = await _resolve_authenticated_user(sid, token, client_ip=get_client_ip(sio.get_environ(sid) or {}))
    post_id = (data or {}).get('post_id')
    if user is None or not post_id:
        return
    if not await _enforce_realtime_security(sid, 'like_post', data or {}, session, user, room_id=str(post_id)):
        return
    db = SessionLocal()
    try:
        post = db.query(Post).filter(Post.id == int(post_id)).first()
        if post is None:
            return
        existing_like = db.query(Like).filter(Like.user_id == user.id, Like.post_id == post.id).first()
        liked = False
        if existing_like is None:
            db.add(Like(user_id=user.id, post_id=post.id))
            db.commit()
            liked = True
        likes = db.query(func.count(Like.id)).filter(Like.post_id == post.id).scalar() or 0
    finally:
        db.close()
    await sio.emit('post_liked', {'post_id': int(post_id), 'likes': int(likes), 'liked': liked, 'username': user.username})


@sio.on('add_comment')
async def add_comment_event(sid, data):
    token = (data or {}).get('token')
    session, user = await _resolve_authenticated_user(sid, token, client_ip=get_client_ip(sio.get_environ(sid) or {}))
    post_id = (data or {}).get('post_id')
    text = str((data or {}).get('text') or '').strip()
    if user is None or not post_id or not text:
        return
    if not await _enforce_realtime_security(sid, 'add_comment', data or {}, session, user, room_id=str(post_id)):
        return
    if not await _enforce_message_spam_policy(sid, session, user, 'post-comment', text, room_id=str(post_id)):
        return
    if not await allow_socket_message(f'post-comment:{user.id}:{post_id}', burst_limit=8, window_seconds=15):
        return
    db = SessionLocal()
    try:
        comment = Comment(user_id=user.id, post_id=int(post_id), content=sanitize_text(text, max_length=600))
        db.add(comment)
        db.commit()
        db.refresh(comment)
        payload = {
            'id': comment.id,
            'post_id': comment.post_id,
            'user': user.username,
            'username': user.username,
            'text': comment.content,
            'comment': comment.content,
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
        }
    finally:
        db.close()
    await sio.emit('comment_added', {'post_id': int(post_id), 'comment': payload})


@sio.on('follow_user')
async def follow_user_event(sid, data):
    token = (data or {}).get('token')
    session, user = await _resolve_authenticated_user(sid, token, client_ip=get_client_ip(sio.get_environ(sid) or {}))
    target_username = str((data or {}).get('target_username') or '').strip()
    if user is None or not target_username or target_username == user.username:
        return
    if not await _enforce_realtime_security(sid, 'follow_user', data or {}, session, user, room_id=target_username):
        return
    if not await allow_socket_message(f'follow-user:{user.id}:{target_username}', min_interval_seconds=1.2, burst_limit=4, window_seconds=20):
        return
    db = SessionLocal()
    try:
        target_user = db.query(User).filter(User.username == target_username, User.is_active.is_(True)).first()
        if target_user is None:
            return
        follow = db.query(Follow).filter(Follow.follower_id == user.id, Follow.following_id == target_user.id).first()
        following = False
        if follow is None:
            db.add(Follow(follower_id=user.id, following_id=target_user.id))
            user.following_count = (user.following_count or 0) + 1
            target_user.followers_count = (target_user.followers_count or 0) + 1
            following = True
            notification = Notification(
                user_id=target_user.id,
                type='FOLLOW',
                title='متابع جديد',
                body=f'{user.username} بدأ متابعتك',
                data={'from_user_id': user.id, 'username': user.username},
            )
            db.add(notification)
            db.commit()
            db.refresh(notification)
            await sio.emit(
                'new_notification',
                {
                    'id': notification.id,
                    'title': 'متابع جديد 🔥',
                    'message': notification.body,
                    'text': notification.body,
                    'body': notification.body,
                    'created_at': notification.created_at.isoformat(),
                    'seen': False,
                    'screen': 'profile',
                    'path': f'/profile/{user.username}',
                    'data': {'username': user.username, 'screen': 'profile', 'path': f'/profile/{user.username}'},
                },
                room=f'user:{target_user.id}',
            )
        else:
            db.delete(follow)
            user.following_count = max((user.following_count or 0) - 1, 0)
            target_user.followers_count = max((target_user.followers_count or 0) - 1, 0)
            db.commit()
        db.refresh(user)
        db.refresh(target_user)
        payload = {
            'username': user.username,
            'target_username': target_user.username,
            'following': following,
            'followers_count': target_user.followers_count,
            'following_count': target_user.following_count,
        }
    finally:
        db.close()
    await sio.emit('user_follow_update', payload)


@sio.on('ping')
async def ping_event(sid, data):
    session = await sio.get_session(sid)
    response = {
        'sid': sid,
        'server_ts': int(time.time() * 1000),
        'echo_ts': (data or {}).get('ts'),
        'username': (session or {}).get('username'),
    }
    await sio.emit('pong', response, room=sid)


@sio.on('presence_snapshot')
async def presence_snapshot_event(sid, data):
    users = (data or {}).get('users') or []
    payload = []
    for username in users[:50]:
        normalized = str(username or '').strip()
        if not normalized:
            continue
        payload.append({
            'user': normalized,
            'is_online': is_user_online(username=normalized),
        })
    await sio.emit('presence_snapshot', payload, room=sid)
