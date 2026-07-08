"""خدمة قصص السحابة — v84.0 (تحديث v83.9).

تحل محل story_store.py (JSON محلي) وتكتب كل شيء إلى Postgres.
كل عملية تحفظ في قاعدة البيانات وتُقرأ منها → متزامنة عبر الأجهزة و ثابتة
بعد إعادة النشر على Render (لا اعتماد على filesystem محلي).

تحسينات v84.0:
- ✅ فحص UserBlock في كل الاستعلامات والتفاعلات (لا يظهر لك محظور، ولا
  يستطيع من حظرك التفاعل مع قصصك ولا ذكرك).
- ✅ serialize_story ترجع avatar_url + عنوان أفاتار الشريط الدائري.
- ✅ حل مشكلة N+1 لجلب username/avatar (batch cache لكل قصص المستدعي).
- ✅ حذف الوسائط من Cloudinary تلقائياً عند حذف/انتهاء صلاحية القصة.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models.stories_reels import Story, StoryReply, StoryView
from app.models.user import User

logger = logging.getLogger(__name__)

try:
    from app.models.friendship import Friendship, FRIENDSHIP_STATUS_ACCEPTED
except Exception:  # pragma: no cover
    Friendship = None  # type: ignore[assignment]
    FRIENDSHIP_STATUS_ACCEPTED = 'accepted'

try:
    from app.models.close_friend import CloseFriend  # type: ignore
except Exception:  # pragma: no cover
    CloseFriend = None  # type: ignore[assignment]

try:
    from app.models.user_block import UserBlock  # type: ignore
except Exception:  # pragma: no cover
    UserBlock = None  # type: ignore[assignment]

# v84.0 — لحذف وسائط Cloudinary عند حذف/انتهاء قصة
try:
    from app.services import cloudinary_service as _cloudinary
except Exception:  # pragma: no cover
    _cloudinary = None


VIDEO_EXTS = ('.mp4', '.webm', '.mov', '.m4v', '.avi', '.mkv')


# ============================== أدوات ==============================
def _now() -> datetime:
    return datetime.utcnow()


def _iso(dt: Optional[datetime]) -> str:
    if not dt:
        return ''
    return dt.isoformat()


def _guess_media_type(url: str) -> str:
    u = (url or '').lower().split('?')[0]
    return 'video' if any(u.endswith(ext) for ext in VIDEO_EXTS) else 'image'


def _safe_list(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [p.strip() for p in value.split(',') if p.strip()]
    if isinstance(value, (list, tuple, set)):
        return [str(p).strip() for p in value if str(p).strip()]
    return []


def _load_json_dict(raw: Optional[str]) -> dict:
    if not raw:
        return {}
    try:
        v = json.loads(raw)
        return v if isinstance(v, dict) else {}
    except Exception:
        return {}


def _dump_json(value: dict) -> str:
    try:
        return json.dumps(value, ensure_ascii=False)
    except Exception:
        return '{}'


def _load_friend_ids(db: Session, user_id: int) -> set[int]:
    if Friendship is None:
        return set()
    try:
        rows = (
            db.query(Friendship)
            .filter(
                and_(
                    Friendship.status == FRIENDSHIP_STATUS_ACCEPTED,
                    or_(Friendship.requester_id == user_id, Friendship.addressee_id == user_id),
                )
            )
            .all()
        )
    except Exception:
        return set()
    out: set[int] = set()
    for r in rows:
        other = r.addressee_id if r.requester_id == user_id else r.requester_id
        if other and int(other) != int(user_id):
            out.add(int(other))
    return out


def _load_close_friend_ids(db: Session, user_id: int) -> set[int]:
    if CloseFriend is None:
        return set()
    try:
        rows = db.query(CloseFriend).filter(CloseFriend.owner_id == user_id).all()
        return {int(r.friend_id) for r in rows if getattr(r, 'friend_id', None)}
    except Exception:
        return set()


# ============================== v84.0 — Block awareness ==============================
def _load_block_scope(db: Session, user_id: int) -> set[int]:
    """يعيد مجموعة معرّفات المستخدمين المتحظرين من الطرفين (blocker↔blocked).

    أي مستخدم في هذه المجموعة:
    - لا نُظهر له قصصنا،
    - لا نُظهر لنا قصصه،
    - لا نقبل منه تفاعلاً/رداً/مشاهدة على قصصنا،
    - ولا نسمح لنا نحن بالتفاعل مع قصصه.
    """
    if UserBlock is None or not user_id:
        return set()
    try:
        rows = (
            db.query(UserBlock)
            .filter(or_(UserBlock.blocker_id == user_id, UserBlock.blocked_id == user_id))
            .all()
        )
        out: set[int] = set()
        for r in rows:
            other = r.blocked_id if r.blocker_id == user_id else r.blocker_id
            if other and int(other) != int(user_id):
                out.add(int(other))
        return out
    except Exception:
        return set()


def _is_blocked_between(db: Session, a_id: int, b_id: int) -> bool:
    """فحص سريع لعلاقة الحظر بين مستخدمَين (أي اتجاه)."""
    if UserBlock is None or not a_id or not b_id or int(a_id) == int(b_id):
        return False
    try:
        exists = (
            db.query(UserBlock.id)
            .filter(
                or_(
                    and_(UserBlock.blocker_id == a_id, UserBlock.blocked_id == b_id),
                    and_(UserBlock.blocker_id == b_id, UserBlock.blocked_id == a_id),
                )
            )
            .first()
        )
        return exists is not None
    except Exception:
        return False


# ============================== v84.0 — Users cache (N+1 fix) ==============================
class _UsersCache:
    """كاش خفيف لبيانات المستخدمين داخل مكالمة واحدة (يمنع N+1)."""

    def __init__(self, db: Session):
        self._db = db
        self._by_id: dict[int, dict] = {}

    def _load(self, user_ids: list[int]) -> None:
        missing = [uid for uid in user_ids if uid and uid not in self._by_id]
        if not missing:
            return
        try:
            rows = self._db.query(User).filter(User.id.in_(missing)).all()
        except Exception:
            rows = []
        for u in rows:
            uid = int(u.id)
            self._by_id[uid] = {
                'id': uid,
                'username': getattr(u, 'username', '') or '',
                'avatar_url': getattr(u, 'avatar_url', '') or getattr(u, 'avatar', '') or '',
            }
        for uid in missing:
            self._by_id.setdefault(uid, {'id': uid, 'username': '', 'avatar_url': ''})

    def prefetch(self, user_ids: list[int]) -> None:
        self._load(user_ids)

    def get(self, user_id: int) -> dict:
        uid = int(user_id or 0)
        if uid not in self._by_id:
            self._load([uid])
        return self._by_id.get(uid, {'id': uid, 'username': '', 'avatar_url': ''})

    def username(self, user_id: int) -> str:
        return self.get(user_id).get('username', '')

    def avatar(self, user_id: int) -> str:
        return self.get(user_id).get('avatar_url', '')


def _resolve_username(db: Session, user_id: int) -> str:
    """للتوافق الخلفي — استعلام مفرد (يُستخدم في المسارات التي لا تحتاج batch)."""
    try:
        u = db.query(User).filter(User.id == int(user_id)).first()
        return getattr(u, 'username', '') or ''
    except Exception:
        return ''


# ============================== Serialization ==============================
def serialize_story(
    db: Session,
    story: Story,
    viewer_user_id: Optional[int] = None,
    users_cache: Optional[_UsersCache] = None,
) -> dict:
    """يحوّل Story ORM إلى الشكل الذي كانت الواجهة تتوقعه من story_store."""
    cache = users_cache or _UsersCache(db)
    cache.prefetch([story.user_id, viewer_user_id] if viewer_user_id else [story.user_id])

    author = cache.get(story.user_id)
    username = author.get('username', '')
    avatar_url = author.get('avatar_url', '')

    poll_options = _safe_list(story.poll_options)[:4]
    poll_votes = {str(k): int(v or 0) for k, v in _load_json_dict(story.poll_votes).items()}
    poll_voters = {str(k): int(v) for k, v in _load_json_dict(story.poll_voters).items()}
    reactions = {str(k): int(v or 0) for k, v in _load_json_dict(story.reactions).items()}

    viewer_uname = cache.username(viewer_user_id) if viewer_user_id else ''
    my_vote = poll_voters.get(viewer_uname) if viewer_uname else None

    # seen_by list (للتوافق الخلفي مع الواجهة الحالية)
    seen_rows = db.query(StoryView.username).filter(StoryView.story_id == story.id).all()
    seen_by = [r[0] for r in seen_rows if r[0]]

    # replies قصيرة (آخر 20)
    reply_rows = (
        db.query(StoryReply)
        .filter(StoryReply.story_id == story.id)
        .order_by(StoryReply.created_at.desc())
        .limit(20)
        .all()
    )
    replies = [
        {
            'username': r.username or '',
            'text': r.content,
            'created_at': _iso(r.created_at),
        }
        for r in reversed(reply_rows)
    ]

    return {
        'id': str(story.id),
        'user_id': int(story.user_id),
        'username': username,
        'avatar_url': avatar_url,          # v84.0 — كان مفقوداً
        'user_avatar': avatar_url,          # alias للتوافق مع الواجهة
        'media_url': story.media_url,
        'media': story.media_url,
        'media_type': story.media_type or 'image',
        'created_at': _iso(story.created_at),
        'expires_at': _iso(story.expires_at),
        'caption': story.caption or '',
        'privacy': story.privacy or 'friends',
        'music': story.music or '',
        'stickers': _safe_list(story.stickers)[:8],
        'mentions': _safe_list(story.mentions)[:8],
        'poll_question': story.poll_question or '',
        'poll_options': poll_options,
        'poll_votes': poll_votes,
        'poll_total_votes': sum(poll_votes.values()),
        'my_vote': int(my_vote) if my_vote is not None else None,
        'countdown_at': story.countdown_at or '',
        'filter_name': story.filter_name or '',
        'drawing_data': story.drawing_data or '',
        'auto_delete_hours': int(story.auto_delete_hours or 24),
        'is_close_friends': bool(story.is_close_friends),
        'highlight': bool(story.highlight),
        'highlight_title': story.highlight_title or '',
        'reactions': reactions,
        'replies': replies,
        'seen_by': seen_by,
        'views_count': int(story.views_count or 0),
        'replies_count': int(story.replies_count or 0),
        'reactions_count': int(story.reactions_count or 0),
    }


# ============================== v84.0 — Cloudinary media cleanup ==============================
def _delete_media_safely(media_url: str) -> None:
    """يحذف وسائط قصة من Cloudinary بلا رفع استثناء أبداً."""
    if not media_url or _cloudinary is None:
        return
    try:
        if not _cloudinary.is_configured():
            return
        _cloudinary.delete_file(media_url)
    except Exception as exc:
        logger.warning('story media cleanup failed (%s): %s', media_url, exc)


# ============================== Purge Expired ==============================
def purge_expired(db: Session) -> int:
    """يحذف القصص منتهية الصلاحية (باستثناء highlight) + وسائطها."""
    now = _now()
    q = db.query(Story).filter(
        Story.expires_at != None,  # noqa: E711
        Story.expires_at <= now,
        Story.highlight == False,  # noqa: E712
    )
    expired = q.all()
    if not expired:
        return 0
    ids = [s.id for s in expired]
    media_urls = [s.media_url for s in expired if s.media_url]

    db.query(StoryView).filter(StoryView.story_id.in_(ids)).delete(synchronize_session=False)
    db.query(StoryReply).filter(StoryReply.story_id.in_(ids)).delete(synchronize_session=False)
    q.delete(synchronize_session=False)
    db.commit()

    # حذف الوسائط بعد commit للـ DB (فشل الحذف على Cloudinary لا يجب أن يوقف DB)
    if _cloudinary is not None and media_urls:
        try:
            _cloudinary.delete_files_batch(media_urls)
        except Exception as exc:
            logger.warning('batch media cleanup failed for %s urls: %s', len(media_urls), exc)

    return len(ids)


# ============================== Add Story ==============================
def add_story(
    db: Session,
    user_id: int,
    username: str,
    media_url: str,
    metadata: Optional[dict] = None,
) -> Story:
    metadata = metadata or {}
    auto_delete = max(1, min(int(metadata.get('auto_delete_hours') or 24), 72))
    privacy = str(metadata.get('privacy') or 'friends').strip() or 'friends'
    if privacy == 'public':
        privacy = 'friends'
    if privacy not in ('friends', 'close_friends', 'private'):
        privacy = 'friends'

    is_cf = bool(metadata.get('is_close_friends')) or privacy == 'close_friends'
    if is_cf:
        privacy = 'close_friends'

    poll_options = _safe_list(metadata.get('poll_options'))[:4]
    poll_votes = {str(i): 0 for i in range(len(poll_options))} if poll_options else {}

    # v84.0 — تصفية mentions للمحظورين (لا ذكر متبادل مع محظور)
    raw_mentions = _safe_list(metadata.get('mentions'))[:8]
    if raw_mentions and UserBlock is not None:
        try:
            mentioned_users = (
                db.query(User.id, User.username)
                .filter(User.username.in_(raw_mentions))
                .all()
            )
            block_scope = _load_block_scope(db, int(user_id))
            allowed_mentions = [
                uname for uid, uname in mentioned_users
                if int(uid) not in block_scope
            ]
            # حافظ على الترتيب الأصلي
            allowed_set = set(allowed_mentions)
            raw_mentions = [m for m in raw_mentions if m in allowed_set]
        except Exception:
            pass

    now = _now()
    story = Story(
        user_id=int(user_id),
        media_url=media_url,
        media_type=_guess_media_type(media_url),
        caption=str(metadata.get('caption') or '').strip()[:300] or None,
        privacy=privacy,
        music=str(metadata.get('music') or '').strip()[:120] or None,
        stickers=','.join(_safe_list(metadata.get('stickers'))[:8]) or None,
        mentions=','.join(raw_mentions) or None,
        poll_question=str(metadata.get('poll_question') or '').strip()[:200] or None,
        poll_options=','.join(poll_options) or None,
        poll_votes=_dump_json(poll_votes) if poll_votes else None,
        poll_voters=None,
        countdown_at=str(metadata.get('countdown_at') or '').strip()[:64] or None,
        filter_name=str(metadata.get('filter_name') or '').strip()[:80] or None,
        drawing_data=str(metadata.get('drawing_data') or '').strip()[:200000] or None,
        is_close_friends=is_cf,
        highlight=False,
        highlight_title=None,
        reactions=None,
        auto_delete_hours=auto_delete,
        views_count=0,
        replies_count=0,
        reactions_count=0,
        created_at=now,
        expires_at=now + timedelta(hours=auto_delete),
    )
    db.add(story)
    db.commit()
    db.refresh(story)
    return story


# ============================== List / Grouped ==============================
def _visible_filter(db: Session, viewer_user_id: int):
    """يبني شرط الرؤية بحسب سياسة الخصوصية + حظر متبادل."""
    friends = _load_friend_ids(db, viewer_user_id)
    close = _load_close_friend_ids(db, viewer_user_id)
    blocked = _load_block_scope(db, viewer_user_id)

    # استبعد المحظورين من الأصدقاء والمقربين
    friends -= blocked
    close -= blocked

    friend_list = list(friends) or [0]
    close_list = list(close) or [0]

    conditions = [
        # قصصي أنا
        Story.user_id == viewer_user_id,
        # قصص أصدقائي بخصوصية friends
        and_(Story.privacy == 'friends', Story.user_id.in_(friend_list)),
        # قصص المقربين الذين وضعوني في close_friends
        and_(Story.privacy == 'close_friends', Story.user_id.in_(close_list)),
    ]
    base = or_(*conditions)

    if blocked:
        # استبعاد قصص المحظورين حتى لو كانوا أصدقاء سابقاً (double-safety)
        return and_(base, ~Story.user_id.in_(list(blocked)))
    return base


def list_stories(db: Session, viewer_user_id: int) -> list[dict]:
    purge_expired(db)
    stories = (
        db.query(Story)
        .filter(_visible_filter(db, viewer_user_id))
        .order_by(Story.created_at.desc())
        .all()
    )
    cache = _UsersCache(db)
    cache.prefetch([s.user_id for s in stories] + [viewer_user_id])
    return [serialize_story(db, s, viewer_user_id=viewer_user_id, users_cache=cache) for s in stories]


def list_grouped_stories(db: Session, viewer_user_id: int, viewer_username: str) -> list[dict]:
    flat = list_stories(db, viewer_user_id)
    groups: dict[int, dict] = {}
    vuname = (viewer_username or '').strip().lower()
    for story in flat:
        uid = int(story.get('user_id') or 0)
        if uid not in groups:
            groups[uid] = {
                'user_id': uid,
                'username': story.get('username') or '',
                'avatar_url': story.get('avatar_url') or '',   # v84.0 — يعمل الآن
                'user_avatar': story.get('avatar_url') or '',
                'is_self': (str(story.get('username') or '').lower() == vuname),
                'has_unseen': False,
                'last_created_at': story.get('created_at'),
                'stories': [],
            }
        seen_list = [str(u).lower() for u in (story.get('seen_by') or [])]
        seen = bool(vuname) and vuname in seen_list
        if not seen and str(story.get('username') or '').lower() != vuname:
            groups[uid]['has_unseen'] = True
        if story.get('created_at') and story.get('created_at') > (groups[uid]['last_created_at'] or ''):
            groups[uid]['last_created_at'] = story.get('created_at')
        groups[uid]['stories'].append(story)

    result = list(groups.values())
    result.sort(key=lambda g: (
        0 if g.get('is_self') else (1 if g.get('has_unseen') else 2),
        -1 * len(g.get('last_created_at') or ''),
    ))
    for g in result:
        g['stories'].sort(key=lambda s: s.get('created_at') or '')
    return result


# ============================== v85.4 — قصص مستخدم محدد ==============================
def list_user_stories(
    db: Session,
    target_user_id: int,
    viewer_user_id: int,
    viewer_username: str = '',
) -> dict:
    """جلب قصص مستخدم محدد مع احترام الخصوصية والحظر.

    ✅ v85.4 FIX #5: endpoint لـ deep-link من صفحة تعريفية إلى قصص مستخدم.
    يرجع بنية group متوافقة مع /stories/grouped لسهولة تمريرها
    مباشرة لـ StoryViewerEnhanced.

    Raises:
        KeyError: إذا لم يوجد المستخدم المستهدف.
        PermissionError: حظر متبادل / ليس صديقاً / private.
    """
    purge_expired(db)

    target = db.query(User).filter(User.id == int(target_user_id)).first()
    if target is None:
        raise KeyError('User not found')

    is_self = int(target_user_id) == int(viewer_user_id)

    # فحص الحظر (ماعدا مشاهدة لنفسك)
    if not is_self and _is_blocked_between(db, viewer_user_id, target_user_id):
        raise PermissionError('Blocked')

    # تحديد الرؤية
    if is_self:
        allow_privacies = ('friends', 'close_friends', 'private')
    else:
        friend_ids = _load_friend_ids(db, viewer_user_id)
        close_ids = _load_close_friend_ids(db, viewer_user_id)
        if int(target_user_id) in close_ids:
            allow_privacies = ('friends', 'close_friends')
        elif int(target_user_id) in friend_ids:
            allow_privacies = ('friends',)
        else:
            # ليس صديقاً → لا يرى أي قصة
            allow_privacies = ()

    stories: list = []
    if allow_privacies:
        stories = (
            db.query(Story)
            .filter(
                Story.user_id == int(target_user_id),
                Story.privacy.in_(list(allow_privacies)),
            )
            .order_by(Story.created_at.asc())
            .all()
        )

    cache = _UsersCache(db)
    cache.prefetch([target_user_id, viewer_user_id])
    serialized = [
        serialize_story(db, s, viewer_user_id=viewer_user_id, users_cache=cache)
        for s in stories
    ]

    author = cache.get(target_user_id)
    vuname_lc = (viewer_username or '').strip().lower()
    has_unseen = False
    if not is_self:
        for s in serialized:
            seen_list = [str(u).lower() for u in (s.get('seen_by') or [])]
            if vuname_lc and vuname_lc not in seen_list:
                has_unseen = True
                break

    return {
        'user_id': int(target_user_id),
        'username': author.get('username', ''),
        'avatar_url': author.get('avatar_url', ''),
        'user_avatar': author.get('avatar_url', ''),
        'is_self': is_self,
        'has_unseen': has_unseen,
        'stories_count': len(serialized),
        'stories': serialized,
    }


# ============================== Single story ==============================
def get_story(db: Session, story_id: int, viewer_user_id: int) -> dict:
    story = db.query(Story).filter(Story.id == int(story_id)).first()
    if story is None:
        raise KeyError('Story not found')

    # v84.0 — احترم الحظر المتبادل
    if story.user_id != viewer_user_id and _is_blocked_between(db, viewer_user_id, story.user_id):
        raise PermissionError('Blocked')

    # فحص الرؤية
    if story.user_id != viewer_user_id:
        if story.privacy == 'private':
            raise PermissionError('Private story')
        if story.privacy == 'close_friends':
            cf = _load_close_friend_ids(db, viewer_user_id)
            if int(story.user_id) not in cf:
                raise PermissionError('Not in close friends')
        else:  # friends
            fr = _load_friend_ids(db, viewer_user_id)
            if int(story.user_id) not in fr:
                raise PermissionError('Not a friend')
    return serialize_story(db, story, viewer_user_id=viewer_user_id)


# ============================== Interactions ==============================
def mark_seen(db: Session, story_id: int, viewer_user_id: int, viewer_username: str) -> dict:
    story = db.query(Story).filter(Story.id == int(story_id)).first()
    if story is None:
        raise KeyError('Story not found')
    if int(viewer_user_id) == story.user_id:
        return serialize_story(db, story, viewer_user_id=viewer_user_id)

    # v84.0 — محظور لا يسجل مشاهدة
    if _is_blocked_between(db, viewer_user_id, story.user_id):
        raise PermissionError('Blocked')

    exists = (
        db.query(StoryView)
        .filter(StoryView.story_id == story.id, StoryView.user_id == viewer_user_id)
        .first()
    )
    if not exists:
        db.add(StoryView(
            story_id=story.id,
            user_id=int(viewer_user_id),
            username=viewer_username or None,
            viewed_at=_now(),
        ))
        story.views_count = int(story.views_count or 0) + 1
        db.commit()
        db.refresh(story)
    return serialize_story(db, story, viewer_user_id=viewer_user_id)


def add_reaction(db: Session, story_id: int, emoji: str, viewer_user_id: int, viewer_username: str) -> dict:
    story = db.query(Story).filter(Story.id == int(story_id)).first()
    if story is None:
        raise KeyError('Story not found')

    # v84.0 — محظور لا يتفاعل
    if _is_blocked_between(db, viewer_user_id, story.user_id):
        raise PermissionError('Blocked')

    # سجّل المشاهدة قبل التفاعل
    if int(viewer_user_id) != story.user_id:
        exists = (
            db.query(StoryView)
            .filter(StoryView.story_id == story.id, StoryView.user_id == viewer_user_id)
            .first()
        )
        if not exists:
            db.add(StoryView(
                story_id=story.id,
                user_id=int(viewer_user_id),
                username=viewer_username or None,
                viewed_at=_now(),
            ))
            story.views_count = int(story.views_count or 0) + 1

    safe = (str(emoji or '🔥').strip() or '🔥')[:8]
    reactions = _load_json_dict(story.reactions)
    reactions[safe] = int(reactions.get(safe, 0)) + 1
    story.reactions = _dump_json(reactions)
    story.reactions_count = sum(int(v or 0) for v in reactions.values())
    db.commit()
    db.refresh(story)
    return serialize_story(db, story, viewer_user_id=viewer_user_id)


def add_reply(db: Session, story_id: int, viewer_user_id: int, viewer_username: str, text: str) -> dict:
    story = db.query(Story).filter(Story.id == int(story_id)).first()
    if story is None:
        raise KeyError('Story not found')

    # v84.0 — محظور لا يرد
    if _is_blocked_between(db, viewer_user_id, story.user_id):
        raise PermissionError('Blocked')

    clean = str(text or '').strip()
    if not clean:
        raise ValueError('reply text is required')
    db.add(StoryReply(
        story_id=story.id,
        user_id=int(viewer_user_id),
        username=viewer_username or None,
        content=clean[:280],
        reply_type='text',
        created_at=_now(),
    ))
    story.replies_count = int(story.replies_count or 0) + 1
    db.commit()
    db.refresh(story)
    return serialize_story(db, story, viewer_user_id=viewer_user_id)


def vote_poll(db: Session, story_id: int, option_index: int, voter_user_id: int, voter_username: str) -> dict:
    story = db.query(Story).filter(Story.id == int(story_id)).first()
    if story is None:
        raise KeyError('Story not found')

    # v84.0 — محظور لا يصوت
    if _is_blocked_between(db, voter_user_id, story.user_id):
        raise PermissionError('Blocked')

    poll_options = _safe_list(story.poll_options)[:4]
    if not poll_options:
        raise ValueError('story has no poll')
    idx = int(option_index)
    if idx < 0 or idx >= len(poll_options):
        raise ValueError('invalid option index')
    if not voter_username:
        raise ValueError('voter username required')

    voters = _load_json_dict(story.poll_voters)
    votes = {str(k): int(v or 0) for k, v in _load_json_dict(story.poll_votes).items()}
    # اضمن مفاتيح لكل الخيارات
    for i in range(len(poll_options)):
        votes.setdefault(str(i), 0)

    previous = voters.get(voter_username)
    if previous is not None:
        pk = str(previous)
        votes[pk] = max(0, int(votes.get(pk, 0)) - 1)
    voters[voter_username] = idx
    votes[str(idx)] = int(votes.get(str(idx), 0)) + 1

    story.poll_voters = _dump_json(voters)
    story.poll_votes = _dump_json(votes)
    db.commit()
    db.refresh(story)
    return serialize_story(db, story, viewer_user_id=voter_user_id)


# ============================== Delete / Highlights ==============================
def delete_story(db: Session, story_id: int, owner_id: int) -> dict:
    story = db.query(Story).filter(Story.id == int(story_id)).first()
    if story is None:
        raise KeyError('Story not found')
    if story.user_id != owner_id:
        raise PermissionError('Only owner can delete story')

    media_url = story.media_url  # v84.0 — احتفظ به قبل الحذف

    db.query(StoryView).filter(StoryView.story_id == story.id).delete(synchronize_session=False)
    db.query(StoryReply).filter(StoryReply.story_id == story.id).delete(synchronize_session=False)
    db.delete(story)
    db.commit()

    # v84.0 — احذف الوسائط من Cloudinary (soft-fail)
    _delete_media_safely(media_url)

    return {'deleted': True, 'id': str(story_id)}


def toggle_highlight(db: Session, story_id: int, owner_id: int, title: str = '') -> dict:
    story = db.query(Story).filter(Story.id == int(story_id)).first()
    if story is None:
        raise KeyError('Story not found')
    if story.user_id != owner_id:
        raise PermissionError('Only owner can update highlight')
    story.highlight = not bool(story.highlight)
    if story.highlight and title:
        story.highlight_title = str(title).strip()[:80]
    elif not story.highlight:
        story.highlight_title = None
    # highlights لا تنتهي — امدد expires_at
    if story.highlight:
        story.expires_at = None
    else:
        story.expires_at = (story.created_at or _now()) + timedelta(hours=int(story.auto_delete_hours or 24))
    db.commit()
    db.refresh(story)
    return serialize_story(db, story, viewer_user_id=owner_id)


def set_highlight_title(db: Session, story_id: int, owner_id: int, title: str) -> dict:
    story = db.query(Story).filter(Story.id == int(story_id)).first()
    if story is None:
        raise KeyError('Story not found')
    if story.user_id != owner_id:
        raise PermissionError('Only owner can update highlight title')
    story.highlight_title = str(title or '').strip()[:80] or None
    story.highlight = True
    story.expires_at = None
    db.commit()
    db.refresh(story)
    return serialize_story(db, story, viewer_user_id=owner_id)


def get_highlights(db: Session, owner_id: int) -> list[dict]:
    purge_expired(db)
    rows = (
        db.query(Story)
        .filter(Story.user_id == int(owner_id), Story.highlight == True)  # noqa: E712
        .order_by(Story.created_at.desc())
        .all()
    )
    cache = _UsersCache(db)
    cache.prefetch([owner_id])
    return [serialize_story(db, s, viewer_user_id=owner_id, users_cache=cache) for s in rows]


def get_archive(db: Session, owner_id: int) -> list[dict]:
    purge_expired(db)
    rows = (
        db.query(Story)
        .filter(Story.user_id == int(owner_id))
        .order_by(Story.created_at.desc())
        .all()
    )
    cache = _UsersCache(db)
    cache.prefetch([owner_id])
    return [serialize_story(db, s, viewer_user_id=owner_id, users_cache=cache) for s in rows]


# ============================== Viewers list ==============================
def get_viewers(db: Session, story_id: int, owner_id: int) -> dict:
    story = db.query(Story).filter(Story.id == int(story_id)).first()
    if story is None:
        raise KeyError('Story not found')
    if story.user_id != owner_id:
        raise PermissionError('Only owner can view viewers list')
    rows = (
        db.query(StoryView)
        .filter(StoryView.story_id == story.id)
        .order_by(StoryView.viewed_at.desc())
        .all()
    )

    # v84.0 — أفاتار حقيقي من جدول users بدل ui-avatars لكل صف
    cache = _UsersCache(db)
    cache.prefetch([r.user_id for r in rows])

    viewers = []
    for r in rows:
        info = cache.get(int(r.user_id))
        uname = r.username or info.get('username') or ''
        avatar = info.get('avatar_url') or (
            f'https://ui-avatars.com/api/?name={uname or "user"}&background=8b5cf6&color=fff'
        )
        viewers.append({
            'username': uname,
            'user_id': int(r.user_id),
            'viewed_at': _iso(r.viewed_at),
            'avatar_url': avatar,
        })
    return {
        'story_id': str(story.id),
        'total': len(rows),
        'viewers': viewers,
    }


# ============================== Analytics ==============================
def analytics_summary(db: Session, owner_id: int) -> dict:
    purge_expired(db)
    rows = db.query(Story).filter(Story.user_id == int(owner_id)).all()
    total_views = sum(int(s.views_count or 0) for s in rows)
    total_replies = sum(int(s.replies_count or 0) for s in rows)
    total_reactions = sum(int(s.reactions_count or 0) for s in rows)
    return {
        'stories_count': len(rows),
        'highlights_count': sum(1 for s in rows if s.highlight),
        'total_views': total_views,
        'total_replies': total_replies,
        'total_reactions': total_reactions,
        'engagement_rate': round(((total_replies + total_reactions) / max(len(rows), 1)), 2),
    }
