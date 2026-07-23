from __future__ import annotations

import json
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Optional, Dict, List

# ✅ إصلاح v41: مسار دائم (Render Persistent Disk) بدل backend/uploads/
import os as _os
_PERSIST_BASE = Path(_os.getenv('PERSISTENT_DISK_PATH', '/var/data/uploads'))
try:
    _PERSIST_BASE.mkdir(parents=True, exist_ok=True)
    _t = _PERSIST_BASE / '.write_test'
    _t.write_text('ok'); _t.unlink()
    _STORE_BASE = _PERSIST_BASE
except Exception:
    _STORE_BASE = Path(__file__).resolve().parents[2] / 'uploads'
    _STORE_BASE.mkdir(parents=True, exist_ok=True)

GROUP_STORE_PATH = _STORE_BASE / 'group_store.json'
MESSAGES_STORE_PATH = _STORE_BASE / 'group_messages.json'


class GroupRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MODERATOR = "moderator"
    MEMBER = "member"


@dataclass
class GroupMember:
    """عضو في المجموعة"""
    username: str
    role: GroupRole
    joined_at: str
    is_muted: bool = False
    muted_until: str | None = None
    avatar_url: str = ""
    display_name: str = ""


@dataclass
class GroupInvite:
    """دعوة المجموعة"""
    id: str
    group_id: str
    inviter: str
    invitee: str
    status: str
    created_at: str


@dataclass
class GroupMessage:
    """رسالة المجموعة"""
    id: str
    group_id: str
    sender_username: str
    sender_avatar: str = ""
    sender_display_name: str = ""
    content: str = ""
    message_type: str = "text"  # text, image, video, file, etc.
    attachments: List[Dict] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    edited_at: str | None = None
    is_edited: bool = False
    is_deleted: bool = False
    reply_to: str | None = None  # معرّف الرسالة المرد عليها
    reactions: Dict[str, List[str]] = field(default_factory=dict)  # {emoji: [usernames]}
    seen_by: List[str] = field(default_factory=list)  # قائمة المستخدمين الذين قرأوا الرسالة


@dataclass
class GroupItem:
    """مجموعة"""
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
    image_url: str = ""
    cover_image_url: str = ""
    category: str = ""
    is_verified: bool = False
    # v88.46 — تجميد المجموعة إدارياً بواسطة المدير العام
    is_frozen: bool = False
    frozen_at: str | None = None
    frozen_by: str | None = None            # username المدير الذي جمّد
    frozen_reason: str | None = None


