from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class LiveComment:
    id: str
    room_id: str
    user: str
    text: str
    created_at: str


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
    comments: list[LiveComment] = field(default_factory=list)
    viewers: dict[str, dict] = field(default_factory=dict)


class LiveStore:
    def __init__(self) -> None:
        self.rooms: dict[str, LiveRoom] = {}
        self._next_room_id = 1
        self._next_comment_id = 1

    def create_room(self, host_user_id: int, username: str, title: str) -> LiveRoom:
        room_id = str(self._next_room_id)
        self._next_room_id += 1
        room = LiveRoom(
            id=room_id,
            host_user_id=host_user_id,
            username=username,
            title=title or f'Live by {username}',
            created_at=datetime.utcnow().isoformat(),
        )
        self.rooms[room_id] = room
        return room

    def list_rooms(self) -> list[dict]:
        rooms = [room for room in self.rooms.values() if room.active]
        rooms.sort(key=lambda item: item.created_at, reverse=True)
        return [self.serialize_room(room) for room in rooms]

    def get_room(self, room_id: str | int) -> LiveRoom | None:
        return self.rooms.get(str(room_id))

    def serialize_room(self, room: LiveRoom) -> dict:
        return {
            'id': room.id,
            'room_id': room.id,
            'username': room.username,
            'title': room.title,
            'viewer_count': room.viewer_count,
            'hearts_count': room.hearts_count,
            'active': room.active,
            'created_at': room.created_at,
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
        }
        room.viewer_count = sum(1 for viewer in room.viewers.values() if not viewer.get('is_host'))
        return self.serialize_room(room)

    def deactivate_presence(self, room_id: str, sid: str | None = None) -> dict | None:
        room = self.get_room(room_id)
        if room is None:
            return None
        if sid:
            room.viewers.pop(sid, None)
        room.viewer_count = sum(1 for viewer in room.viewers.values() if not viewer.get('is_host'))
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
        return comment.__dict__.copy()

    def get_comments(self, room_id: str) -> list[dict]:
        room = self.get_room(room_id)
        if room is None:
            return []
        return [comment.__dict__.copy() for comment in room.comments]

    def add_heart(self, room_id: str) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        room.hearts_count += 1
        return self.serialize_room(room)

    def end_room(self, room_id: str) -> dict | None:
        room = self.get_room(room_id)
        if room is None:
            return None
        room.active = False
        room.viewer_count = 0
        room.viewers.clear()
        return self.serialize_room(room)


live_store = LiveStore()
