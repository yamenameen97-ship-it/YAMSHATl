from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
import json

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
    
    # Advanced Features
    recording_status: str = "idle"  # idle, recording, processing, completed, failed
    recording_url: str | None = None
    stream_analytics: dict = field(default_factory=lambda: {
        "total_watch_time": 0,
        "avg_bitrate": 0,
        "packet_loss_events": 0,
        "gift_revenue": 0,
        "unique_viewers": set()
    })
    economy: dict = field(default_factory=lambda: {
        "top_gifters": {},
        "current_pot": 0
    })
    recovery_data: dict = field(default_factory=lambda: {
        "last_stable_timestamp": None,
        "reconnect_attempts": 0,
        "failover_ready": True
    })
    multi_host_config: dict = field(default_factory=lambda: {
        "max_hosts": 4,
        "current_hosts": [],
        "layout": "grid"
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
            last_activity_at=now
        )
        # Initialize multi-host with the main host
        room.multi_host_config["current_hosts"].append(username)
        self.rooms[room_id] = room
        return room

    def get_room(self, room_id: str) -> LiveRoom | None:
        return self.rooms.get(str(room_id))

    def list_rooms(self) -> list[dict]:
        return [self.serialize_room(r) for r in self.rooms.values() if r.active]

    def add_comment(self, room_id: str, username: str, text: str) -> LiveComment | None:
        room = self.get_room(room_id)
        if not room: return None
        
        # Simple AI Moderation Mockup
        is_toxic = any(word in text.lower() for word in ["bad", "hate", "toxic"])
        
        comment = LiveComment(
            id=str(self._next_comment_id),
            room_id=room_id,
            user=username,
            text=text,
            created_at=_utcnow(),
            ai_moderated=True,
            moderation_score=0.9 if is_toxic else 0.1
        )
        self._next_comment_id += 1
        
        if not is_toxic:
            room.comments.append(comment)
        return comment

    def send_gift(self, room_id: str, username: str, gift_name: str, coins: int) -> dict | None:
        room = self.get_room(room_id)
        if not room: return None
        
        gift = LiveGift(
            id=str(self._next_gift_id),
            room_id=room_id,
            user=username,
            gift_name=gift_name,
            coins=coins,
            created_at=_utcnow()
        )
        self._next_gift_id += 1
        room.gifts.append(gift)
        
        # Update economy
        room.economy["current_pot"] += coins
        room.economy["top_gifters"][username] = room.economy["top_gifters"].get(username, 0) + coins
        room.stream_analytics["gift_revenue"] += coins
        
        return {"gift": gift, "economy": room.economy}

    def update_analytics(self, room_id: str, metrics: dict):
        room = self.get_room(room_id)
        if not room: return
        
        room.stream_analytics["avg_bitrate"] = metrics.get("bitrate", room.stream_analytics["avg_bitrate"])
        if metrics.get("packet_loss", 0) > 5:
            room.stream_analytics["packet_loss_events"] += 1
            # Trigger Recovery logic if too many events
            if room.stream_analytics["packet_loss_events"] > 3:
                room.recovery_data["failover_ready"] = True

    def orchestrate_recording(self, room_id: str, action: str):
        room = self.get_room(room_id)
        if not room: return
        
        if action == "start":
            room.recording_status = "recording"
        elif action == "stop":
            room.recording_status = "processing"
            # Mocking async processing
            room.recording_url = f"https://cdn.yamshat.com/recordings/{room_id}.mp4"
            room.recording_status = "completed"

    def manage_multi_host(self, room_id: str, action: str, target_username: str) -> bool:
        room = self.get_room(room_id)
        if not room: return False
        
        if action == "add":
            if len(room.multi_host_config["current_hosts"]) < room.multi_host_config["max_hosts"]:
                if target_username not in room.multi_host_config["current_hosts"]:
                    room.multi_host_config["current_hosts"].append(target_username)
                    return True
        elif action == "remove":
            if target_username in room.multi_host_config["current_hosts"] and target_username != room.username:
                room.multi_host_config["current_hosts"].remove(target_username)
                return True
        return False

    def serialize_room(self, room: LiveRoom) -> dict:
        return {
            'id': room.id,
            'host': room.username,
            'title': room.title,
            'viewer_count': room.viewer_count,
            'active': room.active,
            'recording': {
                'status': room.recording_status,
                'url': room.recording_url
            },
            'analytics': {
                'gift_revenue': room.stream_analytics["gift_revenue"],
                'avg_bitrate': room.stream_analytics["avg_bitrate"],
                'health_score': max(0, 100 - (room.stream_analytics["packet_loss_events"] * 10))
            },
            'economy': {
                'pot': room.economy["current_pot"],
                'top_gifters': sorted(room.economy["top_gifters"].items(), key=lambda x: x[1], reverse=True)[:5]
            },
            'multi_host': room.multi_host_config,
            'recovery': room.recovery_data
        }

live_store = LiveStore()
