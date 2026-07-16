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

from app.models.stories_reels import Story, StoryReply, StoryView, Reel
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
    from app.models.follow import Follow  # type: ignore
except Exception:  # pragma: no cover
    Follow = None  # type: ignore[assignment]

# v87.11 — Hide Story From: قائمة المستخدمين الذين لا يرون قصص صاحب الحساب
try:
    from app.models.hidden_story_user import HiddenStoryUser  # type: ignore
except Exception:  # pragma: no cover
    HiddenStoryUser = None  # type: ignore[assignment]

# v87.12 — Mute User Stories: قائمة المستخدمين الذين كتم منهم المستخدم قصصهم
try:
    from app.models.muted_story_user import MutedStoryUser  # type: ignore
except Exception:  # pragma: no cover
    MutedStoryUser = None  # type: ignore[assignment]

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


# v87.12 — كتالوج الموسيقى: تحويل اسم الموسيقى إلى رابط ملف صوتي فعلي.
# يدعم الموسيقى المدمجة (أصلية) + روابط خارجية.
STORY_MUSIC_CATALOG = {
    'none':      '',
    'silence':   '',
    'upbeat':    '/sounds/story/upbeat.mp3',
    'chill':     '/sounds/story/chill.mp3',
    'romantic':  '/sounds/story/romantic.mp3',
    'epic':      '/sounds/story/epic.mp3',
    'fun':       '/sounds/story/fun.mp3',
    'sad':       '/sounds/story/sad.mp3',
    'party':     '/sounds/story/party.mp3',
    'lofi':      '/sounds/story/lofi.mp3',
    'acoustic':  '/sounds/story/acoustic.mp3',
    'ambient':   '/sounds/story/ambient.mp3',
    'cinematic': '/sounds/story/cinematic.mp3',
}


def _resolve_music_url(music_field: Optional[str]) -> str:
    """يحوّل حقل الموسيقى إلى رابط ملف صوتي قابل للتشغيل.

    - إذا كان رابطاً مطلقاً (http/https) يعيده كما هو.
    - إذا كان مفتاحاً في كتالوج الموسيقى المدمج يعيد رابط الملف.
    - غير ذلك يعيد سلسلة فارغة.
    """
    raw = str(music_field or '').strip()
    if not raw or raw == 'none':
        return ''
    if raw.startswith('http://') or raw.startswith('https://'):
        return raw
    return STORY_MUSIC_CATALOG.get(raw.lower(), '')


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


def _load_following_ids(db: Session, user_id: int) -> set[int]:
    """الحسابات التي يتابعها المستخدم — تستخدم لرؤية stories الأصدقاء/المشتركين."""
    if Follow is None:
        return set()
    try:
        rows = db.query(Follow).filter(Follow.follower_id == int(user_id)).all()
        return {int(r.following_id) for r in rows if getattr(r, 'following_id', None)}
    except Exception:
        return set()


def _load_close_friend_owner_ids(db: Session, viewer_user_id: int) -> set[int]:
    """المستخدمون الذين أضافوا هذا المشاهد إلى close_friends لديهم."""
    if CloseFriend is None:
        return set()
    try:
        rows = db.query(CloseFriend).filter(CloseFriend.friend_id == int(viewer_user_id)).all()
        return {int(r.owner_id) for r in rows if getattr(r, 'owner_id', None)}
    except Exception:
        return set()


def _can_view_story_owner(db: Session, viewer_user_id: int, owner_user_id: int, privacy: str) -> bool:
    """يفحص هل يحق للمشاهد رؤية قصة صاحب الحساب وفق الخصوصية الحالية."""
    viewer_id = int(viewer_user_id or 0)
    owner_id = int(owner_user_id or 0)
    normalized_privacy = str(privacy or 'friends').strip() or 'friends'

    if viewer_id and viewer_id == owner_id:
        return True
    if not viewer_id or not owner_id:
        return False
    if _is_blocked_between(db, viewer_id, owner_id):
        return False

    hidden_owners = _load_hidden_from_me_ids(db, viewer_id)
    muted_owners = _load_muted_story_ids(db, viewer_id)
    if owner_id in hidden_owners or owner_id in muted_owners:
        return False

    friend_ids = _load_friend_ids(db, viewer_id)
    following_ids = _load_following_ids(db, viewer_id)

    if normalized_privacy == 'private':
        return False
    if normalized_privacy == 'close_friends':
        close_owner_ids = _load_close_friend_owner_ids(db, viewer_id)
        return owner_id in close_owner_ids
    return owner_id in friend_ids or owner_id in following_ids


