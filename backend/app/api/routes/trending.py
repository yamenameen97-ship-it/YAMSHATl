"""
======================================================================
Yamshat — Trending Routes  (v88.51)
----------------------------------------------------------------------
مسارات REST لعرض التريندات وإدارتها من لوحة الأدمن.

  GET  /api/trending/global          — أفضل تريند عالمياً
  GET  /api/trending/country/{code}  — تريند دولة معينة
  GET  /api/trending/overview        — ملخص شامل (للـ dashboard box)
  POST /api/trending/refresh         — إعادة حساب وإطلاق الإشارات
  GET  /api/trending/signals         — آخر إشارات trending:new
  POST /api/trending/{key}/pin       — تثبيت عنصر تريند (أدمن)
  POST /api/trending/{key}/hide      — إخفاء عنصر تريند (أدمن)
======================================================================
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.services.trending_service import (
    compute_trending,
    emit_trending_signals,
    trending_overview,
    GLOBAL_TREND_THRESHOLD,
    COUNTRY_TREND_THRESHOLD,
    TREND_WINDOW_HOURS,
)

# v88.52 — حارس السلامة (منع التحريض/الكراهية/الطائفية/الإرهاب من التريند)
from app.services.trending_safety import (
    classify_trending_content,
    record_safety_audit,
    safety_snapshot,
    SAFETY_STATE,
)

router = APIRouter()

# حالة داخلية بسيطة لعناصر مُخفاة أو مثبتة من الأدمن
_ADMIN_STATE: dict[str, set[str]] = {"hidden": set(), "pinned": set()}


def _require_admin(user: User) -> None:
    if getattr(user, "role", "user") != "admin":
        raise HTTPException(status_code=403, detail="admin_only")


@router.get("/global")
def get_global_trending(
    limit: int = Query(20, ge=1, le=100),
    include_review: bool = Query(True, description="إظهار عناصر تحت المراجعة للأدمن"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = compute_trending(db, scope="global", limit=limit)
    is_admin = getattr(current_user, "role", "user") == "admin"
    filtered = []
    for i in items:
        if i.key in _ADMIN_STATE["hidden"]:
            continue
        # المحتوى الخطر يظهر للأدمن فقط (للمراجعة)، وليس للمستخدم العادي
        if not is_admin and i.safety_action != 'allow':
            continue
        if not include_review and i.safety_action == 'review':
            continue
        filtered.append(i.to_dict())
    # إبراز المثبت أولاً
    filtered.sort(key=lambda x: (x["key"] in _ADMIN_STATE["pinned"]), reverse=True)
    return {
        "scope": "global",
        "threshold": GLOBAL_TREND_THRESHOLD,
        "window_hours": TREND_WINDOW_HOURS,
        "count": len(filtered),
        "items": filtered,
        "safety_stats": dict(SAFETY_STATE['stats']),
    }


@router.get("/country/{code}")
def get_country_trending(
    code: str,
    limit: int = Query(20, ge=1, le=100),
    include_review: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = compute_trending(db, scope="country", country=code, limit=limit)
    is_admin = getattr(current_user, "role", "user") == "admin"
    filtered = []
    for i in items:
        if i.key in _ADMIN_STATE["hidden"]:
            continue
        if not is_admin and i.safety_action != 'allow':
            continue
        if not include_review and i.safety_action == 'review':
            continue
        filtered.append(i.to_dict())
    return {
        "scope": "country",
        "country": code.upper(),
        "threshold": COUNTRY_TREND_THRESHOLD,
        "window_hours": TREND_WINDOW_HOURS,
        "count": len(filtered),
        "items": filtered,
    }


@router.get("/overview")
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """ملخّص يظهر في صندوق لوحة التحكم بدل صندوق البثوث."""
    data = trending_overview(db, limit=5)
    data["hidden_count"] = len(_ADMIN_STATE["hidden"])
    data["pinned_count"] = len(_ADMIN_STATE["pinned"])
    return data


@router.post("/refresh")
async def refresh_and_signal(
    scope: str = Query("global", regex="^(global|country)$"),
    country: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    يعيد حساب التريندات ويطلق إشارات لغرفة الأدمن (Socket.IO)
    وإشعارات لأصحاب المنشورات التي بلغت مرحلة التريند لأول مرة.
    """
    _require_admin(current_user)
    items = compute_trending(db, scope=scope, country=country, limit=50)
    dispatched = await emit_trending_signals(db, items, scope=scope, country=country)
    return {
        "ok": True,
        "scope": scope,
        "country": country,
        "checked": len(items),
        "signals_dispatched": dispatched,
    }


