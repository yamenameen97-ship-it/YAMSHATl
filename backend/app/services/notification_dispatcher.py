"""
موزّع الإشعارات الموحَّد - Notification Dispatcher.

نقطة الدخول الوحيدة لإنشاء أي إشعار في النظام.
عند الاستدعاء يقوم بـ:
  1) حفظ الإشعار في قاعدة البيانات (Persistence)
  2) بثّه فوراً عبر WebSocket / Redis Pub/Sub (Realtime)
  3) إرسال Push Notification لكل أجهزة المستخدم النشطة (FCM/APNS/WebPush)
  4) تسجيل تفاصيل التسليم (Delivery Tracking)

هذا التصميم يضمن أن أي مكان يستدعي create_notification سيحصل المستخدم
على الإشعار فوراً، تماماً كما تعمل Instagram/Twitter/WhatsApp.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User
from app.services.device_service import (
    get_active_devices,
    mark_device_delivered,
    mark_device_failed,
)
from app.services.realtime_hub import realtime_hub

logger = logging.getLogger(__name__)


# ============ خيارات أنواع الإشعارات ============

NOTIFICATION_TYPES = {
    "new_message": ("رسالة جديدة", "messages"),
    "new_follow": ("متابع جديد", "social"),
    "new_like": ("إعجاب جديد", "social"),
    "new_comment": ("تعليق جديد", "social"),
    "new_share": ("مشاركة جديدة", "social"),
    "new_mention": ("إشارة جديدة", "mentions"),
    "mention": ("إشارة جديدة", "mentions"),
    "gift_received": ("هدية جديدة", "social"),
    "story_view": ("مشاهدة قصة", "stories"),
    "story_reply": ("رد على قصة", "stories"),
    "live_started": ("بث مباشر", "social"),
    "group_invite": ("دعوة مجموعة", "social"),
    "call_missed": ("مكالمة فائتة", "messages"),
    "system_alert": ("تنبيه نظام", "system"),
    "admin_action": ("إجراء إداري", "system"),
}


# ============ Avatar URL Helper ============

def _resolve_avatar(user: Optional[User]) -> str:
    """استخراج رابط الصورة الرمزية مع التراجع الآمن."""
    if not user:
        return ""
    for attr in ("avatar_url", "avatar", "profile_image", "photo_url"):
        value = getattr(user, attr, None)
        if value:
            return str(value)
    return ""


# ============ Push Sender (FCM / APNS / WebPush) ============

async def _send_push_to_devices(
    db: Session,
    user_id: int,
    title: str,
    body: str,
    payload: Dict[str, Any],
) -> Dict[str, int]:
    """إرسال Push لكل أجهزة المستخدم النشطة."""
    stats = {"attempted": 0, "delivered": 0, "failed": 0}

    devices = get_active_devices(db, user_id)
    if not devices:
        return stats

    # نحاول تحميل محرّك الدفع - إن فشل نتجاوز بدون كسر التدفق
    try:
        from app.services.push_service import PushNotificationEngine
        engine = PushNotificationEngine()
    except Exception as exc:
        logger.warning("push_engine_unavailable err=%s", exc)
        return stats

    push_data = {
        "type": payload.get("type", "generic"),
        "notification_id": str(payload.get("id", "")),
        "category": payload.get("category", ""),
        "action_url": payload.get("action_url", ""),
        "actor_id": str(payload.get("actor_id", "")),
        "target_id": str(payload.get("target_id", "")),
    }

    for device in devices:
        stats["attempted"] += 1
        try:
            ok = await engine.send_with_retry(
                device.push_token,
                title,
                body,
                push_data,
            )
            if ok:
                stats["delivered"] += 1
                mark_device_delivered(db, device.id)
            else:
                stats["failed"] += 1
                mark_device_failed(db, device.id)
        except Exception as exc:
            logger.warning(
                "push_send_failed user_id=%s device_id=%s err=%s",
                user_id, device.device_id, exc,
            )
            stats["failed"] += 1
            mark_device_failed(db, device.id)

    return stats


# ============ Preference Check ============

def _is_type_allowed(db: Session, user_id: int, notif_type: str) -> bool:
    """فحص تفضيلات المستخدم - هل يسمح بهذا النوع؟"""
    try:
        from app.models.user_preference import UserPreference
        pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        if not pref:
            return True
        if notif_type == "new_message" and getattr(pref, "notify_messages", True) is False:
            return False
        if notif_type in ("new_like", "new_comment", "new_share", "mention", "new_mention"):
            if getattr(pref, "notify_posts", True) is False:
                return False
        return True
    except Exception:
        return True


# ============ Main Dispatch ============

async def dispatch_notification(
    db: Session,
    *,
    user_id: int,
    notif_type: str,
    title: str,
    body: str,
    actor: Optional[User] = None,
    target_id: Optional[int] = None,
    target_type: Optional[str] = None,
    action_url: Optional[str] = None,
    extra_data: Optional[Dict[str, Any]] = None,
    send_push: bool = True,
) -> Optional[Dict[str, Any]]:
    """
    نقطة الدخول الوحيدة لأي إشعار في النظام.

    Flow:
        1. تحقق من تفضيلات المستخدم
        2. احفظ في DB
        3. ابثّه عبر WebSocket فوراً
        4. أرسله عبر Push للأجهزة غير المتصلة
    """
    if notif_type not in NOTIFICATION_TYPES:
        logger.warning("dispatch_invalid_type type=%s", notif_type)
        return None

    if not _is_type_allowed(db, user_id, notif_type):
        logger.info("notification_suppressed_by_pref user_id=%s type=%s", user_id, notif_type)
        return None

    _label, category = NOTIFICATION_TYPES[notif_type]

    data = dict(extra_data or {})
    if actor is not None:
        data.setdefault("actor_id", actor.id)
        data.setdefault("actor_username", getattr(actor, "username", ""))
        data.setdefault("actor_avatar", _resolve_avatar(actor))
    if target_id is not None:
        data.setdefault("target_id", target_id)
    if target_type:
        data.setdefault("target_type", target_type)
    if action_url:
        data.setdefault("action_url", action_url)

    # 1) حفظ في DB
    notification = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        body=body,
        data=data,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    payload: Dict[str, Any] = {
        "id": notification.id,
        "type": notif_type,
        "category": category,
        "title": title,
        "body": body,
        "data": data,
        "actor_id": data.get("actor_id"),
        "actor_username": data.get("actor_username"),
        "actor_avatar": data.get("actor_avatar"),
        "target_id": data.get("target_id"),
        "target_type": data.get("target_type"),
        "action_url": data.get("action_url"),
        "is_read": False,
        "created_at": notification.created_at.isoformat()
            if notification.created_at else datetime.utcnow().isoformat(),
    }

    # 2) بث WebSocket لحظي
    try:
        delivered_ws = await realtime_hub.publish(user_id, payload)
        payload["ws_delivered_to"] = delivered_ws
    except Exception as exc:
        logger.error("ws_publish_failed user_id=%s err=%s", user_id, exc)
        delivered_ws = 0

    # 3) Push للأجهزة (في خلفية لا تعطّل الاستجابة)
    push_stats: Dict[str, int] = {"attempted": 0, "delivered": 0, "failed": 0}
    if send_push:
        try:
            push_stats = await _send_push_to_devices(
                db, user_id, title, body, payload
            )
        except Exception as exc:
            logger.error("push_dispatch_failed user_id=%s err=%s", user_id, exc)

    logger.info(
        "notification_dispatched user_id=%s type=%s ws=%s push_ok=%s push_fail=%s",
        user_id, notif_type, delivered_ws,
        push_stats.get("delivered", 0), push_stats.get("failed", 0),
    )

    payload["push_stats"] = push_stats
    return payload


def dispatch_notification_sync(
    db: Session,
    **kwargs: Any,
) -> Optional[Dict[str, Any]]:
    """واجهة متزامنة لمن يستدعي من سياق sync."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # ضع المهمة في الخلفية ولا تعطّل الاستدعاء
            asyncio.ensure_future(dispatch_notification(db, **kwargs))
            return {"queued": True}
        return loop.run_until_complete(dispatch_notification(db, **kwargs))
    except RuntimeError:
        return asyncio.run(dispatch_notification(db, **kwargs))


# ============ Broadcast ============

async def broadcast_system_notification(
    db: Session,
    user_ids: List[int],
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
) -> Dict[str, int]:
    """بث إشعار نظامي لقائمة مستخدمين دفعة واحدة."""
    stats = {"total": len(user_ids), "delivered": 0}
    for uid in user_ids:
        try:
            await dispatch_notification(
                db,
                user_id=uid,
                notif_type="system_alert",
                title=title,
                body=body,
                extra_data=data,
                send_push=True,
            )
            stats["delivered"] += 1
        except Exception as exc:
            logger.warning("broadcast_failed user_id=%s err=%s", uid, exc)
    return stats