# v87.11 — Hide Story From helpers
def _load_hidden_from_me_ids(db: Session, viewer_user_id: int) -> set[int]:
    """يعيد مجموعة معرّفات owner_id للمستخدمين الذين أضافوني (viewer) لقائمة
    إخفاء الستوري لديهم → يجب ألا أرى أي من قصصهم.
    """
    if HiddenStoryUser is None or not viewer_user_id:
        return set()
    try:
        rows = (
            db.query(HiddenStoryUser)
            .filter(HiddenStoryUser.hidden_id == int(viewer_user_id))
            .all()
        )
        return {int(r.owner_id) for r in rows if getattr(r, 'owner_id', None)}
    except Exception:
        return set()


def _load_my_hidden_targets(db: Session, owner_user_id: int) -> set[int]:
    """يعيد مجموعة معرّفات المستخدمين الذين أخفيت عنهم قصصي."""
    if HiddenStoryUser is None or not owner_user_id:
        return set()
    try:
        rows = (
            db.query(HiddenStoryUser)
            .filter(HiddenStoryUser.owner_id == int(owner_user_id))
            .all()
        )
        return {int(r.hidden_id) for r in rows if getattr(r, 'hidden_id', None)}
    except Exception:
        return set()


# v87.12 — Mute User Stories helpers
def _load_muted_story_ids(db: Session, viewer_user_id: int) -> set[int]:
    """يعيد مجموعة معرّفات المستخدمين الذين كتمت (viewer) قصصهم.

    قصص هؤلاء المستخدمين تُستبعد من شريط الستوري الخاص بـ viewer.
    لكن يمكنه رؤية قصصهم عبر deep-link (/stories/user/{id}) أو القصة المفردة.
    """
    if MutedStoryUser is None or not viewer_user_id:
        return set()
    try:
        rows = (
            db.query(MutedStoryUser)
            .filter(MutedStoryUser.muter_id == int(viewer_user_id))
            .all()
        )
        return {int(r.muted_id) for r in rows if getattr(r, 'muted_id', None)}
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
        .filter(StoryReply.story_id == story.id, StoryReply.reply_type != 'reaction')
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

    # v87.12 — هل قام المشاهد بكتم قصص صاحب هذه القصة؟
    is_muted_by_viewer = False
    if viewer_user_id and int(story.user_id) != int(viewer_user_id or 0):
        muted_ids = _load_muted_story_ids(db, int(viewer_user_id))
        is_muted_by_viewer = int(story.user_id) in muted_ids

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
        'music_url': _resolve_music_url(story.music),   # v87.12 — رابط ملف الموسيقى للدمج الفعلي
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
        'is_muted_by_viewer': is_muted_by_viewer,    # v87.12
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
    """يبني شرط الرؤية بحسب الخصوصية مع دعم المتابعات + المقربين + الحظر."""
    friends = _load_friend_ids(db, viewer_user_id)
    following = _load_following_ids(db, viewer_user_id)
    close_owner_ids = _load_close_friend_owner_ids(db, viewer_user_id)
    blocked = _load_block_scope(db, viewer_user_id)
    hidden_from_me = _load_hidden_from_me_ids(db, viewer_user_id)
    muted_stories = _load_muted_story_ids(db, viewer_user_id)

    visible_friend_like_ids = (friends | following) - blocked - hidden_from_me - muted_stories
    visible_close_owner_ids = close_owner_ids - blocked - hidden_from_me - muted_stories

    friend_like_list = list(visible_friend_like_ids) or [0]
    close_owner_list = list(visible_close_owner_ids) or [0]

    conditions = [
        Story.user_id == viewer_user_id,
        and_(Story.privacy == 'friends', Story.user_id.in_(friend_like_list)),
        and_(Story.privacy == 'close_friends', Story.user_id.in_(close_owner_list)),
    ]
    base = or_(*conditions)

    exclude_ids = list(blocked | hidden_from_me | muted_stories)
    if exclude_ids:
        return and_(base, ~Story.user_id.in_(exclude_ids))
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

    # v87.11 — Hide Story From: إذا كان صاحب القصص أخفى عني قصصه → لا أرى شيئاً
    if not is_self:
        hidden_owners = _load_hidden_from_me_ids(db, viewer_user_id)
        if int(target_user_id) in hidden_owners:
            raise PermissionError('Hidden')

    # تحديد الرؤية
    if is_self:
        allow_privacies = ('friends', 'close_friends', 'private')
    else:
        friend_ids = _load_friend_ids(db, viewer_user_id)
        following_ids = _load_following_ids(db, viewer_user_id)
        close_owner_ids = _load_close_friend_owner_ids(db, viewer_user_id)
        if int(target_user_id) in close_owner_ids:
            allow_privacies = ('friends', 'close_friends')
        elif int(target_user_id) in (friend_ids | following_ids):
            allow_privacies = ('friends',)
        else:
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

    # v87.11 — Hide Story From: إذا أخفى صاحب القصة قصصه عني → ممنوعة
    if story.user_id != viewer_user_id:
        hidden_owners = _load_hidden_from_me_ids(db, viewer_user_id)
        if int(story.user_id) in hidden_owners:
            raise PermissionError('Hidden')

    # فحص الرؤية
    if story.user_id != viewer_user_id:
        if not _can_view_story_owner(db, viewer_user_id, int(story.user_id), str(story.privacy or 'friends')):
            if story.privacy == 'private':
                raise PermissionError('Private story')
            if story.privacy == 'close_friends':
                raise PermissionError('Not in close friends')
            raise PermissionError('Not following story owner')
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

    if _is_blocked_between(db, viewer_user_id, story.user_id):
        raise PermissionError('Blocked')

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

    db.add(StoryReply(
        story_id=story.id,
        user_id=int(viewer_user_id),
        username=viewer_username or None,
        content=safe,
        reply_type='reaction',
        created_at=_now(),
    ))

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

    view_rows = (
        db.query(StoryView)
        .filter(StoryView.story_id == story.id)
        .order_by(StoryView.viewed_at.desc())
        .all()
    )
    reaction_rows = (
        db.query(StoryReply)
        .filter(StoryReply.story_id == story.id, StoryReply.reply_type == 'reaction')
        .order_by(StoryReply.created_at.desc())
        .all()
    )
    reply_rows = (
        db.query(StoryReply)
        .filter(StoryReply.story_id == story.id, StoryReply.reply_type != 'reaction')
        .order_by(StoryReply.created_at.desc())
        .all()
    )

    cache = _UsersCache(db)
    cache.prefetch([r.user_id for r in view_rows] + [r.user_id for r in reaction_rows] + [r.user_id for r in reply_rows])

    def _avatar_for(user_id: int, username: str) -> str:
        info = cache.get(int(user_id))
        return info.get('avatar_url') or f'https://ui-avatars.com/api/?name={username or "user"}&background=8b5cf6&color=fff'

    viewers = []
    for r in view_rows:
        info = cache.get(int(r.user_id))
        uname = r.username or info.get('username') or ''
        viewers.append({
            'username': uname,
            'user_id': int(r.user_id),
            'viewed_at': _iso(r.viewed_at),
            'avatar_url': _avatar_for(int(r.user_id), uname),
        })

    reactions = []
    for r in reaction_rows:
        info = cache.get(int(r.user_id))
        uname = r.username or info.get('username') or ''
        reactions.append({
            'username': uname,
            'user_id': int(r.user_id),
            'emoji': str(r.content or '').strip()[:8] or '🔥',
            'created_at': _iso(r.created_at),
            'avatar_url': _avatar_for(int(r.user_id), uname),
        })

    replies = []
    for r in reply_rows:
        info = cache.get(int(r.user_id))
        uname = r.username or info.get('username') or ''
        replies.append({
            'username': uname,
            'user_id': int(r.user_id),
            'text': str(r.content or '').strip(),
            'created_at': _iso(r.created_at),
            'avatar_url': _avatar_for(int(r.user_id), uname),
        })

    return {
        'story_id': str(story.id),
        'total': len(view_rows),
        'viewers': viewers,
        'reactions': reactions,
        'replies': replies,
    }

