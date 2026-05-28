from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime


def _utcnow() -> str:
    return datetime.utcnow().isoformat()


@dataclass
class LiveComment:
    id: str
    room_id: str
    user: str
    text: str
    created_at: str
    pinned: bool = False
    ai_moderated: bool = False
    moderation_score: float = 0.0


@dataclass
class LiveGift:
    id: str
    room_id: str
    user: str
    gift_name: str
    coins: int
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
    peak_viewer_count: int = 0
    featured: bool = False
    pinned_comment_id: str | None = None
    last_activity_at: str = field(default_factory=_utcnow)
    comments: list[LiveComment] = field(default_factory=list)
    viewers: dict[str, dict] = field(default_factory=dict)
    reactions: dict[str, int] = field(default_factory=lambda: defaultdict(int))
    gifts: list[LiveGift] = field(default_factory=list)
    co_hosts: list[str] = field(default_factory=list)
    muted_users: set[str] = field(default_factory=set)
    kicked_users: set[str] = field(default_factory=set)
    recording_status: str = 'idle'
    recording_url: str | None = None
    stream_analytics: dict = field(default_factory=lambda: {
        'total_watch_time': 0,
        'avg_bitrate': 4200,
        'packet_loss_events': 0,
        'gift_revenue': 0,
        'unique_viewers': set(),
    })
    economy: dict = field(default_factory=lambda: {
        'top_gifters': {},
        'current_pot': 0,
    })
    recovery_data: dict = field(default_factory=lambda: {
        'last_stable_timestamp': None,
        'reconnect_attempts': 0,
        'failover_ready': True,
    })
    multi_host_config: dict = field(default_factory=lambda: {
        'max_hosts': 4,
        'current_hosts': [],
        'layout': 'grid',
    })


