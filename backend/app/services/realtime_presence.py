"""Realtime presence and typing state helpers.

Non-breaking lightweight service layer that can be connected
into Socket.IO or WebSocket events without changing the
existing database schema.
"""

from datetime import datetime, timezone
from collections import defaultdict


class PresenceManager:
    def __init__(self):
        self.online_users = set()
        self.last_seen = {}
        self.typing_users = defaultdict(set)

    def set_online(self, user_id: int):
        self.online_users.add(user_id)
        self.last_seen[user_id] = datetime.now(timezone.utc)

    def set_offline(self, user_id: int):
        self.online_users.discard(user_id)
        self.last_seen[user_id] = datetime.now(timezone.utc)

    def is_online(self, user_id: int) -> bool:
        return user_id in self.online_users

    def get_last_seen(self, user_id: int):
        return self.last_seen.get(user_id)

    def start_typing(self, chat_id: int, user_id: int):
        self.typing_users[chat_id].add(user_id)

    def stop_typing(self, chat_id: int, user_id: int):
        self.typing_users[chat_id].discard(user_id)

    def get_typing_users(self, chat_id: int):
        return list(self.typing_users[chat_id])


presence_manager = PresenceManager()