# ============================== Analytics ==============================
def analytics_summary(db: Session, owner_id: int) -> dict:
    purge_expired(db)
    rows = (
        db.query(Story)
        .filter(Story.user_id == int(owner_id))
        .order_by(Story.created_at.desc())
        .all()
    )
    total_views = sum(int(s.views_count or 0) for s in rows)
    total_replies = sum(int(s.replies_count or 0) for s in rows)
    total_reactions = sum(int(s.reactions_count or 0) for s in rows)

    def _score(story: Story) -> int:
        return int(story.views_count or 0) + (int(story.replies_count or 0) * 3) + (int(story.reactions_count or 0) * 2)

    cache = _UsersCache(db)
    cache.prefetch([owner_id])
    top_story = max(rows, key=_score) if rows else None
    recent_stories = [serialize_story(db, s, viewer_user_id=owner_id, users_cache=cache) for s in rows[:5]]
    count = len(rows)
    return {
        'stories_count': count,
        'highlights_count': sum(1 for s in rows if s.highlight),
        'total_views': total_views,
        'total_replies': total_replies,
        'total_reactions': total_reactions,
        'average_views': round(total_views / count, 2) if count else 0,
        'average_replies': round(total_replies / count, 2) if count else 0,
        'average_reactions': round(total_reactions / count, 2) if count else 0,
        'engagement_rate': round(((total_replies + total_reactions) / count), 2) if count else 0,
        'top_story': serialize_story(db, top_story, viewer_user_id=owner_id, users_cache=cache) if top_story else None,
        'recent_stories': recent_stories,
    }


