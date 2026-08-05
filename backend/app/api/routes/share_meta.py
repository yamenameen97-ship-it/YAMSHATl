# ✅ v89.39 — Share Meta Router (Open Graph ديناميكي لكل منشور)
# ----------------------------------------------------------------
# المشكلة الجذرية: الفرونت SPA (React HashRouter) — عند مشاركة رابط
# منشور في واتساب/تيليجرام/X… يجلب الـ crawler الصفحة index.html
# الثابتة بدون og:image خاص بالمنشور، فتظهر المعاينة فارغة أو بشعار عام.
#
# الحل: endpoints عامة (بدون مصادقة) تُعيد HTML صغيراً يحوي وسوم
# Open Graph + Twitter Card مبنية من بيانات المنشور الحقيقية
# (العنوان/الوصف/الصورة من link_card أو media)، ثم تُعيد توجيه
# المستخدم البشري إلى التطبيق.
#
# المسارات:
#   GET /api/share-meta/post/{post_id}  → HTML بـ og:* لمنشور
#   GET /api/share-meta/reel/{reel_id}  → HTML بـ og:* لريل
#   GET /api/share-meta/health          → فحص صحة سريع
# ----------------------------------------------------------------
from __future__ import annotations

import html
import json
import logging
import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.post import Post
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(tags=['share-meta'])

_APP_NAME = 'YAMSHAT | يمشات'
_DEFAULT_DESC = 'شاهد هذا المحتوى على يمشات — منصة التواصل العربية.'


def _frontend_origin() -> str:
    return (os.getenv('FRONTEND_ORIGIN') or os.getenv('APP_BASE_URL') or '').rstrip('/')


def _backend_origin() -> str:
    return (os.getenv('BACKEND_ORIGIN') or os.getenv('RENDER_EXTERNAL_URL') or '').rstrip('/')


def _abs_url(url: str | None) -> str | None:
    """يحوّل الرابط النسبي إلى مطلق باستخدام أصل الباك-إند، ويترك المطلق كما هو."""
    if not url:
        return None
    u = str(url).strip()
    if not u:
        return None
    if u.startswith('http://') or u.startswith('https://') or u.startswith('data:'):
        return u
    base = _backend_origin()
    if not base:
        return None
    if not u.startswith('/'):
        u = '/' + u
    return base + u


def _loads_json(raw):
    if not raw:
        return None
    if isinstance(raw, (dict, list)):
        return raw
    try:
        return json.loads(raw)
    except Exception:
        return None


def _first_media_url(post: Post) -> str | None:
    """يستخرج أفضل صورة/فيديو تمثيلي للمنشور من كل الحقول الممكنة."""
    # 1) image_url المباشر
    if getattr(post, 'image_url', None):
        return post.image_url
    # 2) media (قد تكون رابطاً أو JSON)
    media = getattr(post, 'media', None)
    if media:
        parsed = _loads_json(media)
        if isinstance(parsed, list) and parsed:
            first = parsed[0]
            if isinstance(first, dict):
                for key in ('url', 'media_url', 'cdn_url', 'thumbnail_url'):
                    if first.get(key):
                        return first[key]
            elif isinstance(first, str):
                return first
        elif isinstance(parsed, dict):
            for key in ('url', 'media_url', 'cdn_url', 'thumbnail_url'):
                if parsed.get(key):
                    return parsed[key]
        elif isinstance(media, str) and media.startswith(('/', 'http')):
            return media
    # 3) media_json
    parsed = _loads_json(getattr(post, 'media_json', None))
    if isinstance(parsed, list) and parsed:
        first = parsed[0]
        if isinstance(first, dict):
            for key in ('url', 'media_url', 'cdn_url', 'thumbnail_url'):
                if first.get(key):
                    return first[key]
    return None


def _truncate(text: str, limit: int) -> str:
    text = (text or '').strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + '…'


def _build_og_html(*, title: str, description: str, image: str | None,
                   page_url: str, app_url: str, site_name: str = _APP_NAME) -> str:
    """يبني صفحة HTML صغيرة بوسوم Open Graph + Twitter Card + توجيه تلقائي."""
    t = html.escape(_truncate(title, 90) or _APP_NAME, quote=True)
    d = html.escape(_truncate(description, 200) or _DEFAULT_DESC, quote=True)
    p = html.escape(page_url, quote=True)
    a = html.escape(app_url, quote=True)
    img_tag = ''
    img_meta_twitter = ''
    if image:
        i = html.escape(image, quote=True)
        img_tag = (
            f'<meta property="og:image" content="{i}"/>\n'
            f'  <meta property="og:image:secure_url" content="{i}"/>\n'
            f'  <meta property="og:image:width" content="1200"/>\n'
            f'  <meta property="og:image:height" content="630"/>'
        )
        img_meta_twitter = f'<meta name="twitter:image" content="{i}"/>'
    return f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <title>{t}</title>
  <meta name="description" content="{d}"/>
  <meta property="og:type" content="article"/>
  <meta property="og:site_name" content="{html.escape(site_name, quote=True)}"/>
  <meta property="og:title" content="{t}"/>
  <meta property="og:description" content="{d}"/>
  <meta property="og:url" content="{p}"/>
  {img_tag}
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="{t}"/>
  <meta name="twitter:description" content="{d}"/>
  {img_meta_twitter}
  <meta http-equiv="refresh" content="0;url={a}"/>
  <link rel="canonical" href="{p}"/>
