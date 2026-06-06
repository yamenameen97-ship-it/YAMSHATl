"""خدمة المجموعات المتقدمة - Enhanced Group Service
يوفر:
- إنشاء وتعديل وحذف المجموعات
- إدارة الأدوار والأذونات
- نظام الدعوات والطلبات
- إدارة الأعضاء والحظر والكتم
- الرسائل المجدولة والمثبتة
- البحث والتحليلات
- نظام القواعد والهاشتاجات
- الأحداث والاستطلاعات
- الإشعارات والإعلانات
"""

from fastapi import FastAPI, WebSocket, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Set
from dataclasses import dataclass, asdict, field
from enum import Enum
import logging
import uuid
from collections import defaultdict

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Yamshat Enhanced Group Service",
    description="خدمة المجموعات المتقدمة مع إدارة الأدوار والأذونات",
    version="2.0.0"
)

# إضافة CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ تعريفات الأنواع ============

class GroupRole(str, Enum):
    """أدوار المجموعة"""
    OWNER = "owner"
    ADMIN = "admin"
    MODERATOR = "moderator"
    MEMBER = "member"


class GroupPermission(str, Enum):
    """أذونات المجموعة"""
    MANAGE_MEMBERS = "manage_members"
    MANAGE_ROLES = "manage_roles"
    MANAGE_POSTS = "manage_posts"
    MANAGE_MEDIA = "manage_media"
    MANAGE_EVENTS = "manage_events"
    MANAGE_RULES = "manage_rules"
    SEND_MESSAGES = "send_messages"
    POST_CONTENT = "post_content"
    INVITE_MEMBERS = "invite_members"
    MODERATE_CONTENT = "moderate_content"


class JoinRequestStatus(str, Enum):
    """حالات طلبات الانضمام"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


@dataclass
class GroupMember:
    """عضو في المجموعة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    user_name: str = ""
    user_avatar: str = ""
    role: GroupRole = GroupRole.MEMBER
    permissions: List[GroupPermission] = field(default_factory=list)
    joined_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    is_muted: bool = False
    is_banned: bool = False
    is_online: bool = False


@dataclass
class GroupInvitation:
    """دعوة المجموعة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    group_id: str = ""
    inviter_id: str = ""
    invitee_id: str = ""
    invitee_name: str = ""
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    is_accepted: bool = False


@dataclass
class JoinRequest:
    """طلب الانضمام إلى المجموعة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    group_id: str = ""
    user_id: str = ""
    user_name: str = ""
    user_avatar: str = ""
    status: JoinRequestStatus = JoinRequestStatus.PENDING
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    reviewed_at: Optional[str] = None


@dataclass
class GroupPost:
    """منشور في المجموعة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    group_id: str = ""
    author_id: str = ""
    author_name: str = ""
    author_avatar: str = ""
    content: str = ""
    media_urls: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    is_pinned: bool = False
    is_deleted: bool = False
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0


@dataclass
class GroupRule:
    """قاعدة المجموعة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    group_id: str = ""
    title: str = ""
    description: str = ""
    order: int = 0
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class GroupEvent:
    """حدث في المجموعة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    group_id: str = ""
    title: str = ""
    description: str = ""
    start_time: str = ""
    end_time: str = ""
    location: str = ""
    image_url: str = ""
    attendees_count: int = 0
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class GroupPoll:
    """استطلاع في المجموعة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    group_id: str = ""
    creator_id: str = ""
    question: str = ""
    options: List[str] = field(default_factory=list)
    votes: Dict[str, int] = field(default_factory=dict)
    end_time: str = ""
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class GroupAnnouncement:
    """إعلان في المجموعة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    group_id: str = ""
    creator_id: str = ""
    title: str = ""
    content: str = ""
    is_pinned: bool = False
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class Group:
    """مجموعة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    description: str = ""
    category: str = ""
    image_url: str = ""
    cover_image_url: str = ""
    is_public: bool = True
    is_verified: bool = False
    owner_id: str = ""
    members: List[GroupMember] = field(default_factory=list)
    invitations: List[GroupInvitation] = field(default_factory=list)
    join_requests: List[JoinRequest] = field(default_factory=list)
    posts: List[GroupPost] = field(default_factory=list)
    rules: List[GroupRule] = field(default_factory=list)
    events: List[GroupEvent] = field(default_factory=list)
    polls: List[GroupPoll] = field(default_factory=list)
    announcements: List[GroupAnnouncement] = field(default_factory=list)
    hashtags: List[str] = field(default_factory=list)
    members_count: int = 0
    posts_count: int = 0
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


