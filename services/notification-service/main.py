"""
نظام الإشعارات المتقدم - Advanced Notification Service
يوفر:
- تجميع الإشعارات (Grouped Notifications)
- تصنيف الإشعارات (Categorized Notifications)
- مزامنة واجهة المستخدم (Push Sync UI)
- تحريكات الإشعارات (Notification Animations)
- شارات حية (Live Badges)
- WebSocket للإشعارات الفورية
"""

from fastapi import FastAPI, WebSocket, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Set
from dataclasses import dataclass, asdict, field
from enum import Enum
import logging
from collections import defaultdict
import uuid

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============ تعريفات الأنواع ============

class NotificationType(str, Enum):
    """أنواع الإشعارات"""
    LIKE = "like"
    COMMENT = "comment"
    FOLLOW = "follow"
    MESSAGE = "message"
    MENTION = "mention"
    SHARE = "share"
    STORY_VIEW = "story_view"
    STORY_REPLY = "story_reply"
    TAG = "tag"
    SYSTEM = "system"


class NotificationCategory(str, Enum):
    """فئات الإشعارات"""
    SOCIAL = "social"           # الإعجابات والتعليقات والمتابعة
    MESSAGES = "messages"       # الرسائل
    STORIES = "stories"         # القصص
    MENTIONS = "mentions"       # الإشارات
    SYSTEM = "system"           # الإشعارات النظامية


class NotificationPriority(str, Enum):
    """أولويات الإشعارات"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class AnimationType(str, Enum):
    """أنواع التحريكات"""
    SLIDE_IN = "slide_in"
    FADE_IN = "fade_in"
    BOUNCE = "bounce"
    SCALE = "scale"
    FLIP = "flip"


@dataclass
class NotificationBadge:
    """شارة الإشعار (Live Badge)"""
    count: int = 0
    category: NotificationCategory = NotificationCategory.SOCIAL
    last_updated: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    is_animated: bool = False


@dataclass
class Notification:
    """نموذج الإشعار"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    type: NotificationType = NotificationType.SYSTEM
    category: NotificationCategory = NotificationCategory.SYSTEM
    title: str = ""
    body: str = ""
    actor_id: str = ""
    actor_name: str = ""
    actor_avatar: str = ""
    target_id: str = ""
    target_type: str = ""  # post, story, user, etc
    priority: NotificationPriority = NotificationPriority.NORMAL
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    is_read: bool = False
    is_grouped: bool = False
    group_id: str = ""
    group_count: int = 1
    animation: AnimationType = AnimationType.SLIDE_IN
    action_url: str = ""
    metadata: Dict = field(default_factory=dict)


