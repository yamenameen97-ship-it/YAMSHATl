from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta


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
    caption: str = ''
    privacy: str = 'public'
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

    def add_story(self, user_id: int, username: str, media_url: str, metadata: dict | None = None) -> dict:
        metadata = metadata or {}
        now = datetime.utcnow()
        auto_delete_hours = int(metadata.get('auto_delete_hours') or 24)
        privacy = str(metadata.get('privacy') or 'public').strip() or 'public'
        story = StoryItem(
            id=str(self._next_id),
            user_id=user_id,
            username=username,
            media_url=media_url,
            created_at=now.isoformat(),
            expires_at=(now + timedelta(hours=max(1, auto_delete_hours))).isoformat(),
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
        return self.serialize_story(story)

    def list_stories(self, viewer_username: str | None = None, viewer_user_id: int | None = None) -> list[dict]:
        self._purge_expired()
        stories = [item for item in self._stories.values() if self._is_visible(item, viewer_username, viewer_user_id)]
        stories.sort(key=lambda item: item.created_at, reverse=True)
        return [self.serialize_story(item) for item in stories]

    def mark_seen(self, story_id: str, viewer_username: str) -> dict:
        story = self._get_story(story_id)
        if viewer_username not in story.seen_by:
            story.seen_by.append(viewer_username)
        return self.serialize_story(story)

    def add_reaction(self, story_id: str, emoji: str, viewer_username: str) -> dict:
        story = self._get_story(story_id)
        if viewer_username not in story.seen_by:
            story.seen_by.append(viewer_username)
        safe_emoji = str(emoji or '🔥').strip()[:8] or '🔥'
        story.reactions[safe_emoji] = int(story.reactions.get(safe_emoji, 0)) + 1
        return self.serialize_story(story)

    def add_reply(self, story_id: str, username: str, text: str) -> dict:
        story = self._get_story(story_id)
        clean = str(text or '').strip()
        if not clean:
            raise ValueError('reply text is required')
        story.replies.append(StoryReply(username=username, text=clean[:280], created_at=datetime.utcnow().isoformat()))
        return self.serialize_story(story)

    def toggle_highlight(self, story_id: str, owner_id: int) -> dict:
        story = self._get_story(story_id)
        if story.user_id != owner_id:
            raise PermissionError('Only owner can update highlight')
        story.highlight = not story.highlight
        return self.serialize_story(story)

    def get_highlights(self, owner_id: int) -> list[dict]:
        self._purge_expired()
        items = [story for story in self._stories.values() if story.user_id == owner_id and story.highlight]
        items.sort(key=lambda item: item.created_at, reverse=True)
        return [self.serialize_story(item) for item in items]

    def get_archive(self, owner_id: int) -> list[dict]:
        items = [story for story in self._stories.values() if story.user_id == owner_id]
        items.sort(key=lambda item: item.created_at, reverse=True)
        return [self.serialize_story(item) for item in items]

    def analytics_summary(self, owner_id: int) -> dict:
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

    def _is_visible(self, story: StoryItem, _viewer_username: str | None, viewer_user_id: int | None) -> bool:
        if story.privacy == 'private':
            return story.user_id == viewer_user_id
        return True

    def _purge_expired(self) -> None:
        now = datetime.utcnow()
        expired_ids = [story_id for story_id, item in self._stories.items() if datetime.fromisoformat(item.expires_at) <= now]
        for story_id in expired_ids:
            self._stories.pop(story_id, None)


story_store = StoryStore()
