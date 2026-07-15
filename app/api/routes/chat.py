from datetime import datetime
import inspect

import bleach
import httpx
from fastapi import APIRouter, Body, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.core.rate_limit import allow_socket_message
from app.core.security import ACCESS_TOKEN_TYPE, TokenError, decode_token
from app.core.socket_server import is_user_online, sio
from app.db.session import SessionLocal
from app.models.message import Message
from app.models.message_attachment import MessageAttachment
from app.models.message_reaction import MessageReaction
from app.models.notification import Notification
from app.models.user import User
from app.models.user_block import UserBlock
from app.services.chat_realtime import mark_messages_delivered, mark_messages_seen_for_sender, serialize_message
from app.services.encryption_service import encrypt_message, decrypt_message
from app.services.media_service import scan_media_for_malware
from app.services.chat_features import (
    recall_message,
    add_reaction,
    remove_reaction,
    list_reactions,
    apply_retention_policy,
)
from app.services.connection_manager import manager

router = APIRouter()

TRANSLATE_TIMEOUT_SECONDS = 12

# v59.4: حدود أمان للرسائل (بعد توحيد التخزين في backend monolith).
MAX_MESSAGE_LENGTH = 8000          # حد أقصى لتعديل أو إرسال رسالة نصية
EDIT_WINDOW_HOURS = 24             # نافذة تعديل الرسالة
DELETE_FOR_EVERYONE_HOURS = 24     # نافذة حذف للجميع


async def _resolve_rate_limit_result(result) -> bool:
    if inspect.isawaitable(result):
        return bool(await result)
    return bool(result)


def _authenticate_websocket_user(websocket: WebSocket, user_id: int, db: Session) -> User:
    token = websocket.query_params.get('token')
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token is required')

    try:
        payload = decode_token(token, expected_type=ACCESS_TOKEN_TYPE)
    except TokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    token_user_id = payload.get('user_id')
    if token_user_id is None or int(token_user_id) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Token does not match websocket user')

    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    return user


def _find_active_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == str(username or '').strip(), User.is_active.is_(True)).first()


def _block_status(db: Session, current_user_id: int, other_user_id: int) -> dict:
    blocked_by_me = db.query(UserBlock).filter(
        UserBlock.blocker_id == current_user_id,
        UserBlock.blocked_id == other_user_id,
    ).first() is not None
    blocked_me = db.query(UserBlock).filter(
        UserBlock.blocker_id == other_user_id,
        UserBlock.blocked_id == current_user_id,
    ).first() is not None
    return {
        'blocked_by_me': blocked_by_me,
        'blocked_me': blocked_me,
        'can_chat': not blocked_by_me and not blocked_me,
    }


def _assert_can_chat(db: Session, current_user_id: int, other_user_id: int) -> dict:
    status_payload = _block_status(db, current_user_id, other_user_id)
    if not status_payload['can_chat']:
        detail = 'You blocked this user' if status_payload['blocked_by_me'] else 'This user blocked you'
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
    return status_payload


def _presence_payload(other_user: User) -> dict:
    return {
        'is_online': is_user_online(username=other_user.username, user_id=other_user.id),
        'last_seen': other_user.last_login_at.isoformat() if other_user.last_login_at else None,
    }


async def _emit_delivered_receipts(db: Session, current_user: User, peer_user_id: int | None = None) -> None:
    for receipt in mark_messages_delivered(db, current_user, peer_user_id=peer_user_id):
        await sio.emit('messages_delivered', receipt, room=f'username:{receipt["sender"]}')


async def _translate_with_mymemory(text: str, source_lang: str, target_lang: str) -> dict:
    async with httpx.AsyncClient(timeout=TRANSLATE_TIMEOUT_SECONDS, follow_redirects=True) as client:
        response = await client.get(
            'https://api.mymemory.translated.net/get',
            params={'q': text, 'langpair': f'{source_lang}|{target_lang}'},
            headers={'Accept': 'application/json'},
        )
        response.raise_for_status()
        payload = response.json()

    translated = str((payload.get('responseData') or {}).get('translatedText') or '').strip()
    if not translated:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail='Translation service unavailable')
    return {
        'translated_text': translated,
        'provider': 'MyMemory',
        'match': payload.get('responseData', {}).get('match'),
    }


