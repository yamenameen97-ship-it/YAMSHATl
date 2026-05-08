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


@dataclass
class LiveGift:
    id: str
    room_id: str
    user: str
    gift_name: str
    coins: int
    created_at: str


@dataclass
class LivePollOption:
    id: str
    text: str
    votes: int = 0


@dataclass
class LivePoll:
    id: str
    room_id: str
    question: str
    created_by: str
    created_at: str
    active: bool = True
    votes_by_user: dict[str, str] = field(default_factory=dict)
    options: list[LivePollOption] = field(default_factory=list)


@dataclass
class LiveReplayClip:
    id: str
    label: str
    started_at: str
    ended_at: str


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
    polls: list[LivePoll] = field(default_factory=list)
    replay_clips: list[LiveReplayClip] = field(default_factory=list)
    co_hosts: list[str] = field(default_factory=list)
    muted_users: set[str] = field(default_factory=set)
    kicked_users: set[str] = field(default_factory=set)
    battle_room_id: str | None = None
    battle_score: int = 0
    live_share_count: int = 0
    coin_pot: int = 0
    auto_reconnect_enabled: bool = True
    adaptive_bitrate_enabled: bool = True
    background_streaming_enabled: bool = True
    live_notifications_enabled: bool = True
    cdn_url: str | None = None
    scheduled_for: str | None = None
    recording_enabled: bool = False
    recording_url: str | None = None
    recording_started_at: str | None = None
    last_health: dict = field(default_factory=lambda: {
        'status': 'healthy',
        'bitrate_kbps': 1800,
        'packet_loss': 0,
        'rtt_ms': 45,
        'reconnecting': False,
        'updated_at': _utcnow(),
    })
    analytics: dict = field(default_factory=lambda: {
        'join_events': 0,
        'comment_events': 0,
        'gift_events': 0,
        'reaction_events': 0,
        'poll_votes': 0,
        'shares': 0,
        'mute_events': 0,
        'kick_events': 0,
    })