class LiveStore:
    def __init__(self) -> None:
        self.rooms: dict[str, LiveRoom] = {}
        self._next_room_id = 1
        self._next_comment_id = 1
        self._next_gift_id = 1

    def create_room(self, host_user_id: int, username: str, title: str, **options) -> LiveRoom:
        room_id = str(self._next_room_id)
        self._next_room_id += 1
        now = _utcnow()
        room = LiveRoom(
            id=room_id,
            host_user_id=host_user_id,
            username=username,
            title=title or f'Live by {username}',
            created_at=now,
            last_activity_at=now,
        )
        room.multi_host_config['current_hosts'].append(username)
        room.co_hosts = list(room.multi_host_config['current_hosts'])
        self.rooms[room_id] = room
        return room

    def get_room(self, room_id: str) -> LiveRoom | None:
        return self.rooms.get(str(room_id))

    def list_rooms(self) -> list[dict]:
        return [self.serialize_room(room) for room in self.rooms.values() if room.active]

    def activate_presence(self, room_id: str, sid: str, username: str, is_host: bool = False, platform: str = 'web', device_type: str = 'browser') -> dict | None:
        room = self.get_room(room_id)
        if not room:
            return None
        room.viewers[str(sid)] = {
            'sid': str(sid),
            'username': username,
            'is_host': bool(is_host),
            'platform': platform,
            'device_type': device_type,
            'joined_at': _utcnow(),
        }
        room.viewer_count = len(room.viewers)
        room.peak_viewer_count = max(room.peak_viewer_count, room.viewer_count)
        room.stream_analytics['unique_viewers'].add(username)
        room.last_activity_at = _utcnow()
        if is_host and username not in room.multi_host_config['current_hosts']:
            room.multi_host_config['current_hosts'].append(username)
        room.co_hosts = list(room.multi_host_config['current_hosts'])
        return self.serialize_room(room)

    def deactivate_presence(self, room_id: str, sid: str) -> dict | None:
        room = self.get_room(room_id)
        if not room:
            return None
        room.viewers.pop(str(sid), None)
        room.viewer_count = len(room.viewers)
        room.last_activity_at = _utcnow()
        return self.serialize_room(room)

    def add_comment(self, room_id: str, username: str, text: str) -> LiveComment | None:
        room = self.get_room(room_id)
        if not room:
            return None
        is_toxic = any(word in text.lower() for word in ['bad', 'hate', 'toxic'])
        comment = LiveComment(
            id=str(self._next_comment_id),
            room_id=room_id,
            user=username,
            text=text,
            created_at=_utcnow(),
            ai_moderated=True,
            moderation_score=0.9 if is_toxic else 0.1,
        )
        self._next_comment_id += 1
        if not is_toxic:
            room.comments.append(comment)
            room.last_activity_at = _utcnow()
        return comment

    def add_heart(self, room_id: str) -> dict | None:
        room = self.get_room(room_id)
        if not room:
            return None
        room.hearts_count += 1
        room.reactions['heart'] += 1
        room.last_activity_at = _utcnow()
        return self.serialize_room(room)

    def send_gift(self, room_id: str, username: str, gift_name: str, coins: int) -> dict | None:
        room = self.get_room(room_id)
        if not room:
            return None
        gift = LiveGift(
            id=str(self._next_gift_id),
            room_id=room_id,
            user=username,
            gift_name=gift_name,
            coins=coins,
            created_at=_utcnow(),
        )
        self._next_gift_id += 1
        room.gifts.append(gift)
        room.economy['current_pot'] += coins
        room.economy['top_gifters'][username] = room.economy['top_gifters'].get(username, 0) + coins
        room.stream_analytics['gift_revenue'] += coins
        room.last_activity_at = _utcnow()
        return {'gift': gift, 'economy': self.serialize_room(room)['economy']}

    def update_analytics(self, room_id: str, metrics: dict):
        room = self.get_room(room_id)
        if not room:
            return
        room.stream_analytics['avg_bitrate'] = metrics.get('bitrate', room.stream_analytics['avg_bitrate'])
        if metrics.get('packet_loss', 0) > 5:
            room.stream_analytics['packet_loss_events'] += 1
            if room.stream_analytics['packet_loss_events'] > 3:
                room.recovery_data['failover_ready'] = True

    def orchestrate_recording(self, room_id: str, action: str):
        room = self.get_room(room_id)
        if not room:
            return
        if action == 'start':
            room.recording_status = 'recording'
        elif action == 'stop':
            room.recording_status = 'processing'
            room.recording_url = f'https://cdn.yamshat.com/recordings/{room_id}.mp4'
            room.recording_status = 'completed'
        room.last_activity_at = _utcnow()

    def manage_multi_host(self, room_id: str, action: str, target_username: str) -> bool:
        room = self.get_room(room_id)
        if not room:
            return False
        if action == 'add':
            if len(room.multi_host_config['current_hosts']) < room.multi_host_config['max_hosts'] and target_username not in room.multi_host_config['current_hosts']:
                room.multi_host_config['current_hosts'].append(target_username)
                room.co_hosts = list(room.multi_host_config['current_hosts'])
                room.last_activity_at = _utcnow()
                return True
        elif action == 'remove':
            if target_username in room.multi_host_config['current_hosts'] and target_username != room.username:
                room.multi_host_config['current_hosts'].remove(target_username)
                room.co_hosts = list(room.multi_host_config['current_hosts'])
                room.last_activity_at = _utcnow()
                return True
        return False

    def serialize_room(self, room: LiveRoom) -> dict:
        unique_viewers = room.stream_analytics.get('unique_viewers') or set()
        top_gifters = sorted(room.economy['top_gifters'].items(), key=lambda item: item[1], reverse=True)[:5]
        return {
            'id': room.id,
            'host': room.username,
            'username': room.username,
            'title': room.title,
            'created_at': room.created_at,
            'last_activity_at': room.last_activity_at,
            'viewer_count': room.viewer_count,
            'peak_viewer_count': room.peak_viewer_count,
            'hearts_count': room.hearts_count,
            'active': room.active,
            'recording': {
                'status': room.recording_status,
                'url': room.recording_url,
            },
            'analytics': {
                'gift_revenue': room.stream_analytics['gift_revenue'],
                'avg_bitrate': room.stream_analytics['avg_bitrate'],
                'health_score': max(0, 100 - (room.stream_analytics['packet_loss_events'] * 10)),
                'unique_viewers': len(unique_viewers),
            },
            'economy': {
                'pot': room.economy['current_pot'],
                'current_pot': room.economy['current_pot'],
                'total_coins': room.economy['current_pot'],
                'top_gifters': top_gifters,
            },
            'multi_host': room.multi_host_config,
            'co_hosts': list(room.multi_host_config['current_hosts']),
            'recovery': room.recovery_data,
            'comments_count': len(room.comments),
        }


live_store = LiveStore()
