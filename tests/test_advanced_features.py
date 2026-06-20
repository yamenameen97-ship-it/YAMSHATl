"""
اختبارات شاملة للأنظمة المتقدمة
اختبار نظام التفاعلات ونظام الهدايا
"""

import pytest
import sys
import os
from datetime import datetime

# إضافة مسارات الخدمات
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'services', 'post-service'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'services', 'live-service'))

from advanced_reactions_service import (
    AdvancedReactionsService,
    ReactionType,
    ReactionEmoji
)
from advanced_gifts_system import (
    AdvancedGiftsSystem,
    GiftCategory
)

# ==================== اختبارات نظام التفاعلات ====================

class TestAdvancedReactionsService:
    """اختبارات خدمة التفاعلات المتقدمة"""
    
    @pytest.fixture
    def reactions_service(self):
        """إنشاء خدمة التفاعلات للاختبار"""
        service = AdvancedReactionsService()
        # تنظيف البيانات
        service.reactions_data = {}
        return service
    
    def test_add_reaction_like(self, reactions_service):
        """اختبار إضافة تفاعل إعجاب"""
        result = reactions_service.add_reaction(
            "post_1",
            "user_1",
            ReactionType.LIKE
        )
        
        assert result["success"] == True
        assert result["post_reactions"]["like"] == 1
        assert result["post_reactions"]["total"] == 1
    
    def test_add_multiple_reactions(self, reactions_service):
        """اختبار إضافة تفاعلات متعددة"""
        # إضافة تفاعلات مختلفة
        reactions_service.add_reaction("post_1", "user_1", ReactionType.LIKE)
        reactions_service.add_reaction("post_1", "user_2", ReactionType.LOVE)
        reactions_service.add_reaction("post_1", "user_3", ReactionType.HAHA)
        
        reactions = reactions_service.get_post_reactions("post_1")
        
        assert reactions.like == 1
        assert reactions.love == 1
        assert reactions.haha == 1
        assert reactions.total_reactions == 3
    
    def test_update_reaction(self, reactions_service):
        """اختبار تحديث التفاعل"""
        # إضافة تفاعل أولي
        reactions_service.add_reaction("post_1", "user_1", ReactionType.LIKE)
        
        # تحديث التفاعل
        result = reactions_service.add_reaction("post_1", "user_1", ReactionType.LOVE)
        
        reactions = reactions_service.get_post_reactions("post_1")
        assert reactions.like == 0
        assert reactions.love == 1
        assert reactions.total_reactions == 1
    
    def test_remove_reaction(self, reactions_service):
        """اختبار إزالة التفاعل"""
        # إضافة تفاعل
        reactions_service.add_reaction("post_1", "user_1", ReactionType.LIKE)
        
        # إزالة التفاعل
        result = reactions_service.remove_reaction("post_1", "user_1")
        
        assert result["success"] == True
        reactions = reactions_service.get_post_reactions("post_1")
        assert reactions.like == 0
        assert reactions.total_reactions == 0
    
    def test_get_user_reaction(self, reactions_service):
        """اختبار الحصول على تفاعل المستخدم"""
        reactions_service.add_reaction("post_1", "user_1", ReactionType.LOVE)
        
        user_reaction = reactions_service.get_user_reaction("post_1", "user_1")
        
        assert user_reaction is not None
        assert user_reaction["reaction_type"] == "love"
        assert user_reaction["emoji"] == "❤️"
    
    def test_get_reaction_stats(self, reactions_service):
        """اختبار إحصائيات التفاعلات"""
        # إضافة تفاعلات متعددة
        reactions_service.add_reaction("post_1", "user_1", ReactionType.LIKE)
        reactions_service.add_reaction("post_1", "user_2", ReactionType.LIKE)
        reactions_service.add_reaction("post_1", "user_3", ReactionType.LOVE)
        reactions_service.add_reaction("post_1", "user_4", ReactionType.HAHA)
        
        stats = reactions_service.get_reaction_stats("post_1")
        
        assert stats["total_reactions"] == 4
        assert stats["most_common_reaction"] == "like"
        assert stats["unique_users"] == 4
        assert stats["reactions_breakdown"]["like"] == 2
        assert stats["reactions_breakdown"]["love"] == 1
        assert stats["reactions_breakdown"]["haha"] == 1
    
    def test_get_reactions_list(self, reactions_service):
        """اختبار الحصول على قائمة المستخدمين"""
        reactions_service.add_reaction("post_1", "user_1", ReactionType.LIKE)
        reactions_service.add_reaction("post_1", "user_2", ReactionType.LIKE)
        reactions_service.add_reaction("post_1", "user_3", ReactionType.LOVE)
        
        # الحصول على قائمة الإعجابات
        likes_list = reactions_service.get_reactions_list("post_1", ReactionType.LIKE)
        
        assert likes_list["count"] == 2
        assert len(likes_list["users"]) == 2
    
    def test_all_reaction_types(self, reactions_service):
        """اختبار جميع أنواع التفاعلات"""
        reaction_types = [
            ReactionType.LIKE,
            ReactionType.LOVE,
            ReactionType.HAHA,
            ReactionType.WOW,
            ReactionType.SAD,
            ReactionType.ANGRY
        ]
        
        for i, reaction_type in enumerate(reaction_types):
            reactions_service.add_reaction("post_1", f"user_{i}", reaction_type)
        
        reactions = reactions_service.get_post_reactions("post_1")
        
        assert reactions.like == 1
        assert reactions.love == 1
        assert reactions.haha == 1
        assert reactions.wow == 1
        assert reactions.sad == 1
        assert reactions.angry == 1
        assert reactions.total_reactions == 6

