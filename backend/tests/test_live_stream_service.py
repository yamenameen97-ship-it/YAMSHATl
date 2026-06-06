"""
اختبارات شاملة لخدمة البث المباشر
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.services.live_stream_service import LiveStreamService
from app.models.live_viewers import LiveStreamSession, LiveStreamViewer
from app.models.live_moderation import LiveRoomComment, LiveRoomMutedUser, LiveRoomBannedUser
from app.models.gift import Gift, UserCoins, GiftTransaction
from app.models.user import User


class TestLiveStreamService:
    """اختبارات خدمة البث المباشر"""
    
    @pytest.fixture
    def service(self, db: Session):
        """إنشاء خدمة البث المباشر"""
        return LiveStreamService(db)
    
    @pytest.fixture
    def test_user(self, db: Session):
        """إنشاء مستخدم اختبار"""
        user = User(
            username="test_user",
            email="test@example.com",
            hashed_password="hashed_password",
            role="user",
            is_active=True,
            email_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @pytest.fixture
    def test_gift(self, db: Session):
        """إنشاء هدية اختبار"""
        gift = Gift(
            name="وردة",
            emoji="🌹",
            description="هدية جميلة",
            price=10,
            image_url="https://example.com/rose.png",
            is_active=True
        )
        db.add(gift)
        db.commit()
        db.refresh(gift)
        return gift
    
    @pytest.fixture
    def test_coins(self, db: Session, test_user: User):
        """إنشاء محفظة اختبار"""
        coins = UserCoins(
            user_id=test_user.id,
            balance=1000,
            total_earned=0,
            total_spent=0
        )
        db.add(coins)
        db.commit()
        db.refresh(coins)
        return coins
    
    # ==================== اختبارات إنشاء وإدارة البث ====================
    
    def test_create_stream(self, service: LiveStreamService, test_user: User):
        """اختبار إنشاء بث جديد"""
        stream = service.create_stream(
            host_id=test_user.id,
            title="بث اختبار",
            description="وصف البث",
            category="ترفيه",
            is_public=True
        )
        
        assert stream is not None
        assert stream.host_id == test_user.id
        assert stream.title == "بث اختبار"
        assert stream.status == "pending"
        assert stream.is_public == True
    
    def test_start_stream(self, service: LiveStreamService, test_user: User, db: Session):
        """اختبار بدء البث"""
        stream = service.create_stream(
            host_id=test_user.id,
            title="بث اختبار",
        )
        
        started_stream = service.start_stream(stream.stream_id, test_user.id)
        
        assert started_stream.status == "active"
        assert started_stream.started_at is not None
        assert started_stream.health_score == 100
    
    def test_end_stream(self, service: LiveStreamService, test_user: User):
        """اختبار إنهاء البث"""
        stream = service.create_stream(
            host_id=test_user.id,
            title="بث اختبار",
        )
        service.start_stream(stream.stream_id, test_user.id)
        
        ended_stream = service.end_stream(stream.stream_id, test_user.id)
        
        assert ended_stream.status == "ended"
        assert ended_stream.ended_at is not None
        assert ended_stream.duration_seconds >= 0
    
    def test_pause_stream(self, service: LiveStreamService, test_user: User):
        """اختبار إيقاف البث مؤقتاً"""
        stream = service.create_stream(
            host_id=test_user.id,
            title="بث اختبار",
        )
        service.start_stream(stream.stream_id, test_user.id)
        
        paused_stream = service.pause_stream(stream.stream_id, test_user.id)
        
        assert paused_stream.status == "paused"
    
    def test_resume_stream(self, service: LiveStreamService, test_user: User):
        """اختبار استئناف البث"""
        stream = service.create_stream(
            host_id=test_user.id,
            title="بث اختبار",
        )
        service.start_stream(stream.stream_id, test_user.id)
        service.pause_stream(stream.stream_id, test_user.id)
        
        resumed_stream = service.resume_stream(stream.stream_id, test_user.id)
        
        assert resumed_stream.status == "active"
    
    # ==================== اختبارات إدارة المشاهدين ====================
    
    def test_add_viewer(self, service: LiveStreamService, test_user: User):
        """اختبار إضافة مشاهد"""
        stream = service.create_stream(
            host_id=test_user.id,
            title="بث اختبار",
        )
        service.start_stream(stream.stream_id, test_user.id)
        
        viewer = service.add_viewer(
            stream_id=stream.stream_id,
            user_id=2,
            username="مشاهد",
            user_avatar="https://example.com/avatar.jpg"
        )
        
        assert viewer is not None
        assert viewer.user_id == 2
        assert viewer.username == "مشاهد"
        assert viewer.is_active == True
    
    def test_remove_viewer(self, service: LiveStreamService, test_user: User):
        """اختبار إزالة مشاهد"""
        stream = service.create_stream(
            host_id=test_user.id,
            title="بث اختبار",
        )
        service.start_stream(stream.stream_id, test_user.id)
        
        service.add_viewer(
            stream_id=stream.stream_id,
            user_id=2,
            username="مشاهد"
        )
        
        success = service.remove_viewer(stream.stream_id, 2)
        
        assert success == True
    
    def test_get_active_viewers(self, service: LiveStreamService, test_user: User):
        """اختبار الحصول على المشاهدين النشطين"""
        stream = service.create_stream(
            host_id=test_user.id,
            title="بث اختبار",
        )
        service.start_stream(stream.stream_id, test_user.id)
        
        service.add_viewer(stream.stream_id, 2, "مشاهد1")
        service.add_viewer(stream.stream_id, 3, "مشاهد2")
        
        viewers = service.get_active_viewers(stream.stream_id)
        
        assert len(viewers) == 2
    
    # ==================== اختبارات التعليقات ====================
    
    def test_add_comment(self, service: LiveStreamService, test_user: User):
        """اختبار إضافة تعليق"""
        stream = service.create_stream(
            host_id=test_user.id,
            title="بث اختبار",
        )
        service.start_stream(stream.stream_id, test_user.id)
        
        comment = service.add_comment(
            stream_id=stream.stream_id,
            user_id=2,
            content="تعليق رائع!"
        )
        
        assert comment is not None
        assert comment.content == "تعليق رائع!"
        assert comment.is_deleted == False
    
    def test_get_comments(self, service: LiveStreamService, test_user: User):
        """اختبار الحصول على التعليقات"""
        stream = service.create_stream(
            host_id=test_user.id,
            title="بث اختبار",
        )
        service.start_stream(stream.stream_id, test_user.id)
        
        service.add_comment(stream.stream_id, 2, "تعليق 1")
        service.add_comment(stream.stream_id, 3, "تعليق 2")
        
        comments = service.get_comments(stream.stream_id)
        
        assert len(comments) == 2
    
    def test_delete_comment(self, service: LiveStreamService, test_user: User):
        """اختبار حذف تعليق"""
        stream = service.create_stream(
            host_id=test_user.id,
            title="بث اختبار",
        )
        service.start_stream(stream.stream_id, test_user.id)
        
        comment = service.add_comment(stream.stream_id, 2, "تعليق")
        
        success = service.delete_comment(comment.id, test_user.id)
        
        assert success == True
    
    # ==================== اختبارات الهدايا ====================
    
    def test_send_gift(self, service: LiveStreamService, test_user: User, 
                       test_gift: Gift, test_coins: UserCoins, db: Session):
        """اختبار إرسال هدية"""
        stream = service.create_stream(
            host_id=test_user.id,
            title="بث اختبار",
        )
        service.start_stream(stream.stream_id, test_user.id)
        
        # إنشاء محفظة للمرسل
        sender_coins = UserCoins(
            user_id=2,
            balance=100,
            total_earned=0,
            total_spent=0
        )
        db.add(sender_coins)
        db.commit()
        
        transaction = service.send_gift(
            stream_id=stream.stream_id,
            sender_id=2,
            gift_id=test_gift.id,
            amount=1
        )
        
        assert transaction is not None
        assert transaction.sender_id == 2
        assert transaction.receiver_id == test_user.id
        assert transaction.total_coins == test_gift.price
    
    def test_send_gift_insufficient_balance(self, service: LiveStreamService, 
                                           test_user: User, test_gift: Gift, db: Session):
        """اختبار إرسال هدية برصيد غير كافي"""
        stream = service.create_stream(
            host_id=test_user.id,
            title="بث اختبار",
        )
        service.start_stream(stream.stream_id, test_user.id)
        
        # إنشاء محفظة بدون رصيد كافي
        sender_coins = UserCoins(
            user_id=2,
            balance=1,
            total_earned=0,
            total_spent=0
        )
        db.add(sender_coins)
        db.commit()
        
        with pytest.raises(ValueError):
            service.send_gift(
                stream_id=stream.stream_id,
                sender_id=2,
                gift_id=test_gift.id,
                amount=1
            )
    
    def test_get_available_gifts(self, service: LiveStreamService, test_gift: Gift):
        """اختبار الحصول على الهدايا المتاحة"""
        gifts = service.get_available_gifts()
        
        assert len(gifts) > 0
        assert any(g.id == test_gift.id for g in gifts)
    
    # ==================== اختبارات الإحصائيات ====================
    
    def test_get_stream_stats(self, service: LiveStreamService, test_user: User):
        """اختبار الحصول على إحصائيات البث"""
        stream = service.create_stream(
            host_id=test_user.id,
            title="بث اختبار",
        )
        service.start_stream(stream.stream_id, test_user.id)
        
        stats = service.get_stream_stats(stream.stream_id)
        
        assert stats is not None
        assert stats["stream_id"] == stream.stream_id
        assert stats["status"] == "active"
        assert stats["active_viewers"] == 0
    
    def test_send_heart(self, service: LiveStreamService, test_user: User):
        """اختبار إرسال قلب"""
        stream = service.create_stream(
            host_id=test_user.id,
            title="بث اختبار",
        )
        service.start_stream(stream.stream_id, test_user.id)
        
        result = service.send_heart(stream.stream_id, 2)
        
        assert result is not None
        assert result["hearts_count"] == 1
    
    # ==================== اختبارات الاعتدال ====================
    
    def test_mute_user(self, service: LiveStreamService, test_user: User):
        """اختبار كتم صوت المستخدم"""
        stream = service.create_stream(
            host_id=test_user.id,
            title="بث اختبار",
        )
        service.start_stream(stream.stream_id, test_user.id)
        
        muted = service.mute_user(
            stream_id=stream.stream_id,
            user_id=2,
            moderator_id=test_user.id,
            reason="سلوك سيء",
            duration_minutes=30
        )
        
        assert muted is not None
        assert muted.user_id == 2
        assert muted.duration_minutes == 30
    
    def test_ban_user(self, service: LiveStreamService, test_user: User):
        """اختبار حظر المستخدم"""
        stream = service.create_stream(
            host_id=test_user.id,
            title="بث اختبار",
        )
        service.start_stream(stream.stream_id, test_user.id)
        
        banned = service.ban_user(
            stream_id=stream.stream_id,
            user_id=2,
            host_id=test_user.id,
            reason="انتهاك القواعس",
            duration_days=7
        )
        
        assert banned is not None
        assert banned.user_id == 2
        assert banned.duration_days == 7
    
    # ==================== اختبارات استرجاع البيانات ====================
    
    def test_get_stream(self, service: LiveStreamService, test_user: User):
        """اختبار الحصول على بث"""
        stream = service.create_stream(
            host_id=test_user.id,
            title="بث اختبار",
        )
        
        retrieved_stream = service.get_stream(stream.stream_id)
        
        assert retrieved_stream is not None
        assert retrieved_stream.stream_id == stream.stream_id
    
    def test_get_active_streams(self, service: LiveStreamService, test_user: User):
        """اختبار الحصول على البثوث النشطة"""
        stream = service.create_stream(
            host_id=test_user.id,
            title="بث اختبار",
        )
        service.start_stream(stream.stream_id, test_user.id)
        
        active_streams = service.get_active_streams()
        
        assert len(active_streams) > 0
        assert any(s.stream_id == stream.stream_id for s in active_streams)
    
    def test_get_user_streams(self, service: LiveStreamService, test_user: User):
        """اختبار الحصول على بثوث المستخدم"""
        service.create_stream(
            host_id=test_user.id,
            title="بث 1",
        )
        service.create_stream(
            host_id=test_user.id,
            title="بث 2",
        )
        
        user_streams = service.get_user_streams(test_user.id)
        
        assert len(user_streams) == 2
