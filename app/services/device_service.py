"""
خدمة إدارة أجهزة المستخدمين - User Devices Service.

يوفّر:
- تسجيل/تحديث جهاز
- جلب الأجهزة النشطة لمستخدم
- إلغاء تسجيل الأجهزة الميتة
- تحديث آخر ظهور
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.user_device import UserDevice

logger = logging.getLogger(__name__)

# عتبة عدد الإخفاقات المتتالية لإلغاء تسجيل الجهاز
MAX_FAILURES_BEFORE_DEACTIVATE = 5
# عمر الجهاز الخامل قبل تعطيله
INACTIVE_DEVICE_DAYS = 60


def register_or_update_device(
    db: Session,
    *,
    user_id: int,
    device_id: str,
    push_token: str,
    platform: str = "web",
    provider: str = "fcm",
    web_push_p256dh: Optional[str] = None,
    web_push_auth: Optional[str] = None,
    device_name: Optional[str] = None,
    os_version: Optional[str] = None,
    app_version: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> UserDevice:
    """تسجيل جهاز جديد أو تحديث القائم (upsert)."""

    existing = (
        db.query(UserDevice)
        .filter(
            and_(
                UserDevice.user_id == user_id,
                UserDevice.device_id == device_id,
            )
        )
        .first()
    )

    if existing:
        existing.push_token = push_token
        existing.platform = platform
        existing.provider = provider
        existing.web_push_p256dh = web_push_p256dh
        existing.web_push_auth = web_push_auth
        existing.device_name = device_name or existing.device_name
        existing.os_version = os_version or existing.os_version
        existing.app_version = app_version or existing.app_version
        existing.user_agent = user_agent or existing.user_agent
        existing.is_active = True
        existing.failure_count = 0
        existing.last_seen_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        logger.info("device_updated user_id=%s device_id=%s", user_id, device_id)
        return existing

    device = UserDevice(
        user_id=user_id,
        device_id=device_id,
        push_token=push_token,
        platform=platform,
        provider=provider,
        web_push_p256dh=web_push_p256dh,
        web_push_auth=web_push_auth,
        device_name=device_name,
        os_version=os_version,
        app_version=app_version,
        user_agent=user_agent,
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    logger.info("device_registered user_id=%s device_id=%s platform=%s", user_id, device_id, platform)
    return device


def get_active_devices(db: Session, user_id: int) -> List[UserDevice]:
    """جلب الأجهزة النشطة الممكَّن عليها الإشعارات."""
    return (
        db.query(UserDevice)
        .filter(
            and_(
                UserDevice.user_id == user_id,
                UserDevice.is_active.is_(True),
                UserDevice.notifications_enabled.is_(True),
            )
        )
        .all()
    )


def list_user_devices(db: Session, user_id: int) -> List[UserDevice]:
    """جلب كل أجهزة المستخدم (بما فيها المعطّلة)."""
    return (
        db.query(UserDevice)
        .filter(UserDevice.user_id == user_id)
        .order_by(UserDevice.last_seen_at.desc())
        .all()
    )


def unregister_device(db: Session, user_id: int, device_id: str) -> bool:
    """إلغاء تسجيل جهاز محدد."""
    device = (
        db.query(UserDevice)
        .filter(
            and_(
                UserDevice.user_id == user_id,
                UserDevice.device_id == device_id,
            )
        )
        .first()
    )
    if not device:
        return False
    db.delete(device)
    db.commit()
    logger.info("device_unregistered user_id=%s device_id=%s", user_id, device_id)
    return True


def set_device_preferences(
    db: Session,
    user_id: int,
    device_id: str,
    notifications_enabled: bool,
) -> Optional[UserDevice]:
    """تحديث تفضيلات إشعارات جهاز محدد."""
    device = (
        db.query(UserDevice)
        .filter(
            and_(
                UserDevice.user_id == user_id,
                UserDevice.device_id == device_id,
            )
        )
        .first()
    )
    if not device:
        return None
    device.notifications_enabled = notifications_enabled
    db.commit()
    db.refresh(device)
    return device


def mark_device_failed(db: Session, device_id_pk: int) -> None:
    """رفع عدّاد الإخفاق وتعطيل الجهاز عند تجاوز العتبة."""
    device = db.query(UserDevice).filter(UserDevice.id == device_id_pk).first()
    if not device:
        return
    device.failure_count = (device.failure_count or 0) + 1
    if device.failure_count >= MAX_FAILURES_BEFORE_DEACTIVATE:
        device.is_active = False
        logger.warning(
            "device_deactivated user_id=%s device_id=%s reason=too_many_failures",
            device.user_id,
            device.device_id,
        )
    db.commit()


def mark_device_delivered(db: Session, device_id_pk: int) -> None:
    """تأكيد تسليم ناجح وتصفير العدّاد."""
    device = db.query(UserDevice).filter(UserDevice.id == device_id_pk).first()
    if not device:
        return
    device.failure_count = 0
    device.last_push_at = datetime.utcnow()
    device.last_seen_at = datetime.utcnow()
    db.commit()


def cleanup_inactive_devices(db: Session, days: int = INACTIVE_DEVICE_DAYS) -> int:
    """تعطيل الأجهزة التي لم تظهر منذ مدة طويلة (تنظيف دوري)."""
    cutoff = datetime.utcnow() - timedelta(days=days)
    count = (
        db.query(UserDevice)
        .filter(
            and_(
                UserDevice.is_active.is_(True),
                UserDevice.last_seen_at < cutoff,
            )
        )
        .update({"is_active": False}, synchronize_session=False)
    )
    db.commit()
    if count:
        logger.info("inactive_devices_deactivated count=%s", count)
    return count
