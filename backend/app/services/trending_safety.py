"""
======================================================================
Yamshat — Trending Safety Guard (v88.52)
----------------------------------------------------------------------
حارس السلامة لنظام التريندات:
- يمنع تلقائياً صعود أي محتوى يحرّض على العنف/الكراهية/العداء/التعصب.
- يُصنّف المحتوى ذو التوجه السياسي/الديني/الطائفي/المذهبي/الإرهابي.
- يوفّر واجهة للمدير العام لإطلاع فوري + تحكم يدوي (حجب/سماح/مراجعة).

المكوّنات:
  1) قواميس كلمات مفتاحية مصنّفة (7 فئات خطر).
  2) دالة `classify_trending_content()` تُرجع مستوى الخطر + الفئات + الأسباب.
  3) دالة `is_trending_blocked()` تقرر منع الصعود.
  4) قائمة سوداء ديناميكية يديرها الأدمن (`SAFETY_STATE`).
  5) سجل قرارات فوري (audit trail) لكل صعود مرفوض.

يستخدم `content_scanner` الأساسي كنقطة انطلاق ثم يضيف فئات التريند
الخاصة (سياسي/ديني/طائفي/إرهاب/تحريض/تعصب) غير المشمولة به.
======================================================================
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Any, Optional

try:
    from app.core.content_scanner import scan_content as _base_scan
except Exception:  # pragma: no cover
    _base_scan = None


# ---------------------------------------------------------------------------
# قواميس تصنيف التريند — عربي + إنجليزي
# ---------------------------------------------------------------------------

# 1) كراهية / عنصرية / عداء
_HATE_WORDS: frozenset[str] = frozenset({
    # عربي
    'يا كفار', 'كفار', 'كفرة', 'الكفرة', 'زنادقة', 'مرتدين', 'مرتدون',
    'الحقراء', 'المنحطين', 'حثالة', 'صراصير', 'جراثيم بشرية',
    'اقلية قذرة', 'أقلية قذرة', 'عرق نجس', 'دم نجس',
    'يجب ابادة', 'يجب إبادة', 'يستحقون الموت', 'دمهم حلال',
    'نموتهم', 'نبيدهم', 'نمحوهم', 'نطردهم',
    'الأعداء الملاعين', 'ملاعين', 'حثالة البشرية',
    # إنجليزي
    'kill them all', 'exterminate', 'genocide them', 'wipe them out',
    'inferior race', 'subhuman', 'vermin', 'roaches', 'parasites',
    'ethnic cleansing', 'racial purity', 'white power', 'blood purity',
})

# 2) تحريض / دعوة للعنف والفتنة
_INCITEMENT_WORDS: frozenset[str] = frozenset({
    # عربي
    'انتفضوا', 'اشعلوها', 'أشعلوها', 'أشعلوا الحرب', 'اشعلوا الحرب',
    'احرقوا', 'احرقوهم', 'اقتلوا', 'اقتلوهم', 'ذبحوهم', 'اذبحوهم',
    'ثوروا عليهم', 'انقلبوا', 'انقلبوا عليهم',
    'اهجموا', 'هاجموا', 'شنّوا هجوماً', 'شنوا هجمة',
    'دمروا', 'دمّروا', 'خرّبوا', 'خربوا', 'فجّروا', 'فجروا',
    'اسلحوا انفسكم', 'أسلحوا أنفسكم', 'تسلحوا',
    'انزلوا للشارع', 'انزلوا الشوارع', 'اقلبوا النظام',
    'انتقموا', 'خذوا بثأركم', 'خذوا ثأركم',
    # إنجليزي
    'rise up and kill', 'burn it down', 'take up arms',
    'attack them', 'destroy them', 'overthrow', 'revolt now',
    'incite violence', 'call to arms', 'take revenge', 'blood revenge',
})

# 3) طائفية / مذهبية
_SECTARIAN_WORDS: frozenset[str] = frozenset({
    # عربي — إهانات مذهبية شائعة (سواء من أي طرف)
    'روافض', 'الروافض', 'نواصب', 'النواصب', 'مجوس', 'المجوس',
    'صفويين', 'الصفويين', 'دواعش', 'وهابية إرهابية', 'وهابية ارهابية',
    'شيعة كلاب', 'سنة كلاب', 'شيعة نجسين', 'سنة نجسين',
    'خوارج العصر', 'ملة كافرة', 'مذهب باطل',
    'اعداء اهل البيت', 'أعداء آل البيت',
    'تكفير الشيعة', 'تكفير السنة', 'تكفير الصوفية',
    'الصهاينة الجدد', 'عملاء الصفويين', 'عملاء الوهابية',
    # إنجليزي
    'shia dogs', 'sunni dogs', 'infidel sect', 'heretic sect',
    'apostate sect', 'kill the shia', 'kill the sunni',
})

# 4) توجه ديني متطرف (تكفير + تحريض ديني)
_RELIGIOUS_EXTREMISM: frozenset[str] = frozenset({
    # عربي
    'تكفير', 'كافر يجب قتله', 'كافرة يجب قتلها', 'مرتد يقتل',
    'مرتدة تقتل', 'استحلال دم', 'دمه حلال', 'دمها حلال',
    'ذبح الكفار', 'قتل المرتدين', 'حرب مقدسة على',
    'الجهاد ضد المسلمين', 'الجهاد ضد المسيحيين', 'الجهاد ضد اليهود',
    'اباد اليهود', 'أبيدوا اليهود', 'اباد النصارى', 'أبيدوا النصارى',
    'اباد المسلمين', 'أبيدوا المسلمين', 'موت للكفار', 'الموت للكفار',
    # إنجليزي
    'holy war against', 'kill the infidels', 'apostates must die',
    'kill all jews', 'kill all christians', 'kill all muslims',
    'religious cleansing',
})

# 5) توجه سياسي حاد (تحريض ضد فئة سياسية / انقلاب / اغتيال زعيم)
_POLITICAL_INCITEMENT: frozenset[str] = frozenset({
    # عربي
    'اغتيال الرئيس', 'اغتيال الملك', 'اغتيال الأمير',
    'اسقاط النظام بالقوة', 'إسقاط النظام بالقوة',
    'انقلاب مسلح', 'انقلاب عسكري الآن',
    'اعدموا الحكومة', 'أعدموا الحكومة', 'اعدام الحكام',
    'الموت للرئيس', 'الموت للملك', 'الموت للحاكم',
    'ذبح المعارضة', 'اباد المعارضة', 'اباد الحزب',
    'اباد الليبراليين', 'اباد الاسلاميين', 'اباد اليساريين',
    # إنجليزي
    'assassinate the president', 'kill the king', 'kill the president',
    'armed coup now', 'overthrow the government by force',
    'execute the government', 'death to the leader',
})

# 6) إرهاب / تنظيمات مسلحة
_TERROR_WORDS: frozenset[str] = frozenset({
    # عربي
    'داعش', 'الدولة الإسلامية', 'الدولة الاسلامية', 'خلافة داعش',
    'القاعدة', 'تنظيم القاعدة', 'جبهة النصرة', 'النصرة',
    'بيعة البغدادي', 'بيعة الظواهري', 'بيعة الجولاني',
    'عمليات استشهادية', 'حزام ناسف', 'أحزمة ناسفة', 'احزمة ناسفة',
    'ذئاب منفردة', 'خلايا نائمة', 'استهداف المدنيين',
    'صناعة القنابل', 'تصنيع القنابل', 'تحضير التفجير',
    'تفجير انتحاري', 'مفخخة', 'سيارة مفخخة',
    'دليل تصنيع', 'كيفية صنع قنبلة', 'كيف تصنع قنبلة',
    # إنجليزي
    'isis', 'daesh', 'al-qaeda', 'al qaeda', 'boko haram',
    'lone wolf attack', 'sleeper cell', 'bomb making tutorial',
    'how to make a bomb', 'suicide vest', 'car bomb tutorial',
    'terror attack plan', 'target civilians',
})

# 7) تعصب / تمييز عرقي / قومي
_BIGOTRY_WORDS: frozenset[str] = frozenset({
    # عربي
    'العرب حثالة', 'الأكراد كلاب', 'الاكراد كلاب', 'الفرس مجوس',
    'الترك خونة', 'الأمازيغ خونة', 'الامازيغ خونة',
    'الأفارقة عبيد', 'الافارقة عبيد', 'السود عبيد',
    'الأقليات نجسة', 'الاقليات نجسة',
    'اطردوا اللاجئين', 'اطردوا الأجانب', 'اطردوا الاجانب',
    'اطردوا السود', 'اطردوا العرب', 'اطردوا الشرقيين',
    'عرق متفوق', 'عرق منحط',
    # إنجليزي
    'arabs are trash', 'kurds are dogs', 'blacks are inferior',
    'whites are superior', 'jews control everything',
    'deport all migrants', 'deport all foreigners', 'master race',
})

# خريطة الفئات → (كلمات، وزن، ملصق عربي)
_CATEGORY_MAP: dict[str, tuple[frozenset[str], int, str]] = {
    'hate':         (_HATE_WORDS,             90, '🛑 كراهية وعنصرية'),
    'incitement':   (_INCITEMENT_WORDS,       85, '⚠️ تحريض على العنف'),
    'sectarian':    (_SECTARIAN_WORDS,        80, '☪️ تحريض طائفي/مذهبي'),
    'religious':    (_RELIGIOUS_EXTREMISM,    95, '🕌 تطرف ديني'),
    'political':    (_POLITICAL_INCITEMENT,   85, '🏛️ تحريض سياسي'),
    'terror':       (_TERROR_WORDS,          100, '💣 محتوى إرهابي'),
    'bigotry':      (_BIGOTRY_WORDS,          80, '🚫 تعصب قومي/عرقي'),
}

# عتبة الحجب التلقائي — أي محتوى يتخطاها لا يصعد كتريند إطلاقاً
_AUTO_BLOCK_THRESHOLD = 75
# عتبة المراجعة — يظل مرئي للأدمن لكن يوسم "قيد المراجعة"
_REVIEW_THRESHOLD = 45


# ---------------------------------------------------------------------------
# حالة أمان مشتركة (يديرها الأدمن)
# ---------------------------------------------------------------------------

SAFETY_STATE: dict[str, Any] = {
    # كلمات مفتاحية إضافية أدخلها الأدمن يدوياً (تُضاف لقواميس الحجب)
    'custom_blocklist': set(),
    # مفاتيح تريند مسموح بها يدوياً (تجاوز آلي — الأدمن يعتمدها رغم التصنيف)
    'allowlist_keys': set(),
    # مفاتيح تريند محجوبة يدوياً بواسطة الأدمن
    'manual_blocked_keys': set(),
    # سجل آخر 200 قرار حجب/مراجعة
    'audit_log': [],
    # إحصاءات مباشرة
    'stats': {
        'auto_blocked': 0,
        'flagged_review': 0,
        'manually_blocked': 0,
        'manually_allowed': 0,
    },
}

_AUDIT_MAX = 200


def _normalize(text: str) -> str:
    low = text.lower()
    low = low.replace('\u0640', '')  # كشيدة
    low = low.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا')
    low = low.replace('ة', 'ه').replace('ى', 'ي')
    return low


# ---------------------------------------------------------------------------
# نتيجة التصنيف
# ---------------------------------------------------------------------------

@dataclass
class SafetyVerdict:
    risk_score: int = 0             # 0..100
    categories: list[str] = field(default_factory=list)   # keys من _CATEGORY_MAP
    labels: list[str] = field(default_factory=list)       # ملصقات عربية للعرض
    matched_words: list[str] = field(default_factory=list)
    action: str = 'allow'           # allow | review | block
    reason: str = ''

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def classify_trending_content(
    title: str = '',
    body: str = '',
    hashtags: Optional[list[str]] = None,
) -> SafetyVerdict:
    """
    يُصنّف نص التريند ويُرجع قرار الحجب/المراجعة/السماح.
    يفحص العنوان + الجسم + الوسوم مجتمعةً.
    """
    verdict = SafetyVerdict()
    parts: list[str] = []
    if title:
        parts.append(str(title))
    if body:
        parts.append(str(body))
    if hashtags:
        parts.extend(str(h) for h in hashtags)
    combined = ' '.join(parts).strip()
    if not combined:
        return verdict

    norm = _normalize(combined)

    # 1) الفئات المصنّفة
    for cat_key, (words, weight, label) in _CATEGORY_MAP.items():
        for w in words:
            if w in norm:
                verdict.categories.append(cat_key)
                verdict.labels.append(label)
                verdict.matched_words.append(w)
                verdict.risk_score = min(100, verdict.risk_score + weight // 2)
                break  # كلمة واحدة كافية لتصنيف الفئة

    # 2) قائمة الأدمن المخصصة
    for custom in SAFETY_STATE['custom_blocklist']:
        if custom and custom in norm:
            verdict.categories.append('admin_custom')
            verdict.labels.append('🔒 قائمة الأدمن')
            verdict.matched_words.append(custom)
            verdict.risk_score = min(100, verdict.risk_score + 60)
            break

    # 3) الفاحص الأساسي (عنف/إباحي/شتائم) — يزيد النقاط لكن لا يقود وحده لحجب تريند
    if _base_scan is not None:
        try:
            base = _base_scan(text=combined)
            if 'violence' in base.categories:
                verdict.risk_score = min(100, verdict.risk_score + 40)
                if 'incitement' not in verdict.categories:
                    verdict.categories.append('incitement')
                    verdict.labels.append('⚠️ تحريض على العنف')
        except Exception:
            pass

    # 4) قرار
    if verdict.risk_score >= _AUTO_BLOCK_THRESHOLD:
        verdict.action = 'block'
        verdict.reason = 'auto_block_high_risk'
    elif verdict.risk_score >= _REVIEW_THRESHOLD:
        verdict.action = 'review'
        verdict.reason = 'needs_admin_review'
    else:
        verdict.action = 'allow'
        verdict.reason = 'clean'

    # إزالة التكرار مع الحفاظ على الترتيب
    verdict.categories = list(dict.fromkeys(verdict.categories))
    verdict.labels = list(dict.fromkeys(verdict.labels))
    verdict.matched_words = list(dict.fromkeys(verdict.matched_words))[:6]

    return verdict


def is_trending_blocked(key: str, verdict: SafetyVerdict) -> bool:
    """
    يقرر ما إذا كان يجب منع صعود التريند:
      - إذا الأدمن سمح يدوياً (allowlist) → لا يُحجب مهما كان
      - إذا الأدمن حجب يدوياً → يُحجب
      - غير ذلك: يعتمد على قرار المصنّف (action == 'block')
    """
    if key in SAFETY_STATE['allowlist_keys']:
        return False
    if key in SAFETY_STATE['manual_blocked_keys']:
        return True
    return verdict.action == 'block'


def record_safety_audit(
    key: str,
    title: str,
    verdict: SafetyVerdict,
    outcome: str,
    actor: str = 'system',
) -> None:
    """
    يسجّل قرار حجب/مراجعة/سماح في سجل السلامة اللحظي.
    """
    entry = {
        'timestamp': datetime.utcnow().isoformat(),
        'key': key,
        'title': (title or '')[:120],
        'risk_score': verdict.risk_score,
        'categories': verdict.categories,
        'labels': verdict.labels,
        'matched_words': verdict.matched_words,
        'action': verdict.action,
        'outcome': outcome,          # blocked | review | allowed | manual_block | manual_allow
        'actor': actor,
    }
    SAFETY_STATE['audit_log'].insert(0, entry)
    if len(SAFETY_STATE['audit_log']) > _AUDIT_MAX:
        SAFETY_STATE['audit_log'] = SAFETY_STATE['audit_log'][:_AUDIT_MAX]

    # عدّادات
    if outcome == 'blocked':
        SAFETY_STATE['stats']['auto_blocked'] += 1
    elif outcome == 'review':
        SAFETY_STATE['stats']['flagged_review'] += 1
    elif outcome == 'manual_block':
        SAFETY_STATE['stats']['manually_blocked'] += 1
    elif outcome == 'manual_allow':
        SAFETY_STATE['stats']['manually_allowed'] += 1


def safety_snapshot() -> dict[str, Any]:
    """لقطة كاملة لواجهة الأدمن."""
    return {
        'thresholds': {
            'auto_block': _AUTO_BLOCK_THRESHOLD,
            'review': _REVIEW_THRESHOLD,
        },
        'categories': [
            {'key': k, 'label': v[2], 'weight': v[1], 'count_words': len(v[0])}
            for k, v in _CATEGORY_MAP.items()
        ],
        'stats': dict(SAFETY_STATE['stats']),
        'custom_blocklist': sorted(SAFETY_STATE['custom_blocklist']),
        'allowlist_keys': sorted(SAFETY_STATE['allowlist_keys']),
        'manual_blocked_keys': sorted(SAFETY_STATE['manual_blocked_keys']),
        'audit_log': SAFETY_STATE['audit_log'][:50],
        'generated_at': datetime.utcnow().isoformat(),
    }


__all__ = [
    'SafetyVerdict',
    'classify_trending_content',
    'is_trending_blocked',
    'record_safety_audit',
    'safety_snapshot',
    'SAFETY_STATE',
]
