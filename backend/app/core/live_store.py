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
    deleted: bool = False
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
    viewer_sync: dict[str, dict] = field(default_factory=dict)
    reactions: dict[str, int] = field(default_factory=lambda: defaultdict(int))
    gifts: list[LiveGift] = field(default_factory=list)
    co_hosts: list[str] = field(default_factory=list)
    muted_users: set[str] = field(default_factory=set)
    banned_users: set[str] = field(default_factory=set)
    kicked_users: set[str] = field(default_factory=set)
    recording_status: str = 'idle'
    recording_url: str | None = None
    stream_analytics: dict = field(default_factory=lambda: {
        'total_watch_time': 0,
        'avg_bitrate': 4200,
        'target_bitrate': 4500,
        'packet_loss_events': 0,
        'gift_revenue': 0,
        'unique_viewers': set(),
    })
    stream_health: dict = field(default_factory=lambda: {
        'health_score': 96,
        'latency_ms': 850,
        'packet_loss': 0.4,
        'fps': 30,
        'resolution': '1280x720',
        'bitrate_kbps': 4200,
        'target_bitrate_kbps': 4500,
        'bitrate_mode': 'adaptive',
        'status': 'stable',
        'updated_at': _utcnow(),
    })
    economy: dict = field(default_factory=lambda: {
        'top_gifters': {},
        'current_pot': 0,
    })
    recovery_data: dict = field(default_factory=lambda: {
        'last_stable_timestamp': None,
        'reconnect_attempts': 0,
        'failover_ready': True,
        'last_recovery_reason': None,
    })
    multi_host_config: dict = field(default_factory=lambda: {
        'max_hosts': 4,
        'current_hosts': [],
        'layout': 'grid',
    })
    moderation_state: dict = field(default_factory=lambda: {
        'blocked_comments': 0,
        'deleted_comments': 0,
        'muted_users': [],
        'banned_users': [],
    })


