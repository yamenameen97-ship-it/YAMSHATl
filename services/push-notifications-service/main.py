"""خدمة Push Notifications - Push Notifications Service
يوفر:
- Firebase Cloud Messaging (FCM)
- Apple Push Notification Service (APNS)
- إدارة أجهزة المستخدمين (Device Management)
- جدولة الإشعارات (Notification Scheduling)
- تتبع الإشعارات (Notification Tracking)
"""

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Set
from dataclasses import dataclass, asdict, field
from enum import Enum
import logging
import uuid
import json
import asyncio
from collections import defaultdict

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Yamshat Push Notifications Service",
    description="خدمة الإشعارات الفورية مع FCM و APNS",
    version="1.0.0"
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
    MESSAGE = "message"
    CALL = "call"
    LIKE = "like"
    COMMENT = "comment"
    FOLLOW = "follow"
    MENTION = "mention"
    SYSTEM = "system"
    PROMOTION = "promotion"


class PlatformType(str, Enum):
    """أنواع المنصات"""
    ANDROID = "android"
    IOS = "ios"
    WEB = "web"
    WINDOWS = "windows"


class NotificationStatus(str, Enum):
    """حالات الإشعار"""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    FAILED = "failed"
    EXPIRED = "expired"


class DeviceStatus(str, Enum):
    """حالات الجهاز"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    UNREGISTERED = "unregistered"


@dataclass
class UserDevice:
    """جهاز المستخدم"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    device_token: str = ""
    platform: PlatformType = PlatformType.ANDROID
    device_name: str = ""
    os_version: str = ""
    app_version: str = ""
    status: DeviceStatus = DeviceStatus.ACTIVE
    is_notifications_enabled: bool = True
    registered_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    last_active_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    metadata: Dict = field(default_factory=dict)


