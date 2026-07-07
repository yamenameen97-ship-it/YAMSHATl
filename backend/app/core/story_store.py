"""DEPRECATED — v83.9.

كان هذا الملف يخزن الستوريات في JSON محلي (uploads/story_store.json).
لم يكن ثابتاً على Render (filesystem غير دائم بين النشرات) ولم يتزامن
بين الأجهزة.

الآن كل شيء انتقل إلى `app.services.story_db_service` الذي يكتب مباشرة إلى
Postgres. هذا الـ shim يبقى فقط للتوافق الخلفي مع أي كود قد يستورد
`story_store` بشكل عرضي.

لا تستخدم هذا الملف في كود جديد. استخدم `story_db_service` مباشرة.
"""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


class _DeprecatedStoryStoreShim:
    """يطلق تحذيراً واضحاً إذا حاول أي أحد الوصول إلى الواجهة القديمة."""

    _WARNED: set[str] = set()

    def _warn(self, attr: str) -> None:
        if attr in self._WARNED:
            return
        self._WARNED.add(attr)
        logger.warning(
            "story_store.%s is DEPRECATED (v83.9). "
            "Use app.services.story_db_service instead — it writes to Postgres.",
            attr,
        )

    def __getattr__(self, name: str) -> Any:
        self._warn(name)

        def _noop(*_args, **_kwargs):
            raise RuntimeError(
                "story_store is deprecated. "
                "All story operations now go through app.services.story_db_service (Postgres)."
            )

        return _noop

    def set_mention_hook(self, _hook) -> None:  # للتوافق فقط
        self._warn("set_mention_hook")

    def set_new_story_hook(self, _hook) -> None:  # للتوافق فقط
        self._warn("set_new_story_hook")


story_store = _DeprecatedStoryStoreShim()

__all__ = ["story_store"]
