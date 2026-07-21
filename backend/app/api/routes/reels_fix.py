"""
إصلاح شامل لمشكلة اختفاء الريلز بعد الرفع
- التأكد من حفظ البيانات الكاملة في قاعدة البيانات
- إضافة معالجة أخطاء محسّنة
- التحقق من العلاقات والمراجع
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import and_, desc
from sqlalchemy.orm import Session

from app.api.routes.upload import save_upload
from app.core.dependencies import get_current_user, get_db
from app.core.media_urls import normalize_media_url
from app.db.bootstrap import initialize_database
from app.models.stories_reels import Reel, ReelLike, ReelView, SavedReel
from app.models.user import User
# v88.28 — خدمة تخزين سحابي دائم للريلز
try:
    from app.services.reels_storage_service import persist_reel_media
except Exception:  # pragma: no cover
    persist_reel_media = None  # type: ignore[assignment]

router = APIRouter()


def _repair_reels_schema(db: Session) -> None:
    """إصلاح مخطط قاعدة البيانات إذا حدثت مشاكل."""
    try:
        db.rollback()
    except Exception:
        pass
    try:
        initialize_database(db.get_bind(), force=True)
    except Exception:
        pass


def _build_reels_response(items: list[dict], *, limit: int, offset: int) -> dict:
    """بناء استجابة موحدة للريلز."""
    return {
        'items': items,
        'reels': items,
        'total': len(items),
        'offset': offset,
        'limit': limit,
    }


def _load_reels_items(db: Session, current_user: User, *, limit: int, offset: int, category: str) -> list[dict]:
    """تحميل عناصر الريلز من قاعدة البيانات."""
    query = db.query(Reel).filter(Reel.is_deleted.is_(False))
    if str(category or 'all').strip().lower() != 'all':
        query = query.filter(Reel.category == str(category).strip())
    reels = query.order_by(desc(Reel.created_at), Reel.id.desc()).offset(offset).limit(limit).all()
    return [_serialize_reel(db, reel, current_user=current_user) for reel in reels]


def _serialize_reel(db: Session, reel: Reel, current_user: User | None = None) -> dict:
    """تحويل كائن الريل إلى قاموس JSON."""
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
    """الحصول على قائمة الريلز مع معالجة الأخطاء المحسّنة."""
    try:
        items = _load_reels_items(db, current_user, limit=limit, offset=offset, category=category)
    except Exception as exc:
        _repair_reels_schema(db)
        try:
            items = _load_reels_items(db, current_user, limit=limit, offset=offset, category=category)
        except Exception as retry_exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f'تعذر تحميل الريلز: {str(retry_exc)[:100]}'
            ) from retry_exc
    return _build_reels_response(items, limit=limit, offset=offset)


@router.get('/feed')
def get_reels_feed(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    category: str = Query(default='all'),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """الحصول على تغذية الريلز (نفس نقطة النهاية الأساسية)."""
    return get_reels(limit=limit, offset=offset, category=category, db=db, current_user=current_user)


@router.post('', status_code=status.HTTP_201_CREATED)
async def create_reel(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    إنشاء ريل جديد مع معالجة شاملة للأخطاء والتحقق من البيانات.
    
    يدعم:
    - رفع multipart/form-data مع الملفات
    - JSON مع URLs للوسائط
    - تحويل تلقائي للصور المصغرة
    """
    content_type = str(request.headers.get('content-type') or '').lower()
    caption = ''
    category = 'general'
    video_url = ''
    thumbnail_url = ''

    # v88.28 — متغيرات سحابية دائمة
    cloudinary_video_public_id = None
    cloudinary_thumb_public_id = None
    storage_type = 'local'
    detected_duration = 0

    # معالجة البيانات متعددة الأجزاء
    if 'multipart/form-data' in content_type:
        form = await request.form()
        caption = str(form.get('caption') or '').strip()
        category = str(form.get('category') or 'general').strip() or 'general'
        file = form.get('file') or form.get('video') or form.get('media')
        thumbnail = form.get('thumbnail') or form.get('poster') or form.get('preview')

        # v88.28 — المسار المفضّل: رفع إلزامي إلى Cloudinary
        if file is not None and hasattr(file, 'filename') and file.filename and persist_reel_media is not None:
            reel_persist = persist_reel_media(
                file,
                thumbnail if (thumbnail is not None and hasattr(thumbnail, 'filename') and thumbnail.filename) else None,
                user_id=current_user.id,
            )
            video_url = str(reel_persist.get('video_url') or '').strip()
            thumbnail_url = str(reel_persist.get('thumbnail_url') or '').strip()
            cloudinary_video_public_id = reel_persist.get('cloudinary_video_public_id')
            cloudinary_thumb_public_id = reel_persist.get('cloudinary_thumb_public_id')
            storage_type = str(reel_persist.get('storage_type') or 'local')
            try:
                detected_duration = int(reel_persist.get('duration') or 0)
            except Exception:
                detected_duration = 0
        else:
            if file is not None and hasattr(file, 'filename'):
                upload_payload = save_upload(file)
                video_url = str(upload_payload.get('media_url') or upload_payload.get('file_url') or upload_payload.get('url') or '').strip()
                storage_type = str(upload_payload.get('storage') or 'local')

            if thumbnail is not None and hasattr(thumbnail, 'filename'):
                thumb_payload = save_upload(thumbnail)
                thumbnail_url = str(thumb_payload.get('media_url') or thumb_payload.get('file_url') or thumb_payload.get('url') or '').strip()
    else:
        # معالجة JSON
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
        """حفظ الريل في قاعدة البيانات مع التحقق الكامل."""
        # التحقق من وجود المستخدم
        user_check = db.query(User).filter(User.id == current_user.id).first()
        if not user_check:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')
        
        # إنشاء كائن الريل الجديد
        reel = Reel(
            user_id=current_user.id,
            video_url=video_url,
            thumbnail_url=thumbnail_url or None,
            caption=caption or None,
            category=category,
            duration=detected_duration or 0,
            # v88.28 — حقول التخزين السحابي الدائم
            cloudinary_video_public_id=cloudinary_video_public_id,
            cloudinary_thumb_public_id=cloudinary_thumb_public_id,
            cloudinary_public_id=cloudinary_video_public_id,
            storage_type=storage_type,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        
        # إضافة الريل إلى الجلسة
        db.add(reel)
        
        # حفظ التغييرات
        db.commit()
        
        # تحديث الكائن للحصول على ID المولد تلقائياً
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
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f'تعذر حفظ الريل: {str(retry_exc)[:100]}'
            ) from retry_exc


@router.post('/{reel_id}/like')
def like_reel(reel_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """إضافة أو إزالة إعجاب على ريل."""
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
    return {
        'reel_id': reel_id,
        'liked': liked,
        'likes_count': int(reel.likes_count or 0),
    }


@router.post('/{reel_id}/view')
def record_reel_view(reel_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """تسجيل مشاهدة الريل."""
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
    """الحصول على الريلز الرائجة."""
    reels = db.query(Reel).filter(Reel.is_deleted.is_(False)).order_by(desc(Reel.views_count), desc(Reel.likes_count), desc(Reel.created_at)).limit(limit).all()
    items = [_serialize_reel(db, reel, current_user=current_user) for reel in reels]
    return {
        'items': items,
        'reels': items,
        'total': len(items),
    }


@router.post('/{reel_id}/save')
def save_reel(reel_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """حفظ أو إزالة حفظ ريل."""
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
