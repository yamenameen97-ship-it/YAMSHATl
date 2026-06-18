"""
نظام الهدايا المتقدم للبث المباشر
يتضمن: إرسال الهدايا، عرض الأنيميشن، خصم العملات، وسجل الهدايا
"""

from fastapi import APIRouter, HTTPException, Body, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import json
import os
import uuid
import asyncio
import logging

logger = logging.getLogger(__name__)

# ==================== Models ====================

class GiftCategory(str, Enum):
    """فئات الهدايا"""
    BASIC = "basic"           # هدايا أساسية
    PREMIUM = "premium"       # هدايا متميزة
    SPECIAL = "special"       # هدايا خاصة
    SEASONAL = "seasonal"     # هدايا موسمية

class GiftDefinition(BaseModel):
    """تعريف الهدية"""
    id: int
    name: str
    emoji: str
    coins: int
    category: GiftCategory
    animation_type: str  # "float", "bounce", "spin", "explode"
    animation_duration: int  # بالميلي ثانية
    description: Optional[str] = None
    icon_url: Optional[str] = None
    color: Optional[str] = None  # لون الأنيميشن

class GiftSent(BaseModel):
    """نموذج الهدية المرسلة"""
    id: Optional[str] = None
    stream_id: str
    gift_id: int
    sender_id: str
    sender_name: Optional[str] = None
    sender_avatar: Optional[str] = None
    receiver_id: str  # معرف المضيف
    amount: int = 1
    total_coins: int
    timestamp: Optional[datetime] = None
    animation_triggered: bool = False

class GiftAnimation(BaseModel):
    """نموذج الأنيميشن للهدية"""
    gift_id: int
    animation_type: str
    duration: int
    emoji: str
    sender_name: str
    amount: int

class UserWallet(BaseModel):
    """محفظة المستخدم"""
    user_id: str
    balance: int = 0
    total_spent: int = 0
    total_earned: int = 0
    last_updated: Optional[datetime] = None

class GiftLog(BaseModel):
    """سجل الهدايا"""
    id: Optional[str] = None
    stream_id: str
    gifts_received: List[GiftSent] = []
    total_coins_earned: int = 0
    total_gifts_count: int = 0
    top_gift: Optional[Dict[str, Any]] = None
    top_sender: Optional[Dict[str, Any]] = None

# ==================== Service ====================

