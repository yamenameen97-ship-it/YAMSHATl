"""
Unified content scanner (v88.46 — Stage 2, point 6)
====================================================

فاحص محتوى تلقائي شامل يستخدمه كلٌّ من:
    - `chat.send_message`         (شات فردي)
    - `group_store.send_message`  (شات المجموعات)
    - `admin.scan_nsfw`           (فحص إداري لاحق)

الفاحص يجمع في مسار واحد:
    1) كشف اللغة المسيئة (عربي + إنجليزي).
    2) كشف تحريض العنف / التهديد.
    3) كشف الوسائط المشبوهة (روابط + امتدادات + كلمات NSFW).
    4) كشف السبام (روابط متكررة + رسائل تجارية عدوانية).

النتيجة (`ScanResult`) موحّدة:
    - `score`      : 0..100 (كلما ارتفع كان المحتوى أخطر)
    - `is_blocked` : True لو تخطى العتبة الصلبة (>=80) — يمنع الإرسال.
    - `is_flagged` : True لو تخطى عتبة المراقبة (>=40) — يمرّ لكن يُعلَّم للمدير.
    - `categories` : مجموعة تصنيفات (`profanity`, `violence`, `nsfw`, `spam`).
    - `reasons`    : أسباب مفصّلة (للـ audit / الإشعار للأدمن).

هذا الفاحص لا يشترط اتصالاً بأي خدمة خارجية؛ يمكن استبداله لاحقاً بنموذج
ML/Perspective API عبر تعديل `scan_content` فقط دون تغيير أي مستدعي.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Iterable, Optional


# ---------------------------------------------------------------------------
# قواميس الكلمات — عربي + إنجليزي (يمكن استبدالها بملف خارجي لاحقاً).
# ---------------------------------------------------------------------------

# كلمات إباحية / وسائط بالغين
_NSFW_WORDS: frozenset[str] = frozenset({
    # عربي
    'سكس', 'إباحي', 'اباحي', 'إباحية', 'اباحية', 'عاري', 'عارية',
    'جنس', 'جماع', 'اغتصاب', 'إغتصاب', 'عهر', 'دعارة',
    # إنجليزي
    'porn', 'porno', 'nude', 'nudes', 'xxx', 'nsfw', 'sex',
    'sexual', 'onlyfans', 'camgirl', 'escort', 'hentai',
})

_NSFW_URL_HINTS: tuple[str, ...] = (
    'porn', 'porno', 'xxx', 'sex', 'nsfw', 'nude', 'adult',
    'onlyfans', 'redtube', 'xvideo', 'pornhub', 'hentai',
)

# كلمات مسيئة / إهانات (بلا رتينج جنسي)
_PROFANITY_WORDS: frozenset[str] = frozenset({
    # عربي
    'كلب', 'كلاب', 'حمار', 'حمير', 'خنزير', 'قذر', 'قذرة',
    'وسخ', 'وسخة', 'حقير', 'حقيرة', 'تافه', 'تافهة',
    'غبي', 'غبية', 'أحمق', 'احمق', 'حمقاء',
    'ابن الحرام', 'ابن كلب', 'يا كلب', 'يا حمار',
    'شرموطة', 'شرموط', 'زبالة', 'قحبة',
    # إنجليزي
    'fuck', 'fucker', 'fucking', 'shit', 'bitch', 'bastard',
    'asshole', 'dick', 'cunt', 'slut', 'whore', 'motherfucker',
    'idiot', 'stupid', 'moron', 'retard',
})

# كلمات عنف / تهديد
_VIOLENCE_WORDS: frozenset[str] = frozenset({
    # عربي
    'اقتل', 'أقتل', 'سأقتلك', 'ساقتلك', 'راح اقتلك', 'راح أقتلك',
    'اذبح', 'أذبح', 'سأذبحك', 'ساذبحك', 'اذبحك',
    'فجر', 'فجّر', 'تفجير', 'انتحاري', 'قنبلة',
    'سلاح', 'رصاص', 'رصاصة', 'اطلق النار', 'أطلق النار',
    'اضربه', 'اضربها', 'اضربك', 'سأضربك', 'ساضربك',
    'تهديد', 'أهددك', 'اهددك', 'حرقك', 'أحرقك', 'احرقك',
    # إنجليزي
    'kill you', 'i will kill', 'ill kill', 'gonna kill',
    'murder', 'stab', 'shoot you', 'behead',
    'bomb', 'bombing', 'terror', 'terrorist', 'suicide bomb',
    'burn you', 'hang you', 'lynch',
})

# كلمات سبام / تجاري عدواني
_SPAM_WORDS: frozenset[str] = frozenset({
    'اربح', 'إربح', 'اضغط هنا', 'إضغط هنا', 'ربح فوري', 'قرض سريع',
    'استثمار مضمون', 'العملات الرقمية', 'فوركس',
    'click here', 'free money', 'earn cash', 'win now', 'crypto pump',
    'forex signals', 'bitcoin doubler', 'get rich', 'work from home now',
    'buy followers', 'buy likes', 'cheap followers',
})

# امتدادات ملفات وسائط "مشبوهة" (مرفوعة كصور/فيديو لكن قد تكون تنفيذية)
_SUSPICIOUS_EXTENSIONS: tuple[str, ...] = (
    '.exe', '.bat', '.cmd', '.sh', '.msi', '.apk', '.jar',
    '.scr', '.vbs', '.ps1', '.dll',
)

# عتبات القرار
_HARD_BLOCK_THRESHOLD = 80   # يمنع الإرسال بالكامل
_FLAG_THRESHOLD = 40         # يمرّ لكن يُميَّز للأدمن

# regex لكشف الروابط
_URL_RE = re.compile(r'https?://\S+', re.IGNORECASE)


# ---------------------------------------------------------------------------
# نتيجة الفحص
# ---------------------------------------------------------------------------

@dataclass
class ScanResult:
    score: int = 0
    categories: set[str] = field(default_factory=set)
    reasons: list[str] = field(default_factory=list)

    @property
    def is_blocked(self) -> bool:
        return self.score >= _HARD_BLOCK_THRESHOLD

    @property
    def is_flagged(self) -> bool:
        return self.score >= _FLAG_THRESHOLD

    def to_dict(self) -> dict:
        return {
            'score': int(self.score),
            'is_blocked': self.is_blocked,
            'is_flagged': self.is_flagged,
            'categories': sorted(self.categories),
            'reasons': list(self.reasons),
        }

    def merge(self, other: 'ScanResult') -> None:
        self.score = min(100, self.score + other.score)
        self.categories.update(other.categories)
        self.reasons.extend(other.reasons)


# ---------------------------------------------------------------------------
# فاحصات جزئية
# ---------------------------------------------------------------------------

def _normalize(text: str) -> str:
    """توحيد النص لتسهيل المقارنة (خفض حالة + إزالة تطويل الحروف العربية)."""
    low = text.lower()
    # إزالة كشيدة/تطويل عربي
    low = low.replace('\u0640', '')
    # توحيد الألف
    low = low.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا')
    return low


def _scan_text_profanity(text: str) -> ScanResult:
    res = ScanResult()
    if not text:
        return res
    norm = _normalize(text)
    for word in _PROFANITY_WORDS:
        if word in norm:
            res.score += 30
            res.categories.add('profanity')
            res.reasons.append(f'profanity:{word}')
            # كلمة واحدة تكفي لتصنيف عام؛ نستمر لجمع أدلّة إضافية بحد أقصى
            if len(res.reasons) >= 4:
                break
    return res


def _scan_text_violence(text: str) -> ScanResult:
    res = ScanResult()
    if not text:
        return res
    norm = _normalize(text)
    for phrase in _VIOLENCE_WORDS:
        if phrase in norm:
            res.score += 55
            res.categories.add('violence')
            res.reasons.append(f'violence:{phrase}')
            if len(res.reasons) >= 3:
                break
    return res


def _scan_text_nsfw(text: str) -> ScanResult:
    res = ScanResult()
    if not text:
        return res
    norm = _normalize(text)
    for word in _NSFW_WORDS:
        if word in norm:
            res.score += 45
            res.categories.add('nsfw')
            res.reasons.append(f'nsfw_word:{word}')
            if len(res.reasons) >= 3:
                break
    return res


def _scan_text_spam(text: str) -> ScanResult:
    res = ScanResult()
    if not text:
        return res
    norm = _normalize(text)
    # كلمات سبام
    for kw in _SPAM_WORDS:
        if kw in norm:
            res.score += 20
            res.categories.add('spam')
            res.reasons.append(f'spam_keyword:{kw}')
            break
    # روابط متعددة => سبام محتمل
    urls = _URL_RE.findall(text)
    if len(urls) >= 3:
        res.score += 25
        res.categories.add('spam')
        res.reasons.append(f'many_urls:{len(urls)}')
    # نص قصير جداً + رابط => probable spam
    elif urls and len(text.strip()) <= 20:
        res.score += 10
        res.categories.add('spam')
        res.reasons.append('short_text_with_url')
    return res


def _scan_media_url(media_url: str) -> ScanResult:
    res = ScanResult()
    if not media_url:
        return res
    low = str(media_url).lower()
    # كلمات NSFW في المضيف/المسار
    for hint in _NSFW_URL_HINTS:
        if hint in low:
            res.score += 50
            res.categories.add('nsfw')
            res.reasons.append(f'media_url_hint:{hint}')
            break
    # امتدادات تنفيذية مقنّعة
    for ext in _SUSPICIOUS_EXTENSIONS:
        if low.endswith(ext) or f'{ext}?' in low:
            res.score += 60
            res.categories.add('suspicious_media')
            res.reasons.append(f'suspicious_ext:{ext}')
            break
    return res


# ---------------------------------------------------------------------------
# الواجهة العامّة
# ---------------------------------------------------------------------------

def scan_content(
    text: Optional[str] = None,
    media_url: Optional[str] = None,
    attachments: Optional[Iterable[dict]] = None,
) -> ScanResult:
    """فحص موحّد لرسالة (نص + وسائط + مرفقات).

    Parameters
    ----------
    text : str | None
        نص الرسالة (بعد تنظيف HTML إن أمكن).
    media_url : str | None
        رابط الوسيط الأساسي (media_url في Message).
    attachments : Iterable[dict] | None
        مرفقات متعددة على الشكل [{'url': ..., 'kind': ..., 'file_name': ...}, ...]

    Returns
    -------
    ScanResult
        نتيجة موحّدة تحمل النقاط والتصنيفات والأسباب.
    """
    result = ScanResult()

    if text:
        result.merge(_scan_text_profanity(text))
        result.merge(_scan_text_violence(text))
        result.merge(_scan_text_nsfw(text))
        result.merge(_scan_text_spam(text))

    if media_url:
        result.merge(_scan_media_url(media_url))

    if attachments:
        for att in attachments:
            if not isinstance(att, dict):
                continue
            url = att.get('url') or att.get('cdn_url') or ''
            name = att.get('file_name') or ''
            if url:
                result.merge(_scan_media_url(str(url)))
            if name:
                # فحص اسم الملف كنص خفيف (لا نُعدّه سبام)
                result.merge(_scan_text_nsfw(str(name)))

    # حدّ أعلى 100
    if result.score > 100:
        result.score = 100
    return result


def scan_or_reject(
    text: Optional[str] = None,
    media_url: Optional[str] = None,
    attachments: Optional[Iterable[dict]] = None,
) -> ScanResult:
    """يفحص المحتوى ويعيد النتيجة؛ لا يرفع استثناءات — المستدعي يقرّر.

    مساعد مبسّط لمن يفضل نمط "افحص ثم تصرّف" بدون خيار hard-block.
    """
    return scan_content(text=text, media_url=media_url, attachments=attachments)


__all__ = ['ScanResult', 'scan_content', 'scan_or_reject']
