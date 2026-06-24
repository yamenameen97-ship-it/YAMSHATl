from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional


STORY_STORE_PATH = Path(__file__).resolve().parents[2] / 'uploads' / 'story_store.json'
UPLOADS_ROOT = Path(__file__).resolve().parents[2] / 'uploads'


def _now() -> datetime:
    """UTC الآن — متوافق مع Python 3.12+ (utcnow مهجور)."""
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.isoformat()


def _parse_iso(value: str) -> datetime:
    try:
        dt = datetime.fromisoformat(value)
    except Exception:
        return _now()
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _safe_list(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        parts = [item.strip() for item in value.split(',')]
        return [item for item in parts if item]
    if isinstance(value, (list, tuple, set)):
        return [str(item).strip() for item in value if str(item).strip()]
    return []


@dataclass
class StoryReply:
    username: str
    text: str
    created_at: str


@dataclass
class StoryView:
    """سجل مشاهدة مفصّل — يحفظ من شاهد ومتى."""
    username: str
    viewed_at: str
    user_id: int = 0


@dataclass
class StoryItem:
    id: str
    user_id: int
    username: str
    media_url: str
    created_at: str
    expires_at: str
    media_type: str = 'image'  # image | video
    caption: str = ''
    privacy: str = 'friends'   # friends | close_friends | private
    music: str = ''
    stickers: list[str] = field(default_factory=list)
    mentions: list[str] = field(default_factory=list)
    poll_question: str = ''
    poll_options: list[str] = field(default_factory=list)
    poll_votes: dict[str, int] = field(default_factory=dict)   # option_index -> count
    poll_voters: dict[str, int] = field(default_factory=dict)  # username -> option_index
    countdown_at: str = ''
    filter_name: str = ''
    drawing_data: str = ''
    auto_delete_hours: int = 24
    is_close_friends: bool = False
    highlight: bool = False
    highlight_title: str = ''
    reactions: dict[str, int] = field(default_factory=dict)
    seen_by: list[str] = field(default_factory=list)  # للتوافق الخلفي (usernames)
    views: list[StoryView] = field(default_factory=list)  # سجل مفصّل
    replies: list[StoryReply] = field(default_factory=list)


class StoryStore:
    """مخزن الستوريات — v59.10 مع تحسينات الأمان والميزات.

    ميزات جديدة في v59.10:
    - تسجيل مشاهدات مفصّل (ViewerList) مع التوقيت
    - حذف الملف الفعلي عند حذف القصة (تفادي تسرب التخزين)
    - دعم highlight_title (عنوان للقصص المميزة)
    - دعم تصويت Poll حقيقي مع منع التصويت المكرر
    - hook للإشعارات (mention_hook / new_story_hook) تُحقن من طبقة API
    - منع تسجيل المالك كمشاهد لقصته الخاصة
    - استخدام timezone-aware datetime (UTC)
    """

    def __init__(self) -> None:
        self._stories: dict[str, StoryItem] = {}
        self._next_id = 1
        # ذاكرة الأصدقاء داخل الذاكرة (تُحقن من طبقة API لتجنّب الاقتران بقاعدة البيانات هنا).
        self._friends_cache: dict[int, set[int]] = {}
        self._close_friends_cache: dict[int, set[int]] = {}
        # Hooks تُحقن من API: callable(payload: dict) -> None
        self._mention_hook = None
        self._new_story_hook = None
        self._load()

    # =====================================================================
    # حقن قوائم الأصدقاء و Hooks
    # =====================================================================
    def set_friends_for(self, user_id: int, friend_ids: list[int]) -> None:
        self._friends_cache[int(user_id)] = {int(f) for f in (friend_ids or [])}

    def set_close_friends_for(self, user_id: int, close_ids: list[int]) -> None:
        self._close_friends_cache[int(user_id)] = {int(f) for f in (close_ids or [])}

    def set_mention_hook(self, hook) -> None:
        """يستقبل dict: {story_id, owner_username, mentioned_username}"""
        self._mention_hook = hook if callable(hook) else None

    def set_new_story_hook(self, hook) -> None:
        """يستقبل dict: {story_id, owner_id, owner_username, privacy}"""
        self._new_story_hook = hook if callable(hook) else None

    def _safe_call(self, hook, payload: dict) -> None:
        if hook is None:
            return
        try:
            hook(payload)
        except Exception:
            # لا نسمح لأي خطأ في الـ hook بإفساد العملية
            pass

    # =====================================================================
    # إضافة قصة
    # =====================================================================
    def add_story(self, user_id: int, username: str, media_url: str, metadata: dict | None = None) -> dict:
        metadata = metadata or {}
        now = _now()
        auto_delete_hours = max(1, min(int(metadata.get('auto_delete_hours') or 24), 72))
        privacy = str(metadata.get('privacy') or 'friends').strip() or 'friends'
        # توافق خلفي: السياسة الجديدة لا تسمح بالعرض العام.
        if privacy == 'public':
            privacy = 'friends'
        if privacy not in ('friends', 'close_friends', 'private'):
            privacy = 'friends'

        # تخمين نوع الوسائط من الامتداد
        media_type = 'image'
        url_lower = media_url.lower()
        if any(url_lower.endswith(ext) for ext in ('.mp4', '.webm', '.mov', '.m4v', '.avi', '.mkv')):
            media_type = 'video'

        poll_options = _safe_list(metadata.get('poll_options'))[:4]
        poll_votes = {str(i): 0 for i in range(len(poll_options))} if poll_options else {}

        story = StoryItem(
            id=str(self._next_id),
            user_id=int(user_id),
            username=username,
            media_url=media_url,
            created_at=_iso(now),
            expires_at=_iso(now + timedelta(hours=auto_delete_hours)),
            media_type=media_type,
            caption=str(metadata.get('caption') or '').strip()[:300],
            privacy=privacy,
            music=str(metadata.get('music') or '').strip()[:120],
            stickers=_safe_list(metadata.get('stickers'))[:8],
            mentions=_safe_list(metadata.get('mentions'))[:8],
            poll_question=str(metadata.get('poll_question') or '').strip()[:140],
            poll_options=poll_options,
            poll_votes=poll_votes,
            countdown_at=str(metadata.get('countdown_at') or '').strip(),
            filter_name=str(metadata.get('filter_name') or '').strip()[:80],
            drawing_data=str(metadata.get('drawing_data') or '').strip()[:200000],  # v59.10: زيادة الحد إلى ~200KB
            auto_delete_hours=auto_delete_hours,
            is_close_friends=bool(metadata.get('is_close_friends')) or privacy == 'close_friends',
        )
        self._next_id += 1
        self._stories[story.id] = story
        self._save()

        # إشعارات (mentions + متابعين)
        for mention in story.mentions:
            self._safe_call(self._mention_hook, {
                'story_id': story.id,
                'owner_id': story.user_id,
                'owner_username': story.username,
                'mentioned_username': mention,
            })
        self._safe_call(self._new_story_hook, {
            'story_id': story.id,
            'owner_id': story.user_id,
            'owner_username': story.username,
            'privacy': story.privacy,
        })

        return self.serialize_story(story)

    # =====================================================================
    # القراءة
    # =====================================================================
    def list_stories(
        self,
        viewer_username: Optional[str] = None,
        viewer_user_id: Optional[int] = None,
        friend_ids: Optional[list[int]] = None,
        close_friend_ids: Optional[list[int]] = None,
    ) -> list[dict]:
        """قصص مرئية للمشاهد الحالي حسب السياسة."""
        self._purge_expired()

        if friend_ids is not None:
            self.set_friends_for(int(viewer_user_id or 0), friend_ids)
        if close_friend_ids is not None:
            self.set_close_friends_for(int(viewer_user_id or 0), close_friend_ids)

        friends = self._friends_cache.get(int(viewer_user_id or 0), set())
        close_friends = self._close_friends_cache.get(int(viewer_user_id or 0), set())

        stories = [
            item for item in self._stories.values()
            if self._is_visible(item, viewer_username, viewer_user_id, friends, close_friends)
        ]
        stories.sort(key=lambda item: item.created_at, reverse=True)
        return [self.serialize_story(item, viewer_username=viewer_username) for item in stories]

    def list_grouped_stories(
        self,
        viewer_username: Optional[str],
        viewer_user_id: Optional[int],
        friend_ids: Optional[list[int]] = None,
        close_friend_ids: Optional[list[int]] = None,
    ) -> list[dict]:
        """قصص مجمّعة حسب المستخدم — للشريط الدائري."""
        flat = self.list_stories(viewer_username, viewer_user_id, friend_ids, close_friend_ids)
        groups: dict[int, dict] = {}
        viewer_uname = str(viewer_username or '').strip().lower()
        for story in flat:
            uid = int(story.get('user_id') or 0)
            if uid not in groups:
                groups[uid] = {
                    'user_id': uid,
                    'username': story.get('username') or '',
                    'avatar_url': story.get('avatar_url') or '',
                    'is_self': (str(story.get('username') or '').lower() == viewer_uname),
                    'has_unseen': False,
                    'last_created_at': story.get('created_at'),
                    'stories': [],
                }
            seen_list = [str(u).lower() for u in (story.get('seen_by') or [])]
            seen = bool(viewer_uname) and viewer_uname in seen_list
            if not seen and str(story.get('username') or '').lower() != viewer_uname:
                groups[uid]['has_unseen'] = True
            if story.get('created_at') and story.get('created_at') > (groups[uid]['last_created_at'] or ''):
                groups[uid]['last_created_at'] = story.get('created_at')
            groups[uid]['stories'].append(story)

        result = list(groups.values())
        # ترتيب: قصصي أولاً ثم غير المشاهدة ثم الأحدث
        result.sort(key=lambda g: (
            0 if g.get('is_self') else (1 if g.get('has_unseen') else 2),
            -1 * len(g.get('last_created_at') or ''),
        ))
        for g in result:
            g['stories'].sort(key=lambda s: s.get('created_at') or '')
        return result

    # =====================================================================
    # التفاعل (مشاهدة / تفاعل / رد / تصويت)
    # =====================================================================
    def mark_seen(self, story_id: str, viewer_username: str, viewer_user_id: int = 0) -> dict:
        story = self._get_story(story_id)
        # المالك لا يُحسب مشاهداً لقصته
        if int(viewer_user_id or 0) and int(viewer_user_id) == story.user_id:
            return self.serialize_story(story, viewer_username=viewer_username)
        if not viewer_username:
            return self.serialize_story(story, viewer_username=viewer_username)

        uname = str(viewer_username).strip()
        if uname and uname not in story.seen_by:
            story.seen_by.append(uname)
            story.views.append(StoryView(
                username=uname,
                viewed_at=_iso(_now()),
                user_id=int(viewer_user_id or 0),
            ))
            self._save()
        return self.serialize_story(story, viewer_username=viewer_username)

    def add_reaction(self, story_id: str, emoji: str, viewer_username: str, viewer_user_id: int = 0) -> dict:
        story = self._get_story(story_id)
        # سجّل المشاهدة قبل التفاعل (لو لم يكن مالكاً)
        if viewer_username and not (int(viewer_user_id or 0) and int(viewer_user_id) == story.user_id):
            if viewer_username not in story.seen_by:
                story.seen_by.append(viewer_username)
                story.views.append(StoryView(
                    username=viewer_username,
                    viewed_at=_iso(_now()),
                    user_id=int(viewer_user_id or 0),
                ))
        safe_emoji = str(emoji or '🔥').strip()[:8] or '🔥'
        story.reactions[safe_emoji] = int(story.reactions.get(safe_emoji, 0)) + 1
        self._save()
        return self.serialize_story(story, viewer_username=viewer_username)

    def add_reply(self, story_id: str, username: str, text: str) -> dict:
        story = self._get_story(story_id)
        clean = str(text or '').strip()
        if not clean:
            raise ValueError('reply text is required')
        story.replies.append(StoryReply(
            username=username,
            text=clean[:280],
            created_at=_iso(_now()),
        ))
        self._save()
        return self.serialize_story(story, viewer_username=username)

    def vote_poll(self, story_id: str, option_index: int, voter_username: str) -> dict:
        """تصويت على استطلاع داخل قصة (يمنع التصويت المكرر)."""
        story = self._get_story(story_id)
        if not story.poll_options:
            raise ValueError('story has no poll')
        idx = int(option_index)
        if idx < 0 or idx >= len(story.poll_options):
            raise ValueError('invalid option index')
        if not voter_username:
            raise ValueError('voter username required')
        # منع التصويت المكرر — يمكن تغيير الرأي مرة واحدة
        previous = story.poll_voters.get(voter_username)
        if previous is not None:
            prev_idx = str(previous)
            story.poll_votes[prev_idx] = max(0, int(story.poll_votes.get(prev_idx, 0)) - 1)
        story.poll_voters[voter_username] = idx
        key = str(idx)
        story.poll_votes[key] = int(story.poll_votes.get(key, 0)) + 1
        self._save()
        return self.serialize_story(story, viewer_username=voter_username)

    # =====================================================================
    # الحذف / Highlights
    # =====================================================================
    def delete_story(self, story_id: str, owner_id: int) -> dict:
        story = self._get_story(story_id)
        if story.user_id != owner_id:
            raise PermissionError('Only owner can delete story')
        # حذف الملف الفعلي إن كان محلياً (تفادي تسرب التخزين)
        self._try_delete_media_file(story.media_url)
        self._stories.pop(story.id, None)
        self._save()
        return {'deleted': True, 'id': story_id}

    def toggle_highlight(self, story_id: str, owner_id: int, title: str = '') -> dict:
        story = self._get_story(story_id)
        if story.user_id != owner_id:
            raise PermissionError('Only owner can update highlight')
        story.highlight = not story.highlight
        if story.highlight and title:
            story.highlight_title = str(title).strip()[:80]
        elif not story.highlight:
            story.highlight_title = ''
        self._save()
        return self.serialize_story(story)

    def set_highlight_title(self, story_id: str, owner_id: int, title: str) -> dict:
        story = self._get_story(story_id)
        if story.user_id != owner_id:
            raise PermissionError('Only owner can update highlight title')
        story.highlight_title = str(title or '').strip()[:80]
        story.highlight = True  # ضمنياً تحويلها لـ highlight
        self._save()
        return self.serialize_story(story)

    def get_highlights(self, owner_id: int) -> list[dict]:
        self._purge_expired()
        items = [story for story in self._stories.values() if story.user_id == owner_id and story.highlight]
        items.sort(key=lambda item: item.created_at, reverse=True)
        return [self.serialize_story(item) for item in items]

    def get_archive(self, owner_id: int) -> list[dict]:
        self._purge_expired()
        items = [story for story in self._stories.values() if story.user_id == owner_id]
        items.sort(key=lambda item: item.created_at, reverse=True)
        return [self.serialize_story(item) for item in items]

    # =====================================================================
    # قائمة المشاهدين (للمالك فقط)
    # =====================================================================
    def get_viewers(self, story_id: str, owner_id: int) -> dict:
        """يرجع قائمة من شاهد قصة معينة — للمالك فقط."""
        story = self._get_story(story_id)
        if story.user_id != owner_id:
            raise PermissionError('Only owner can view viewers list')
        # دمج seen_by (legacy) مع views (الجديد)
        detailed = list(story.views)
        known = {v.username for v in detailed}
        for uname in story.seen_by:
            if uname not in known:
                detailed.append(StoryView(username=uname, viewed_at=story.created_at, user_id=0))
        detailed.sort(key=lambda v: v.viewed_at, reverse=True)
        return {
            'story_id': story.id,
            'total': len(detailed),
            'viewers': [
                {
                    'username': v.username,
                    'user_id': v.user_id,
                    'viewed_at': v.viewed_at,
                    'avatar_url': f'https://ui-avatars.com/api/?name={v.username}&background=8b5cf6&color=fff',
                }
                for v in detailed
            ],
        }

    # =====================================================================
    # تحليلات
    # =====================================================================
    def analytics_summary(self, owner_id: int) -> dict:
        self._purge_expired()
        items = [story for story in self._stories.values() if story.user_id == owner_id]
        total_views = sum(len(item.seen_by) for item in items)
        total_replies = sum(len(item.replies) for item in items)
        total_reactions = sum(sum(item.reactions.values()) for item in items)
        return {
            'stories_count': len(items),
            'highlights_count': sum(1 for item in items if item.highlight),
            'total_views': total_views,
            'total_replies': total_replies,
            'total_reactions': total_reactions,
            'engagement_rate': round(((total_replies + total_reactions) / max(len(items), 1)), 2),
        }

    # =====================================================================
    # Serialization
    # =====================================================================
    def serialize_story(self, item: StoryItem, viewer_username: Optional[str] = None) -> dict:
        viewer_uname = (viewer_username or '').strip()
        my_vote = item.poll_voters.get(viewer_uname) if viewer_uname else None
        return {
            'id': item.id,
            'user_id': item.user_id,
            'username': item.username,
            'media_url': item.media_url,
            'media': item.media_url,
            'media_type': item.media_type,
            'created_at': item.created_at,
            'expires_at': item.expires_at,
            'caption': item.caption,
            'privacy': item.privacy,
            'music': item.music,
            'stickers': item.stickers,
            'mentions': item.mentions,
            'poll_question': item.poll_question,
            'poll_options': item.poll_options,
            'poll_votes': item.poll_votes,
            'poll_total_votes': sum(item.poll_votes.values()) if item.poll_votes else 0,
            'my_vote': int(my_vote) if my_vote is not None else None,
            'countdown_at': item.countdown_at,
            'filter_name': item.filter_name,
            'drawing_data': item.drawing_data,
            'auto_delete_hours': item.auto_delete_hours,
            'is_close_friends': item.is_close_friends,
            'highlight': item.highlight,
            'highlight_title': item.highlight_title,
            'reactions': item.reactions,
            'replies': [reply.__dict__ for reply in item.replies],
            'seen_by': item.seen_by,
            'views_count': len(item.seen_by),
            'replies_count': len(item.replies),
            'reactions_count': sum(item.reactions.values()),
        }

    # =====================================================================
    # داخلية
    # =====================================================================
    def _get_story(self, story_id: str) -> StoryItem:
        self._purge_expired()
        story = self._stories.get(str(story_id))
        if story is None:
            raise KeyError('Story not found')
        return story

    def _is_visible(
        self,
        story: StoryItem,
        viewer_username: Optional[str],
        viewer_user_id: Optional[int],
        friends: set[int],
        close_friends: set[int],
    ) -> bool:
        # قصة المستخدم نفسه دائماً مرئية له
        if viewer_user_id is not None and story.user_id == int(viewer_user_id):
            return True

        if story.privacy == 'private':
            return False

        if story.privacy == 'close_friends':
            return int(story.user_id) in close_friends

        # friends (وكذلك public القديمة تُعامل كـ friends)
        return int(story.user_id) in friends

    def _purge_expired(self) -> None:
        now = _now()
        expired = []
        for story_id, item in list(self._stories.items()):
            try:
                if _parse_iso(item.expires_at) <= now:
                    expired.append(story_id)
            except Exception:
                expired.append(story_id)
        for story_id in expired:
            story = self._stories.pop(story_id, None)
            # عند انتهاء الصلاحية، إذا لم تكن highlight، احذف الملف الفعلي أيضاً
            if story and not story.highlight:
                self._try_delete_media_file(story.media_url)
        if expired:
            self._save()

    def _try_delete_media_file(self, media_url: str) -> None:
        """يحاول حذف الملف الفعلي إن كان محلياً (uploads/...).

        نتجاهل الأخطاء — قد يكون الملف على Cloudinary أو CDN.
        """
        try:
            if not media_url:
                return
            # نقبل فقط المسارات المحلية تحت /uploads/
            url = str(media_url).split('?')[0]
            if '://' in url:
                # مسار خارجي — لا نحذف
                return
            name = url.lstrip('/').split('/', 1)[-1] if url.lstrip('/').startswith('uploads/') else url.lstrip('/')
            candidate = (UPLOADS_ROOT / Path(name).name).resolve()
            # أمان: تأكد أن الملف داخل uploads
            try:
                candidate.relative_to(UPLOADS_ROOT.resolve())
            except Exception:
                return
            if candidate.exists() and candidate.is_file():
                candidate.unlink(missing_ok=True)
        except Exception:
            return

    def _serialize_store(self) -> dict:
        return {
            'next_id': self._next_id,
            'stories': [
                {
                    **asdict(item),
                    'replies': [reply.__dict__ for reply in item.replies],
                    'views': [view.__dict__ for view in item.views],
                }
                for item in self._stories.values()
            ],
        }

    def _load(self) -> None:
        try:
            STORY_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
            if not STORY_STORE_PATH.exists():
                return
            payload = json.loads(STORY_STORE_PATH.read_text(encoding='utf-8') or '{}')
            self._next_id = max(int(payload.get('next_id') or 1), 1)
            restored: dict[str, StoryItem] = {}
            for raw in payload.get('stories', []):
                if not isinstance(raw, dict):
                    continue
                replies = [StoryReply(**reply) for reply in raw.get('replies', []) if isinstance(reply, dict)]
                views = []
                for v in raw.get('views', []):
                    if isinstance(v, dict):
                        try:
                            views.append(StoryView(
                                username=str(v.get('username') or ''),
                                viewed_at=str(v.get('viewed_at') or ''),
                                user_id=int(v.get('user_id') or 0),
                            ))
                        except Exception:
                            continue
                privacy = str(raw.get('privacy') or 'friends')
                if privacy == 'public':
                    privacy = 'friends'
                if privacy not in ('friends', 'close_friends', 'private'):
                    privacy = 'friends'
                item = StoryItem(
                    id=str(raw.get('id') or ''),
                    user_id=int(raw.get('user_id') or 0),
                    username=str(raw.get('username') or ''),
                    media_url=str(raw.get('media_url') or ''),
                    created_at=str(raw.get('created_at') or _iso(_now())),
                    expires_at=str(raw.get('expires_at') or _iso(_now() + timedelta(hours=24))),
                    media_type=str(raw.get('media_type') or 'image'),
                    caption=str(raw.get('caption') or ''),
                    privacy=privacy,
                    music=str(raw.get('music') or ''),
                    stickers=_safe_list(raw.get('stickers'))[:8],
                    mentions=_safe_list(raw.get('mentions'))[:8],
                    poll_question=str(raw.get('poll_question') or ''),
                    poll_options=_safe_list(raw.get('poll_options'))[:4],
                    poll_votes={str(k): int(v or 0) for k, v in (raw.get('poll_votes') or {}).items()},
                    poll_voters={str(k): int(v) for k, v in (raw.get('poll_voters') or {}).items()},
                    countdown_at=str(raw.get('countdown_at') or ''),
                    filter_name=str(raw.get('filter_name') or ''),
                    drawing_data=str(raw.get('drawing_data') or ''),
                    auto_delete_hours=int(raw.get('auto_delete_hours') or 24),
                    is_close_friends=bool(raw.get('is_close_friends')),
                    highlight=bool(raw.get('highlight')),
                    highlight_title=str(raw.get('highlight_title') or ''),
                    reactions={str(key): int(value or 0) for key, value in (raw.get('reactions') or {}).items()},
                    seen_by=_safe_list(raw.get('seen_by')),
                    views=views,
                    replies=replies,
                )
                if item.id:
                    restored[item.id] = item
            self._stories = restored
            if self._stories:
                try:
                    self._next_id = max(self._next_id, max(int(item_id) for item_id in self._stories.keys()) + 1)
                except Exception:
                    pass
            self._purge_expired()
        except Exception:
            self._stories = {}
            self._next_id = 1

    def _save(self) -> None:
        try:
            STORY_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
            tmp_path = STORY_STORE_PATH.with_suffix('.json.tmp')
            tmp_path.write_text(
                json.dumps(self._serialize_store(), ensure_ascii=False, indent=2),
                encoding='utf-8',
            )
            # كتابة ذرّية لتجنب تلف الملف عند إنهاء العملية في منتصف الكتابة
            tmp_path.replace(STORY_STORE_PATH)
        except Exception:
            # لا نسمح لخطأ كتابة JSON بإيقاف الخدمة
            pass


story_store = StoryStore()
