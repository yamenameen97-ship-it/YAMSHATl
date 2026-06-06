"""
خدمة البث المباشر المحسّنة - الإصدار 2
يتعامل مع إنشاء وإدارة البثوث المباشرة وربطها بالمنشورات والتعليقات والهدايا
"""

from fastapi import APIRouter, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import json
import logging

logger = logging.getLogger(__name__)

# ==================== Models ====================

class StreamStatus(str, Enum):
    """حالات البث المباشر"""
    PENDING = "pending"
    ACTIVE = "active"
    PAUSED = "paused"
    ENDED = "ended"
    ARCHIVED = "archived"

class GiftType(BaseModel):
    """نموذج الهدية"""
    id: int
    name: str
    emoji: str
    coins: int
    description: Optional[str] = None

class LiveComment(BaseModel):
    """نموذج التعليق على البث"""
    id: Optional[str] = None
    user: str
    text: str
    timestamp: Optional[datetime] = None
    user_avatar: Optional[str] = None
    is_host: bool = False
    is_verified: bool = False

class LiveGift(BaseModel):
    """نموذج الهدية المرسلة"""
    id: Optional[str] = None
    gift_id: int
    sender: str
    timestamp: Optional[datetime] = None
    amount: int = 1

class StreamStats(BaseModel):
    """إحصائيات البث"""
    viewer_count: int = 0
    hearts_count: int = 0
    comments_count: int = 0
    gifts_count: int = 0
    total_coins: int = 0
    avg_watch_time: int = 0
    peak_viewers: int = 0

class LiveStreamCreate(BaseModel):
    """نموذج إنشاء بث مباشر"""
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    category: Optional[str] = None
    is_private: bool = False
    allow_comments: bool = True
    allow_gifts: bool = True

