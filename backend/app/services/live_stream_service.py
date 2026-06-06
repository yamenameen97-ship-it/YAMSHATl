"""
خدمة البث المباشر المتكاملة مع قاعدة البيانات
يتعامل مع إنشاء وإدارة البثوث المباشرة وربطها بالتعليقات والهدايا والمشاهدين
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
import logging

from app.models.live_viewers import (
    LiveStreamSession, LiveStreamViewer, LiveStreamHostSettings, LiveStreamCameraState
)
from app.models.live_moderation import (
    LiveRoomComment, LiveRoomMutedUser, LiveRoomBannedUser, LiveRoomKickedUser
)
from app.models.gift import Gift, UserCoins, GiftTransaction, LiveStreamRecording
from app.models.user import User

logger = logging.getLogger(__name__)


class LiveStreamService:
    """خدمة البث المباشر المتكاملة"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ==================== إنشاء وإدارة البث ====================
    
    def create_stream(self, host_id: int, title: str, description: Optional[str] = None, 
                     category: Optional[str] = None, is_public: bool = True) -> LiveStreamSession:
        """إنشاء جلسة بث مباشرة جديدة"""
        try:
            stream = LiveStreamSession(
                stream_id=f"stream_{host_id}_{int(datetime.utcnow().timestamp())}",
                host_id=host_id,
                title=title or f"بث مباشر",
                description=description,
                category=category,
                status="pending",
                is_public=is_public,
                allow_comments=True,
                allow_gifts=True,
                allow_recording=False,
                started_at=None,
                ended_at=None,
            )
            self.db.add(stream)
            self.db.commit()
            self.db.refresh(stream)
            logger.info(f"Created new live stream: {stream.stream_id}")
            return stream
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating live stream: {e}")
            raise
    
    def start_stream(self, stream_id: str, host_id: int) -> LiveStreamSession:
        """بدء البث المباشر"""
        try:
            stream = self.db.query(LiveStreamSession).filter(
                and_(
                    LiveStreamSession.stream_id == stream_id,
                    LiveStreamSession.host_id == host_id
                )
            ).first()
            
            if not stream:
                raise ValueError("البث غير موجود أو ليس لديك صلاحية")
            
            stream.status = "active"
            stream.started_at = datetime.utcnow()
            stream.health_score = 100
            
            self.db.commit()
            self.db.refresh(stream)
            logger.info(f"Started live stream: {stream_id}")
            return stream
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error starting live stream: {e}")
            raise
    
    def end_stream(self, stream_id: str, host_id: int) -> LiveStreamSession:
        """إنهاء البث المباشر"""
        try:
            stream = self.db.query(LiveStreamSession).filter(
                and_(
                    LiveStreamSession.stream_id == stream_id,
                    LiveStreamSession.host_id == host_id
                )
            ).first()
            
            if not stream:
                raise ValueError("البث غير موجود أو ليس لديك صلاحية")
            
            stream.status = "ended"
            stream.ended_at = datetime.utcnow()
            
            if stream.started_at:
                duration = (stream.ended_at - stream.started_at).total_seconds()
                stream.duration_seconds = int(duration)
            
            self.db.commit()
            self.db.refresh(stream)
            logger.info(f"Ended live stream: {stream_id}")
            return stream
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error ending live stream: {e}")
            raise
    
    def pause_stream(self, stream_id: str, host_id: int) -> LiveStreamSession:
        """إيقاف البث المباشر مؤقتاً"""
        try:
            stream = self.db.query(LiveStreamSession).filter(
                and_(
                    LiveStreamSession.stream_id == stream_id,
                    LiveStreamSession.host_id == host_id
                )
            ).first()
            
            if not stream:
                raise ValueError("البث غير موجود أو ليس لديك صلاحية")
            
            stream.status = "paused"
            self.db.commit()
            self.db.refresh(stream)
            return stream
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error pausing live stream: {e}")
            raise
    
    def resume_stream(self, stream_id: str, host_id: int) -> LiveStreamSession:
        """استئناف البث المباشر"""
        try:
            stream = self.db.query(LiveStreamSession).filter(
                and_(
                    LiveStreamSession.stream_id == stream_id,
                    LiveStreamSession.host_id == host_id
                )
            ).first()
            
            if not stream:
                raise ValueError("البث غير موجود أو ليس لديك صلاحية")
            
            stream.status = "active"
            self.db.commit()
            self.db.refresh(stream)
            return stream
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error resuming live stream: {e}")
            raise
    
    # ==================== إدارة المشاهدين ====================
    
    def add_viewer(self, stream_id: str, user_id: int, username: str, 
                   user_avatar: Optional[str] = None, platform: str = "web", 
                   device_type: str = "browser") -> LiveStreamViewer:
        """إضافة مشاهد للبث"""
        try:
            # التحقق من عدم وجود المشاهد بالفعل
            existing = self.db.query(LiveStreamViewer).filter(
                and_(
                    LiveStreamViewer.stream_id == stream_id,
                    LiveStreamViewer.user_id == user_id,
                    LiveStreamViewer.is_active == True
                )
            ).first()
            
            if existing:
                return existing
            
            viewer = LiveStreamViewer(
                stream_id=stream_id,
                user_id=user_id,
                username=username,
                user_avatar=user_avatar,
                platform=platform,
                device_type=device_type,
                is_active=True,
                is_banned=False,
                is_muted=False,
            )
            self.db.add(viewer)
            
            # تحديث عدد المشاهدين في البث
            stream = self.db.query(LiveStreamSession).filter(
                LiveStreamSession.stream_id == stream_id
            ).first()
            if stream:
                stream.total_viewers = self.db.query(LiveStreamViewer).filter(
                    and_(
                        LiveStreamViewer.stream_id == stream_id,
                        LiveStreamViewer.is_active == True
                    )
                ).count() + 1
                stream.peak_viewers = max(stream.peak_viewers, stream.total_viewers)
            
            self.db.commit()
            self.db.refresh(viewer)
            logger.info(f"Added viewer {user_id} to stream {stream_id}")
            return viewer
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error adding viewer: {e}")
            raise
    
    def remove_viewer(self, stream_id: str, user_id: int) -> bool:
        """إزالة مشاهد من البث"""
        try:
            viewer = self.db.query(LiveStreamViewer).filter(
                and_(
                    LiveStreamViewer.stream_id == stream_id,
                    LiveStreamViewer.user_id == user_id,
                    LiveStreamViewer.is_active == True
                )
            ).first()
            
            if viewer:
                viewer.is_active = False
                viewer.left_at = datetime.utcnow()
                
                # حساب مدة المشاهدة
                if viewer.joined_at:
                    duration = (viewer.left_at - viewer.joined_at).total_seconds()
                    viewer.watch_duration_seconds = int(duration)
                
                self.db.commit()
                logger.info(f"Removed viewer {user_id} from stream {stream_id}")
                return True
            return False
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error removing viewer: {e}")
            raise
    
    def get_active_viewers(self, stream_id: str, limit: int = 100, offset: int = 0) -> List[LiveStreamViewer]:
        """الحصول على المشاهدين النشطين"""
        try:
            return self.db.query(LiveStreamViewer).filter(
                and_(
                    LiveStreamViewer.stream_id == stream_id,
                    LiveStreamViewer.is_active == True
                )
            ).offset(offset).limit(limit).all()
        except Exception as e:
            logger.error(f"Error getting active viewers: {e}")
            return []
    
    # ==================== إدارة التعليقات ====================
    
    def add_comment(self, stream_id: str, user_id: int, content: str) -> LiveRoomComment:
        """إضافة تعليق على البث"""
        try:
            # التحقق من أن المستخدم غير مكتوم
            is_muted = self.db.query(LiveRoomMutedUser).filter(
                and_(
                    LiveRoomMutedUser.room_id == stream_id,
                    LiveRoomMutedUser.user_id == user_id,
                    or_(
                        LiveRoomMutedUser.unmuted_at == None,
                        LiveRoomMutedUser.unmuted_at > datetime.utcnow()
                    )
                )
            ).first()
            
            if is_muted:
                raise ValueError("أنت مكتوم في هذا البث")
            
            # التحقق من أن المستخدم غير محظور
            is_banned = self.db.query(LiveRoomBannedUser).filter(
                and_(
                    LiveRoomBannedUser.room_id == stream_id,
                    LiveRoomBannedUser.user_id == user_id,
                    or_(
                        LiveRoomBannedUser.unbanned_at == None,
                        LiveRoomBannedUser.unbanned_at > datetime.utcnow()
                    )
                )
            ).first()
            
            if is_banned:
                raise ValueError("أنت محظور من هذا البث")
            
            comment = LiveRoomComment(
                room_id=stream_id,
                user_id=user_id,
                content=content,
                is_pinned=False,
                is_deleted=False,
                is_moderated=False,
                moderation_score=0,
            )
            self.db.add(comment)
            
            # تحديث عدد التعليقات في البث
            stream = self.db.query(LiveStreamSession).filter(
                LiveStreamSession.stream_id == stream_id
            ).first()
            if stream:
                stream.total_comments = self.db.query(LiveRoomComment).filter(
                    and_(
                        LiveRoomComment.room_id == stream_id,
                        LiveRoomComment.is_deleted == False
                    )
                ).count() + 1
            
            self.db.commit()
            self.db.refresh(comment)
            logger.info(f"Added comment to stream {stream_id}")
            return comment
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error adding comment: {e}")
            raise
    
    def get_comments(self, stream_id: str, limit: int = 50, offset: int = 0) -> List[LiveRoomComment]:
        """الحصول على تعليقات البث"""
        try:
            return self.db.query(LiveRoomComment).filter(
                and_(
                    LiveRoomComment.room_id == stream_id,
                    LiveRoomComment.is_deleted == False
                )
            ).order_by(desc(LiveRoomComment.created_at)).offset(offset).limit(limit).all()
        except Exception as e:
            logger.error(f"Error getting comments: {e}")
            return []
    
    def delete_comment(self, comment_id: int, host_id: int) -> bool:
        """حذف تعليق من البث"""
        try:
            comment = self.db.query(LiveRoomComment).filter(
                LiveRoomComment.id == comment_id
            ).first()
            
            if not comment:
                return False
            
            # التحقق من أن المستخدم هو مضيف البث
            stream = self.db.query(LiveStreamSession).filter(
                LiveStreamSession.stream_id == comment.room_id
            ).first()
            
            if not stream or stream.host_id != host_id:
                raise ValueError("ليس لديك صلاحية حذف هذا التعليق")
            
            comment.is_deleted = True
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting comment: {e}")
            raise
    
    # ==================== إدارة الهدايا ====================
    
    def send_gift(self, stream_id: str, sender_id: int, gift_id: int, amount: int = 1) -> GiftTransaction:
        """إرسال هدية على البث"""
        try:
            # الحصول على معلومات الهدية
            gift = self.db.query(Gift).filter(Gift.id == gift_id).first()
            if not gift:
                raise ValueError("الهدية غير موجودة")
            
            # الحصول على البث
            stream = self.db.query(LiveStreamSession).filter(
                LiveStreamSession.stream_id == stream_id
            ).first()
            if not stream:
                raise ValueError("البث غير موجود")
            
            # التحقق من رصيد المرسل
            sender_coins = self.db.query(UserCoins).filter(
                UserCoins.user_id == sender_id
            ).first()
            
            if not sender_coins:
                raise ValueError("لا توجد محفظة للمستخدم")
            
            total_cost = gift.price * amount
            if sender_coins.balance < total_cost:
                raise ValueError("رصيد غير كافي")
            
            # خصم الرصيد من المرسل
            sender_coins.balance -= total_cost
            sender_coins.total_spent += total_cost
            
            # إضافة الأرباح للمضيف
            receiver_coins = self.db.query(UserCoins).filter(
                UserCoins.user_id == stream.host_id
            ).first()
            
            if receiver_coins:
                receiver_coins.balance += total_cost
                receiver_coins.total_earned += total_cost
            else:
                receiver_coins = UserCoins(
                    user_id=stream.host_id,
                    balance=total_cost,
                    total_earned=total_cost,
                    total_spent=0
                )
                self.db.add(receiver_coins)
            
            # إنشاء معاملة الهدية
            transaction = GiftTransaction(
                sender_id=sender_id,
                receiver_id=stream.host_id,
                gift_id=gift_id,
                live_room_id=stream_id,
                amount=amount,
                total_coins=total_cost,
            )
            self.db.add(transaction)
            
            # تحديث إحصائيات البث
            stream.total_gifts += amount
            stream.total_coins_earned += total_cost
            
            self.db.commit()
            self.db.refresh(transaction)
            logger.info(f"Gift sent: {sender_id} -> {stream.host_id} in stream {stream_id}")
            return transaction
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error sending gift: {e}")
            raise
    
    def get_available_gifts(self) -> List[Gift]:
        """الحصول على الهدايا المتاحة"""
        try:
            return self.db.query(Gift).filter(Gift.is_active == True).all()
        except Exception as e:
            logger.error(f"Error getting available gifts: {e}")
            return []
    
    # ==================== إدارة الإحصائيات ====================
    
    def get_stream_stats(self, stream_id: str) -> Dict[str, Any]:
        """الحصول على إحصائيات البث"""
        try:
            stream = self.db.query(LiveStreamSession).filter(
                LiveStreamSession.stream_id == stream_id
            ).first()
            
            if not stream:
                return {}
            
            # حساب المشاهدين النشطين
            active_viewers = self.db.query(LiveStreamViewer).filter(
                and_(
                    LiveStreamViewer.stream_id == stream_id,
                    LiveStreamViewer.is_active == True
                )
            ).count()
            
            # حساب المشاهدين الفريدين
            unique_viewers = self.db.query(LiveStreamViewer).filter(
                LiveStreamViewer.stream_id == stream_id
            ).count()
            
            # حساب التعليقات
            comments_count = self.db.query(LiveRoomComment).filter(
                and_(
                    LiveRoomComment.room_id == stream_id,
                    LiveRoomComment.is_deleted == False
                )
            ).count()
            
            # حساب الهدايا
            gifts_count = self.db.query(GiftTransaction).filter(
                GiftTransaction.live_room_id == stream_id
            ).count()
            
            return {
                "stream_id": stream_id,
                "title": stream.title,
                "status": stream.status,
                "active_viewers": active_viewers,
                "total_viewers": stream.total_viewers,
                "unique_viewers": unique_viewers,
                "peak_viewers": stream.peak_viewers,
                "total_hearts": stream.total_hearts,
                "total_gifts": stream.total_gifts,
                "total_comments": comments_count,
                "total_coins_earned": stream.total_coins_earned,
                "duration_seconds": stream.duration_seconds,
                "health_score": stream.health_score,
                "started_at": stream.started_at.isoformat() if stream.started_at else None,
                "ended_at": stream.ended_at.isoformat() if stream.ended_at else None,
            }
        except Exception as e:
            logger.error(f"Error getting stream stats: {e}")
            return {}
    
    def send_heart(self, stream_id: str, user_id: int) -> Dict[str, Any]:
        """إرسال قلب على البث"""
        try:
            stream = self.db.query(LiveStreamSession).filter(
                LiveStreamSession.stream_id == stream_id
            ).first()
            
            if not stream:
                raise ValueError("البث غير موجود")
            
            stream.total_hearts += 1
            
            # تحديث إحصائيات المشاهد
            viewer = self.db.query(LiveStreamViewer).filter(
                and_(
                    LiveStreamViewer.stream_id == stream_id,
                    LiveStreamViewer.user_id == user_id
                )
            ).first()
            
            if viewer:
                viewer.hearts_sent += 1
            
            self.db.commit()
            
            return {"hearts_count": stream.total_hearts}
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error sending heart: {e}")
            raise
    
    # ==================== إدارة الاعتدال ====================
    
    def mute_user(self, stream_id: str, user_id: int, moderator_id: int, 
                  reason: Optional[str] = None, duration_minutes: Optional[int] = None) -> LiveRoomMutedUser:
        """كتم صوت المستخدم في البث"""
        try:
            muted_user = LiveRoomMutedUser(
                room_id=stream_id,
                user_id=user_id,
                moderator_id=moderator_id,
                reason=reason,
                duration_minutes=duration_minutes,
            )
            self.db.add(muted_user)
            self.db.commit()
            self.db.refresh(muted_user)
            logger.info(f"Muted user {user_id} in stream {stream_id}")
            return muted_user
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error muting user: {e}")
            raise
    
    def ban_user(self, stream_id: str, user_id: int, host_id: int, 
                 reason: Optional[str] = None, duration_days: Optional[int] = None) -> LiveRoomBannedUser:
        """حظر المستخدم من البث"""
        try:
            banned_user = LiveRoomBannedUser(
                room_id=stream_id,
                user_id=user_id,
                host_id=host_id,
                reason=reason,
                duration_days=duration_days,
            )
            self.db.add(banned_user)
            self.db.commit()
            self.db.refresh(banned_user)
            logger.info(f"Banned user {user_id} from stream {stream_id}")
            return banned_user
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error banning user: {e}")
            raise
    
    # ==================== استرجاع البيانات ====================
    
    def get_stream(self, stream_id: str) -> Optional[LiveStreamSession]:
        """الحصول على بث محدد"""
        try:
            return self.db.query(LiveStreamSession).filter(
                LiveStreamSession.stream_id == stream_id
            ).first()
        except Exception as e:
            logger.error(f"Error getting stream: {e}")
            return None
    
    def get_active_streams(self, limit: int = 50, offset: int = 0) -> List[LiveStreamSession]:
        """الحصول على البثوث المباشرة النشطة"""
        try:
            return self.db.query(LiveStreamSession).filter(
                LiveStreamSession.status == "active"
            ).order_by(desc(LiveStreamSession.started_at)).offset(offset).limit(limit).all()
        except Exception as e:
            logger.error(f"Error getting active streams: {e}")
            return []
    
    def get_user_streams(self, host_id: int, limit: int = 50, offset: int = 0) -> List[LiveStreamSession]:
        """الحصول على بثوث المستخدم"""
        try:
            return self.db.query(LiveStreamSession).filter(
                LiveStreamSession.host_id == host_id
            ).order_by(desc(LiveStreamSession.created_at)).offset(offset).limit(limit).all()
        except Exception as e:
            logger.error(f"Error getting user streams: {e}")
            return []
