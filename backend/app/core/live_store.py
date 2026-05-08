from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class LiveComment:
    id: str
    room_id: str
    user: str
    text: str
    created_at: str
    pinned: bool = False


@dataclass
class LiveRoom:
    id: str
    host_user_id: int
    username: str
    title: str
    created_at: str
    active: bool = True
    viewer_count: int = 0
    hearts_count: int = 0
    peak_viewer_count: int = 0
    featured: bool = False
    pinned_comment_id: str | None = None
    last_activity_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    comments: list[LiveComment] = field(default_factory=list)
    viewers: dict[str, dict] = field(default_factory=dict)


class LiveStore:
    def __init__(self) -> None:
        self.rooms: dict[str, LiveRoom] = {}
        self._next_room_id = 1
        self._next_comment_id = 1

    def _touch_room(self, room: LiveRoom) -> None:
        room.last_activity_at = datetime.utcnow().isoformat()

    def create_room(self, host_user_id: int, username: str, title: str) -> LiveRoom:
        room_id = str(self._next_room_id)
        self._next_room_id += 1
        now = datetime.utcnow().isoformat()
        room = LiveRoom(
            id=room_id,
            host_user_id=host_user_id,
            username=username,
            title=title or f'Live by {username}',
            created_at=now,
            last_activity_at=now,
        )
        self.rooms[room_id] = room
        return room

    def list_rooms(self) -> list[dict]:
        rooms = [room for room in self.rooms.values() if room.active]
        rooms.sort(
            key=lambda item: (
                0 if item.featured else 1,
                -(item.viewer_count or 0),
                item.last_activity_at or item.created_at,
            ),
            reverse=False,
        )
        return [self.serialize_room(room) for room in rooms]

    def get_room(self, room_id: str | int) -> LiveRoom | None:
        return self.rooms.get(str(room_id))

    def get_pinned_comment(self, room: LiveRoom) -> LiveComment | None:
        if not room.pinned_comment_id:
            return None
        return next((comment for comment in room.comments if comment.id == room.pinned_comment_id), None)

    def serialize_comment(self, room: LiveRoom, comment: LiveComment) -> dict:
        return {
            'id': comment.id,
            'room_id': comment.room_id,
            'user': comment.user,
            'text': comment.text,
            'created_at': comment.created_at,
            'pinned': comment.id == room.pinned_comment_id,
        }

    def serialize_room(self, room: LiveRoom) -> dict:
        pinned_comment = self.get_pinned_comment(room)
        latest_comment = room.comments[-1] if room.comments else None
        viewers_preview = list(room.viewers.values())[:6]
        return {
            'id': room.id,
            'room_id': room.id,
            'username': room.username,
            'host_user_id': room.host_user_id,
            'title': room.title,
            'viewer_count': room.viewer_count,
            'peak_viewer_count': room.peak_viewer_count,
            'hearts_count': room.hearts_count,
            'comments_count': len(room.comments),
            'active': room.active,
            'featured': room.featured,
            'created_at': room.created_at,
            'last_activity_at': room.last_activity_at,
            'viewers_preview': viewers_preview,
            'pinned_comment': self.serialize_comment(room, pinned_comment) if pinned_comment else None,
            'latest_comment_preview': self.serialize_comment(room, latest_comment) if latest_comment else None,
        }

    def activate_presence(self, room_id: str, sid: str, username: str, is_host: bool, platform: str, device_type: str) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')

        room.viewers[sid] = {
            'username': username,
            'is_host': is_host,
            'platform': platform,
            'device_type': device_type,
            'joined_at': datetime.utcnow().isoformat(),
        }
        room.viewer_count = sum(1 for viewer in room.viewers.values() if not viewer.get('is_host'))
        room.peak_viewer_count = max(room.peak_viewer_count, room.viewer_count)
        self._touch_room(room)
        return self.serialize_room(room)

    def deactivate_presence(self, room_id: str, sid: str | None = None) -> dict | None:
        room = self.get_room(room_id)
        if room is None:
            return None
        if sid:
            room.viewers.pop(sid, None)
        room.viewer_count = sum(1 for viewer in room.viewers.values() if not viewer.get('is_host'))
        self._touch_room(room)
        return self.serialize_room(room)

    def add_comment(self, room_id: str, username: str, text: str) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        comment = LiveComment(
            id=str(self._next_comment_id),
            room_id=str(room_id),
            user=username,
            text=text,
            created_at=datetime.utcnow().isoformat(),
        )
        self._next_comment_id += 1
        room.comments.append(comment)
        self._touch_room(room)
        return self.serialize_comment(room, comment)

    def get_comments(self, room_id: str) -> list[dict]:
        room = self.get_room(room_id)
        if room is None:
            return []
        return [self.serialize_comment(room, comment) for comment in room.comments]

    def add_heart(self, room_id: str) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        room.hearts_count += 1
        self._touch_room(room)
        return self.serialize_room(room)

    def pin_comment(self, room_id: str, comment_id: str | None) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        if comment_id is None:
            room.pinned_comment_id = None
            self._touch_room(room)
            return self.serialize_room(room)
        comment = next((item for item in room.comments if item.id == str(comment_id)), None)
        if comment is None:
            raise KeyError('Comment not found')
        room.pinned_comment_id = comment.id
        self._touch_room(room)
        return self.serialize_room(room)

    def pin_latest_comment(self, room_id: str) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        if not room.comments:
            raise KeyError('No comments found')
        return self.pin_comment(room_id, room.comments[-1].id)

    def toggle_featured(self, room_id: str, featured: bool | None = None) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        room.featured = (not room.featured) if featured is None else bool(featured)
        self._touch_room(room)
        return self.serialize_room(room)

    def admin_overview(self) -> dict:
        active_rooms = [room for room in self.rooms.values() if room.active]
        active_rooms.sort(key=lambda item: item.last_activity_at or item.created_at, reverse=True)
        total_comments = sum(len(room.comments) for room in active_rooms)
        total_viewers = sum(room.viewer_count for room in active_rooms)
        total_hearts = sum(room.hearts_count for room in active_rooms)
        featured_rooms = sum(1 for room in active_rooms if room.featured)
        peak_room = max(active_rooms, key=lambda item: item.peak_viewer_count, default=None)
        return {
            'stats': {
                'active_rooms': len(active_rooms),
                'featured_rooms': featured_rooms,
                'current_viewers': total_viewers,
                'comments_count': total_comments,
                'hearts_count': total_hearts,
                'top_peak_viewers': peak_room.peak_viewer_count if peak_room else 0,
            },
            'rooms': [self.serialize_room(room) for room in active_rooms],
        }

    def end_room(self, room_id: str) -> dict | None:
        room = self.get_room(room_id)
        if room is None:
            return None
        room.active = False
        room.viewer_count = 0
        room.viewers.clear()
        self._touch_room(room)
        return self.serialize_room(room)


live_store = LiveStore()