</head>
<body style="font-family:system-ui,sans-serif;background:#0b0e17;color:#e6e9f2;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
  <div style="text-align:center">
    <p>جارٍ فتح المحتوى في يمشات…</p>
    <p><a href="{a}" style="color:#8b5cf6">اضغط هنا إذا لم يتم التحويل تلقائياً</a></p>
  </div>
</body>
</html>"""


@router.get('/health')
async def share_meta_health():
    return {'ok': True, 'service': 'share-meta', 'version': 'v89.39'}


@router.get('/post/{post_id}', response_class=HTMLResponse)
async def post_share_meta(post_id: int, db: Session = Depends(get_db)):
    """يُعيد HTML بـ og:image ديناميكي لمنشور — لزاحفات المعاينة (واتساب/تيليجرام/X)."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail='Post not found')

    author = db.query(User).filter(User.id == post.user_id).first()
    author_name = (
        getattr(author, 'full_name', None)
        or getattr(author, 'display_name', None)
        or getattr(author, 'username', None)
        or 'مستخدم يمشات'
    )

    # link_card له الأولوية: فيه عنوان/وصف/thumbnail من المصدر الخارجي
    link_card = _loads_json(getattr(post, 'link_card', None)) or {}

    title = (
        link_card.get('title')
        or _truncate(getattr(post, 'content', '') or '', 70)
        or f'منشور {author_name}'
    )
    description = (
        link_card.get('description')
        or _truncate(getattr(post, 'content', '') or '', 190)
        or f'منشور من {author_name} على يمشات'
    )

    image = _abs_url(
        link_card.get('thumbnail')
        or _first_media_url(post)
        or getattr(author, 'avatar_url', None)
        or getattr(author, 'avatar', None)
    )

    base = _backend_origin()
    page_url = f'{base}/api/share-meta/post/{post_id}' if base else f'/api/share-meta/post/{post_id}'
    front = _frontend_origin()
    app_url = f'{front}/#/post/{post_id}' if front else f'/#/post/{post_id}'

    return HTMLResponse(_build_og_html(
        title=title, description=description, image=image,
        page_url=page_url, app_url=app_url,
    ))


@router.get('/reel/{reel_id}', response_class=HTMLResponse)
async def reel_share_meta(reel_id: int, db: Session = Depends(get_db)):
    """يُعيد HTML بـ og:image ديناميكي لريل — نفس فكرة المنشور."""
    try:
        from app.models.stories_reels import Reel
    except Exception as exc:  # pragma: no cover
        logger.error('[share-meta] Reel model import failed: %s', exc)
        raise HTTPException(status_code=503, detail='Reels unavailable')

    reel = db.query(Reel).filter(Reel.id == reel_id).first()
    if reel is None:
        raise HTTPException(status_code=404, detail='Reel not found')

    author = db.query(User).filter(User.id == reel.user_id).first() if getattr(reel, 'user_id', None) else None
    author_name = (
        getattr(author, 'full_name', None)
        or getattr(author, 'display_name', None)
        or getattr(author, 'username', None)
        or 'مستخدم يمشات'
    )

    link_card = _loads_json(getattr(reel, 'link_card', None)) or {}

    title = (
        link_card.get('title')
        or _truncate(getattr(reel, 'caption', '') or getattr(reel, 'description', '') or '', 70)
        or f'ريل {author_name}'
    )
    description = (
        link_card.get('description')
        or _truncate(getattr(reel, 'caption', '') or getattr(reel, 'description', '') or '', 190)
        or f'ريل من {author_name} على يمشات'
    )

    image = _abs_url(
        link_card.get('thumbnail')
        or getattr(reel, 'thumbnail_url', None)
        or getattr(reel, 'poster_url', None)
        or getattr(author, 'avatar_url', None)
        or getattr(author, 'avatar', None)
    )

    base = _backend_origin()
    page_url = f'{base}/api/share-meta/reel/{reel_id}' if base else f'/api/share-meta/reel/{reel_id}'
    front = _frontend_origin()
    app_url = f'{front}/#/reel/{reel_id}' if front else f'/#/reel/{reel_id}'

    return HTMLResponse(_build_og_html(
        title=title, description=description, image=image,
        page_url=page_url, app_url=app_url,
    ))
