import json
import logging
import re
from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

logger = logging.getLogger(__name__)

from app.core.config import settings
from app.core.dependencies import get_current_user, get_current_user_optional, get_db
from app.core.live_store import LiveComment, LiveGift, live_store
from app.core.socket_server import sio
from app.models.live_session import LiveRoomSession
from app.models.user import User
from app.models.user_wallet import UserWallet

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


# ✅ FIX (2026-06-10) — السبب الجذري لمشكلة "المشاهد لا يرى البث":
# كنا ننشئ صفّ غرفة في DB فقط بدون إنشاء غرفة حقيقية على سيرفر LiveKit،
# فإذا تأخّر المضيف في النشر أو فشل publish بسبب race، يحاول المشاهد الانضمام
# لغرفة افتراضية فارغة → لا يصله TrackPublished/TrackSubscribed → شاشة بيضاء.
# الحل: استدعاء RoomService.create_room بشكل صريح وقت إنشاء الغرفة لضمان وجودها.
def _ensure_livekit_room(room_name: str) -> None:
    """إنشاء غرفة LiveKit حقيقية على السيرفر إن لم تكن موجودة. آمن للاستدعاء المتكرر."""
    if not _is_livekit_configured() or not room_name:
        return
    try:
        import asyncio
        from livekit.api import LiveKitAPI, CreateRoomRequest

        async def _do_create():
            lkapi = LiveKitAPI(
                settings.LIVEKIT_URL.replace('ws://', 'http://').replace('wss://', 'https://'),
                settings.LIVEKIT_API_KEY,
                settings.LIVEKIT_API_SECRET,
            )
            try:
                await lkapi.room.create_room(CreateRoomRequest(
                    name=room_name,
                    empty_timeout=300,           # 5 دقائق idle قبل الإغلاق التلقائي
                    max_participants=200,        # سقف معقول للجمهور
                ))
            finally:
                try:
                    await lkapi.aclose()
                except Exception:
                    pass

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # FastAPI sync route → نشغّله في loop جديد بثريد
                import threading
                err: list[Exception] = []
                def _runner():
                    try:
                        asyncio.run(_do_create())
                    except Exception as e:  # noqa: BLE001
                        err.append(e)
                t = threading.Thread(target=_runner, daemon=True)
                t.start()
                t.join(timeout=5)
                if err:
                    raise err[0]
            else:
                asyncio.run(_do_create())
        except RuntimeError:
            asyncio.run(_do_create())
    except Exception as exc:  # noqa: BLE001
        # 409 (الغرفة موجودة مسبقاً) ليس خطأً — نتجاهله بصمت
        msg = str(exc).lower()
        if 'already exists' in msg or '409' in msg or 'duplicate' in msg:
            return
        # ✅ FIX (2026-06-11): رفع مستوى اللوغ إلى ERROR مع تفاصيل كافية
        # لأن فشل إنشاء الغرفة يؤدي مباشرة إلى "المشاهد يرى صفحة بلا صورة".
        logger.error(
            'LiveKit ensure_room FAILED for room=%s (viewers will see blank screen!): %s',
            room_name, exc,
        )


def _get_or_create_wallet(db: Session, user_id: int) -> UserWallet:
    wallet = db.query(UserWallet).filter(UserWallet.user_id == user_id).first()
    if wallet is None:
        wallet = UserWallet(user_id=user_id, coin_balance=1000, total_earned=0, total_spent=0)
        db.add(wallet)
        db.flush()
    return wallet


