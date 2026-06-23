from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta
from pathlib import Path


STORY_STORE_PATH = Path(__file__).resolve().parents[2] / 'uploads' / 'story_store.json'


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
class StoryItem:
    id: str
    user_id: int
    username: str
    media_url: str
    created_at: str
    expires_at: str
    media_type: str = 'image'  # image | video
    caption: str = ''
    privacy: str = 'friends'   # friends | close_friends | private | public
    music: str = ''
    stickers: list[str] = field(default_factory=list)
    mentions: list[str] = field(default_factory=list)
    poll_question: str = ''
    poll_options: list[str] = field(default_factory=list)
    countdown_at: str = ''
    filter_name: str = ''
    drawing_data: str = ''
    auto_delete_hours: int = 24
    is_close_friends: bool = False
    highlight: bool = False
    reactions: dict[str, int] = field(default_factory=dict)
    seen_by: list[str] = field(default_factory=list)
    replies: list[StoryReply] = field(default_factory=list)


class StoryStore:
    def __init__(self) -> None:
        self._stories: dict[str, StoryItem] = {}
        self._next_id = 1
        # ذاكرة الأصدقاء داخل الذاكرة (تُحقن من طبقة API لتجنّب الاقتران بقاعدة البيانات هنا).
        # المفتاح: user_id ، القيمة: set من user_ids للأصدقاء المقبولين.
        self._friends_cache: dict[int, set[int]] = {}
        self._close_friends_cache: dict[int, set[int]] = {}
        self._load()

    # =====================================================================
    # حقن قوائم الأصدقاء (تُستدعى من طبقة API قبل list_stories)
    # =====================================================================
    def set_friends_for(self, user_id: int, friend_ids: list[int]) -> None:
        """تحقن قائمة الأصدقاء الخاصة بمستخدم معيّن لاستخدامها في الفلترة."""
        self._friends_cache[int(user_id)] = {int(f) for f in (friend_ids or [])}

    def set_close_friends_for(self, user_id: int, close_ids: list[int]) -> None:
        """تحقن قائمة الأصدقاء المقربين."""
        self._close_friends_cache[int(user_id)] = {int(f) for f in (close_ids or [])}

    def add_story(self, user_id: int, username: str, media_url: str, metadata: dict | None = None) -> dict:
        metadata = metadata or {}
        now = datetime.utcnow()
        auto_delete_hours = int(metadata.get('auto_delete_hours') or 24)
        privacy = str(metadata.get('privacy') or 'friends').strip() or 'friends'
        # توافق خلفي: إذا أرسل العميل "public" نعتبرها "friends" لأن السياسة الجديدة لا تسمح بالعرض العام.
        if privacy == 'public':
            privacy = 'friends'

        # تخمين نوع الوسائط من الامتداد
        media_type = 'image'
        url_lower = media_url.lower()
        if any(url_lower.endswith(ext) for ext in ('.mp4', '.webm', '.mov', '.m4v', '.avi')):
            media_type = 'video'

        story = StoryItem(
            id=str(self._next_id),
            user_id=user_id,
            username=username,
            media_url=media_url,
            created_at=now.isoformat(),
            expires_at=(now + timedelta(hours=max(1, auto_delete_hours))).isoformat(),
            media_type=media_type,
            caption=str(metadata.get('caption') or '').strip()[:300],
            privacy=privacy,
            music=str(metadata.get('music') or '').strip()[:120],
            stickers=_safe_list(metadata.get('stickers'))[:8],
            mentions=_safe_list(metadata.get('mentions'))[:8],
            poll_question=str(metadata.get('poll_question') or '').strip()[:140],
            poll_options=_safe_list(metadata.get('poll_options'))[:4],
            countdown_at=str(metadata.get('countdown_at') or '').strip(),
            filter_name=str(metadata.get('filter_name') or '').strip()[:80],
            drawing_data=str(metadata.get('drawing_data') or '').strip()[:5000],
            auto_delete_hours=auto_delete_hours,
            is_close_friends=bool(metadata.get('is_close_friends')) or privacy == 'close_friends',
        )
        self._next_id += 1
        self._stories[story.id] = story
        self._save()
        return self.serialize_story(story)

    def list_stories(
        self,
        viewer_username: str | None = None,
        viewer_user_id: int | None = None,
        friend_ids: list[int] | None = None,
        close_friend_ids: list[int] | None = None,
    ) -> list[dict]:
        """يرجع القصص المرئية للمستخدم الحالي فقط (الأصدقاء + قصصه الخاصة).

        - الأصدقاء العاديون يرون فقط قصص أصدقائهم.
        - الأصدقاء المقربون يرون قصص الـ close_friends.
        - أصحاب القصص يرون قصصهم دائمًا.
        - القصص الخاصة (private) يراها صاحبها فقط.
        - لا توجد قصص عامة (public) في السياسة الجديدة.
        """
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
        return [self.serialize_story(item) for item in stories]

    # ---------------------- تجميع القصص حسب المستخدم ----------------------
    def list_grouped_stories(
        self,
        viewer_username: str | None,
        viewer_user_id: int | None,
        friend_ids: list[int] | None = None,
        close_friend_ids: list[int] | None = None,
    ) -> list[dict]:
        """يرجع القصص مجمّعة حسب المستخدم (شكل مناسب للشريط الدائري في الواجهة).

        كل عنصر:
            {
              user_id, username, avatar_url, has_unseen, last_created_at, stories: [...]
            }
        """
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
            seen = viewer_uname and viewer_uname in [str(u).lower() for u in (story.get('seen_by') or [])]
            if not seen and str(story.get('username') or '').lower() != viewer_uname:
                groups[uid]['has_unseen'] = True
            # احتفظ بأحدث تاريخ
            if story.get('created_at') and story.get('created_at') > groups[uid]['last_created_at']:
                groups[uid]['last_created_at'] = story.get('created_at')
            groups[uid]['stories'].append(story)

        result = list(groups.values())
        # رتّب: قصصي أولاً ثم غير المشاهدة ثم الأحدث
        result.sort(key=lambda g: (
            0 if g.get('is_self') else (1 if g.get('has_unseen') else 2),
            -1 * len(g.get('last_created_at') or ''),
        ))
        # رتّب قصص كل مستخدم تصاعديًا (الأقدم أولاً) لعرضها بالترتيب
        for g in result:
            g['stories'].sort(key=lambda s: s.get('created_at') or '')
        return result

    def mark_seen(self, story_id: str, viewer_username: str) -> dict:
        story = self._get_story(story_id)
        if viewer_username not in story.seen_by:
            story.seen_by.append(viewer_username)
            self._save()
        return self.serialize_story(story)

    def add_reaction(self, story_id: str, emoji: str, viewer_username: str) -> dict:
        story = self._get_story(story_id)
        if viewer_username not in story.seen_by:
            story.seen_by.append(viewer_username)
        safe_emoji = str(emoji or '🔥').strip()[:8] or '🔥'
        story.reactions[safe_emoji] = int(story.reactions.get(safe_emoji, 0)) + 1
        self._save()
        return self.serialize_story(story)

    def add_reply(self, story_id: str, username: str, text: str) -> dict:
        story = self._get_story(story_id)
        clean = str(text or '').strip()
        if not clean:
            raise ValueError('reply text is required')
        story.replies.append(StoryReply(username=username, text=clean[:280], created_at=datetime.utcnow().isoformat()))
        self._save()
        return self.serialize_story(story)

    def delete_story(self, story_id: str, owner_id: int) -> dict:
        """حذف قصة (يسمح فقط للمالك)."""
        story = self._get_story(story_id)
        if story.user_id != owner_id:
            raise PermissionError('Only owner can delete story')
        self._stories.pop(story.id, None)
        self._save()
        return {'deleted': True, 'id': story_id}

    def toggle_highlight(self, story_id: str, owner_id: int) -> dict:
        story = self._get_story(story_id)
        if story.user_id != owner_id:
            raise PermissionError('Only owner can update highlight')
        story.highlight = not story.highlight
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

    def serialize_story(self, item: StoryItem) -> dict:
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
            'countdown_at': item.countdown_at,
            'filter_name': item.filter_name,
            'drawing_data': item.drawing_data,
            'auto_delete_hours': item.auto_delete_hours,
            'is_close_friends': item.is_close_friends,
            'highlight': item.highlight,
            'reactions': item.reactions,
            'replies': [reply.__dict__ for reply in item.replies],
            'seen_by': item.seen_by,
            'views_count': len(item.seen_by),
            'replies_count': len(item.replies),
            'reactions_count': sum(item.reactions.values()),
        }

    def _get_story(self, story_id: str) -> StoryItem:
        self._purge_expired()
        story = self._stories.get(str(story_id))
        if story is None:
            raise KeyError('Story not found')
        return story

    def _is_visible(
        self,
        story: StoryItem,
        viewer_username: str | None,
        viewer_user_id: int | None,
        friends: set[int],
        close_friends: set[int],
    ) -> bool:
        """قاعدة الرؤية الجديدة:

        - قصص المستخدم نفسه: مرئية له دائمًا.
        - private: للمالك فقط.
        - close_friends: للمالك + الأصدقاء المقربين.
        - friends (الافتراضي): للمالك + الأصدقاء المقبولين.
        - public: لم تعد مدعومة في السياسة الجديدة — تُعالج كـ friends.
        """
        # قصة المستخدم نفسه دائمًا مرئية له
        if viewer_user_id is not None and story.user_id == viewer_user_id:
            return True

        if story.privacy == 'private':
            return False

        if story.privacy == 'close_friends':
            return int(story.user_id) in close_friends

        # friends (وكذلك public القديمة تُعامل كـ friends)
        return int(story.user_id) in friends

    def _purge_expired(self) -> None:
        now = datetime.utcnow()
        expired_ids = [story_id for story_id, item in self._stories.items() if datetime.fromisoformat(item.expires_at) <= now]
        for story_id in expired_ids:
            self._stories.pop(story_id, None)
        if expired_ids:
            self._save()

    def _serialize_store(self) -> dict:
        return {
            'next_id': self._next_id,
            'stories': [
                {
                    **asdict(item),
                    'replies': [reply.__dict__ for reply in item.replies],
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
                privacy = str(raw.get('privacy') or 'friends')
                if privacy == 'public':
                    privacy = 'friends'
                item = StoryItem(
                    id=str(raw.get('id') or ''),
                    user_id=int(raw.get('user_id') or 0),
                    username=str(raw.get('username') or ''),
                    media_url=str(raw.get('media_url') or ''),
                    created_at=str(raw.get('created_at') or datetime.utcnow().isoformat()),
                    expires_at=str(raw.get('expires_at') or (datetime.utcnow() + timedelta(hours=24)).isoformat()),
                    media_type=str(raw.get('media_type') or 'image'),
                    caption=str(raw.get('caption') or ''),
                    privacy=privacy,
                    music=str(raw.get('music') or ''),
                    stickers=_safe_list(raw.get('stickers'))[:8],
                    mentions=_safe_list(raw.get('mentions'))[:8],
                    poll_question=str(raw.get('poll_question') or ''),
                    poll_options=_safe_list(raw.get('poll_options'))[:4],
                    countdown_at=str(raw.get('countdown_at') or ''),
                    filter_name=str(raw.get('filter_name') or ''),
                    drawing_data=str(raw.get('drawing_data') or ''),
                    auto_delete_hours=int(raw.get('auto_delete_hours') or 24),
                    is_close_friends=bool(raw.get('is_close_friends')),
                    highlight=bool(raw.get('highlight')),
                    reactions={str(key): int(value or 0) for key, value in (raw.get('reactions') or {}).items()},
                    seen_by=_safe_list(raw.get('seen_by')),
                    replies=replies,
                )
                if item.id:
                    restored[item.id] = item
            self._stories = restored
            if self._stories:
                self._next_id = max(self._next_id, max(int(item_id) for item_id in self._stories.keys()) + 1)
            self._purge_expired()
        except Exception:
            self._stories = {}
            self._next_id = 1

    def _save(self) -> None:
        STORY_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
        STORY_STORE_PATH.write_text(json.dumps(self._serialize_store(), ensure_ascii=False, indent=2), encoding='utf-8')


story_store = StoryStore()