# ==================== اختبارات نظام الهدايا ====================

class TestAdvancedGiftsSystem:
    """اختبارات نظام الهدايا المتقدم"""
    
    @pytest.fixture
    def gifts_service(self):
        """إنشاء خدمة الهدايا للاختبار"""
        service = AdvancedGiftsSystem()
        # تنظيف البيانات
        service.gifts_data = {"gifts": []}
        service.wallets_data = {}
        service.logs_data = {}
        service._initialize_default_gifts()
        return service
    
    def test_get_available_gifts(self, gifts_service):
        """اختبار الحصول على الهدايا المتاحة"""
        gifts = gifts_service.get_available_gifts()
        
        assert len(gifts) > 0
        assert gifts[0]["id"] == 1
        assert gifts[0]["name"] == "وردة"
        assert gifts[0]["emoji"] == "🌹"
    
    def test_get_gift_by_id(self, gifts_service):
        """اختبار الحصول على هدية بواسطة المعرف"""
        gift = gifts_service.get_gift_by_id(1)
        
        assert gift is not None
        assert gift["name"] == "وردة"
        assert gift["coins"] == 10
    
    def test_create_user_wallet(self, gifts_service):
        """اختبار إنشاء محفظة المستخدم"""
        wallet = gifts_service.get_user_wallet("user_1")
        
        assert wallet.user_id == "user_1"
        assert wallet.balance == 0
        assert wallet.total_earned == 0
        assert wallet.total_spent == 0
    
    def test_add_coins(self, gifts_service):
        """اختبار إضافة عملات"""
        result = gifts_service.add_coins("user_1", 100)
        
        assert result["success"] == True
        assert result["wallet"]["balance"] == 100
        assert result["wallet"]["total_earned"] == 100
    
    def test_deduct_coins(self, gifts_service):
        """اختبار خصم عملات"""
        # إضافة عملات أولاً
        gifts_service.add_coins("user_1", 100)
        
        # خصم عملات
        result = gifts_service.deduct_coins("user_1", 30)
        
        assert result["success"] == True
        assert result["wallet"]["balance"] == 70
        assert result["wallet"]["total_spent"] == 30
    
    def test_insufficient_balance(self, gifts_service):
        """اختبار عدم كفاية الرصيد"""
        gifts_service.add_coins("user_1", 50)
        
        try:
            gifts_service.deduct_coins("user_1", 100)
            assert False, "يجب أن يرفع استثناء"
        except Exception as e:
            assert "رصيد غير كافي" in str(e)
    
    @pytest.mark.asyncio
    async def test_send_gift(self, gifts_service):
        """اختبار إرسال هدية"""
        # إضافة عملات للمرسل
        gifts_service.add_coins("user_1", 100)
        
        # إرسال هدية
        result = await gifts_service.send_gift(
            stream_id="stream_1",
            sender_id="user_1",
            sender_name="أحمد",
            sender_avatar=None,
            receiver_id="host_1",
            gift_id=1,
            amount=2
        )
        
        assert result["success"] == True
        assert result["gift"]["amount"] == 2
        assert result["gift"]["total_coins"] == 20
    
    @pytest.mark.asyncio
    async def test_send_gift_insufficient_balance(self, gifts_service):
        """اختبار إرسال هدية برصيد غير كافي"""
        # محاولة إرسال هدية بدون رصيد
        try:
            await gifts_service.send_gift(
                stream_id="stream_1",
                sender_id="user_1",
                sender_name="أحمد",
                sender_avatar=None,
                receiver_id="host_1",
                gift_id=1,
                amount=1
            )
            assert False, "يجب أن يرفع استثناء"
        except Exception as e:
            assert "رصيد غير كافي" in str(e)
    
    def test_get_stream_gift_log(self, gifts_service):
        """اختبار الحصول على سجل الهدايا"""
        log = gifts_service.get_stream_gift_log("stream_1")
        
        assert log["stream_id"] == "stream_1"
        assert log["total_coins_earned"] == 0
        assert log["total_gifts_count"] == 0
    
    def test_gift_categories(self, gifts_service):
        """اختبار فئات الهدايا"""
        gifts = gifts_service.get_available_gifts()
        
        categories = set(g["category"] for g in gifts)
        
        assert "basic" in categories
        assert "premium" in categories
        assert "special" in categories

# ==================== اختبارات التكامل ====================

class TestIntegration:
    """اختبارات التكامل بين الأنظمة"""
    
    @pytest.fixture
    def setup(self):
        """إعداد الخدمات للاختبار"""
        reactions = AdvancedReactionsService()
        reactions.reactions_data = {}
        
        gifts = AdvancedGiftsSystem()
        gifts.gifts_data = {"gifts": []}
        gifts.wallets_data = {}
        gifts.logs_data = {}
        gifts._initialize_default_gifts()
        
        return reactions, gifts
    
    def test_user_interaction_flow(self, setup):
        """اختبار تدفق تفاعل المستخدم الكامل"""
        reactions, gifts = setup
        
        # 1. المستخدم يضيف تفاعل على منشور
        reactions.add_reaction("post_1", "user_1", ReactionType.LIKE)
        
        # 2. المستخدم يتلقى عملات (محاكاة)
        gifts.add_coins("user_1", 100)
        
        # 3. التحقق من الرصيد
        wallet = gifts.get_user_wallet("user_1")
        assert wallet.balance == 100
        
        # 4. المستخدم يشاهد إحصائيات التفاعلات
        stats = reactions.get_reaction_stats("post_1")
        assert stats["total_reactions"] == 1

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
