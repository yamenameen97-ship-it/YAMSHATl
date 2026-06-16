"""
مسارات إدارة أجهزة المستخدم - User Devices REST Routes.

Endpoints:
  POST   /devices/register      تسجيل/تحديث جهاز
  GET    /devices               قائمة أجهزتي
  PUT    /devices/{device_id}/preferences  تحديث تفضيلات جهاز
  DELETE /devices/{device_id}   إلغاء تسجيل جهاز
"""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.user_device import (
    UserDeviceOut,
    UserDevicePreferences,
    UserDeviceRegister,
)
from app.services.device_service import (
    list_user_devices,
    register_or_update_device,
    set_device_preferences,
    unregister_device,
)

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("/register", response_model=UserDeviceOut)
def register_device(
    payload: UserDeviceRegister,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """تسجيل/تحديث جهاز المستخدم الحالي."""
    user_agent = payload.user_agent or request.headers.get("user-agent", "")[:500]
    device = register_or_update_device(
        db,
        user_id=current_user.id,
        device_id=payload.device_id,
        push_token=payload.push_token,
        platform=payload.platform,
        provider=payload.provider,
        web_push_p256dh=payload.web_push_p256dh,
        web_push_auth=payload.web_push_auth,
        device_name=payload.device_name,
        os_version=payload.os_version,
        app_version=payload.app_version,
        user_agent=user_agent,
    )
    return device


@router.get("", response_model=List[UserDeviceOut])
def my_devices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """قائمة كل أجهزتي."""
    return list_user_devices(db, current_user.id)


@router.put("/{device_id}/preferences", response_model=UserDeviceOut)
def update_device_preferences(
    device_id: str,
    payload: UserDevicePreferences,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """تفعيل/تعطيل إشعارات جهاز محدد."""
    device = set_device_preferences(
        db, current_user.id, device_id, payload.notifications_enabled
    )
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="الجهاز غير موجود"
        )
    return device


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_device(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إلغاء تسجيل جهاز عند تسجيل الخروج."""
    if not unregister_device(db, current_user.id, device_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="الجهاز غير موجود"
        )
    return None