class LiveStreamUpdate(BaseModel):
    """نموذج تحديث البث"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[StreamStatus] = None
    thumbnail_url: Optional[str] = None

class LiveStream(BaseModel):
    """نموذج البث المباشر الكامل"""
    id: str
    host: str
    host_name: str
    host_avatar: Optional[str] = None
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    status: StreamStatus = StreamStatus.PENDING
    stream_url: Optional[str] = None
    category: Optional[str] = None
    is_private: bool = False
    allow_comments: bool = True
    allow_gifts: bool = True
    created_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    stats: StreamStats = StreamStats()
    comments: List[LiveComment] = []
    gifts: List[LiveGift] = []
    co_hosts: List[str] = []
    linked_post_id: Optional[str] = None
    recording_status: str = "idle"
    health_score: int = 100

# ==================== Service ====================

class EnhancedLiveService:
    """خدمة البث المباشر المحسّنة"""
    
    def __init__(self, db_session, cache_service=None):
        self.db = db_session
        self.cache = cache_service
        self.active_streams: Dict[str, LiveStream] = {}
        self.stream_connections: Dict[str, List[WebSocket]] = {}
        self.gifts_config = [
            GiftType(id=1, name="وردة", emoji="🌹", coins=10),
            GiftType(id=2, name="صاروخ", emoji="🚀", coins=50),
            GiftType(id=3, name="تاج", emoji="👑", coins=100),
        ]

    async def create_stream(self, host_id: str, stream_data: LiveStreamCreate) -> LiveStream:
        """إنشاء بث مباشر جديد"""
        try:
            stream_id = f"stream_{host_id}_{int(datetime.now().timestamp())}"
            
            new_stream = LiveStream(
                id=stream_id,
                host=host_id,
                host_name=await self._get_user_name(host_id),
                host_avatar=await self._get_user_avatar(host_id),
                title=stream_data.title,
                description=stream_data.description,
                thumbnail_url=stream_data.thumbnail_url,
                category=stream_data.category,
                is_private=stream_data.is_private,
                allow_comments=stream_data.allow_comments,
                allow_gifts=stream_data.allow_gifts,
                created_at=datetime.now(),
            )
            
            # حفظ في قاعدة البيانات
            await self._save_stream_to_db(new_stream)
            
            # تخزين مؤقت
            self.active_streams[stream_id] = new_stream
            if self.cache:
                await self.cache.set(f"stream:{stream_id}", new_stream.dict(), ttl=86400)
            
            logger.info(f"Created new live stream: {stream_id}")
            return new_stream
            
        except Exception as e:
            logger.error(f"Error creating live stream: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def start_stream(self, stream_id: str) -> LiveStream:
        """بدء البث المباشر"""
        try:
            stream = await self.get_stream(stream_id)
            if not stream:
                raise HTTPException(status_code=404, detail="البث غير موجود")
            
            stream.status = StreamStatus.ACTIVE
            stream.started_at = datetime.now()
            stream.stream_url = f"rtmp://stream-server/{stream_id}"
            
            # تحديث في قاعدة البيانات
            await self._update_stream_in_db(stream)
            
            # إذاعة الحدث
            await self._broadcast_event(stream_id, {
                "type": "stream_started",
                "stream_id": stream_id,
                "timestamp": datetime.now().isoformat()
            })
            
            logger.info(f"Started live stream: {stream_id}")
            return stream
            
        except Exception as e:
            logger.error(f"Error starting live stream: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def end_stream(self, stream_id: str) -> LiveStream:
        """إنهاء البث المباشر"""
        try:
            stream = await self.get_stream(stream_id)
            if not stream:
                raise HTTPException(status_code=404, detail="البث غير موجود")
            
            stream.status = StreamStatus.ENDED
            stream.ended_at = datetime.now()
            
            # تحديث في قاعدة البيانات
            await self._update_stream_in_db(stream)
            
            # إذاعة الحدث
            await self._broadcast_event(stream_id, {
                "type": "stream_ended",
                "stream_id": stream_id,
                "stats": stream.stats.dict(),
                "timestamp": datetime.now().isoformat()
            })
            
            # تنظيف الاتصالات
            if stream_id in self.stream_connections:
                del self.stream_connections[stream_id]
            
            logger.info(f"Ended live stream: {stream_id}")
            return stream
            
        except Exception as e:
            logger.error(f"Error ending live stream: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def add_comment(self, stream_id: str, user_id: str, text: str) -> LiveComment:
        """إضافة تعليق على البث"""
        try:
            stream = await self.get_stream(stream_id)
            if not stream:
                raise HTTPException(status_code=404, detail="البث غير موجود")
            
            if not stream.allow_comments:
                raise HTTPException(status_code=403, detail="التعليقات معطلة على هذا البث")
            
            comment = LiveComment(
                id=f"comment_{stream_id}_{int(datetime.now().timestamp())}",
                user=user_id,
                text=text,
                timestamp=datetime.now(),
                user_avatar=await self._get_user_avatar(user_id),
                is_host=user_id == stream.host,
                is_verified=await self._is_user_verified(user_id)
            )
            
            stream.comments.append(comment)
            stream.stats.comments_count += 1
            
            # حفظ التعليق
            await self._save_comment_to_db(stream_id, comment)
            
            # إذاعة التعليق الجديد
            await self._broadcast_event(stream_id, {
                "type": "new_comment",
                "comment": comment.dict(),
                "timestamp": datetime.now().isoformat()
            })
            
            return comment
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error adding comment: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def send_gift(self, stream_id: str, user_id: str, gift_id: int, amount: int = 1) -> LiveGift:
        """إرسال هدية على البث"""
        try:
            stream = await self.get_stream(stream_id)
            if not stream:
                raise HTTPException(status_code=404, detail="البث غير موجود")
            
            if not stream.allow_gifts:
                raise HTTPException(status_code=403, detail="الهدايا معطلة على هذا البث")
            
            # التحقق من الهدية
            gift = next((g for g in self.gifts_config if g.id == gift_id), None)
            if not gift:
                raise HTTPException(status_code=404, detail="الهدية غير موجودة")
            
            # التحقق من الرصيد
            user_balance = await self._get_user_balance(user_id)
            total_cost = gift.coins * amount
            if user_balance < total_cost:
                raise HTTPException(status_code=400, detail="رصيد غير كافي")
            
            # خصم الرصيد
            await self._deduct_user_balance(user_id, total_cost)
            
            # إضافة الهدية
            gift_obj = LiveGift(
                id=f"gift_{stream_id}_{int(datetime.now().timestamp())}",
                gift_id=gift_id,
                sender=user_id,
                timestamp=datetime.now(),
                amount=amount
            )
            
            stream.gifts.append(gift_obj)
            stream.stats.gifts_count += 1
            stream.stats.total_coins += total_cost
            
            # حفظ الهدية
            await self._save_gift_to_db(stream_id, gift_obj)
            
            # إضافة الأرباح للمضيف
            await self._add_host_earnings(stream.host, total_cost)
            
            # إذاعة الهدية الجديدة
            await self._broadcast_event(stream_id, {
                "type": "new_gift",
                "gift": {
                    "sender": user_id,
                    "gift_id": gift_id,
                    "gift_name": gift.name,
                    "gift_emoji": gift.emoji,
                    "amount": amount,
                    "total_coins": total_cost
                },
                "timestamp": datetime.now().isoformat()
            })
            
            return gift_obj
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error sending gift: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def send_heart(self, stream_id: str, user_id: str) -> Dict[str, Any]:
        """إرسال قلب على البث"""
        try:
            stream = await self.get_stream(stream_id)
            if not stream:
                raise HTTPException(status_code=404, detail="البث غير موجود")
            
            stream.stats.hearts_count += 1
            
            # إذاعة القلب الجديد
            await self._broadcast_event(stream_id, {
                "type": "new_heart",
                "user": user_id,
                "hearts_count": stream.stats.hearts_count,
                "timestamp": datetime.now().isoformat()
            })
            
            return {"hearts_count": stream.stats.hearts_count}
            
        except Exception as e:
            logger.error(f"Error sending heart: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_stream(self, stream_id: str) -> Optional[LiveStream]:
        """الحصول على بث محدد"""
        try:
            # البحث في الذاكرة المؤقتة أولاً
            if stream_id in self.active_streams:
                return self.active_streams[stream_id]
            
            # البحث في قاعدة البيانات
            stream = await self._get_stream_from_db(stream_id)
            if stream:
                self.active_streams[stream_id] = stream
            
            return stream
            
        except Exception as e:
            logger.error(f"Error getting stream: {e}")
            return None

    async def get_active_streams(self, limit: int = 50, offset: int = 0) -> List[LiveStream]:
        """الحصول على البثوث المباشرة النشطة"""
        try:
            streams = await self._get_active_streams_from_db(limit, offset)
            return streams
        except Exception as e:
            logger.error(f"Error getting active streams: {e}")
            return []

    async def link_stream_to_post(self, stream_id: str, post_id: str) -> LiveStream:
        """ربط البث بمنشور"""
        try:
            stream = await self.get_stream(stream_id)
            if not stream:
                raise HTTPException(status_code=404, detail="البث غير موجود")
            
            stream.linked_post_id = post_id
            await self._update_stream_in_db(stream)
            
            logger.info(f"Linked stream {stream_id} to post {post_id}")
            return stream
            
        except Exception as e:
            logger.error(f"Error linking stream to post: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_stream_stats(self, stream_id: str) -> StreamStats:
        """الحصول على إحصائيات البث"""
        try:
            stream = await self.get_stream(stream_id)
            if not stream:
                raise HTTPException(status_code=404, detail="البث غير موجود")
            
            return stream.stats
            
        except Exception as e:
            logger.error(f"Error getting stream stats: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # ==================== Helper Methods ====================

    async def _get_user_name(self, user_id: str) -> str:
        """الحصول على اسم المستخدم"""
        # يتم تنفيذه من قاعدة البيانات
        return "User"

    async def _get_user_avatar(self, user_id: str) -> Optional[str]:
        """الحصول على صورة المستخدم"""
        # يتم تنفيذه من قاعدة البيانات
        return None

    async def _is_user_verified(self, user_id: str) -> bool:
        """التحقق من تحقق المستخدم"""
        # يتم تنفيذه من قاعدة البيانات
        return False

    async def _get_user_balance(self, user_id: str) -> int:
        """الحصول على رصيد المستخدم"""
        # يتم تنفيذه من قاعدة البيانات
        return 0

    async def _deduct_user_balance(self, user_id: str, amount: int) -> None:
        """خصم رصيد المستخدم"""
        # يتم تنفيذه من قاعدة البيانات
        pass

    async def _add_host_earnings(self, host_id: str, amount: int) -> None:
        """إضافة أرباح المضيف"""
        # يتم تنفيذه من قاعدة البيانات
        pass

    async def _save_stream_to_db(self, stream: LiveStream) -> None:
        """حفظ البث في قاعدة البيانات"""
        # يتم تنفيذه من قاعدة البيانات
        pass

    async def _update_stream_in_db(self, stream: LiveStream) -> None:
        """تحديث البث في قاعدة البيانات"""
        # يتم تنفيذه من قاعدة البيانات
        pass

    async def _get_stream_from_db(self, stream_id: str) -> Optional[LiveStream]:
        """الحصول على البث من قاعدة البيانات"""
        # يتم تنفيذه من قاعدة البيانات
        return None

    async def _get_active_streams_from_db(self, limit: int, offset: int) -> List[LiveStream]:
        """الحصول على البثوث النشطة من قاعدة البيانات"""
        # يتم تنفيذه من قاعدة البيانات
        return []

    async def _save_comment_to_db(self, stream_id: str, comment: LiveComment) -> None:
        """حفظ التعليق في قاعدة البيانات"""
        # يتم تنفيذه من قاعدة البيانات
        pass

    async def _save_gift_to_db(self, stream_id: str, gift: LiveGift) -> None:
        """حفظ الهدية في قاعدة البيانات"""
        # يتم تنفيذه من قاعدة البيانات
        pass

    async def _broadcast_event(self, stream_id: str, event: Dict[str, Any]) -> None:
        """إذاعة حدث إلى جميع المتصلين"""
        if stream_id in self.stream_connections:
            disconnected = []
            for ws in self.stream_connections[stream_id]:
                try:
                    await ws.send_json(event)
                except Exception as e:
                    logger.error(f"Error broadcasting event: {e}")
                    disconnected.append(ws)
            
            # إزالة الاتصالات المقطوعة
            for ws in disconnected:
                self.stream_connections[stream_id].remove(ws)

# ==================== Router ====================

def create_live_router(service: EnhancedLiveService) -> APIRouter:
    """إنشاء جهاز التوجيه للبث المباشر"""
    router = APIRouter(prefix="/live", tags=["live"])

    @router.post("/create")
    async def create_stream(stream_data: LiveStreamCreate, current_user: str = Depends()):
        return await service.create_stream(current_user, stream_data)

    @router.post("/{stream_id}/start")
    async def start_stream(stream_id: str):
        return await service.start_stream(stream_id)

    @router.post("/{stream_id}/end")
    async def end_stream(stream_id: str):
        return await service.end_stream(stream_id)

    @router.post("/{stream_id}/comment")
    async def add_comment(stream_id: str, text: str, current_user: str = Depends()):
        return await service.add_comment(stream_id, current_user, text)

    @router.post("/{stream_id}/gift")
    async def send_gift(stream_id: str, gift_id: int, amount: int = 1, current_user: str = Depends()):
        return await service.send_gift(stream_id, current_user, gift_id, amount)

    @router.post("/{stream_id}/heart")
    async def send_heart(stream_id: str, current_user: str = Depends()):
        return await service.send_heart(stream_id, current_user)

    @router.get("/{stream_id}")
    async def get_stream(stream_id: str):
        return await service.get_stream(stream_id)

    @router.get("/active")
    async def get_active_streams(limit: int = Query(50), offset: int = Query(0)):
        return await service.get_active_streams(limit, offset)

    @router.post("/{stream_id}/link-post")
    async def link_to_post(stream_id: str, post_id: str):
        return await service.link_stream_to_post(stream_id, post_id)

    @router.get("/{stream_id}/stats")
    async def get_stats(stream_id: str):
        return await service.get_stream_stats(stream_id)

    return router