class LiveStore:
    def __init__(self) -> None:
        self.rooms: dict[str, LiveRoom] = {}
        self._next_room_id = 1
        self._next_comment_id = 1
        self._next_gift_id = 1

    def create_room(self, host_user_id: int, username: str, title: str, **options) -> LiveRoom:
        room_id = str(options.get('room_id') or self._next_room_id)
        if 'room_id' not in options:
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
        room.viewer_sync[str(sid)] = {
            'username': username,
            'latency_ms': room.stream_health['latency_ms'],
            'bitrate_kbps': room.stream_health['bitrate_kbps'],
            'last_sync_at': _utcnow(),
            'state': 'connected',
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
        if sid in room.viewer_sync:
            room.viewer_sync[str(sid)]['state'] = 'disconnected'
            room.viewer_sync[str(sid)]['last_sync_at'] = _utcnow()
        room.viewer_count = len(room.viewers)
        room.last_activity_at = _utcnow()
        return self.serialize_room(room)

    def sync_viewer(self, room_id: str, username: str, sid: str, metrics: dict | None = None) -> dict | None:
        room = self.get_room(room_id)
        if not room:
            return None
        metrics = metrics or {}
        latency_ms = int(metrics.get('latency_ms') or room.stream_health['latency_ms'])
        bitrate_kbps = int(metrics.get('bitrate_kbps') or metrics.get('bitrate') or room.stream_health['bitrate_kbps'])
        state = str(metrics.get('state') or 'synced')
        room.viewer_sync[str(sid)] = {
            'username': username,
            'latency_ms': latency_ms,
            'bitrate_kbps': bitrate_kbps,
            'last_sync_at': _utcnow(),
            'state': state,
        }
        if state == 'reconnecting':
            room.recovery_data['reconnect_attempts'] += 1
            room.recovery_data['last_recovery_reason'] = 'viewer_reconnect'
        room.last_activity_at = _utcnow()
        return {
            'viewer_count': room.viewer_count,
            'sync_sessions': len(room.viewer_sync),
            'recovery': dict(room.recovery_data),
            'viewer_sync': list(room.viewer_sync.values())[-10:],
        }

    def add_comment(self, room_id: str, username: str, text: str) -> LiveComment | None:
        room = self.get_room(room_id)
        if not room or username in room.banned_users or username in room.kicked_users:
            return None
        if username in room.muted_users:
            comment = LiveComment(
                id=str(self._next_comment_id),
                room_id=room_id,
                user=username,
                text=text,
                created_at=_utcnow(),
                ai_moderated=True,
                moderation_score=1.0,
                deleted=True,
            )
            self._next_comment_id += 1
            room.moderation_state['blocked_comments'] += 1
            return comment
        normalized = text.lower()
        toxic_words = ['bad', 'hate', 'toxic', 'spam', 'idiot']
        is_toxic = any(word in normalized for word in toxic_words)
        comment = LiveComment(
            id=str(self._next_comment_id),
            room_id=room_id,
            user=username,
            text=text,
            created_at=_utcnow(),
            ai_moderated=True,
            moderation_score=0.92 if is_toxic else 0.08,
        )
        self._next_comment_id += 1
        if is_toxic:
            room.moderation_state['blocked_comments'] += 1
            room.last_activity_at = _utcnow()
            return comment
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

    def update_health(self, room_id: str, metrics: dict):
        room = self.get_room(room_id)
        if not room:
            return None
        bitrate = int(metrics.get('bitrate_kbps') or metrics.get('bitrate') or room.stream_health['bitrate_kbps'])
        target_bitrate = int(metrics.get('target_bitrate_kbps') or metrics.get('target_bitrate') or room.stream_health['target_bitrate_kbps'])
        latency = int(metrics.get('latency_ms') or room.stream_health['latency_ms'])
        packet_loss = float(metrics.get('packet_loss') or room.stream_health['packet_loss'])
        fps = int(metrics.get('fps') or room.stream_health['fps'])
        resolution = str(metrics.get('resolution') or room.stream_health['resolution'])
        penalty = min(60, int(packet_loss * 5) + max(0, (latency - 1000) // 80) + max(0, (target_bitrate - bitrate) // 300))
        status = 'stable'
        if packet_loss > 5 or latency > 2200:
            status = 'critical'
        elif packet_loss > 2 or latency > 1400:
            status = 'warning'
        room.stream_health.update({
            'health_score': max(20, 100 - penalty),
            'latency_ms': latency,
            'packet_loss': packet_loss,
            'fps': fps,
            'resolution': resolution,
            'bitrate_kbps': bitrate,
            'target_bitrate_kbps': target_bitrate,
            'bitrate_mode': 'adaptive',
            'status': status,
            'updated_at': _utcnow(),
        })
        room.stream_analytics['avg_bitrate'] = bitrate
        room.stream_analytics['target_bitrate'] = target_bitrate
        if packet_loss > 2:
            room.stream_analytics['packet_loss_events'] += 1
            if room.stream_analytics['packet_loss_events'] > 3:
                room.recovery_data['failover_ready'] = True
        if bitrate < target_bitrate:
            room.recovery_data['last_stable_timestamp'] = _utcnow()
        room.last_activity_at = _utcnow()
        return dict(room.stream_health)

    def update_analytics(self, room_id: str, metrics: dict):
        return self.update_health(room_id, metrics)

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

    def moderate(self, room_id: str, action: str, target_username: str | None = None, comment_id: str | None = None) -> dict | None:
        room = self.get_room(room_id)
        if not room:
            return None
        if action == 'mute_user' and target_username:
            room.muted_users.add(target_username)
        elif action == 'unmute_user' and target_username:
            room.muted_users.discard(target_username)
        elif action == 'ban_user' and target_username:
            room.banned_users.add(target_username)
            room.kicked_users.add(target_username)
        elif action == 'delete_comment' and comment_id:
            comment = next((item for item in room.comments if item.id == str(comment_id)), None)
            if comment:
                comment.deleted = True
                room.comments = [item for item in room.comments if item.id != str(comment_id)]
                room.moderation_state['deleted_comments'] += 1
        elif action in {'pin_comment', 'unpin_comment'} and comment_id:
            room.pinned_comment_id = str(comment_id) if action == 'pin_comment' else None
            for comment in room.comments:
                comment.pinned = action == 'pin_comment' and comment.id == str(comment_id)
        else:
            return None
        room.moderation_state['muted_users'] = sorted(room.muted_users)
        room.moderation_state['banned_users'] = sorted(room.banned_users)
        room.last_activity_at = _utcnow()
        return {
            'action': action,
            'muted_users': sorted(room.muted_users),
            'banned_users': sorted(room.banned_users),
            'pinned_comment_id': room.pinned_comment_id,
            'deleted_comments': room.moderation_state['deleted_comments'],
        }

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
                'target_bitrate': room.stream_analytics['target_bitrate'],
                'health_score': room.stream_health['health_score'],
                'unique_viewers': len(unique_viewers),
            },
            'health': dict(room.stream_health),
            'economy': {
                'pot': room.economy['current_pot'],
                'current_pot': room.economy['current_pot'],
                'total_coins': room.economy['current_pot'],
                'top_gifters': top_gifters,
            },
            'multi_host': room.multi_host_config,
            'co_hosts': list(room.multi_host_config['current_hosts']),
            'recovery': room.recovery_data,
            'viewer_sync': {
                'sessions': len(room.viewer_sync),
                'latest': list(room.viewer_sync.values())[-5:],
            },
            'moderation': {
                'blocked_comments': room.moderation_state['blocked_comments'],
                'deleted_comments': room.moderation_state['deleted_comments'],
                'muted_users': sorted(room.muted_users),
                'banned_users': sorted(room.banned_users),
                'pinned_comment_id': room.pinned_comment_id,
            },
            'comments_count': len(room.comments),
        }


live_store = LiveStore()
