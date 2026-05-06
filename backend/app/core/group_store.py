from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class GroupItem:
    id: str
    name: str
    description: str
    owner_username: str
    created_at: str
    members: list[str] = field(default_factory=list)


class GroupStore:
    def __init__(self) -> None:
        self._groups: dict[str, GroupItem] = {}
        self._next_id = 1

    def create_group(self, owner_username: str, name: str, description: str = '', members: list[str] | None = None) -> dict:
        final_members = [member for member in (members or []) if member]
        if owner_username not in final_members:
            final_members.insert(0, owner_username)
        group = GroupItem(
            id=str(self._next_id),
            name=name,
            description=description,
            owner_username=owner_username,
            created_at=datetime.utcnow().isoformat(),
            members=list(dict.fromkeys(final_members)),
        )
        self._next_id += 1
        self._groups[group.id] = group
        return self.serialize_group(group)

    def list_groups(self) -> list[dict]:
        groups = sorted(self._groups.values(), key=lambda item: item.created_at, reverse=True)
        return [self.serialize_group(item) for item in groups]

    def join_group(self, group_id: str | int, username: str) -> dict | None:
        group = self._groups.get(str(group_id))
        if group is None:
            return None
        if username not in group.members:
            group.members.append(username)
        return self.serialize_group(group)

    def serialize_group(self, item: GroupItem) -> dict:
        return {
            'id': item.id,
            'name': item.name,
            'description': item.description,
            'owner_username': item.owner_username,
            'created_at': item.created_at,
            'members': item.members,
            'members_count': len(item.members),
        }


group_store = GroupStore()
