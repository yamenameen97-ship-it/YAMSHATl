"""
v88.53 — مسارات القيود الإدارية وطلبات المراجعة
=================================================
- POST /api/admin/restrictions          → الإدارة تفرض قيداً على مستخدم.
- DELETE /api/admin/restrictions/{id}   → الإدارة ترفع القيد.
- GET /api/restrictions/me              → قائمة القيود السارية على المستخدم.
- POST /api/restrictions/{id}/appeal    → المستخدم يرسل طلب مراجعة.
- POST /api/admin/restrictions/{id}/resolve → الإدارة تردّ على طلب المراجعة.
"""
from __future__ import annotations

from fastapi import APIRouter, Body, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.admin_access import effective_role
from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.user_restriction import RESTRICTION_TYPES, UserRestriction
from app.services.restriction_service import (
    apply_restriction,
    get_active_restrictions,
    lift_restriction,
    resolve_appeal,
    submit_appeal,
)

router = APIRouter()


class _ApplyPayload(BaseModel):
    user_id: int
    restriction_type: str = Field(..., description='comment_mute|post_ban|reels_ban|groups_join_ban|story_ban|dm_strangers_ban')
    reason: str | None = None
    related_report_ids: str | None = None
    duration_minutes: int | None = None


class _AppealPayload(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class _ResolvePayload(BaseModel):
    response: str = Field(..., min_length=1, max_length=2000)
    accept: bool = False


def _require_admin(user: User) -> None:
    role = effective_role(user)
    if role not in ('admin', 'moderator'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin required')


def _serialize(r: UserRestriction) -> dict:
    return {
        'id': r.id,
        'user_id': r.user_id,
        'restriction_type': r.restriction_type,
        'reason': r.reason,
        'imposed_by': r.imposed_by_username,
        'duration_minutes': r.duration_minutes,
        'repeat_count': r.repeat_count,
        'is_active': r.is_active,
        'created_at': r.created_at.isoformat() if r.created_at else None,
        'expires_at': r.expires_at.isoformat() if r.expires_at else None,
        'appeal_status': r.appeal_status,
        'appeal_message': r.appeal_message,
        'appeal_response': r.appeal_response,
        'notification_id': r.notification_id,
    }


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------

@router.post('/admin/restrictions')
def admin_apply_restriction(
    payload: _ApplyPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    if payload.restriction_type not in RESTRICTION_TYPES:
        raise HTTPException(status_code=400, detail='Invalid restriction_type')
    try:
        r = apply_restriction(
            db,
            user_id=payload.user_id,
            restriction_type=payload.restriction_type,
            imposed_by=current_user,
            reason=payload.reason,
            related_report_ids=payload.related_report_ids,
            duration_minutes=payload.duration_minutes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {'ok': True, 'restriction': _serialize(r)}


@router.delete('/admin/restrictions/{restriction_id}')
def admin_lift_restriction(
    restriction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    r = lift_restriction(db, restriction_id, lifted_by=current_user)
    if not r:
        raise HTTPException(status_code=404, detail='Restriction not found')
    return {'ok': True, 'restriction': _serialize(r)}


@router.post('/admin/restrictions/{restriction_id}/resolve')
def admin_resolve_appeal(
    restriction_id: int,
    payload: _ResolvePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    try:
        r = resolve_appeal(
            db,
            restriction_id=restriction_id,
            admin=current_user,
            response=payload.response,
            accept=payload.accept,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return {'ok': True, 'restriction': _serialize(r)}


@router.get('/admin/restrictions')
def admin_list_restrictions(
    only_active: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    q = db.query(UserRestriction)
    if only_active:
        q = q.filter(UserRestriction.is_active.is_(True))
    rows = q.order_by(UserRestriction.created_at.desc()).limit(500).all()
    return [_serialize(r) for r in rows]


# ---------------------------------------------------------------------------
# User endpoints
# ---------------------------------------------------------------------------

@router.get('/restrictions/me')
def my_active_restrictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = get_active_restrictions(db, current_user.id)
    return [_serialize(r) for r in rows]


@router.post('/restrictions/{restriction_id}/appeal')
def user_submit_appeal(
    restriction_id: int,
    payload: _AppealPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        r = submit_appeal(
            db,
            restriction_id=restriction_id,
            user_id=current_user.id,
            message=payload.message,
        )
    except PermissionError:
        raise HTTPException(status_code=403, detail='Not your restriction')
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {'ok': True, 'restriction': _serialize(r)}
