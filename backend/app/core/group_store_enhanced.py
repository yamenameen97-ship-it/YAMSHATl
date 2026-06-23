"""
Yamshat Group Store (enhanced) — v59.2 GROUPS_OVERHAUL
======================================================
متجر المجموعات الكامل: أعضاء، رسائل، تفاعلات، منشورات،
قواعد، أحداث، استطلاعات، إعلانات، دعوات، طلبات انضمام،
حظر/كتم، إحصائيات، WebSocket واقعي.

البيانات تُحفظ على Persistent Disk + نسخة احتياطية في PostgreSQL.
متوافق رجعيًا مع نسخ JSON القديمة (يقرأ الحقول الناقصة كافتراضيات).
"""
from __future__ import annotations

import json
import os as _os
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Optional, Dict, List, Any

# ============================================================
# مسار التخزين الدائم (Render Persistent Disk أو fallback محلي)
# ============================================================
_PERSIST_BASE = Path(_os.getenv('PERSISTENT_DISK_PATH', '/var/data/uploads'))
try:
    _PERSIST_BASE.mkdir(parents=True, exist_ok=True)
    _test = _PERSIST_BASE / '.write_test'
    _test.write_text('ok')
    _test.unlink()
    _STORE_BASE = _PERSIST_BASE
except Exception:
    _STORE_BASE = Path(__file__).resolve().parents[2] / 'uploads'
    _STORE_BASE.mkdir(parents=True, exist_ok=True)

GROUP_STORE_PATH = _STORE_BASE / 'group_store.json'
MESSAGES_STORE_PATH = _STORE_BASE / 'group_messages.json'


# ============================================================
# أنواع البيانات (Dataclasses)
# ============================================================
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
    muted_until: Optional[str] = None
    is_banned: bool = False
    banned_until: Optional[str] = None
    avatar_url: str = ""
    display_name: str = ""


@dataclass
class GroupInvite:
    id: str
    group_id: str
    inviter: str
    invitee: str
    status: str  # pending | accepted | rejected | revoked
    created_at: str


@dataclass
class GroupJoinRequest:
    id: str
    group_id: str
    username: str
    message: str = ""
    status: str = "pending"  # pending | approved | rejected
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    decided_by: Optional[str] = None
    decided_at: Optional[str] = None


@dataclass
class GroupMessage:
    id: str
    group_id: str
    sender_username: str
    sender_avatar: str = ""
    sender_display_name: str = ""
    content: str = ""
    message_type: str = "text"
    attachments: List[Dict] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    edited_at: Optional[str] = None
    is_edited: bool = False
    is_deleted: bool = False
    is_pinned: bool = False
    pinned_at: Optional[str] = None
    pinned_by: Optional[str] = None
    reply_to: Optional[str] = None
    reactions: Dict[str, List[str]] = field(default_factory=dict)
    seen_by: List[str] = field(default_factory=list)
    forwarded_count: int = 0
    reports: List[Dict] = field(default_factory=list)


@dataclass
class GroupPost:
    id: str
    group_id: str
    author_username: str
    content: str = ""
    media_urls: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    is_pinned: bool = False
    is_deleted: bool = False
    likes: List[str] = field(default_factory=list)
    comments_count: int = 0


@dataclass
class GroupRule:
    id: str
    group_id: str
    title: str
    description: str = ""
    order: int = 0
    created_by: str = ""
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class GroupEvent:
    id: str
    group_id: str
    title: str
    description: str = ""
    starts_at: str = ""
    ends_at: Optional[str] = None
    location: str = ""
    created_by: str = ""
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    attendees: List[str] = field(default_factory=list)


@dataclass
class GroupPoll:
    id: str
    group_id: str
    question: str
    options: List[str] = field(default_factory=list)
    votes: Dict[str, List[str]] = field(default_factory=dict)  # {option: [usernames]}
    multi_choice: bool = False
    closes_at: Optional[str] = None
    is_closed: bool = False
    created_by: str = ""
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class GroupAnnouncement:
    id: str
    group_id: str
    title: str
    body: str = ""
    is_pinned: bool = True
    created_by: str = ""
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class GroupItem:
    id: str
    name: str
    description: str
    owner_username: str
    created_at: str
    members: Dict[str, GroupMember] = field(default_factory=dict)
    invites: List[GroupInvite] = field(default_factory=list)
    join_requests: List[GroupJoinRequest] = field(default_factory=list)
    audit_logs: List[dict] = field(default_factory=list)
    settings: dict = field(default_factory=lambda: {
        "is_private": False,
        "allow_member_invites": True,
        "allow_member_posts": True,
        "approval_required": False,
        "slow_mode": 0,
        "language": "ar",
    })
    image_url: str = ""
    cover_image_url: str = ""
    category: str = ""
    is_verified: bool = False
    posts: List[GroupPost] = field(default_factory=list)
    rules: List[GroupRule] = field(default_factory=list)
    events: List[GroupEvent] = field(default_factory=list)
    polls: List[GroupPoll] = field(default_factory=list)
    announcements: List[GroupAnnouncement] = field(default_factory=list)
    # v59.5: per-group mentions + per-user notification preferences
    mentions: List[dict] = field(default_factory=list)
    notification_prefs: Dict[str, dict] = field(default_factory=dict)


