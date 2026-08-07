"""
v89.51 — Smart DATABASE_URL Resolver with Internal→External DNS Fallback
=========================================================================
تحديث v89.51: القاعدة الحالية هي yamshat66 على مضيف dpg-d9qjo6pt0dsc7386fhdg-a

السبب الجذري لخطأ "could not translate host name dpg-xxx-a":
─────────────────────────────────────────────────────────────
رابط Render Internal (dpg-xxx-a بدون domain) يعمل **فقط** داخل شبكة Render
الخاصة، وذلك عندما تكون الخدمة وقاعدة البيانات في:
  • نفس المنطقة (Region)
  • نفس الحساب (Account/Team)
  • وكانت شبكة Render الداخلية متاحة عند لحظة الاتصال

عند إنشاء قاعدة بيانات جديدة على Render ثم استخدام Internal URL مباشرة،
يفشل DNS في هذه السيناريوهات:
  1. المنطقة مختلفة بين الخدمة والقاعدة.
  2. Cold start — الشبكة الداخلية غير جاهزة بعد.
  3. خيوط الخلفية (background threads) تفتح اتصالات جديدة أثناء
     انقطاع مؤقّت في DNS الداخلي.
  4. المشغّل يشغّل الخدمة محلياً/في CI بدون الشبكة الداخلية.

النتيجة في اللوجز:
  psycopg2.OperationalError:
    could not translate host name "dpg-d9qjo6pt0dsc7386fhdg-a" to address:
    Name or service not known

الحل الحاسم (v89.50):
─────────────────────
هذا الملف يوفر resolve_database_url() الذي:
  1. يبني قائمة مرشحين مرتّبة: Internal (أفضل أداء) ثم External (أضمن).
  2. يشتق External من Internal تلقائياً إن لم يُعطَ صراحةً
     (dpg-xxx-a  →  dpg-xxx-a.<region>-postgres.render.com).
  3. يجرّب كل مرشّح باتصال قصير (SELECT 1) قبل تسليمه لـ SQLAlchemy.
  4. يخزّن أول رابط ينجح ويعيده — لا يعيد الفحص في كل مرة.
  5. عند فشل DNS للـ Internal، يقع فوراً على External + sslmode=require.

نتيجة: أي قاعدة Render جديدة تعمل من اليوم الأول بدون تدخل يدوي،
حتى لو كانت في منطقة مختلفة أو خلال cold start.
"""

from __future__ import annotations

import logging
import os
import re
import socket
import threading
from typing import List, Optional
from urllib.parse import urlparse, urlunparse

logger = logging.getLogger(__name__)

# قائمة مناطق Render الشائعة للاشتقاق التلقائي لـ External URL
# نجرّبها بالترتيب المذكور — Oregon أولاً لأنه الأكثر شيوعاً على Free Tier
_RENDER_REGIONS = ("oregon", "frankfurt", "singapore", "ohio", "virginia")

# قفل وذاكرة تخزين للرابط الفعّال بعد أول نجاح
_RESOLVE_LOCK = threading.Lock()
_RESOLVED_URL: Optional[str] = None


def _mask(url: str) -> str:
    """إخفاء كلمة المرور في الرابط عند الطباعة."""
    try:
        return re.sub(r"(://[^:]+:)[^@]+(@)", r"\1***\2", url)
    except Exception:
        return url.split("@", 1)[-1] if "@" in url else url


def _normalize_scheme(url: str) -> str:
    """تحويل postgres:// إلى postgresql:// (SQLAlchemy 2.x)."""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


def _ensure_sslmode_require(url: str) -> str:
    """يضيف sslmode=require للروابط الخارجية إن لم يكن موجوداً."""
    if "sslmode=" in url:
        return url
    separator = "&" if "?" in url else "?"
    return f"{url}{separator}sslmode=require"


def _is_render_internal_host(host: str) -> bool:
    """رابط Render الداخلي يبدأ بـ dpg- ولا يحتوي على نقطة."""
    return host.startswith("dpg-") and "." not in host


def _is_render_external_host(host: str) -> bool:
    """رابط Render الخارجي: dpg-xxx-a.<region>-postgres.render.com"""
    return host.startswith("dpg-") and host.endswith(".render.com")


def _derive_external_candidates(internal_url: str) -> List[str]:
    """
    من رابط داخلي (dpg-xxx-a/dbname) يشتقّ روابط خارجية محتملة لكل منطقة
    Render شائعة، مع إضافة sslmode=require.

    مثال:
      in : postgresql://u:p@dpg-abc-a/mydb
      out: [
        postgresql://u:p@dpg-abc-a.oregon-postgres.render.com/mydb?sslmode=require,
        postgresql://u:p@dpg-abc-a.frankfurt-postgres.render.com/mydb?sslmode=require,
        ...
      ]
    """
    try:
        parsed = urlparse(internal_url)
    except Exception:
        return []

    host = (parsed.hostname or "").strip()
    if not _is_render_internal_host(host):
        return []

    derived: List[str] = []
    userinfo = ""
    if parsed.username:
        userinfo = parsed.username
        if parsed.password:
            userinfo = f"{parsed.username}:{parsed.password}"
        userinfo += "@"

    for region in _RENDER_REGIONS:
        external_host = f"{host}.{region}-postgres.render.com"
        netloc = f"{userinfo}{external_host}"
        if parsed.port:
            netloc = f"{netloc}:{parsed.port}"
        new_url = urlunparse((
            parsed.scheme or "postgresql",
            netloc,
            parsed.path or "",
            parsed.params or "",
            parsed.query or "",
            parsed.fragment or "",
        ))
        derived.append(_ensure_sslmode_require(new_url))

    return derived


