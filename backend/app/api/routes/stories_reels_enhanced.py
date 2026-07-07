"""DEPRECATED — v84.0.

هذا الملف كان يحتوي على مسارات ستوري/ريلز مكررة تستورد وحدات نماذج
غير موجودة (`app.models.story`, `app.models.story_view`,
`app.models.story_reply`, `app.models.reel`, `app.models.reel_like`,
`app.models.saved_reel`, `app.models.reel_view`).

المسارات الحقيقية المستخدمة الآن:
- الستوري: `app.api.routes.stories` → يستدعي `app.services.story_db_service`
  ويكتب مباشرة إلى Postgres السحابية (v83.9).
- الريلز: `app.api.routes.reels` (النماذج الفعلية في
  `app.models.stories_reels`).

الملف القديم تسبب في احتمال crash عند أي استيراد عرضي، ومسارات مكررة
تطأ على `stories.py` إذا سُجل بالخطأ في main.py. لذا استُبدل بـ shim آمن
لا يُسجّل أي endpoint.

لا تستورد هذا الملف. إذا احتجت مسار ستوري/ريل جديد أضفه إلى
`stories.py` أو `reels.py` مباشرة.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter

logger = logging.getLogger(__name__)

# راوتر فارغ عمداً — يبقى موجوداً فقط للتوافق الخلفي مع أي
# `_include("app.api.routes.stories_reels_enhanced.router")` قديم.
router = APIRouter()


@router.get("/__deprecated__/stories_reels_enhanced")
def _deprecation_notice() -> dict:
    """endpoint وحيد يوضح أن الوحدة انتقلت."""
    return {
        "status": "deprecated",
        "message": (
            "stories_reels_enhanced was removed in v84.0. "
            "Use /api/stories/* (via app.api.routes.stories) and "
            "/api/reels/* (via app.api.routes.reels) instead."
        ),
        "migrated_to": {
            "stories": "app.api.routes.stories",
            "reels": "app.api.routes.reels",
        },
    }


__all__ = ["router"]
