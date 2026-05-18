from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging
from app.models.notification import Notification
# من المفترض وجود هذه النماذج
# from app.models.session import UserSession 
# from app.models.live import LiveRoom

logger = logging.getLogger(__name__)

class CleanupService:
    @staticmethod
    async def cleanup_expired_sessions(db: Session):
        """تنظيف الجلسات المنتهية"""
        # db.query(UserSession).filter(UserSession.expires_at < datetime.utcnow()).delete()
        # db.commit()
        logger.info("Cleaned up expired sessions")

    @staticmethod
    async def cleanup_dead_live_rooms(db: Session):
        """تنظيف الغرف المعلقة (Dead Live Rooms)"""
        # rooms = db.query(LiveRoom).filter(LiveRoom.last_ping < datetime.utcnow() - timedelta(minutes=5)).all()
        # for room in rooms:
        #     room.status = 'CLOSED'
        # db.commit()
        logger.info("Cleaned up dead live rooms")

    @staticmethod
    async def cleanup_old_notifications(db: Session, days: int = 30):
        """حذف الإشعارات القديمة جداً"""
        cutoff = datetime.utcnow() - timedelta(days=days)
        db.query(Notification).filter(Notification.created_at < cutoff).delete()
        db.commit()
        logger.info(f"Cleaned up notifications older than {days} days")
