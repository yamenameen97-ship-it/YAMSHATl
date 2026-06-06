"""خدمة الإشعارات والبحث المتقدمة - Enhanced Notifications & Search Service
يوفر:
- إشعارات فورية وفي الوقت الفعلي
- إشعارات مجمعة
- إعدادات الإشعارات
- البحث العام والمتقدم
- اقتراحات البحث
- البحث المخزن مؤقتاً
- البحث مع التصفية والترقيم
"""

from fastapi import FastAPI, HTTPException, Query, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Set
from dataclasses import dataclass, asdict, field
from enum import Enum
import logging
import uuid
import asyncio
from collections import defaultdict

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Yamshat Enhanced Notifications & Search Service",
    description="خدمة الإشعارات والبحث المتقدمة",
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

class NotificationType(str, Enum):
    """أنواع الإشعارات"""
    LIKE = "like"
    COMMENT = "comment"
    FOLLOW = "follow"
    MENTION = "mention"
    MESSAGE = "message"
    CALL = "call"
    LIVE_START = "live_start"
    GROUP_INVITE = "group_invite"
    FRIEND_REQUEST = "friend_request"
    STORY_REPLY = "story_reply"
    SYSTEM = "system"


class SearchType(str, Enum):
    """أنواع البحث"""
    USERS = "users"
    POSTS = "posts"
    VIDEOS = "videos"
    HASHTAGS = "hashtags"
    GROUPS = "groups"
    LIVE = "live"
    GLOBAL = "global"


@dataclass
class Notification:
    """إشعار"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    notification_type: NotificationType = NotificationType.SYSTEM
    actor_id: str = ""
    actor_name: str = ""
    actor_avatar: str = ""
    content: str = ""
    target_id: str = ""
    target_type: str = ""  # post, user, etc.
    is_read: bool = False
    read_at: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    deep_link: str = ""


@dataclass
class NotificationPreferences:
    """تفضيلات الإشعارات"""
    user_id: str = ""
    push_enabled: bool = True
    email_enabled: bool = True
    sound_enabled: bool = True
    vibration_enabled: bool = True
    muted_categories: List[NotificationType] = field(default_factory=list)
    muted_users: List[str] = field(default_factory=list)
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "08:00"


@dataclass
class SearchResult:
    """نتيجة البحث"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    search_type: SearchType = SearchType.GLOBAL
    result_id: str = ""
    title: str = ""
    description: str = ""
    image_url: str = ""
    metadata: Dict = field(default_factory=dict)
    relevance_score: float = 0.0


