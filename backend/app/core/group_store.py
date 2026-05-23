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


ROLE_PERMISSIONS: dict[GroupRole, list[str]] = {
    GroupRole.OWNER: [
        "group.manage",
        "members.manage",
        "roles.manage",
        "permissions.manage",
        "moderation.manage",
        "invites.manage",
        "join_requests.review",
        "messages.pin",
        "messages.send",
    ],
    GroupRole.ADMIN: [
        "members.manage",
        "roles.manage",
        "permissions.manage",
        "moderation.manage",
        "invites.manage",
        "join_requests.review",
        "messages.pin",
        "messages.send",
    ],
    GroupRole.MODERATOR: [
        "moderation.manage",
        "messages.pin",
        "messages.send",
    ],
    GroupRole.MEMBER: [
        "messages.send",
    ],
}


def default_permissions(role: GroupRole) -> list[str]:
    return list(ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS[GroupRole.MEMBER]))


@dataclass
class GroupMember:
    username: str
    role: GroupRole
    joined_at: str
    permissions: list[str] = field(default_factory=list)
    is_muted: bool = False
    muted_until: str | None = None
    is_banned: bool = False


@dataclass
class GroupInvite:
    id: str
    group_id: str
    inviter: str
    invitee: str
    status: str  # pending, accepted, declined
    created_at: str
    invite_link: str


@dataclass
class GroupJoinRequest:
    id: str
    group_id: str
    username: str
    note: str
    status: str  # pending, approved, rejected
    created_at: str
    reviewed_at: str | None = None
    reviewed_by: str | None = None


@dataclass
class GroupPinnedMessage:
    id: str
    author: str
    text: str
    created_at: str
    pinned_at: str


@dataclass
class GroupItem:
    id: str
    name: str
    description: str
    owner_username: str
    created_at: str
    members: dict[str, GroupMember] = field(default_factory=dict)
    invites: list[GroupInvite] = field(default_factory=list)
    join_requests: list[GroupJoinRequest] = field(default_factory=list)
    pinned_messages: list[GroupPinnedMessage] = field(default_factory=list)
    audit_logs: list[dict] = field(default_factory=list)
    settings: dict = field(default_factory=lambda: {
        "is_private": False,
        "allow_member_invites": True,
        "slow_mode": 0,
        "requires_join_approval": False,
    })