@router.get("/signals")
def get_recent_signals(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    آخر عناصر بلغت التريند حديثاً (is_new=True في آخر تحديث).
    مفيدة كـ feed لحظي داخل صفحة إدارة التريندات.
    """
    _require_admin(current_user)
    globals_ = compute_trending(db, scope="global", limit=limit)
    signals = [i.to_dict() for i in globals_ if i.is_new]
    return {"count": len(signals), "items": signals}


@router.post("/{key}/pin")
def pin_trending(
    key: str,
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    _ADMIN_STATE["pinned"].add(key)
    _ADMIN_STATE["hidden"].discard(key)
    return {"ok": True, "pinned": list(_ADMIN_STATE["pinned"])}


@router.post("/{key}/hide")
def hide_trending(
    key: str,
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    _ADMIN_STATE["hidden"].add(key)
    _ADMIN_STATE["pinned"].discard(key)
    return {"ok": True, "hidden": list(_ADMIN_STATE["hidden"])}


@router.post("/{key}/unpin")
def unpin_trending(
    key: str,
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    _ADMIN_STATE["pinned"].discard(key)
    return {"ok": True}


@router.post("/{key}/unhide")
def unhide_trending(
    key: str,
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    _ADMIN_STATE["hidden"].discard(key)
    return {"ok": True}


# ======================================================================
# v88.52 — مسارات حارس السلامة
# تتيح للمدير العام رؤية التريندات الخطيرة وإيقافها من الصعود
# ======================================================================

@router.get("/safety/snapshot")
def get_safety_snapshot(current_user: User = Depends(get_current_user)):
    """لقطة كاملة: إحصاءات السلامة + سجل التدقيق + القوائم المخصصة."""
    _require_admin(current_user)
    return safety_snapshot()


@router.get("/safety/blocked")
def list_blocked_from_trending(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    محتوى منع من الصعود كتريند (تحريض/كراهية/طائفي/إرهاب/إلخ…).
    مخصص للمدير العام — يمكنه من مراجعتها وإزالتها أو السماح لها استثناءاً.
    """
    _require_admin(current_user)
    # إعادة الحساب دون إسقاط العناصر المحجوبة — نقرأ من السجل مباشرة
    blocked = [
        e for e in SAFETY_STATE['audit_log']
        if e.get('outcome') in ('blocked', 'manual_block')
    ][:limit]
    return {
        "count": len(blocked),
        "items": blocked,
        "stats": dict(SAFETY_STATE['stats']),
    }


@router.get("/safety/review")
def list_review_queue(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """قائمة انتظار المدير العام — محتوى مشبوه لم يصل درجة الحجب الآلي."""
    _require_admin(current_user)
    review = [
        e for e in SAFETY_STATE['audit_log']
        if e.get('outcome') == 'review'
    ][:limit]
    return {"count": len(review), "items": review}


@router.post("/safety/blocklist/add")
def safety_blocklist_add(
    word: str = Query(..., min_length=2, max_length=80),
    current_user: User = Depends(get_current_user),
):
    """يضيف كلمة مفتاحية للقائمة السوداء — أي تريند يحتويها يمنع من الصعود."""
    _require_admin(current_user)
    w = word.strip().lower()
    if w:
        SAFETY_STATE['custom_blocklist'].add(w)
    return {"ok": True, "custom_blocklist": sorted(SAFETY_STATE['custom_blocklist'])}


@router.post("/safety/blocklist/remove")
def safety_blocklist_remove(
    word: str = Query(..., min_length=1, max_length=80),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    SAFETY_STATE['custom_blocklist'].discard(word.strip().lower())
    return {"ok": True, "custom_blocklist": sorted(SAFETY_STATE['custom_blocklist'])}


@router.post("/safety/{key}/block")
def safety_manual_block(
    key: str,
    reason: str = Query("", max_length=200),
    current_user: User = Depends(get_current_user),
):
    """حجب يدوي — المدير العام يوقف صعود تريند محدد مهما كان تصنيفه."""
    _require_admin(current_user)
    SAFETY_STATE['manual_blocked_keys'].add(key)
    SAFETY_STATE['allowlist_keys'].discard(key)
    # سجل التدقيق
    from app.services.trending_safety import SafetyVerdict
    v = SafetyVerdict(
        risk_score=100,
        categories=['manual'],
        labels=['🔒 حجب يدوي'],
        matched_words=[],
        action='block',
        reason=reason or 'admin_manual_block',
    )
    record_safety_audit(
        key=key, title=key, verdict=v,
        outcome='manual_block',
        actor=getattr(current_user, 'username', 'admin'),
    )
    return {"ok": True, "key": key, "manual_blocked": sorted(SAFETY_STATE['manual_blocked_keys'])}


@router.post("/safety/{key}/allow")
def safety_manual_allow(
    key: str,
    reason: str = Query("", max_length=200),
    current_user: User = Depends(get_current_user),
):
    """سماح يدوي — يتجاوز تصنيف السلامة (للحالات الإيجابية المُفطهمة خطأً)."""
    _require_admin(current_user)
    SAFETY_STATE['allowlist_keys'].add(key)
    SAFETY_STATE['manual_blocked_keys'].discard(key)
    from app.services.trending_safety import SafetyVerdict
    v = SafetyVerdict(
        risk_score=0,
        categories=['manual'],
        labels=['✅ مُعتمد يدوياً'],
        matched_words=[],
        action='allow',
        reason=reason or 'admin_manual_allow',
    )
    record_safety_audit(
        key=key, title=key, verdict=v,
        outcome='manual_allow',
        actor=getattr(current_user, 'username', 'admin'),
    )
    return {"ok": True, "key": key, "allowlist": sorted(SAFETY_STATE['allowlist_keys'])}


@router.post("/safety/{key}/reset")
def safety_manual_reset(
    key: str,
    current_user: User = Depends(get_current_user),
):
    """إلغاء أي قرار يدوي وإعادة الاعتماد على التصنيف الآلي."""
    _require_admin(current_user)
    SAFETY_STATE['manual_blocked_keys'].discard(key)
    SAFETY_STATE['allowlist_keys'].discard(key)
    return {"ok": True}


@router.post("/safety/classify")
def safety_classify_text(
    text: str = Query(..., min_length=1, max_length=1000),
    current_user: User = Depends(get_current_user),
):
    """أداة تجريبية — يفحص الأدمن نصاً يدوياً لرؤية كيف يُصنّف."""
    _require_admin(current_user)
    v = classify_trending_content(title=text)
    return v.to_dict()
