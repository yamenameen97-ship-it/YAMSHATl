"""
راوتر نظام البلاغات.

نقاط النهاية للمستخدم (Public):
    POST   /api/reports                 → إنشاء بلاغ جديد
    GET    /api/reports/my              → بلاغاتي السابقة
    GET    /api/reports/reasons         → قائمة الأسباب المتاحة (للواجهة)

نقاط النهاية للأدمن (Moderation):
    GET    /api/reports/admin           → قائمة البلاغات مع فلاتر
    GET    /api/reports/admin/stats     → إحصائيات
    GET    /api/reports/admin/{id}      → تفاصيل بلاغ + تاريخه
    PATCH  /api/reports/admin/{id}      → تحديث (status/priority/notes)
    POST   /api/reports/admin/{id}/action → اتخاذ إجراء
    POST   /api/reports/admin/bulk      → إجراء جماعي
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.report import (
    REPORT_REASONS,
    REPORT_STATUSES,
    TARGET_TYPES,
    Report,
    ReportEvent,
)
from app.models.user import User
from app.schemas.report import (
    ReportActionPayload,
    ReportBulkAction,
    ReportCreate,
    ReportCreateResponse,
    ReportUpdate,
)
from app.services.report_service import (
    REASON_LABELS_AR,
    apply_action,
    compute_stats,
    create_report,
    reason_label,
    serialize_report,
)

router = APIRouter(tags=['reports'])


# ============================================================
# Helpers
# ============================================================
def _is_moderator(user: User) -> bool:
    role = (getattr(user, 'role', '') or '').lower()
    return role in ('admin', 'moderator', 'super_admin')


def _require_moderator(user: User) -> None:
    if not _is_moderator(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='هذه الصفحة مخصصة لفريق الإشراف فقط.',
        )


# ============================================================
# Public endpoints
# ============================================================
@router.get('/reasons')
def list_reasons():
    """قائمة الأسباب والكيانات المتاحة (تستخدمها الواجهة لبناء القوائم)."""
    return {
        'reasons': [
            {'value': r, 'label': REASON_LABELS_AR.get(r, r)}
            for r in REPORT_REASONS
        ],
        'target_types': list(TARGET_TYPES),
    }


@router.post('', response_model=ReportCreateResponse, status_code=status.HTTP_201_CREATED)
def submit_report(
    payload: ReportCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إنشاء بلاغ جديد من قبل المستخدم."""
    # منع المستخدم من الإبلاغ على نفسه
    if payload.target_type == 'user' and str(payload.target_id) == str(current_user.id):
        raise HTTPException(
            status_code=400,
            detail='لا يمكنك الإبلاغ عن نفسك.',
        )

    # سياق إضافي
    context = dict(payload.context or {})
    try:
        context.setdefault('ip', request.client.host if request.client else None)
        context.setdefault('user_agent', request.headers.get('user-agent', '')[:255])
    except Exception:
        pass

    report, is_new = create_report(
        db,
        reporter_user_id=current_user.id,
        target_type=payload.target_type,
        target_id=payload.target_id,
        reason=payload.reason,
        details=payload.details,
        context=context,
    )

    return ReportCreateResponse(
        id=report.id,
        status=report.status,
        message=(
            'تم استلام بلاغك بنجاح وسيتم مراجعته من قبل فريق الإشراف خلال 24 ساعة.'
            if is_new
            else 'تم تسجيل بلاغ مماثل سابقاً، وسنأخذه بعين الاعتبار.'
        ),
        duplicate_count=report.duplicate_count or 0,
    )


