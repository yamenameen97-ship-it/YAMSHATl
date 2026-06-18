"""
نقاط نهاية التوصيات الخفيفة.
الواجهة الأمامية تستدعي:
  - /api/recommendations/users
  - /api/recommendations/reels
  - /api/recommendations/trending
  - /api/recommendations/r-<id>   (مسار مرن لأي معرف)
بدون هذا الموجِّه كانت الواجهة تتلقى 404 وتعطل بعض القوائم.
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_optional, get_db
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get('/recommendations/users')
def recommend_users(
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    try:
        query = db.query(User)
        if current_user:
            query = query.filter(User.id != current_user.id)
        users = query.order_by(desc(User.id)).limit(limit).all()
        return [
            {
                'id': u.id,
                'username': u.username,
                'full_name': getattr(u, 'full_name', '') or u.username,
                'avatar_url': getattr(u, 'avatar_url', '') or '',
                'bio': getattr(u, 'bio', '') or '',
            }
            for u in users
        ]
    except Exception as exc:  # noqa: BLE001
        logger.warning('recommend_users failed: %s', exc)
        return []


@router.get('/recommendations/reels')
def recommend_reels(
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    try:
        from app.api.routes.reels import _load_reels_items  # تجنّب الاستيراد الدائري
        return {'items': _load_reels_items(db, current_user, limit=limit, offset=0, category='all')}
    except Exception as exc:  # noqa: BLE001
        logger.warning('recommend_reels failed: %s', exc)
        return {'items': []}


@router.get('/recommendations/trending')
def recommend_trending(limit: int = Query(10, ge=1, le=50)):
    # نقطة نهاية خفيفة: قائمة فارغة بدلاً من 404 حتى لا تتعطل الواجهة.
    return {'items': [], 'limit': limit}


@router.get('/recommendations/{slug}')
def recommendations_catchall(slug: str) -> dict[str, Any]:
    """
    مسار مرن: يعالج أي معرف توصية لم تُسجَّل له نقطة نهاية مخصصة،
    مثل /api/recommendations/r-9af3... — يرجع 200 بقائمة فارغة بدلاً من 404.
    """
    return {'id': slug, 'items': [], 'related': []}