# ============================================================
# Group Store
# ============================================================
class GroupStore:
    """متجر المجموعات الكامل مع جميع الميزات."""

    def __init__(self) -> None:
        self._groups: Dict[str, GroupItem] = {}
        self._messages: Dict[str, List[GroupMessage]] = {}
        self._next_id = 1
        self._load()

    # ============ helpers ============
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
        if len(group.audit_logs) > 200:
            group.audit_logs = group.audit_logs[-200:]

    def _is_privileged(self, group: GroupItem, username: str) -> bool:
        m = group.members.get(username)
        return bool(m and m.role in (GroupRole.OWNER, GroupRole.ADMIN))

    def _is_moderator_or_above(self, group: GroupItem, username: str) -> bool:
        m = group.members.get(username)
        return bool(m and m.role in (GroupRole.OWNER, GroupRole.ADMIN, GroupRole.MODERATOR))

    # ============ Groups CRUD ============
    def create_group(
        self,
        owner_username: str,
        name: str,
        description: str = '',
        members: Optional[List[str]] = None,
        category: str = "",
        image_url: str = "",
        cover_image_url: str = ""
    ) -> dict:
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
            category=category,
            image_url=image_url,
            cover_image_url=cover_image_url,
        )
        self._groups[group_id] = group
        self._add_audit_log(group_id, owner_username, "create_group", f"Group '{name}' created")
        self._save()
        return self.serialize_group(group)

    def list_groups(self) -> List[dict]:
        groups = sorted(self._groups.values(), key=lambda i: i.created_at, reverse=True)
        return [self.serialize_group(g) for g in groups]

    def search_groups(self, query: str, limit: int = 50) -> List[dict]:
        q = (query or "").strip().lower()
        if not q:
            return self.list_groups()[:limit]
        results: List[GroupItem] = []
        for g in self._groups.values():
            haystack = f"{g.name} {g.description} {g.category}".lower()
            if q in haystack:
                results.append(g)
        results.sort(key=lambda i: i.created_at, reverse=True)
        return [self.serialize_group(g) for g in results[:limit]]

    def get_group(self, group_id: str) -> Optional[GroupItem]:
        return self._groups.get(str(group_id))

    def update_group(
        self,
        group_id: str,
        actor: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        image_url: Optional[str] = None,
        cover_image_url: Optional[str] = None,
        category: Optional[str] = None,
        privacy: Optional[str] = None,
    ) -> bool:
        group = self._groups.get(str(group_id))
        if not group:
            return False
        if not self._is_privileged(group, actor):
            return False
        if name:
            group.name = name
        if description is not None:
            group.description = description
        if image_url is not None:
            group.image_url = image_url
        if cover_image_url is not None:
            group.cover_image_url = cover_image_url
        if category is not None:
            group.category = category
        if privacy is not None:
            group.settings["is_private"] = (str(privacy).lower() in ("private", "true", "1"))
        self._add_audit_log(group_id, actor, "update_group", "Group updated")
        self._save()
        return True

    def delete_group(self, group_id: str, actor: str) -> bool:
        group = self._groups.get(str(group_id))
        if not group:
            return False
        m = group.members.get(actor)
        if not m or m.role != GroupRole.OWNER:
            return False
        del self._groups[str(group_id)]
        self._messages.pop(str(group_id), None)
        self._save()
        return True

    # ============ Members ============
    def join_group(self, group_id: str, username: str) -> Optional[dict]:
        group = self._groups.get(str(group_id))
        if group is None:
            return None
        # المحظور لا يستطيع الانضمام
        existing = group.members.get(username)
        if existing and existing.is_banned:
            return None
        # المجموعة الخاصة تتطلب موافقة
        if group.settings.get("is_private") or group.settings.get("approval_required"):
            if not existing:
                self.create_join_request(group_id, username, "")
                payload = self.serialize_group(group)
                payload["joined"] = False
                payload["pending_approval"] = True
                return payload
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

    def leave_group(self, group_id: str, username: str) -> bool:
        group = self._groups.get(str(group_id))
        if not group:
            return False
        member = group.members.get(username)
        if not member:
            return False
        if member.role == GroupRole.OWNER:
            return False
        del group.members[username]
        self._add_audit_log(group_id, username, "leave", f"{username} left the group")
        self._save()
        return True

    def add_member(self, group_id: str, actor: str, target_username: str, role: GroupRole = GroupRole.MEMBER) -> bool:
        group = self._groups.get(str(group_id))
        if not group:
            return False
        actor_member = group.members.get(actor)
        if not actor_member:
            return False
        # عضو عادي يستطيع إضافة فقط إذا كانت الإعدادات تسمح
        if actor_member.role == GroupRole.MEMBER and not group.settings.get("allow_member_invites", True):
            return False
        if target_username in group.members:
            return True  # موجود بالفعل
        group.members[target_username] = GroupMember(
            username=target_username,
            role=role,
            joined_at=datetime.utcnow().isoformat(),
        )
        self._add_audit_log(group_id, actor, "add_member", f"Added {target_username}")
        self._save()
        return True

    def get_members(self, group_id: str) -> List[dict]:
        group = self._groups.get(str(group_id))
        if not group:
            return []
        return [self._serialize_member(m) for m in group.members.values()]

    def update_member_role(self, group_id: str, actor: str, target_username: str, new_role: GroupRole) -> bool:
        group = self._groups.get(str(group_id))
        if not group:
            return False
        actor_member = group.members.get(actor)
        if not actor_member or actor_member.role not in (GroupRole.OWNER, GroupRole.ADMIN):
            return False
        target_member = group.members.get(target_username)
        if not target_member:
            return False
        if new_role == GroupRole.ADMIN and actor_member.role != GroupRole.OWNER:
            return False
        if target_member.role == GroupRole.OWNER:
            return False
        target_member.role = new_role
        self._add_audit_log(group_id, actor, "update_role", f"Updated {target_username} role to {new_role.value}")
        self._save()
        return True

    def transfer_ownership(self, group_id: str, actor: str, new_owner: str) -> bool:
        group = self._groups.get(str(group_id))
        if not group:
            return False
        actor_member = group.members.get(actor)
        if not actor_member or actor_member.role != GroupRole.OWNER:
            return False
        target = group.members.get(new_owner)
        if not target:
            return False
        actor_member.role = GroupRole.ADMIN
        target.role = GroupRole.OWNER
        group.owner_username = new_owner
        self._add_audit_log(group_id, actor, "transfer_ownership", f"Ownership transferred to {new_owner}")
        self._save()
        return True

    def set_mute(self, group_id: str, actor: str, target_username: str, is_muted: bool, duration_mins: Optional[int] = None) -> bool:
        group = self._groups.get(str(group_id))
        if not group:
            return False
        if not self._is_moderator_or_above(group, actor):
            return False
        target = group.members.get(target_username)
        if not target:
            return False
        if target.role == GroupRole.OWNER:
            return False
        target.is_muted = bool(is_muted)
        target.muted_until = ("temporary" if duration_mins else None) if is_muted else None
        self._add_audit_log(group_id, actor, "mute" if is_muted else "unmute",
                            f"{'Muted' if is_muted else 'Unmuted'} {target_username}")
        self._save()
        return True

    def set_ban(self, group_id: str, actor: str, target_username: str, is_banned: bool) -> bool:
        group = self._groups.get(str(group_id))
        if not group:
            return False
        if not self._is_privileged(group, actor):
            return False
        target = group.members.get(target_username)
        if not target:
            # إنشاء "shadow record" للحظر حتى لو لم يكن عضوًا
            if is_banned:
                group.members[target_username] = GroupMember(
                    username=target_username,
                    role=GroupRole.MEMBER,
                    joined_at=datetime.utcnow().isoformat(),
                    is_banned=True,
                )
                self._add_audit_log(group_id, actor, "ban", f"Banned {target_username}")
                self._save()
                return True
            return False
        if target.role == GroupRole.OWNER:
            return False
        target.is_banned = bool(is_banned)
        if is_banned:
            # طرد فعلي مع الحفاظ على سجل الحظر
            target.role = GroupRole.MEMBER
        self._add_audit_log(group_id, actor, "ban" if is_banned else "unban",
                            f"{'Banned' if is_banned else 'Unbanned'} {target_username}")
        self._save()
        return True

    def moderate_user(self, group_id: str, actor: str, target_username: str, action: str, duration_mins: Optional[int] = None) -> bool:
        if action == "mute":
            return self.set_mute(group_id, actor, target_username, True, duration_mins)
        if action == "unmute":
            return self.set_mute(group_id, actor, target_username, False)
        if action == "kick":
            group = self._groups.get(str(group_id))
            if not group:
                return False
            if not self._is_moderator_or_above(group, actor):
                return False
            target = group.members.get(target_username)
            if not target or target.role == GroupRole.OWNER:
                return False
            del group.members[target_username]
            self._add_audit_log(group_id, actor, "kick", f"Kicked {target_username}")
            self._save()
            return True
        if action == "ban":
            return self.set_ban(group_id, actor, target_username, True)
        if action == "unban":
            return self.set_ban(group_id, actor, target_username, False)
        return False

    # ============ Invitations ============
    def invite_user(self, group_id: str, inviter: str, invitee: str) -> Optional[dict]:
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
            "group_id": group.id,
            "group_name": group.name,
            "inviter": inviter,
            "invitee": invitee,
            "status": invite.status,
        }

    def accept_invitation(self, group_id: str, invitation_id: str, username: str) -> Optional[dict]:
        group = self._groups.get(str(group_id))
        if not group:
            return None
        for inv in group.invites:
            if inv.id == invitation_id and inv.invitee == username and inv.status == "pending":
                inv.status = "accepted"
                if username not in group.members:
                    group.members[username] = GroupMember(
                        username=username,
                        role=GroupRole.MEMBER,
                        joined_at=datetime.utcnow().isoformat(),
                    )
                self._add_audit_log(group_id, username, "accept_invite", f"{username} accepted invitation")
                self._save()
                return self.serialize_group(group)
        return None

    # ============ Join Requests ============
    def create_join_request(self, group_id: str, username: str, message: str = "") -> Optional[dict]:
        group = self._groups.get(str(group_id))
        if not group:
            return None
        # تجنّب التكرار
        for req in group.join_requests:
            if req.username == username and req.status == "pending":
                return self._serialize_join_request(req)
        req = GroupJoinRequest(
            id=str(uuid.uuid4()),
            group_id=str(group_id),
            username=username,
            message=str(message or "").strip(),
        )
        group.join_requests.append(req)
        self._add_audit_log(group_id, username, "join_request", f"{username} requested to join")
        self._save()
        return self._serialize_join_request(req)

    def decide_join_request(self, group_id: str, request_id: str, actor: str, approve: bool) -> bool:
        group = self._groups.get(str(group_id))
        if not group:
            return False
        if not self._is_privileged(group, actor):
            return False
        for req in group.join_requests:
            if req.id == request_id and req.status == "pending":
                req.status = "approved" if approve else "rejected"
                req.decided_by = actor
                req.decided_at = datetime.utcnow().isoformat()
                if approve and req.username not in group.members:
                    group.members[req.username] = GroupMember(
                        username=req.username,
                        role=GroupRole.MEMBER,
                        joined_at=datetime.utcnow().isoformat(),
                    )
                self._add_audit_log(group_id, actor,
                                    "approve_request" if approve else "reject_request",
                                    f"{'Approved' if approve else 'Rejected'} {req.username}")
                self._save()
                return True
        return False

    # ============ Messages ============
    def send_message(
        self,
        group_id: str,
        sender_username: str,
        content: str,
        message_type: str = "text",
        sender_avatar: str = "",
        sender_display_name: str = "",
        attachments: Optional[list] = None,
        reply_to: Optional[str] = None
    ) -> Optional[dict]:
        group = self._groups.get(str(group_id))
        if not group:
            return None
        member = group.members.get(sender_username)
        if not member or member.is_banned:
            return None
        if member.is_muted:
            return None
        message_id = str(uuid.uuid4())
        message = GroupMessage(
            id=message_id,
            group_id=str(group_id),
            sender_username=sender_username,
            sender_avatar=sender_avatar,
            sender_display_name=sender_display_name or sender_username,
            content=content,
            message_type=message_type,
            attachments=attachments or [],
            reply_to=reply_to,
        )
        if str(group_id) not in self._messages:
            self._messages[str(group_id)] = []
        self._messages[str(group_id)].append(message)
        try:
            self._extract_and_store_mentions(group, message)
        except Exception:
            pass
        self._save()
        return self.serialize_message(message)

    # ============================================================
    # v59.5 — Mentions / Media gallery / Notifications / Discover
    # ============================================================
    def _extract_and_store_mentions(self, group: GroupItem, message: GroupMessage) -> None:
        import re
        content = message.content or ""
        if not content:
            return
        usernames = set(re.findall(r"@([A-Za-z0-9_\.\-]{2,32})", content))
        for uname in usernames:
            if uname == message.sender_username or uname not in group.members:
                continue
            group.mentions.append({
                "id": str(uuid.uuid4()),
                "message_id": message.id,
                "mentioned_username": uname,
                "by_username": message.sender_username,
                "content": content[:280],
                "created_at": datetime.utcnow().isoformat(),
                "read_by": [],
            })

    def list_mentions(self, group_id: str, username: str, limit: int = 100) -> List[dict]:
        group = self._groups.get(str(group_id))
        if not group:
            return []
        rows = [
            dict(m, is_read=(username in m.get("read_by", [])))
            for m in group.mentions
            if m.get("mentioned_username") == username
        ]
        rows.sort(key=lambda r: r.get("created_at", ""), reverse=True)
        return rows[:limit]

    def mark_mention_read(self, group_id: str, mention_id: str, username: str) -> bool:
        group = self._groups.get(str(group_id))
        if not group:
            return False
        for m in group.mentions:
            if m.get("id") == mention_id and m.get("mentioned_username") == username:
                if username not in m.setdefault("read_by", []):
                    m["read_by"].append(username)
                self._save()
                return True
        return False

    def list_pinned_messages(self, group_id: str) -> List[dict]:
        msgs = self._messages.get(str(group_id), [])
        pinned = [self.serialize_message(m) for m in msgs if m.is_pinned and not m.is_deleted]
        pinned.sort(key=lambda r: r.get("pinned_at") or r.get("created_at", ""), reverse=True)
        return pinned

    def list_media(self, group_id: str, limit: int = 200, kind: Optional[str] = None) -> List[dict]:
        out: List[dict] = []
        msgs = self._messages.get(str(group_id), [])
        for m in msgs:
            if m.is_deleted:
                continue
            for att in (m.attachments or []):
                url = att.get("url") or att.get("src") or att.get("href") or ""
                if not url:
                    continue
                mtype = (att.get("type") or att.get("mime") or "").lower()
                u = url.lower()
                if "image" in mtype or u.endswith((".png", ".jpg", ".jpeg", ".gif", ".webp")):
                    detected = "image"
                elif "video" in mtype or u.endswith((".mp4", ".mov", ".webm")):
                    detected = "video"
                elif "audio" in mtype or u.endswith((".mp3", ".wav", ".ogg", ".m4a")):
                    detected = "audio"
                else:
                    detected = "file"
                if kind and detected != kind:
                    continue
                out.append({
                    "id": f"msg:{m.id}:{url}",
                    "url": url, "type": detected, "source": "message",
                    "message_id": m.id, "sender_username": m.sender_username,
                    "created_at": m.created_at,
                })
        group = self._groups.get(str(group_id))
        if group:
            for p in group.posts:
                if p.is_deleted:
                    continue
                for url in (p.media_urls or []):
                    u = url.lower()
                    if u.endswith((".png", ".jpg", ".jpeg", ".gif", ".webp")):
                        detected = "image"
                    elif u.endswith((".mp4", ".mov", ".webm")):
                        detected = "video"
                    else:
                        detected = "file"
                    if kind and detected != kind:
                        continue
                    out.append({
                        "id": f"post:{p.id}:{url}",
                        "url": url, "type": detected, "source": "post",
                        "post_id": p.id, "sender_username": p.author_username,
                        "created_at": p.created_at,
                    })
        out.sort(key=lambda r: r.get("created_at", ""), reverse=True)
        return out[:limit]

    _DEFAULT_NOTIF_PREFS = {
        "mode": "all", "mute_until": None, "mute_mentions": False,
        "sound": "default", "vibrate": True, "preview": True,
    }

    def get_notification_prefs(self, group_id: str, username: str) -> dict:
        group = self._groups.get(str(group_id))
        if not group:
            return dict(self._DEFAULT_NOTIF_PREFS)
        merged = dict(self._DEFAULT_NOTIF_PREFS)
        merged.update(group.notification_prefs.get(username) or {})
        return merged

    def update_notification_prefs(self, group_id: str, username: str, patch: dict) -> Optional[dict]:
        group = self._groups.get(str(group_id))
        if not group:
            return None
        current = dict(self._DEFAULT_NOTIF_PREFS)
        current.update(group.notification_prefs.get(username) or {})
        allowed = set(self._DEFAULT_NOTIF_PREFS.keys())
        for k, v in (patch or {}).items():
            if k in allowed:
                current[k] = v
        group.notification_prefs[username] = current
        self._save()
        return current

    def list_rules(self, group_id: str) -> List[dict]:
        group = self._groups.get(str(group_id))
        if not group:
            return []
        rows = [{
            "id": r.id, "group_id": r.group_id, "title": r.title,
            "description": getattr(r, "description", ""), "order": getattr(r, "order", 0),
            "created_by": getattr(r, "created_by", ""),
            "created_at": getattr(r, "created_at", ""),
        } for r in group.rules]
        rows.sort(key=lambda r: (r.get("order", 0), r.get("created_at", "")))
        return rows

    def list_events(self, group_id: str, limit: int = 100) -> List[dict]:
        group = self._groups.get(str(group_id))
        if not group:
            return []
        rows = [{
            "id": e.id, "group_id": e.group_id, "title": e.title,
            "description": getattr(e, "description", ""),
            "start_at": getattr(e, "start_at", None), "end_at": getattr(e, "end_at", None),
            "location": getattr(e, "location", ""),
            "created_by": getattr(e, "created_by", ""),
            "created_at": getattr(e, "created_at", ""),
            "attendees": list(getattr(e, "attendees", []) or []),
        } for e in group.events]
        rows.sort(key=lambda r: r.get("start_at") or r.get("created_at", ""), reverse=True)
        return rows[:limit]

    def list_polls(self, group_id: str, limit: int = 100) -> List[dict]:
        group = self._groups.get(str(group_id))
        if not group:
            return []
        rows = [self._serialize_poll(p) for p in group.polls]
        rows.sort(key=lambda r: r.get("created_at", ""), reverse=True)
        return rows[:limit]

    def list_announcements(self, group_id: str, limit: int = 100) -> List[dict]:
        group = self._groups.get(str(group_id))
        if not group:
            return []
        rows = [{
            "id": a.id, "group_id": a.group_id, "title": a.title,
            "body": getattr(a, "body", ""),
            "is_pinned": getattr(a, "is_pinned", False),
            "created_by": getattr(a, "created_by", ""),
            "created_at": getattr(a, "created_at", ""),
        } for a in group.announcements]
        rows.sort(key=lambda r: r.get("created_at", ""), reverse=True)
        rows.sort(key=lambda r: r.get("is_pinned", False), reverse=True)
        return rows[:limit]

    def discover_groups(self, username: Optional[str] = None, category: Optional[str] = None, limit: int = 60) -> List[dict]:
        results: List[dict] = []
        for g in self._groups.values():
            if username and username in g.members:
                continue
            if g.settings.get("is_private"):
                continue
            if category and (g.category or "").lower() != category.lower():
                continue
            data = self.serialize_group(g)
            msg_count = len(self._messages.get(g.id, []))
            data["members_count"] = len(g.members)
            data["messages_count"] = msg_count
            data["_score"] = len(g.members) * 10 + msg_count + len(g.posts)
            results.append(data)
        results.sort(key=lambda r: r.get("_score", 0), reverse=True)
        for r in results:
            r.pop("_score", None)
        return results[:limit]

    def trending_groups(self, limit: int = 20) -> List[dict]:
        from datetime import timedelta
        cutoff = (datetime.utcnow() - timedelta(days=7)).isoformat()
        rows: List[dict] = []
        for g in self._groups.values():
            if g.settings.get("is_private"):
                continue
            msgs = self._messages.get(g.id, [])
            recent_msgs = sum(1 for m in msgs if (m.created_at or "") >= cutoff and not m.is_deleted)
            recent_posts = sum(1 for p in g.posts if (p.created_at or "") >= cutoff and not p.is_deleted)
            recent_members = sum(1 for mem in g.members.values() if (getattr(mem, "joined_at", "") or "") >= cutoff)
            score = recent_msgs * 2 + recent_posts * 3 + recent_members * 5
            if score <= 0:
                continue
            data = self.serialize_group(g)
            data["trending_score"] = score
            data["members_count"] = len(g.members)
            data["messages_7d"] = recent_msgs
            rows.append(data)
        rows.sort(key=lambda r: r.get("trending_score", 0), reverse=True)
        return rows[:limit]

    def get_messages(self, group_id: str, limit: int = 50, offset: int = 0) -> List[dict]:
        messages = self._messages.get(str(group_id), [])
        active = [m for m in messages if not m.is_deleted]
        active.sort(key=lambda m: m.created_at, reverse=True)
        paginated = active[offset:offset + limit]
        return [self.serialize_message(m) for m in paginated]

    def _find_message(self, group_id: str, message_id: str) -> Optional[GroupMessage]:
        for m in self._messages.get(str(group_id), []):
            if m.id == message_id:
                return m
        return None

    def delete_message(self, group_id: str, message_id: str, actor: str) -> bool:
        group = self._groups.get(str(group_id))
        if not group:
            return False
        actor_member = group.members.get(actor)
        if not actor_member:
            return False
        msg = self._find_message(group_id, message_id)
        if not msg:
            return False
        if msg.sender_username != actor and not self._is_moderator_or_above(group, actor):
            return False
        msg.is_deleted = True
        self._add_audit_log(group_id, actor, "delete_message", f"Deleted message {message_id}")
        self._save()
        return True

    def edit_message(self, group_id: str, message_id: str, actor: str, new_content: str) -> bool:
        msg = self._find_message(group_id, message_id)
        if not msg or msg.sender_username != actor:
            return False
        msg.content = new_content
        msg.is_edited = True
        msg.edited_at = datetime.utcnow().isoformat()
        self._save()
        return True

    def add_reaction(self, group_id: str, message_id: str, username: str, emoji: str) -> bool:
        msg = self._find_message(group_id, message_id)
        if not msg:
            return False
        if emoji not in msg.reactions:
            msg.reactions[emoji] = []
        if username not in msg.reactions[emoji]:
            msg.reactions[emoji].append(username)
        self._save()
        return True

    def remove_reaction(self, group_id: str, message_id: str, username: str, emoji: str) -> bool:
        msg = self._find_message(group_id, message_id)
        if not msg:
            return False
        if emoji in msg.reactions and username in msg.reactions[emoji]:
            msg.reactions[emoji].remove(username)
            if not msg.reactions[emoji]:
                del msg.reactions[emoji]
            self._save()
            return True
        return False

    def mark_message_seen(self, group_id: str, message_id: str, username: str) -> bool:
        msg = self._find_message(group_id, message_id)
        if not msg:
            return False
        if username not in msg.seen_by:
            msg.seen_by.append(username)
            self._save()
        return True

    def pin_message(self, group_id: str, message_id: str, actor: str, is_pinned: bool = True) -> bool:
        group = self._groups.get(str(group_id))
        if not group or not self._is_moderator_or_above(group, actor):
            return False
        msg = self._find_message(group_id, message_id)
        if not msg:
            return False
        msg.is_pinned = bool(is_pinned)
        msg.pinned_at = datetime.utcnow().isoformat() if is_pinned else None
        msg.pinned_by = actor if is_pinned else None
        self._add_audit_log(group_id, actor, "pin_message" if is_pinned else "unpin_message", message_id)
        self._save()
        return True

    def forward_message(self, group_id: str, message_id: str, actor: str, targets: List[str]) -> dict:
        """يعيد رسالة إلى مجموعات أخرى (targets = group_ids)."""
        src = self._find_message(group_id, message_id)
        if not src:
            return {"status": "error", "reason": "message_not_found", "forwarded": 0}
        sent = []
        for target_gid in targets:
            res = self.send_message(
                str(target_gid),
                actor,
                src.content,
                message_type=src.message_type,
                attachments=list(src.attachments),
            )
            if res:
                sent.append(target_gid)
        src.forwarded_count += len(sent)
        self._save()
        return {"status": "success", "forwarded": len(sent), "targets": sent}

    def report_message(self, group_id: str, message_id: str, reporter: str, reason: str = "") -> bool:
        msg = self._find_message(group_id, message_id)
        if not msg:
            return False
        msg.reports.append({
            "reporter": reporter,
            "reason": str(reason or "").strip(),
            "at": datetime.utcnow().isoformat(),
        })
        self._add_audit_log(group_id, reporter, "report_message", f"Reported {message_id}: {reason}")
        self._save()
        return True

    # ============ Posts ============
    def list_posts(self, group_id: str, limit: int = 50, offset: int = 0) -> List[dict]:
        group = self._groups.get(str(group_id))
        if not group:
            return []
        active = [p for p in group.posts if not p.is_deleted]
        active.sort(key=lambda p: (not p.is_pinned, p.created_at), reverse=False)
        # المثبتة أولًا ثم الأحدث
        pinned = [p for p in active if p.is_pinned]
        others = sorted([p for p in active if not p.is_pinned], key=lambda p: p.created_at, reverse=True)
        ordered = pinned + others
        return [self._serialize_post(p) for p in ordered[offset:offset + limit]]

    def create_post(self, group_id: str, author: str, content: str, media_urls: Optional[List[str]] = None) -> Optional[dict]:
        group = self._groups.get(str(group_id))
        if not group:
            return None
        member = group.members.get(author)
        if not member or member.is_banned:
            return None
        if member.role == GroupRole.MEMBER and not group.settings.get("allow_member_posts", True):
            return None
        post = GroupPost(
            id=str(uuid.uuid4()),
            group_id=str(group_id),
            author_username=author,
            content=str(content or "").strip(),
            media_urls=list(media_urls or []),
        )
        group.posts.append(post)
        self._add_audit_log(group_id, author, "create_post", post.id)
        self._save()
        return self._serialize_post(post)

    def delete_post(self, group_id: str, post_id: str, actor: str) -> bool:
        group = self._groups.get(str(group_id))
        if not group:
            return False
        for p in group.posts:
            if p.id == post_id and not p.is_deleted:
                if p.author_username != actor and not self._is_moderator_or_above(group, actor):
                    return False
                p.is_deleted = True
                self._add_audit_log(group_id, actor, "delete_post", post_id)
                self._save()
                return True
        return False

    def pin_post(self, group_id: str, post_id: str, actor: str, is_pinned: bool = True) -> bool:
        group = self._groups.get(str(group_id))
        if not group or not self._is_moderator_or_above(group, actor):
            return False
        for p in group.posts:
            if p.id == post_id:
                p.is_pinned = bool(is_pinned)
                self._add_audit_log(group_id, actor, "pin_post" if is_pinned else "unpin_post", post_id)
                self._save()
                return True
        return False

    # ============ Rules ============
    def create_rule(self, group_id: str, actor: str, title: str, description: str = "", order: int = 0) -> Optional[dict]:
        group = self._groups.get(str(group_id))
        if not group or not self._is_privileged(group, actor):
            return None
        rule = GroupRule(
            id=str(uuid.uuid4()),
            group_id=str(group_id),
            title=str(title or "").strip(),
            description=str(description or "").strip(),
            order=int(order or 0),
            created_by=actor,
        )
        if not rule.title:
            return None
        group.rules.append(rule)
        group.rules.sort(key=lambda r: r.order)
        self._add_audit_log(group_id, actor, "create_rule", rule.title)
        self._save()
        return asdict(rule)

    # ============ Events ============
    def create_event(self, group_id: str, actor: str, title: str, description: str = "",
                     starts_at: str = "", ends_at: Optional[str] = None, location: str = "") -> Optional[dict]:
        group = self._groups.get(str(group_id))
        if not group:
            return None
        member = group.members.get(actor)
        if not member or member.is_banned:
            return None
        event = GroupEvent(
            id=str(uuid.uuid4()),
            group_id=str(group_id),
            title=str(title or "").strip(),
            description=str(description or "").strip(),
            starts_at=str(starts_at or ""),
            ends_at=ends_at,
            location=str(location or ""),
            created_by=actor,
        )
        if not event.title:
            return None
        group.events.append(event)
        self._add_audit_log(group_id, actor, "create_event", event.title)
        self._save()
        return asdict(event)

    # ============ Polls ============
    def create_poll(self, group_id: str, actor: str, question: str, options: List[str],
                    multi_choice: bool = False, closes_at: Optional[str] = None) -> Optional[dict]:
        group = self._groups.get(str(group_id))
        if not group:
            return None
        member = group.members.get(actor)
        if not member or member.is_banned:
            return None
        clean_options = [str(o).strip() for o in (options or []) if str(o).strip()]
        if not str(question or "").strip() or len(clean_options) < 2:
            return None
        poll = GroupPoll(
            id=str(uuid.uuid4()),
            group_id=str(group_id),
            question=str(question).strip(),
            options=clean_options,
            multi_choice=bool(multi_choice),
            closes_at=closes_at,
            created_by=actor,
        )
        group.polls.append(poll)
        self._add_audit_log(group_id, actor, "create_poll", poll.question)
        self._save()
        return self._serialize_poll(poll)

    def vote_in_poll(self, group_id: str, poll_id: str, voter: str, option: str) -> Optional[dict]:
        group = self._groups.get(str(group_id))
        if not group:
            return None
        member = group.members.get(voter)
        if not member or member.is_banned:
            return None
        for poll in group.polls:
            if poll.id == poll_id and not poll.is_closed:
                if option not in poll.options:
                    return None
                # في حال الاختيار الفردي: أزل أصواته الأخرى
                if not poll.multi_choice:
                    for opt, voters in list(poll.votes.items()):
                        if voter in voters:
                            voters.remove(voter)
                            if not voters:
                                del poll.votes[opt]
                poll.votes.setdefault(option, [])
                if voter not in poll.votes[option]:
                    poll.votes[option].append(voter)
                self._save()
                return self._serialize_poll(poll)
        return None

    # ============ Announcements ============
    def create_announcement(self, group_id: str, actor: str, title: str, body: str = "",
                            is_pinned: bool = True) -> Optional[dict]:
        group = self._groups.get(str(group_id))
        if not group or not self._is_privileged(group, actor):
            return None
        ann = GroupAnnouncement(
            id=str(uuid.uuid4()),
            group_id=str(group_id),
            title=str(title or "").strip(),
            body=str(body or "").strip(),
            is_pinned=bool(is_pinned),
            created_by=actor,
        )
        if not ann.title:
            return None
        group.announcements.append(ann)
        self._add_audit_log(group_id, actor, "create_announcement", ann.title)
        self._save()
        return asdict(ann)

    # ============ Settings ============
    def get_settings(self, group_id: str) -> Optional[dict]:
        group = self._groups.get(str(group_id))
        if not group:
            return None
        return dict(group.settings)

    def update_settings(self, group_id: str, actor: str, patch: dict) -> Optional[dict]:
        group = self._groups.get(str(group_id))
        if not group or not self._is_privileged(group, actor):
            return None
        allowed_keys = {"is_private", "allow_member_invites", "allow_member_posts",
                        "approval_required", "slow_mode", "language"}
        for k, v in (patch or {}).items():
            if k in allowed_keys:
                group.settings[k] = v
        self._add_audit_log(group_id, actor, "update_settings", json.dumps(patch, ensure_ascii=False))
        self._save()
        return dict(group.settings)

    # ============ Analytics ============
    def get_analytics(self, group_id: str) -> Optional[dict]:
        group = self._groups.get(str(group_id))
        if not group:
            return None
        msgs = self._messages.get(str(group_id), [])
        active_msgs = [m for m in msgs if not m.is_deleted]
        # top contributors
        counts: Dict[str, int] = {}
        for m in active_msgs:
            counts[m.sender_username] = counts.get(m.sender_username, 0) + 1
        top = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:5]
        return {
            "group_id": group.id,
            "members_count": len(group.members),
            "active_members": sum(1 for m in group.members.values() if not m.is_banned),
            "banned_members": sum(1 for m in group.members.values() if m.is_banned),
            "muted_members": sum(1 for m in group.members.values() if m.is_muted),
            "messages_total": len(active_msgs),
            "posts_total": sum(1 for p in group.posts if not p.is_deleted),
            "polls_total": len(group.polls),
            "events_total": len(group.events),
            "rules_total": len(group.rules),
            "announcements_total": len(group.announcements),
            "pending_join_requests": sum(1 for r in group.join_requests if r.status == "pending"),
            "pending_invitations": sum(1 for i in group.invites if i.status == "pending"),
            "top_contributors": [{"username": u, "messages": c} for u, c in top],
        }

    # ============ Serializers ============
    def _serialize_member(self, m: GroupMember) -> dict:
        return {
            'username': m.username,
            'role': m.role.value if isinstance(m.role, GroupRole) else str(m.role),
            'joined_at': m.joined_at,
            'is_muted': bool(m.is_muted),
            'muted_until': m.muted_until,
            'is_banned': bool(m.is_banned),
            'banned_until': m.banned_until,
            'avatar_url': m.avatar_url,
            'display_name': m.display_name,
        }

    def _serialize_join_request(self, r: GroupJoinRequest) -> dict:
        return asdict(r)

    def _serialize_post(self, p: GroupPost) -> dict:
        return {
            'id': p.id,
            'group_id': p.group_id,
            'author_username': p.author_username,
            'content': p.content,
            'media_urls': list(p.media_urls),
            'created_at': p.created_at,
            'is_pinned': bool(p.is_pinned),
            'is_deleted': bool(p.is_deleted),
            'likes': list(p.likes),
            'likes_count': len(p.likes),
            'comments_count': int(p.comments_count or 0),
        }

    def _serialize_poll(self, poll: GroupPoll) -> dict:
        total = sum(len(v) for v in poll.votes.values())
        return {
            'id': poll.id,
            'group_id': poll.group_id,
            'question': poll.question,
            'options': list(poll.options),
            'votes': {k: list(v) for k, v in poll.votes.items()},
            'totals': {opt: len(poll.votes.get(opt, [])) for opt in poll.options},
            'total_votes': total,
            'multi_choice': bool(poll.multi_choice),
            'closes_at': poll.closes_at,
            'is_closed': bool(poll.is_closed),
            'created_by': poll.created_by,
            'created_at': poll.created_at,
        }

    def serialize_group(self, item: GroupItem) -> dict:
        pinned_messages = []
        msgs = self._messages.get(item.id, [])
        for m in msgs:
            if m.is_pinned and not m.is_deleted:
                pinned_messages.append(self.serialize_message(m))
        return {
            'id': item.id,
            'name': item.name,
            'description': item.description,
            'owner_username': item.owner_username,
            'created_at': item.created_at,
            'image_url': item.image_url,
            'cover_image_url': item.cover_image_url,
            'category': item.category,
            'is_verified': item.is_verified,
            'members': [self._serialize_member(m) for m in item.members.values()],
            'members_count': len([m for m in item.members.values() if not m.is_banned]),
            'settings': item.settings,
            'audit_logs_preview': item.audit_logs[-10:],
            'rules_count': len(item.rules),
            'events_count': len(item.events),
            'posts_count': sum(1 for p in item.posts if not p.is_deleted),
            'polls_count': len(item.polls),
            'announcements': [asdict(a) for a in item.announcements[-5:]],
            'pinned_messages': pinned_messages,
        }

    def serialize_message(self, message: GroupMessage) -> dict:
        return {
            'id': message.id,
            'group_id': message.group_id,
            'sender_username': message.sender_username,
            'sender_avatar': message.sender_avatar,
            'sender_display_name': message.sender_display_name,
            'content': message.content,
            'message_type': message.message_type,
            'attachments': message.attachments,
            'created_at': message.created_at,
            'edited_at': message.edited_at,
            'is_edited': message.is_edited,
            'is_deleted': message.is_deleted,
            'is_pinned': bool(getattr(message, 'is_pinned', False)),
            'reply_to': message.reply_to,
            'reactions': message.reactions,
            'seen_by': message.seen_by,
            'seen_count': len(message.seen_by),
            'forwarded_count': int(getattr(message, 'forwarded_count', 0) or 0),
        }

    # ============ Persistence ============
    def _serialize_store(self) -> dict:
        return {
            'next_id': self._next_id,
            'groups': [
                {
                    'id': g.id,
                    'name': g.name,
                    'description': g.description,
                    'owner_username': g.owner_username,
                    'created_at': g.created_at,
                    'image_url': g.image_url,
                    'cover_image_url': g.cover_image_url,
                    'category': g.category,
                    'is_verified': g.is_verified,
                    'members': {
                        username: {
                            'username': m.username,
                            'role': m.role.value if isinstance(m.role, GroupRole) else str(m.role),
                            'joined_at': m.joined_at,
                            'is_muted': m.is_muted,
                            'muted_until': m.muted_until,
                            'is_banned': m.is_banned,
                            'banned_until': m.banned_until,
                            'avatar_url': m.avatar_url,
                            'display_name': m.display_name,
                        }
                        for username, m in g.members.items()
                    },
                    'invites': [asdict(i) for i in g.invites],
                    'join_requests': [asdict(r) for r in g.join_requests],
                    'audit_logs': g.audit_logs,
                    'settings': g.settings,
                    'posts': [self._serialize_post(p) for p in g.posts],
                    'rules': [asdict(r) for r in g.rules],
                    'events': [asdict(e) for e in g.events],
                    'polls': [
                        {
                            'id': p.id, 'group_id': p.group_id, 'question': p.question,
                            'options': list(p.options), 'votes': {k: list(v) for k, v in p.votes.items()},
                            'multi_choice': p.multi_choice, 'closes_at': p.closes_at,
                            'is_closed': p.is_closed, 'created_by': p.created_by, 'created_at': p.created_at,
                        } for p in g.polls
                    ],
                    'announcements': [asdict(a) for a in g.announcements],
                }
                for g in self._groups.values()
            ],
            'messages': {
                group_id: [
                    {
                        'id': msg.id, 'group_id': msg.group_id,
                        'sender_username': msg.sender_username,
                        'sender_avatar': msg.sender_avatar,
                        'sender_display_name': msg.sender_display_name,
                        'content': msg.content, 'message_type': msg.message_type,
                        'attachments': msg.attachments, 'created_at': msg.created_at,
                        'edited_at': msg.edited_at, 'is_edited': msg.is_edited,
                        'is_deleted': msg.is_deleted,
                        'is_pinned': bool(getattr(msg, 'is_pinned', False)),
                        'pinned_at': getattr(msg, 'pinned_at', None),
                        'pinned_by': getattr(msg, 'pinned_by', None),
                        'reply_to': msg.reply_to,
                        'reactions': msg.reactions, 'seen_by': msg.seen_by,
                        'forwarded_count': int(getattr(msg, 'forwarded_count', 0) or 0),
                        'reports': list(getattr(msg, 'reports', []) or []),
                    }
                    for msg in messages
                ]
                for group_id, messages in self._messages.items()
            }
        }

    def _load(self) -> None:
        """تحميل البيانات — أولوية: ملف دائم، ثم backup من PostgreSQL، مع توافق رجعي."""
        try:
            GROUP_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)

            if not GROUP_STORE_PATH.exists():
                try:
                    from app.db.session import SessionLocal
                    from sqlalchemy import text
                    db = SessionLocal()
                    try:
                        row = db.execute(text(
                            "SELECT snapshot FROM group_store_backup WHERE id = 1"
                        )).fetchone()
                        if row and row[0]:
                            snapshot_data = row[0] if isinstance(row[0], dict) else json.loads(row[0])
                            GROUP_STORE_PATH.write_text(
                                json.dumps(snapshot_data, ensure_ascii=False, indent=2),
                                encoding='utf-8'
                            )
                            print("✅ Groups restored from PostgreSQL backup")
                    finally:
                        db.close()
                except Exception as e:
                    print(f"⚠️ No DB backup available for groups: {e}")

            if not GROUP_STORE_PATH.exists():
                return
            payload = json.loads(GROUP_STORE_PATH.read_text(encoding='utf-8') or '{}')
            self._next_id = max(int(payload.get('next_id') or 1), 1)

            restored: Dict[str, GroupItem] = {}
            for raw in payload.get('groups', []):
                if not isinstance(raw, dict):
                    continue
                members: Dict[str, GroupMember] = {}
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
                        muted_until=(str(member.get('muted_until')) if member.get('muted_until') else None),
                        is_banned=bool(member.get('is_banned')),
                        banned_until=(str(member.get('banned_until')) if member.get('banned_until') else None),
                        avatar_url=str(member.get('avatar_url') or ''),
                        display_name=str(member.get('display_name') or ''),
                    )
                invites = [
                    GroupInvite(
                        id=str(inv.get('id') or uuid.uuid4()),
                        group_id=str(inv.get('group_id') or raw.get('id') or ''),
                        inviter=str(inv.get('inviter') or ''),
                        invitee=str(inv.get('invitee') or ''),
                        status=str(inv.get('status') or 'pending'),
                        created_at=str(inv.get('created_at') or datetime.utcnow().isoformat()),
                    )
                    for inv in (raw.get('invites') or []) if isinstance(inv, dict)
                ]
                join_requests = [
                    GroupJoinRequest(
                        id=str(r.get('id') or uuid.uuid4()),
                        group_id=str(r.get('group_id') or raw.get('id') or ''),
                        username=str(r.get('username') or ''),
                        message=str(r.get('message') or ''),
                        status=str(r.get('status') or 'pending'),
                        created_at=str(r.get('created_at') or datetime.utcnow().isoformat()),
                        decided_by=(str(r.get('decided_by')) if r.get('decided_by') else None),
                        decided_at=(str(r.get('decided_at')) if r.get('decided_at') else None),
                    )
                    for r in (raw.get('join_requests') or []) if isinstance(r, dict)
                ]
                posts = []
                for p in (raw.get('posts') or []):
                    if not isinstance(p, dict):
                        continue
                    posts.append(GroupPost(
                        id=str(p.get('id') or uuid.uuid4()),
                        group_id=str(p.get('group_id') or raw.get('id') or ''),
                        author_username=str(p.get('author_username') or ''),
                        content=str(p.get('content') or ''),
                        media_urls=list(p.get('media_urls') or []),
                        created_at=str(p.get('created_at') or datetime.utcnow().isoformat()),
                        is_pinned=bool(p.get('is_pinned')),
                        is_deleted=bool(p.get('is_deleted')),
                        likes=list(p.get('likes') or []),
                        comments_count=int(p.get('comments_count') or 0),
                    ))
                rules = [
                    GroupRule(
                        id=str(r.get('id') or uuid.uuid4()),
                        group_id=str(r.get('group_id') or raw.get('id') or ''),
                        title=str(r.get('title') or ''),
                        description=str(r.get('description') or ''),
                        order=int(r.get('order') or 0),
                        created_by=str(r.get('created_by') or ''),
                        created_at=str(r.get('created_at') or datetime.utcnow().isoformat()),
                    )
                    for r in (raw.get('rules') or []) if isinstance(r, dict)
                ]
                events = [
                    GroupEvent(
                        id=str(e.get('id') or uuid.uuid4()),
                        group_id=str(e.get('group_id') or raw.get('id') or ''),
                        title=str(e.get('title') or ''),
                        description=str(e.get('description') or ''),
                        starts_at=str(e.get('starts_at') or ''),
                        ends_at=(str(e.get('ends_at')) if e.get('ends_at') else None),
                        location=str(e.get('location') or ''),
                        created_by=str(e.get('created_by') or ''),
                        created_at=str(e.get('created_at') or datetime.utcnow().isoformat()),
                        attendees=list(e.get('attendees') or []),
                    )
                    for e in (raw.get('events') or []) if isinstance(e, dict)
                ]
                polls = []
                for pl in (raw.get('polls') or []):
                    if not isinstance(pl, dict):
                        continue
                    polls.append(GroupPoll(
                        id=str(pl.get('id') or uuid.uuid4()),
                        group_id=str(pl.get('group_id') or raw.get('id') or ''),
                        question=str(pl.get('question') or ''),
                        options=list(pl.get('options') or []),
                        votes={k: list(v) for k, v in (pl.get('votes') or {}).items()},
                        multi_choice=bool(pl.get('multi_choice')),
                        closes_at=(str(pl.get('closes_at')) if pl.get('closes_at') else None),
                        is_closed=bool(pl.get('is_closed')),
                        created_by=str(pl.get('created_by') or ''),
                        created_at=str(pl.get('created_at') or datetime.utcnow().isoformat()),
                    ))
                announcements = [
                    GroupAnnouncement(
                        id=str(a.get('id') or uuid.uuid4()),
                        group_id=str(a.get('group_id') or raw.get('id') or ''),
                        title=str(a.get('title') or ''),
                        body=str(a.get('body') or ''),
                        is_pinned=bool(a.get('is_pinned', True)),
                        created_by=str(a.get('created_by') or ''),
                        created_at=str(a.get('created_at') or datetime.utcnow().isoformat()),
                    )
                    for a in (raw.get('announcements') or []) if isinstance(a, dict)
                ]
                item = GroupItem(
                    id=str(raw.get('id') or ''),
                    name=str(raw.get('name') or ''),
                    description=str(raw.get('description') or ''),
                    owner_username=str(raw.get('owner_username') or ''),
                    created_at=str(raw.get('created_at') or datetime.utcnow().isoformat()),
                    members=members,
                    invites=invites,
                    join_requests=join_requests,
                    audit_logs=[log for log in (raw.get('audit_logs') or []) if isinstance(log, dict)],
                    settings=raw.get('settings') or {
                        "is_private": False,
                        "allow_member_invites": True,
                        "allow_member_posts": True,
                        "approval_required": False,
                        "slow_mode": 0,
                        "language": "ar",
                    },
                    image_url=str(raw.get('image_url') or ''),
                    cover_image_url=str(raw.get('cover_image_url') or ''),
                    category=str(raw.get('category') or ''),
                    is_verified=bool(raw.get('is_verified', False)),
                    posts=posts,
                    rules=rules,
                    events=events,
                    polls=polls,
                    announcements=announcements,
                )
                if item.id:
                    restored[item.id] = item
            self._groups = restored

            # تحميل الرسائل
            for group_id, messages_data in (payload.get('messages') or {}).items():
                if not isinstance(messages_data, list):
                    continue
                messages: List[GroupMessage] = []
                for d in messages_data:
                    if not isinstance(d, dict):
                        continue
                    messages.append(GroupMessage(
                        id=str(d.get('id') or ''),
                        group_id=str(d.get('group_id') or ''),
                        sender_username=str(d.get('sender_username') or ''),
                        sender_avatar=str(d.get('sender_avatar') or ''),
                        sender_display_name=str(d.get('sender_display_name') or ''),
                        content=str(d.get('content') or ''),
                        message_type=str(d.get('message_type') or 'text'),
                        attachments=d.get('attachments') or [],
                        created_at=str(d.get('created_at') or datetime.utcnow().isoformat()),
                        edited_at=d.get('edited_at'),
                        is_edited=bool(d.get('is_edited', False)),
                        is_deleted=bool(d.get('is_deleted', False)),
                        is_pinned=bool(d.get('is_pinned', False)),
                        pinned_at=d.get('pinned_at'),
                        pinned_by=d.get('pinned_by'),
                        reply_to=d.get('reply_to'),
                        reactions=d.get('reactions') or {},
                        seen_by=d.get('seen_by') or [],
                        forwarded_count=int(d.get('forwarded_count') or 0),
                        reports=list(d.get('reports') or []),
                    ))
                self._messages[group_id] = messages

            if self._groups:
                self._next_id = max(
                    self._next_id,
                    max(int(gid) for gid in self._groups.keys() if gid.isdigit()) + 1
                )
        except Exception as e:
            print(f"Error loading groups: {e}")
            # لا نمسح البيانات تلقائيًا — الإبقاء على الحالة الأخيرة
            if not self._groups:
                self._groups = {}
            if not self._messages:
                self._messages = {}
            if not self._next_id:
                self._next_id = 1

    def _save(self) -> None:
        """حفظ إلى القرص + نسخة احتياطية إلى PostgreSQL."""
        try:
            GROUP_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
            GROUP_STORE_PATH.write_text(
                json.dumps(self._serialize_store(), ensure_ascii=False, indent=2),
                encoding='utf-8'
            )
        except Exception as e:
            print(f"Error saving groups to disk: {e}")

        try:
            from app.db.session import SessionLocal
            from sqlalchemy import text
            db = SessionLocal()
            try:
                db.execute(text(
                    """CREATE TABLE IF NOT EXISTS group_store_backup (
                        id INTEGER PRIMARY KEY DEFAULT 1,
                        snapshot JSONB NOT NULL,
                        updated_at TIMESTAMP DEFAULT NOW()
                    )"""
                ))
                db.execute(text(
                    """INSERT INTO group_store_backup (id, snapshot, updated_at)
                       VALUES (1, CAST(:s AS JSONB), NOW())
                       ON CONFLICT (id) DO UPDATE
                       SET snapshot = EXCLUDED.snapshot, updated_at = NOW()"""
                ), {"s": json.dumps(self._serialize_store(), ensure_ascii=False)})
                db.commit()
            finally:
                db.close()
        except Exception as e:
            print(f"⚠️ DB backup of groups skipped: {e}")


group_store = GroupStore()