class GroupStore:
    def __init__(self) -> None:
        self._groups: dict[str, GroupItem] = {}
        self._next_id = 1

    def create_group(
        self,
        owner_username: str,
        name: str,
        description: str = '',
        members: list[str] | None = None,
        *,
        is_private: bool = False,
        allow_member_invites: bool = True,
        requires_join_approval: bool | None = None,
    ) -> dict:
        group_id = str(self._next_id)
        self._next_id += 1
        now = datetime.utcnow().isoformat()

        owner = GroupMember(
            username=owner_username,
            role=GroupRole.OWNER,
            joined_at=now,
            permissions=default_permissions(GroupRole.OWNER),
        )
        group_members = {owner_username: owner}

        if members:
            for member_username in members:
                normalized = str(member_username or '').strip()
                if normalized and normalized != owner_username:
                    group_members[normalized] = GroupMember(
                        username=normalized,
                        role=GroupRole.MEMBER,
                        joined_at=now,
                        permissions=default_permissions(GroupRole.MEMBER),
                    )

        group = GroupItem(
            id=group_id,
            name=name,
            description=description,
            owner_username=owner_username,
            created_at=now,
            members=group_members,
            settings={
                "is_private": bool(is_private),
                "allow_member_invites": bool(allow_member_invites),
                "slow_mode": 0,
                "requires_join_approval": bool(is_private if requires_join_approval is None else requires_join_approval),
            },
        )

        self._groups[group_id] = group
        self._add_audit_log(group_id, owner_username, "create_group", f"Group '{name}' created")
        return self.serialize_group(group)

    def _add_audit_log(self, group_id: str, actor: str, action: str, description: str):
        group = self._groups.get(group_id)
        if not group:
            return
        group.audit_logs.append({
            "actor": actor,
            "action": action,
            "description": description,
            "timestamp": datetime.utcnow().isoformat(),
        })
        if len(group.audit_logs) > 100:
            group.audit_logs.pop(0)

    def list_groups(self) -> list[dict]:
        groups = sorted(self._groups.values(), key=lambda item: item.created_at, reverse=True)
        return [self.serialize_group(item) for item in groups]

    def get_group(self, group_id: str) -> GroupItem | None:
        return self._groups.get(str(group_id))

    def _can_manage_group(self, group: GroupItem, username: str, permission: str | None = None) -> bool:
        member = group.members.get(username)
        if not member or member.is_banned:
            return False
        if member.role == GroupRole.OWNER:
            return True
        if permission:
            return permission in member.permissions
        return member.role in {GroupRole.ADMIN, GroupRole.MODERATOR}

    def join_group(self, group_id: str, username: str) -> dict | None:
        group = self._groups.get(str(group_id))
        if group is None:
            return None

        existing_member = group.members.get(username)
        if existing_member and not existing_member.is_banned:
            payload = self.serialize_group(group)
            payload['joined'] = False
            payload['already_joined'] = True
            return payload

        if group.settings.get('is_private') or group.settings.get('requires_join_approval'):
            existing_request = next((item for item in group.join_requests if item.username == username and item.status == 'pending'), None)
            payload = self.serialize_group(group)
            payload['joined'] = False
            payload['already_joined'] = False
            payload['join_request_required'] = True
            if existing_request:
                payload['request_id'] = existing_request.id
                return payload
            request = GroupJoinRequest(
                id=str(uuid.uuid4()),
                group_id=group_id,
                username=username,
                note='',
                status='pending',
                created_at=datetime.utcnow().isoformat(),
            )
            group.join_requests.append(request)
            self._add_audit_log(group_id, username, 'join_request_created', f'{username} requested to join the group')
            payload['request_id'] = request.id
            return payload

        member = GroupMember(
            username=username,
            role=GroupRole.MEMBER,
            joined_at=datetime.utcnow().isoformat(),
            permissions=default_permissions(GroupRole.MEMBER),
        )
        group.members[username] = member
        self._add_audit_log(group_id, username, 'join', f'{username} joined the group')
        payload = self.serialize_group(group)
        payload['joined'] = True
        payload['already_joined'] = False
        return payload

    def request_join(self, group_id: str, username: str, note: str = '') -> dict | None:
        group = self._groups.get(str(group_id))
        if group is None:
            return None
        if username in group.members:
            return {'status': 'already_member', 'username': username}
        existing = next((item for item in group.join_requests if item.username == username and item.status == 'pending'), None)
        if existing:
            return self.serialize_join_request(existing)
        request = GroupJoinRequest(
            id=str(uuid.uuid4()),
            group_id=group_id,
            username=username,
            note=str(note or '').strip()[:240],
            status='pending',
            created_at=datetime.utcnow().isoformat(),
        )
        group.join_requests.append(request)
        self._add_audit_log(group_id, username, 'join_request_created', f'{username} requested to join the group')
        return self.serialize_join_request(request)

    def review_join_request(self, group_id: str, actor: str, request_id: str, approve: bool) -> dict | None:
        group = self._groups.get(str(group_id))
        if not group or not self._can_manage_group(group, actor, 'join_requests.review'):
            return None
        join_request = next((item for item in group.join_requests if item.id == request_id), None)
        if not join_request or join_request.status != 'pending':
            return None
        join_request.status = 'approved' if approve else 'rejected'
        join_request.reviewed_at = datetime.utcnow().isoformat()
        join_request.reviewed_by = actor
        if approve and join_request.username not in group.members:
            group.members[join_request.username] = GroupMember(
                username=join_request.username,
                role=GroupRole.MEMBER,
                joined_at=datetime.utcnow().isoformat(),
                permissions=default_permissions(GroupRole.MEMBER),
            )
        self._add_audit_log(
            group_id,
            actor,
            'join_request_reviewed',
            f"{actor} {'approved' if approve else 'rejected'} {join_request.username} join request",
        )
        return self.serialize_join_request(join_request)

    def update_member_role(self, group_id: str, actor: str, target_username: str, new_role: GroupRole) -> bool:
        group = self._groups.get(group_id)
        if not group:
            return False
        actor_member = group.members.get(actor)
        target_member = group.members.get(target_username)
        if not actor_member or not target_member:
            return False
        if actor_member.role not in {GroupRole.OWNER, GroupRole.ADMIN}:
            return False
        if target_member.role == GroupRole.OWNER and actor_member.role != GroupRole.OWNER:
            return False
        if new_role == GroupRole.ADMIN and actor_member.role != GroupRole.OWNER:
            return False
        target_member.role = new_role
        target_member.permissions = default_permissions(new_role)
        self._add_audit_log(group_id, actor, 'update_role', f'Updated {target_username} role to {new_role.value}')
        return True

    def update_member_permissions(self, group_id: str, actor: str, target_username: str, permissions: list[str]) -> bool:
        group = self._groups.get(group_id)
        if not group:
            return False
        actor_member = group.members.get(actor)
        target_member = group.members.get(target_username)
        if not actor_member or not target_member:
            return False
        if actor_member.role not in {GroupRole.OWNER, GroupRole.ADMIN}:
            return False
        if target_member.role == GroupRole.OWNER and actor_member.role != GroupRole.OWNER:
            return False
        sanitized = sorted({str(item or '').strip()[:60] for item in permissions if str(item or '').strip()})
        target_member.permissions = sanitized or default_permissions(target_member.role)
        self._add_audit_log(group_id, actor, 'update_permissions', f'Updated permissions for {target_username}')
        return True

    def invite_user(self, group_id: str, inviter: str, invitee: str) -> dict | None:
        group = self._groups.get(group_id)
        if not group:
            return None
        inviter_member = group.members.get(inviter)
        if not inviter_member or inviter_member.is_banned:
            return None
        if not group.settings.get('allow_member_invites', True) and inviter_member.role == GroupRole.MEMBER:
            return None
        existing = next((item for item in group.invites if item.invitee == invitee and item.status == 'pending'), None)
        if existing:
            return self.serialize_invite(existing)
        invite = GroupInvite(
            id=str(uuid.uuid4()),
            group_id=group_id,
            inviter=inviter,
            invitee=invitee,
            status='pending',
            created_at=datetime.utcnow().isoformat(),
            invite_link=f'https://yamshat.com/groups/{group_id}?invite={uuid.uuid4().hex[:10]}',
        )
        group.invites.append(invite)
        self._add_audit_log(group_id, inviter, 'invite', f'Invited {invitee} to group')
        return self.serialize_invite(invite)

    def moderate_user(self, group_id: str, actor: str, target_username: str, action: str, duration_mins: int | None = None) -> bool:
        group = self._groups.get(group_id)
        if not group:
            return False
        actor_member = group.members.get(actor)
        target_member = group.members.get(target_username)
        if not actor_member or not target_member:
            return False
        if actor_member.role not in {GroupRole.OWNER, GroupRole.ADMIN, GroupRole.MODERATOR}:
            return False
        if target_member.role == GroupRole.OWNER:
            return False
        if actor_member.role == GroupRole.MODERATOR and target_member.role in {GroupRole.ADMIN, GroupRole.OWNER}:
            return False

        if action == 'mute':
            target_member.is_muted = True
            if duration_mins:
                target_member.muted_until = f'{duration_mins} minutes'
            self._add_audit_log(group_id, actor, 'mute', f'Muted {target_username}')
            return True
        if action == 'unmute':
            target_member.is_muted = False
            target_member.muted_until = None
            self._add_audit_log(group_id, actor, 'unmute', f'Unmuted {target_username}')
            return True
        if action == 'kick':
            del group.members[target_username]
            self._add_audit_log(group_id, actor, 'kick', f'Kicked {target_username}')
            return True
        if action == 'ban':
            target_member.is_banned = True
            self._add_audit_log(group_id, actor, 'ban', f'Banned {target_username}')
            return True
        return False

    def pin_message(self, group_id: str, actor: str, text: str) -> dict | None:
        group = self._groups.get(group_id)
        if not group or not self._can_manage_group(group, actor, 'messages.pin'):
            return None
        normalized = str(text or '').strip()
        if not normalized:
            return None
        item = GroupPinnedMessage(
            id=str(uuid.uuid4()),
            author=actor,
            text=normalized[:500],
            created_at=datetime.utcnow().isoformat(),
            pinned_at=datetime.utcnow().isoformat(),
        )
        group.pinned_messages.insert(0, item)
        group.pinned_messages = group.pinned_messages[:20]
        self._add_audit_log(group_id, actor, 'pin_message', 'Pinned a message in the group')
        return self.serialize_pinned_message(item)

    def list_join_requests(self, group_id: str) -> list[dict] | None:
        group = self._groups.get(group_id)
        if not group:
            return None
        return [self.serialize_join_request(item) for item in group.join_requests]

    def list_pinned_messages(self, group_id: str) -> list[dict] | None:
        group = self._groups.get(group_id)
        if not group:
            return None
        return [self.serialize_pinned_message(item) for item in group.pinned_messages]

    def list_invites(self, group_id: str) -> list[dict] | None:
        group = self._groups.get(group_id)
        if not group:
            return None
        return [self.serialize_invite(item) for item in group.invites]

    def serialize_invite(self, invite: GroupInvite) -> dict:
        return {
            'id': invite.id,
            'group_id': invite.group_id,
            'inviter': invite.inviter,
            'invitee': invite.invitee,
            'status': invite.status,
            'created_at': invite.created_at,
            'invite_link': invite.invite_link,
        }

    def serialize_join_request(self, request: GroupJoinRequest) -> dict:
        return {
            'id': request.id,
            'group_id': request.group_id,
            'username': request.username,
            'note': request.note,
            'status': request.status,
            'created_at': request.created_at,
            'reviewed_at': request.reviewed_at,
            'reviewed_by': request.reviewed_by,
        }

    def serialize_pinned_message(self, item: GroupPinnedMessage) -> dict:
        return {
            'id': item.id,
            'author': item.author,
            'text': item.text,
            'created_at': item.created_at,
            'pinned_at': item.pinned_at,
        }

    def serialize_group(self, item: GroupItem) -> dict:
        members = sorted(item.members.values(), key=lambda member: (member.role.value, member.username))
        return {
            'id': item.id,
            'name': item.name,
            'description': item.description,
            'owner_username': item.owner_username,
            'created_at': item.created_at,
            'members': [
                {
                    'username': member.username,
                    'role': member.role.value,
                    'permissions': list(member.permissions),
                    'joined_at': member.joined_at,
                    'is_muted': member.is_muted,
                    'muted_until': member.muted_until,
                    'is_banned': member.is_banned,
                }
                for member in members
            ],
            'members_count': len([member for member in item.members.values() if not member.is_banned]),
            'settings': dict(item.settings),
            'join_requests': [self.serialize_join_request(req) for req in item.join_requests],
            'pending_requests_count': len([req for req in item.join_requests if req.status == 'pending']),
            'pinned_messages': [self.serialize_pinned_message(msg) for msg in item.pinned_messages],
            'invites': [self.serialize_invite(invite) for invite in item.invites],
            'audit_logs_preview': item.audit_logs[-10:],
        }


group_store = GroupStore()
