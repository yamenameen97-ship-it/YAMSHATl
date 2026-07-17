"""normalize_media_url — v88.3.2 MEDIA RENDER ROOT FIX.

المشكلة السابقة (v88.3.1):
- عند فشل رفع Cloudinary صامتاً، يُرجَع رابط محلي `/uploads/xxx`.
- على Render بدون Persistent Disk، الملفات المحلية تُحذف بعد كل نشر/إعادة تشغيل.
- المشتركون يرون الصور/الفيديو مكسورة (والريلز لا يظهر بعد رفعه لأن الرابط
  المُرجَع نسبي `/uploads/...` والمتصفح يحاول جلبه من نفس Origin الواجهة —
  إذا كانت الواجهة والباك‑إند على نطاقات مختلفة فالنتيجة 404).

الإصلاح:
- `normalize_media_url` تُرجِع الآن **دائماً** رابطاً مطلقاً قابلاً للتشغيل
  للمسارات المحلية (`/uploads/...`) ما دام `BACKEND_ORIGIN` أو
  `RENDER_EXTERNAL_URL` معلوماً — حتى لو كانت الواجهة على نفس Origin.
  السبب: <video src=…> ذو المسار النسبي قد يفشل مع cookies/CORS/range‑requests
  عند بعض مسارات النشر (Full‑stack مع Nginx يجعل /uploads/ يعمل، لكن SPA
  فقط لا يخدم الملف).
- روابط Cloudinary/CDN المطلقة تبقى كما هي.
- روابط `blob:` و`data:` لا تُغيَّر أبداً.
"""
from __future__ import annotations

from urllib.parse import urlparse

from app.core.config import settings


def _base_origin() -> str:
    """أفضل origin مطلق متاح للـ backend.

    أولوية: CDN_BASE_URL > BACKEND_ORIGIN > RENDER_EXTERNAL_URL.
    """
    for candidate in (
        getattr(settings, 'CDN_BASE_URL', ''),
        getattr(settings, 'BACKEND_ORIGIN', ''),
        getattr(settings, 'RENDER_EXTERNAL_URL', ''),
    ):
        cleaned = str(candidate or '').strip().rstrip('/')
        if cleaned:
            return cleaned
    return ''


def _is_cloudinary_or_cdn(url: str) -> bool:
    """يميّز روابط CDN/Cloudinary التي لا يجب المسّ بها."""
    try:
        host = (urlparse(url).netloc or '').lower()
    except Exception:
        return False
    return any(
        marker in host
        for marker in (
            'cloudinary',
            'res.cloudinary.com',
            'imagekit.io',
            'bunnycdn',
            'b-cdn.net',
            'cloudflare',
            'r2.dev',
            's3.amazonaws',
            'digitaloceanspaces',
            'akamaized.net',
        )
    )


def normalize_media_url(candidate: str | None) -> str | None:
    """يحوّل أي رابط وسائط إلى رابط قابل للتشغيل عبر أي Origin.

    قواعد:
      1. فارغ → None.
      2. blob:/data: → كما هو (رفع مؤقت في الواجهة).
      3. رابط مطلق يُشير إلى CDN معروف → كما هو.
      4. رابط مطلق آخر يحوي /uploads/ ولدينا base_origin → نبنيه من جديد
         باستخدام base_origin (يعالج مضيفات onrender.com القديمة).
      5. رابط مطلق آخر → كما هو.
      6. مسار يبدأ بـ api/uploads/ أو /api/uploads/ → نصلحه إلى /uploads/.
      7. مسار يبدأ بـ / → إن كان لدينا base_origin نبني رابطاً مطلقاً،
         وإلاّ نُبقيه نسبياً (وهذا الآن يعمل مع mount /uploads على FastAPI).
      8. باقي المسارات → نُبقيها كما هي.
    """
    raw = str(candidate or '').strip()
    if not raw:
        return None
    if raw.startswith(('blob:', 'data:')):
        return raw

    base_origin = _base_origin()

    # روابط مطلقة
    parsed = urlparse(raw)
    if parsed.scheme in ('http', 'https'):
        # روابط CDN معروفة — لا تُلمَس
        if _is_cloudinary_or_cdn(raw):
            return raw
        path = parsed.path or ''
        # تصحيح المسار /api/uploads/ → /uploads/
        if path.startswith('/api/uploads/'):
            path = path[4:]
        query = f'?{parsed.query}' if parsed.query else ''
        fragment = f'#{parsed.fragment}' if parsed.fragment else ''
        # روابط محلية تشير إلى /uploads → أعد بناءها بأصل الباك‑إند الحالي
        if '/uploads/' in path and base_origin:
            return f'{base_origin}{path}{query}{fragment}'
        # في حال عدم توفر base_origin ولكن host موجود في الرابط أصلاً، نتركه
        return raw

    # مسارات نسبية api/uploads (بدون سلَش أول)
    if raw.startswith('api/uploads/'):
        raw = f'/{raw[4:]}'
    elif raw.startswith('/api/uploads/'):
        raw = raw[4:]

    # مسار يبدأ بسلَش
    if raw.startswith('/'):
        return f'{base_origin}{raw}' if base_origin else raw

    # مسارات مثل uploads/xxx بدون سلَش
    if raw.startswith('uploads/'):
        path = f'/{raw.lstrip("/")}'
        return f'{base_origin}{path}' if base_origin else path

    return raw


def normalize_media_list(values) -> list[str]:
    if values is None:
        return []
    if isinstance(values, str):
        values = [values]
    cleaned: list[str] = []
    for item in values if isinstance(values, list) else []:
        normalized = normalize_media_url(item)
        if normalized and normalized not in cleaned:
            cleaned.append(normalized)
    return cleaned