@router.get('/messages')
def get_messages(
    receiver: str,
    limit: int = Query(default=40, ge=1, le=200),
    before_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # دعم دردشة المجموعات: إذا بدأ المستلم بـ "group:"
    is_group = str(receiver).startswith('group:')
    
    if is_group:
        # في الوقت الحالي، نستخدم جدول الرسائل نفسه للمجموعات مع وضع معرف المجموعة في حقل receiver
        query = db.query(Message).filter(Message.receiver == receiver)
    else:
        other_user = _find_active_user_by_username(db, receiver)
        if other_user is None:
            return {'items': [], 'paging': {'limit': limit, 'has_more': False, 'next_before_id': None}}

        _assert_can_chat(db, current_user.id, other_user.id)

        query = db.query(Message).filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == other_user.id),
                and_(Message.sender_id == other_user.id, Message.receiver_id == current_user.id),
            )
        )
    if before_id is not None:
        query = query.filter(Message.id < before_id)

    messages = list(reversed(query.order_by(Message.id.desc()).limit(limit).all()))
    items = [serialize_message(message, db) for message in messages]
    return {
        'items': items,
        'paging': {
            'limit': limit,
            'has_more': len(messages) >= limit,
            'next_before_id': messages[0].id if messages else None,
        },
    }


def _parse_attachments(payload: dict) -> list[dict]:
    """تجميع وتطبيع قائمة المرفقات الواردة في payload."""
    raw = payload.get('attachments') or []
    if not isinstance(raw, list):
        return []
    items: list[dict] = []
    for idx, item in enumerate(raw):
        if not isinstance(item, dict):
            continue
        url = str(item.get('url') or item.get('media_url') or '').strip()
        if not url:
            continue
        items.append({
            'url': url,
            'cdn_url': str(item.get('cdn_url') or '').strip() or None,
            'thumbnail_url': str(item.get('thumbnail_url') or '').strip() or None,
            'kind': str(item.get('kind') or item.get('type') or 'file').strip() or 'file',
            'mime_type': str(item.get('mime_type') or item.get('mimeType') or '').strip() or None,
            'file_name': str(item.get('file_name') or item.get('fileName') or item.get('originalName') or '').strip() or None,
            'file_size': int(item.get('file_size') or item.get('size') or 0) or None,
            'width': int(item.get('width') or 0) or None,
            'height': int(item.get('height') or 0) or None,
            'duration_seconds': float(item.get('duration_seconds') or item.get('duration') or 0) or None,
            'waveform': item.get('waveform') if isinstance(item.get('waveform'), str) else None,
            'position': int(item.get('position') or idx),
        })
    return items


