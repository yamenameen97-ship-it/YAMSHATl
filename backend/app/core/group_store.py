from __future__ import annotations

import json
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path

GROUP_STORE_PATH = Path(__file__).resolve().parents[2] / 'uploads' / 'group_store.json'


class GroupRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MODERATOR = "moderator"
    MEMBER = "member"


@dataclass
class GroupMember:
    username: str
    role: GroupRole
    joined_at: str
    is_muted: bool = False
    muted_until: str | None = None


@dataclass
class GroupInvite:
    id: str
    group_id: str
    inviter: str
    invitee: str
    status: str
    created_at: str


@dataclass
class GroupItem:
    id: str
    name: str
    description: str
    owner_username: str
    created_at: str
    members: dict[str, GroupMember] = field(default_factory=dict)
    invites: list[GroupInvite] = field(default_factory=list)
    audit_logs: list[dict] = field(default_factory=list)
    settings: dict = field(default_factory=lambda: {
        "is_private": False,
        "allow_member_invites": True,
        "slow_mode": 0,
    })


class GroupStore:
    def __init__(self) -> None:
        self._groups: dict[str, GroupItem] = {}
        self._next_id = 1
        self._load()

    def create_group(self, owner_username: str, name: str, description: str = '', members: list[str] | None = None) -> dict:
        group_id = str(self._next_id)
        self._next_id += 1
        now = datetime.utcnow().isoformat()
        group_members = {
            owner_username: GroupMember(
                username=owner_username,
                role=GroupRole.OWNER,
                joined_at=now,
            )
        }
        if members:
            for username in members:
                normalized = str(username or '').strip()
                if normalized and normalized != owner_username:
                    group_members[normalized] = GroupMember(
                        username=normalized,
                        role=GroupRole.MEMBER,
                        joined_at=now,
                    )
        group = GroupItem(
            id=group_id,
            name=str(name or '').strip(),
            description=str(description or '').strip(),
            owner_username=owner_username,
            created_at=now,
            members=group_members,
        )
        self._groups[group_id] = group
        self._add_audit_log(group_id, owner_username, "create_group", f"Group '{group.name}' created")
        self._save()
        return self.serialize_group(group)

    def _add_audit_log(self, group_id: str, actor: str, action: str, description: str):
        group = self._groups.get(str(group_id))
        if group is None:
            return
        group.audit_logs.append({
            "actor": actor,
            "action": action,
            "description": description,
            "timestamp": datetime.utcnow().isoformat(),
        })
        if len(group.audit_logs) > 100:
            group.audit_logs = group.audit_logs[-100:]

    def list_groups(self) -> list[dict]:
        groups = sorted(self._groups.values(), key=lambda item: item.created_at, reverse=True)
        return [self.serialize_group(item) for item in groups]

    def get_group(self, group_id: str) -> GroupItem | None:
        return self._groups.get(str(group_id))

    def join_group(self, group_id: str, username: str) -> dict | None:
        group = self._groups.get(str(group_id))
        if group is None:
            return None
        joined = False
        if username not in group.members:
            group.members[username] = GroupMember(
                username=username,
                role=GroupRole.MEMBER,
                joined_at=datetime.utcnow().isoformat(),
            )
            joined = True
            self._add_audit_log(group_id, username, "join", f"{username} joined the group")
            self._save()
        payload = self.serialize_group(group)
        payload['joined'] = joined
        payload['already_joined'] = not joined
        return payload

    def update_member_role(self, group_id: str, actor: str, target_username: str, new_role: GroupRole) -> bool:
        group = self._groups.get(str(group_id))
        if not group:
            return False
        actor_member = group.members.get(actor)
        if not actor_member or actor_member.role not in [GroupRole.OWNER, GroupRole.ADMIN]:
            return False
        target_member = group.members.get(target_username)
        if not target_member:
            return False
        if new_role == GroupRole.ADMIN and actor_member.role != GroupRole.OWNER:
            return False
        target_member.role = new_role
        self._add_audit_log(group_id, actor, "update_role", f"Updated {target_username} role to {new_role.value}")
        self._save()
        return True

    def invite_user(self, group_id: str, inviter: str, invitee: str) -> dict | None:
        group = self._groups.get(str(group_id))
        if not group:
            return None
        inviter_member = group.members.get(inviter)
        if not inviter_member:
            return None
        if not group.settings.get("allow_member_invites", True) and inviter_member.role == GroupRole.MEMBER:
            return None
        invite = GroupInvite(
            id=str(uuid.uuid4()),
            group_id=str(group_id),
            inviter=inviter,
            invitee=invitee,
            status="pending",
            created_at=datetime.utcnow().isoformat(),
        )
        group.invites.append(invite)
        self._add_audit_log(group_id, inviter, "invite", f"Invited {invitee} to group")
        self._save()
        return {
            "invite_id": invite.id,
            "group_name": group.name,
            "inviter": inviter,
            "status": invite.status,
        }

    def moderate_user(self, group_id: str, actor: str, target_username: str, action: str, duration_mins: int | None = None) -> bool:
        group = self._groups.get(str(group_id))
        if not group:
            return False
        actor_member = group.members.get(actor)
        if not actor_member or actor_member.role not in [GroupRole.OWNER, GroupRole.ADMIN, GroupRole.MODERATOR]:
            return False
        target_member = group.members.get(target_username)
        if not target_member:
            return False
        if actor_member.role == GroupRole.MODERATOR and target_member.role in [GroupRole.OWNER, GroupRole.ADMIN]:
            return False
        if action == "mute":
            target_member.is_muted = True
            target_member.muted_until = "temporary" if duration_mins else None
            self._add_audit_log(group_id, actor, "mute", f"Muted {target_username}")
        elif action == "unmute":
            target_member.is_muted = False
            target_member.muted_until = None
            self._add_audit_log(group_id, actor, "unmute", f"Unmuted {target_username}")
        elif action == "kick":
            if target_member.role == GroupRole.OWNER:
                return False
            del group.members[target_username]
            self._add_audit_log(group_id, actor, "kick", f"Kicked {target_username}")
        else:
            return False
        self._save()
        return True

    def serialize_group(self, item: GroupItem) -> dict:
        return {
            'id': item.id,
            'name': item.name,
            'description': item.description,
            'owner_username': item.owner_username,
            'created_at': item.created_at,
            'members': [
                {
                    'username': member.username,
                    'role': member.role.value if isinstance(member.role, GroupRole) else str(member.role),
                    'joined_at': member.joined_at,
                    'is_muted': bool(member.is_muted),
                    'muted_until': member.muted_until,
                }
                for member in item.members.values()
            ],
            'members_count': len(item.members),
            'settings': item.settings,
            'audit_logs_preview': item.audit_logs[-10:],
        }

    def _serialize_store(self) -> dict:
        return {
            'next_id': self._next_id,
            'groups': [
                {
                    **asdict(group),
                    'members': {
                        username: {
                            **asdict(member),
                            'role': member.role.value if isinstance(member.role, GroupRole) else str(member.role),
                        }
                        for username, member in group.members.items()
                    },
                    'invites': [asdict(invite) for invite in group.invites],
                }
                for group in self._groups.values()
            ],
        }

    def _load(self) -> None:
        try:
            GROUP_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
            if not GROUP_STORE_PATH.exists():
                return
            payload = json.loads(GROUP_STORE_PATH.read_text(encoding='utf-8') or '{}')
            self._next_id = max(int(payload.get('next_id') or 1), 1)
            restored: dict[str, GroupItem] = {}
            for raw in payload.get('groups', []):
                if not isinstance(raw, dict):
                    continue
                members: dict[str, GroupMember] = {}
                for username, member in (raw.get('members') or {}).items():
                    if not isinstance(member, dict):
                        continue
                    role_value = str(member.get('role') or GroupRole.MEMBER.value)
                    try:
                        role = GroupRole(role_value)
                    except Exception:
                        role = GroupRole.MEMBER
                    members[str(username)] = GroupMember(
                        username=str(member.get('username') or username),
                        role=role,
                        joined_at=str(member.get('joined_at') or datetime.utcnow().isoformat()),
                        is_muted=bool(member.get('is_muted')),
                        muted_until=str(member.get('muted_until') or '') or None,
                    )
                invites = [
                    GroupInvite(
                        id=str(invite.get('id') or uuid.uuid4()),
                        group_id=str(invite.get('group_id') or raw.get('id') or ''),
                        inviter=str(invite.get('inviter') or ''),
                        invitee=str(invite.get('invitee') or ''),
                        status=str(invite.get('status') or 'pending'),
                        created_at=str(invite.get('created_at') or datetime.utcnow().isoformat()),
                    )
                    for invite in (raw.get('invites') or [])
                    if isinstance(invite, dict)
                ]
                item = GroupItem(
                    id=str(raw.get('id') or ''),
                    name=str(raw.get('name') or ''),
                    description=str(raw.get('description') or ''),
                    owner_username=str(raw.get('owner_username') or ''),
                    created_at=str(raw.get('created_at') or datetime.utcnow().isoformat()),
                    members=members,
                    invites=invites,
                    audit_logs=[log for log in (raw.get('audit_logs') or []) if isinstance(log, dict)],
                    settings=raw.get('settings') or {
                        'is_private': False,
                        'allow_member_invites': True,
                        'slow_mode': 0,
                    },
                )
                if item.id:
                    restored[item.id] = item
            self._groups = restored
            if self._groups:
                self._next_id = max(self._next_id, max(int(group_id) for group_id in self._groups.keys()) + 1)
        except Exception:
            self._groups = {}
            self._next_id = 1

    def _save(self) -> None:
        GROUP_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
        GROUP_STORE_PATH.write_text(json.dumps(self._serialize_store(), ensure_ascii=False, indent=2), encoding='utf-8')


group_store = GroupStore()