class AdvancedGiftsSystem:
    """نظام الهدايا المتقدم"""
    
    def __init__(self):
        self.gifts_file = "gifts_db.json"
        self.wallets_file = "wallets_db.json"
        self.logs_file = "gift_logs_db.json"
        
        # تحميل البيانات
        self.gifts_data = self._load_json(self.gifts_file)
        self.wallets_data = self._load_json(self.wallets_file)
        self.logs_data = self._load_json(self.logs_file)
        
        # تهيئة الهدايا الافتراضية
        self._initialize_default_gifts()
        
        # اتصالات WebSocket للبث المباشر
        self.stream_connections: Dict[str, List[WebSocket]] = {}
    
    def _load_json(self, filename: str) -> Dict[str, Any]:
        """تحميل ملف JSON"""
        if os.path.exists(filename):
            try:
                with open(filename, "r", encoding="utf-8") as f:
                    return json.load(f)
            except:
                return {}
        return {}
    
    def _save_json(self, filename: str, data: Dict[str, Any]) -> None:
        """حفظ ملف JSON"""
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def _initialize_default_gifts(self) -> None:
        """تهيئة الهدايا الافتراضية"""
        if not self.gifts_data:
            self.gifts_data = {
                "gifts": [
                    {
                        "id": 1,
                        "name": "وردة",
                        "emoji": "🌹",
                        "coins": 10,
                        "category": "basic",
                        "animation_type": "float",
                        "animation_duration": 2000,
                        "description": "هدية بسيطة وجميلة",
                        "color": "#FF69B4"
                    },
                    {
                        "id": 2,
                        "name": "قلب",
                        "emoji": "❤️",
                        "coins": 20,
                        "category": "basic",
                        "animation_type": "bounce",
                        "animation_duration": 2500,
                        "description": "قلب مليء بالحب",
                        "color": "#FF0000"
                    },
                    {
                        "id": 3,
                        "name": "نجمة",
                        "emoji": "⭐",
                        "coins": 30,
                        "category": "premium",
                        "animation_type": "spin",
                        "animation_duration": 3000,
                        "description": "نجمة براقة",
                        "color": "#FFD700"
                    },
                    {
                        "id": 4,
                        "name": "صاروخ",
                        "emoji": "🚀",
                        "coins": 50,
                        "category": "premium",
                        "animation_type": "explode",
                        "animation_duration": 3500,
                        "description": "صاروخ قوي",
                        "color": "#FF6347"
                    },
                    {
                        "id": 5,
                        "name": "تاج",
                        "emoji": "👑",
                        "coins": 100,
                        "category": "special",
                        "animation_type": "explode",
                        "animation_duration": 4000,
                        "description": "تاج ملكي",
                        "color": "#FFD700"
                    },
                    {
                        "id": 6,
                        "name": "ألعاب نارية",
                        "emoji": "🎆",
                        "coins": 150,
                        "category": "special",
                        "animation_type": "explode",
                        "animation_duration": 4500,
                        "description": "احتفال رائع",
                        "color": "#FF00FF"
                    }
                ]
            }
            self._save_json(self.gifts_file, self.gifts_data)
    
    def get_available_gifts(self) -> List[Dict[str, Any]]:
        """الحصول على قائمة الهدايا المتاحة"""
        return self.gifts_data.get("gifts", [])
    
    def get_gift_by_id(self, gift_id: int) -> Optional[Dict[str, Any]]:
        """الحصول على هدية بواسطة المعرف"""
        gifts = self.gifts_data.get("gifts", [])
        return next((g for g in gifts if g["id"] == gift_id), None)
    
    def get_user_wallet(self, user_id: str) -> UserWallet:
        """الحصول على محفظة المستخدم"""
        if user_id not in self.wallets_data:
            self.wallets_data[user_id] = {
                "user_id": user_id,
                "balance": 0,
                "total_spent": 0,
                "total_earned": 0,
                "last_updated": datetime.utcnow().isoformat()
            }
            self._save_json(self.wallets_file, self.wallets_data)
        
        return UserWallet(**self.wallets_data[user_id])
    
    def add_coins(self, user_id: str, amount: int) -> Dict[str, Any]:
        """إضافة عملات للمستخدم"""
        try:
            wallet = self.get_user_wallet(user_id)
            wallet.balance += amount
            wallet.total_earned += amount
            wallet.last_updated = datetime.utcnow()
            
            self.wallets_data[user_id] = {
                "user_id": user_id,
                "balance": wallet.balance,
                "total_spent": wallet.total_spent,
                "total_earned": wallet.total_earned,
                "last_updated": wallet.last_updated.isoformat()
            }
            self._save_json(self.wallets_file, self.wallets_data)
            
            return {
                "success": True,
                "message": f"تمت إضافة {amount} عملة",
                "wallet": {
                    "balance": wallet.balance,
                    "total_earned": wallet.total_earned
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def deduct_coins(self, user_id: str, amount: int) -> Dict[str, Any]:
        """خصم عملات من المستخدم"""
        try:
            wallet = self.get_user_wallet(user_id)
            
            if wallet.balance < amount:
                raise HTTPException(status_code=400, detail="رصيد غير كافي")
            
            wallet.balance -= amount
            wallet.total_spent += amount
            wallet.last_updated = datetime.utcnow()
            
            self.wallets_data[user_id] = {
                "user_id": user_id,
                "balance": wallet.balance,
                "total_spent": wallet.total_spent,
                "total_earned": wallet.total_earned,
                "last_updated": wallet.last_updated.isoformat()
            }
            self._save_json(self.wallets_file, self.wallets_data)
            
            return {
                "success": True,
                "message": f"تم خصم {amount} عملة",
                "wallet": {
                    "balance": wallet.balance,
                    "total_spent": wallet.total_spent
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def send_gift(
        self,
        stream_id: str,
        sender_id: str,
        sender_name: str,
        sender_avatar: Optional[str],
        receiver_id: str,
        gift_id: int,
        amount: int = 1
    ) -> Dict[str, Any]:
        """إرسال هدية"""
        try:
            # التحقق من الهدية
            gift = self.get_gift_by_id(gift_id)
            if not gift:
                raise HTTPException(status_code=404, detail="الهدية غير موجودة")
            
            # حساب التكلفة الإجمالية
            total_cost = gift["coins"] * amount
            
            # التحقق من الرصيد
            wallet = self.get_user_wallet(sender_id)
            if wallet.balance < total_cost:
                raise HTTPException(status_code=400, detail="رصيد غير كافي")
            
            # خصم العملات من المرسل
            deduct_result = self.deduct_coins(sender_id, total_cost)
            if not deduct_result.get("success"):
                raise HTTPException(status_code=400, detail=deduct_result.get("error"))
            
            # إضافة الأرباح للمضيف
            self.add_coins(receiver_id, total_cost)
            
            # إنشاء سجل الهدية
            gift_sent = {
                "id": str(uuid.uuid4()),
                "stream_id": stream_id,
                "gift_id": gift_id,
                "sender_id": sender_id,
                "sender_name": sender_name,
                "sender_avatar": sender_avatar,
                "receiver_id": receiver_id,
                "amount": amount,
                "total_coins": total_cost,
                "timestamp": datetime.utcnow().isoformat(),
                "animation_triggered": False
            }
            
            # حفظ الهدية في السجل
            if stream_id not in self.logs_data:
                self.logs_data[stream_id] = {
                    "stream_id": stream_id,
                    "gifts_received": [],
                    "total_coins_earned": 0,
                    "total_gifts_count": 0
                }
            
            self.logs_data[stream_id]["gifts_received"].append(gift_sent)
            self.logs_data[stream_id]["total_coins_earned"] += total_cost
            self.logs_data[stream_id]["total_gifts_count"] += amount
            
            # تحديث أعلى هدية
            if not self.logs_data[stream_id].get("top_gift"):
                self.logs_data[stream_id]["top_gift"] = {
                    "gift_id": gift_id,
                    "name": gift["name"],
                    "emoji": gift["emoji"],
                    "count": amount
                }
            else:
                if self.logs_data[stream_id]["top_gift"]["gift_id"] == gift_id:
                    self.logs_data[stream_id]["top_gift"]["count"] += amount
                else:
                    if amount > self.logs_data[stream_id]["top_gift"]["count"]:
                        self.logs_data[stream_id]["top_gift"] = {
                            "gift_id": gift_id,
                            "name": gift["name"],
                            "emoji": gift["emoji"],
                            "count": amount
                        }
            
            # تحديث أعلى مرسل
            if not self.logs_data[stream_id].get("top_sender"):
                self.logs_data[stream_id]["top_sender"] = {
                    "sender_id": sender_id,
                    "sender_name": sender_name,
                    "total_spent": total_cost
                }
            else:
                if self.logs_data[stream_id]["top_sender"]["sender_id"] == sender_id:
                    self.logs_data[stream_id]["top_sender"]["total_spent"] += total_cost
                else:
                    if total_cost > self.logs_data[stream_id]["top_sender"]["total_spent"]:
                        self.logs_data[stream_id]["top_sender"] = {
                            "sender_id": sender_id,
                            "sender_name": sender_name,
                            "total_spent": total_cost
                        }
            
            self._save_json(self.logs_file, self.logs_data)
            
            # بث الأنيميشن
            animation = GiftAnimation(
                gift_id=gift_id,
                animation_type=gift["animation_type"],
                duration=gift["animation_duration"],
                emoji=gift["emoji"],
                sender_name=sender_name,
                amount=amount
            )
            
            await self._broadcast_animation(stream_id, animation)
            
            # تحديث حالة الأنيميشن
            gift_sent["animation_triggered"] = True
            self.logs_data[stream_id]["gifts_received"][-1] = gift_sent
            self._save_json(self.logs_file, self.logs_data)
            
            return {
                "success": True,
                "message": "تم إرسال الهدية بنجاح",
                "gift": gift_sent,
                "animation": animation.dict(),
                "sender_wallet": {
                    "balance": wallet.balance - total_cost
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error sending gift: {e}")
            return {"success": False, "error": str(e)}
    
    def get_stream_gift_log(self, stream_id: str) -> Dict[str, Any]:
        """الحصول على سجل الهدايا للبث"""
        try:
            if stream_id not in self.logs_data:
                return {
                    "stream_id": stream_id,
                    "gifts_received": [],
                    "total_coins_earned": 0,
                    "total_gifts_count": 0,
                    "top_gift": None,
                    "top_sender": None
                }
            
            log = self.logs_data[stream_id]
            return {
                "stream_id": stream_id,
                "gifts_received": log.get("gifts_received", []),
                "total_coins_earned": log.get("total_coins_earned", 0),
                "total_gifts_count": log.get("total_gifts_count", 0),
                "top_gift": log.get("top_gift"),
                "top_sender": log.get("top_sender")
            }
        except Exception as e:
            logger.error(f"Error getting gift log: {e}")
            return {"success": False, "error": str(e)}
    
    async def _broadcast_animation(self, stream_id: str, animation: GiftAnimation) -> None:
        """بث الأنيميشن إلى جميع المتصلين"""
        if stream_id in self.stream_connections:
            disconnected = []
            for ws in self.stream_connections[stream_id]:
                try:
                    await ws.send_json({
                        "type": "gift_animation",
                        "data": animation.dict()
                    })
                except Exception as e:
                    logger.error(f"Error broadcasting animation: {e}")
                    disconnected.append(ws)
            
            # إزالة الاتصالات المقطوعة
            for ws in disconnected:
                self.stream_connections[stream_id].remove(ws)

# ==================== Router ====================

def create_gifts_router(service: AdvancedGiftsSystem) -> APIRouter:
    """إنشاء جهاز التوجيه للهدايا"""
    router = APIRouter(prefix="/gifts", tags=["gifts"])
    
    @router.get("/available")
    async def get_available_gifts():
        """الحصول على قائمة الهدايا المتاحة"""
        return {
            "gifts": service.get_available_gifts()
        }
    
    @router.get("/{gift_id}")
    async def get_gift(gift_id: int):
        """الحصول على تفاصيل هدية محددة"""
        gift = service.get_gift_by_id(gift_id)
        if not gift:
            raise HTTPException(status_code=404, detail="الهدية غير موجودة")
        return gift
    
    @router.get("/wallet/{user_id}")
    async def get_wallet(user_id: str):
        """الحصول على محفظة المستخدم"""
        wallet = service.get_user_wallet(user_id)
        return {
            "user_id": user_id,
            "balance": wallet.balance,
            "total_spent": wallet.total_spent,
            "total_earned": wallet.total_earned
        }
    
    @router.post("/wallet/{user_id}/add")
    async def add_coins(user_id: str, data: dict = Body(...)):
        """إضافة عملات"""
        amount = data.get("amount", 0)
        if amount <= 0:
            raise HTTPException(status_code=400, detail="المبلغ يجب أن يكون أكبر من صفر")
        return service.add_coins(user_id, amount)
    
    @router.post("/{stream_id}/send")
    async def send_gift(stream_id: str, data: dict = Body(...)):
        """إرسال هدية"""
        sender_id = data.get("sender_id")
        sender_name = data.get("sender_name", "مستخدم")
        sender_avatar = data.get("sender_avatar")
        receiver_id = data.get("receiver_id")
        gift_id = data.get("gift_id")
        amount = data.get("amount", 1)
        
        if not all([sender_id, receiver_id, gift_id]):
            raise HTTPException(status_code=400, detail="البيانات المطلوبة ناقصة")
        
        return await service.send_gift(
            stream_id, sender_id, sender_name, sender_avatar,
            receiver_id, gift_id, amount
        )
    
    @router.get("/{stream_id}/log")
    async def get_gift_log(stream_id: str):
        """الحصول على سجل الهدايا للبث"""
        return service.get_stream_gift_log(stream_id)
    
    return router