class LiveStore:
    def __init__(self) -> None:
        self.rooms: dict[str, LiveRoom] = {}
        self._next_room_id = 1
        self._next_comment_id = 1
        self._next_gift_id = 1
        self._next_poll_id = 1
        self._next_replay_id = 1

    def _touch_room(self, room: LiveRoom) -> None:
        room.last_activity_at = _utcnow()

    def _active_poll(self, room: LiveRoom) -> LivePoll | None:
        for poll in reversed(room.polls):
            if poll.active:
                return poll
        return None

    def _serialize_comment(self, room: LiveRoom, comment: LiveComment | None) -> dict | None:
        if comment is None:
            return None
        return {
            'id': comment.id,
            'room_id': comment.room_id,
            'user': comment.user,
            'text': comment.text,
            'created_at': comment.created_at,
            'pinned': comment.id == room.pinned_comment_id,
        }

    def _serialize_poll(self, poll: LivePoll | None) -> dict | None:
        if poll is None:
            return None
        return {
            'id': poll.id,
            'room_id': poll.room_id,
            'question': poll.question,
            'created_by': poll.created_by,
            'created_at': poll.created_at,
            'active': poll.active,
            'options': [
                {'id': option.id, 'text': option.text, 'votes': option.votes}
                for option in poll.options
            ],
            'total_votes': sum(option.votes for option in poll.options),
        }

    def _serialize_room(self, room: LiveRoom) -> dict:
        pinned_comment = next((item for item in room.comments if item.id == room.pinned_comment_id), None)
        latest_comment = room.comments[-1] if room.comments else None
        gifts_summary = {
            'count': len(room.gifts),
            'coin_pot': int(room.coin_pot or 0),
            'recent': [
                {
                    'id': gift.id,
                    'user': gift.user,
                    'gift_name': gift.gift_name,
                    'coins': gift.coins,
                    'created_at': gift.created_at,
                }
                for gift in room.gifts[-6:]
            ],
        }
        replay = {
            'clips': [
                {
                    'id': clip.id,
                    'label': clip.label,
                    'started_at': clip.started_at,
                    'ended_at': clip.ended_at,
                }
                for clip in room.replay_clips[-6:]
            ],
            'has_replay': bool(room.replay_clips),
        }
        return {
            'id': room.id,
            'room_id': room.id,
            'username': room.username,
            'host_user_id': room.host_user_id,
            'title': room.title,
            'viewer_count': int(room.viewer_count or 0),
            'real_viewer_count': int(room.viewer_count or 0),
            'peak_viewer_count': int(room.peak_viewer_count or 0),
            'hearts_count': int(room.hearts_count or 0),
            'comments_count': len(room.comments),
            'active': bool(room.active),
            'featured': bool(room.featured),
            'created_at': room.created_at,
            'last_activity_at': room.last_activity_at,
            'viewers_preview': list(room.viewers.values())[:8],
            'pinned_comment': self._serialize_comment(room, pinned_comment),
            'latest_comment_preview': self._serialize_comment(room, latest_comment),
            'auto_reconnect_enabled': bool(room.auto_reconnect_enabled),
            'adaptive_bitrate_enabled': bool(room.adaptive_bitrate_enabled),
            'background_streaming_enabled': bool(room.background_streaming_enabled),
            'live_notifications_enabled': bool(room.live_notifications_enabled),
            'stream_health': dict(room.last_health),
            'gifts_summary': gifts_summary,
            'coins_summary': {'coin_pot': int(room.coin_pot or 0)},
            'co_hosts': list(room.co_hosts),
            'battle': {
                'opponent_room_id': room.battle_room_id,
                'score': int(room.battle_score or 0),
                'active': bool(room.battle_room_id),
            },
            'moderation': {
                'muted_users': sorted(room.muted_users),
                'kicked_users': sorted(room.kicked_users),
            },
            'replay': replay,
            'recording': {
                'enabled': bool(room.recording_enabled),
                'url': room.recording_url,
                'started_at': room.recording_started_at,
            },
            'scheduling': {'scheduled_for': room.scheduled_for},
            'analytics': dict(room.analytics),
            'live_reactions': dict(room.reactions),
            'active_poll': self._serialize_poll(self._active_poll(room)),
            'live_share_count': int(room.live_share_count or 0),
            'cdn_url': room.cdn_url,
        }

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
            scheduled_for=options.get('scheduled_for'),
            recording_enabled=bool(options.get('recording_enabled', False)),
            live_notifications_enabled=bool(options.get('live_notifications_enabled', True)),
            background_streaming_enabled=bool(options.get('background_streaming_enabled', True)),
            auto_reconnect_enabled=bool(options.get('auto_reconnect_enabled', True)),
            adaptive_bitrate_enabled=bool(options.get('adaptive_bitrate_enabled', True)),
            cdn_url=options.get('cdn_url') or None,
        )
        self.rooms[room_id] = room
        return room

    def list_rooms(self) -> list[dict]:
        rooms = list(self.rooms.values())
        rooms.sort(
            key=lambda item: (
                0 if item.active else 1,
                0 if item.featured else 1,
                -(item.viewer_count or 0),
                item.scheduled_for or item.last_activity_at or item.created_at,
            )
        )
        return [self._serialize_room(room) for room in rooms]

    def get_room(self, room_id: str | int) -> LiveRoom | None:
        return self.rooms.get(str(room_id))

    def serialize_room(self, room: LiveRoom) -> dict:
        return self._serialize_room(room)

    def activate_presence(self, room_id: str, sid: str, username: str, is_host: bool, platform: str, device_type: str) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        if username in room.kicked_users:
            raise PermissionError('User kicked from room')
        room.viewers[sid] = {
            'username': username,
            'is_host': is_host,
            'platform': platform,
            'device_type': device_type,
            'joined_at': _utcnow(),
        }
        room.viewer_count = sum(1 for viewer in room.viewers.values() if not viewer.get('is_host'))
        room.peak_viewer_count = max(int(room.peak_viewer_count or 0), int(room.viewer_count or 0))
        room.analytics['join_events'] = int(room.analytics.get('join_events', 0)) + 1
        self._touch_room(room)
        return self._serialize_room(room)

    def deactivate_presence(self, room_id: str, sid: str | None = None) -> dict | None:
        room = self.get_room(room_id)
        if room is None:
            return None
        if sid:
            room.viewers.pop(sid, None)
        room.viewer_count = sum(1 for viewer in room.viewers.values() if not viewer.get('is_host'))
        self._touch_room(room)
        return self._serialize_room(room)

    def add_comment(self, room_id: str, username: str, text: str) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        if username in room.muted_users:
            raise PermissionError('User muted')
        comment = LiveComment(
            id=str(self._next_comment_id),
            room_id=str(room_id),
            user=username,
            text=text,
            created_at=_utcnow(),
        )
        self._next_comment_id += 1
        room.comments.append(comment)
        room.analytics['comment_events'] = int(room.analytics.get('comment_events', 0)) + 1
        self._touch_room(room)
        return self._serialize_comment(room, comment) or {}

    def get_comments(self, room_id: str) -> list[dict]:
        room = self.get_room(room_id)
        if room is None:
            return []
        return [self._serialize_comment(room, comment) for comment in room.comments if comment is not None]

    def add_heart(self, room_id: str) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        room.hearts_count = int(room.hearts_count or 0) + 1
        room.reactions['heart'] = int(room.reactions.get('heart', 0)) + 1
        room.analytics['reaction_events'] = int(room.analytics.get('reaction_events', 0)) + 1
        self._touch_room(room)
        return self._serialize_room(room)

    def add_reaction(self, room_id: str, reaction: str) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        key = (reaction or 'like').strip().lower()[:32] or 'like'
        room.reactions[key] = int(room.reactions.get(key, 0)) + 1
        if key == 'heart':
            room.hearts_count = int(room.hearts_count or 0) + 1
        room.analytics['reaction_events'] = int(room.analytics.get('reaction_events', 0)) + 1
        self._touch_room(room)
        return self._serialize_room(room)

    def pin_comment(self, room_id: str, comment_id: str | None) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        if comment_id is None:
            room.pinned_comment_id = None
            self._touch_room(room)
            return self._serialize_room(room)
        comment = next((item for item in room.comments if item.id == str(comment_id)), None)
        if comment is None:
            raise KeyError('Comment not found')
        room.pinned_comment_id = comment.id
        self._touch_room(room)
        return self._serialize_room(room)

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
        return self._serialize_room(room)

    def add_cohost(self, room_id: str, username: str) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        if username and username not in room.co_hosts and username != room.username:
            room.co_hosts.append(username)
        self._touch_room(room)
        return self._serialize_room(room)

    def start_battle(self, room_id: str, opponent_room_id: str) -> dict:
        room = self.get_room(room_id)
        opponent = self.get_room(opponent_room_id)
        if room is None or opponent is None:
            raise KeyError('Room not found')
        room.battle_room_id = opponent.id
        opponent.battle_room_id = room.id
        self._touch_room(room)
        self._touch_room(opponent)
        return self._serialize_room(room)

    def moderate_user(self, room_id: str, username: str, action: str) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        action_key = (action or '').strip().lower()
        if action_key == 'mute':
            room.muted_users.add(username)
            room.analytics['mute_events'] = int(room.analytics.get('mute_events', 0)) + 1
        elif action_key == 'unmute':
            room.muted_users.discard(username)
        elif action_key == 'kick':
            room.kicked_users.add(username)
            room.analytics['kick_events'] = int(room.analytics.get('kick_events', 0)) + 1
            stale = [sid for sid, viewer in room.viewers.items() if viewer.get('username') == username]
            for sid in stale:
                room.viewers.pop(sid, None)
            room.viewer_count = sum(1 for viewer in room.viewers.values() if not viewer.get('is_host'))
        else:
            raise KeyError('Unsupported moderation action')
        self._touch_room(room)
        return self._serialize_room(room)

    def send_gift(self, room_id: str, username: str, gift_name: str, coins: int) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        gift = LiveGift(
            id=str(self._next_gift_id),
            room_id=str(room_id),
            user=username,
            gift_name=gift_name,
            coins=max(int(coins or 0), 0),
            created_at=_utcnow(),
        )
        self._next_gift_id += 1
        room.gifts.append(gift)
        room.coin_pot = int(room.coin_pot or 0) + gift.coins
        room.analytics['gift_events'] = int(room.analytics.get('gift_events', 0)) + 1
        self._touch_room(room)
        return self._serialize_room(room)

    def create_poll(self, room_id: str, created_by: str, question: str, options: list[str]) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        for poll in room.polls:
            poll.active = False
        poll = LivePoll(
            id=str(self._next_poll_id),
            room_id=str(room_id),
            question=question,
            created_by=created_by,
            created_at=_utcnow(),
            options=[LivePollOption(id=f'{self._next_poll_id}-{index + 1}', text=text) for index, text in enumerate(options[:4])],
        )
        self._next_poll_id += 1
        room.polls.append(poll)
        self._touch_room(room)
        return self._serialize_room(room)

    def vote_poll(self, room_id: str, poll_id: str, username: str, option_id: str) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        poll = next((item for item in room.polls if item.id == str(poll_id)), None)
        if poll is None or not poll.active:
            raise KeyError('Poll not found')
        previous_option_id = poll.votes_by_user.get(username)
        if previous_option_id == option_id:
            return self._serialize_room(room)
        if previous_option_id:
            previous = next((option for option in poll.options if option.id == previous_option_id), None)
            if previous is not None:
                previous.votes = max(int(previous.votes or 0) - 1, 0)
        target = next((option for option in poll.options if option.id == option_id), None)
        if target is None:
            raise KeyError('Option not found')
        target.votes = int(target.votes or 0) + 1
        poll.votes_by_user[username] = option_id
        room.analytics['poll_votes'] = int(room.analytics.get('poll_votes', 0)) + 1
        self._touch_room(room)
        return self._serialize_room(room)

    def share_room(self, room_id: str) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        room.live_share_count = int(room.live_share_count or 0) + 1
        room.analytics['shares'] = int(room.analytics.get('shares', 0)) + 1
        self._touch_room(room)
        return self._serialize_room(room)

    def update_health(self, room_id: str, *, bitrate_kbps: int | None = None, packet_loss: float | None = None, rtt_ms: int | None = None, reconnecting: bool | None = None) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        bitrate_value = max(int(bitrate_kbps or room.last_health.get('bitrate_kbps') or 0), 0)
        packet_loss_value = max(float(packet_loss if packet_loss is not None else room.last_health.get('packet_loss') or 0), 0.0)
        rtt_value = max(int(rtt_ms if rtt_ms is not None else room.last_health.get('rtt_ms') or 0), 0)
        reconnecting_value = bool(reconnecting if reconnecting is not None else room.last_health.get('reconnecting'))
        status = 'healthy'
        if reconnecting_value or packet_loss_value >= 5 or rtt_value >= 180:
            status = 'warning'
        if reconnecting_value and packet_loss_value >= 8:
            status = 'critical'
        room.last_health = {
            'status': status,
            'bitrate_kbps': bitrate_value,
            'packet_loss': packet_loss_value,
            'rtt_ms': rtt_value,
            'reconnecting': reconnecting_value,
            'updated_at': _utcnow(),
        }
        self._touch_room(room)
        return self._serialize_room(room)

    def toggle_recording(self, room_id: str, enabled: bool, recording_url: str | None = None) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        room.recording_enabled = bool(enabled)
        room.recording_started_at = _utcnow() if room.recording_enabled else room.recording_started_at
        if recording_url is not None:
            room.recording_url = recording_url
        self._touch_room(room)
        return self._serialize_room(room)

    def end_room(self, room_id: str) -> dict | None:
        room = self.get_room(room_id)
        if room is None:
            return None
        room.active = False
        room.viewer_count = 0
        room.viewers.clear()
        if room.recording_enabled and room.recording_started_at:
            room.replay_clips.append(
                LiveReplayClip(
                    id=str(self._next_replay_id),
                    label=f'Replay • {room.title}',
                    started_at=room.recording_started_at,
                    ended_at=_utcnow(),
                )
            )
            self._next_replay_id += 1
        room.recording_enabled = False
        self._touch_room(room)
        return self._serialize_room(room)

    def dashboard(self, room_id: str) -> dict:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError('Room not found')
        serialized = self._serialize_room(room)
        serialized['creator_dashboard'] = {
            'retention_hint': 'Strong' if serialized['peak_viewer_count'] >= 10 else 'Growing',
            'engagement_score': int(serialized['comments_count']) + int(serialized['gifts_summary']['count']) * 5 + int(serialized['live_share_count']) * 2,
            'recommended_action': 'ابدأ استطلاعاً جديداً' if not serialized['active_poll'] else 'استمر في التفاعل مع التعليقات',
        }
        return serialized

    def admin_overview(self) -> dict:
        rooms = [self._serialize_room(room) for room in self.rooms.values()]
        active_rooms = [room for room in rooms if room.get('active')]
        peak_room = max(active_rooms, key=lambda item: item.get('peak_viewer_count') or 0, default=None)
        return {
            'stats': {
                'active_rooms': len(active_rooms),
                'featured_rooms': sum(1 for room in active_rooms if room.get('featured')),
                'current_viewers': sum(int(room.get('viewer_count') or 0) for room in active_rooms),
                'comments_count': sum(int(room.get('comments_count') or 0) for room in active_rooms),
                'hearts_count': sum(int(room.get('hearts_count') or 0) for room in active_rooms),
                'top_peak_viewers': int((peak_room or {}).get('peak_viewer_count') or 0),
                'gift_events': sum(int((room.get('gifts_summary') or {}).get('count') or 0) for room in active_rooms),
                'share_events': sum(int(room.get('live_share_count') or 0) for room in active_rooms),
            },
            'rooms': sorted(rooms, key=lambda item: (0 if item.get('active') else 1, -(item.get('viewer_count') or 0))),
        }


live_store = LiveStore()
