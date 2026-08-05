# ✅ v89.40 — Short Share Router (/s/p/{post_id}, /s/r/{reel_id})
# ----------------------------------------------------------------
# المسار المختصر المعتمد كـ share_url للمنشورات والريلز.
# يعيد HTML بوسوم Open Graph + Twitter Card ديناميكية لكل منشور،
# ثم يوجّه المستخدم البشري إلى تطبيق الفرونت (HashRouter).
#
# لماذا مسار قصير؟
#   • أنظف عند اللصق في واتساب/تيليجرام/X.
#   • يفصل مسار المشاركة العامة (يدخله الزائر أو الـcrawler) عن مسار الـAPI
#     الداخلي (/api/share-meta/...) الذي يبقى للتوافق الخلفي.
#
# المسارات:
#   GET /s/p/{post_id}   → HTML og:* لمنشور
#   GET /s/r/{reel_id}   → HTML og:* لريل
#   GET /s/health        → فحص صحة سريع
# ----------------------------------------------------------------
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.post import Post
from app.models.user import User

# نعيد استخدام كل الأدوات الموجودة داخل share_meta لتجنّب التكرار
# (بناء HTML، استخراج الميديا، حل الروابط المطلقة).
from app.api.routes.share_meta import (
    _abs_url,
    _backend_origin,
    _build_og_html,
    _first_media_url,
    _frontend_origin,
    _loads_json,
    _truncate,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=['share-short'])


@router.get('/health')
async def share_short_health():
    return {'ok': True, 'service': 'share-short', 'version': 'v89.40'}


@router.get('/p/{post_id}', response_class=HTMLResponse)
async def short_post_share(post_id: int, db: Session = Depends(get_db)):
    """المسار المختصر لمشاركة منشور — يخدم Open Graph ثم يحوّل إلى #/post/{id}."""
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
    page_url = f'{base}/s/p/{post_id}' if base else f'/s/p/{post_id}'
    front = _frontend_origin()
    app_url = f'{front}/#/post/{post_id}' if front else f'/#/post/{post_id}'

    return HTMLResponse(_build_og_html(
        title=title, description=description, image=image,
        page_url=page_url, app_url=app_url,
    ))


@router.get('/r/{reel_id}', response_class=HTMLResponse)
async def short_reel_share(reel_id: int, db: Session = Depends(get_db)):
    """المسار المختصر لمشاركة ريل — يخدم Open Graph ثم يحوّل إلى #/reel/{id}."""
    try:
        from app.models.stories_reels import Reel
    except Exception as exc:  # pragma: no cover
        logger.error('[share-short] Reel model import failed: %s', exc)
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
    page_url = f'{base}/s/r/{reel_id}' if base else f'/s/r/{reel_id}'
    front = _frontend_origin()
    app_url = f'{front}/#/reel/{reel_id}' if front else f'/#/reel/{reel_id}'

    return HTMLResponse(_build_og_html(
        title=title, description=description, image=image,
        page_url=page_url, app_url=app_url,
    ))
