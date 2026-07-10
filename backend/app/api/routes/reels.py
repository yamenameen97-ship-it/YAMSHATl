from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import and_, desc
from sqlalchemy.orm import Session

from app.api.routes.upload import save_upload
from app.core.dependencies import get_current_user, get_db
from app.core.media_urls import normalize_media_url
from app.db.bootstrap import initialize_database
from app.models.stories_reels import Reel, ReelComment, ReelLike, ReelView, SavedReel
from app.models.user import User

# v87.0 — نظام الإشعارات الذكي
try:
    from app.services.notification_service import notify as _notify
except Exception:  # pragma: no cover
    def _notify(*_args, **_kwargs):  # type: ignore[override]
        return None

logger = logging.getLogger(__name__)

_UPLOADS_ROOT = Path(__file__).resolve().parents[3] / 'uploads'


def _media_file_exists(url: str | None) -> bool:
    """تحقّق أن ملف الوسائط فعليّاً موجود في /uploads (أو URL خارجي)."""
    if not url:
        return False
    try:
        path_part = url
        parsed = urlparse(url)
        if parsed.scheme in ('http', 'https'):
            # روابط خارجية (CDN / S3) نثق بوجودها
            if '/uploads/' not in (parsed.path or ''):
                return True
            path_part = parsed.path
        # path_part الآن مثل: /uploads/abc.mp4
        marker = '/uploads/'
        idx = path_part.find(marker)
        if idx < 0:
            return True  # غير مرتبط بـ /uploads فلا نحكم عليه
        filename = path_part[idx + len(marker):].lstrip('/')
        if not filename:
            return False
        return (_UPLOADS_ROOT / filename).exists()
    except Exception:
        return True  # عند الشك لا تستبعده

router = APIRouter()


def _repair_reels_schema(db: Session) -> None:
    try:
        db.rollback()
    except Exception:
        pass
    try:
        initialize_database(db.get_bind(), force=True)
    except Exception:
        pass


def _build_reels_response(items: list[dict], *, limit: int, offset: int) -> dict:
    return {
        'items': items,
        'reels': items,
        'total': len(items),
        'offset': offset,
        'limit': limit,
    }


def _load_reels_items(db: Session, current_user: User, *, limit: int, offset: int, category: str) -> list[dict]:
    # ✅ v59.13.34 FIX: عدم حذف الريلز عند فقد ملف /uploads/ مؤقتاً
    # المشكلة السابقة: عند إعادة تشغيل/نشر الـ backend تُمحى ملفات /uploads/
    # المؤقتة (filesystem غير دائم في الحاويات)، فكان _media_file_exists يُرجع
    # False ويُعلَّم كل ريل قديم على أنه is_deleted=True نهائياً → الريلز
    # المرفوعة سابقاً تختفي للأبد رغم أن سجلاتها موجودة في قاعدة البيانات.
    # الحل: لا نُعلِّم أي ريل كمحذوف بسبب فقد الملف؛ نُبقي السجل في قاعدة
    # البيانات ونعرض كل الريلز التي يظنّ النظام أنها صالحة، حتى لو كان
    # المسار محلياً ومفقوداً مؤقتاً — مع تسجيل تحذير فقط.
    query = db.query(Reel).filter(Reel.is_deleted.is_(False))
    if str(category or 'all').strip().lower() != 'all':
        query = query.filter(Reel.category == str(category).strip())
    reels = query.order_by(desc(Reel.created_at), Reel.id.desc()).offset(offset).limit(limit).all()
    serialized: list[dict] = []
    for reel in reels:
        try:
            payload = _serialize_reel(db, reel, current_user=current_user)
        except Exception as exc:  # noqa: BLE001
            logger.warning('Failed to serialize reel %s: %s', getattr(reel, 'id', '?'), exc)
            continue
        # نُسجِّل تحذيراً فقط عند فقد الملف لكن لا نحذف السجل ولا نستبعده
        try:
            if not _media_file_exists(payload.get('video_url')):
                logger.warning(
                    'Reel %s media file missing on disk (kept in DB): %s',
                    getattr(reel, 'id', '?'),
                    payload.get('video_url'),
                )
        except Exception:
            pass
        serialized.append(payload)
    return serialized