@dataclass
class NotificationGroup:
    """مجموعة الإشعارات"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    category: NotificationCategory = NotificationCategory.SOCIAL
    type: NotificationType = NotificationType.SYSTEM
    notifications: List[Notification] = field(default_factory=list)
    count: int = 0
    first_actor: str = ""
    other_actors_count: int = 0
    last_updated: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    summary: str = ""


# ============ إدارة الإشعارات ============

class NotificationManager:
    """مدير الإشعارات المتقدم"""
    
    def __init__(self):
        self.notifications: Dict[str, List[Notification]] = defaultdict(list)
        self.grouped_notifications: Dict[str, List[NotificationGroup]] = defaultdict(list)
        self.badges: Dict[str, Dict[NotificationCategory, NotificationBadge]] = defaultdict(
            lambda: {cat: NotificationBadge(category=cat) for cat in NotificationCategory}
        )
        self.connected_users: Set[str] = set()
        self.user_websockets: Dict[str, Set[WebSocket]] = defaultdict(set)
    
    def create_notification(
        self,
        user_id: str,
        notif_type: NotificationType,
        category: NotificationCategory,
        title: str,
        body: str,
        actor_id: str,
        actor_name: str,
        actor_avatar: str = "",
        target_id: str = "",
        target_type: str = "",
        priority: NotificationPriority = NotificationPriority.NORMAL,
        animation: AnimationType = AnimationType.SLIDE_IN,
        metadata: Dict = None
    ) -> Notification:
        """إنشاء إشعار جديد"""
        notification = Notification(
            user_id=user_id,
            type=notif_type,
            category=category,
            title=title,
            body=body,
            actor_id=actor_id,
            actor_name=actor_name,
            actor_avatar=actor_avatar,
            target_id=target_id,
            target_type=target_type,
            priority=priority,
            animation=animation,
            metadata=metadata or {}
        )
        return notification
    
    def group_notifications(self, user_id: str) -> List[NotificationGroup]:
        """تجميع الإشعارات حسب النوع والفئة"""
        user_notifications = self.notifications.get(user_id, [])
        grouped = defaultdict(lambda: {
            'notifications': [],
            'actors': set(),
            'category': None,
            'type': None
        })
        
        # تجميع الإشعارات غير المقروءة
        for notif in user_notifications:
            if not notif.is_read:
                key = f"{notif.category}_{notif.type}"
                grouped[key]['notifications'].append(notif)
                grouped[key]['actors'].add(notif.actor_name)
                grouped[key]['category'] = notif.category
                grouped[key]['type'] = notif.type
        
        # إنشاء مجموعات
        groups = []
        for key, data in grouped.items():
            if data['notifications']:
                group = NotificationGroup(
                    user_id=user_id,
                    category=data['category'],
                    type=data['type'],
                    notifications=data['notifications'],
                    count=len(data['notifications']),
                    first_actor=data['notifications'][0].actor_name,
                    other_actors_count=max(0, len(data['actors']) - 1),
                    summary=self._generate_group_summary(
                        data['type'],
                        data['notifications'],
                        data['actors']
                    )
                )
                groups.append(group)
        
        self.grouped_notifications[user_id] = groups
        return groups
    
    def _generate_group_summary(
        self,
        notif_type: NotificationType,
        notifications: List[Notification],
        actors: Set[str]
    ) -> str:
        """توليد ملخص المجموعة"""
        count = len(notifications)
        actors_list = list(actors)
        
        if notif_type == NotificationType.LIKE:
            if count == 1:
                return f"{actors_list[0]} أعجب بمنشورك"
            else:
                return f"{actors_list[0]} و {count - 1} آخرين أعجبوا بمنشورك"
        
        elif notif_type == NotificationType.COMMENT:
            if count == 1:
                return f"{actors_list[0]} علّق على منشورك"
            else:
                return f"{actors_list[0]} و {count - 1} آخرين علّقوا على منشورك"
        
        elif notif_type == NotificationType.FOLLOW:
            if count == 1:
                return f"{actors_list[0]} بدأ متابعتك"
            else:
                return f"{actors_list[0]} و {count - 1} آخرين بدأوا متابعتك"
        
        elif notif_type == NotificationType.STORY_VIEW:
            if count == 1:
                return f"{actors_list[0]} شاهد قصتك"
            else:
                return f"{actors_list[0]} و {count - 1} آخرين شاهدوا قصتك"
        
        else:
            return f"لديك {count} إشعارات جديدة"
    
    def update_badges(self, user_id: str):
        """تحديث الشارات الحية"""
        user_notifications = self.notifications.get(user_id, [])
        
        # إعادة تعيين الشارات
        for category in NotificationCategory:
            self.badges[user_id][category] = NotificationBadge(category=category)
        
        # حساب الإشعارات غير المقروءة لكل فئة
        for notif in user_notifications:
            if not notif.is_read:
                self.badges[user_id][notif.category].count += 1
                self.badges[user_id][notif.category].is_animated = True
                self.badges[user_id][notif.category].last_updated = datetime.utcnow().isoformat()
    
    def mark_as_read(self, user_id: str, notification_id: str):
        """وضع علامة على الإشعار كمقروء"""
        user_notifications = self.notifications.get(user_id, [])
        for notif in user_notifications:
            if notif.id == notification_id:
                notif.is_read = True
                self.update_badges(user_id)
                return True
        return False
    
    def mark_category_as_read(self, user_id: str, category: NotificationCategory):
        """وضع علامة على جميع إشعارات الفئة كمقروءة"""
        user_notifications = self.notifications.get(user_id, [])
        for notif in user_notifications:
            if notif.category == category:
                notif.is_read = True
        self.update_badges(user_id)
    
    def get_user_badges(self, user_id: str) -> Dict[str, NotificationBadge]:
        """الحصول على شارات المستخدم"""
        return {
            cat.value: asdict(badge)
            for cat, badge in self.badges[user_id].items()
        }
    
    def get_notifications(
        self,
        user_id: str,
        category: Optional[NotificationCategory] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict]:
        """الحصول على الإشعارات"""
        user_notifications = self.notifications.get(user_id, [])
        
        if category:
            user_notifications = [
                n for n in user_notifications
                if n.category == category
            ]
        
        # ترتيب حسب الوقت (الأحدث أولاً)
        user_notifications.sort(
            key=lambda x: x.timestamp,
            reverse=True
        )
        
        paginated = user_notifications[offset:offset + limit]
        return [asdict(n) for n in paginated]
    
    def delete_notification(self, user_id: str, notification_id: str) -> bool:
        """حذف إشعار"""
        user_notifications = self.notifications.get(user_id, [])
        for i, notif in enumerate(user_notifications):
            if notif.id == notification_id:
                user_notifications.pop(i)
                self.update_badges(user_id)
                return True
        return False
    
    def clear_category(self, user_id: str, category: NotificationCategory) -> int:
        """حذف جميع إشعارات الفئة"""
        user_notifications = self.notifications.get(user_id, [])
        initial_count = len(user_notifications)
        
        self.notifications[user_id] = [
            n for n in user_notifications
            if n.category != category
        ]
        
        self.update_badges(user_id)
        return initial_count - len(self.notifications[user_id])


# ============ تطبيق FastAPI ============

app = FastAPI(
    title="Yamshat Advanced Notification Service",
    description="نظام إشعارات متقدم مع التجميع والتصنيف والتحريكات",
    version="3.0.0"
)

# إضافة CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# مدير الإشعارات
notification_manager = NotificationManager()


# ============ المسارات (Routes) ============

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "notification-service",
        "version": "3.0.0"
    }


@app.post("/notify")
async def create_notification(
    user_id: str,
    notif_type: NotificationType,
    category: NotificationCategory,
    title: str,
    body: str,
    actor_id: str,
    actor_name: str,
    actor_avatar: str = "",
    target_id: str = "",
    target_type: str = "",
    priority: NotificationPriority = NotificationPriority.NORMAL,
    animation: AnimationType = AnimationType.SLIDE_IN,
    metadata: Optional[Dict] = None
):
    """إنشاء إشعار جديد"""
    try:
        notification = notification_manager.create_notification(
            user_id=user_id,
            notif_type=notif_type,
            category=category,
            title=title,
            body=body,
            actor_id=actor_id,
            actor_name=actor_name,
            actor_avatar=actor_avatar,
            target_id=target_id,
            target_type=target_type,
            priority=priority,
            animation=animation,
            metadata=metadata
        )
        
        notification_manager.notifications[user_id].append(notification)
        notification_manager.update_badges(user_id)
        
        logger.info(f"✅ Notification created for {user_id}: {title}")
        
        return {
            "success": True,
            "notification": asdict(notification),
            "badges": notification_manager.get_user_badges(user_id)
        }
    
    except Exception as e:
        logger.error(f"❌ Error creating notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/notifications/{user_id}")
async def get_notifications(
    user_id: str,
    category: Optional[NotificationCategory] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """الحصول على الإشعارات"""
    try:
        notifications = notification_manager.get_notifications(
            user_id=user_id,
            category=category,
            limit=limit,
            offset=offset
        )
        
        total = len(notification_manager.notifications.get(user_id, []))
        
        return {
            "success": True,
            "total": total,
            "limit": limit,
            "offset": offset,
            "notifications": notifications
        }
    
    except Exception as e:
        logger.error(f"❌ Error fetching notifications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/notifications/{user_id}/grouped")
async def get_grouped_notifications(user_id: str):
    """الحصول على الإشعارات المجمعة"""
    try:
        groups = notification_manager.group_notifications(user_id)
        
        return {
            "success": True,
            "groups": [asdict(g) for g in groups],
            "total_groups": len(groups),
            "total_notifications": sum(g.count for g in groups)
        }
    
    except Exception as e:
        logger.error(f"❌ Error fetching grouped notifications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/badges/{user_id}")
async def get_badges(user_id: str):
    """الحصول على الشارات الحية"""
    try:
        badges = notification_manager.get_user_badges(user_id)
        total_unread = sum(
            badge.get("count", 0) for badge in badges.values()
        )
        
        return {
            "success": True,
            "badges": badges,
            "total_unread": total_unread
        }
    
    except Exception as e:
        logger.error(f"❌ Error fetching badges: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/notifications/{user_id}/{notification_id}/read")
async def mark_notification_as_read(user_id: str, notification_id: str):
    """وضع علامة على الإشعار كمقروء"""
    try:
        success = notification_manager.mark_as_read(user_id, notification_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {
            "success": True,
            "badges": notification_manager.get_user_badges(user_id)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error marking notification as read: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/notifications/{user_id}/category/{category}/read")
async def mark_category_as_read(user_id: str, category: NotificationCategory):
    """وضع علامة على جميع إشعارات الفئة كمقروءة"""
    try:
        notification_manager.mark_category_as_read(user_id, category)
        
        return {
            "success": True,
            "badges": notification_manager.get_user_badges(user_id)
        }
    
    except Exception as e:
        logger.error(f"❌ Error marking category as read: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/notifications/{user_id}/{notification_id}")
async def delete_notification(user_id: str, notification_id: str):
    """حذف إشعار"""
    try:
        success = notification_manager.delete_notification(user_id, notification_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {
            "success": True,
            "badges": notification_manager.get_user_badges(user_id)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/notifications/{user_id}/category/{category}")
async def clear_category(user_id: str, category: NotificationCategory):
    """حذف جميع إشعارات الفئة"""
    try:
        deleted_count = notification_manager.clear_category(user_id, category)
        
        return {
            "success": True,
            "deleted_count": deleted_count,
            "badges": notification_manager.get_user_badges(user_id)
        }
    
    except Exception as e:
        logger.error(f"❌ Error clearing category: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/notifications/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: str):
    """WebSocket للإشعارات الفورية"""
    await websocket.accept()
    notification_manager.user_websockets[user_id].add(websocket)
    notification_manager.connected_users.add(user_id)
    
    logger.info(f"✅ User {user_id} connected to WebSocket")
    
    try:
        while True:
            data = await websocket.receive_text()
            # يمكن استخدام هذا للتحكم في الاتصال
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    
    except Exception as e:
        logger.error(f"❌ WebSocket error for {user_id}: {str(e)}")
    
    finally:
        notification_manager.user_websockets[user_id].discard(websocket)
        if not notification_manager.user_websockets[user_id]:
            notification_manager.connected_users.discard(user_id)
        logger.info(f"❌ User {user_id} disconnected from WebSocket")


@app.get("/stats")
async def get_stats():
    """إحصائيات الخدمة"""
    total_notifications = sum(
        len(notifs) for notifs in notification_manager.notifications.values()
    )
    
    return {
        "total_users": len(notification_manager.notifications),
        "total_notifications": total_notifications,
        "connected_users": len(notification_manager.connected_users),
        "active_websockets": sum(
            len(sockets) for sockets in notification_manager.user_websockets.values()
        )
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
