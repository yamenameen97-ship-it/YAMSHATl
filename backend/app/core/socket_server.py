from __future__ import annotations

from datetime import datetime

import bleach
import socketio
from sqlalchemy import func

from app.core.config import settings
from app.core.live_store import live_store
from app.core.rate_limit import allow_socket_message
from app.core.security import TokenError, decode_token
from app.db.session import SessionLocal
from app.models.comment import Comment
from app.models.follow import Follow
from app.models.like import Like
from app.models.notification import Notification
from app.models.post import Post
from app.models.user import User

cors_allowed_origins = '*' if '*' in settings.cors_origins else settings.cors_origins
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins=cors_allowed_origins)
sio_app = socketio.ASGIApp(sio)


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


async def _save_user_session(sid: str, user: User, live_room_id: str | None = None) -> dict:
    session = {
        'user_id': user.id,
        'username': user.username,
        'role': getattr(user, 'role', 'user'),
        'live_room_id': live_room_id,
    }
    await sio.save_session(sid, session)
    await sio.enter_room(sid, f'user:{user.id}')
    await sio.enter_room(sid, f'username:{user.username}')
    if getattr(user, 'role', 'user') in {'admin', 'moderator'}:
        await sio.enter_room(sid, 'admins')
    return session


async def _resolve_authenticated_user(sid: str, token: str | None = None) -> tuple[dict | None, User | None]:
    session = await sio.get_session(sid)
    if session and session.get('user_id'):
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == int(session['user_id']), User.is_active.is_(True)).first()
            return session, user
        finally:
            db.close()

    if not token:
        return None, None

    try:
        payload = decode_token(token)
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
        session = await _save_user_session(sid, user)
        return session, user
    finally:
        db.close()


@sio.event
async def connect(sid, environ, auth):
    token = (auth or {}).get('token') if isinstance(auth, dict) else None
    if token:
        _, user = await _resolve_authenticated_user(sid, token)
        if user is not None:
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
    session, user = await _resolve_authenticated_user(sid, token)
    if user is None:
        username = (data or {}).get('user')
        if username:
            await sio.save_session(sid, {'username': username, 'user_id': None, 'role': 'guest', 'live_room_id': None})
            await sio.enter_room(sid, f'username:{username}')
        return
    await _save_user_session(sid, user, live_room_id=(session or {}).get('live_room_id'))
    await sio.emit('presence_update', {'user': user.username, 'is_online': True, 'last_seen': user.last_login_at.isoformat() if user.last_login_at else None})


@sio.on('join_live')
async def join_live_event(sid, data):
    token = (data or {}).get('token')
    session, user = await _resolve_authenticated_user(sid, token)
    room_id = str((data or {}).get('room_id') or '')
    if user is None or not room_id:
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
    await _save_user_session(sid, user, live_room_id=room_id)
    await sio.emit('room_stats', {'room_id': room_id, 'viewer_count': room['viewer_count'], 'hearts_count': room['hearts_count']}, room=room_id)


@sio.on('leave_live')
async def leave_live_event(sid, data):
    room_id = str((data or {}).get('room_id') or '')
    if not room_id:
        return
    await sio.leave_room(sid, room_id)
    room = live_store.deactivate_presence(room_id, sid)
    if room:
        await sio.emit('room_stats', {'room_id': room_id, 'viewer_count': room['viewer_count'], 'hearts_count': room['hearts_count']}, room=room_id)


@sio.on('send_comment')
async def send_comment_event(sid, data):
    token = (data or {}).get('token')
    _, user = await _resolve_authenticated_user(sid, token)
    room_id = str((data or {}).get('room_id') or '')
    raw_text = str((data or {}).get('text') or '')
    if user is None or not room_id or not raw_text.strip():
        return
    if not allow_socket_message(f'live-comment:{user.id}'):
        return
    clean_text = bleach.clean(raw_text.strip())
    comment = live_store.add_comment(room_id, user.username, clean_text)
    await sio.emit('new_comment', comment, room=room_id)


@sio.on('send_heart')
async def send_heart_event(sid, data):
    token = (data or {}).get('token')
    _, user = await _resolve_authenticated_user(sid, token)
    room_id = str((data or {}).get('room_id') or '')
    if user is None or not room_id:
        return
    room = live_store.add_heart(room_id)
    await sio.emit('new_heart', {'count': room['hearts_count']}, room=room_id)
    await sio.emit('room_stats', {'room_id': room_id, 'viewer_count': room['viewer_count'], 'hearts_count': room['hearts_count']}, room=room_id)


@sio.on('chat_typing')
async def chat_typing_event(sid, data):
    token = (data or {}).get('token')
    _, user = await _resolve_authenticated_user(sid, token)
    receiver = (data or {}).get('receiver')
    if user is None or not receiver:
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
    _, user = await _resolve_authenticated_user(sid, token)
    peer = (data or {}).get('peer')
    if user is None or not peer:
        return
    room_name = ':'.join(sorted([user.username, peer]))
    await sio.enter_room(sid, f'chat:{room_name}')
    await sio.emit('presence_update', {'user': user.username, 'is_online': True, 'last_seen': None})


@sio.on('leave_chat')
async def leave_chat_event(sid, data):
    session = await sio.get_session(sid)
    peer = (data or {}).get('peer')
    username = session.get('username') if session else None
    if not username or not peer:
        return
    room_name = ':'.join(sorted([username, peer]))
    await sio.leave_room(sid, f'chat:{room_name}')


@sio.on('like_post')
async def like_post_event(sid, data):
    token = (data or {}).get('token')
    _, user = await _resolve_authenticated_user(sid, token)
    post_id = (data or {}).get('post_id')
    if user is None or not post_id:
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
    _, user = await _resolve_authenticated_user(sid, token)
    post_id = (data or {}).get('post_id')
    text = str((data or {}).get('text') or '').strip()
    if user is None or not post_id or not text:
        return
    if not allow_socket_message(f'post-comment:{user.id}'):
        return
    db = SessionLocal()
    try:
        comment = Comment(user_id=user.id, post_id=int(post_id), content=bleach.clean(text))
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
    _, user = await _resolve_authenticated_user(sid, token)
    target_username = str((data or {}).get('target_username') or '').strip()
    if user is None or not target_username or target_username == user.username:
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
                    'message': notification.body,
                    'text': notification.body,
                    'created_at': notification.created_at.isoformat(),
                    'seen': False,
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
