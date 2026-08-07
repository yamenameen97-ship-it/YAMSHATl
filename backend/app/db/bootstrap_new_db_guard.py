"""
v89.49 — New Database Bootstrap Guard
======================================
حارس idempotent يضمن أن قاعدة البيانات جاهزة قبل قبول أي طلب auth.

يعالج المشكلة التالية:
- عند إنشاء قاعدة PostgreSQL جديدة على Render (مثل yamshatdt) ووضع رابطها
  في DATABASE_URL، قد يفشل on_startup event لأسباب عديدة (cold start،
  timing، فشل صامت في migrations). النتيجة: أول طلب /api/auth/login
  يجد جدول users غير موجود → OperationalError → 500 Internal server error.

الحل:
- هذا الملف يوفر ensure_new_database_ready() — دالة idempotent مع قفل خيطي
  و flag ذاكرة. تُستدعى من middleware قبل مسارات auth. تفحص:
    1. هل جدول users موجود؟
    2. هل يحتوي على مستخدم واحد على الأقل؟
    3. هل الأعمدة الأساسية موجودة؟
- إن كان الجواب "لا" لأي منها → تشغّل initialize_database(engine, force=True).
- بعد أول نجاح لا تفعل شيئاً — تكلفة صفر على القواعد السليمة.
"""

from __future__ import annotations

import logging
import threading
from typing import Optional

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

_log = logging.getLogger(__name__)

# Flag ذاكرة — بعد أول نجاح لا نعيد الفحص
_GUARD_DONE: bool = False
_GUARD_LOCK = threading.Lock()

# الأعمدة الأساسية التي يجب أن توجد في جدول users
_REQUIRED_USER_COLUMNS = {
    "id",
    "email",
    "username",
    "hashed_password",
    "is_active",
    "role",
}


def _users_table_healthy(engine: Engine) -> bool:
    """تحقق سريع: هل جدول users موجود ويحتوي على الأعمدة الأساسية وسجل واحد على الأقل؟"""
    try:
        insp = inspect(engine)
        tables = set(insp.get_table_names())
        if "users" not in tables:
            _log.warning("[new-db-guard] users table missing")
            return False

        cols = {c["name"] for c in insp.get_columns("users")}
        missing = _REQUIRED_USER_COLUMNS - cols
        if missing:
            _log.warning("[new-db-guard] users table missing columns: %s", missing)
            return False

        # تحقق من وجود مستخدم واحد على الأقل (الحسابات البذرية)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            count = result.scalar() or 0
        if count < 1:
            _log.warning("[new-db-guard] users table exists but is EMPTY (no seed accounts)")
            return False

        return True
    except Exception as exc:
        _log.warning("[new-db-guard] health check failed: %s", exc)
        return False


def ensure_new_database_ready(engine: Optional[Engine] = None) -> bool:
    """
    يضمن جاهزية قاعدة البيانات. Idempotent:
    - بعد أول نجاح (_GUARD_DONE=True) يرجع فوراً.
    - إن كان جدول users سليماً يضع الـflag ويخرج.
    - وإلا يشغّل initialize_database(engine, force=True) ثم يعيد الفحص.

    Returns:
        True  → القاعدة جاهزة
        False → فشل حتى بعد إعادة التهيئة (يجب رفع الخطأ للأعلى)
    """
    global _GUARD_DONE

    # Fast path — بعد أول نجاح لا نفعل شيئاً
    if _GUARD_DONE:
        return True

    with _GUARD_LOCK:
        # Double-check بعد أخذ القفل
        if _GUARD_DONE:
            return True

        # جلب engine إن لم يُمرَّر
        if engine is None:
            try:
                from app.db.session import engine as _engine
                engine = _engine
            except Exception as exc:
                _log.error("[new-db-guard] cannot import DB engine: %s", exc)
                return False

        # فحص الصحة أولاً
        if _users_table_healthy(engine):
            _GUARD_DONE = True
            _log.info("[new-db-guard] database is healthy — guard done")
            return True

        # القاعدة غير جاهزة → شغّل initialize_database بشكل قسري
        _log.warning("[new-db-guard] database NOT ready — running force bootstrap now")
        try:
            from app.db.bootstrap import initialize_database
            initialize_database(engine, force=True)
        except Exception as exc:
            _log.exception("[new-db-guard] force bootstrap failed: %s", exc)
            return False

        # إعادة الفحص بعد التهيئة
        if _users_table_healthy(engine):
            _GUARD_DONE = True
            _log.info("[new-db-guard] database is now READY after force bootstrap")
            return True

        _log.error("[new-db-guard] database STILL not ready after force bootstrap")
        return False


def reset_guard() -> None:
    """للاختبارات فقط — إعادة تعيين الـflag."""
    global _GUARD_DONE
    with _GUARD_LOCK:
        _GUARD_DONE = False