@router.post('/send_message')
async def send_message(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    receiver_username = str(payload.get('receiver') or '').strip()
    raw_message = str(payload.get('message') or payload.get('content') or '').strip()
    media_url = str(payload.get('media_url') or '').strip()
    message_type = str(payload.get('type') or ('image' if media_url else 'text')).strip() or 'text'
    client_id = str(payload.get('client_id') or '').strip() or None
    reply_to_id = payload.get('reply_to_id') or (payload.get('reply_to') or {}).get('id') if isinstance(payload.get('reply_to'), dict) else payload.get('reply_to_id')
    try:
        reply_to_id = int(reply_to_id) if reply_to_id else None
    except (TypeError, ValueError):
        reply_to_id = None
    forwarded_from_id = payload.get('forwarded_from_id')
    try:
        forwarded_from_id = int(forwarded_from_id) if forwarded_from_id else None
    except (TypeError, ValueError):
        forwarded_from_id = None
    disappearing_seconds = 0
    try:
        disappearing_seconds = int(payload.get('disappearing_in_seconds') or 0)
    except (TypeError, ValueError):
        disappearing_seconds = 0
    attachments = _parse_attachments(payload)

    if not receiver_username or (not raw_message and not media_url and not attachments):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='receiver and message or media_url/attachments are required')

    # v59.4: حد أقصى لطول الرسالة (دفاع على مستوى التطبيق بجانب max-body في الـ gateway).
    if len(raw_message) > MAX_MESSAGE_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f'Message exceeds {MAX_MESSAGE_LENGTH} characters',
        )

    if not await _resolve_rate_limit_result(allow_socket_message(f'chat:{current_user.id}')):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='You are sending messages too quickly')

    # دعم دردشة المجموعات
    is_group = receiver_username.startswith('group:')
    receiver_id = None

    if not is_group:
        receiver = _find_active_user_by_username(db, receiver_username)
        if receiver is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Receiver not found')
        _assert_can_chat(db, current_user.id, receiver.id)
        receiver_id = receiver.id
    else:
        # للمجموعات: نستخدم معرف المُرسل نفسه كـ receiver_id لتلبية قيد FK
        receiver_id = current_user.id

    if client_id:
        existing = db.query(Message).filter(Message.sender_id == current_user.id, Message.client_id == client_id).first()
        if existing is not None:
            return serialize_message(existing, db)

    if media_url and not scan_media_for_malware(media_url):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Media failed malware scan.')
    for att in attachments:
        if not scan_media_for_malware(att['url']):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Attachment failed malware scan.')

    # التحقق من reply_to_id
    if reply_to_id is not None:
        reply_target = db.query(Message).filter(Message.id == reply_to_id).first()
        if reply_target is None:
            reply_to_id = None

    # حساب expires_at للرسائل المختفية
    expires_at = None
    if disappearing_seconds and disappearing_seconds > 0:
        from datetime import timedelta
        expires_at = datetime.utcnow() + timedelta(seconds=disappearing_seconds)

    delivered_now = is_group or is_user_online(username=receiver_username, user_id=receiver_id)
    delivered_at = datetime.utcnow() if delivered_now else None
    clean_message = bleach.clean(raw_message)
    message = Message(
        sender_id=current_user.id,
        receiver_id=receiver_id,
        sender=current_user.username,
        receiver=receiver_username,
        client_id=client_id,
        message=clean_message,
        content=encrypt_message(clean_message),
        media_url=media_url or (attachments[0]['url'] if attachments else None),
        message_type=message_type,
        is_delivered=delivered_now,
        delivered_at=delivered_at,
        is_seen=False,
        reply_to_id=reply_to_id,
        forwarded_from_id=forwarded_from_id,
        expires_at=expires_at,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    # حفظ المرفقات المتعددة في الجدول الجديد
    if attachments:
        for item in attachments:
            db.add(MessageAttachment(
                message_id=message.id,
                url=item['url'],
                cdn_url=item['cdn_url'],
                thumbnail_url=item['thumbnail_url'],
                kind=item['kind'],
                mime_type=item['mime_type'],
                file_name=item['file_name'],
                file_size=item['file_size'],
                width=item['width'],
                height=item['height'],
                duration_seconds=item['duration_seconds'],
                waveform=item['waveform'],
                position=item['position'],
            ))
        db.commit()
        db.refresh(message)

    serialized = serialize_message(message, db)

    if is_group:
        # إرسال إلى غرفة المجموعة في السوكيت
        await sio.emit('new_message', serialized, room=receiver_username)
    else:
        await sio.emit('new_private_message', serialized, room=f'username:{receiver_username}')
        await sio.emit('new_private_message', serialized, room=f'username:{current_user.username}')

    # الإشعارات (للمحادثات الخاصة فقط حالياً لتجنب الإزعاج في المجموعات)
    if not is_group:
        try:
            preview = (clean_message or '').strip()
            if not preview and media_url:
                preview = '📎 وسائط جديدة'
            if len(preview) > 140:
                preview = preview[:137] + '...'
            notification = Notification(
                user_id=receiver_id,
                type='CHAT',
                title=f'رسالة جديدة من {current_user.username}',
                body=preview or 'رسالة جديدة',
                data={
                    'from_user_id': current_user.id,
                    'username': current_user.username,
                    'message_id': message.id,
                    'screen': 'chat',
                    'path': f'/chat/{current_user.username}',
                },
            )
            db.add(notification)
            db.commit()
            db.refresh(notification)
            await sio.emit(
                'new_notification',
                {
                    'id': notification.id,
                    'type': 'CHAT',
                    'title': notification.title,
                    'message': notification.body,
                    'text': notification.body,
                    'body': notification.body,
                    'created_at': notification.created_at.isoformat(),
                    'seen': False,
                    'screen': 'chat',
                    'path': f'/chat/{current_user.username}',
                    'data': {
                        'username': current_user.username,
                        'screen': 'chat',
                        'path': f'/chat/{current_user.username}',
                        'message_id': message.id,
                    },
                },
                room=f'user:{receiver_id}',
            )
        except Exception:
            pass

    if not is_group and message.is_delivered:
        await sio.emit(
            'messages_delivered',
            {'sender': current_user.username, 'viewer': receiver_username, 'message_ids': [message.id]},
            room=f'username:{current_user.username}',
        )
    return serialized


@router.post('/message_seen')
async def mark_messages_seen(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sender_username = str(payload.get('sender') or '').strip()
    sender = _find_active_user_by_username(db, sender_username)
    if sender is None:
        return {'message_ids': []}

    if not _block_status(db, current_user.id, sender.id)['can_chat']:
        return {'message_ids': []}

    await _emit_delivered_receipts(db, current_user, peer_user_id=sender.id)
    message_ids = mark_messages_seen_for_sender(db, current_user, sender)
    if message_ids:
        await sio.emit(
            'messages_seen',
            {'sender': sender.username, 'viewer': current_user.username, 'message_ids': message_ids},
            room=f'username:{sender.username}',
        )
    return {'message_ids': message_ids}


@router.get('/chat_block_status/{username}')
def get_chat_block_status(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    other_user = _find_active_user_by_username(db, username)
    if other_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    return {
        **_block_status(db, current_user.id, other_user.id),
        **_presence_payload(other_user),
        'username': other_user.username,
    }


@router.post('/block_user')
def block_user(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    username = str(payload.get('username') or '').strip()
    other_user = _find_active_user_by_username(db, username)
    if other_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    if other_user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Cannot block yourself')

    existing = db.query(UserBlock).filter(
        UserBlock.blocker_id == current_user.id,
        UserBlock.blocked_id == other_user.id,
    ).first()
    if existing is None:
        db.add(UserBlock(blocker_id=current_user.id, blocked_id=other_user.id))
        db.commit()

    return {
        'username': other_user.username,
        'blocked_by_me': True,
        'blocked_me': False,
        'can_chat': False,
    }


@router.post('/unblock_user')
def unblock_user(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    username = str(payload.get('username') or '').strip()
    other_user = _find_active_user_by_username(db, username)
    if other_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    existing = db.query(UserBlock).filter(
        UserBlock.blocker_id == current_user.id,
        UserBlock.blocked_id == other_user.id,
    ).first()
    if existing is not None:
        db.delete(existing)
        db.commit()

    other_status = _block_status(db, current_user.id, other_user.id)
    return {
        'username': other_user.username,
        **other_status,
    }


@router.post('/delete_message')
async def delete_message(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    message_id = int(payload.get('message_id') or 0)
    delete_for_everyone = bool(payload.get('delete_for_everyone'))
    message = db.query(Message).filter(Message.id == message_id, Message.sender_id == current_user.id).first()
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Message not found')
    # v59.4: فرض نافذة حذف للجميع (مثل WhatsApp).
    if delete_for_everyone:
        from datetime import timedelta
        if message.created_at and (datetime.utcnow() - message.created_at) > timedelta(hours=DELETE_FOR_EVERYONE_HOURS):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Delete-for-everyone window expired ({DELETE_FOR_EVERYONE_HOURS}h)',
            )
    message.deleted_at = datetime.utcnow()
    message.deleted_for_everyone = bool(delete_for_everyone)
    db.commit()
    db.refresh(message)
    serialized = serialize_message(message, db)
    await sio.emit('message_deleted', serialized, room=f'username:{current_user.username}')
    if delete_for_everyone:
        receiver = db.query(User).filter(User.id == message.receiver_id).first()
        if receiver is not None:
            await sio.emit('message_deleted', serialized, room=f'username:{receiver.username}')
    return serialized


@router.post('/restore_message')
def restore_message(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    message_id = int(payload.get('message_id') or 0)
    message = db.query(Message).filter(Message.id == message_id, Message.sender_id == current_user.id).first()
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Message not found')
    message.deleted_at = None
    db.commit()
    db.refresh(message)
    return serialize_message(message, db)


@router.post('/{message_id}/recall')
def recall(message_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return recall_message(db, message_id, current_user.id)


@router.post('/{message_id}/react')
async def react(message_id: int, payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reaction = str(payload.get('reaction') or '').strip()
    if not reaction:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Reaction is required')
    result = add_reaction(db, message_id, current_user.id, reaction)
    # بث تحديث للطرف الآخر عبر Socket.IO
    try:
        msg = db.query(Message).filter(Message.id == message_id).first()
        if msg is not None:
            payload_evt = {
                'message_id': message_id,
                'user': current_user.username,
                'reaction': reaction,
                'action': result.get('status'),
                'total': result.get('total'),
                'summary': result.get('summary'),
            }
            await sio.emit('message_reaction', payload_evt, room=f'username:{msg.sender}')
            if msg.receiver:
                await sio.emit('message_reaction', payload_evt, room=f'username:{msg.receiver}')
    except Exception:
        pass
    return result


@router.delete('/{message_id}/react')
async def unreact(message_id: int, reaction: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = remove_reaction(db, message_id, current_user.id, reaction)
    try:
        msg = db.query(Message).filter(Message.id == message_id).first()
        if msg is not None:
            payload_evt = {
                'message_id': message_id,
                'user': current_user.username,
                'reaction': reaction,
                'action': 'removed',
                'total': result.get('total'),
                'summary': result.get('summary'),
            }
            await sio.emit('message_reaction', payload_evt, room=f'username:{msg.sender}')
            if msg.receiver:
                await sio.emit('message_reaction', payload_evt, room=f'username:{msg.receiver}')
    except Exception:
        pass
    return result


@router.get('/{message_id}/reactions')
def get_message_reactions(message_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return list_reactions(db, message_id)


@router.post('/edit_message')
async def edit_message(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """تعديل رسالة أرسلها المستخدم الحالي (خلال نافذة 24 ساعة)."""
    try:
        message_id = int(payload.get('message_id') or 0)
    except (TypeError, ValueError):
        message_id = 0
    new_text = str(payload.get('content') or payload.get('message') or '').strip()
    if not message_id or not new_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='message_id and content are required')
    # v59.4: حد طول الرسالة لمنع DoS/abuse.
    if len(new_text) > MAX_MESSAGE_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f'Message exceeds {MAX_MESSAGE_LENGTH} characters',
        )

    message = db.query(Message).filter(
        Message.id == message_id,
        Message.sender_id == current_user.id,
    ).first()
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Message not found')
    if message.deleted_at or message.is_recalled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Cannot edit deleted/recalled message')

    from datetime import timedelta
    if message.created_at and (datetime.utcnow() - message.created_at) > timedelta(hours=EDIT_WINDOW_HOURS):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f'Edit window expired ({EDIT_WINDOW_HOURS}h)')

    clean = bleach.clean(new_text)
    message.message = clean
    message.content = encrypt_message(clean)
    message.is_edited = True
    message.edited_at = datetime.utcnow()
    db.commit()
    db.refresh(message)
    serialized = serialize_message(message, db)

    # بث التحديث عبر Socket.IO
    try:
        if str(message.receiver or '').startswith('group:'):
            await sio.emit('message_edited', serialized, room=message.receiver)
        else:
            await sio.emit('message_edited', serialized, room=f'username:{message.receiver}')
            await sio.emit('message_edited', serialized, room=f'username:{current_user.username}')
    except Exception:
        pass
    return serialized


@router.post('/forward_message')
async def forward_message(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """تمرير رسالة إلى واحد أو أكثر من المستخدمين/المجموعات."""
    try:
        message_id = int(payload.get('message_id') or 0)
    except (TypeError, ValueError):
        message_id = 0
    receivers = payload.get('receivers') or payload.get('to') or []
    if not isinstance(receivers, list):
        receivers = [receivers]
    receivers = [str(r).strip() for r in receivers if str(r or '').strip()]
    if not message_id or not receivers:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='message_id and receivers are required')

    source = db.query(Message).filter(Message.id == message_id).first()
    if source is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Source message not found')
    if source.deleted_at or source.is_recalled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Cannot forward a deleted/recalled message')

    # المستخدم لا يستطيع تمرير رسالة ليس طرفاً فيها إلا إذا كانت في مجموعة عضو بها
    if source.sender_id != current_user.id and source.receiver_id != current_user.id:
        if not str(source.receiver or '').startswith('group:'):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed to forward this message')

    src_text = source.message or ''
    if source.content and not src_text:
        try:
            from app.services.encryption_service import decrypt_message
            src_text = decrypt_message(source.content) or ''
        except Exception:
            src_text = ''
    src_media = source.media_url
    src_type = source.message_type or ('image' if src_media else 'text')

    created: list[dict] = []
    for to_target in receivers:
        is_group = to_target.startswith('group:')
        target_id = current_user.id
        if not is_group:
            tgt_user = _find_active_user_by_username(db, to_target)
            if tgt_user is None:
                continue
            if not _block_status(db, current_user.id, tgt_user.id)['can_chat']:
                continue
            target_id = tgt_user.id

        delivered_now = is_group or is_user_online(username=to_target, user_id=target_id)
        new_msg = Message(
            sender_id=current_user.id,
            receiver_id=target_id,
            sender=current_user.username,
            receiver=to_target,
            client_id=None,
            message=src_text,
            content=encrypt_message(src_text) if src_text else '',
            media_url=src_media,
            message_type=src_type,
            is_delivered=delivered_now,
            delivered_at=datetime.utcnow() if delivered_now else None,
            is_seen=False,
            forwarded_from_id=source.id,
        )
        db.add(new_msg)
        db.commit()
        db.refresh(new_msg)

        # نسخ المرفقات أيضاً
        try:
            src_atts = db.query(MessageAttachment).filter(MessageAttachment.message_id == source.id).all()
            for att in src_atts:
                db.add(MessageAttachment(
                    message_id=new_msg.id,
                    url=att.url,
                    cdn_url=att.cdn_url,
                    thumbnail_url=att.thumbnail_url,
                    kind=att.kind,
                    mime_type=att.mime_type,
                    file_name=att.file_name,
                    file_size=att.file_size,
                    width=att.width,
                    height=att.height,
                    duration_seconds=att.duration_seconds,
                    waveform=att.waveform,
                    position=att.position,
                ))
            if src_atts:
                db.commit()
                db.refresh(new_msg)
        except Exception:
            db.rollback()

        serialized = serialize_message(new_msg, db)
        created.append(serialized)

        try:
            if is_group:
                await sio.emit('new_message', serialized, room=to_target)
            else:
                await sio.emit('new_private_message', serialized, room=f'username:{to_target}')
                await sio.emit('new_private_message', serialized, room=f'username:{current_user.username}')
        except Exception:
            pass

    return {'forwarded': len(created), 'items': created}


@router.get('/search_messages')
def search_messages(
    q: str = Query(..., min_length=1, max_length=200),
    peer: str | None = None,
    limit: int = Query(default=40, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """بحث في الرسائل التي تخص المستخدم الحالي (أو في محادثة محددة)."""
    needle = q.strip()
    if not needle:
        return {'items': []}

    query = db.query(Message).filter(
        or_(Message.sender_id == current_user.id, Message.receiver_id == current_user.id),
        Message.deleted_at.is_(None),
        Message.is_recalled.is_(False),
        Message.message.ilike(f'%{needle}%'),
    )
    if peer:
        peer = peer.strip()
        if peer.startswith('group:'):
            query = query.filter(Message.receiver == peer)
        else:
            other = _find_active_user_by_username(db, peer)
            if other is None:
                return {'items': []}
            query = query.filter(
                or_(
                    and_(Message.sender_id == current_user.id, Message.receiver_id == other.id),
                    and_(Message.sender_id == other.id, Message.receiver_id == current_user.id),
                )
            )

    messages = query.order_by(Message.id.desc()).limit(limit).all()
    return {
        'q': needle,
        'items': [serialize_message(m, db) for m in messages],
    }


@router.post('/typing')
async def chat_typing(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    """إعلام الطرف الآخر بحالة الكتابة (HTTP fallback إلى جانب socket)."""
    to = str(payload.get('to') or payload.get('receiver') or '').strip()
    is_typing = bool(payload.get('is_typing', True))
    if not to:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='to/receiver is required')
    event = 'typing_started' if is_typing else 'typing_stopped'
    room = to if to.startswith('group:') else f'username:{to}'
    try:
        await sio.emit(event, {'from': current_user.username, 'to': to}, room=room)
    except Exception:
        pass
    return {'ok': True, 'event': event, 'to': to}


@router.post('/apply_retention')
def apply_retention(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    chat_id = payload.get('chat_id')
    policy = payload.get('policy')
    if not chat_id or not policy:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Chat ID and policy are required')
    return apply_retention_policy(db, chat_id, policy, current_user.id)


@router.get('/chat_threads')
def get_chat_threads(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # v83.7 FIX #2/#4:
    #  - قبل: .all() بلا حد → استرجاع كل رسائل المستخدم مدى الحياة في الذاكرة (تدهور خطير للأداء).
    #  - قبل: last_message = message.content = نص مشفَّر '[ENCRYPTED]...' يظهر للمستخدم في القائمة.
    # الحل: نتصفح تنازلياً بدفعات صغيرة حتى نجمع limit-محادثات، ونفكّ التشفير لعرض معاينة نصيّة نظيفة.
    result: list[dict] = []
    seen: set[str] = set()
    page_size = max(limit * 4, 100)  # مضاعف لأن رسائل عدة قد تخص نفس الطرف
    offset = 0
    hard_stop = 5000  # سقف مطلق يمنع scan مفتوح لو حساب فيه ملايين الرسائل

    while len(result) < limit and offset < hard_stop:
        batch = (
            db.query(Message)
            .filter(or_(Message.sender_id == current_user.id, Message.receiver_id == current_user.id))
            .order_by(Message.id.desc())
            .offset(offset)
            .limit(page_size)
            .all()
        )
        if not batch:
            break
        for message in batch:
            if len(result) >= limit:
                break
            peer_id = message.receiver_id if message.sender_id == current_user.id else message.sender_id
            peer = db.query(User).filter(User.id == peer_id, User.is_active.is_(True)).first()
            if peer is None or peer.username in seen:
                continue
            relationship = _block_status(db, current_user.id, peer.id)
            if not relationship['can_chat']:
                continue
            seen.add(peer.username)

            unread_count = db.query(Message).filter(
                Message.sender_id == peer.id,
                Message.receiver_id == current_user.id,
                Message.is_seen.is_(False),
            ).count()

            # v83.7 FIX #2 — بناء معاينة نصيّة نظيفة (فك التشفير + fallbacks).
            if message.deleted_at:
                preview = 'تم حذف الرسالة'
            else:
                preview = (getattr(message, 'message', None) or '').strip()
                if not preview and message.content:
                    try:
                        preview = (decrypt_message(message.content) or '').strip()
                    except Exception:
                        preview = ''
                if not preview and message.media_url:
                    preview = '📎 وسائط'
                if len(preview) > 140:
                    preview = preview[:137] + '...'

            presence = _presence_payload(peer)
            result.append({
                'name': peer.username,
                'username': peer.username,
                'avatar': peer.avatar,
                'last_message': preview,
                'created_at': message.created_at.isoformat() if message.created_at else None,
                'unread_count': int(unread_count),
                'status': 'seen' if message.is_seen else 'delivered' if message.is_delivered else 'sent',
                'last_message_status': 'seen' if message.is_seen else 'delivered' if message.is_delivered else 'sent',
                'last_message_sender': current_user.username if message.sender_id == current_user.id else peer.username,
                'last_message_type': message.message_type or ('image' if message.media_url else 'text'),
                'last_message_deleted': bool(message.deleted_at),
                'last_message_id': message.id,
                'presence': presence,
                'last_seen': presence['last_seen'],
            })
        if len(batch) < page_size:
            break
        offset += page_size
    return result


@router.get('/presence/{username}')
def get_presence(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    other_user = _find_active_user_by_username(db, username)
    if other_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    relationship = _assert_can_chat(db, current_user.id, other_user.id)
    return {
        **_presence_payload(other_user),
        **relationship,
        'username': other_user.username,
    }


@router.websocket('/ws/{user_id}')
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(SessionLocal)):
    user = _authenticate_websocket_user(websocket, user_id, db)
    await manager.connect(websocket, user.username, user.id)
    try:
        while True:
            data = await websocket.receive_text()
            print(f'Received from {user.username}: {data}')
    except WebSocketDisconnect:
        manager.disconnect(websocket, user.username, user.id)
        print(f'Client {user.username} disconnected')


@router.post('/translate')
@router.post('/translate_message')
async def translate(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # v64 — يقبل كلا التنسيقين (frontend جديد: target/source ، أو القديم: target_lang/source_lang)
    text = str(payload.get('text') or '').strip()
    source_lang = (
        str(payload.get('source_lang') or payload.get('source') or '').strip() or 'auto'
    )
    target_lang = (
        str(payload.get('target_lang') or payload.get('target') or '').strip() or 'en'
    )
    if not text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Text is required')
    result = await _translate_with_mymemory(text, source_lang, target_lang)
    # v64 — نرجّع التنسيقين معاً ليتوافق مع الـ frontend الحالي والقديم
    translated_text = result.get('translated_text') or ''
    return {
        # تنسيق frontend الجديد (المتوقع في translationService.js)
        'translatedText': translated_text,
        'detectedSourceLanguage': source_lang,
        # تنسيق قديم (للتوافق الخلفي)
        'translated_text': translated_text,
        'source_lang': source_lang,
        'target_lang': target_lang,
        'provider': result.get('provider', 'MyMemory'),
        'match': result.get('match'),
    }


@router.post('/update_online')
def update_online_status(payload: dict = Body(default={}), current_user: User = Depends(get_current_user)):
    return {
        'ok': True,
        'username': current_user.username,
        'online': bool(payload.get('online', True)),
    }
