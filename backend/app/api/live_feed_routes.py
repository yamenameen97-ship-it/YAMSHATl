"""
مسارات API للبث المباشر والخلاصة المدمجة
يتعامل مع إنشاء وإدارة بطاقات البث في الخلاصة
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Body, status
from sqlalchemy.orm import Session
from typing import Optional, List
import logging

from app.db.session import get_db
from app.services.live_feed_service import LiveFeedService
from app.schemas.post import PostResponse
from app.core.auth import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/feed", tags=["feed"])


@router.post("/live/create", response_model=dict)
async def create_live_post(
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    إنشاء منشور بث مباشر جديد
    عند بدء البث من صفحة التحكم
    """
    try:
        service = LiveFeedService(db)

        stream_id = data.get("stream_id")
        title = data.get("title", "بث مباشر جديد")
        thumbnail_url = data.get("thumbnail_url")
        description = data.get("description")

        if not stream_id:
            raise HTTPException(
                status_code=400,
                detail="معرف البث مطلوب",
            )

        live_post = await service.create_live_post(
            user_id=current_user.id,
            stream_id=stream_id,
            title=title,
            thumbnail_url=thumbnail_url,
            description=description,
        )

        return {
            "success": True,
            "post_id": live_post.id,
            "stream_id": stream_id,
            "message": "تم إنشاء منشور البث بنجاح",
        }

    except Exception as e:
        logger.error(f"Error creating live post: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"خطأ في إنشاء منشور البث: {str(e)}",
        )


@router.post("/live/{stream_id}/end", response_model=dict)
async def end_live_stream(
    stream_id: str,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    إنهاء البث المباشر وتحويله إلى بث مسجل
    """
    try:
        service = LiveFeedService(db)

        duration = data.get("duration")

        ended_post = await service.end_live_stream(
            stream_id=stream_id,
            duration=duration,
        )

        return {
            "success": True,
            "post_id": ended_post.id,
            "stream_id": stream_id,
            "type": "RECORDED_STREAM",
            "message": "تم إنهاء البث وحفظه كمنشور مسجل",
        }

    except Exception as e:
        logger.error(f"Error ending live stream: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"خطأ في إنهاء البث: {str(e)}",
        )


@router.post("/live/{stream_id}/viewers", response_model=dict)
async def update_stream_viewers(
    stream_id: str,
    data: dict = Body(...),
    db: Session = Depends(get_db),
):
    """
    تحديث عدد المشاهدين للبث المباشر
    """
    try:
        service = LiveFeedService(db)

        viewer_count = data.get("viewer_count", 0)

        updated_post = await service.update_stream_viewers(
            stream_id=stream_id,
            viewer_count=viewer_count,
        )

        if not updated_post:
            raise HTTPException(
                status_code=404,
                detail="البث غير موجود",
            )

        return {
            "success": True,
            "stream_id": stream_id,
            "viewer_count": viewer_count,
        }

    except Exception as e:
        logger.error(f"Error updating stream viewers: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"خطأ في تحديث عدد المشاهدين: {str(e)}",
        )


@router.get("/live/active", response_model=dict)
async def get_active_live_streams(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    الحصول على البثوث المباشرة النشطة
    مرتبة: الأصدقاء -> المتابعين -> المقترحات
    """
    try:
        service = LiveFeedService(db)

        streams = await service.get_active_live_streams(
            current_user_id=current_user.id if current_user else None,
            limit=limit,
            offset=offset,
        )

        return {
            "success": True,
            "streams": [
                {
                    "id": s.id,
                    "stream_id": s.live_stream_id,
                    "title": s.content,
                    "host": s.username,
                    "thumbnail": s.thumbnail_url,
                    "viewers": s.viewers_count,
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                }
                for s in streams
            ],
            "total": len(streams),
        }

    except Exception as e:
        logger.error(f"Error getting active live streams: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"خطأ في جلب البثوث: {str(e)}",
        )


@router.get("/content", response_model=dict)
async def get_feed_content(
    content_type: Optional[str] = Query(None, regex="^(posts|stories|live)$"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    الحصول على محتوى الخلاصة
    يمكن تصفيته حسب النوع: posts, stories, live
    """
    try:
        service = LiveFeedService(db)

        posts = await service.get_feed_content(
            current_user_id=current_user.id,
            content_type=content_type,
            limit=limit,
            offset=offset,
        )

        return {
            "success": True,
            "content_type": content_type or "all",
            "posts": [
                {
                    "id": p.id,
                    "type": p.post_type,
                    "content": p.content,
                    "author": p.username,
                    "thumbnail": p.thumbnail_url,
                    "viewers": p.viewers_count if p.post_type == "LIVE" else None,
                    "is_live": p.is_live,
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                    "stream_id": p.live_stream_id if p.post_type in ["LIVE", "RECORDED_STREAM"] else None,
                }
                for p in posts
            ],
            "total": len(posts),
        }

    except Exception as e:
        logger.error(f"Error getting feed content: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"خطأ في جلب محتوى الخلاصة: {str(e)}",
        )


@router.get("/live/{stream_id}/stats", response_model=dict)
async def get_live_stream_stats(
    stream_id: str,
    db: Session = Depends(get_db),
):
    """
    الحصول على إحصائيات البث المباشر
    """
    try:
        service = LiveFeedService(db)

        stats = await service.get_live_stream_stats(stream_id)

        if not stats:
            raise HTTPException(
                status_code=404,
                detail="البث غير موجود",
            )

        return {
            "success": True,
            "stats": stats,
        }

    except Exception as e:
        logger.error(f"Error getting live stream stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"خطأ في جلب إحصائيات البث: {str(e)}",
        )


@router.post("/live/{stream_id}/link-post", response_model=dict)
async def link_stream_to_post(
    stream_id: str,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    ربط البث المباشر بمنشور موجود
    """
    try:
        service = LiveFeedService(db)

        post_id = data.get("post_id")

        if not post_id:
            raise HTTPException(
                status_code=400,
                detail="معرف المنشور مطلوب",
            )

        linked_post = await service.link_stream_to_post(
            stream_id=stream_id,
            post_id=post_id,
        )

        if not linked_post:
            raise HTTPException(
                status_code=404,
                detail="المنشور غير موجود",
            )

        return {
            "success": True,
            "post_id": post_id,
            "stream_id": stream_id,
            "message": "تم ربط البث بالمنشور بنجاح",
        }

    except Exception as e:
        logger.error(f"Error linking stream to post: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"خطأ في ربط البث: {str(e)}",
        )