@router.get('/my')
def my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """قائمة بلاغات المستخدم الحالي."""
    q = db.query(Report).filter(Report.reporter_user_id == current_user.id)
    total = q.count()
    items = (
        q.order_by(desc(Report.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        'items': [serialize_report(db, r) for r in items],
        'total': total,
        'page': page,
        'page_size': page_size,
    }


# ============================================================
# Admin endpoints
# ============================================================
@router.get('/admin')
def admin_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status_filter: Optional[str] = Query(None, alias='status'),
    priority: Optional[str] = None,
    target_type: Optional[str] = None,
    reason: Optional[str] = None,
    q: Optional[str] = Query(None, description='بحث في التفاصيل/معرّف الكيان'),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    _require_moderator(current_user)

    query = db.query(Report)

    if status_filter and status_filter != 'all':
        query = query.filter(Report.status == status_filter)
    if priority and priority != 'all':
        query = query.filter(Report.priority == priority)
    if target_type and target_type != 'all':
        query = query.filter(Report.target_type == target_type)
    if reason and reason != 'all':
        query = query.filter(Report.reason == reason)
    if q:
        like = f'%{q}%'
        query = query.filter(or_(
            Report.details.ilike(like),
            Report.target_id.ilike(like),
        ))

    total = query.count()
    items = (
        query.order_by(
            # urgent أولاً ثم الأقدم في pending
            Report.priority.desc(),
            desc(Report.created_at),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # عدّادات سريعة لشريط الفلاتر
    counts = {}
    try:
        from sqlalchemy import func
        rows = (
            db.query(Report.status, func.count(Report.id))
            .group_by(Report.status)
            .all()
        )
        counts = {s: c for s, c in rows}
        counts['all'] = total
    except Exception:
        pass

    return {
        'items': [serialize_report(db, r) for r in items],
        'total': total,
        'page': page,
        'page_size': page_size,
        'counts': counts,
    }


@router.get('/admin/stats')
def admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_moderator(current_user)
    return compute_stats(db)


@router.get('/admin/{report_id}')
def admin_get(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_moderator(current_user)
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r:
        raise HTTPException(404, 'البلاغ غير موجود')

    events = (
        db.query(ReportEvent)
        .filter(ReportEvent.report_id == report_id)
        .order_by(ReportEvent.created_at.asc())
        .all()
    )

    return {
        'report': serialize_report(db, r),
        'events': [
            {
                'id': e.id,
                'actor_user_id': e.actor_user_id,
                'event_type': e.event_type,
                'note': e.note,
                'meta': e.meta or {},
                'created_at': e.created_at.isoformat() if e.created_at else None,
            }
            for e in events
        ],
    }


@router.patch('/admin/{report_id}')
def admin_update(
    report_id: int,
    payload: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_moderator(current_user)
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r:
        raise HTTPException(404, 'البلاغ غير موجود')

    changes = {}
    if payload.status and payload.status != r.status:
        changes['status'] = (r.status, payload.status)
        r.status = payload.status
    if payload.priority and payload.priority != r.priority:
        changes['priority'] = (r.priority, payload.priority)
        r.priority = payload.priority
    if payload.moderator_notes is not None:
        r.moderator_notes = payload.moderator_notes
        changes['notes'] = True
    if payload.action_taken is not None:
        r.action_taken = payload.action_taken
        changes['action_taken'] = payload.action_taken

    r.handled_by_user_id = current_user.id
    r.handled_at = datetime.utcnow()

    if changes:
        db.add(ReportEvent(
            report_id=r.id,
            actor_user_id=current_user.id,
            event_type='status_changed' if 'status' in changes else 'note_added',
            note=payload.moderator_notes,
            meta={'changes': {k: list(v) if isinstance(v, tuple) else v for k, v in changes.items()}},
        ))

    db.commit()
    db.refresh(r)
    return serialize_report(db, r)


@router.post('/admin/{report_id}/action')
def admin_action(
    report_id: int,
    payload: ReportActionPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_moderator(current_user)
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r:
        raise HTTPException(404, 'البلاغ غير موجود')

    effect = apply_action(
        db,
        report=r,
        actor_user_id=current_user.id,
        action=payload.action,
        notes=payload.notes,
        duration_hours=payload.duration_hours,
    )
    return {
        'ok': True,
        'effect': effect,
        'report': serialize_report(db, r),
    }


@router.post('/admin/bulk')
def admin_bulk(
    payload: ReportBulkAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_moderator(current_user)
    if not payload.ids:
        raise HTTPException(400, 'لا يوجد بلاغات محددة')

    results = []
    reports = db.query(Report).filter(Report.id.in_(payload.ids)).all()
    for r in reports:
        try:
            effect = apply_action(
                db,
                report=r,
                actor_user_id=current_user.id,
                action=payload.action,
                notes=payload.notes,
            )
            results.append({'id': r.id, 'ok': True, 'effect': effect})
        except Exception as e:
            results.append({'id': r.id, 'ok': False, 'error': str(e)[:200]})

    return {'processed': len(results), 'results': results}
