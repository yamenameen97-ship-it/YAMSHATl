"""
🎥 نظام البث المباشر — Route الموحّد (live.py)
================================================
المعمارية الجديدة (وفق متطلبات المالك):

1. POST /create_live ........... ينشئ سجلًا فقط في DB (status='created').
                                  لا ينشئ غرفة LiveKit هنا.
2. POST /live_room/{id}/token .. ⚡ هنا يتم إنشاء غرفة LiveKit فعلياً
                                  (room_service.create_room) ثم إصدار توكن.
3. POST /end_live/{id} ......... ينهي البث ويغلق الغرفة.
4. GET  /live_room/{id} ........ تفاصيل البث.
5. GET  /live_room/{id}/viewers  قائمة المشاهدين.
6. GET  /live_room/{id}/analytics إحصائيات.
7. POST /live_room/{id}/comment تعليق (يُبث أيضاً عبر Socket).
8. POST /live_room/{id}/gift ... هدية.

السبب الذي كان يجعل البث لا يعمل:
- create_live كان يضع status='active' و is_active=True ويحفظ livekit_room
  لكن لم يستدعِ room_service.create_room → فعند connect() من المتصفح
  لا توجد غرفة حقيقية على سيرفر LiveKit → فشل.
الإصلاح:
- إنشاء الغرفة عبر RoomServiceClient داخل /token قبل إرجاع التوكن.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user, get_current_user_optional, get_db
from app.core.live_store import LiveComment, LiveGift, live_store
from app.core.socket_server import sio
from app.models.live_session import LiveRoomSession
from app.models.user import User
from app.models.user_wallet import UserWallet

logger = logging.getLogger(__name__)

# ───────────────────────────── livekit imports (آمنة) ─────────────────────────
try:
    from livekit import api as livekit_api
except Exception:  # pragma: no cover
    livekit_api = None

try:
    # RoomService (async) — للنسخ الحديثة من livekit-api
    from livekit.api import LiveKitAPI  # type: ignore
except Exception:  # pragma: no cover
    LiveKitAPI = None  # type: ignore

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


# ───────────────────────────── helpers ────────────────────────────────────────
def _utcnow() -> datetime:
    return datetime.utcnow()


def _iso(value: datetime | None) -> str:
    return value.isoformat() if isinstance(value, datetime) else datetime.utcnow().isoformat()


def _is_livekit_configured() -> bool:
    return bool(
        settings.LIVEKIT_URL
        and settings.LIVEKIT_API_KEY
        and settings.LIVEKIT_API_SECRET
        and livekit_api
    )


def _slugify(value: str, fallback: str = 'room') -> str:
    slug = re.sub(r'[^a-zA-Z0-9_-]+', '-', str(value or '').strip()).strip('-').lower()
    return slug or fallback


def _room_name_for(stream_id: str) -> str:
    """اسم غرفة LiveKit ثابت بمعرف البث → سهل التتبع."""
    return f"live_{stream_id}"


def _get_or_create_wallet(db: Session, user_id: int) -> UserWallet:
    wallet = db.query(UserWallet).filter(UserWallet.user_id == user_id).first()
    if wallet is None:
        wallet = UserWallet(user_id=user_id, coin_balance=1000, total_earned=0, total_spent=0)
        db.add(wallet)
        db.flush()
    return wallet


def _find_room_record(db: Session, room_id: str) -> LiveRoomSession | None:
    return db.query(LiveRoomSession).filter(LiveRoomSession.id == str(room_id)).first()


def _require_room(room_id: str, db: Session) -> LiveRoomSession:
    record = _find_room_record(db, room_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Live room not found')
    return record


def _require_host(record: LiveRoomSession, user: User) -> None:
    if record.host_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only the host can perform this action')


def _read_extra_snapshot(record: LiveRoomSession) -> dict:
    try:
        return json.loads(record.extra_json or '{}') if record.extra_json else {}
    except Exception:
        return {}


def _hydrate_runtime_room(record: LiveRoomSession):
    """يبني/يحدّث كائن الذاكرة (live_store) من سجل DB."""
    runtime_room = live_store.get_room(record.id)
    snapshot = _read_extra_snapshot(record)
    thumb = str(snapshot.get('thumbnail_url') or '').strip()

    if runtime_room:
        runtime_room.title = record.title
        runtime_room.livekit_room = record.livekit_room
        runtime_room.livekit_url = record.livekit_url or settings.LIVEKIT_URL or ''
        runtime_room.stream_status = record.stream_status
        runtime_room.active = bool(record.is_active)
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

    runtime_room.thumbnail_url = thumb
    runtime_room.settings = {**DEFAULT_STREAM_SETTINGS, **(getattr(runtime_room, 'settings', None) or {})}
    return runtime_room


def _sync_record_from_runtime(db: Session, record: LiveRoomSession, room) -> None:
    if not room:
        return
    record.viewer_count = max(int(room.viewer_count or 0), len(room.viewers or {}))
    record.peak_viewer_count = max(int(record.peak_viewer_count or 0), int(room.peak_viewer_count or 0), int(record.viewer_count or 0))
    record.hearts_count = int(room.hearts_count or 0)
    record.stream_status = room.stream_status or record.stream_status
    record.last_activity_at = _utcnow()
    record.extra_json = json.dumps({
        'thumbnail_url': getattr(room, 'thumbnail_url', '') or '',
        'comments': [c.__dict__ for c in (room.comments or [])],
        'gifts': [g.__dict__ for g in (room.gifts or [])],
        'viewers': room.viewers or {},
        'settings': getattr(room, 'settings', DEFAULT_STREAM_SETTINGS),
    }, ensure_ascii=False)
    db.add(record)


def _serialize_record(db: Session, record: LiveRoomSession) -> dict:
    room = _hydrate_runtime_room(record)
    payload = live_store.serialize_room(room)
    host_user = db.query(User).filter(User.id == record.host_user_id).first()
    host_avatar = ''
    if host_user:
        try:
            profile = json.loads(host_user.profile_json or '{}') if hasattr(host_user, 'profile_json') else {}
            host_avatar = profile.get('avatar') or getattr(host_user, 'avatar_url', '') or ''
        except Exception:
            host_avatar = ''

    thumb = getattr(room, 'thumbnail_url', '') or ''
    payload.update({
        'id': record.id,
        'host': record.host_username,
        'username': record.host_username,
        'host_username': record.host_username,
        'host_avatar': host_avatar,
        'title': record.title,
        'thumbnail_url': thumb,
        'cover_url': thumb,
        'preview_url': thumb,
        'image_url': thumb,
        'created_at': _iso(record.created_at),
        'started_at': _iso(record.created_at),
        'last_activity_at': _iso(record.last_activity_at),
        'active': bool(record.is_active),
        'is_active': bool(record.is_active),
        'is_public': bool(getattr(record, 'is_public', True)),
        'livekit_room': record.livekit_room,
        'livekit_url': record.livekit_url or settings.LIVEKIT_URL or '',
        'stream_status': record.stream_status,
        'viewer_count': int(record.viewer_count or 0),
        'peak_viewer_count': int(record.peak_viewer_count or 0),
        'hearts_count': int(record.hearts_count or 0),
        'gifts': [g.__dict__ for g in (room.gifts or [])],
        'economy': getattr(room, 'economy', {}) or {},
    })
    return payload


def _emit_socket(event: str, payload: dict, room: str) -> None:
    """إطلاق آمن لحدث Socket.IO من سياق Sync."""
    try:
        coro = sio.emit(event, payload, room=room)
        try:
            asyncio.get_event_loop().create_task(coro)
        except RuntimeError:
            asyncio.run(coro)
    except Exception as exc:  # noqa: BLE001
        logger.debug('socket emit %s failed: %s', event, exc)


# ───────────────────────── 🔑 إنشاء غرفة LiveKit فعلياً ───────────────────────
async def _create_livekit_room_async(room_name: str) -> bool:
    """
    ينشئ غرفة LiveKit على السيرفر باستخدام RoomService.
    يرجع True عند النجاح أو إذا كانت موجودة مسبقاً.
    """
    if LiveKitAPI is None:
        logger.warning('LiveKitAPI client not available; relying on auto-create on join')
        return False

    lkapi = None
    try:
        lkapi = LiveKitAPI(
            url=settings.LIVEKIT_URL,
            api_key=settings.LIVEKIT_API_KEY,
            api_secret=settings.LIVEKIT_API_SECRET,
        )
        try:
            await lkapi.room.create_room(
                livekit_api.CreateRoomRequest(
                    name=room_name,
                    empty_timeout=300,       # تُغلق بعد 5 دقائق بدون مشاركين
                    max_participants=5000,
                )
            )
            logger.info('✅ LiveKit room created: %s', room_name)
            return True
        except Exception as exc:  # noqa: BLE001
            msg = str(exc).lower()
            if 'already' in msg or 'exists' in msg or 'duplicate' in msg:
                logger.info('LiveKit room already exists: %s', room_name)
                return True
            logger.warning('LiveKit create_room failed for %s: %s', room_name, exc)
            return False
    finally:
        if lkapi is not None:
            try:
                await lkapi.aclose()
            except Exception:
                pass


def _ensure_livekit_room(room_name: str) -> bool:
    """نسخة sync — تشغّل create_room بشكل آمن من Route تقليدي."""
    if not _is_livekit_configured():
        return False
    try:
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # نشغّل في loop مستقل
                import nest_asyncio  # type: ignore
                nest_asyncio.apply()
                return loop.run_until_complete(_create_livekit_room_async(room_name))
        except RuntimeError:
            pass
        return asyncio.run(_create_livekit_room_async(room_name))
    except Exception as exc:  # noqa: BLE001
        logger.warning('ensure_livekit_room failed for %s: %s', room_name, exc)
        # LiveKit يدعم auto-create عند Join، لذلك لا نرفع استثناء
        return False


# ───────────────────────────── routes ─────────────────────────────────────────
@router.get('/live_rooms')
def list_active_rooms(db: Session = Depends(get_db)):
    records = (
        db.query(LiveRoomSession)
        .filter(LiveRoomSession.is_active.is_(True))
        .order_by(LiveRoomSession.created_at.desc())
        .all()
    )
    return {
        'success': True,
        'data': [_serialize_record(db, r) for r in records],
    }


@router.get('/live_room/{room_id}')
def get_live_room(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    record = _require_room(room_id, db)
    if not getattr(record, 'is_public', True):
        if not current_user or current_user.id != record.host_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='This stream is private')
    return _serialize_record(db, record)


@router.get('/live_room/{room_id}/viewers')
@router.get('/live/{room_id}/viewers')
def get_room_viewers(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    record = _require_room(room_id, db)
    if not getattr(record, 'is_public', True):
        if not current_user or current_user.id != record.host_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='This stream is private')
    room = _hydrate_runtime_room(record)
    viewers = list((room.viewers or {}).values())
    return {
        'success': True,
        'stream_id': room_id,
        'unique_viewers': len(viewers),
        'viewers': viewers,
    }


@router.get('/live_room/{room_id}/analytics')
@router.get('/live/{room_id}/analytics')
def get_room_analytics(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = _require_room(room_id, db)
    room = _hydrate_runtime_room(record)
    return {
        'success': True,
        'data': {
            'viewer_count': int(record.viewer_count or 0),
            'peak_viewer_count': int(record.peak_viewer_count or 0),
            'hearts_count': int(record.hearts_count or 0),
            'comments_count': len(room.comments or []),
            'gifts_count': len(room.gifts or []),
            'economy': getattr(room, 'economy', {}) or {},
        },
    }


@router.get('/live_comments/{room_id}')
def get_room_comments(
    room_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    record = _require_room(room_id, db)
    room = _hydrate_runtime_room(record)
    comments = [c.__dict__ for c in (room.comments or [])]
    return {'success': True, 'data': comments[-int(limit or 50):]}


# ════════════════════════════ CREATE LIVE ═════════════════════════════════════
@router.post('/live_rooms')
@router.post('/create_live')
def create_live_room(
    title: str = Body('', embed=True),
    description: str = Body('', embed=True),
    thumbnail_url: str = Body('', embed=True),
    is_public: bool = Body(True, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    ينشئ سجل البث في DB فقط (status='created').
    لا ينشئ غرفة LiveKit هنا — يتم ذلك عند /token.
    """
    if not _is_livekit_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Live streaming is not configured (missing LIVEKIT_URL/API_KEY/API_SECRET).',
        )

    room_id = str(uuid4())
    lk_room_name = _room_name_for(room_id)

    try:
        record = LiveRoomSession(
            id=room_id,
            host_user_id=current_user.id,
            host_username=current_user.username,
            title=title or f"{current_user.username}'s Room",
            livekit_room=lk_room_name,
            livekit_url=settings.LIVEKIT_URL,
            is_active=True,                  # ✅ نضعها نشطة فوراً ليتمكن host من طلب /token
            is_public=bool(is_public),
            stream_status='created',         # ✅ سيتحول إلى 'live' عند /token
            created_at=_utcnow(),
            last_activity_at=_utcnow(),
        )
        # حفظ الوصف والصورة في extra_json
        record.extra_json = json.dumps({
            'description': description or '',
            'thumbnail_url': thumbnail_url or '',
        }, ensure_ascii=False)
        db.add(record)
        db.commit()
        db.refresh(record)
    except Exception as exc:
        db.rollback()
        logger.exception('Failed to create live room: %s', exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Failed to create live room: {exc}',
        )

    payload = _serialize_record(db, record)
    return {'success': True, 'data': payload, **payload}