def _serialize_reel(db: Session, reel: Reel, current_user: User | None = None) -> dict:
    try:
        owner = db.query(User).filter(User.id == reel.user_id).first()
    except Exception:
        owner = None

    is_liked = False
    is_saved = False
    if current_user is not None:
        try:
            is_liked = db.query(ReelLike.id).filter(
                ReelLike.reel_id == reel.id,
                ReelLike.user_id == current_user.id,
            ).first() is not None
        except Exception:
            is_liked = False
        try:
            is_saved = db.query(SavedReel.id).filter(
                SavedReel.reel_id == reel.id,
                SavedReel.user_id == current_user.id,
            ).first() is not None
        except Exception:
            is_saved = False

    video_url = normalize_media_url(reel.video_url)
    thumbnail_url = normalize_media_url(reel.thumbnail_url)

    payload = {
        'id': reel.id,
        'user_id': reel.user_id,
        'username': owner.username if owner else 'unknown',
        'user_avatar': owner.avatar_url if owner else '',
        'video_url': video_url,
        'media_url': video_url,
        'thumbnail_url': thumbnail_url,
        'image_url': thumbnail_url or video_url,
        'preview_url': thumbnail_url or video_url,
        'caption': reel.caption or '',
        'content': reel.caption or '',
        'category': reel.category or 'general',
        'duration': int(reel.duration or 0),
        'likes_count': int(reel.likes_count or 0),
        'comments_count': int(reel.comments_count or 0),
        'share_count': int(reel.shares_count or 0),
        'shares_count': int(reel.shares_count or 0),
        'views_count': int(reel.views_count or 0),
        'is_liked': is_liked,
        'is_saved': is_saved,
        'created_at': reel.created_at.isoformat() if reel.created_at else None,
        'updated_at': reel.updated_at.isoformat() if reel.updated_at else None,
        'user': {
            'id': owner.id if owner else reel.user_id,
            'username': owner.username if owner else 'unknown',
            'full_name': owner.full_name if owner else 'unknown',
            'avatar_url': owner.avatar_url if owner else '',
        },
    }
    return payload


