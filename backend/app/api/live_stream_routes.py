"""
مسارات API للبث المباشر - Live Stream Routes
يتعامل مع جميع عمليات البث المباشر والمشتركين والحظر والكتم
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Body, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
import logging

from app.core.dependencies import get_db, get_current_user
from app.models.live_moderation import (
    LiveRoomModerator,
    LiveRoomMutedUser,
    LiveRoomBannedUser,
    LiveRoomComment,
)
from app.models.live_viewers import (
    LiveStreamViewer,
    LiveStreamSession,
    LiveStreamHostSettings,
    LiveStreamCameraState,
)
from app.models.user import User
from app.schemas.live import (
    LiveStreamCreate,
    LiveStreamUpdate,
    LiveStreamResponse,
    ModerationActionRequest,
    ViewerResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/live", tags=["live_stream"])


# ==================== Stream Management ====================

@router.post("/create", response_model=LiveStreamResponse)
async def create_live_stream(
    stream_data: LiveStreamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إنشاء بث مباشر جديد"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="يجب تسجيل الدخول")

        # إنشاء جلسة البث
        stream_id = f"stream_{current_user.id}_{int(datetime.utcnow().timestamp() * 1000)}"
        
        new_session = LiveStreamSession(
            stream_id=stream_id,
            host_id=current_user.id,
            title=stream_data.title,
            description=stream_data.description,
            category=stream_data.category,
            thumbnail_url=stream_data.thumbnail_url,
            status="pending",
            quality=stream_data.quality or "720p",
            is_public=stream_data.is_public,
            allow_comments=stream_data.allow_comments,
            allow_gifts=stream_data.allow_gifts,
            allow_recording=stream_data.allow_recording,
            camera_enabled=True,
            microphone_enabled=True,
            health_score=100,
        )
        
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        # إنشاء إعدادات المضيف
        host_settings = LiveStreamHostSettings(
            host_id=current_user.id,
            stream_id=stream_id,
            auto_moderate=True,
            filter_banned_words=True,
        )
        
        db.add(host_settings)
        db.commit()
        
        logger.info(f"Created stream {stream_id} by user {current_user.id}")
        
        return LiveStreamResponse(
            stream_id=stream_id,
            host_id=current_user.id,
            title=stream_data.title,
            status="pending",
            quality=stream_data.quality or "720p",
            is_public=stream_data.is_public,
        )
        
    except Exception as e:
        logger.error(f"Error creating stream: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{stream_id}/start")
async def start_live_stream(
    stream_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """بدء البث المباشر"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="يجب تسجيل الدخول")

        # البحث عن جلسة البث
        session = db.query(LiveStreamSession).filter(
            LiveStreamSession.stream_id == stream_id,
            LiveStreamSession.host_id == current_user.id,
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="البث غير موجود")

        # تحديث الحالة
        session.status = "active"
        session.started_at = datetime.utcnow()
        
        db.commit()
        db.refresh(session)
        
        logger.info(f"Started stream {stream_id}")
        
        return {
            "status": "success",
            "stream_id": stream_id,
            "token": f"token_{stream_id}_{int(datetime.utcnow().timestamp())}",
            "stream_url": f"rtmp://stream-server/{stream_id}",
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting stream: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{stream_id}/end")
async def end_live_stream(
    stream_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إنهاء البث المباشر"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="يجب تسجيل الدخول")

        # البحث عن جلسة البث
        session = db.query(LiveStreamSession).filter(
            LiveStreamSession.stream_id == stream_id,
            LiveStreamSession.host_id == current_user.id,
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="البث غير موجود")

        # تحديث الحالة
        session.status = "ended"
        session.ended_at = datetime.utcnow()
        
        if session.started_at:
            duration = (session.ended_at - session.started_at).total_seconds()
            session.duration_seconds = int(duration)
        
        db.commit()
        db.refresh(session)
        
        logger.info(f"Ended stream {stream_id}")
        
        return {
            "status": "success",
            "stream_id": stream_id,
            "duration_seconds": session.duration_seconds,
            "total_viewers": session.total_viewers,
            "total_coins_earned": session.total_coins_earned,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ending stream: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{stream_id}")
async def get_stream_details(
    stream_id: str,
    db: Session = Depends(get_db),
):
    """الحصول على تفاصيل البث"""
    try:
        session = db.query(LiveStreamSession).filter(
            LiveStreamSession.stream_id == stream_id
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="البث غير موجود")

        return {
            "stream_id": session.stream_id,
            "host_id": session.host_id,
            "title": session.title,
            "description": session.description,
            "status": session.status,
            "quality": session.quality,
            "started_at": session.started_at,
            "ended_at": session.ended_at,
            "duration_seconds": session.duration_seconds,
            "total_viewers": session.total_viewers,
            "peak_viewers": session.peak_viewers,
            "unique_viewers": session.unique_viewers,
            "total_hearts": session.total_hearts,
            "total_gifts": session.total_gifts,
            "total_comments": session.total_comments,
            "total_coins_earned": session.total_coins_earned,
            "camera_enabled": session.camera_enabled,
            "microphone_enabled": session.microphone_enabled,
            "health_score": session.health_score,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting stream details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def get_active_streams(
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
):
    """الحصول على البثوث النشطة"""
    try:
        streams = db.query(LiveStreamSession).filter(
            LiveStreamSession.status == "active"
        ).limit(limit).all()
        
        return [
            {
                "stream_id": s.stream_id,
                "host_id": s.host_id,
                "title": s.title,
                "status": s.status,
                "total_viewers": s.total_viewers,
                "peak_viewers": s.peak_viewers,
                "started_at": s.started_at,
            }
            for s in streams
        ]
        
    except Exception as e:
        logger.error(f"Error getting active streams: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Viewer Management ====================

@router.post("/{stream_id}/add-viewer")
async def add_viewer(
    stream_id: str,
    user_id: int,
    username: str,
    user_avatar: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """إضافة مشاهد للبث"""
    try:
        # التحقق من وجود البث
        session = db.query(LiveStreamSession).filter(
            LiveStreamSession.stream_id == stream_id
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="البث غير موجود")

        # التحقق من الحظر
        banned = db.query(LiveRoomBannedUser).filter(
            LiveRoomBannedUser.room_id == stream_id,
            LiveRoomBannedUser.user_id == user_id,
        ).first()
        
        if banned and (banned.is_permanent or (banned.unbanned_at and banned.unbanned_at > datetime.utcnow())):
            raise HTTPException(status_code=403, detail="أنت محظور من هذا البث")

        # إضافة المشاهد
        viewer = LiveStreamViewer(
            stream_id=stream_id,
            user_id=user_id,
            username=username,
            user_avatar=user_avatar,
            is_active=True,
        )
        
        db.add(viewer)
        
        # تحديث إحصائيات البث
        session.total_viewers += 1
        session.unique_viewers = db.query(LiveStreamViewer).filter(
            LiveStreamViewer.stream_id == stream_id,
            LiveStreamViewer.is_active == True,
        ).count()
        
        db.commit()
        
        logger.info(f"User {user_id} added to stream {stream_id}")
        
        return {
            "status": "success",
            "user_id": user_id,
            "stream_id": stream_id,
            "total_viewers": session.total_viewers,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding viewer: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{stream_id}/remove-viewer")
async def remove_viewer(
    stream_id: str,
    user_id: int,
    db: Session = Depends(get_db),
):
    """إزالة مشاهد من البث"""
    try:
        # البحث عن المشاهد
        viewer = db.query(LiveStreamViewer).filter(
            LiveStreamViewer.stream_id == stream_id,
            LiveStreamViewer.user_id == user_id,
        ).first()
        
        if viewer:
            viewer.is_active = False
            viewer.left_at = datetime.utcnow()
            
            # حساب مدة المشاهدة
            if viewer.joined_at:
                duration = (viewer.left_at - viewer.joined_at).total_seconds()
                viewer.watch_duration_seconds = int(duration)
            
            db.commit()
        
        logger.info(f"User {user_id} removed from stream {stream_id}")
        
        return {
            "status": "success",
            "user_id": user_id,
            "stream_id": stream_id,
        }
        
    except Exception as e:
        logger.error(f"Error removing viewer: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{stream_id}/viewers")
async def get_stream_viewers(
    stream_id: str,
    db: Session = Depends(get_db),
):
    """الحصول على قائمة المشاهدين"""
    try:
        viewers = db.query(LiveStreamViewer).filter(
            LiveStreamViewer.stream_id == stream_id,
            LiveStreamViewer.is_active == True,
        ).limit(100).all()
        
        return [
            {
                "user_id": v.user_id,
                "username": v.username,
                "user_avatar": v.user_avatar,
                "joined_at": v.joined_at,
                "is_banned": v.is_banned,
                "is_muted": v.is_muted,
                "hearts_sent": v.hearts_sent,
                "gifts_sent": v.gifts_sent,
                "comments_count": v.comments_count,
            }
            for v in viewers
        ]
        
    except Exception as e:
        logger.error(f"Error getting viewers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Moderation - Mute ====================

@router.post("/{stream_id}/mute")
async def mute_user(
    stream_id: str,
    user_id: int,
    moderator_id: int,
    reason: Optional[str] = None,
    duration_minutes: int = 5,
    db: Session = Depends(get_db),
):
    """كتم صوت المستخدم"""
    try:
        # التحقق من وجود البث
        session = db.query(LiveStreamSession).filter(
            LiveStreamSession.stream_id == stream_id
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="البث غير موجود")

        # إنشاء سجل الكتم
        mute_record = LiveRoomMutedUser(
            room_id=stream_id,
            user_id=user_id,
            moderator_id=moderator_id,
            reason=reason,
            duration_minutes=duration_minutes,
            unmuted_at=datetime.utcnow() + timedelta(minutes=duration_minutes) if duration_minutes else None,
        )
        
        db.add(mute_record)
        
        # تحديث حالة المشاهد
        viewer = db.query(LiveStreamViewer).filter(
            LiveStreamViewer.stream_id == stream_id,
            LiveStreamViewer.user_id == user_id,
        ).first()
        
        if viewer:
            viewer.is_muted = True
        
        db.commit()
        
        logger.info(f"User {user_id} muted in stream {stream_id}")
        
        return {
            "status": "success",
            "user_id": user_id,
            "stream_id": stream_id,
            "action": "muted",
            "reason": reason,
            "duration_minutes": duration_minutes,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error muting user: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{stream_id}/unmute")
async def unmute_user(
    stream_id: str,
    user_id: int,
    db: Session = Depends(get_db),
):
    """فك كتم صوت المستخدم"""
    try:
        # حذف سجل الكتم
        db.query(LiveRoomMutedUser).filter(
            LiveRoomMutedUser.room_id == stream_id,
            LiveRoomMutedUser.user_id == user_id,
        ).delete()
        
        # تحديث حالة المشاهد
        viewer = db.query(LiveStreamViewer).filter(
            LiveStreamViewer.stream_id == stream_id,
            LiveStreamViewer.user_id == user_id,
        ).first()
        
        if viewer:
            viewer.is_muted = False
        
        db.commit()
        
        logger.info(f"User {user_id} unmuted in stream {stream_id}")
        
        return {
            "status": "success",
            "user_id": user_id,
            "stream_id": stream_id,
            "action": "unmuted",
        }
        
    except Exception as e:
        logger.error(f"Error unmuting user: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Moderation - Ban ====================

@router.post("/{stream_id}/ban")
async def ban_user(
    stream_id: str,
    user_id: int,
    moderator_id: int,
    reason: Optional[str] = None,
    duration: str = "temporary",
    db: Session = Depends(get_db),
):
    """حظر المستخدم"""
    try:
        # التحقق من وجود البث
        session = db.query(LiveStreamSession).filter(
            LiveStreamSession.stream_id == stream_id
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="البث غير موجود")

        # حساب مدة الحظر
        duration_map = {
            "temporary": (1, 86400),      # 24 ساعة
            "long_term": (7, 604800),     # 7 أيام
            "permanent": (None, 0),       # دائم
        }
        
        duration_days, duration_seconds = duration_map.get(duration, (1, 86400))
        
        # إنشاء سجل الحظر
        ban_record = LiveRoomBannedUser(
            room_id=stream_id,
            user_id=user_id,
            host_id=session.host_id,
            reason=reason,
            duration_days=duration_days,
            unbanned_at=datetime.utcnow() + timedelta(seconds=duration_seconds) if duration_seconds > 0 else None,
        )
        
        db.add(ban_record)
        
        # تحديث حالة المشاهد
        viewer = db.query(LiveStreamViewer).filter(
            LiveStreamViewer.stream_id == stream_id,
            LiveStreamViewer.user_id == user_id,
        ).first()
        
        if viewer:
            viewer.is_banned = True
            viewer.is_active = False
        
        db.commit()
        
        logger.info(f"User {user_id} banned from stream {stream_id}")
        
        return {
            "status": "success",
            "user_id": user_id,
            "stream_id": stream_id,
            "action": "banned",
            "reason": reason,
            "duration": duration,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error banning user: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{stream_id}/unban")
async def unban_user(
    stream_id: str,
    user_id: int,
    db: Session = Depends(get_db),
):
    """رفع حظر المستخدم"""
    try:
        # حذف سجل الحظر
        db.query(LiveRoomBannedUser).filter(
            LiveRoomBannedUser.room_id == stream_id,
            LiveRoomBannedUser.user_id == user_id,
        ).delete()
        
        # تحديث حالة المشاهد
        viewer = db.query(LiveStreamViewer).filter(
            LiveStreamViewer.stream_id == stream_id,
            LiveStreamViewer.user_id == user_id,
        ).first()
        
        if viewer:
            viewer.is_banned = False
        
        db.commit()
        
        logger.info(f"User {user_id} unbanned from stream {stream_id}")
        
        return {
            "status": "success",
            "user_id": user_id,
            "stream_id": stream_id,
            "action": "unbanned",
        }
        
    except Exception as e:
        logger.error(f"Error unbanning user: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Camera Management ====================

@router.put("/{stream_id}/camera")
async def update_camera_state(
    stream_id: str,
    camera_enabled: Optional[bool] = None,
    microphone_enabled: Optional[bool] = None,
    screen_share_enabled: Optional[bool] = None,
    video_bitrate: Optional[int] = None,
    audio_bitrate: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """تحديث حالة الكاميرا"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="يجب تسجيل الدخول")

        # البحث عن جلسة البث
        session = db.query(LiveStreamSession).filter(
            LiveStreamSession.stream_id == stream_id,
            LiveStreamSession.host_id == current_user.id,
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="البث غير موجود")

        # تحديث الحالة
        if camera_enabled is not None:
            session.camera_enabled = camera_enabled
        
        if microphone_enabled is not None:
            session.microphone_enabled = microphone_enabled
        
        if screen_share_enabled is not None:
            session.screen_share_enabled = screen_share_enabled
        
        db.commit()
        db.refresh(session)
        
        logger.info(f"Updated camera state for stream {stream_id}")
        
        return {
            "status": "success",
            "camera_enabled": session.camera_enabled,
            "microphone_enabled": session.microphone_enabled,
            "screen_share_enabled": session.screen_share_enabled,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating camera state: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{stream_id}/close-camera")
async def close_camera(
    stream_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إغلاق الكاميرا"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="يجب تسجيل الدخول")

        # البحث عن جلسة البث
        session = db.query(LiveStreamSession).filter(
            LiveStreamSession.stream_id == stream_id,
            LiveStreamSession.host_id == current_user.id,
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="البث غير موجود")

        # إغلاق الكاميرا
        session.camera_enabled = False
        
        db.commit()
        
        logger.info(f"Closed camera for stream {stream_id}")
        
        return {
            "status": "success",
            "stream_id": stream_id,
            "camera_enabled": False,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error closing camera: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Statistics ====================

@router.get("/{stream_id}/stats")
async def get_stream_stats(
    stream_id: str,
    db: Session = Depends(get_db),
):
    """الحصول على إحصائيات البث"""
    try:
        session = db.query(LiveStreamSession).filter(
            LiveStreamSession.stream_id == stream_id
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="البث غير موجود")

        return {
            "stream_id": stream_id,
            "status": session.status,
            "total_viewers": session.total_viewers,
            "peak_viewers": session.peak_viewers,
            "unique_viewers": session.unique_viewers,
            "total_hearts": session.total_hearts,
            "total_gifts": session.total_gifts,
            "total_comments": session.total_comments,
            "total_coins_earned": session.total_coins_earned,
            "duration_seconds": session.duration_seconds,
            "health_score": session.health_score,
            "bitrate": 0,
            "fps": 30,
            "latency_ms": 0,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting stream stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
