"""
ملف التكامل الشامل للأنظمة المتقدمة
يدمج نظام التفاعلات ونظام الهدايا مع التطبيق الرئيسي
"""

from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
import logging

# إضافة مسارات الخدمات
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'post-service'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'live-service'))

from advanced_reactions_service import AdvancedReactionsService, create_reactions_router
from advanced_gifts_system import AdvancedGiftsSystem, create_gifts_router

logger = logging.getLogger(__name__)

class AdvancedFeaturesIntegration:
    """فئة التكامل الشامل للأنظمة المتقدمة"""
    
    def __init__(self, app: FastAPI):
        self.app = app
        self.reactions_service = AdvancedReactionsService()
        self.gifts_service = AdvancedGiftsSystem()
        
        # إضافة CORS
        self._setup_cors()
        
        # تسجيل الموجهات
        self._register_routes()
        
        # إعداد WebSocket
        self._setup_websocket()
        
        logger.info("تم تهيئة الأنظمة المتقدمة بنجاح")
    
    def _setup_cors(self):
        """إعداد CORS للسماح بالطلبات من الواجهة الأمامية"""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    
    def _register_routes(self):
        """تسجيل جميع الموجهات"""
        # موجهات التفاعلات
        reactions_router = create_reactions_router(self.reactions_service)
        self.app.include_router(reactions_router, prefix="/api")
        
        # موجهات الهدايا
        gifts_router = create_gifts_router(self.gifts_service)
        self.app.include_router(gifts_router, prefix="/api")
        
        # موجهات إضافية للتكامل
        self._register_integration_routes()
        
        logger.info("تم تسجيل جميع الموجهات")
    
    def _register_integration_routes(self):
        """تسجيل موجهات التكامل الإضافية"""
        router = APIRouter(prefix="/api/integration", tags=["integration"])
        
        @router.get("/status")
        async def get_status():
            """الحصول على حالة الأنظمة"""
            return {
                "status": "active",
                "systems": {
                    "reactions": "active",
                    "gifts": "active"
                },
                "timestamp": str(__import__('datetime').datetime.utcnow())
            }
        
        @router.get("/stats")
        async def get_overall_stats():
            """الحصول على إحصائيات عامة"""
            return {
                "reactions_service": {
                    "total_posts": len(self.reactions_service.reactions_data),
                    "total_reactions": sum(
                        sum(v.values()) if isinstance(v, dict) else 0 
                        for v in self.reactions_service.reactions_data.values()
                    )
                },
                "gifts_service": {
                    "total_streams": len(self.gifts_service.logs_data),
                    "total_wallets": len(self.gifts_service.wallets_data),
                    "total_coins_in_system": sum(
                        w.get("balance", 0) + w.get("total_earned", 0)
                        for w in self.gifts_service.wallets_data.values()
                    )
                }
            }
        
        @router.post("/user/{user_id}/initialize")
        async def initialize_user(user_id: str):
            """تهيئة محفظة المستخدم الجديد"""
            try:
                wallet = self.gifts_service.get_user_wallet(user_id)
                return {
                    "success": True,
                    "message": "تم تهيئة المستخدم",
                    "wallet": {
                        "user_id": user_id,
                        "balance": wallet.balance,
                        "total_earned": wallet.total_earned
                    }
                }
            except Exception as e:
                logger.error(f"Error initializing user: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @router.get("/user/{user_id}/summary")
        async def get_user_summary(user_id: str):
            """الحصول على ملخص المستخدم"""
            try:
                wallet = self.gifts_service.get_user_wallet(user_id)
                return {
                    "user_id": user_id,
                    "wallet": {
                        "balance": wallet.balance,
                        "total_spent": wallet.total_spent,
                        "total_earned": wallet.total_earned
                    },
                    "timestamp": str(__import__('datetime').datetime.utcnow())
                }
            except Exception as e:
                logger.error(f"Error getting user summary: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        self.app.include_router(router)
    
    def _setup_websocket(self):
        """إعداد WebSocket للبث المباشر"""
        @self.app.websocket("/ws/stream/{stream_id}")
        async def websocket_endpoint(websocket: WebSocket, stream_id: str):
            await websocket.accept()
            
            # إضافة الاتصال إلى قائمة الاتصالات
            if stream_id not in self.gifts_service.stream_connections:
                self.gifts_service.stream_connections[stream_id] = []
            
            self.gifts_service.stream_connections[stream_id].append(websocket)
            
            logger.info(f"عميل جديد متصل بالبث {stream_id}")
            
            try:
                while True:
                    data = await websocket.receive_json()
                    
                    # معالجة أنواع الرسائل المختلفة
                    if data.get("type") == "gift_animation":
                        # بث الأنيميشن إلى جميع المتصلين
                        await self._broadcast_to_stream(
                            stream_id, 
                            {
                                "type": "gift_animation",
                                "data": data.get("data")
                            },
                            exclude_sender=websocket
                        )
                    
                    elif data.get("type") == "ping":
                        # الرد على ping
                        await websocket.send_json({"type": "pong"})
                    
                    elif data.get("type") == "stream_stats":
                        # إرسال إحصائيات البث
                        stats = self.gifts_service.get_stream_gift_log(stream_id)
                        await websocket.send_json({
                            "type": "stream_stats",
                            "data": stats
                        })
            
            except WebSocketDisconnect:
                logger.info(f"عميل قطع الاتصال من البث {stream_id}")
                if stream_id in self.gifts_service.stream_connections:
                    self.gifts_service.stream_connections[stream_id].remove(websocket)
            
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                if stream_id in self.gifts_service.stream_connections:
                    if websocket in self.gifts_service.stream_connections[stream_id]:
                        self.gifts_service.stream_connections[stream_id].remove(websocket)
    
    async def _broadcast_to_stream(self, stream_id: str, message: dict, exclude_sender=None):
        """بث رسالة إلى جميع المتصلين بالبث"""
        if stream_id in self.gifts_service.stream_connections:
            disconnected = []
            for ws in self.gifts_service.stream_connections[stream_id]:
                if exclude_sender and ws == exclude_sender:
                    continue
                
                try:
                    await ws.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting message: {e}")
                    disconnected.append(ws)
            
            # إزالة الاتصالات المقطوعة
            for ws in disconnected:
                self.gifts_service.stream_connections[stream_id].remove(ws)

def setup_advanced_features(app: FastAPI) -> AdvancedFeaturesIntegration:
    """دالة مساعدة لإعداد الأنظمة المتقدمة"""
    return AdvancedFeaturesIntegration(app)

# ==================== مثال على الاستخدام ====================

if __name__ == "__main__":
    from fastapi import FastAPI
    import uvicorn
    
    # إنشاء تطبيق FastAPI
    app = FastAPI(
        title="Yam-Shat Advanced Features",
        description="نظام متقدم للتفاعلات والهدايا",
        version="1.0.0"
    )
    
    # إعداد الأنظمة المتقدمة
    integration = setup_advanced_features(app)
    
    # تشغيل الخادم
    uvicorn.run(app, host="0.0.0.0", port=8000)
