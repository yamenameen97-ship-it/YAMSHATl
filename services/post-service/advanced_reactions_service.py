"""
خدمة التفاعلات المتقدمة
نظام متقدم للتفاعلات مع 6 أنواع (Like, Love, Haha, Wow, Sad, Angry) وعدادات منفصلة
"""

from fastapi import FastAPI, HTTPException, Body, APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import json
import os
import uuid

# ==================== Models ====================

class ReactionType(str, Enum):
    """أنواع التفاعلات المتاحة"""
    LIKE = "like"           # 👍
    LOVE = "love"           # ❤️
    HAHA = "haha"           # 😆
    WOW = "wow"             # 😮
    SAD = "sad"             # 😢
    ANGRY = "angry"         # 😡

class ReactionEmoji(dict):
    """تعريف الرموز التعبيرية للتفاعلات"""
    REACTIONS = {
        ReactionType.LIKE: "👍",
        ReactionType.LOVE: "❤️",
        ReactionType.HAHA: "😆",
        ReactionType.WOW: "😮",
        ReactionType.SAD: "😢",
        ReactionType.ANGRY: "😡"
    }

class UserReaction(BaseModel):
    """نموذج التفاعل الفردي للمستخدم"""
    id: Optional[str] = None
    user_id: str
    post_id: str
    reaction_type: ReactionType
    timestamp: Optional[datetime] = None

class ReactionCount(BaseModel):
    """عداد التفاعلات لنوع واحد"""
    reaction_type: ReactionType
    count: int
    emoji: str

class PostReactions(BaseModel):
    """نموذج جميع التفاعلات على منشور واحد"""
    post_id: str
    like: int = 0
    love: int = 0
    haha: int = 0
    wow: int = 0
    sad: int = 0
    angry: int = 0
    total_reactions: int = 0
    user_reactions: List[UserReaction] = []

class ReactionStats(BaseModel):
    """إحصائيات التفاعلات"""
    total_reactions: int
    most_common_reaction: Optional[ReactionType] = None
    reactions_breakdown: Dict[str, int]
    unique_users: int

# ==================== Service ====================

