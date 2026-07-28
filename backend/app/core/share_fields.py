"""app.core.share_fields — v88.87

وحدة مشتركة لدعم حقول نظام المشاركة الموثق لدى Yamshat
(link_card / verified_by_yamshat / admin_source_*) عبر
المنشورات والريلز والقصص والرسائل.

هذه الوحدة تُجمّع دوال التطبيع (normalize) والتسلسل (serialize)
التي يستخدمها كل من:
  - post_service.py   (Posts)
  - reels.py          (Reels)
  - reels_fix.py      (Reels — نسخة احتياطية)
  - story_db_service  (Stories)
  - chat_realtime.py  (Messages)

الهدف: مصدر واحد للحقيقة (single source of truth) لتفادي
التكرار وضمان اتساق سلوك الحقول عبر كل الكيانات.
"""
from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Optional


# =====================================================================
# Normalization — تنظيف البيانات الواردة من الفرونت قبل الحفظ
# =====================================================================

def normalize_link_card(value: Any) -> Optional[dict]:
    """تنقيح كارت الرابط الغني قبل الحفظ.

    يقبل dict أو JSON string، ويُرجع dict منظّف أو None.
    """
    if not value:
        return None
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except Exception:
            return None
    if not isinstance(value, dict):
        return None

    def _s(k: str, limit: int = 500) -> Optional[str]:
        v = value.get(k)
        if v is None:
            return None
        try:
            v = str(v).strip()
        except Exception:
            return None
        return v[:limit] if v else None

    def _int(k: str) -> Optional[int]:
        v = value.get(k)
        try:
            return int(v) if v is not None and v != '' else None
        except Exception:
            return None

    def _num(k: str) -> Optional[float]:
        v = value.get(k)
        try:
            return float(v) if v is not None and v != '' else None
        except Exception:
            return None

    card = {
        'title': _s('title', 300),
        'description': _s('description', 2000),
        'thumbnail': _s('thumbnail', 2000),
        'sourceName': _s('sourceName', 200) or _s('source_name', 200),
        'sourceLogo': _s('sourceLogo', 200) or _s('source_logo', 200),
        'sourceUrl': _s('sourceUrl', 2000) or _s('source_url', 2000),
        'platform': _s('platform', 60),
        'supportsBrowser': bool(value.get('supportsBrowser'))
            if 'supportsBrowser' in value else None,
        'publishedAt': _s('publishedAt', 60) or _s('published_at', 60),
        'viewsCount': _int('viewsCount') if 'viewsCount' in value else _int('views_count'),
        'subscribersCount': _int('subscribersCount') if 'subscribersCount' in value else _int('subscribers_count'),
        'duration': _num('duration'),
    }
    # تنظيف None حتى لا نُخزّن حقولاً فارغة بلا داعٍ
    card = {k: v for k, v in card.items() if v not in (None, '')}
    return card or None


def normalize_admin_source(value: Any) -> Optional[dict]:
    """تنقيح سجل المصدر للأدمن قبل الحفظ.

    يقبل dict أو JSON string، ويُرجع dict منظّف أو None.
    """
    if not value:
        return None
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except Exception:
            return None
    if not isinstance(value, dict):
        return None

    def _s(k: str, limit: int = 500) -> Optional[str]:
        v = value.get(k)
        if v is None:
            return None
        try:
            v = str(v).strip()
        except Exception:
            return None
        return v[:limit] if v else None

    def _int(k: str) -> Optional[int]:
        v = value.get(k)
        try:
            return int(v) if v is not None and v != '' else None
        except Exception:
            return None

    captured_raw = _s('captured_at', 60)
    captured_dt = None
    if captured_raw:
        try:
            captured_dt = datetime.fromisoformat(
                captured_raw.replace('Z', '+00:00')
            ).replace(tzinfo=None)
        except Exception:
            captured_dt = None

    return {
        'source_platform': _s('source_platform', 60),
        'source_platform_name': _s('source_platform_name', 120),
        'source_url': _s('source_url', 2000),
        'source_title': _s('source_title', 2000),
        'source_text': _s('source_text', 5000),
        'source_author': _s('source_author', 200),
        'source_channel': _s('source_channel', 200),
        'captured_at': captured_dt,
        'share_mode': _s('share_mode', 20),
        'download_size': _int('download_size'),
        'download_mime': _s('download_mime', 120),
        'verified_by_yamshat': bool(value.get('verified_by_yamshat'))
            if 'verified_by_yamshat' in value else None,
    }


def dumps_link_card(card: Optional[dict]) -> Optional[str]:
    """يحوّل كارت الرابط إلى JSON string للحقن في عمود Text."""
    if not card:
        return None
    try:
        return json.dumps(card, ensure_ascii=False)
    except Exception:
        return None


def loads_link_card(raw: Any) -> Optional[dict]:
    """يقرأ كارت الرابط من عمود Text (JSON string) ويُرجع dict أو None."""
    if not raw:
        return None
    if isinstance(raw, dict):
        return raw
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        return None


# =====================================================================
# Build — بناء الحقول الجاهزة للحقن في كائن ORM
# =====================================================================

