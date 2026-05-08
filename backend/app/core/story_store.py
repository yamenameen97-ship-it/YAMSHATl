from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta


@dataclass
class StoryItem:
    id: str
    user_id: int
    username: str
    media_url: str
    created_at: str
    expires_at: str


class StoryStore:
    def __init__(self) -> None:
        self._stories: dict[str, StoryItem] = {}
        self._next_id = 1

    def add_story(self, user_id: int, username: str, media_url: str, ttl_hours: int = 24) -> dict:
        now = datetime.utcnow()
        story = StoryItem(
            id=str(self._next_id),
            user_id=user_id,
            username=username,
            media_url=media_url,
            created_at=now.isoformat(),
            expires_at=(now + timedelta(hours=ttl_hours)).isoformat(),
        )
        self._next_id += 1
        self._stories[story.id] = story
        return self.serialize_story(story)

    def list_stories(self) -> list[dict]:
        self._purge_expired()
        stories = sorted(self._stories.values(), key=lambda item: item.created_at, reverse=True)
        return [self.serialize_story(item) for item in stories]

    def serialize_story(self, item: StoryItem) -> dict:
        return {
            'id': item.id,
            'user_id': item.user_id,
            'username': item.username,
            'media_url': item.media_url,
            'media': item.media_url,
            'created_at': item.created_at,
            'expires_at': item.expires_at,
        }

    def _purge_expired(self) -> None:
        now = datetime.utcnow()
        expired_ids = [story_id for story_id, item in self._stories.items() if datetime.fromisoformat(item.expires_at) <= now]
        for story_id in expired_ids:
            self._stories.pop(story_id, None)


story_store = StoryStore()
