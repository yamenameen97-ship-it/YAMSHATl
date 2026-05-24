from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid

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
    status: str  # pending, accepted, declined
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
        "slow_mode": 0,  # seconds
    })

class GroupStore:
    def __init__(self) -> None:
        self._groups: dict[str, GroupItem] = {}
        self._next_id = 1

    def create_group(self, owner_username: str, name: str, description: str = '', members: list[str] | None = None) -> dict:
        group_id = str(self._next_id)
        self._next_id += 1
        
        now = datetime.utcnow().isoformat()
        
        # Create initial members list with roles
        group_members = {
            owner_username: GroupMember(
                username=owner_username,
                role=GroupRole.OWNER,
                joined_at=now
            )
        }
        
        if members:
            for m in members:
                if m and m != owner_username:
                    group_members[m] = GroupMember(
                        username=m,
                        role=GroupRole.MEMBER,
                        joined_at=now
                    )

        group = GroupItem(
            id=group_id,
            name=name,
            description=description,
            owner_username=owner_username,
            created_at=now,
            members=group_members,
        )
        
        self._groups[group_id] = group
        self._add_audit_log(group_id, owner_username, "create_group", f"Group '{name}' created")
        
        return self.serialize_group(group)

    def _add_audit_log(self, group_id: str, actor: str, action: str, description: str):
        group = self._groups.get(group_id)
        if group:
            log = {
                "actor": actor,
                "action": action,
                "description": description,
                "timestamp": datetime.utcnow().isoformat()
            }
            group.audit_logs.append(log)
            # Keep only last 100 logs
            if len(group.audit_logs) > 100:
                group.audit_logs.pop(0)

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
                joined_at=datetime.utcnow().isoformat()
            )
            joined = True
            self._add_audit_log(group_id, username, "join", f"{username} joined the group")
            
        payload = self.serialize_group(group)
        payload['joined'] = joined
        payload['already_joined'] = not joined
        return payload

    def update_member_role(self, group_id: str, actor: str, target_username: str, new_role: GroupRole) -> bool:
        group = self._groups.get(group_id)
        if not group: return False
        
        actor_member = group.members.get(actor)
        if not actor_member or actor_member.role not in [GroupRole.OWNER, GroupRole.ADMIN]:
            return False
            
        target_member = group.members.get(target_username)
        if not target_member: return False
        
        # Only owner can promote to admin or change other admins
        if new_role == GroupRole.ADMIN and actor_member.role != GroupRole.OWNER:
            return False
            
        target_member.role = new_role
        self._add_audit_log(group_id, actor, "update_role", f"Updated {target_username} role to {new_role}")
        return True

    def invite_user(self, group_id: str, inviter: str, invitee: str) -> dict | None:
        group = self._groups.get(group_id)
        if not group: return None
        
        # Check if inviter has permission
        inviter_member = group.members.get(inviter)
        if not inviter_member: return None
        if not group.settings["allow_member_invites"] and inviter_member.role == GroupRole.MEMBER:
            return None
            
        invite = GroupInvite(
            id=str(uuid.uuid4()),
            group_id=group_id,
            inviter=inviter,
            invitee=invitee,
            status="pending",
            created_at=datetime.utcnow().isoformat()
        )
        group.invites.append(invite)
        self._add_audit_log(group_id, inviter, "invite", f"Invited {invitee} to group")
        return {
            "invite_id": invite.id,
            "group_name": group.name,
            "inviter": inviter,
            "status": invite.status
        }

    def moderate_user(self, group_id: str, actor: str, target_username: str, action: str, duration_mins: int | None = None) -> bool:
        group = self._groups.get(group_id)
        if not group: return False
        
        actor_member = group.members.get(actor)
        if not actor_member or actor_member.role not in [GroupRole.OWNER, GroupRole.ADMIN, GroupRole.MODERATOR]:
            return False
            
        target_member = group.members.get(target_username)
        if not target_member: return False
        
        # Moderators cannot moderate admins/owners
        if actor_member.role == GroupRole.MODERATOR and target_member.role in [GroupRole.OWNER, GroupRole.ADMIN]:
            return False

        if action == "mute":
            target_member.is_muted = True
            if duration_mins:
                # Simple logic for mute duration
                target_member.muted_until = "temporary" 
            self._add_audit_log(group_id, actor, "mute", f"Muted {target_username}")
        elif action == "unmute":
            target_member.is_muted = False
            target_member.muted_until = None
            self._add_audit_log(group_id, actor, "unmute", f"Unmuted {target_username}")
        elif action == "kick":
            if target_member.role == GroupRole.OWNER: return False
            del group.members[target_username]
            self._add_audit_log(group_id, actor, "kick", f"Kicked {target_username}")
            
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
                    "username": m.username,
                    "role": m.role,
                    "joined_at": m.joined_at,
                    "is_muted": m.is_muted
                } for m in item.members.values()
            ],
            'members_count': len(item.members),
            'settings': item.settings,
            'audit_logs_preview': item.audit_logs[-10:]
        }

group_store = GroupStore()