class GroupStore:
    """متجر المجموعات مع دعم الرسائل والتفاعلات"""
    
    def __init__(self) -> None:
        self._groups: dict[str, GroupItem] = {}
        self._messages: dict[str, List[GroupMessage]] = {}  # {group_id: [messages]}
        self._next_id = 1
        self._load()

    # ============ عمليات المجموعات ============

    def create_group(
        self, 
        owner_username: str, 
        name: str, 
        description: str = '', 
        members: list[str] | None = None,
        category: str = "",
        image_url: str = "",
        cover_image_url: str = ""
    ) -> dict:
        """إنشاء مجموعة جديدة"""
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
        self._messages[group_id] = []
        self._add_audit_log(group_id, owner_username, "create_group", f"Group '{group.name}' created")
        self._save()
        return self.serialize_group(group)

    def _add_audit_log(self, group_id: str, actor: str, action: str, description: str):
        """إضافة سجل تدقيق"""
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
        """جلب قائمة المجموعات"""
        groups = sorted(self._groups.values(), key=lambda item: item.created_at, reverse=True)
        return [self.serialize_group(item) for item in groups]

    def get_group(self, group_id: str) -> GroupItem | None:
        """جلب تفاصيل مجموعة"""
        return self._groups.get(str(group_id))

    def update_group(
        self,
        group_id: str,
        actor: str,
        name: str | None = None,
        description: str | None = None,
        image_url: str | None = None,
        cover_image_url: str | None = None,
        category: str | None = None
    ) -> bool:
        """تحديث بيانات المجموعة"""
        group = self._groups.get(str(group_id))
        if not group:
            return False
        
        # التحقق من الأذونات
        member = group.members.get(actor)
        if not member or member.role not in [GroupRole.OWNER, GroupRole.ADMIN]:
            return False
        
        if name:
            group.name = name
        if description is not None:
            group.description = description
        if image_url:
            group.image_url = image_url
        if cover_image_url:
            group.cover_image_url = cover_image_url
        if category:
            group.category = category
        
        self._add_audit_log(group_id, actor, "update_group", f"Group updated")
        self._save()
        return True

    def delete_group(self, group_id: str, actor: str) -> bool:
        """حذف مجموعة"""
        group = self._groups.get(str(group_id))
        if not group:
            return False
        
        # التحقق من الأذونات
        member = group.members.get(actor)
        if not member or member.role != GroupRole.OWNER:
            return False
        
        del self._groups[str(group_id)]
        if str(group_id) in self._messages:
            del self._messages[str(group_id)]
        
        self._save()
        return True

    def join_group(self, group_id: str, username: str) -> dict | None:
        """الانضمام للمجموعة"""
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

    def leave_group(self, group_id: str, username: str) -> bool:
        """مغادرة المجموعة"""
        group = self._groups.get(str(group_id))
        if not group:
            return False
        
        member = group.members.get(username)
        if not member:
            return False
        
        # لا يمكن للمالك مغادرة المجموعة
        if member.role == GroupRole.OWNER:
            return False
        
        del group.members[username]
        self._add_audit_log(group_id, username, "leave", f"{username} left the group")
        self._save()
        return True

    def get_members(self, group_id: str) -> list[dict]:
        """جلب أعضاء المجموعة"""
        group = self._groups.get(str(group_id))
        if not group:
            return []
        
        return [
            {
                'username': member.username,
                'role': member.role.value if isinstance(member.role, GroupRole) else str(member.role),
                'joined_at': member.joined_at,
                'is_muted': bool(member.is_muted),
                'muted_until': member.muted_until,
                'avatar_url': member.avatar_url,
                'display_name': member.display_name,
            }
            for member in group.members.values()
        ]

    def update_member_role(self, group_id: str, actor: str, target_username: str, new_role: GroupRole) -> bool:
        """تحديث دور العضو"""
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
        """دعوة عضو"""
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
        """تطبيق إجراء تعديل على عضو"""
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

    # ============ عمليات الرسائل ============

    def send_message(
        self,
        group_id: str,
        sender_username: str,
        content: str,
        message_type: str = "text",
        sender_avatar: str = "",
        sender_display_name: str = "",
        attachments: list | None = None,
        reply_to: str | None = None
    ) -> dict | None:
        """إرسال رسالة إلى المجموعة"""
        group = self._groups.get(str(group_id))
        if not group:
            return None

        # v88.46 — منع الإرسال في المجموعات المُجمّدة إدارياً
        if group.is_frozen:
            return None

        # التحقق من أن المستخدم عضو في المجموعة
        member = group.members.get(sender_username)
        if not member:
            return None
        
        # التحقق من عدم كتم صوت المستخدم
        if member.is_muted:
            return None

        # v88.46 (point 6) — فاحص محتوى موحّد (لغة مسيئة + عنف + وسائط مشبوهة)
        try:
            from app.core.content_scanner import scan_content as _cc_scan
            _scan = _cc_scan(text=content or None, attachments=attachments)
            if _scan.is_blocked:
                # نسجّل في audit ونرفض الإرسال بصمت (return None يتوافق مع باقي المسار)
                self._add_audit_log(
                    group_id,
                    sender_username,
                    "content_blocked",
                    f"Blocked message (score={_scan.score}, cats={sorted(_scan.categories)})",
                )
                self._save()
                return None
        except Exception:
            # فاحص المحتوى اختياري — لا نُعطّل الإرسال لو انهار الفاحص
            _scan = None

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
        
        # v88.46 (point 6) — ختم الرسالة بنتيجة الفحص لو flagged (للأدمن)
        try:
            if _scan is not None and _scan.is_flagged:
                message.attachments = list(message.attachments or [])
                # لا نغيّر الشكل العام؛ نستخدم حقل نصّي واحد ضمن الرسالة نفسها
                setattr(message, '_scan_score', int(_scan.score))
                setattr(message, '_scan_categories', sorted(_scan.categories))
        except Exception:
            pass

        self._messages[str(group_id)].append(message)
        self._save()
        
        return self.serialize_message(message)

    def get_messages(
        self,
        group_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> list[dict]:
        """جلب رسائل المجموعة"""
        messages = self._messages.get(str(group_id), [])
        # تصفية الرسائل المحذوفة
        active_messages = [m for m in messages if not m.is_deleted]
        # ترتيب تنازلي حسب التاريخ
        sorted_messages = sorted(active_messages, key=lambda m: m.created_at, reverse=True)
        # تطبيق التصفح
        paginated = sorted_messages[offset:offset + limit]
        return [self.serialize_message(m) for m in paginated]

    def delete_message(self, group_id: str, message_id: str, actor: str) -> bool:
        """حذف رسالة"""
        messages = self._messages.get(str(group_id), [])
        group = self._groups.get(str(group_id))
        
        if not group:
            return False
        
        actor_member = group.members.get(actor)
        if not actor_member:
            return False
        
        for message in messages:
            if message.id == message_id:
                # التحقق من الأذونات
                if message.sender_username != actor and actor_member.role not in [GroupRole.OWNER, GroupRole.ADMIN, GroupRole.MODERATOR]:
                    return False
                
                message.is_deleted = True
                self._add_audit_log(group_id, actor, "delete_message", f"Deleted message {message_id}")
                self._save()
                return True
        
        return False

    # ============================================================
    # v88.46 — دوال إدارية خارقة للمدير العام (Super Admin Actions)
    # ------------------------------------------------------------
    # هذه الدوال لا تشترط أن يكون المدير عضواً في المجموعة،
    # ولا تحترم أدوار المجموعة (owner/admin/moderator).
    # يجب أن يتم التحقق من صلاحية المدير العام في طبقة الـ router
    # قبل استدعاء أيّ من هذه الدوال.
    # ============================================================

    def freeze_group(
        self,
        group_id: str,
        admin_username: str,
        reason: str = "",
        frozen: bool = True,
    ) -> dict | None:
        """تجميد / فكّ تجميد مجموعة كاملة بواسطة المدير العام.

        - عند التجميد: تُمنع كل الرسائل / الدعوات / المنشورات داخل المجموعة
          (يعتمد التطبيق على قراءة `is_frozen` في نقاط الإدخال).
        - لا يحتاج المدير أن يكون عضواً بالمجموعة.
        """
        group = self._groups.get(str(group_id))
        if group is None:
            return None
        group.is_frozen = bool(frozen)
        group.frozen_at = datetime.utcnow().isoformat() if frozen else None
        group.frozen_by = admin_username if frozen else None
        group.frozen_reason = (reason or "").strip() if frozen else None
        action = "admin_freeze_group" if frozen else "admin_unfreeze_group"
        description = (
            f"Group frozen by super-admin {admin_username}: {reason}"
            if frozen
            else f"Group unfrozen by super-admin {admin_username}"
        )
        self._add_audit_log(group_id, admin_username, action, description)
        self._save()
        return {
            "group_id": group.id,
            "is_frozen": group.is_frozen,
            "frozen_at": group.frozen_at,
            "frozen_by": group.frozen_by,
            "frozen_reason": group.frozen_reason,
        }

    def admin_delete_message(
        self,
        group_id: str,
        message_id: str,
        admin_username: str,
        reason: str = "",
    ) -> bool:
        """حذف رسالة داخل أيّ مجموعة بواسطة المدير العام (تجاوز أدوار المجموعة).

        يعمل حتى لو لم يكن المدير عضواً بالمجموعة.
        """
        group = self._groups.get(str(group_id))
        if group is None:
            return False
        messages = self._messages.get(str(group_id), [])
        for message in messages:
            if message.id == message_id:
                message.is_deleted = True
                self._add_audit_log(
                    group_id,
                    admin_username,
                    "admin_delete_message",
                    f"Super-admin {admin_username} deleted message {message_id}"
                    + (f" — reason: {reason}" if reason else ""),
                )
                self._save()
                return True
        return False

    def admin_delete_group(
        self,
        group_id: str,
        admin_username: str,
        reason: str = "",
    ) -> bool:
        """حذف مجموعة كاملة بواسطة المدير العام (تجاوز شرط الملكية)."""
        group = self._groups.get(str(group_id))
        if group is None:
            return False
        # سجّل الحدث قبل الحذف الكامل حتى يبقى أثر
        self._add_audit_log(
            group_id,
            admin_username,
            "admin_delete_group",
            f"Super-admin {admin_username} deleted group '{group.name}'"
            + (f" — reason: {reason}" if reason else ""),
        )
        del self._groups[str(group_id)]
        if str(group_id) in self._messages:
            del self._messages[str(group_id)]
        self._save()
        return True

    def admin_mute_group_member(
        self,
        group_id: str,
        target_username: str,
        admin_username: str,
        muted: bool = True,
        reason: str = "",
    ) -> bool:
        """كتم / فكّ كتم عضو داخل مجموعة معيّنة بواسطة المدير العام.

        لا يشترط أن يكون المدير عضواً بالمجموعة، ولا يحترم أدوار المجموعة.
        """
        group = self._groups.get(str(group_id))
        if group is None:
            return False
        target = group.members.get(target_username)
        if target is None:
            return False
        target.is_muted = bool(muted)
        target.muted_until = "admin_indefinite" if muted else None
        action = "admin_mute_member" if muted else "admin_unmute_member"
        description = (
            f"Super-admin {admin_username} muted {target_username}"
            if muted
            else f"Super-admin {admin_username} unmuted {target_username}"
        )
        if reason:
            description += f" — reason: {reason}"
        self._add_audit_log(group_id, admin_username, action, description)
        self._save()
        return True

    def admin_mute_user_system_wide(
        self,
        target_username: str,
        admin_username: str,
        duration_minutes: int | None = None,
        reason: str = "",
        muted: bool = True,
    ) -> dict:
        """كتم مستخدم عن الشات على مستوى النظام (بغض النظر عن أي مجموعة).

        هذه العملية تُطبّق كتماً فورياً داخل كل المجموعات التي فيها
        هذا المستخدم في متجر المجموعات. تحديث `User.chat_muted_until`
        في قاعدة البيانات يتم في طبقة الـ router.
        """
        affected_groups: list[str] = []
        for group in self._groups.values():
            member = group.members.get(target_username)
            if member is None:
                continue
            member.is_muted = bool(muted)
            member.muted_until = (
                f"system_wide:{duration_minutes}m" if (muted and duration_minutes) else
                ("system_wide" if muted else None)
            )
            affected_groups.append(group.id)
            self._add_audit_log(
                group.id,
                admin_username,
                "admin_mute_user_system_wide" if muted else "admin_unmute_user_system_wide",
                (
                    f"Super-admin {admin_username} "
                    f"{'muted' if muted else 'unmuted'} {target_username} "
                    f"system-wide"
                    + (f" for {duration_minutes}m" if (muted and duration_minutes) else "")
                    + (f" — reason: {reason}" if reason else "")
                ),
            )
        self._save()
        return {
            "target_username": target_username,
            "muted": bool(muted),
            "duration_minutes": duration_minutes,
            "reason": reason,
            "affected_groups": affected_groups,
            "affected_groups_count": len(affected_groups),
        }

    def is_group_frozen(self, group_id: str) -> bool:
        """فحص سريع لحالة تجميد المجموعة (يُستخدم في نقاط الإدخال)."""
        group = self._groups.get(str(group_id))
        return bool(group and group.is_frozen)

    def edit_message(self, group_id: str, message_id: str, actor: str, new_content: str) -> bool:
        """تعديل رسالة"""
        messages = self._messages.get(str(group_id), [])
        
        for message in messages:
            if message.id == message_id:
                # التحقق من أن المرسل هو من يعدل الرسالة
                if message.sender_username != actor:
                    return False
                
                message.content = new_content
                message.is_edited = True
                message.edited_at = datetime.utcnow().isoformat()
                self._save()
                return True
        
        return False

    def add_reaction(self, group_id: str, message_id: str, username: str, emoji: str) -> bool:
        """إضافة تفاعل على رسالة"""
        messages = self._messages.get(str(group_id), [])
        
        for message in messages:
            if message.id == message_id:
                if emoji not in message.reactions:
                    message.reactions[emoji] = []
                if username not in message.reactions[emoji]:
                    message.reactions[emoji].append(username)
                self._save()
                return True
        
        return False

    def remove_reaction(self, group_id: str, message_id: str, username: str, emoji: str) -> bool:
        """إزالة تفاعل من رسالة"""
        messages = self._messages.get(str(group_id), [])
        
        for message in messages:
            if message.id == message_id:
                if emoji in message.reactions and username in message.reactions[emoji]:
                    message.reactions[emoji].remove(username)
                    if not message.reactions[emoji]:
                        del message.reactions[emoji]
                    self._save()
                    return True
        
        return False

    def mark_message_seen(self, group_id: str, message_id: str, username: str) -> bool:
        """تحديد الرسالة كمقروءة"""
        messages = self._messages.get(str(group_id), [])
        
        for message in messages:
            if message.id == message_id:
                if username not in message.seen_by:
                    message.seen_by.append(username)
                    self._save()
                return True
        
        return False

    # ============ عمليات التسلسل والحفظ ============

    def serialize_group(self, item: GroupItem) -> dict:
        """تسلسل المجموعة للاستجابة"""
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
            # v88.46 — كشف حالة التجميد الإداري في الاستجابة
            'is_frozen': bool(item.is_frozen),
            'frozen_at': item.frozen_at,
            'frozen_by': item.frozen_by,
            'frozen_reason': item.frozen_reason,
            'members': [
                {
                    'username': member.username,
                    'role': member.role.value if isinstance(member.role, GroupRole) else str(member.role),
                    'joined_at': member.joined_at,
                    'is_muted': bool(member.is_muted),
                    'muted_until': member.muted_until,
                    'avatar_url': member.avatar_url,
                    'display_name': member.display_name,
                }
                for member in item.members.values()
            ],
            'members_count': len(item.members),
            'settings': item.settings,
            'audit_logs_preview': item.audit_logs[-10:],
        }

    def serialize_message(self, message: GroupMessage) -> dict:
        """تسلسل الرسالة للاستجابة"""
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
            'reply_to': message.reply_to,
            'reactions': message.reactions,
            'seen_by': message.seen_by,
            'seen_count': len(message.seen_by),
        }

    def _serialize_store(self) -> dict:
        """تسلسل المتجر للحفظ"""
        return {
            'next_id': self._next_id,
            'groups': [
                {
                    'id': group.id,
                    'name': group.name,
                    'description': group.description,
                    'owner_username': group.owner_username,
                    'created_at': group.created_at,
                    'image_url': group.image_url,
                    'cover_image_url': group.cover_image_url,
                    'category': group.category,
                    'is_verified': group.is_verified,
                    'is_frozen': bool(group.is_frozen),
                    'frozen_at': group.frozen_at,
                    'frozen_by': group.frozen_by,
                    'frozen_reason': group.frozen_reason,
                    'members': {
                        username: {
                            'username': member.username,
                            'role': member.role.value if isinstance(member.role, GroupRole) else str(member.role),
                            'joined_at': member.joined_at,
                            'is_muted': member.is_muted,
                            'muted_until': member.muted_until,
                            'avatar_url': member.avatar_url,
                            'display_name': member.display_name,
                        }
                        for username, member in group.members.items()
                    },
                    'invites': [asdict(invite) for invite in group.invites],
                    'audit_logs': group.audit_logs,
                    'settings': group.settings,
                }
                for group in self._groups.values()
            ],
            'messages': {
                group_id: [
                    {
                        'id': msg.id,
                        'group_id': msg.group_id,
                        'sender_username': msg.sender_username,
                        'sender_avatar': msg.sender_avatar,
                        'sender_display_name': msg.sender_display_name,
                        'content': msg.content,
                        'message_type': msg.message_type,
                        'attachments': msg.attachments,
                        'created_at': msg.created_at,
                        'edited_at': msg.edited_at,
                        'is_edited': msg.is_edited,
                        'is_deleted': msg.is_deleted,
                        'reply_to': msg.reply_to,
                        'reactions': msg.reactions,
                        'seen_by': msg.seen_by,
                    }
                    for msg in messages
                ]
                for group_id, messages in self._messages.items()
            }
        }

    def _load(self) -> None:
        """تحميل البيانات من الملف"""
        try:
            GROUP_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
            if not GROUP_STORE_PATH.exists():
                return
            payload = json.loads(GROUP_STORE_PATH.read_text(encoding='utf-8') or '{}')
            self._next_id = max(int(payload.get('next_id') or 1), 1)
            
            # تحميل المجموعات
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
                        avatar_url=str(member.get('avatar_url') or ''),
                        display_name=str(member.get('display_name') or ''),
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
                    image_url=str(raw.get('image_url') or ''),
                    cover_image_url=str(raw.get('cover_image_url') or ''),
                    category=str(raw.get('category') or ''),
                    is_verified=bool(raw.get('is_verified', False)),
                    is_frozen=bool(raw.get('is_frozen', False)),
                    frozen_at=(str(raw.get('frozen_at')) if raw.get('frozen_at') else None),
                    frozen_by=(str(raw.get('frozen_by')) if raw.get('frozen_by') else None),
                    frozen_reason=(str(raw.get('frozen_reason')) if raw.get('frozen_reason') else None),
                )
                if item.id:
                    restored[item.id] = item
            self._groups = restored
            
            # تحميل الرسائل
            for group_id, messages_data in payload.get('messages', {}).items():
                if not isinstance(messages_data, list):
                    continue
                messages = []
                for msg_data in messages_data:
                    if not isinstance(msg_data, dict):
                        continue
                    message = GroupMessage(
                        id=str(msg_data.get('id') or ''),
                        group_id=str(msg_data.get('group_id') or ''),
                        sender_username=str(msg_data.get('sender_username') or ''),
                        sender_avatar=str(msg_data.get('sender_avatar') or ''),
                        sender_display_name=str(msg_data.get('sender_display_name') or ''),
                        content=str(msg_data.get('content') or ''),
                        message_type=str(msg_data.get('message_type') or 'text'),
                        attachments=msg_data.get('attachments') or [],
                        created_at=str(msg_data.get('created_at') or datetime.utcnow().isoformat()),
                        edited_at=msg_data.get('edited_at'),
                        is_edited=bool(msg_data.get('is_edited', False)),
                        is_deleted=bool(msg_data.get('is_deleted', False)),
                        reply_to=msg_data.get('reply_to'),
                        reactions=msg_data.get('reactions') or {},
                        seen_by=msg_data.get('seen_by') or [],
                    )
                    messages.append(message)
                self._messages[group_id] = messages
            
            if self._groups:
                self._next_id = max(self._next_id, max(int(group_id) for group_id in self._groups.keys() if group_id.isdigit()) + 1)
        except Exception as e:
            print(f"Error loading groups: {e}")
            self._groups = {}
            self._messages = {}
            self._next_id = 1

    def _save(self) -> None:
        """حفظ البيانات إلى الملف"""
        try:
            GROUP_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
            GROUP_STORE_PATH.write_text(
                json.dumps(self._serialize_store(), ensure_ascii=False, indent=2),
                encoding='utf-8'
            )
        except Exception as e:
            print(f"Error saving groups: {e}")


group_store = GroupStore()