class AdvancedReactionsService:
    """خدمة التفاعلات المتقدمة"""
    
    def __init__(self):
        self.reactions_file = "reactions_db.json"
        self.reactions_data = self._load_reactions()
    
    def _load_reactions(self) -> Dict[str, Any]:
        """تحميل بيانات التفاعلات من الملف"""
        if os.path.exists(self.reactions_file):
            try:
                with open(self.reactions_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except:
                return {}
        return {}
    
    def _save_reactions(self) -> None:
        """حفظ بيانات التفاعلات في الملف"""
        with open(self.reactions_file, "w", encoding="utf-8") as f:
            json.dump(self.reactions_data, f, ensure_ascii=False, indent=2)
    
    def _get_post_reactions(self, post_id: str) -> PostReactions:
        """الحصول على جميع التفاعلات على منشور"""
        if post_id not in self.reactions_data:
            self.reactions_data[post_id] = {
                "like": 0,
                "love": 0,
                "haha": 0,
                "wow": 0,
                "sad": 0,
                "angry": 0,
                "user_reactions": []
            }
        
        data = self.reactions_data[post_id]
        total = sum([
            data.get("like", 0),
            data.get("love", 0),
            data.get("haha", 0),
            data.get("wow", 0),
            data.get("sad", 0),
            data.get("angry", 0)
        ])
        
        return PostReactions(
            post_id=post_id,
            like=data.get("like", 0),
            love=data.get("love", 0),
            haha=data.get("haha", 0),
            wow=data.get("wow", 0),
            sad=data.get("sad", 0),
            angry=data.get("angry", 0),
            total_reactions=total,
            user_reactions=data.get("user_reactions", [])
        )
    
    def add_reaction(self, post_id: str, user_id: str, reaction_type: ReactionType) -> Dict[str, Any]:
        """إضافة تفاعل جديد أو تحديث التفاعل الموجود"""
        try:
            # الحصول على التفاعلات الحالية
            post_reactions = self._get_post_reactions(post_id)
            
            # البحث عن تفاعل سابق من نفس المستخدم
            existing_reaction = None
            for i, reaction in enumerate(post_reactions.user_reactions):
                if reaction.get("user_id") == user_id:
                    existing_reaction = i
                    break
            
            # إذا كان هناك تفاعل سابق، قم بتقليل العداد القديم
            if existing_reaction is not None:
                old_reaction_type = post_reactions.user_reactions[existing_reaction].get("reaction_type")
                if old_reaction_type in self.reactions_data[post_id]:
                    self.reactions_data[post_id][old_reaction_type] -= 1
                # إزالة التفاعل القديم
                post_reactions.user_reactions.pop(existing_reaction)
            
            # إضافة التفاعل الجديد
            new_reaction = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "post_id": post_id,
                "reaction_type": reaction_type.value,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            post_reactions.user_reactions.append(new_reaction)
            self.reactions_data[post_id][reaction_type.value] += 1
            
            # حفظ البيانات
            self._save_reactions()
            
            # إعادة حساب التفاعلات
            updated_reactions = self._get_post_reactions(post_id)
            
            return {
                "success": True,
                "message": f"تم إضافة تفاعل {reaction_type.value}",
                "reaction": new_reaction,
                "post_reactions": {
                    "like": updated_reactions.like,
                    "love": updated_reactions.love,
                    "haha": updated_reactions.haha,
                    "wow": updated_reactions.wow,
                    "sad": updated_reactions.sad,
                    "angry": updated_reactions.angry,
                    "total": updated_reactions.total_reactions
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def remove_reaction(self, post_id: str, user_id: str) -> Dict[str, Any]:
        """إزالة تفاعل المستخدم"""
        try:
            if post_id not in self.reactions_data:
                raise HTTPException(status_code=404, detail="المنشور غير موجود")
            
            post_reactions = self._get_post_reactions(post_id)
            
            # البحث عن تفاعل المستخدم
            reaction_index = None
            for i, reaction in enumerate(post_reactions.user_reactions):
                if reaction.get("user_id") == user_id:
                    reaction_index = i
                    break
            
            if reaction_index is None:
                raise HTTPException(status_code=404, detail="لا يوجد تفاعل من هذا المستخدم")
            
            # الحصول على نوع التفاعل
            reaction_type = post_reactions.user_reactions[reaction_index].get("reaction_type")
            
            # تقليل العداد
            if reaction_type in self.reactions_data[post_id]:
                self.reactions_data[post_id][reaction_type] -= 1
            
            # إزالة التفاعل
            post_reactions.user_reactions.pop(reaction_index)
            
            # حفظ البيانات
            self._save_reactions()
            
            # إعادة حساب التفاعلات
            updated_reactions = self._get_post_reactions(post_id)
            
            return {
                "success": True,
                "message": "تم إزالة التفاعل",
                "post_reactions": {
                    "like": updated_reactions.like,
                    "love": updated_reactions.love,
                    "haha": updated_reactions.haha,
                    "wow": updated_reactions.wow,
                    "sad": updated_reactions.sad,
                    "angry": updated_reactions.angry,
                    "total": updated_reactions.total_reactions
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_post_reactions(self, post_id: str) -> Dict[str, Any]:
        """الحصول على جميع التفاعلات على منشور"""
        try:
            reactions = self._get_post_reactions(post_id)
            return {
                "post_id": post_id,
                "reactions": {
                    "like": reactions.like,
                    "love": reactions.love,
                    "haha": reactions.haha,
                    "wow": reactions.wow,
                    "sad": reactions.sad,
                    "angry": reactions.angry,
                    "total": reactions.total_reactions
                },
                "emojis": {
                    "like": ReactionEmoji.REACTIONS[ReactionType.LIKE],
                    "love": ReactionEmoji.REACTIONS[ReactionType.LOVE],
                    "haha": ReactionEmoji.REACTIONS[ReactionType.HAHA],
                    "wow": ReactionEmoji.REACTIONS[ReactionType.WOW],
                    "sad": ReactionEmoji.REACTIONS[ReactionType.SAD],
                    "angry": ReactionEmoji.REACTIONS[ReactionType.ANGRY]
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_user_reaction(self, post_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """الحصول على تفاعل المستخدم على منشور محدد"""
        try:
            if post_id not in self.reactions_data:
                return None
            
            post_reactions = self._get_post_reactions(post_id)
            
            for reaction in post_reactions.user_reactions:
                if reaction.get("user_id") == user_id:
                    return {
                        "user_id": user_id,
                        "post_id": post_id,
                        "reaction_type": reaction.get("reaction_type"),
                        "emoji": ReactionEmoji.REACTIONS.get(
                            ReactionType(reaction.get("reaction_type"))
                        ),
                        "timestamp": reaction.get("timestamp")
                    }
            
            return None
        except Exception as e:
            return None
    
    def get_reaction_stats(self, post_id: str) -> Dict[str, Any]:
        """الحصول على إحصائيات التفاعلات على منشور"""
        try:
            reactions = self._get_post_reactions(post_id)
            
            reaction_counts = {
                "like": reactions.like,
                "love": reactions.love,
                "haha": reactions.haha,
                "wow": reactions.wow,
                "sad": reactions.sad,
                "angry": reactions.angry
            }
            
            # العثور على أكثر تفاعل شيوعاً
            most_common = max(reaction_counts, key=reaction_counts.get) if reaction_counts else None
            
            return {
                "post_id": post_id,
                "total_reactions": reactions.total_reactions,
                "most_common_reaction": most_common,
                "reactions_breakdown": reaction_counts,
                "unique_users": len(reactions.user_reactions),
                "percentage_breakdown": {
                    key: round((value / reactions.total_reactions * 100), 2) 
                    if reactions.total_reactions > 0 else 0
                    for key, value in reaction_counts.items()
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_reactions_list(self, post_id: str, reaction_type: Optional[ReactionType] = None) -> Dict[str, Any]:
        """الحصول على قائمة المستخدمين الذين أضافوا تفاعل معين"""
        try:
            if post_id not in self.reactions_data:
                return {"users": []}
            
            post_reactions = self._get_post_reactions(post_id)
            
            if reaction_type:
                users = [
                    {
                        "user_id": r.get("user_id"),
                        "reaction_type": r.get("reaction_type"),
                        "timestamp": r.get("timestamp")
                    }
                    for r in post_reactions.user_reactions
                    if r.get("reaction_type") == reaction_type.value
                ]
            else:
                users = [
                    {
                        "user_id": r.get("user_id"),
                        "reaction_type": r.get("reaction_type"),
                        "timestamp": r.get("timestamp")
                    }
                    for r in post_reactions.user_reactions
                ]
            
            return {
                "post_id": post_id,
                "reaction_type": reaction_type.value if reaction_type else "all",
                "users": users,
                "count": len(users)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

# ==================== Router ====================

def create_reactions_router(service: AdvancedReactionsService) -> APIRouter:
    """إنشاء جهاز التوجيه للتفاعلات المتقدمة"""
    router = APIRouter(prefix="/reactions", tags=["reactions"])
    
    @router.post("/{post_id}/add")
    async def add_reaction(post_id: str, data: dict = Body(...)):
        """إضافة تفاعل جديد"""
        user_id = data.get("user_id")
        reaction_type = data.get("reaction_type")
        
        if not user_id or not reaction_type:
            raise HTTPException(status_code=400, detail="user_id و reaction_type مطلوبان")
        
        try:
            reaction_enum = ReactionType(reaction_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"نوع التفاعل غير صحيح. الأنواع المتاحة: {', '.join([r.value for r in ReactionType])}"
            )
        
        return service.add_reaction(post_id, user_id, reaction_enum)
    
    @router.delete("/{post_id}/remove")
    async def remove_reaction(post_id: str, user_id: str):
        """إزالة تفاعل المستخدم"""
        return service.remove_reaction(post_id, user_id)
    
    @router.get("/{post_id}")
    async def get_reactions(post_id: str):
        """الحصول على جميع التفاعلات على منشور"""
        return service.get_post_reactions(post_id)
    
    @router.get("/{post_id}/user/{user_id}")
    async def get_user_reaction(post_id: str, user_id: str):
        """الحصول على تفاعل المستخدم على منشور"""
        reaction = service.get_user_reaction(post_id, user_id)
        if reaction is None:
            raise HTTPException(status_code=404, detail="لا يوجد تفاعل من هذا المستخدم")
        return reaction
    
    @router.get("/{post_id}/stats")
    async def get_stats(post_id: str):
        """الحصول على إحصائيات التفاعلات"""
        return service.get_reaction_stats(post_id)
    
    @router.get("/{post_id}/list")
    async def get_reactions_list(post_id: str, reaction_type: Optional[str] = None):
        """الحصول على قائمة المستخدمين الذين أضافوا تفاعل معين"""
        if reaction_type:
            try:
                reaction_enum = ReactionType(reaction_type)
            except ValueError:
                raise HTTPException(status_code=400, detail="نوع التفاعل غير صحيح")
            return service.get_reactions_list(post_id, reaction_enum)
        else:
            return service.get_reactions_list(post_id)
    
    return router