@dataclass
class PushNotification:
    """إشعار فوري"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    notification_type: NotificationType = NotificationType.SYSTEM
    title: str = ""
    body: str = ""
    data: Dict = field(default_factory=dict)
    image_url: Optional[str] = None
    action_url: Optional[str] = None
    priority: str = "high"  # high, normal, low
    status: NotificationStatus = NotificationStatus.PENDING
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    sent_at: Optional[str] = None
    delivered_at: Optional[str] = None
    opened_at: Optional[str] = None
    failed_at: Optional[str] = None
    failure_reason: Optional[str] = None
    scheduled_for: Optional[str] = None
    expires_at: Optional[str] = None
    devices_sent: int = 0
    devices_delivered: int = 0
    devices_opened: int = 0


@dataclass
class NotificationTemplate:
    """قالب الإشعار"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    notification_type: NotificationType = NotificationType.SYSTEM
    title_template: str = ""
    body_template: str = ""
    image_url: Optional[str] = None
    action_url: Optional[str] = None
    priority: str = "high"
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class NotificationPreference:
    """تفضيلات الإشعارات"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    notification_types_enabled: List[NotificationType] = field(default_factory=list)
    quiet_hours_start: Optional[str] = None  # HH:MM
    quiet_hours_end: Optional[str] = None    # HH:MM
    quiet_hours_enabled: bool = False
    allow_vibration: bool = True
    allow_sound: bool = True
    allow_led: bool = True
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


# ============ مدير الإشعارات الفورية ============

class PushNotificationsManager:
    """مدير الإشعارات الفورية"""

    def __init__(self):
        # أجهزة المستخدمين
        self.user_devices: Dict[str, List[UserDevice]] = defaultdict(list)
        
        # الإشعارات
        self.notifications: Dict[str, PushNotification] = {}
        
        # قوالب الإشعارات
        self.templates: Dict[str, NotificationTemplate] = {}
        
        # تفضيلات الإشعارات
        self.preferences: Dict[str, NotificationPreference] = {}
        
        # سجل الإشعارات
        self.notification_history: List[PushNotification] = []
        
        # مهام الجدولة
        self.scheduled_tasks: Dict[str, asyncio.Task] = {}
        
        # تهيئة التفضيلات الافتراضية
        self._initialize_default_preferences()

    def _initialize_default_preferences(self):
        """تهيئة التفضيلات الافتراضية"""
        # يمكن إضافة تفضيلات افتراضية هنا
        pass

    async def register_device(
        self,
        user_id: str,
        device_token: str,
        platform: PlatformType,
        device_name: str = "",
        os_version: str = "",
        app_version: str = ""
    ) -> UserDevice:
        """تسجيل جهاز جديد"""
        # التحقق من عدم وجود الجهاز بالفعل
        existing_device = next(
            (d for d in self.user_devices[user_id] if d.device_token == device_token),
            None
        )
        
        if existing_device:
            existing_device.status = DeviceStatus.ACTIVE
            existing_device.last_active_at = datetime.utcnow().isoformat()
            logger.info(f"Device reactivated for user {user_id}: {device_token}")
            return existing_device
        
        device = UserDevice(
            user_id=user_id,
            device_token=device_token,
            platform=platform,
            device_name=device_name,
            os_version=os_version,
            app_version=app_version
        )
        
        self.user_devices[user_id].append(device)
        logger.info(f"Device registered for user {user_id}: {platform.value}")
        return device

    async def unregister_device(self, user_id: str, device_token: str) -> bool:
        """إلغاء تسجيل جهاز"""
        if user_id not in self.user_devices:
            return False
        
        for device in self.user_devices[user_id]:
            if device.device_token == device_token:
                device.status = DeviceStatus.UNREGISTERED
                self.user_devices[user_id].remove(device)
                logger.info(f"Device unregistered for user {user_id}")
                return True
        
        return False

    async def send_notification(
        self,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        body: str,
        data: Dict = None,
        image_url: Optional[str] = None,
        action_url: Optional[str] = None,
        priority: str = "high",
        scheduled_for: Optional[str] = None
    ) -> PushNotification:
        """إرسال إشعار"""
        notification = PushNotification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            body=body,
            data=data or {},
            image_url=image_url,
            action_url=action_url,
            priority=priority,
            scheduled_for=scheduled_for,
            expires_at=(
                (datetime.utcnow() + timedelta(days=7)).isoformat()
                if not scheduled_for else None
            )
        )
        
        self.notifications[notification.id] = notification
        
        # إذا كان الإشعار مجدول، أضفه إلى قائمة الجدولة
        if scheduled_for:
            await self._schedule_notification(notification)
        else:
            # إرسال فوري
            await self._send_to_devices(notification)
        
        logger.info(f"Notification created for user {user_id}: {notification.id}")
        return notification

    async def _send_to_devices(self, notification: PushNotification):
        """إرسال الإشعار إلى أجهزة المستخدم"""
        if notification.user_id not in self.user_devices:
            notification.status = NotificationStatus.FAILED
            notification.failure_reason = "No devices registered"
            return
        
        devices = self.user_devices[notification.user_id]
        notification.status = NotificationStatus.SENT
        notification.sent_at = datetime.utcnow().isoformat()
        
        for device in devices:
            if device.status != DeviceStatus.ACTIVE:
                continue
            
            try:
                # محاكاة إرسال الإشعار
                await self._send_to_device(notification, device)
                notification.devices_sent += 1
            except Exception as e:
                logger.error(f"Error sending notification to device {device.id}: {str(e)}")
        
        # إضافة إلى السجل
        self.notification_history.append(notification)

    async def _send_to_device(self, notification: PushNotification, device: UserDevice):
        """إرسال الإشعار إلى جهاز محدد"""
        # هنا يتم التكامل مع FCM أو APNS
        # للآن، نحاكي الإرسال
        
        if device.platform == PlatformType.ANDROID:
            # إرسال عبر FCM
            await self._send_via_fcm(notification, device)
        elif device.platform == PlatformType.IOS:
            # إرسال عبر APNS
            await self._send_via_apns(notification, device)
        elif device.platform == PlatformType.WEB:
            # إرسال عبر Web Push
            await self._send_via_web_push(notification, device)
        
        notification.devices_delivered += 1

    async def _send_via_fcm(self, notification: PushNotification, device: UserDevice):
        """إرسال عبر Firebase Cloud Messaging"""
        # يتم استبدال هذا بـ FCM SDK الفعلي
        logger.info(f"Sending notification via FCM to device {device.id}")
        await asyncio.sleep(0.1)  # محاكاة التأخير

    async def _send_via_apns(self, notification: PushNotification, device: UserDevice):
        """إرسال عبر Apple Push Notification Service"""
        # يتم استبدال هذا بـ APNS SDK الفعلي
        logger.info(f"Sending notification via APNS to device {device.id}")
        await asyncio.sleep(0.1)  # محاكاة التأخير

    async def _send_via_web_push(self, notification: PushNotification, device: UserDevice):
        """إرسال عبر Web Push"""
        logger.info(f"Sending notification via Web Push to device {device.id}")
        await asyncio.sleep(0.1)  # محاكاة التأخير

    async def _schedule_notification(self, notification: PushNotification):
        """جدولة الإشعار"""
        scheduled_time = datetime.fromisoformat(notification.scheduled_for)
        delay = (scheduled_time - datetime.utcnow()).total_seconds()
        
        if delay <= 0:
            await self._send_to_devices(notification)
            return
        
        async def delayed_send():
            await asyncio.sleep(delay)
            await self._send_to_devices(notification)
        
        task = asyncio.create_task(delayed_send())
        self.scheduled_tasks[notification.id] = task
        logger.info(f"Notification scheduled: {notification.id} (in {delay}s)")

    async def mark_as_delivered(self, notification_id: str) -> bool:
        """تحديد الإشعار كمُسلّم"""
        if notification_id not in self.notifications:
            return False
        
        notification = self.notifications[notification_id]
        notification.status = NotificationStatus.DELIVERED
        notification.delivered_at = datetime.utcnow().isoformat()
        return True

    async def mark_as_opened(self, notification_id: str) -> bool:
        """تحديد الإشعار كمفتوح"""
        if notification_id not in self.notifications:
            return False
        
        notification = self.notifications[notification_id]
        notification.status = NotificationStatus.OPENED
        notification.opened_at = datetime.utcnow().isoformat()
        notification.devices_opened += 1
        return True

    async def set_preferences(
        self,
        user_id: str,
        notification_types_enabled: List[NotificationType],
        quiet_hours_start: Optional[str] = None,
        quiet_hours_end: Optional[str] = None,
        quiet_hours_enabled: bool = False,
        allow_vibration: bool = True,
        allow_sound: bool = True,
        allow_led: bool = True
    ) -> NotificationPreference:
        """تعيين تفضيلات الإشعارات"""
        preference = NotificationPreference(
            user_id=user_id,
            notification_types_enabled=notification_types_enabled,
            quiet_hours_start=quiet_hours_start,
            quiet_hours_end=quiet_hours_end,
            quiet_hours_enabled=quiet_hours_enabled,
            allow_vibration=allow_vibration,
            allow_sound=allow_sound,
            allow_led=allow_led
        )
        
        self.preferences[user_id] = preference
        logger.info(f"Preferences updated for user {user_id}")
        return preference

    def get_user_devices(self, user_id: str) -> List[Dict]:
        """الحصول على أجهزة المستخدم"""
        if user_id not in self.user_devices:
            return []
        
        return [asdict(device) for device in self.user_devices[user_id]]

    def get_notification(self, notification_id: str) -> Optional[Dict]:
        """الحصول على معلومات الإشعار"""
        if notification_id not in self.notifications:
            return None
        
        return asdict(self.notifications[notification_id])

    def get_user_notifications(
        self,
        user_id: str,
        limit: int = 50,
        status: Optional[NotificationStatus] = None
    ) -> List[Dict]:
        """الحصول على إشعارات المستخدم"""
        notifications = [
            n for n in self.notification_history
            if n.user_id == user_id and (status is None or n.status == status)
        ]
        
        return [asdict(n) for n in notifications[-limit:]]

    def get_notification_stats(self, user_id: str) -> Dict:
        """الحصول على إحصائيات الإشعارات"""
        user_notifications = [n for n in self.notification_history if n.user_id == user_id]
        
        return {
            "total": len(user_notifications),
            "sent": sum(1 for n in user_notifications if n.status == NotificationStatus.SENT),
            "delivered": sum(1 for n in user_notifications if n.status == NotificationStatus.DELIVERED),
            "opened": sum(1 for n in user_notifications if n.status == NotificationStatus.OPENED),
            "failed": sum(1 for n in user_notifications if n.status == NotificationStatus.FAILED)
        }


# ============ مثيل مدير الإشعارات ============

notifications_manager = PushNotificationsManager()


# ============ المسارات (Routes) ============

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "push-notifications-service",
        "version": "1.0.0",
        "total_notifications": len(notifications_manager.notifications)
    }


@app.post("/devices/register")
async def register_device(
    user_id: str = Query(...),
    device_token: str = Query(...),
    platform: PlatformType = Query(...),
    device_name: str = Query(""),
    os_version: str = Query(""),
    app_version: str = Query("")
):
    """تسجيل جهاز جديد"""
    try:
        device = await notifications_manager.register_device(
            user_id,
            device_token,
            platform,
            device_name,
            os_version,
            app_version
        )
        return {
            "success": True,
            "device_id": device.id,
            "device": asdict(device)
        }
    except Exception as e:
        logger.error(f"Error registering device: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/devices/unregister")
async def unregister_device(
    user_id: str = Query(...),
    device_token: str = Query(...)
):
    """إلغاء تسجيل جهاز"""
    try:
        if await notifications_manager.unregister_device(user_id, device_token):
            return {"success": True, "message": "تم إلغاء تسجيل الجهاز"}
        else:
            raise HTTPException(status_code=404, detail="الجهاز غير موجود")
    except Exception as e:
        logger.error(f"Error unregistering device: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/users/{user_id}/devices")
async def get_user_devices(user_id: str):
    """الحصول على أجهزة المستخدم"""
    try:
        devices = notifications_manager.get_user_devices(user_id)
        return {"success": True, "devices": devices}
    except Exception as e:
        logger.error(f"Error getting user devices: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/notifications/send")
async def send_notification(
    user_id: str = Query(...),
    notification_type: NotificationType = Query(...),
    title: str = Query(...),
    body: str = Query(...),
    image_url: Optional[str] = Query(None),
    action_url: Optional[str] = Query(None),
    priority: str = Query("high"),
    scheduled_for: Optional[str] = Query(None),
    background_tasks: BackgroundTasks = None
):
    """إرسال إشعار"""
    try:
        notification = await notifications_manager.send_notification(
            user_id,
            notification_type,
            title,
            body,
            {},
            image_url,
            action_url,
            priority,
            scheduled_for
        )
        return {
            "success": True,
            "notification_id": notification.id,
            "notification": asdict(notification)
        }
    except Exception as e:
        logger.error(f"Error sending notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/notifications/{notification_id}")
async def get_notification(notification_id: str):
    """الحصول على معلومات الإشعار"""
    try:
        notification = notifications_manager.get_notification(notification_id)
        if notification:
            return {"success": True, "notification": notification}
        else:
            raise HTTPException(status_code=404, detail="الإشعار غير موجود")
    except Exception as e:
        logger.error(f"Error getting notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/notifications/{notification_id}/delivered")
async def mark_as_delivered(notification_id: str):
    """تحديد الإشعار كمُسلّم"""
    try:
        if await notifications_manager.mark_as_delivered(notification_id):
            return {"success": True, "message": "تم تحديث حالة الإشعار"}
        else:
            raise HTTPException(status_code=404, detail="الإشعار غير موجود")
    except Exception as e:
        logger.error(f"Error marking notification as delivered: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/notifications/{notification_id}/opened")
async def mark_as_opened(notification_id: str):
    """تحديد الإشعار كمفتوح"""
    try:
        if await notifications_manager.mark_as_opened(notification_id):
            return {"success": True, "message": "تم تحديث حالة الإشعار"}
        else:
            raise HTTPException(status_code=404, detail="الإشعار غير موجود")
    except Exception as e:
        logger.error(f"Error marking notification as opened: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/users/{user_id}/notifications")
async def get_user_notifications(
    user_id: str,
    limit: int = Query(50),
    status: Optional[NotificationStatus] = Query(None)
):
    """الحصول على إشعارات المستخدم"""
    try:
        notifications = notifications_manager.get_user_notifications(user_id, limit, status)
        return {"success": True, "notifications": notifications}
    except Exception as e:
        logger.error(f"Error getting user notifications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/users/{user_id}/notifications/stats")
async def get_notification_stats(user_id: str):
    """الحصول على إحصائيات الإشعارات"""
    try:
        stats = notifications_manager.get_notification_stats(user_id)
        return {"success": True, "stats": stats}
    except Exception as e:
        logger.error(f"Error getting notification stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/preferences")
async def set_preferences(
    user_id: str = Query(...),
    notification_types_enabled: List[NotificationType] = Query(...),
    quiet_hours_start: Optional[str] = Query(None),
    quiet_hours_end: Optional[str] = Query(None),
    quiet_hours_enabled: bool = Query(False),
    allow_vibration: bool = Query(True),
    allow_sound: bool = Query(True),
    allow_led: bool = Query(True)
):
    """تعيين تفضيلات الإشعارات"""
    try:
        preference = await notifications_manager.set_preferences(
            user_id,
            notification_types_enabled,
            quiet_hours_start,
            quiet_hours_end,
            quiet_hours_enabled,
            allow_vibration,
            allow_sound,
            allow_led
        )
        return {
            "success": True,
            "preference": asdict(preference)
        }
    except Exception as e:
        logger.error(f"Error setting preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
