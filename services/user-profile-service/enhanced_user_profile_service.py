"""خدمة الملف الشخصي والأصدقاء المتقدمة - Enhanced User Profile Service
يوفر:
- إدارة الملفات الشخصية
- نظام الأصدقاء والطلبات
- الأصدقاء المقترحون
- الأصدقاء المفضلين والفئات
- سجل النشاط
- المستخدمون المحظورون
- المنشورات المحفوظة والمسودات
- مشاركة الملف الشخصي وQR
- تحليلات الملف الشخصي
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import json
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
    title="Yamshat Enhanced User Profile Service",
    description="خدمة الملف الشخصي والأصدقاء المتقدمة",
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

class FriendRequestStatus(str, Enum):
    """حالات طلبات الصداقة"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    BLOCKED = "blocked"


class AccountPrivacy(str, Enum):
    """خصوصية الحساب"""
    PUBLIC = "public"
    PRIVATE = "private"
    FRIENDS_ONLY = "friends_only"


@dataclass
class UserStats:
    """إحصائيات المستخدم"""
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    views_count: int = 0
    engagement_rate: float = 0.0


@dataclass
class FriendRequest:
    """طلب الصداقة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str = ""
    sender_name: str = ""
    sender_avatar: str = ""
    receiver_id: str = ""
    status: FriendRequestStatus = FriendRequestStatus.PENDING
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    responded_at: Optional[str] = None


@dataclass
class Friend:
    """صديق"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    user_name: str = ""
    user_avatar: str = ""
    is_favorite: bool = False
    category: str = ""  # أصدقاء، عائلة، زملاء، إلخ
    is_online: bool = False
    last_seen: Optional[str] = None
    added_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class BlockedUser:
    """مستخدم محظور"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    user_name: str = ""
    user_avatar: str = ""
    blocked_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class SavedPost:
    """منشور محفوظ"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    post_id: str = ""
    author_id: str = ""
    author_name: str = ""
    content: str = ""
    saved_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class Draft:
    """مسودة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    content: str = ""
    media_urls: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class ActivityLog:
    """سجل النشاط"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    action: str = ""  # like, comment, share, follow, etc.
    target_id: str = ""
    target_type: str = ""  # post, user, etc.
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class UserProfile:
    """ملف المستخدم الشخصي"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    user_name: str = ""
    email: str = ""
    bio: str = ""
    avatar_url: str = ""
    cover_image_url: str = ""
    website: str = ""
    location: str = ""
    birth_date: Optional[str] = None
    is_verified: bool = False
    verification_badge: str = ""  # gold, silver, etc.
    privacy: AccountPrivacy = AccountPrivacy.PUBLIC
    is_online: bool = False
    last_seen: Optional[str] = None
    friends: List[Friend] = field(default_factory=list)
    friend_requests: List[FriendRequest] = field(default_factory=list)
    blocked_users: List[BlockedUser] = field(default_factory=list)
    saved_posts: List[SavedPost] = field(default_factory=list)
    drafts: List[Draft] = field(default_factory=list)
    activity_logs: List[ActivityLog] = field(default_factory=list)
    stats: UserStats = field(default_factory=UserStats)
    qr_code_url: str = ""
    share_link: str = ""
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


# ============ مدير الملفات الشخصية ============

class EnhancedUserProfileManager:
    """مدير الملفات الشخصية والأصدقاء المتقدم"""

    def __init__(self):
        # الملفات الشخصية
        self.profiles: Dict[str, UserProfile] = {}
        
        # الأصدقاء المقترحون
        self.suggested_friends: Dict[str, List[str]] = defaultdict(list)

    async def create_profile(
        self,
        user_id: str,
        user_name: str,
        email: str,
        avatar_url: str = "",
        bio: str = ""
    ) -> UserProfile:
        """إنشاء ملف شخصي جديد"""
        profile = UserProfile(
            user_id=user_id,
            user_name=user_name,
            email=email,
            avatar_url=avatar_url,
            bio=bio,
            qr_code_url=f"https://qr.yamshat.com/{user_id}",
            share_link=f"https://yamshat.com/profile/{user_id}"
        )

        self.profiles[user_id] = profile
        logger.info(f"✅ Profile created for user {user_id}")
        return profile

    async def update_profile(
        self,
        user_id: str,
        user_name: Optional[str] = None,
        bio: Optional[str] = None,
        avatar_url: Optional[str] = None,
        cover_image_url: Optional[str] = None,
        website: Optional[str] = None,
        location: Optional[str] = None,
        birth_date: Optional[str] = None,
        privacy: Optional[AccountPrivacy] = None
    ) -> bool:
        """تحديث الملف الشخصي"""
        if user_id not in self.profiles:
            return False

        profile = self.profiles[user_id]
        if user_name:
            profile.user_name = user_name
        if bio:
            profile.bio = bio
        if avatar_url:
            profile.avatar_url = avatar_url
        if cover_image_url:
            profile.cover_image_url = cover_image_url
        if website:
            profile.website = website
        if location:
            profile.location = location
        if birth_date:
            profile.birth_date = birth_date
        if privacy:
            profile.privacy = privacy

        profile.updated_at = datetime.utcnow().isoformat()
        logger.info(f"✅ Profile updated for user {user_id}")
        return True

    async def send_friend_request(
        self,
        sender_id: str,
        sender_name: str,
        sender_avatar: str,
        receiver_id: str
    ) -> bool:
        """إرسال طلب صداقة"""
        if receiver_id not in self.profiles:
            return False

        profile = self.profiles[receiver_id]

        # التحقق من عدم وجود طلب معلق بالفعل
        if any(
            r.sender_id == sender_id and r.status == FriendRequestStatus.PENDING
            for r in profile.friend_requests
        ):
            return False

        request = FriendRequest(
            sender_id=sender_id,
            sender_name=sender_name,
            sender_avatar=sender_avatar,
            receiver_id=receiver_id
        )
        profile.friend_requests.append(request)

        logger.info(f"✅ Friend request sent from {sender_id} to {receiver_id}")
        return True

    async def accept_friend_request(
        self,
        user_id: str,
        request_id: str
    ) -> bool:
        """قبول طلب الصداقة"""
        if user_id not in self.profiles:
            return False

        profile = self.profiles[user_id]
        for request in profile.friend_requests:
            if request.id == request_id and request.status == FriendRequestStatus.PENDING:
                request.status = FriendRequestStatus.ACCEPTED
                request.responded_at = datetime.utcnow().isoformat()

                # إضافة الصديق
                friend = Friend(
                    user_id=request.sender_id,
                    user_name=request.sender_name,
                    user_avatar=request.sender_avatar
                )
                profile.friends.append(friend)
                profile.stats.followers_count += 1

                # إضافة المستخدم الحالي كصديق للمرسل
                if request.sender_id in self.profiles:
                    sender_profile = self.profiles[request.sender_id]
                    sender_friend = Friend(
                        user_id=user_id,
                        user_name=profile.user_name,
                        user_avatar=profile.avatar_url
                    )
                    sender_profile.friends.append(sender_friend)
                    sender_profile.stats.following_count += 1

                logger.info(f"✅ Friend request {request_id} accepted by {user_id}")
                return True
        return False

    async def reject_friend_request(
        self,
        user_id: str,
        request_id: str
    ) -> bool:
        """رفض طلب الصداقة"""
        if user_id not in self.profiles:
            return False

        profile = self.profiles[user_id]
        for request in profile.friend_requests:
            if request.id == request_id and request.status == FriendRequestStatus.PENDING:
                request.status = FriendRequestStatus.REJECTED
                request.responded_at = datetime.utcnow().isoformat()
                logger.info(f"✅ Friend request {request_id} rejected by {user_id}")
                return True
        return False

    async def cancel_friend_request(
        self,
        sender_id: str,
        receiver_id: str
    ) -> bool:
        """إلغاء طلب الصداقة"""
        if receiver_id not in self.profiles:
            return False

        profile = self.profiles[receiver_id]
        for i, request in enumerate(profile.friend_requests):
            if request.sender_id == sender_id and request.status == FriendRequestStatus.PENDING:
                profile.friend_requests.pop(i)
                logger.info(f"✅ Friend request from {sender_id} to {receiver_id} cancelled")
                return True
        return False

    async def remove_friend(self, user_id: str, friend_id: str) -> bool:
        """إزالة صديق"""
        if user_id not in self.profiles:
            return False

        profile = self.profiles[user_id]
        for i, friend in enumerate(profile.friends):
            if friend.user_id == friend_id:
                profile.friends.pop(i)
                profile.stats.followers_count -= 1

                # إزالة المستخدم الحالي من قائمة أصدقاء الصديق
                if friend_id in self.profiles:
                    friend_profile = self.profiles[friend_id]
                    for j, f in enumerate(friend_profile.friends):
                        if f.user_id == user_id:
                            friend_profile.friends.pop(j)
                            friend_profile.stats.following_count -= 1
                            break

                logger.info(f"✅ Friend {friend_id} removed from {user_id}")
                return True
        return False

    async def block_user(
        self,
        user_id: str,
        blocked_user_id: str,
        blocked_user_name: str,
        blocked_user_avatar: str = ""
    ) -> bool:
        """حظر مستخدم"""
        if user_id not in self.profiles:
            return False

        profile = self.profiles[user_id]

        # التحقق من عدم حظر المستخدم بالفعل
        if any(b.user_id == blocked_user_id for b in profile.blocked_users):
            return False

        blocked_user = BlockedUser(
            user_id=blocked_user_id,
            user_name=blocked_user_name,
            user_avatar=blocked_user_avatar
        )
        profile.blocked_users.append(blocked_user)

        # إزالة الصداقة إن وجدت
        await self.remove_friend(user_id, blocked_user_id)

        logger.info(f"✅ User {blocked_user_id} blocked by {user_id}")
        return True

    async def unblock_user(self, user_id: str, blocked_user_id: str) -> bool:
        """إلغاء حظر مستخدم"""
        if user_id not in self.profiles:
            return False

        profile = self.profiles[user_id]
        for i, blocked_user in enumerate(profile.blocked_users):
            if blocked_user.user_id == blocked_user_id:
                profile.blocked_users.pop(i)
                logger.info(f"✅ User {blocked_user_id} unblocked by {user_id}")
                return True
        return False

    async def add_favorite_friend(self, user_id: str, friend_id: str) -> bool:
        """إضافة صديق إلى المفضلة"""
        if user_id not in self.profiles:
            return False

        profile = self.profiles[user_id]
        for friend in profile.friends:
            if friend.user_id == friend_id:
                friend.is_favorite = True
                logger.info(f"✅ Friend {friend_id} added to favorites for {user_id}")
                return True
        return False

    async def remove_favorite_friend(self, user_id: str, friend_id: str) -> bool:
        """إزالة صديق من المفضلة"""
        if user_id not in self.profiles:
            return False

        profile = self.profiles[user_id]
        for friend in profile.friends:
            if friend.user_id == friend_id:
                friend.is_favorite = False
                logger.info(f"✅ Friend {friend_id} removed from favorites for {user_id}")
                return True
        return False

    async def categorize_friend(
        self,
        user_id: str,
        friend_id: str,
        category: str
    ) -> bool:
        """تصنيف الصديق"""
        if user_id not in self.profiles:
            return False

        profile = self.profiles[user_id]
        for friend in profile.friends:
            if friend.user_id == friend_id:
                friend.category = category
                logger.info(f"✅ Friend {friend_id} categorized as {category}")
                return True
        return False

    async def save_post(
        self,
        user_id: str,
        post_id: str,
        author_id: str,
        author_name: str,
        content: str
    ) -> bool:
        """حفظ منشور"""
        if user_id not in self.profiles:
            return False

        profile = self.profiles[user_id]

        # التحقق من عدم حفظ المنشور بالفعل
        if any(p.post_id == post_id for p in profile.saved_posts):
            return False

        saved_post = SavedPost(
            post_id=post_id,
            author_id=author_id,
            author_name=author_name,
            content=content
        )
        profile.saved_posts.append(saved_post)

        logger.info(f"✅ Post {post_id} saved by {user_id}")
        return True

    async def unsave_post(self, user_id: str, post_id: str) -> bool:
        """إلغاء حفظ منشور"""
        if user_id not in self.profiles:
            return False

        profile = self.profiles[user_id]
        for i, saved_post in enumerate(profile.saved_posts):
            if saved_post.post_id == post_id:
                profile.saved_posts.pop(i)
                logger.info(f"✅ Post {post_id} unsaved by {user_id}")
                return True
        return False

    async def create_draft(
        self,
        user_id: str,
        content: str,
        media_urls: List[str] = []
    ) -> bool:
        """إنشاء مسودة"""
        if user_id not in self.profiles:
            return False

        profile = self.profiles[user_id]
        draft = Draft(
            content=content,
            media_urls=media_urls
        )
        profile.drafts.append(draft)

        logger.info(f"✅ Draft created for user {user_id}")
        return True

    async def update_draft(
        self,
        user_id: str,
        draft_id: str,
        content: str,
        media_urls: List[str] = []
    ) -> bool:
        """تحديث مسودة"""
        if user_id not in self.profiles:
            return False

        profile = self.profiles[user_id]
        for draft in profile.drafts:
            if draft.id == draft_id:
                draft.content = content
                draft.media_urls = media_urls
                draft.updated_at = datetime.utcnow().isoformat()
                logger.info(f"✅ Draft {draft_id} updated for user {user_id}")
                return True
        return False

    async def delete_draft(self, user_id: str, draft_id: str) -> bool:
        """حذف مسودة"""
        if user_id not in self.profiles:
            return False

        profile = self.profiles[user_id]
        for i, draft in enumerate(profile.drafts):
            if draft.id == draft_id:
                profile.drafts.pop(i)
                logger.info(f"✅ Draft {draft_id} deleted for user {user_id}")
                return True
        return False

    async def log_activity(
        self,
        user_id: str,
        action: str,
        target_id: str,
        target_type: str
    ) -> bool:
        """تسجيل النشاط"""
        if user_id not in self.profiles:
            return False

        profile = self.profiles[user_id]
        activity = ActivityLog(
            user_id=user_id,
            action=action,
            target_id=target_id,
            target_type=target_type
        )
        profile.activity_logs.append(activity)

        # تحديث الإحصائيات
        if action == "like":
            profile.stats.likes_count += 1
        elif action == "comment":
            profile.stats.comments_count += 1
        elif action == "share":
            profile.stats.shares_count += 1

        return True

    async def set_online_status(self, user_id: str, is_online: bool) -> bool:
        """تعيين حالة الاتصال"""
        if user_id not in self.profiles:
            return False

        profile = self.profiles[user_id]
        profile.is_online = is_online
        if not is_online:
            profile.last_seen = datetime.utcnow().isoformat()

        logger.info(f"✅ User {user_id} online status set to {is_online}")
        return True

    def get_profile(self, user_id: str) -> Optional[UserProfile]:
        """الحصول على الملف الشخصي"""
        return self.profiles.get(user_id)

    def get_friends(self, user_id: str, limit: int = 100) -> List[Friend]:
        """الحصول على قائمة الأصدقاء"""
        if user_id not in self.profiles:
            return []

        profile = self.profiles[user_id]
        return profile.friends[:limit]

    def get_online_friends(self, user_id: str) -> List[Friend]:
        """الحصول على الأصدقاء المتصلين"""
        if user_id not in self.profiles:
            return []

        profile = self.profiles[user_id]
        return [f for f in profile.friends if f.is_online]

    def get_favorite_friends(self, user_id: str) -> List[Friend]:
        """الحصول على الأصدقاء المفضلين"""
        if user_id not in self.profiles:
            return []

        profile = self.profiles[user_id]
        return [f for f in profile.friends if f.is_favorite]

    def get_pending_friend_requests(self, user_id: str) -> List[FriendRequest]:
        """الحصول على طلبات الصداقة المعلقة"""
        if user_id not in self.profiles:
            return []

        profile = self.profiles[user_id]
        return [r for r in profile.friend_requests if r.status == FriendRequestStatus.PENDING]

    def get_suggested_friends(self, user_id: str, limit: int = 20) -> List[str]:
        """الحصول على الأصدقاء المقترحين"""
        return self.suggested_friends.get(user_id, [])[:limit]

    def get_activity_history(self, user_id: str, limit: int = 50) -> List[ActivityLog]:
        """الحصول على سجل النشاط"""
        if user_id not in self.profiles:
            return []

        profile = self.profiles[user_id]
        return profile.activity_logs[-limit:]

    def search_friends(self, user_id: str, query: str, limit: int = 50) -> List[Friend]:
        """البحث عن الأصدقاء"""
        if user_id not in self.profiles:
            return []

        profile = self.profiles[user_id]
        results = [
            friend for friend in profile.friends
            if query.lower() in friend.user_name.lower()
        ]
        return results[:limit]


# ============ مثيل مدير الملفات الشخصية ============

profile_manager = EnhancedUserProfileManager()


# ============ المسارات (Routes) ============

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "enhanced-user-profile-service",
        "version": "2.0.0",
        "total_profiles": len(profile_manager.profiles)
    }


@app.post("/profiles")
async def create_profile(
    user_id: str = Query(...),
    user_name: str = Query(...),
    email: str = Query(...),
    avatar_url: str = Query(""),
    bio: str = Query("")
):
    """إنشاء ملف شخصي جديد"""
    try:
        profile = await profile_manager.create_profile(
            user_id, user_name, email, avatar_url, bio
        )
        return {
            "success": True,
            "profile": asdict(profile)
        }
    except Exception as e:
        logger.error(f"❌ Error creating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/profiles/{user_id}")
async def get_profile(user_id: str):
    """الحصول على الملف الشخصي"""
    try:
        profile = profile_manager.get_profile(user_id)
        if profile:
            return {
                "success": True,
                "profile": asdict(profile)
            }
        else:
            raise HTTPException(status_code=404, detail="الملف الشخصي غير موجود")
    except Exception as e:
        logger.error(f"❌ Error getting profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/profiles/{user_id}")
async def update_profile(
    user_id: str,
    user_name: Optional[str] = Query(None),
    bio: Optional[str] = Query(None),
    avatar_url: Optional[str] = Query(None),
    cover_image_url: Optional[str] = Query(None),
    website: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    birth_date: Optional[str] = Query(None),
    privacy: Optional[AccountPrivacy] = Query(None)
):
    """تحديث الملف الشخصي"""
    try:
        if await profile_manager.update_profile(
            user_id, user_name, bio, avatar_url, cover_image_url, website, location, birth_date, privacy
        ):
            return {"success": True, "message": "تم تحديث الملف الشخصي"}
        else:
            raise HTTPException(status_code=404, detail="الملف الشخصي غير موجود")
    except Exception as e:
        logger.error(f"❌ Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/profiles/{user_id}/friend-requests")
async def send_friend_request(
    user_id: str,
    sender_id: str = Query(...),
    sender_name: str = Query(...),
    sender_avatar: str = Query("")
):
    """إرسال طلب صداقة"""
    try:
        if await profile_manager.send_friend_request(sender_id, sender_name, sender_avatar, user_id):
            return {"success": True, "message": "تم إرسال طلب الصداقة"}
        else:
            raise HTTPException(status_code=400, detail="فشل إرسال الطلب")
    except Exception as e:
        logger.error(f"❌ Error sending friend request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/profiles/{user_id}/friend-requests/{request_id}/accept")
async def accept_friend_request(user_id: str, request_id: str):
    """قبول طلب الصداقة"""
    try:
        if await profile_manager.accept_friend_request(user_id, request_id):
            return {"success": True, "message": "تم قبول الطلب"}
        else:
            raise HTTPException(status_code=404, detail="الطلب غير موجود")
    except Exception as e:
        logger.error(f"❌ Error accepting friend request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/profiles/{user_id}/friend-requests/{request_id}/reject")
async def reject_friend_request(user_id: str, request_id: str):
    """رفض طلب الصداقة"""
    try:
        if await profile_manager.reject_friend_request(user_id, request_id):
            return {"success": True, "message": "تم رفض الطلب"}
        else:
            raise HTTPException(status_code=404, detail="الطلب غير موجود")
    except Exception as e:
        logger.error(f"❌ Error rejecting friend request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/profiles/{user_id}/friend-requests/{friend_id}")
async def cancel_friend_request(user_id: str, friend_id: str):
    """إلغاء طلب الصداقة"""
    try:
        if await profile_manager.cancel_friend_request(friend_id, user_id):
            return {"success": True, "message": "تم إلغاء الطلب"}
        else:
            raise HTTPException(status_code=404, detail="الطلب غير موجود")
    except Exception as e:
        logger.error(f"❌ Error cancelling friend request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/profiles/{user_id}/friends/{friend_id}")
async def remove_friend(user_id: str, friend_id: str):
    """إزالة صديق"""
    try:
        if await profile_manager.remove_friend(user_id, friend_id):
            return {"success": True, "message": "تم إزالة الصديق"}
        else:
            raise HTTPException(status_code=404, detail="الصديق غير موجود")
    except Exception as e:
        logger.error(f"❌ Error removing friend: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/profiles/{user_id}/blocked-users")
async def block_user(
    user_id: str,
    blocked_user_id: str = Query(...),
    blocked_user_name: str = Query(...),
    blocked_user_avatar: str = Query("")
):
    """حظر مستخدم"""
    try:
        if await profile_manager.block_user(user_id, blocked_user_id, blocked_user_name, blocked_user_avatar):
            return {"success": True, "message": "تم حظر المستخدم"}
        else:
            raise HTTPException(status_code=400, detail="فشل حظر المستخدم")
    except Exception as e:
        logger.error(f"❌ Error blocking user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/profiles/{user_id}/blocked-users/{blocked_user_id}")
async def unblock_user(user_id: str, blocked_user_id: str):
    """إلغاء حظر مستخدم"""
    try:
        if await profile_manager.unblock_user(user_id, blocked_user_id):
            return {"success": True, "message": "تم إلغاء الحظر"}
        else:
            raise HTTPException(status_code=404, detail="المستخدم غير محظور")
    except Exception as e:
        logger.error(f"❌ Error unblocking user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/profiles/{user_id}/favorite-friends/{friend_id}")
async def add_favorite_friend(user_id: str, friend_id: str):
    """إضافة صديق إلى المفضلة"""
    try:
        if await profile_manager.add_favorite_friend(user_id, friend_id):
            return {"success": True, "message": "تم إضافة الصديق إلى المفضلة"}
        else:
            raise HTTPException(status_code=404, detail="الصديق غير موجود")
    except Exception as e:
        logger.error(f"❌ Error adding favorite friend: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/profiles/{user_id}/favorite-friends/{friend_id}")
async def remove_favorite_friend(user_id: str, friend_id: str):
    """إزالة صديق من المفضلة"""
    try:
        if await profile_manager.remove_favorite_friend(user_id, friend_id):
            return {"success": True, "message": "تم إزالة الصديق من المفضلة"}
        else:
            raise HTTPException(status_code=404, detail="الصديق غير موجود")
    except Exception as e:
        logger.error(f"❌ Error removing favorite friend: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/profiles/{user_id}/friends/{friend_id}/category")
async def categorize_friend(
    user_id: str,
    friend_id: str,
    category: str = Query(...)
):
    """تصنيف الصديق"""
    try:
        if await profile_manager.categorize_friend(user_id, friend_id, category):
            return {"success": True, "message": "تم تصنيف الصديق"}
        else:
            raise HTTPException(status_code=404, detail="الصديق غير موجود")
    except Exception as e:
        logger.error(f"❌ Error categorizing friend: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/profiles/{user_id}/saved-posts")
async def save_post(
    user_id: str,
    post_id: str = Query(...),
    author_id: str = Query(...),
    author_name: str = Query(...),
    content: str = Query(...)
):
    """حفظ منشور"""
    try:
        if await profile_manager.save_post(user_id, post_id, author_id, author_name, content):
            return {"success": True, "message": "تم حفظ المنشور"}
        else:
            raise HTTPException(status_code=400, detail="فشل حفظ المنشور")
    except Exception as e:
        logger.error(f"❌ Error saving post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/profiles/{user_id}/saved-posts/{post_id}")
async def unsave_post(user_id: str, post_id: str):
    """إلغاء حفظ منشور"""
    try:
        if await profile_manager.unsave_post(user_id, post_id):
            return {"success": True, "message": "تم إلغاء حفظ المنشور"}
        else:
            raise HTTPException(status_code=404, detail="المنشور غير محفوظ")
    except Exception as e:
        logger.error(f"❌ Error unsaving post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/profiles/{user_id}/drafts")
async def create_draft(
    user_id: str,
    content: str = Query(...),
    media_urls: List[str] = Query([])
):
    """إنشاء مسودة"""
    try:
        if await profile_manager.create_draft(user_id, content, media_urls):
            return {"success": True, "message": "تم إنشاء المسودة"}
        else:
            raise HTTPException(status_code=404, detail="الملف الشخصي غير موجود")
    except Exception as e:
        logger.error(f"❌ Error creating draft: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/profiles/{user_id}/activity-logs")
async def log_activity(
    user_id: str,
    action: str = Query(...),
    target_id: str = Query(...),
    target_type: str = Query(...)
):
    """تسجيل النشاط"""
    try:
        if await profile_manager.log_activity(user_id, action, target_id, target_type):
            return {"success": True, "message": "تم تسجيل النشاط"}
        else:
            raise HTTPException(status_code=404, detail="الملف الشخصي غير موجود")
    except Exception as e:
        logger.error(f"❌ Error logging activity: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/profiles/{user_id}/online-status")
async def set_online_status(
    user_id: str,
    is_online: bool = Query(...)
):
    """تعيين حالة الاتصال"""
    try:
        if await profile_manager.set_online_status(user_id, is_online):
            return {"success": True, "message": "تم تحديث حالة الاتصال"}
        else:
            raise HTTPException(status_code=404, detail="الملف الشخصي غير موجود")
    except Exception as e:
        logger.error(f"❌ Error setting online status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/profiles/{user_id}/friends")
async def get_friends(user_id: str, limit: int = Query(100)):
    """الحصول على قائمة الأصدقاء"""
    try:
        friends = profile_manager.get_friends(user_id, limit)
        return {
            "success": True,
            "friends": [asdict(f) for f in friends]
        }
    except Exception as e:
        logger.error(f"❌ Error getting friends: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/profiles/{user_id}/online-friends")
async def get_online_friends(user_id: str):
    """الحصول على الأصدقاء المتصلين"""
    try:
        friends = profile_manager.get_online_friends(user_id)
        return {
            "success": True,
            "friends": [asdict(f) for f in friends]
        }
    except Exception as e:
        logger.error(f"❌ Error getting online friends: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/profiles/{user_id}/favorite-friends")
async def get_favorite_friends(user_id: str):
    """الحصول على الأصدقاء المفضلين"""
    try:
        friends = profile_manager.get_favorite_friends(user_id)
        return {
            "success": True,
            "friends": [asdict(f) for f in friends]
        }
    except Exception as e:
        logger.error(f"❌ Error getting favorite friends: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/profiles/{user_id}/pending-friend-requests")
async def get_pending_friend_requests(user_id: str):
    """الحصول على طلبات الصداقة المعلقة"""
    try:
        requests = profile_manager.get_pending_friend_requests(user_id)
        return {
            "success": True,
            "requests": [asdict(r) for r in requests]
        }
    except Exception as e:
        logger.error(f"❌ Error getting pending friend requests: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/profiles/{user_id}/suggested-friends")
async def get_suggested_friends(user_id: str, limit: int = Query(20)):
    """الحصول على الأصدقاء المقترحين"""
    try:
        friends = profile_manager.get_suggested_friends(user_id, limit)
        return {
            "success": True,
            "suggested_friends": friends
        }
    except Exception as e:
        logger.error(f"❌ Error getting suggested friends: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/profiles/{user_id}/activity-history")
async def get_activity_history(user_id: str, limit: int = Query(50)):
    """الحصول على سجل النشاط"""
    try:
        activities = profile_manager.get_activity_history(user_id, limit)
        return {
            "success": True,
            "activities": [asdict(a) for a in activities]
        }
    except Exception as e:
        logger.error(f"❌ Error getting activity history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/profiles/{user_id}/friends/search")
async def search_friends(user_id: str, query: str = Query(...), limit: int = Query(50)):
    """البحث عن الأصدقاء"""
    try:
        friends = profile_manager.search_friends(user_id, query, limit)
        return {
            "success": True,
            "friends": [asdict(f) for f in friends]
        }
    except Exception as e:
        logger.error(f"❌ Error searching friends: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8009)