@router.get('')
def get_reels(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    category: str = Query(default='all'),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        items = _load_reels_items(db, current_user, limit=limit, offset=offset, category=category)
    except Exception:
        _repair_reels_schema(db)
        try:
            items = _load_reels_items(db, current_user, limit=limit, offset=offset, category=category)
        except Exception:
            items = []
    return _build_reels_response(items, limit=limit, offset=offset)


@router.get('/feed')
def get_reels_feed(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    category: str = Query(default='all'),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_reels(limit=limit, offset=offset, category=category, db=db, current_user=current_user)


@router.post('', status_code=status.HTTP_201_CREATED)
async def create_reel(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    content_type = str(request.headers.get('content-type') or '').lower()
    caption = ''
    category = 'general'
    video_url = ''
    thumbnail_url = ''

    if 'multipart/form-data' in content_type:
        form = await request.form()
        caption = str(form.get('caption') or '').strip()
        category = str(form.get('category') or 'general').strip() or 'general'
        file = form.get('file') or form.get('video') or form.get('media')
        thumbnail = form.get('thumbnail') or form.get('poster') or form.get('preview')
        if file is not None and hasattr(file, 'filename'):
            upload_payload = save_upload(file)
            video_url = str(upload_payload.get('media_url') or upload_payload.get('file_url') or upload_payload.get('url') or '').strip()
        if thumbnail is not None and hasattr(thumbnail, 'filename'):
            thumb_payload = save_upload(thumbnail)
            thumbnail_url = str(thumb_payload.get('media_url') or thumb_payload.get('file_url') or thumb_payload.get('url') or '').strip()
    else:
        payload = await request.json()
        upload_payload = payload.get('upload') if isinstance(payload.get('upload'), dict) else {}
        caption = str(payload.get('caption') or payload.get('content') or '').strip()
        category = str(payload.get('category') or 'general').strip() or 'general'
        video_url = str(
            payload.get('video_url')
            or payload.get('media_url')
            or payload.get('media')
            or payload.get('url')
            or payload.get('file_url')
            or upload_payload.get('media_url')
            or upload_payload.get('url')
            or upload_payload.get('file_url')
            or ''
        ).strip()
        thumbnail_url = str(payload.get('thumbnail_url') or payload.get('image_url') or payload.get('preview_url') or upload_payload.get('thumbnail_url') or '').strip()

    video_url = normalize_media_url(video_url)
    thumbnail_url = normalize_media_url(thumbnail_url)

    if not video_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='video file or media_url is required')

    def _persist_reel() -> dict:
        # التحقق من وجود المستخدم
        user_check = db.query(User).filter(User.id == current_user.id).first()
        if not user_check:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')
        
        reel = Reel(
            user_id=current_user.id,
            video_url=video_url,
            thumbnail_url=thumbnail_url or None,
            caption=caption or None,
            category=category,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(reel)
        db.commit()
        db.refresh(reel)
        
        # التحقق من أن الريل تم حفظه بنجاح
        verify_reel = db.query(Reel).filter(Reel.id == reel.id).first()
        if not verify_reel:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Failed to verify reel was saved')
        
        return _serialize_reel(db, reel, current_user=current_user)

    try:
        return _persist_reel()
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        _repair_reels_schema(db)
        try:
            return _persist_reel()
        except Exception as retry_exc:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='تعذر حفظ الريل حالياً، جرّب تاني بعد لحظات') from retry_exc


@router.post('/{reel_id}/like')
def like_reel(reel_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reel = db.query(Reel).filter(Reel.id == reel_id, Reel.is_deleted.is_(False)).first()
    if reel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Reel not found')

    existing = db.query(ReelLike).filter(
        ReelLike.reel_id == reel_id,
        ReelLike.user_id == current_user.id,
    ).first()
    liked = False
    if existing is not None:
        db.delete(existing)
        reel.likes_count = max(int(reel.likes_count or 0) - 1, 0)
    else:
        db.add(ReelLike(reel_id=reel_id, user_id=current_user.id, created_at=datetime.utcnow()))
        reel.likes_count = int(reel.likes_count or 0) + 1
        liked = True
    db.commit()

    # v87.0 — إشعار: شخص أعجب بالريلز تبعك (فقط عند الإعجاب)
    if liked and reel.user_id and int(reel.user_id) != int(current_user.id):
        _notify(
            db,
            user_id=int(reel.user_id),
            notification_type='REEL_LIKE',
            data={
                'reel_id': int(reel_id),
                'from_user_id': int(current_user.id),
                'username': current_user.username,
                'actor_avatar': getattr(current_user, 'avatar', None) or getattr(current_user, 'avatar_url', None),
            },
        )

    return {
        'reel_id': reel_id,
        'liked': liked,
        'likes_count': int(reel.likes_count or 0),
    }


@router.post('/{reel_id}/view')
def record_reel_view(reel_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reel = db.query(Reel).filter(Reel.id == reel_id, Reel.is_deleted.is_(False)).first()
    if reel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Reel not found')

    existing = db.query(ReelView.id).filter(
        ReelView.reel_id == reel_id,
        ReelView.user_id == current_user.id,
    ).first()
    if existing is None:
        db.add(ReelView(reel_id=reel_id, user_id=current_user.id, viewed_at=datetime.utcnow()))
        reel.views_count = int(reel.views_count or 0) + 1
        db.commit()

    return {
        'reel_id': reel_id,
        'views_count': int(reel.views_count or 0),
    }


@router.get('/trending')
def get_trending_reels(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reels = db.query(Reel).filter(Reel.is_deleted.is_(False)).order_by(desc(Reel.views_count), desc(Reel.likes_count), desc(Reel.created_at)).limit(limit).all()
    items = [_serialize_reel(db, reel, current_user=current_user) for reel in reels]
    return {
        'items': items,
        'reels': items,
        'total': len(items),
    }


@router.post('/{reel_id}/save')
def save_reel(reel_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reel = db.query(Reel).filter(Reel.id == reel_id, Reel.is_deleted.is_(False)).first()
    if reel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Reel not found')

    existing = db.query(SavedReel).filter(
        and_(SavedReel.reel_id == reel_id, SavedReel.user_id == current_user.id)
    ).first()
    saved = False
    if existing is not None:
        db.delete(existing)
    else:
        db.add(SavedReel(reel_id=reel_id, user_id=current_user.id, saved_at=datetime.utcnow()))
        saved = True
    db.commit()
    return {
        'reel_id': reel_id,
        'saved': saved,
    }


# ============================================================
# v85.5 — Reel comments endpoints
# ------------------------------------------------------------
# قبل: كان الفرونت-إند يستخدم /posts/{reel_id}/comment للتعليق على الريلز
# مما تسبب في اختفاء التعليقات (تخزين على مجدول خاطئ / فشل صامت).
# الآن: مسارات مخصصة تحفظ التعليقات في جدول reel_comments المستقل،
# وتُحدّث comments_count الحقيقي في جدول reels.
# ============================================================
from fastapi import Body
# ReelComment يُستورد في أعلى الملف مع بقية موديلات stories_reels


def _serialize_reel_comment(comment: ReelComment, current_user: User | None = None) -> dict:
    author = None
    try:
        # جلب صاحب التعليق (يبقى خفيفاً — استعلام واحد لكل تعليق مقبول لأعداد تعليقات صغيرة)
        author_row = None
        if comment.user_id:
            # نستخدم الجلسة الحالية عبر object_session لتفادي حقن Session جديد
            from sqlalchemy.orm import object_session
            sess = object_session(comment)
            if sess is not None:
                author_row = sess.query(User).filter(User.id == comment.user_id).first()
        if author_row is not None:
            author = {
                'id': author_row.id,
                'username': author_row.username,
                'avatar': getattr(author_row, 'avatar_url', None) or getattr(author_row, 'avatar', None),
            }
    except Exception:
        author = None
    return {
        'id': comment.id,
        'reel_id': comment.reel_id,
        'user_id': comment.user_id,
        'parent_id': comment.parent_id,
        'username': (author or {}).get('username') or comment.username or 'user',
        'content': comment.content,
        'likes_count': int(comment.likes_count or 0),
        'created_at': (comment.created_at.isoformat() if comment.created_at else None),
        'author': author,
        'is_me': bool(current_user and current_user.id == comment.user_id),
    }


@router.get('/{reel_id}/comments')
def list_reel_comments(
    reel_id: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reel = db.query(Reel).filter(Reel.id == reel_id, Reel.is_deleted.is_(False)).first()
    if reel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Reel not found')

    query = (
        db.query(ReelComment)
        .filter(ReelComment.reel_id == reel_id, ReelComment.is_hidden.is_(False))
        .order_by(desc(ReelComment.created_at))
    )
    total = query.count()
    rows = query.offset(offset).limit(limit).all()
    items = [_serialize_reel_comment(row, current_user=current_user) for row in rows]
    return {
        'items': items,
        'total': total,
        'has_more': (offset + len(items)) < total,
    }


@router.post('/{reel_id}/comments', status_code=status.HTTP_201_CREATED)
def create_reel_comment(
    reel_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reel = db.query(Reel).filter(Reel.id == reel_id, Reel.is_deleted.is_(False)).first()
    if reel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Reel not found')

    raw = payload.get('content') or payload.get('text') or payload.get('comment') or ''
    content = str(raw).strip()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='comment content is required')
    if len(content) > 2000:
        content = content[:2000]

    parent_id = payload.get('parent_id')
    if parent_id is not None:
        try:
            parent_id = int(parent_id)
            parent = db.query(ReelComment).filter(
                ReelComment.id == parent_id,
                ReelComment.reel_id == reel_id,
            ).first()
            if parent is None:
                parent_id = None
        except (TypeError, ValueError):
            parent_id = None

    comment = ReelComment(
        reel_id=reel_id,
        user_id=current_user.id,
        parent_id=parent_id,
        username=current_user.username,
        content=content,
        likes_count=0,
        is_hidden=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(comment)

    # تحديث عدّاد التعليقات على الريل
    try:
        reel.comments_count = int(reel.comments_count or 0) + 1
    except Exception:
        pass

    db.commit()
    db.refresh(comment)

    # v87.0 — إشعارات ذكية للريلز
    try:
        preview = content[:80]
        # 1) رد على تعليق → إشعار لصاحب التعليق الأصلي
        parent_owner_id = None
        if parent_id:
            parent = db.query(ReelComment).filter(ReelComment.id == parent_id).first()
            if parent and parent.user_id and int(parent.user_id) != int(current_user.id):
                parent_owner_id = int(parent.user_id)
                _notify(
                    db,
                    user_id=parent_owner_id,
                    notification_type='COMMENT_REPLY',
                    data={
                        'reel_id': int(reel_id),
                        'comment_id': int(comment.id),
                        'parent_id': int(parent_id),
                        'from_user_id': int(current_user.id),
                        'username': current_user.username,
                        'preview': preview,
                    },
                )
        # 2) تعليق على ريلز → إشعار لصاحب الريلز (إلا إذا كنّا أرسلنا له COMMENT_REPLY)
        if reel.user_id and int(reel.user_id) != int(current_user.id) and int(reel.user_id) != (parent_owner_id or -1):
            _notify(
                db,
                user_id=int(reel.user_id),
                notification_type='REEL_COMMENT',
                data={
                    'reel_id': int(reel_id),
                    'comment_id': int(comment.id),
                    'from_user_id': int(current_user.id),
                    'username': current_user.username,
                    'preview': preview,
                },
            )
    except Exception as _e:
        logger.warning("reel_comment_notify_failed: %s", _e)

    return _serialize_reel_comment(comment, current_user=current_user)


@router.delete('/comments/{comment_id}')
def delete_reel_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(ReelComment).filter(ReelComment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Comment not found')
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')

    reel_id_ref = comment.reel_id
    db.delete(comment)

    # تحديث عدّاد التعليقات
    reel = db.query(Reel).filter(Reel.id == reel_id_ref).first()
    if reel is not None:
        try:
            reel.comments_count = max(0, int(reel.comments_count or 0) - 1)
        except Exception:
            pass

    db.commit()
    return {'ok': True, 'deleted': comment_id}


@router.post('/comments/{comment_id}/like')
def like_reel_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(ReelComment).filter(ReelComment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Comment not found')
    # عدّاد بسيط (بدون جدول علاقات لتوفير التعقيد — التوثيق الكامل يمكن إضافته لاحقاً)
    comment.likes_count = int(comment.likes_count or 0) + 1
    db.commit()
    db.refresh(comment)

    # v87.0 — إشعار: شخص أعجب بتعليقك (على ريلز)
    if comment.user_id and int(comment.user_id) != int(current_user.id):
        _notify(
            db,
            user_id=int(comment.user_id),
            notification_type='COMMENT_LIKE',
            data={
                'reel_id': int(comment.reel_id) if comment.reel_id else None,
                'comment_id': int(comment.id),
                'from_user_id': int(current_user.id),
                'username': current_user.username,
            },
        )

    return {'ok': True, 'likes_count': comment.likes_count}
