"""
مسارات API متكاملة للبث المباشر مع قاعدة البيانات
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.services.live_stream_service import LiveStreamService
from app.schemas.live import (
    LiveStreamCreate, LiveStreamUpdate, LiveStreamResponse, 
    StreamStatsResponse, ViewerResponse
)

router = APIRouter(prefix="/api/v1/live", tags=["live"])


# ==================== إنشاء وإدارة البث ====================

@router.post("/streams", status_code=status.HTTP_201_CREATED, response_model=LiveStreamResponse)
async def create_stream(
    stream_data: LiveStreamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """إنشاء بث مباشر جديد"""
    try:
        service = LiveStreamService(db)
        stream = service.create_stream(
            host_id=current_user.id,
            title=stream_data.title,
            description=stream_data.description,
            category=stream_data.category,
            is_public=stream_data.is_public
        )
        return stream
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/streams/{stream_id}/start", response_model=LiveStreamResponse)
async def start_stream(
    stream_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """بدء البث المباشر"""
    try:
        service = LiveStreamService(db)
        stream = service.start_stream(stream_id, current_user.id)
        return stream
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/streams/{stream_id}/end", response_model=LiveStreamResponse)
async def end_stream(
    stream_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """إنهاء البث المباشر"""
    try:
        service = LiveStreamService(db)
        stream = service.end_stream(stream_id, current_user.id)
        return stream
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/streams/{stream_id}/pause", response_model=LiveStreamResponse)
async def pause_stream(
    stream_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """إيقاف البث المباشر مؤقتاً"""
    try:
        service = LiveStreamService(db)
        stream = service.pause_stream(stream_id, current_user.id)
        return stream
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/streams/{stream_id}/resume", response_model=LiveStreamResponse)
async def resume_stream(
    stream_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """استئناف البث المباشر"""
    try:
        service = LiveStreamService(db)
        stream = service.resume_stream(stream_id, current_user.id)
        return stream
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ==================== استرجاع البيانات ====================

@router.get("/streams/{stream_id}", response_model=LiveStreamResponse)
async def get_stream(
    stream_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """الحصول على بث محدد"""
    try:
        service = LiveStreamService(db)
        stream = service.get_stream(stream_id)
        if not stream:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="البث غير موجود")
        return stream
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/streams/active", response_model=List[LiveStreamResponse])
async def get_active_streams(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """الحصول على البثوث المباشرة النشطة"""
    try:
        service = LiveStreamService(db)
        streams = service.get_active_streams(limit, offset)
        return streams
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/user/streams", response_model=List[LiveStreamResponse])
async def get_user_streams(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """الحصول على بثوث المستخدم"""
    try:
        service = LiveStreamService(db)
        streams = service.get_user_streams(current_user.id, limit, offset)
        return streams
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ==================== إدارة المشاهدين ====================

@router.post("/streams/{stream_id}/viewers/join", response_model=ViewerResponse)
async def join_stream(
    stream_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """الانضمام للبث كمشاهد"""
    try:
        service = LiveStreamService(db)
        viewer = service.add_viewer(
            stream_id=stream_id,
            user_id=current_user.id,
            username=current_user.username,
            user_avatar=getattr(current_user, 'avatar', None),
            platform="web"
        )
        return viewer
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/streams/{stream_id}/viewers/leave")
async def leave_stream(
    stream_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """مغادرة البث"""
    try:
        service = LiveStreamService(db)
        success = service.remove_viewer(stream_id, current_user.id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المشاهد غير موجود")
        return {"message": "تم مغادرة البث بنجاح"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/streams/{stream_id}/viewers", response_model=List[ViewerResponse])
async def get_stream_viewers(
    stream_id: str,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """الحصول على مشاهدي البث"""
    try:
        service = LiveStreamService(db)
        viewers = service.get_active_viewers(stream_id, limit, offset)
        return viewers
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ==================== إدارة التعليقات ====================

@router.post("/streams/{stream_id}/comments")
async def add_comment(
    stream_id: str,
    content: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """إضافة تعليق على البث"""
    try:
        service = LiveStreamService(db)
        comment = service.add_comment(stream_id, current_user.id, content)
        return comment
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/streams/{stream_id}/comments")
async def get_comments(
    stream_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """الحصول على تعليقات البث"""
    try:
        service = LiveStreamService(db)
        comments = service.get_comments(stream_id, limit, offset)
        return comments
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """حذف تعليق من البث"""
    try:
        service = LiveStreamService(db)
        success = service.delete_comment(comment_id, current_user.id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="التعليق غير موجود")
        return {"message": "تم حذف التعليق بنجاح"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ==================== إدارة الهدايا ====================

@router.get("/gifts")
async def get_available_gifts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """الحصول على الهدايا المتاحة"""
    try:
        service = LiveStreamService(db)
        gifts = service.get_available_gifts()
        return gifts
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/streams/{stream_id}/gifts")
async def send_gift(
    stream_id: str,
    gift_id: int,
    amount: int = 1,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """إرسال هدية على البث"""
    try:
        service = LiveStreamService(db)
        transaction = service.send_gift(stream_id, current_user.id, gift_id, amount)
        return transaction
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ==================== إدارة الإحصائيات ====================

@router.get("/streams/{stream_id}/stats", response_model=StreamStatsResponse)
async def get_stream_stats(
    stream_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """الحصول على إحصائيات البث"""
    try:
        service = LiveStreamService(db)
        stats = service.get_stream_stats(stream_id)
        if not stats:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="البث غير موجود")
        return stats
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/streams/{stream_id}/hearts")
async def send_heart(
    stream_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """إرسال قلب على البث"""
    try:
        service = LiveStreamService(db)
        result = service.send_heart(stream_id, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ==================== إدارة الاعتدال ====================

@router.post("/streams/{stream_id}/moderation/mute/{user_id}")
async def mute_user(
    stream_id: str,
    user_id: int,
    reason: Optional[str] = None,
    duration_minutes: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """كتم صوت المستخدم في البث"""
    try:
        service = LiveStreamService(db)
        muted = service.mute_user(stream_id, user_id, current_user.id, reason, duration_minutes)
        return muted
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/streams/{stream_id}/moderation/ban/{user_id}")
async def ban_user(
    stream_id: str,
    user_id: int,
    reason: Optional[str] = None,
    duration_days: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """حظر المستخدم من البث"""
    try:
        service = LiveStreamService(db)
        banned = service.ban_user(stream_id, user_id, current_user.id, reason, duration_days)
        return banned
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