# ============ مدير المجموعات ============

class EnhancedGroupManager:
    """مدير المجموعات المتقدم"""

    def __init__(self):
        # المجموعات
        self.groups: Dict[str, Group] = {}
        
        # الاتصالات النشطة
        self.active_connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        
        # سجل المجموعات
        self.group_history: List[Group] = []

    async def create_group(
        self,
        name: str,
        description: str,
        category: str,
        owner_id: str,
        owner_name: str,
        owner_avatar: str = "",
        is_public: bool = True
    ) -> Group:
        """إنشاء مجموعة جديدة"""
        group = Group(
            name=name,
            description=description,
            category=category,
            is_public=is_public,
            owner_id=owner_id
        )

        # إضافة المالك كعضو
        owner = GroupMember(
            user_id=owner_id,
            user_name=owner_name,
            user_avatar=owner_avatar,
            role=GroupRole.OWNER,
            permissions=[
                GroupPermission.MANAGE_MEMBERS,
                GroupPermission.MANAGE_ROLES,
                GroupPermission.MANAGE_POSTS,
                GroupPermission.MANAGE_MEDIA,
                GroupPermission.MANAGE_EVENTS,
                GroupPermission.MANAGE_RULES,
                GroupPermission.SEND_MESSAGES,
                GroupPermission.POST_CONTENT,
                GroupPermission.INVITE_MEMBERS,
                GroupPermission.MODERATE_CONTENT
            ]
        )
        group.members.append(owner)
        group.members_count = 1

        self.groups[group.id] = group
        self.active_connections[group.id] = set()
        
        logger.info(f"✅ Group created: {group.id} (Name: {name})")
        return group

    async def update_group(
        self,
        group_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        category: Optional[str] = None,
        image_url: Optional[str] = None,
        cover_image_url: Optional[str] = None,
        is_public: Optional[bool] = None
    ) -> bool:
        """تحديث بيانات المجموعة"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]
        if name:
            group.name = name
        if description:
            group.description = description
        if category:
            group.category = category
        if image_url:
            group.image_url = image_url
        if cover_image_url:
            group.cover_image_url = cover_image_url
        if is_public is not None:
            group.is_public = is_public
        
        group.updated_at = datetime.utcnow().isoformat()

        await self.broadcast(group_id, {
            "type": "group_updated",
            "data": asdict(group)
        })
        logger.info(f"✅ Group updated: {group_id}")
        return True

    async def delete_group(self, group_id: str) -> bool:
        """حذف مجموعة"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]
        self.group_history.append(group)
        del self.groups[group_id]

        await self.broadcast(group_id, {
            "type": "group_deleted",
            "data": {"group_id": group_id}
        })
        logger.info(f"✅ Group deleted: {group_id}")
        return True

    async def add_member(
        self,
        group_id: str,
        user_id: str,
        user_name: str,
        user_avatar: str = ""
    ) -> bool:
        """إضافة عضو إلى المجموعة"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]

        # التحقق من عدم وجود العضو بالفعل
        if any(m.user_id == user_id for m in group.members):
            return False

        member = GroupMember(
            user_id=user_id,
            user_name=user_name,
            user_avatar=user_avatar,
            role=GroupRole.MEMBER,
            permissions=[
                GroupPermission.SEND_MESSAGES,
                GroupPermission.POST_CONTENT,
                GroupPermission.INVITE_MEMBERS
            ]
        )
        group.members.append(member)
        group.members_count += 1

        await self.broadcast(group_id, {
            "type": "member_joined",
            "data": asdict(member)
        })
        logger.info(f"✅ Member {user_id} joined group {group_id}")
        return True

    async def remove_member(self, group_id: str, user_id: str) -> bool:
        """إزالة عضو من المجموعة"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]
        for i, member in enumerate(group.members):
            if member.user_id == user_id:
                group.members.pop(i)
                group.members_count -= 1

                await self.broadcast(group_id, {
                    "type": "member_left",
                    "data": {"user_id": user_id}
                })
                logger.info(f"✅ Member {user_id} left group {group_id}")
                return True
        return False

    async def set_member_role(
        self,
        group_id: str,
        user_id: str,
        role: GroupRole
    ) -> bool:
        """تعيين دور العضو"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]
        for member in group.members:
            if member.user_id == user_id:
                member.role = role
                
                # تحديث الأذونات بناءً على الدور
                if role == GroupRole.OWNER:
                    member.permissions = [p for p in GroupPermission]
                elif role == GroupRole.ADMIN:
                    member.permissions = [
                        GroupPermission.MANAGE_MEMBERS,
                        GroupPermission.MANAGE_POSTS,
                        GroupPermission.MANAGE_MEDIA,
                        GroupPermission.SEND_MESSAGES,
                        GroupPermission.POST_CONTENT,
                        GroupPermission.MODERATE_CONTENT
                    ]
                elif role == GroupRole.MODERATOR:
                    member.permissions = [
                        GroupPermission.MANAGE_POSTS,
                        GroupPermission.SEND_MESSAGES,
                        GroupPermission.POST_CONTENT,
                        GroupPermission.MODERATE_CONTENT
                    ]
                else:
                    member.permissions = [
                        GroupPermission.SEND_MESSAGES,
                        GroupPermission.POST_CONTENT,
                        GroupPermission.INVITE_MEMBERS
                    ]

                await self.broadcast(group_id, {
                    "type": "member_role_changed",
                    "data": asdict(member)
                })
                logger.info(f"✅ Member {user_id} role changed to {role}")
                return True
        return False

    async def mute_member(self, group_id: str, user_id: str, is_muted: bool) -> bool:
        """كتم صوت العضو"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]
        for member in group.members:
            if member.user_id == user_id:
                member.is_muted = is_muted
                await self.broadcast(group_id, {
                    "type": "member_muted",
                    "data": {
                        "user_id": user_id,
                        "is_muted": is_muted
                    }
                })
                return True
        return False

    async def ban_member(self, group_id: str, user_id: str, is_banned: bool) -> bool:
        """حظر العضو"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]
        for member in group.members:
            if member.user_id == user_id:
                member.is_banned = is_banned
                await self.broadcast(group_id, {
                    "type": "member_banned",
                    "data": {
                        "user_id": user_id,
                        "is_banned": is_banned
                    }
                })
                return True
        return False

    async def send_invitation(
        self,
        group_id: str,
        inviter_id: str,
        invitee_id: str,
        invitee_name: str
    ) -> bool:
        """إرسال دعوة"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]
        invitation = GroupInvitation(
            group_id=group_id,
            inviter_id=inviter_id,
            invitee_id=invitee_id,
            invitee_name=invitee_name
        )
        group.invitations.append(invitation)

        await self.broadcast(group_id, {
            "type": "invitation_sent",
            "data": asdict(invitation)
        })
        logger.info(f"✅ Invitation sent to {invitee_id}")
        return True

    async def accept_invitation(self, group_id: str, invitation_id: str, user_id: str, user_name: str, user_avatar: str) -> bool:
        """قبول الدعوة"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]
        for invitation in group.invitations:
            if invitation.id == invitation_id:
                invitation.is_accepted = True
                await self.add_member(group_id, user_id, user_name, user_avatar)
                logger.info(f"✅ Invitation {invitation_id} accepted")
                return True
        return False

    async def create_join_request(
        self,
        group_id: str,
        user_id: str,
        user_name: str,
        user_avatar: str = ""
    ) -> bool:
        """إنشاء طلب انضمام"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]
        request = JoinRequest(
            group_id=group_id,
            user_id=user_id,
            user_name=user_name,
            user_avatar=user_avatar
        )
        group.join_requests.append(request)

        await self.broadcast(group_id, {
            "type": "join_request_created",
            "data": asdict(request)
        })
        logger.info(f"✅ Join request created from {user_id}")
        return True

    async def approve_join_request(self, group_id: str, request_id: str) -> bool:
        """الموافقة على طلب الانضمام"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]
        for request in group.join_requests:
            if request.id == request_id:
                request.status = JoinRequestStatus.APPROVED
                request.reviewed_at = datetime.utcnow().isoformat()
                
                await self.add_member(
                    group_id,
                    request.user_id,
                    request.user_name,
                    request.user_avatar
                )
                logger.info(f"✅ Join request {request_id} approved")
                return True
        return False

    async def reject_join_request(self, group_id: str, request_id: str) -> bool:
        """رفض طلب الانضمام"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]
        for request in group.join_requests:
            if request.id == request_id:
                request.status = JoinRequestStatus.REJECTED
                request.reviewed_at = datetime.utcnow().isoformat()
                
                await self.broadcast(group_id, {
                    "type": "join_request_rejected",
                    "data": asdict(request)
                })
                logger.info(f"✅ Join request {request_id} rejected")
                return True
        return False

    async def create_post(
        self,
        group_id: str,
        author_id: str,
        author_name: str,
        author_avatar: str,
        content: str,
        media_urls: List[str] = []
    ) -> bool:
        """إنشاء منشور في المجموعة"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]
        post = GroupPost(
            group_id=group_id,
            author_id=author_id,
            author_name=author_name,
            author_avatar=author_avatar,
            content=content,
            media_urls=media_urls
        )
        group.posts.append(post)
        group.posts_count += 1

        await self.broadcast(group_id, {
            "type": "post_created",
            "data": asdict(post)
        })
        logger.info(f"✅ Post created in group {group_id}")
        return True

    async def delete_post(self, group_id: str, post_id: str) -> bool:
        """حذف منشور"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]
        for post in group.posts:
            if post.id == post_id:
                post.is_deleted = True
                await self.broadcast(group_id, {
                    "type": "post_deleted",
                    "data": {"post_id": post_id}
                })
                logger.info(f"✅ Post {post_id} deleted")
                return True
        return False

    async def pin_post(self, group_id: str, post_id: str, is_pinned: bool) -> bool:
        """تثبيت/فك تثبيت منشور"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]
        for post in group.posts:
            if post.id == post_id:
                post.is_pinned = is_pinned
                await self.broadcast(group_id, {
                    "type": "post_pinned",
                    "data": asdict(post)
                })
                return True
        return False

    async def create_rule(
        self,
        group_id: str,
        title: str,
        description: str,
        order: int = 0
    ) -> bool:
        """إنشاء قاعدة"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]
        rule = GroupRule(
            group_id=group_id,
            title=title,
            description=description,
            order=order
        )
        group.rules.append(rule)

        await self.broadcast(group_id, {
            "type": "rule_created",
            "data": asdict(rule)
        })
        logger.info(f"✅ Rule created in group {group_id}")
        return True

    async def create_event(
        self,
        group_id: str,
        title: str,
        description: str,
        start_time: str,
        end_time: str,
        location: str = "",
        image_url: str = ""
    ) -> bool:
        """إنشاء حدث"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]
        event = GroupEvent(
            group_id=group_id,
            title=title,
            description=description,
            start_time=start_time,
            end_time=end_time,
            location=location,
            image_url=image_url
        )
        group.events.append(event)

        await self.broadcast(group_id, {
            "type": "event_created",
            "data": asdict(event)
        })
        logger.info(f"✅ Event created in group {group_id}")
        return True

    async def create_poll(
        self,
        group_id: str,
        creator_id: str,
        question: str,
        options: List[str],
        end_time: str
    ) -> bool:
        """إنشاء استطلاع"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]
        poll = GroupPoll(
            group_id=group_id,
            creator_id=creator_id,
            question=question,
            options=options,
            end_time=end_time,
            votes={option: 0 for option in options}
        )
        group.polls.append(poll)

        await self.broadcast(group_id, {
            "type": "poll_created",
            "data": asdict(poll)
        })
        logger.info(f"✅ Poll created in group {group_id}")
        return True

    async def vote_in_poll(self, group_id: str, poll_id: str, option: str) -> bool:
        """التصويت في استطلاع"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]
        for poll in group.polls:
            if poll.id == poll_id and option in poll.votes:
                poll.votes[option] += 1
                await self.broadcast(group_id, {
                    "type": "poll_voted",
                    "data": asdict(poll)
                })
                return True
        return False

    async def create_announcement(
        self,
        group_id: str,
        creator_id: str,
        title: str,
        content: str,
        is_pinned: bool = False
    ) -> bool:
        """إنشاء إعلان"""
        if group_id not in self.groups:
            return False

        group = self.groups[group_id]
        announcement = GroupAnnouncement(
            group_id=group_id,
            creator_id=creator_id,
            title=title,
            content=content,
            is_pinned=is_pinned
        )
        group.announcements.append(announcement)

        await self.broadcast(group_id, {
            "type": "announcement_created",
            "data": asdict(announcement)
        })
        logger.info(f"✅ Announcement created in group {group_id}")
        return True

    async def broadcast(self, group_id: str, message: dict):
        """بث رسالة إلى جميع الأعضاء"""
        if group_id in self.active_connections:
            for connection in self.active_connections[group_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"❌ Error broadcasting message: {str(e)}")

    async def connect(self, group_id: str, websocket: WebSocket):
        """الاتصال بالمجموعة"""
        await websocket.accept()
        self.active_connections[group_id].add(websocket)
        logger.info(f"✅ Client connected to group {group_id}")

    async def disconnect(self, group_id: str, websocket: WebSocket):
        """قطع الاتصال عن المجموعة"""
        self.active_connections[group_id].discard(websocket)
        logger.info(f"❌ Client disconnected from group {group_id}")

    def get_group(self, group_id: str) -> Optional[Group]:
        """الحصول على تفاصيل المجموعة"""
        return self.groups.get(group_id)

    def search_groups(self, query: str, limit: int = 50) -> List[Group]:
        """البحث عن المجموعات"""
        results = [
            group for group in self.groups.values()
            if query.lower() in group.name.lower() or
            query.lower() in group.description.lower()
        ]
        return results[:limit]


# ============ مثيل مدير المجموعات ============

group_manager = EnhancedGroupManager()


# ============ المسارات (Routes) ============

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "enhanced-group-service",
        "version": "2.0.0",
        "total_groups": len(group_manager.groups),
        "total_members": sum(g.members_count for g in group_manager.groups.values())
    }


@app.post("/groups")
async def create_group(
    name: str = Query(...),
    description: str = Query(...),
    category: str = Query(...),
    owner_id: str = Query(...),
    owner_name: str = Query(...),
    owner_avatar: str = Query(""),
    is_public: bool = Query(True)
):
    """إنشاء مجموعة جديدة"""
    try:
        group = await group_manager.create_group(
            name, description, category, owner_id, owner_name, owner_avatar, is_public
        )
        return {
            "success": True,
            "group_id": group.id,
            "group": asdict(group)
        }
    except Exception as e:
        logger.error(f"❌ Error creating group: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/groups/{group_id}")
async def get_group(group_id: str):
    """الحصول على تفاصيل المجموعة"""
    try:
        group = group_manager.get_group(group_id)
        if group:
            return {
                "success": True,
                "group": asdict(group)
            }
        else:
            raise HTTPException(status_code=404, detail="المجموعة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error getting group: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/groups/{group_id}")
async def update_group(
    group_id: str,
    name: Optional[str] = Query(None),
    description: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    image_url: Optional[str] = Query(None),
    cover_image_url: Optional[str] = Query(None),
    is_public: Optional[bool] = Query(None)
):
    """تحديث بيانات المجموعة"""
    try:
        if await group_manager.update_group(
            group_id, name, description, category, image_url, cover_image_url, is_public
        ):
            return {"success": True, "message": "تم تحديث المجموعة"}
        else:
            raise HTTPException(status_code=404, detail="المجموعة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error updating group: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/groups/{group_id}")
async def delete_group(group_id: str):
    """حذف مجموعة"""
    try:
        if await group_manager.delete_group(group_id):
            return {"success": True, "message": "تم حذف المجموعة"}
        else:
            raise HTTPException(status_code=404, detail="المجموعة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error deleting group: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/groups/{group_id}/members")
async def add_member(
    group_id: str,
    user_id: str = Query(...),
    user_name: str = Query(...),
    user_avatar: str = Query("")
):
    """إضافة عضو إلى المجموعة"""
    try:
        if await group_manager.add_member(group_id, user_id, user_name, user_avatar):
            return {"success": True, "message": "تم إضافة العضو"}
        else:
            raise HTTPException(status_code=400, detail="فشل إضافة العضو")
    except Exception as e:
        logger.error(f"❌ Error adding member: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/groups/{group_id}/members/{user_id}")
async def remove_member(group_id: str, user_id: str):
    """إزالة عضو من المجموعة"""
    try:
        if await group_manager.remove_member(group_id, user_id):
            return {"success": True, "message": "تم إزالة العضو"}
        else:
            raise HTTPException(status_code=404, detail="العضو غير موجود")
    except Exception as e:
        logger.error(f"❌ Error removing member: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/groups/{group_id}/members/{user_id}/role")
async def set_member_role(
    group_id: str,
    user_id: str,
    role: GroupRole = Query(...)
):
    """تعيين دور العضو"""
    try:
        if await group_manager.set_member_role(group_id, user_id, role):
            return {"success": True, "message": "تم تحديث الدور"}
        else:
            raise HTTPException(status_code=404, detail="العضو غير موجود")
    except Exception as e:
        logger.error(f"❌ Error setting member role: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/groups/{group_id}/members/{user_id}/mute")
async def mute_member(
    group_id: str,
    user_id: str,
    is_muted: bool = Query(...)
):
    """كتم صوت العضو"""
    try:
        if await group_manager.mute_member(group_id, user_id, is_muted):
            return {"success": True, "message": "تم تحديث حالة الكتم"}
        else:
            raise HTTPException(status_code=404, detail="العضو غير موجود")
    except Exception as e:
        logger.error(f"❌ Error muting member: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/groups/{group_id}/members/{user_id}/ban")
async def ban_member(
    group_id: str,
    user_id: str,
    is_banned: bool = Query(...)
):
    """حظر العضو"""
    try:
        if await group_manager.ban_member(group_id, user_id, is_banned):
            return {"success": True, "message": "تم تحديث حالة الحظر"}
        else:
            raise HTTPException(status_code=404, detail="العضو غير موجود")
    except Exception as e:
        logger.error(f"❌ Error banning member: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/groups/{group_id}/invitations")
async def send_invitation(
    group_id: str,
    inviter_id: str = Query(...),
    invitee_id: str = Query(...),
    invitee_name: str = Query(...)
):
    """إرسال دعوة"""
    try:
        if await group_manager.send_invitation(group_id, inviter_id, invitee_id, invitee_name):
            return {"success": True, "message": "تم إرسال الدعوة"}
        else:
            raise HTTPException(status_code=404, detail="المجموعة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error sending invitation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/groups/{group_id}/invitations/{invitation_id}/accept")
async def accept_invitation(
    group_id: str,
    invitation_id: str,
    user_id: str = Query(...),
    user_name: str = Query(...),
    user_avatar: str = Query("")
):
    """قبول الدعوة"""
    try:
        if await group_manager.accept_invitation(group_id, invitation_id, user_id, user_name, user_avatar):
            return {"success": True, "message": "تم قبول الدعوة"}
        else:
            raise HTTPException(status_code=404, detail="الدعوة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error accepting invitation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/groups/{group_id}/join-requests")
async def create_join_request(
    group_id: str,
    user_id: str = Query(...),
    user_name: str = Query(...),
    user_avatar: str = Query("")
):
    """إنشاء طلب انضمام"""
    try:
        if await group_manager.create_join_request(group_id, user_id, user_name, user_avatar):
            return {"success": True, "message": "تم إنشاء طلب الانضمام"}
        else:
            raise HTTPException(status_code=404, detail="المجموعة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error creating join request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/groups/{group_id}/join-requests/{request_id}/approve")
async def approve_join_request(group_id: str, request_id: str):
    """الموافقة على طلب الانضمام"""
    try:
        if await group_manager.approve_join_request(group_id, request_id):
            return {"success": True, "message": "تم الموافقة على الطلب"}
        else:
            raise HTTPException(status_code=404, detail="الطلب غير موجود")
    except Exception as e:
        logger.error(f"❌ Error approving join request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/groups/{group_id}/join-requests/{request_id}/reject")
async def reject_join_request(group_id: str, request_id: str):
    """رفض طلب الانضمام"""
    try:
        if await group_manager.reject_join_request(group_id, request_id):
            return {"success": True, "message": "تم رفض الطلب"}
        else:
            raise HTTPException(status_code=404, detail="الطلب غير موجود")
    except Exception as e:
        logger.error(f"❌ Error rejecting join request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/groups/{group_id}/posts")
async def create_post(
    group_id: str,
    author_id: str = Query(...),
    author_name: str = Query(...),
    author_avatar: str = Query(""),
    content: str = Query(...),
    media_urls: List[str] = Query([])
):
    """إنشاء منشور في المجموعة"""
    try:
        if await group_manager.create_post(group_id, author_id, author_name, author_avatar, content, media_urls):
            return {"success": True, "message": "تم إنشاء المنشور"}
        else:
            raise HTTPException(status_code=404, detail="المجموعة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error creating post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/groups/{group_id}/posts/{post_id}")
async def delete_post(group_id: str, post_id: str):
    """حذف منشور"""
    try:
        if await group_manager.delete_post(group_id, post_id):
            return {"success": True, "message": "تم حذف المنشور"}
        else:
            raise HTTPException(status_code=404, detail="المنشور غير موجود")
    except Exception as e:
        logger.error(f"❌ Error deleting post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/groups/{group_id}/posts/{post_id}/pin")
async def pin_post(
    group_id: str,
    post_id: str,
    is_pinned: bool = Query(...)
):
    """تثبيت/فك تثبيت منشور"""
    try:
        if await group_manager.pin_post(group_id, post_id, is_pinned):
            return {"success": True, "message": "تم تحديث حالة التثبيت"}
        else:
            raise HTTPException(status_code=404, detail="المنشور غير موجود")
    except Exception as e:
        logger.error(f"❌ Error pinning post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/groups/{group_id}/rules")
async def create_rule(
    group_id: str,
    title: str = Query(...),
    description: str = Query(...),
    order: int = Query(0)
):
    """إنشاء قاعدة"""
    try:
        if await group_manager.create_rule(group_id, title, description, order):
            return {"success": True, "message": "تم إنشاء القاعدة"}
        else:
            raise HTTPException(status_code=404, detail="المجموعة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error creating rule: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/groups/{group_id}/events")
async def create_event(
    group_id: str,
    title: str = Query(...),
    description: str = Query(...),
    start_time: str = Query(...),
    end_time: str = Query(...),
    location: str = Query(""),
    image_url: str = Query("")
):
    """إنشاء حدث"""
    try:
        if await group_manager.create_event(group_id, title, description, start_time, end_time, location, image_url):
            return {"success": True, "message": "تم إنشاء الحدث"}
        else:
            raise HTTPException(status_code=404, detail="المجموعة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error creating event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/groups/{group_id}/polls")
async def create_poll(
    group_id: str,
    creator_id: str = Query(...),
    question: str = Query(...),
    options: List[str] = Query(...),
    end_time: str = Query(...)
):
    """إنشاء استطلاع"""
    try:
        if await group_manager.create_poll(group_id, creator_id, question, options, end_time):
            return {"success": True, "message": "تم إنشاء الاستطلاع"}
        else:
            raise HTTPException(status_code=404, detail="المجموعة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error creating poll: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/groups/{group_id}/polls/{poll_id}/vote")
async def vote_in_poll(
    group_id: str,
    poll_id: str,
    option: str = Query(...)
):
    """التصويت في استطلاع"""
    try:
        if await group_manager.vote_in_poll(group_id, poll_id, option):
            return {"success": True, "message": "تم التصويت"}
        else:
            raise HTTPException(status_code=404, detail="الاستطلاع غير موجود")
    except Exception as e:
        logger.error(f"❌ Error voting in poll: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/groups/{group_id}/announcements")
async def create_announcement(
    group_id: str,
    creator_id: str = Query(...),
    title: str = Query(...),
    content: str = Query(...),
    is_pinned: bool = Query(False)
):
    """إنشاء إعلان"""
    try:
        if await group_manager.create_announcement(group_id, creator_id, title, content, is_pinned):
            return {"success": True, "message": "تم إنشاء الإعلان"}
        else:
            raise HTTPException(status_code=404, detail="المجموعة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error creating announcement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/groups/search")
async def search_groups(query: str = Query(...), limit: int = Query(50)):
    """البحث عن المجموعات"""
    try:
        groups = group_manager.search_groups(query, limit)
        return {
            "success": True,
            "groups": [asdict(group) for group in groups]
        }
    except Exception as e:
        logger.error(f"❌ Error searching groups: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/groups/{group_id}/{user_id}")
async def websocket_group(group_id: str, user_id: str, websocket: WebSocket):
    """نقطة نهاية WebSocket للمجموعات"""
    await group_manager.connect(group_id, websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")

            if message_type == "ping":
                await websocket.send_json({"type": "pong"})

    except Exception as e:
        logger.error(f"❌ WebSocket error: {str(e)}")
    finally:
        await group_manager.disconnect(group_id, websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8008)