def _find_room_record(db: Session, room_id: str) -> LiveRoomSession | None:
    """
    ✅ FIX (2026-06-10): البحث عن غرفة البث بصرامة معتدلة:
    - تنظيف الـ ID (whitespace + lower-case للـ UUID).
    - محاولة المطابقة الدقيقة أولاً، ثم case-insensitive.
    - السبب: بعض عملاء الموبايل يرسلون UUID بأحرف كبيرة → 404 خاطئ.
    """
    if not room_id:
        return None
    cleaned = str(room_id).strip()
    if not cleaned:
        return None
    # محاولة 1: مطابقة دقيقة (الحالة العادية)
    record = db.query(LiveRoomSession).filter(LiveRoomSession.id == cleaned).first()
    if record:
        return record
    # محاولة 2: case-insensitive (للحالة التي يرسل فيها العميل UUID بأحرف مختلفة)
    try:
        from sqlalchemy import func as _sa_func
        record = (
            db.query(LiveRoomSession)
            .filter(_sa_func.lower(LiveRoomSession.id) == cleaned.lower())
            .first()
        )
        if record:
            return record
    except Exception:  # noqa: BLE001
        pass
    return None


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
        # حماية: بعض التعليقات/الهدايا القديمة في extra_json قد تحتوي حقولاً إضافية/ناقصة
        def _safe_build(cls, payload):
            items = []
            for item in payload or []:
                if not isinstance(item, dict):
                    continue
                try:
                    items.append(cls(**item))
                except TypeError:
                    # فلترة الحقول غير المعروفة
                    try:
                        valid_keys = set(cls.__dataclass_fields__.keys())
                        filtered = {k: v for k, v in item.items() if k in valid_keys}
                        # ضمان وجود الحقول الإلزامية
                        filtered.setdefault('id', item.get('id') or str(uuid4()))
                        filtered.setdefault('room_id', item.get('room_id', ''))
                        items.append(cls(**filtered))
                    except Exception as exc:  # noqa: BLE001
                        logger.warning('Skipped malformed %s snapshot entry: %s', cls.__name__, exc)
                except Exception as exc:  # noqa: BLE001
                    logger.warning('Skipped malformed %s entry: %s', cls.__name__, exc)
            return items

        snapshot_comments = _safe_build(LiveComment, snapshot.get('comments', []))
        if snapshot_comments and not getattr(runtime_room, 'comments', None):
            runtime_room.comments = snapshot_comments
        elif snapshot_comments:
            existing_comment_ids = {str(comment.id) for comment in (runtime_room.comments or [])}
            runtime_room.comments.extend([comment for comment in snapshot_comments if str(comment.id) not in existing_comment_ids])

        snapshot_gifts = _safe_build(LiveGift, snapshot.get('gifts', []))
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
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """
    الحصول على البثوث النشطة.
    - السماح بالوصول للبثوث العامة بدون تسجيل دخول.
    - إذا كان المستخدم مسجل دخول، يرى البثوث العامة والخاصة به.
    - يدعم الحد والإزاحة بدون إرجاع 500 عند فشل عنصر واحد.
    """
    try:
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

        records = (
            query.order_by(LiveRoomSession.last_activity_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        rooms = []
        for record in records:
            try:
                rooms.append(_serialize_record(db, record))
            except Exception as exc:  # noqa: BLE001
                logger.exception('Failed to serialize live room %s: %s', record.id, exc)
                # بدل الفشل بـ 500 ، أرجع بطاقة مبسّطة
                try:
                    rooms.append({
                        'id': record.id,
                        'host': record.host_username,
                        'username': record.host_username,
                        'host_username': record.host_username,
                        'title': record.title or '',
                        'thumbnail_url': '',
                        'created_at': _iso(record.created_at),
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
                        'comments_count': 0,
                        'recording': {
                            'status': record.recording_status or 'idle',
                            'url': record.recording_url,
                        },
                        'settings': DEFAULT_STREAM_SETTINGS,
                        'livekit_configured': _is_livekit_configured(),
                    })
                except Exception:
                    continue
        return rooms
    except Exception as exc:  # noqa: BLE001
        logger.exception('get_live_rooms failed: %s', exc)
        # إرجاع قائمة فارغة بدل 500 حتى لا تفشل واجهة الفيد،
        # والبث الجديد يبقى قابلاً للإنشاء.
        try:
            db.rollback()
        except Exception:
            pass
        return []


@router.get('/live_room/{room_id}')
def get_live_room(
    room_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user_optional)
):
    """
    الحصول على تفاصيل البث.

    ✅ FIX (2026-06-10):
    - إذا لم يوجد البث فعلاً → 404.
    - إذا وجد ولكنه انتهى (is_active=False) → نعيد البيانات مع علم is_active=false و stream_status='ended'.
      هذا لأن البوستات المرتبطة بالبث تبقى في الفيد بعد انتهائه،
      ولا نريد 404 spam في polling الفرونت.
    """
    record = _find_room_record(db, room_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')

    if not getattr(record, 'is_public', True):
        if not current_user or current_user.id != record.host_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='This stream is private')

    payload = _serialize_record(db, record)
    # ✅ تأكيد علم البث المنتهي للفرونت
    if not record.is_active:
        try:
            payload['is_active'] = False
            payload['active'] = False
            payload['stream_status'] = 'ended'
            payload['live_ended'] = True
        except Exception:
            pass
    return payload


@router.get('/live_comments/{room_id}')
def get_live_comments(
    room_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user_optional)
):
    """
    الحصول على التعليقات في البث.

    ✅ FIX (2026-06-10): إذا انتهى البث، نرجع قائمة فارغة بدل 404
    حتى لا تتعطل صفحة عرض البث بعد انتهائه.
    """
    record = _find_room_record(db, room_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')

    if not getattr(record, 'is_public', True):
        if not current_user or current_user.id != record.host_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='This stream is private')

    if not record.is_active:
        return []

    room = _hydrate_runtime_room(record)
    return [comment.__dict__ for comment in (room.comments or [])]