@dataclass
class SearchQuery:
    """استعلام البحث"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    query: str = ""
    search_type: SearchType = SearchType.GLOBAL
    filters: Dict = field(default_factory=dict)
    results_count: int = 0
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


# ============ مدير الإشعارات والبحث ============

class EnhancedNotificationsSearchManager:
    """مدير الإشعارات والبحث المتقدم"""

    def __init__(self):
        # الإشعارات
        self.notifications: Dict[str, Notification] = {}
        
        # الإشعارات حسب المستخدم
        self.user_notifications: Dict[str, List[str]] = defaultdict(list)
        
        # تفضيلات الإشعارات
        self.notification_preferences: Dict[str, NotificationPreferences] = {}
        
        # نتائج البحث المخزنة مؤقتاً
        self.search_cache: Dict[str, List[SearchResult]] = {}
        
        # استعلامات البحث الأخيرة
        self.recent_searches: Dict[str, List[SearchQuery]] = defaultdict(list)
        
        # الاقتراحات
        self.search_suggestions: Dict[str, List[str]] = {}
        
        # WebSocket connections
        self.active_connections: Dict[str, WebSocket] = {}

    async def create_notification(
        self,
        user_id: str,
        notification_type: NotificationType,
        actor_id: str,
        actor_name: str,
        actor_avatar: str,
        content: str,
        target_id: str = "",
        target_type: str = "",
        deep_link: str = ""
    ) -> Notification:
        """إنشاء إشعار"""
        notification = Notification(
            user_id=user_id,
            notification_type=notification_type,
            actor_id=actor_id,
            actor_name=actor_name,
            actor_avatar=actor_avatar,
            content=content,
            target_id=target_id,
            target_type=target_type,
            deep_link=deep_link
        )

        self.notifications[notification.id] = notification
        self.user_notifications[user_id].append(notification.id)

        # إرسال الإشعار عبر WebSocket إن أمكن
        await self.send_realtime_notification(user_id, notification)

        logger.info(f"✅ Notification created: {notification.id}")
        return notification

    async def send_realtime_notification(
        self,
        user_id: str,
        notification: Notification
    ) -> None:
        """إرسال إشعار فوري عبر WebSocket"""
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json({
                    "type": "notification",
                    "data": asdict(notification)
                })
                logger.info(f"📤 Realtime notification sent to {user_id}")
            except Exception as e:
                logger.error(f"❌ Error sending realtime notification: {str(e)}")

    async def mark_notification_as_read(
        self,
        notification_id: str,
        user_id: str
    ) -> bool:
        """تعليم الإشعار كمقروء"""
        if notification_id not in self.notifications:
            return False

        notification = self.notifications[notification_id]
        if notification.user_id != user_id:
            return False

        notification.is_read = True
        notification.read_at = datetime.utcnow().isoformat()
        logger.info(f"✅ Notification {notification_id} marked as read")
        return True

    async def mark_all_notifications_as_read(self, user_id: str) -> int:
        """تعليم جميع الإشعارات كمقروءة"""
        count = 0
        for notification_id in self.user_notifications.get(user_id, []):
            if notification_id in self.notifications:
                notification = self.notifications[notification_id]
                if not notification.is_read:
                    notification.is_read = True
                    notification.read_at = datetime.utcnow().isoformat()
                    count += 1

        logger.info(f"✅ {count} notifications marked as read for {user_id}")
        return count

    async def delete_notification(
        self,
        notification_id: str,
        user_id: str
    ) -> bool:
        """حذف إشعار"""
        if notification_id not in self.notifications:
            return False

        notification = self.notifications[notification_id]
        if notification.user_id != user_id:
            return False

        del self.notifications[notification_id]
        self.user_notifications[user_id].remove(notification_id)
        logger.info(f"✅ Notification {notification_id} deleted")
        return True

    async def set_notification_preferences(
        self,
        user_id: str,
        push_enabled: Optional[bool] = None,
        email_enabled: Optional[bool] = None,
        sound_enabled: Optional[bool] = None,
        vibration_enabled: Optional[bool] = None,
        muted_categories: Optional[List[NotificationType]] = None,
        muted_users: Optional[List[str]] = None,
        quiet_hours_start: Optional[str] = None,
        quiet_hours_end: Optional[str] = None
    ) -> NotificationPreferences:
        """تعيين تفضيلات الإشعارات"""
        if user_id not in self.notification_preferences:
            self.notification_preferences[user_id] = NotificationPreferences(user_id=user_id)

        prefs = self.notification_preferences[user_id]

        if push_enabled is not None:
            prefs.push_enabled = push_enabled
        if email_enabled is not None:
            prefs.email_enabled = email_enabled
        if sound_enabled is not None:
            prefs.sound_enabled = sound_enabled
        if vibration_enabled is not None:
            prefs.vibration_enabled = vibration_enabled
        if muted_categories is not None:
            prefs.muted_categories = muted_categories
        if muted_users is not None:
            prefs.muted_users = muted_users
        if quiet_hours_start is not None:
            prefs.quiet_hours_start = quiet_hours_start
        if quiet_hours_end is not None:
            prefs.quiet_hours_end = quiet_hours_end

        logger.info(f"✅ Notification preferences updated for {user_id}")
        return prefs

    async def search(
        self,
        user_id: str,
        query: str,
        search_type: SearchType = SearchType.GLOBAL,
        filters: Dict = {},
        limit: int = 50,
        offset: int = 0
    ) -> List[SearchResult]:
        """البحث"""
        # التحقق من الذاكرة المؤقتة
        cache_key = f"{query}_{search_type}_{json.dumps(filters)}"
        if cache_key in self.search_cache:
            results = self.search_cache[cache_key]
            logger.info(f"📦 Search results from cache: {query}")
            return results[offset:offset+limit]

        # محاكاة البحث
        results = []
        
        if search_type == SearchType.USERS:
            # البحث عن المستخدمين
            results = [
                SearchResult(
                    search_type=SearchType.USERS,
                    result_id=f"user_{i}",
                    title=f"User {query} {i}",
                    description=f"User profile matching {query}",
                    image_url="https://example.com/avatar.jpg",
                    relevance_score=0.95 - (i * 0.1)
                )
                for i in range(5)
            ]
        elif search_type == SearchType.POSTS:
            # البحث عن المنشورات
            results = [
                SearchResult(
                    search_type=SearchType.POSTS,
                    result_id=f"post_{i}",
                    title=f"Post about {query}",
                    description=f"Post content containing {query}",
                    metadata={"likes": 100 + i*10, "comments": 20 + i*5},
                    relevance_score=0.9 - (i * 0.1)
                )
                for i in range(5)
            ]
        elif search_type == SearchType.HASHTAGS:
            # البحث عن الهاشتاجات
            results = [
                SearchResult(
                    search_type=SearchType.HASHTAGS,
                    result_id=f"hashtag_{query}_{i}",
                    title=f"#{query}{i}",
                    description=f"Hashtag with {1000 + i*100} posts",
                    metadata={"post_count": 1000 + i*100},
                    relevance_score=0.95 - (i * 0.05)
                )
                for i in range(3)
            ]

        # تخزين النتائج في الذاكرة المؤقتة
        self.search_cache[cache_key] = results

        # تسجيل الاستعلام
        search_query = SearchQuery(
            user_id=user_id,
            query=query,
            search_type=search_type,
            filters=filters,
            results_count=len(results)
        )
        self.recent_searches[user_id].append(search_query)

        logger.info(f"🔍 Search completed: {query} ({len(results)} results)")
        return results[offset:offset+limit]

    def get_search_suggestions(
        self,
        query: str,
        limit: int = 10
    ) -> List[str]:
        """الحصول على اقتراحات البحث"""
        # محاكاة الاقتراحات
        suggestions = [
            f"{query} {i}" for i in range(1, limit+1)
        ]
        return suggestions

    def get_recent_searches(
        self,
        user_id: str,
        limit: int = 20
    ) -> List[SearchQuery]:
        """الحصول على البحث الأخير"""
        searches = self.recent_searches.get(user_id, [])
        return searches[-limit:]

    def get_trending_searches(self, limit: int = 10) -> List[str]:
        """الحصول على البحث الرائج"""
        # محاكاة البحث الرائج
        trending = [
            f"Trending topic {i}" for i in range(1, limit+1)
        ]
        return trending

    def get_user_notifications(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
        unread_only: bool = False
    ) -> List[Notification]:
        """الحصول على إشعارات المستخدم"""
        notification_ids = self.user_notifications.get(user_id, [])
        notifications = [
            self.notifications[nid] for nid in notification_ids
            if nid in self.notifications
        ]

        if unread_only:
            notifications = [n for n in notifications if not n.is_read]

        # ترتيب حسب الأحدث
        notifications.sort(key=lambda n: n.created_at, reverse=True)

        return notifications[offset:offset+limit]

    def get_unread_notification_count(self, user_id: str) -> int:
        """الحصول على عدد الإشعارات غير المقروءة"""
        notification_ids = self.user_notifications.get(user_id, [])
        unread_count = sum(
            1 for nid in notification_ids
            if nid in self.notifications and not self.notifications[nid].is_read
        )
        return unread_count

    def get_notification_preferences(self, user_id: str) -> Optional[NotificationPreferences]:
        """الحصول على تفضيلات الإشعارات"""
        return self.notification_preferences.get(user_id)


# ============ مثيل مدير الإشعارات والبحث ============

notifications_search_manager = EnhancedNotificationsSearchManager()


# ============ المسارات (Routes) ============

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "enhanced-notifications-search-service",
        "version": "2.0.0",
        "total_notifications": len(notifications_search_manager.notifications)
    }


@app.post("/notifications")
async def create_notification(
    user_id: str = Query(...),
    notification_type: NotificationType = Query(...),
    actor_id: str = Query(...),
    actor_name: str = Query(...),
    actor_avatar: str = Query(""),
    content: str = Query(...),
    target_id: str = Query(""),
    target_type: str = Query(""),
    deep_link: str = Query("")
):
    """إنشاء إشعار"""
    try:
        notification = await notifications_search_manager.create_notification(
            user_id, notification_type, actor_id, actor_name, actor_avatar,
            content, target_id, target_type, deep_link
        )
        return {
            "success": True,
            "notification_id": notification.id,
            "notification": asdict(notification)
        }
    except Exception as e:
        logger.error(f"❌ Error creating notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    user_id: str = Query(...)
):
    """تعليم الإشعار كمقروء"""
    try:
        if await notifications_search_manager.mark_notification_as_read(notification_id, user_id):
            return {"success": True, "message": "تم تعليم الإشعار كمقروء"}
        else:
            raise HTTPException(status_code=404, detail="الإشعار غير موجود")
    except Exception as e:
        logger.error(f"❌ Error marking notification as read: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/notifications/read-all")
async def mark_all_notifications_as_read(user_id: str = Query(...)):
    """تعليم جميع الإشعارات كمقروءة"""
    try:
        count = await notifications_search_manager.mark_all_notifications_as_read(user_id)
        return {
            "success": True,
            "message": f"تم تعليم {count} إشعار كمقروء"
        }
    except Exception as e:
        logger.error(f"❌ Error marking all notifications as read: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    user_id: str = Query(...)
):
    """حذف إشعار"""
    try:
        if await notifications_search_manager.delete_notification(notification_id, user_id):
            return {"success": True, "message": "تم حذف الإشعار"}
        else:
            raise HTTPException(status_code=404, detail="الإشعار غير موجود")
    except Exception as e:
        logger.error(f"❌ Error deleting notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/notification-preferences")
async def set_notification_preferences(
    user_id: str = Query(...),
    push_enabled: Optional[bool] = Query(None),
    email_enabled: Optional[bool] = Query(None),
    sound_enabled: Optional[bool] = Query(None),
    vibration_enabled: Optional[bool] = Query(None),
    muted_categories: Optional[List[NotificationType]] = Query(None),
    muted_users: Optional[List[str]] = Query(None),
    quiet_hours_start: Optional[str] = Query(None),
    quiet_hours_end: Optional[str] = Query(None)
):
    """تعيين تفضيلات الإشعارات"""
    try:
        prefs = await notifications_search_manager.set_notification_preferences(
            user_id, push_enabled, email_enabled, sound_enabled, vibration_enabled,
            muted_categories, muted_users, quiet_hours_start, quiet_hours_end
        )
        return {
            "success": True,
            "preferences": asdict(prefs)
        }
    except Exception as e:
        logger.error(f"❌ Error setting notification preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/notifications")
async def get_user_notifications(
    user_id: str = Query(...),
    limit: int = Query(50),
    offset: int = Query(0),
    unread_only: bool = Query(False)
):
    """الحصول على إشعارات المستخدم"""
    try:
        notifications = notifications_search_manager.get_user_notifications(
            user_id, limit, offset, unread_only
        )
        return {
            "success": True,
            "notifications": [asdict(n) for n in notifications]
        }
    except Exception as e:
        logger.error(f"❌ Error getting user notifications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/notifications/unread-count")
async def get_unread_notification_count(user_id: str = Query(...)):
    """الحصول على عدد الإشعارات غير المقروءة"""
    try:
        count = notifications_search_manager.get_unread_notification_count(user_id)
        return {
            "success": True,
            "unread_count": count
        }
    except Exception as e:
        logger.error(f"❌ Error getting unread notification count: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/search")
async def search(
    user_id: str = Query(...),
    query: str = Query(...),
    search_type: SearchType = Query(SearchType.GLOBAL),
    limit: int = Query(50),
    offset: int = Query(0)
):
    """البحث"""
    try:
        results = await notifications_search_manager.search(
            user_id, query, search_type, {}, limit, offset
        )
        return {
            "success": True,
            "results": [asdict(r) for r in results]
        }
    except Exception as e:
        logger.error(f"❌ Error searching: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/search/suggestions")
async def get_search_suggestions(
    query: str = Query(...),
    limit: int = Query(10)
):
    """الحصول على اقتراحات البحث"""
    try:
        suggestions = notifications_search_manager.get_search_suggestions(query, limit)
        return {
            "success": True,
            "suggestions": suggestions
        }
    except Exception as e:
        logger.error(f"❌ Error getting search suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/search/recent")
async def get_recent_searches(
    user_id: str = Query(...),
    limit: int = Query(20)
):
    """الحصول على البحث الأخير"""
    try:
        searches = notifications_search_manager.get_recent_searches(user_id, limit)
        return {
            "success": True,
            "searches": [asdict(s) for s in searches]
        }
    except Exception as e:
        logger.error(f"❌ Error getting recent searches: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/search/trending")
async def get_trending_searches(limit: int = Query(10)):
    """الحصول على البحث الرائج"""
    try:
        trending = notifications_search_manager.get_trending_searches(limit)
        return {
            "success": True,
            "trending": trending
        }
    except Exception as e:
        logger.error(f"❌ Error getting trending searches: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8012)