# ════════════════════════════ TOKEN (⚡ ينشئ غرفة LiveKit) ═════════════════════
@router.post('/live_room/{room_id}/token')
@router.post('/live/{room_id}/token')
@router.get('/live_room/{room_id}/token')
@router.get('/live/{room_id}/token')
def get_live_token(
    room_id: str,
    payload: dict | None = Body(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    🔑 إصدار توكن LiveKit + إنشاء غرفة LiveKit فعلياً (إن لم تكن موجودة).

    هذا هو المكان الوحيد الذي تُنشأ فيه الغرفة على سيرفر LiveKit.
    إن فشل create_room، نعتمد على auto-create عند join (LiveKit يدعمها).
    """
    record = _require_room(room_id, db)
    if not record.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Room is not active')

    if not _is_livekit_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Live streaming is not configured (missing LIVEKIT_URL/API_KEY/API_SECRET).',
        )

    if not record.is_public and record.host_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='This stream is private')

    is_host = record.host_user_id == current_user.id
    identity_value = str(current_user.username or f"user-{current_user.id}")

    # 🔑 (1) إنشاء غرفة LiveKit فعلياً — هذه هي النقطة المفقودة سابقاً
    _ensure_livekit_room(record.livekit_room)

    # 🔑 (2) إصدار التوكن (مع توافق آمن لكل إصدارات livekit-api)
    try:
        jwt_token: str = ''
        last_error: Exception | None = None

        # --- API الحديث (livekit-api >= 0.5 / 1.x) ---
        try:
            VideoGrantsCls = getattr(livekit_api, 'VideoGrants', None) or getattr(livekit_api, 'VideoGrant', None)
            if VideoGrantsCls is None:
                raise AttributeError('VideoGrants/VideoGrant not found in livekit_api')

            grants = VideoGrantsCls(
                room_join=True,
                room=record.livekit_room,
                can_publish=is_host,        # المضيف فقط ينشر
                can_subscribe=True,         # الجميع يشاهد
                can_publish_data=True,      # data tracks (للأحداث الخفيفة)
            )
            token_builder = livekit_api.AccessToken(
                settings.LIVEKIT_API_KEY,
                settings.LIVEKIT_API_SECRET,
            )
            if hasattr(token_builder, 'with_identity'):
                token_builder = token_builder.with_identity(identity_value).with_name(identity_value)
                if hasattr(token_builder, 'with_grants'):
                    token_builder = token_builder.with_grants(grants)
                elif hasattr(token_builder, 'with_video_grants'):
                    token_builder = token_builder.with_video_grants(grants)
                else:
                    raise AttributeError('AccessToken missing with_grants/with_video_grants')
                if hasattr(token_builder, 'with_ttl'):
                    try:
                        token_builder = token_builder.with_ttl(timedelta(hours=6))
                    except Exception:
                        pass
                jwt_token = token_builder.to_jwt()
            else:
                raise AttributeError('AccessToken does not support fluent builder')
        except Exception as new_api_err:  # noqa: BLE001
            last_error = new_api_err
            logger.warning('LiveKit new-API token build failed, falling back: %s', new_api_err)

            # --- fallback لـAPI القديم ---
            try:
                VideoGrantOld = getattr(livekit_api, 'VideoGrant', None)
                if VideoGrantOld is None:
                    raise AttributeError('Legacy VideoGrant not available')
                grant = VideoGrantOld(
                    room_join=True,
                    room=record.livekit_room,
                    can_publish=is_host,
                    can_subscribe=True,
                    can_publish_data=True,
                )
                legacy_token = livekit_api.AccessToken(
                    settings.LIVEKIT_API_KEY,
                    settings.LIVEKIT_API_SECRET,
                    identity=identity_value,
                    name=identity_value,
                )
                if hasattr(legacy_token, 'add_grant'):
                    legacy_token.add_grant(grant)
                jwt_token = legacy_token.to_jwt()
            except Exception as legacy_err:  # noqa: BLE001
                logger.exception('LiveKit legacy-API token build also failed: %s', legacy_err)
                raise legacy_err from last_error

        if not jwt_token:
            raise RuntimeError('LiveKit token generation returned empty token')
    except Exception as exc:  # noqa: BLE001
        logger.exception('Failed to generate LiveKit token for room %s: %s', room_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Failed to generate LiveKit token: {exc}',
        )

    # 🔑 (3) عند طلب التوكن أول مرة من host → نحوّل status إلى 'live'
    try:
        if is_host and record.stream_status != 'live':
            record.stream_status = 'live'
            record.last_activity_at = _utcnow()
            db.add(record)
            db.commit()
    except Exception:
        db.rollback()

    return {
        'success': True,
        'data': {
            'token': jwt_token,
            'livekit_url': record.livekit_url or settings.LIVEKIT_URL or '',
            'livekit_room': record.livekit_room,
            'role': 'host' if is_host else 'viewer',
            'identity': identity_value,
            'room_id': record.id,
        },
        # حقول مسطحة للتوافق العكسي مع الفرونت القديم
        'token': jwt_token,
        'livekit_url': record.livekit_url or settings.LIVEKIT_URL or '',
        'livekit_room': record.livekit_room,
        'role': 'host' if is_host else 'viewer',
        'identity': identity_value,
        'room_id': record.id,
    }


# ════════════════════════════ END LIVE ════════════════════════════════════════
@router.post('/live_room/{room_id}/end')
@router.post('/end_live/{room_id}')
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

    # حذف الغرفة من LiveKit (best-effort)
    async def _delete_lk_room():
        if LiveKitAPI is None:
            return
        lkapi = None
        try:
            lkapi = LiveKitAPI(
                url=settings.LIVEKIT_URL,
                api_key=settings.LIVEKIT_API_KEY,
                api_secret=settings.LIVEKIT_API_SECRET,
            )
            await lkapi.room.delete_room(livekit_api.DeleteRoomRequest(room=record.livekit_room))
        except Exception as exc:  # noqa: BLE001
            logger.debug('delete_room failed for %s: %s', record.livekit_room, exc)
        finally:
            if lkapi is not None:
                try:
                    await lkapi.aclose()
                except Exception:
                    pass

    try:
        asyncio.run(_delete_lk_room())
    except RuntimeError:
        try:
            asyncio.get_event_loop().create_task(_delete_lk_room())
        except Exception:
            pass

    try:
        live_store.remove_room(room_id)
    except Exception as exc:  # noqa: BLE001
        logger.warning('live_store.remove_room failed for %s: %s', room_id, exc)

    _emit_socket('live_ended', {
        'room_id': room_id,
        'livekit_room': record.livekit_room,
        'ended_at': _iso(record.ended_at),
    }, room=record.livekit_room)
    _emit_socket('live_ended', {
        'room_id': room_id,
        'livekit_room': record.livekit_room,
        'ended_at': _iso(record.ended_at),
    }, room=room_id)

    return {'success': True, 'status': 'success', 'data': {'room_id': room_id, 'ended_at': _iso(record.ended_at)}}


# ════════════════════════════ COMMENTS ════════════════════════════════════════
@router.post('/live_room/{room_id}/comment')
@router.post('/live/{room_id}/comment')
def add_live_comment(
    room_id: str,
    content: str = Body('', embed=True),
    text: str = Body('', embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = _require_room(room_id, db)
    if not record.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Room is not active')

    final_text = (content or text or '').strip()
    if not final_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Comment cannot be empty')

    room = _hydrate_runtime_room(record)
    comment = LiveComment(
        id=str(uuid4()),
        room_id=room_id,
        user=current_user.username,
        text=final_text,
        created_at=_iso(_utcnow()),
        user_id=current_user.id,
        username=current_user.username,
        content=final_text,
    )
    if not hasattr(room, 'comments') or room.comments is None:
        room.comments = []
    room.comments.append(comment)

    try:
        _sync_record_from_runtime(db, record, room)
        db.commit()
    except Exception:
        db.rollback()

    payload = {**comment.__dict__, 'room_id': room_id}
    for evt in ('new_comment', 'live_comment'):
        _emit_socket(evt, payload, room=room_id)
        _emit_socket(evt, payload, room=record.livekit_room)

    return {'success': True, 'data': comment.__dict__}


# ════════════════════════════ GIFTS ═══════════════════════════════════════════
@router.post('/live_room/{room_id}/gift')
@router.post('/live/{room_id}/gift')
def send_live_gift(
    room_id: str,
    payload: dict | str | int | None = Body(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = _require_room(room_id, db)
    if not record.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Room is not active')

    normalized = payload if isinstance(payload, dict) else {}
    if isinstance(payload, (str, int)):
        normalized = {'gift_id': str(payload)}

    gift_id = str(normalized.get('gift_id') or normalized.get('id') or normalized.get('name') or 'default').strip() or 'default'
    gift_name = str(normalized.get('name') or gift_id).strip() or gift_id
    try:
        gift_amount = max(int(normalized.get('amount') or 1), 1)
    except (TypeError, ValueError):
        gift_amount = 1
    try:
        unit_price = max(int(normalized.get('price') or 10), 1)
    except (TypeError, ValueError):
        unit_price = 10
    total_cost = unit_price * gift_amount

    sender_wallet = _get_or_create_wallet(db, current_user.id)
    receiver_wallet = _get_or_create_wallet(db, record.host_user_id)
    if int(sender_wallet.coin_balance or 0) < total_cost:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='رصيد المحفظة غير كافٍ لإرسال الهدية')

    sender_wallet.coin_balance = int(sender_wallet.coin_balance or 0) - total_cost
    sender_wallet.total_spent = int(sender_wallet.total_spent or 0) + total_cost
    host_earnings = int(total_cost * 0.8)
    receiver_wallet.coin_balance = int(receiver_wallet.coin_balance or 0) + host_earnings
    receiver_wallet.total_earned = int(receiver_wallet.total_earned or 0) + host_earnings

    room = _hydrate_runtime_room(record)
    gift = LiveGift(
        id=str(uuid4()),
        room_id=room_id,
        user=current_user.username,
        gift_name=gift_name,
        coins=total_cost,
        created_at=_iso(_utcnow()),
        user_id=current_user.id,
        username=current_user.username,
        gift_id=gift_id,
        amount=gift_amount,
    )
    if not hasattr(room, 'gifts') or room.gifts is None:
        room.gifts = []
    room.gifts.append(gift)

    economy = getattr(room, 'economy', None) or {}
    top = dict(economy.get('top_gifters') or {})
    top[current_user.username] = int(top.get(current_user.username) or 0) + total_cost
    room.economy = {
        **economy,
        'total_gifts': int(economy.get('total_gifts') or 0) + gift_amount,
        'total_coins_earned': int(economy.get('total_coins_earned') or 0) + host_earnings,
        'gross_gift_coins': int(economy.get('gross_gift_coins') or 0) + total_cost,
        'top_gifters': top,
    }

    _sync_record_from_runtime(db, record, room)
    db.commit()

    _emit_socket('new_gift', {
        'room_id': room_id,
        'gift': gift.__dict__,
        'economy': room.economy,
    }, room=room_id)
    _emit_socket('new_gift', {
        'room_id': room_id,
        'gift': gift.__dict__,
        'economy': room.economy,
    }, room=record.livekit_room)

    return {
        'success': True,
        'data': {
            'gift': gift.__dict__,
            'wallet': {
                'sender_balance': int(sender_wallet.coin_balance or 0),
                'host_earnings': host_earnings,
                'total_cost': total_cost,
            },
            'economy': room.economy,
        },
    }


# ════════════════════════════ VIEWERS (add/remove) ════════════════════════════
@router.post('/live_room/{room_id}/add-viewer')
def add_viewer(
    room_id: str,
    payload: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = _require_room(room_id, db)
    room = _hydrate_runtime_room(record)
    viewer = {
        'user_id': current_user.id,
        'username': current_user.username,
        'platform': str(payload.get('platform') or 'web'),
        'joined_at': _iso(_utcnow()),
    }
    room.viewers = room.viewers or {}
    room.viewers[str(current_user.id)] = viewer
    room.viewer_count = len(room.viewers)
    room.peak_viewer_count = max(int(room.peak_viewer_count or 0), room.viewer_count)
    _sync_record_from_runtime(db, record, room)
    db.commit()

    _emit_socket('viewer_joined', {'room_id': room_id, 'viewer': viewer, 'viewer_count': room.viewer_count}, room=room_id)
    return {'success': True, 'data': {'viewer': viewer, 'viewer_count': room.viewer_count}}


@router.post('/live_room/{room_id}/remove-viewer')
def remove_viewer(
    room_id: str,
    payload: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = _require_room(room_id, db)
    room = _hydrate_runtime_room(record)
    uid = str(payload.get('user_id') or current_user.id)
    if room.viewers and uid in room.viewers:
        room.viewers.pop(uid, None)
        room.viewer_count = len(room.viewers)
        _sync_record_from_runtime(db, record, room)
        db.commit()
    _emit_socket('viewer_left', {'room_id': room_id, 'user_id': uid, 'viewer_count': room.viewer_count}, room=room_id)
    return {'success': True, 'data': {'viewer_count': room.viewer_count}}


# ════════════════════════════ RECORDING (placeholder) ═════════════════════════
@router.post('/live_room/{room_id}/recording/{action}')
def control_recording(
    room_id: str,
    action: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = _require_room(room_id, db)
    _require_host(record, current_user)
    action = (action or '').strip().lower()
    if action not in ('start', 'stop'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid action')
    record.recording_status = 'recording' if action == 'start' else 'idle'
    db.commit()
    return {'success': True, 'data': {'room_id': room_id, 'recording_status': record.recording_status}}