@router.get('/live_room/{room_id}/analytics')
@router.get('/live/{room_id}/analytics')
def get_stream_analytics(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """الحصول على إحصائيات البث.

    ✅ FIX (2026-06-10): إذا انتهى البث، نرجع الإحصائيات الأخيرة مع علم ended
    بدل 404 حتى لا تتوقف polling الفرونت، وللاحتفاظ بالأرقام للعرض في البوست المحفوظ.
    """
    record = _find_room_record(db, room_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Room not found')

    if not getattr(record, 'is_public', True):
        if not current_user or current_user.id != record.host_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='This stream is private')

    # إذا انتهى البث، نرجع الأرقام المحفوظة في السجل فقط (بدون hydrate)
    if not record.is_active:
        return {
            'stream_id': record.id,
            'viewer_count': 0,  # لا يوجد مشاهدون حالياً
            'viewers_count': 0,
            'unique_viewers': int(record.peak_viewer_count or 0),
            'peak_viewer_count': int(record.peak_viewer_count or 0),
            'hearts_count': int(record.hearts_count or 0),
            'comments_count': 0,
            'gifts_count': 0,
            'is_active': False,
            'stream_status': 'ended',
        }

    room = _hydrate_runtime_room(record)
    return {
        'stream_id': room.id,
        'viewer_count': room.viewer_count or 0,
        'viewers_count': room.viewer_count or 0,
        'unique_viewers': room.viewer_count or 0,
        'peak_viewer_count': room.peak_viewer_count or 0,
        'hearts_count': room.hearts_count or 0,
        'comments_count': len(room.comments or []),
        'gifts_count': len(room.gifts or []),
        'is_active': True,
        'stream_status': 'live',
    }


@router.get('/live_room/{room_id}/viewers')
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
@router.post('/create_live')
def create_live_room(
    title: str = Body('', embed=True),
    is_public: bool = Body(True, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _is_livekit_configured():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail='Live streaming is not configured')

    room_id = str(uuid4())
    lk_room_name = _room_name_for(current_user.username)

    try:
        record = LiveRoomSession(
            id=room_id,
            host_user_id=current_user.id,
            host_username=current_user.username,
            title=title or f"{current_user.username}'s Room",
            livekit_room=lk_room_name,
            livekit_url=settings.LIVEKIT_URL,
            is_active=True,
            is_public=bool(is_public),
            stream_status='active',
            created_at=_utcnow(),
            last_activity_at=_utcnow(),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
    except Exception as exc:
        db.rollback()
        logger.exception('Failed to create live room: %s', exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Failed to create live room: {exc}'
        )

    # ✅ FIX (2026-06-10/11): إنشاء غرفة LiveKit الحقيقية الآن
    # (قبلاً كنا نعتمد lazy-create، مما تسبب في فشل اتصال المشاهد عند سرعة الانضمام).
    # تحديث 2026-06-11: إذا فشل إنشاء الغرفة نجعل stream_status='setup_required'
    # حتى لا يظهر البث كـactive للمشاهدين.
    ensure_ok = True
    try:
        _ensure_livekit_room(lk_room_name)
    except Exception as room_exc:  # noqa: BLE001
        ensure_ok = False
        logger.error('Failed to ensure LiveKit room for %s: %s', lk_room_name, room_exc)

    if not ensure_ok:
        try:
            record.stream_status = 'setup_required'
            db.add(record)
            db.commit()
            db.refresh(record)
        except Exception:
            db.rollback()

    return _serialize_record(db, record)


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
    🔑 إصدار توكن LiveKit للبث المباشر.
    إصلاحات:
    - دعم كل من /live/ و /live_room/ (المسارين معاً) لمنع 404.
    - دعم GET و POST لمنع فشل بعض عملاء الموبايل.
    - إرجاع livekit_url و livekit_room ضمن الاستجابة (الفرونت يحتاجها).
    - معالجة آمنة لفشل livekit + رسائل خطأ أوضح بدل 500 صامت.
    """
    record = _require_room(room_id, db)
    if not record.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Room is not active')

    if not _is_livekit_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Live streaming is not configured (missing LIVEKIT_URL/API_KEY/API_SECRET).',
        )

    # التحقق من الصلاحيات للبثوث الخاصة
    if not record.is_public and record.host_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='This stream is private')

    is_host = record.host_user_id == current_user.id
    identity_value = str(current_user.username or f"user-{current_user.id}")

    # ✅ FIX (2026-06-10): ضمان وجود الغرفة على سيرفر LiveKit قبل إصدار التوكن
    # (تكرار آمن — يتجاهل 409 إذا كانت الغرفة موجودة بالفعل).
    _ensure_livekit_room(record.livekit_room)

    # ✅ FIX (يحل خطأ 500 على /token وفشل فتح كاميرا البث):
    #   livekit-api 1.x غيّر الـAPI بالكامل:
    #     - VideoGrant  → VideoGrants  (بالجمع)
    #     - AccessToken(key, secret, identity=..., name=...) → AccessToken(key, secret).with_identity(...).with_name(...)
    #     - add_grant() → with_grants()
    #   نجرب API الجديد أولاً، وإذا فشل نسقط لـAPI القديم (توافق مع إصدارات السيرفر الأقدم).
    try:
        jwt_token: str = ''
        last_error: Exception | None = None

        # --- (1) الـAPI الحديث (livekit-api >= 0.5 / 1.x) ---
        try:
            VideoGrantsCls = getattr(livekit_api, 'VideoGrants', None) or getattr(livekit_api, 'VideoGrant', None)
            if VideoGrantsCls is None:
                raise AttributeError('VideoGrants/VideoGrant not found in livekit_api')

            grants = VideoGrantsCls(
                room_join=True,
                room=record.livekit_room,
                can_publish=is_host,
                can_subscribe=True,
                can_publish_data=True,
            )
            token_builder = livekit_api.AccessToken(
                settings.LIVEKIT_API_KEY,
                settings.LIVEKIT_API_SECRET,
            )
            # builder pattern (fluent) — الأسلوب الصحيح في livekit-api 1.x
            if hasattr(token_builder, 'with_identity'):
                token_builder = token_builder.with_identity(identity_value).with_name(identity_value)
                if hasattr(token_builder, 'with_grants'):
                    token_builder = token_builder.with_grants(grants)
                elif hasattr(token_builder, 'with_video_grants'):
                    token_builder = token_builder.with_video_grants(grants)
                else:
                    raise AttributeError('AccessToken missing with_grants/with_video_grants')
                # صلاحية التوكن (اختياري)
                try:
                    from datetime import timedelta
                    if hasattr(token_builder, 'with_ttl'):
                        token_builder = token_builder.with_ttl(timedelta(hours=6))
                except Exception:  # noqa: BLE001
                    pass
                jwt_token = token_builder.to_jwt()
            else:
                raise AttributeError('AccessToken does not support fluent builder')
        except Exception as new_api_err:  # noqa: BLE001
            last_error = new_api_err
            logger.warning('LiveKit new-API token build failed, falling back: %s', new_api_err)

            # --- (2) fallback لـAPI القديم (livekit-server-sdk) ---
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

    # ✅ FIX (2026-06-11): ضمان إرجاع livekit_url و livekit_room غير فارغين
    # على الإطلاق — وإلاّ الفرونت يعرض "جارٍ الاتصال بالبث..." بلا فيديو.
    # كما نستخدم فرصة أخيرة لتصحيح أي سجل قديم حفظ NULL
    # قبل إصلاح الباك-إند.
    effective_url = (record.livekit_url or settings.LIVEKIT_URL or '').strip()
    effective_room = (record.livekit_room or '').strip()
    if not effective_url or not effective_room:
        logger.error(
            '[live/token] empty url/room for room_id=%s url=%r room=%r',
            room_id, effective_url, effective_room,
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='LiveKit URL is not configured on the server. Set LIVEKIT_URL.',
        )

    # تحديث السجل إن كان livekit_url فارغاً (باك-فيل)
    if not record.livekit_url and settings.LIVEKIT_URL:
        try:
            record.livekit_url = settings.LIVEKIT_URL
            db.add(record)
            db.commit()
        except Exception:
            db.rollback()

    return {
        'token': jwt_token,
        'livekit_url': effective_url,
        'livekit_room': effective_room,
        'url': effective_url,           # alias لتوافق عميل الموبايل
        'room': effective_room,         # alias لتوافق عميل الموبايل
        'role': 'host' if is_host else 'viewer',
        'identity': str(current_user.username or f"user-{current_user.id}"),
        'room_id': record.id,
    }


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

    try:
        live_store.remove_room(room_id)
    except Exception as exc:  # noqa: BLE001
        logger.warning('live_store.remove_room failed for %s: %s', room_id, exc)
    return {'status': 'success'}


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

    normalized_payload = payload if isinstance(payload, dict) else {}
    if isinstance(payload, (str, int)):
        normalized_payload = {'gift_id': str(payload)}

    gift_id = str(
        normalized_payload.get('gift_id')
        or normalized_payload.get('id')
        or normalized_payload.get('name')
        or 'default'
    ).strip() or 'default'
    gift_name = str(normalized_payload.get('name') or gift_id).strip() or gift_id

    raw_amount = normalized_payload.get('amount', 1)
    try:
        gift_amount = max(int(raw_amount or 1), 1)
    except (TypeError, ValueError):
        gift_amount = 1

    raw_unit_price = normalized_payload.get('price')
    try:
        unit_price = max(int(raw_unit_price or 10), 1)
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
    top_gifters = dict(economy.get('top_gifters') or {})
    current_sender_total = int(top_gifters.get(current_user.username) or 0) + total_cost
    top_gifters[current_user.username] = current_sender_total
    room.economy = {
        **economy,
        'total_gifts': int(economy.get('total_gifts') or 0) + gift_amount,
        'total_coins_earned': int(economy.get('total_coins_earned') or 0) + host_earnings,
        'gross_gift_coins': int(economy.get('gross_gift_coins') or 0) + total_cost,
        'top_gifters': top_gifters,
    }

    _sync_record_from_runtime(db, record, room)
    db.commit()

    return {
        'status': 'success',
        'gift': gift.__dict__,
        'wallet': {
            'sender_balance': int(sender_wallet.coin_balance or 0),
            'receiver_balance': int(receiver_wallet.coin_balance or 0),
            'host_earnings': host_earnings,
            'total_cost': total_cost,
        },
        'economy': room.economy,
    }


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
    
    # Notify via Socket.IO
    try:
        sio.emit('live_comment', comment.__dict__, room=record.livekit_room)
    except:
        pass
        
    return {'status': 'success', 'comment': comment.__dict__}


@router.post('/live_room/{room_id}/settings')
def update_live_room_settings(
    room_id: str,
    payload: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """تحديث إعدادات البث الأساسية مثل الكاميرا والمايك والجودة."""
    record = _require_room(room_id, db)
    _require_host(record, current_user)

    room = _hydrate_runtime_room(record)
    room.settings = {
        **DEFAULT_STREAM_SETTINGS,
        **(getattr(room, 'settings', None) or {}),
    }

    field_map = {
        'camera_enabled': 'camera_enabled',
        'microphone_enabled': 'microphone_enabled',
        'video_bitrate': 'video_bitrate',
        'audio_bitrate': 'audio_bitrate',
        'quality': 'quality',
    }
    for source_key, target_key in field_map.items():
        if source_key in payload:
            room.settings[target_key] = payload.get(source_key)

    room.last_activity_at = _iso(_utcnow())
    _sync_record_from_runtime(db, record, room)
    db.commit()

    return {
        'status': 'success',
        'room_id': room_id,
        'settings': room.settings,
    }


@router.post('/live_room/{room_id}/recording/{action}')
def update_live_recording_status(
    room_id: str,
    action: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """بديل متوافق مع الواجهة القديمة لبدء/إيقاف التسجيل."""
    record = _require_room(room_id, db)
    _require_host(record, current_user)

    room = _hydrate_runtime_room(record)
    normalized_action = str(action or '').strip().lower()
    if normalized_action == 'start':
        room.recording_status = 'recording'
    elif normalized_action == 'pause':
        room.recording_status = 'paused'
    else:
        room.recording_status = 'idle'
        if normalized_action == 'stop':
            room.recording_url = room.recording_url or ''

    room.last_activity_at = _iso(_utcnow())
    _sync_record_from_runtime(db, record, room)
    db.commit()

    return {
        'status': 'success',
        'room_id': room_id,
        'recording': {
            'status': room.recording_status,
            'url': room.recording_url,
        },
    }


@router.post('/live_room/{room_id}/add-viewer')
def add_stream_viewer(
    room_id: str,
    payload: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
):
    """Alias قديم لإضافة/تحديث مشاهد داخل الذاكرة."""
    record = _require_room(room_id, db)
    if not record.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Room is not active')

    room = _hydrate_runtime_room(record)
    viewer_user_id = payload.get('user_id') or getattr(current_user, 'id', None) or 0
    viewer_username = str(payload.get('username') or getattr(current_user, 'username', '') or f'user-{viewer_user_id}').strip()
    viewer_key = f'viewer:{viewer_user_id or viewer_username}'
    room.viewers[viewer_key] = {
        'sid': viewer_key,
        'user_id': viewer_user_id,
        'username': viewer_username,
        'is_host': False,
        'platform': str(payload.get('platform') or 'web'),
        'device_type': str(payload.get('device_type') or 'browser'),
        'joined_at': _iso(_utcnow()),
    }
    room.viewer_count = len(room.viewers)
    room.peak_viewer_count = max(int(room.peak_viewer_count or 0), int(room.viewer_count or 0))
    room.last_activity_at = _iso(_utcnow())
    _sync_record_from_runtime(db, record, room)
    db.commit()
    return {'status': 'success', 'viewers': _serialize_viewers(room)}


@router.post('/live_room/{room_id}/remove-viewer')
def remove_stream_viewer(
    room_id: str,
    payload: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Alias قديم لإزالة مشاهد من القائمة."""
    record = _require_room(room_id, db)
    _require_host(record, current_user)

    room = _hydrate_runtime_room(record)
    target_user_id = str(payload.get('user_id') or '').strip()
    target_keys = [key for key, value in (room.viewers or {}).items() if str(value.get('user_id') or '') == target_user_id]
    for key in target_keys:
        room.viewers.pop(key, None)
    room.viewer_count = len(room.viewers)
    room.last_activity_at = _iso(_utcnow())
    _sync_record_from_runtime(db, record, room)
    db.commit()
    return {'status': 'success', 'viewers': _serialize_viewers(room)}


@router.post('/live_room/{room_id}/mute')
def mute_stream_viewer(
    room_id: str,
    payload: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = _require_room(room_id, db)
    _require_host(record, current_user)
    room = _hydrate_runtime_room(record)
    target_user_id = str(payload.get('user_id') or '').strip()
    if target_user_id:
        room.muted_users.add(target_user_id)
    _sync_record_from_runtime(db, record, room)
    db.commit()
    return {'status': 'success', 'muted_users': list(room.muted_users)}


@router.post('/live_room/{room_id}/unmute')
def unmute_stream_viewer(
    room_id: str,
    payload: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = _require_room(room_id, db)
    _require_host(record, current_user)
    room = _hydrate_runtime_room(record)
    target_user_id = str(payload.get('user_id') or '').strip()
    if target_user_id:
        room.muted_users.discard(target_user_id)
    _sync_record_from_runtime(db, record, room)
    db.commit()
    return {'status': 'success', 'muted_users': list(room.muted_users)}


@router.post('/live_room/{room_id}/ban')
def ban_stream_viewer(
    room_id: str,
    payload: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = _require_room(room_id, db)
    _require_host(record, current_user)
    room = _hydrate_runtime_room(record)
    target_user_id = str(payload.get('user_id') or '').strip()
    if target_user_id:
        room.kicked_users.add(target_user_id)
    _sync_record_from_runtime(db, record, room)
    db.commit()
    return {'status': 'success', 'banned_users': list(room.kicked_users)}


@router.post('/live_room/{room_id}/unban')
def unban_stream_viewer(
    room_id: str,
    payload: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = _require_room(room_id, db)
    _require_host(record, current_user)
    room = _hydrate_runtime_room(record)
    target_user_id = str(payload.get('user_id') or '').strip()
    if target_user_id:
        room.kicked_users.discard(target_user_id)
    _sync_record_from_runtime(db, record, room)
    db.commit()
    return {'status': 'success', 'banned_users': list(room.kicked_users)}


@router.post('/live_room/{room_id}/multi-host')
def update_multi_host(
    room_id: str,
    payload: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = _require_room(room_id, db)
    _require_host(record, current_user)
    room = _hydrate_runtime_room(record)

    action = str(payload.get('action') or '').strip().lower()
    username = str(payload.get('username') or '').strip()
    co_hosts = [user for user in list(room.co_hosts or []) if str(user or '').strip()]
    if record.host_username not in co_hosts:
        co_hosts.insert(0, record.host_username)

    if username and action == 'add' and username not in co_hosts:
        co_hosts.append(username)
    elif username and action == 'remove':
        co_hosts = [user for user in co_hosts if user != username or user == record.host_username]

    room.co_hosts = co_hosts
    room.multi_host_config = {
        **(room.multi_host_config or {}),
        'current_hosts': co_hosts,
    }
    _sync_record_from_runtime(db, record, room)
    db.commit()
    return {'status': 'success', 'co_hosts': co_hosts, 'multi_host_config': room.multi_host_config}