def list_close_friends_stories(db: Session, viewer_user_id: int, viewer_username: str = '') -> list[dict]:
    purge_expired(db)
    stories = (
        db.query(Story)
        .filter(_visible_filter(db, viewer_user_id), Story.privacy == 'close_friends')
        .order_by(Story.created_at.desc())
        .all()
    )
    if not stories:
        return []
    cache = _UsersCache(db)
    cache.prefetch([s.user_id for s in stories] + [viewer_user_id])
    serialized = [serialize_story(db, s, viewer_user_id=viewer_user_id, users_cache=cache) for s in stories]
    groups: dict[int, dict] = {}
    vuname = (viewer_username or '').strip().lower()
    for story in serialized:
        uid = int(story.get('user_id') or 0)
        if uid not in groups:
            groups[uid] = {
                'user_id': uid,
                'username': story.get('username') or '',
                'avatar_url': story.get('avatar_url') or '',
                'user_avatar': story.get('avatar_url') or '',
                'is_self': (str(story.get('username') or '').lower() == vuname),
                'has_unseen': False,
                'last_created_at': story.get('created_at'),
                'stories': [],
            }
        seen_list = [str(u).lower() for u in (story.get('seen_by') or [])]
        if vuname and vuname not in seen_list and str(story.get('username') or '').lower() != vuname:
            groups[uid]['has_unseen'] = True
        groups[uid]['stories'].append(story)
    result = list(groups.values())
    for g in result:
        g['stories'].sort(key=lambda s: s.get('created_at') or '')
    result.sort(key=lambda g: g.get('last_created_at') or '', reverse=True)
    return result


def toggle_story_mute_by_story(db: Session, story_id: int, viewer_user_id: int) -> dict:
    if MutedStoryUser is None:
        raise ValueError('mute story service unavailable')
    story = db.query(Story).filter(Story.id == int(story_id)).first()
    if story is None:
        raise KeyError('Story not found')
    owner_id = int(story.user_id)
    if owner_id == int(viewer_user_id):
        raise PermissionError('Cannot mute your own stories')
    existing = (
        db.query(MutedStoryUser)
        .filter(MutedStoryUser.muter_id == int(viewer_user_id), MutedStoryUser.muted_id == owner_id)
        .first()
    )
    if existing is not None:
        db.delete(existing)
        db.commit()
        return {'muted': False, 'story_id': str(story.id), 'target_user_id': owner_id}
    db.add(MutedStoryUser(muter_id=int(viewer_user_id), muted_id=owner_id))
    db.commit()
    return {'muted': True, 'story_id': str(story.id), 'target_user_id': owner_id}


def create_reel_from_story(db: Session, story: Story) -> dict | None:
    if story is None or str(getattr(story, 'media_type', '') or '') != 'video':
        return None
    try:
        reel = Reel(
            user_id=int(story.user_id),
            video_url=story.media_url,
            thumbnail_url=None,
            caption=story.caption or None,
            category='story',
            duration=int(getattr(story, 'duration', 0) or 0),
            likes_count=0,
            comments_count=0,
            shares_count=0,
            views_count=0,
            is_deleted=False,
            created_at=_now(),
            updated_at=_now(),
        )
        db.add(reel)
        db.commit()
        db.refresh(reel)
        return {'reel_id': int(reel.id), 'video_url': reel.video_url}
    except Exception as exc:
        logger.warning('story cross-post to reel failed for story %s: %s', getattr(story, 'id', '?'), exc)
        try:
            db.rollback()
        except Exception:
            pass
        return None