def _dns_resolves(url: str, timeout: float = 3.0) -> bool:
    """يتحقق سريعاً أن hostname قابل للحل عبر DNS."""
    try:
        parsed = urlparse(url)
        host = parsed.hostname
        if not host:
            return False
        socket.setdefaulttimeout(timeout)
        socket.gethostbyname(host)
        return True
    except (socket.gaierror, socket.herror, OSError) as exc:
        logger.warning("[db-resolver] DNS resolution failed for %s: %s", _mask(url), exc)
        return False
    except Exception as exc:
        logger.warning("[db-resolver] DNS check unexpected error for %s: %s", _mask(url), exc)
        return False
    finally:
        socket.setdefaulttimeout(None)


def _tcp_connects(url: str, timeout: float = 4.0) -> bool:
    """يتحقق أن الاتصال TCP على المنفذ 5432 (أو المحدّد) يعمل."""
    try:
        parsed = urlparse(url)
        host = parsed.hostname
        port = parsed.port or 5432
        if not host:
            return False
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception as exc:
        logger.warning(
            "[db-resolver] TCP connect failed for %s:%s → %s",
            _mask(url), parsed.port or 5432, exc,
        )
        return False


def _build_candidates() -> List[str]:
    """
    يبني قائمة مرشّحين مرتّبة حسب الأفضلية:
      1. DATABASE_URL (المُعرَّف صراحة — عادةً Internal)
      2. DATABASE_URL_EXTERNAL (Fallback صريح إن وُجد)
      3. مشتقّات External تلقائية من Internal (لكل المناطق الشائعة)
    مع إزالة التكرارات مع الحفاظ على الترتيب.
    """
    raw_primary = (os.getenv("DATABASE_URL") or "").strip()
    raw_external = (os.getenv("DATABASE_URL_EXTERNAL") or "").strip()

    candidates: List[str] = []

    if raw_primary:
        primary = _normalize_scheme(raw_primary)
        # لو الرابط الأساسي خارجي بالفعل تأكد من sslmode
        try:
            primary_host = urlparse(primary).hostname or ""
            if _is_render_external_host(primary_host) or ".render.com" in primary_host:
                primary = _ensure_sslmode_require(primary)
        except Exception:
            pass
        candidates.append(primary)

    if raw_external:
        external = _ensure_sslmode_require(_normalize_scheme(raw_external))
        candidates.append(external)

    # اشتقاق تلقائي من Internal → External لكل المناطق
    if raw_primary:
        for derived in _derive_external_candidates(_normalize_scheme(raw_primary)):
            candidates.append(derived)

    # إزالة التكرارات مع الحفاظ على الترتيب
    seen: set[str] = set()
    unique: List[str] = []
    for candidate in candidates:
        if candidate and candidate not in seen:
            seen.add(candidate)
            unique.append(candidate)
    return unique


def resolve_database_url(force_refresh: bool = False) -> str:
    """
    يعيد أفضل رابط قاعدة بيانات متاح — يجرّب Internal أولاً ثم External.
    - Idempotent: بعد أول نجاح يُعيد نفس القيمة بدون فحوصات.
    - Fallback: عند فشل DNS للـ Internal يستخدم External تلقائياً.
    - إذا لم ينجح أي مرشّح يعيد أول واحد (تسليم القرار لـ SQLAlchemy مع رسالة خطأ واضحة).
    """
    global _RESOLVED_URL

    if _RESOLVED_URL and not force_refresh:
        return _RESOLVED_URL

    with _RESOLVE_LOCK:
        if _RESOLVED_URL and not force_refresh:
            return _RESOLVED_URL

        candidates = _build_candidates()
        if not candidates:
            fallback = "sqlite:///./yamshat.db"
            logger.warning("[db-resolver] no DATABASE_URL configured — falling back to %s", fallback)
            _RESOLVED_URL = fallback
            return fallback

        # جرّب كل مرشّح بترتيب الأفضلية
        for idx, candidate in enumerate(candidates, start=1):
            if candidate.startswith("sqlite"):
                logger.info("[db-resolver] using sqlite candidate: %s", _mask(candidate))
                _RESOLVED_URL = candidate
                return candidate

            logger.info(
                "[db-resolver] probing candidate #%d/%d: %s",
                idx, len(candidates), _mask(candidate),
            )
            if not _dns_resolves(candidate):
                logger.warning("[db-resolver]   ↳ DNS FAIL — skipping")
                continue
            if not _tcp_connects(candidate):
                logger.warning("[db-resolver]   ↳ TCP FAIL — skipping")
                continue

            logger.info("[db-resolver]   ↳ OK ✅ selected: %s", _mask(candidate))
            _RESOLVED_URL = candidate
            return candidate

        # لم ينجح أي مرشّح — أعِد الأول ليُرمى الخطأ الحقيقي لاحقاً
        chosen = candidates[0]
        logger.error(
            "[db-resolver] ALL %d candidates failed DNS/TCP; using primary anyway: %s",
            len(candidates), _mask(chosen),
        )
        _RESOLVED_URL = chosen
        return chosen


def reset_resolver_cache() -> None:
    """للاختبارات فقط — يمسح الرابط المخزَّن."""
    global _RESOLVED_URL
    with _RESOLVE_LOCK:
        _RESOLVED_URL = None


def get_last_resolved_url_masked() -> Optional[str]:
    """للتشخيص — يعيد الرابط المختار مع إخفاء كلمة المرور."""
    if _RESOLVED_URL:
        return _mask(_RESOLVED_URL)
    return None