def build_share_extra_fields(
    link_card: Any,
    verified_by_yamshat: Any,
    admin_source: Any,
) -> dict:
    """يبني قاموس الحقول الجاهز للحقن في كائن ORM (Reel / Story / Message).

    يُرجع dict يحوي المفاتيح التالية (الموجودة في الأعمدة):
      - link_card: JSON string أو None
      - verified_by_yamshat: bool
      - admin_source_platform, admin_source_platform_name,
        admin_source_url, admin_source_title, admin_source_text,
        admin_source_author, admin_source_channel,
        admin_source_captured_at, admin_source_share_mode,
        admin_source_download_size, admin_source_download_mime
    """
    clean_link_card = normalize_link_card(link_card)
    clean_admin_source = normalize_admin_source(admin_source)

    # verified_by_yamshat: يُشتق من الوسيط الصريح أو من admin_source.verified_by_yamshat
    final_verified = bool(verified_by_yamshat)
    if not final_verified and clean_admin_source and clean_admin_source.get('verified_by_yamshat'):
        final_verified = True

    extra: dict = {
        'link_card': dumps_link_card(clean_link_card),
        'verified_by_yamshat': final_verified,
    }
    if clean_admin_source:
        extra.update({
            'admin_source_platform': clean_admin_source.get('source_platform'),
            'admin_source_platform_name': clean_admin_source.get('source_platform_name'),
            'admin_source_url': clean_admin_source.get('source_url'),
            'admin_source_title': clean_admin_source.get('source_title'),
            'admin_source_text': clean_admin_source.get('source_text'),
            'admin_source_author': clean_admin_source.get('source_author'),
            'admin_source_channel': clean_admin_source.get('source_channel'),
            'admin_source_captured_at': clean_admin_source.get('captured_at'),
            'admin_source_share_mode': clean_admin_source.get('share_mode'),
            'admin_source_download_size': clean_admin_source.get('download_size'),
            'admin_source_download_mime': clean_admin_source.get('download_mime'),
        })
    return extra


# =====================================================================
# Serialize — استخراج الحقول من كائن ORM لإرجاعها في الـ JSON response
# =====================================================================

def serialize_share_fields(obj: Any) -> dict:
    """يستخرج حقول المشاركة من كائن ORM (Reel / Story / Message / Post)
    ويُرجعها كقاموس جاهز للإدراج في payload الاستجابة.

    يستخدم getattr بأمان (safe) بحيث لا يُكسر إذا كانت الأعمدة
    غير موجودة بعد في قاعدة بيانات قديمة.
    """
    link_card_raw = getattr(obj, 'link_card', None)
    has_admin = (
        getattr(obj, 'admin_source_platform', None)
        or getattr(obj, 'admin_source_url', None)
    )
    return {
        'link_card': loads_link_card(link_card_raw),
        'verified_by_yamshat': bool(getattr(obj, 'verified_by_yamshat', False)),
        'admin_source': {
            'source_platform': getattr(obj, 'admin_source_platform', None),
            'source_platform_name': getattr(obj, 'admin_source_platform_name', None),
            'source_url': getattr(obj, 'admin_source_url', None),
            'source_title': getattr(obj, 'admin_source_title', None),
            'source_text': getattr(obj, 'admin_source_text', None),
            'source_author': getattr(obj, 'admin_source_author', None),
            'source_channel': getattr(obj, 'admin_source_channel', None),
            'captured_at': getattr(obj, 'admin_source_captured_at', None),
            'share_mode': getattr(obj, 'admin_source_share_mode', None),
            'download_size': getattr(obj, 'admin_source_download_size', None),
            'download_mime': getattr(obj, 'admin_source_download_mime', None),
        } if has_admin else None,
    }


# =====================================================================
# Extract — استخراج الحقول من payload الوارد من الفرونت
# =====================================================================

def extract_share_payload(payload: dict) -> dict:
    """يستخرج حقول المشاركة من قاموس الطلب الوارد من الفرونت.

    يدعم كلًا من snake_case و camelCase.
    يُرجع dict يحوي:
      - link_card
      - verified_by_yamshat (bool)
      - admin_source
    """
    link_card = payload.get('link_card') or payload.get('linkCard')
    verified_flag = bool(
        payload.get('verified_by_yamshat')
        or payload.get('verifiedByYamshat')
    )
    admin_source = payload.get('admin_source') or payload.get('adminSource')
    return {
        'link_card': link_card,
        'verified_by_yamshat': verified_flag,
        'admin_source': admin_source,
    }


def extract_share_form(form) -> dict:
    """يستخرج حقول المشاركة من Form data (multipart).

    يستخدم form.get بنفس أسماء الحقول.
    """
    link_card_raw = form.get('link_card') or form.get('linkCard')
    verified_raw = form.get('verified_by_yamshat') or form.get('verifiedByYamshat')
    admin_source_raw = form.get('admin_source') or form.get('adminSource')

    # قد تكون link_card نص JSON
    link_card = None
    if link_card_raw is not None:
        raw_str = str(link_card_raw).strip()
        if raw_str:
            link_card = raw_str

    admin_source = None
    if admin_source_raw is not None:
        raw_str = str(admin_source_raw).strip()
        if raw_str:
            admin_source = raw_str

    verified_flag = False
    if verified_raw is not None:
        v = str(verified_raw).strip().lower()
        verified_flag = v in ('true', '1', 'yes', 'on')

    return {
        'link_card': link_card,
        'verified_by_yamshat': verified_flag,
        'admin_source': admin_source,
    }
