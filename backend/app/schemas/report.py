"""
Pydantic schemas لنظام البلاغات.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, validator

from app.models.report import (
    REPORT_PRIORITIES,
    REPORT_REASONS,
    REPORT_STATUSES,
    TARGET_TYPES,
)


# ============================================================
# إنشاء بلاغ
# ============================================================
class ReportCreate(BaseModel):
    target_type: str = Field(..., description="نوع الكيان المُبلَّغ عنه")
    target_id: str = Field(..., min_length=1, max_length=64)
    reason: str = Field(..., description="سبب البلاغ")
    details: Optional[str] = Field(None, max_length=2000, description="شرح إضافي")
    context: Optional[dict[str, Any]] = Field(default_factory=dict)

    @validator('target_type')
    def _v_target(cls, v: str) -> str:
        v = (v or '').strip().lower()
        if v not in TARGET_TYPES:
            raise ValueError(f"target_type غير مدعوم: {v}")
        return v

    @validator('reason')
    def _v_reason(cls, v: str) -> str:
        v = (v or '').strip().lower()
        if v not in REPORT_REASONS:
            raise ValueError(f"reason غير مدعوم: {v}")
        return v


class ReportCreateResponse(BaseModel):
    id: int
    status: str
    message: str = "تم استلام بلاغك بنجاح وسيتم مراجعته من قبل فريق الإشراف."
    duplicate_count: int = 0


# ============================================================
# عرض بلاغ
# ============================================================
class ReporterPublic(BaseModel):
    id: Optional[int] = None
    username: Optional[str] = None
    avatar: Optional[str] = None


class ReportOut(BaseModel):
    id: int
    reporter: Optional[ReporterPublic] = None
    target_type: str
    target_id: str
    target_owner: Optional[ReporterPublic] = None
    reason: str
    reason_label: str
    details: Optional[str] = None
    priority: str
    status: str
    snapshot: dict[str, Any] = Field(default_factory=dict)
    context: dict[str, Any] = Field(default_factory=dict)
    handled_by: Optional[ReporterPublic] = None
    handled_at: Optional[datetime] = None
    moderator_notes: Optional[str] = None
    action_taken: Optional[str] = None
    duplicate_count: int = 0
    created_at: datetime
    updated_at: datetime


class ReportListResponse(BaseModel):
    items: list[ReportOut]
    total: int
    page: int
    page_size: int
    counts: dict[str, int] = Field(default_factory=dict)


# ============================================================
# تحديث / معالجة بلاغ من لوحة الأدمن
# ============================================================
class ReportUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    moderator_notes: Optional[str] = Field(None, max_length=2000)
    action_taken: Optional[str] = Field(None, max_length=60)

    @validator('status')
    def _v_status(cls, v):
        if v is None:
            return v
        v = v.strip().lower()
        if v not in REPORT_STATUSES:
            raise ValueError(f"status غير مدعوم: {v}")
        return v

    @validator('priority')
    def _v_priority(cls, v):
        if v is None:
            return v
        v = v.strip().lower()
        if v not in REPORT_PRIORITIES:
            raise ValueError(f"priority غير مدعوم: {v}")
        return v


class ReportActionPayload(BaseModel):
    """إجراء فعلي على المحتوى/المستخدم."""
    action: Literal[
        'dismiss',
        'remove_content',
        'warn_user',
        'mute_user',
        'suspend_user',
        'ban_user',
        'escalate',
    ]
    notes: Optional[str] = Field(None, max_length=1000)
    duration_hours: Optional[int] = Field(None, ge=1, le=24 * 365)


class ReportBulkAction(BaseModel):
    ids: list[int]
    action: str
    notes: Optional[str] = None


# ============================================================
# إحصائيات
# ============================================================
class ReportStats(BaseModel):
    total: int
    pending: int
    reviewing: int
    resolved: int
    dismissed: int
    by_target: dict[str, int] = Field(default_factory=dict)
    by_reason: dict[str, int] = Field(default_factory=dict)
    last_24h: int = 0
    last_7d: int = 0
