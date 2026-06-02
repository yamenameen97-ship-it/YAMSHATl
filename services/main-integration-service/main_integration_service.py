"""خدمة التكامل الرئيسية - Main Integration Service
تربط جميع الخدمات الأخرى معاً وتوفر:
- API موحد للتطبيقات
- تنسيق بين الخدمات
- إدارة جلسات المستخدمين
- معالجة الأخطاء والتسجيل
- قياس الأداء
"""

from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import json
from datetime import datetime
from typing import Optional, Dict, Any
import logging
import uuid

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Yamshat Main Integration Service",
    description="خدمة التكامل الرئيسية لمنصة Yamshat",
    version="2.0.0"
)

# إضافة CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ إعدادات الخدمات ============

SERVICES = {
    "call_service": "http://localhost:8005",
    "live_service": "http://localhost:8006",
    "group_service": "http://localhost:8007",
    "chat_service": "http://localhost:8008",
    "user_profile_service": "http://localhost:8009",
    "reels_stories_service": "http://localhost:8010",
    "admin_dashboard_service": "http://localhost:8011",
    "notifications_search_service": "http://localhost:8012",
    "billing_service": "http://localhost:8013",
    "identity_service": "http://localhost:8014",
    "discovery_ai_service": "http://localhost:8015",
    "i18n_service": "http://localhost:8016",
}

# ============ مدير الجلسات ============

class SessionManager:
    """مدير جلسات المستخدمين"""
    
    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}
    
    def create_session(self, user_id: str, user_name: str) -> str:
        """إنشاء جلسة جديدة"""
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "user_id": user_id,
            "user_name": user_name,
            "created_at": datetime.utcnow().isoformat(),
            "last_activity": datetime.utcnow().isoformat()
        }
        logger.info(f"✅ Session created: {session_id} for user {user_id}")
        return session_id
    
    def get_session(self, session_id: str) -> Optional[Dict]:
        """الحصول على جلسة"""
        return self.sessions.get(session_id)
    
    def update_activity(self, session_id: str) -> bool:
        """تحديث آخر نشاط"""
        if session_id in self.sessions:
            self.sessions[session_id]["last_activity"] = datetime.utcnow().isoformat()
            return True
        return False
    
    def destroy_session(self, session_id: str) -> bool:
        """حذف جلسة"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.info(f"✅ Session destroyed: {session_id}")
            return True
        return False


session_manager = SessionManager()


# ============ مدير الخدمات ============

class ServiceManager:
    """مدير الخدمات"""
    
    async def call_service(
        self,
        service_name: str,
        endpoint: str,
        method: str = "GET",
        params: Optional[Dict] = None,
        data: Optional[Dict] = None
    ) -> Dict:
        """استدعاء خدمة"""
        if service_name not in SERVICES:
            raise HTTPException(status_code=400, detail="الخدمة غير موجودة")
        
        base_url = SERVICES[service_name]
        url = f"{base_url}{endpoint}"
        
        try:
            async with httpx.AsyncClient() as client:
                if method == "GET":
                    response = await client.get(url, params=params)
                elif method == "POST":
                    response = await client.post(url, params=params, json=data)
                elif method == "PUT":
                    response = await client.put(url, params=params, json=data)
                elif method == "DELETE":
                    response = await client.delete(url, params=params)
                else:
                    raise HTTPException(status_code=400, detail="طريقة HTTP غير مدعومة")
                
                if response.status_code == 200:
                    return response.json()
                else:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"خطأ من الخدمة: {response.text}"
                    )
        except Exception as e:
            logger.error(f"❌ Error calling service {service_name}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))


service_manager = ServiceManager()


# ============ المسارات (Routes) ============

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة الرئيسية"""
    services_status = {}
    
    for service_name, base_url in SERVICES.items():
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{base_url}/health", timeout=5)
                services_status[service_name] = {
                    "status": "healthy" if response.status_code == 200 else "unhealthy",
                    "url": base_url
                }
        except Exception as e:
            services_status[service_name] = {
                "status": "offline",
                "url": base_url,
                "error": str(e)
            }
    
    return {
        "status": "healthy",
        "service": "main-integration-service",
        "version": "2.0.0",
        "services": services_status,
        "active_sessions": len(session_manager.sessions)
    }


# ============ جلسات المستخدمين ============

@app.post("/auth/login")
async def login(user_id: str = Query(...), user_name: str = Query(...)):
    """تسجيل الدخول"""
    try:
        session_id = session_manager.create_session(user_id, user_name)
        return {
            "success": True,
            "session_id": session_id,
            "user_id": user_id,
            "user_name": user_name
        }
    except Exception as e:
        logger.error(f"❌ Error logging in: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/auth/logout")
async def logout(session_id: str = Query(...)):
    """تسجيل الخروج"""
    try:
        if session_manager.destroy_session(session_id):
            return {"success": True, "message": "تم تسجيل الخروج"}
        else:
            raise HTTPException(status_code=404, detail="الجلسة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error logging out: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/auth/session")
async def get_session(session_id: str = Query(...)):
    """الحصول على بيانات الجلسة"""
    try:
        session = session_manager.get_session(session_id)
        if session:
            session_manager.update_activity(session_id)
            return {
                "success": True,
                "session": session
            }
        else:
            raise HTTPException(status_code=404, detail="الجلسة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error getting session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ المكالمات ============

@app.post("/calls/initiate")
async def initiate_call(
    caller_id: str = Query(...),
    callee_id: str = Query(...),
    call_type: str = Query("audio")
):
    """بدء مكالمة"""
    try:
        result = await service_manager.call_service(
            "call_service",
            "/calls",
            "POST",
            data={
                "caller_id": caller_id,
                "callee_id": callee_id,
                "call_type": call_type
            }
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error initiating call: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/calls/{call_id}")
async def get_call(call_id: str):
    """الحصول على بيانات المكالمة"""
    try:
        result = await service_manager.call_service(
            "call_service",
            f"/calls/{call_id}",
            "GET"
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error getting call: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ البث المباشر ============

@app.post("/live/create")
async def create_live_stream(
    creator_id: str = Query(...),
    title: str = Query(...),
    description: str = Query("")
):
    """إنشاء بث مباشر"""
    try:
        result = await service_manager.call_service(
            "live_service",
            "/streams",
            "POST",
            data={
                "creator_id": creator_id,
                "title": title,
                "description": description
            }
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error creating live stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/live/{stream_id}")
async def get_live_stream(stream_id: str):
    """الحصول على بيانات البث المباشر"""
    try:
        result = await service_manager.call_service(
            "live_service",
            f"/streams/{stream_id}",
            "GET"
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error getting live stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ المجموعات ============

@app.post("/groups/create")
async def create_group(
    creator_id: str = Query(...),
    group_name: str = Query(...),
    description: str = Query("")
):
    """إنشاء مجموعة"""
    try:
        result = await service_manager.call_service(
            "group_service",
            "/groups",
            "POST",
            data={
                "creator_id": creator_id,
                "group_name": group_name,
                "description": description
            }
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error creating group: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/groups/{group_id}")
async def get_group(group_id: str):
    """الحصول على بيانات المجموعة"""
    try:
        result = await service_manager.call_service(
            "group_service",
            f"/groups/{group_id}",
            "GET"
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error getting group: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ الملفات الشخصية ============

@app.post("/profiles/create")
async def create_profile(
    user_id: str = Query(...),
    user_name: str = Query(...),
    email: str = Query(...),
    avatar_url: str = Query(""),
    bio: str = Query("")
):
    """إنشاء ملف شخصي"""
    try:
        result = await service_manager.call_service(
            "user_profile_service",
            "/profiles",
            "POST",
            params={
                "user_id": user_id,
                "user_name": user_name,
                "email": email,
                "avatar_url": avatar_url,
                "bio": bio
            }
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error creating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/profiles/{user_id}")
async def get_profile(user_id: str):
    """الحصول على الملف الشخصي"""
    try:
        result = await service_manager.call_service(
            "user_profile_service",
            f"/profiles/{user_id}",
            "GET"
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error getting profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ الريلز والقصص ============

@app.post("/reels/create")
async def create_reel(
    creator_id: str = Query(...),
    title: str = Query(...),
    video_url: str = Query(...)
):
    """إنشاء ريل"""
    try:
        result = await service_manager.call_service(
            "reels_stories_service",
            "/reels",
            "POST",
            params={
                "creator_id": creator_id,
                "title": title,
                "video_url": video_url
            }
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error creating reel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reels/{reel_id}")
async def get_reel(reel_id: str):
    """الحصول على الريل"""
    try:
        result = await service_manager.call_service(
            "reels_stories_service",
            f"/reels/{reel_id}",
            "GET"
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error getting reel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ التعدد اللغوي (i18n) ============

@app.post("/i18n/translate")
async def translate_text_route(text: str = Query(...), target_lang: str = Query(...), source_lang: str = Query("auto")):
    """ترجمة نص"""
    try:
        result = await service_manager.call_service(
            "i18n_service",
            "/translate",
            "POST",
            data={"text": text, "target_lang": target_lang, "source_lang": source_lang}
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error translating text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/i18n/languages")
async def get_supported_languages_route():
    """الحصول على اللغات المدعومة"""
    try:
        result = await service_manager.call_service(
            "i18n_service",
            "/languages",
            "GET"
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error getting supported languages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/i18n/phrases/{lang}")
async def get_language_phrases_route(lang: str):
    """الحصول على عبارات اللغة"""
    try:
        result = await service_manager.call_service(
            "i18n_service",
            f"/phrases/{lang}",
            "GET"
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error getting language phrases: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ الذكاء الاصطناعي والتوصية ============

@app.post("/ai/moderate")
async def ai_moderate_content_route(content: dict):
    """تعديل المحتوى باستخدام الذكاء الاصطناعي"""
    try:
        result = await service_manager.call_service(
            "discovery_ai_service",
            "/moderate",
            "POST",
            data=content
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error moderating content with AI: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/recommend/{user_id}")
async def ai_recommend_content_route(user_id: int, content_type: str = Query(...), limit: int = Query(10)):
    """الحصول على توصيات المحتوى باستخدام الذكاء الاصطناعي"""
    try:
        result = await service_manager.call_service(
            "discovery_ai_service",
            f"/recommend",
            "POST",
            data={"user_id": user_id, "content_type": content_type, "limit": limit}
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error getting AI recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/sentiment")
async def ai_analyze_sentiment_route(content: dict):
    """تحليل المشاعر باستخدام الذكاء الاصطناعي"""
    try:
        result = await service_manager.call_service(
            "discovery_ai_service",
            "/sentiment",
            "POST",
            data=content
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error analyzing sentiment with AI: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ الهوية والأمان ============

@app.post("/identity/{user_id}/2fa/enable")
async def enable_2fa_route(user_id: int):
    """تفعيل المصادقة الثنائية"""
    try:
        result = await service_manager.call_service(
            "identity_service",
            f"/identity/{user_id}/2fa/enable",
            "POST"
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error enabling 2FA: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/identity/{user_id}/2fa/verify")
async def verify_2fa_route(user_id: int, otp_code: str = Query(...)):
    """التحقق من المصادقة الثنائية"""
    try:
        result = await service_manager.call_service(
            "identity_service",
            f"/identity/{user_id}/2fa/verify",
            "POST",
            data={"otp_code": otp_code}
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error verifying 2FA: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/identity/{user_id}/2fa/disable")
async def disable_2fa_route(user_id: int, otp_code: str = Query(...)):
    """تعطيل المصادقة الثنائية"""
    try:
        result = await service_manager.call_service(
            "identity_service",
            f"/identity/{user_id}/2fa/disable",
            "POST",
            data={"otp_code": otp_code}
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error disabling 2FA: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/identity/{user_id}/recovery/generate")
async def generate_recovery_codes_route(user_id: int):
    """توليد رموز الاسترداد"""
    try:
        result = await service_manager.call_service(
            "identity_service",
            f"/identity/{user_id}/recovery/generate",
            "POST"
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error generating recovery codes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/identity/{user_id}/recovery/use")
async def use_recovery_code_route(user_id: int, recovery_code: str = Query(...)):
    """استخدام رمز الاسترداد"""
    try:
        result = await service_manager.call_service(
            "identity_service",
            f"/identity/{user_id}/recovery/use",
            "POST",
            data={"recovery_code": recovery_code}
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error using recovery code: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ النظام المالي ============

@app.post("/billing/wallet/{user_id}/deposit")
async def deposit_to_wallet_route(user_id: int, update: dict):
    """إيداع في المحفظة"""
    try:
        result = await service_manager.call_service(
            "billing_service",
            f"/wallet/{user_id}/deposit",
            "POST",
            data=update
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error depositing to wallet: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/billing/wallet/{user_id}/withdraw")
async def withdraw_from_wallet_route(user_id: int, update: dict):
    """سحب من المحفظة"""
    try:
        result = await service_manager.call_service(
            "billing_service",
            f"/wallet/{user_id}/withdraw",
            "POST",
            data=update
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error withdrawing from wallet: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/billing/wallet/{user_id}")
async def get_wallet_balance_route(user_id: int):
    """الحصول على رصيد المحفظة"""
    try:
        result = await service_manager.call_service(
            "billing_service",
            f"/wallet/{user_id}",
            "GET"
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error getting wallet balance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ الإشعارات ============

@app.post("/notifications/create")
async def create_notification(
    user_id: str = Query(...),
    notification_type: str = Query(...),
    content: str = Query(...)
):
    """إنشاء إشعار"""
    try:
        result = await service_manager.call_service(
            "notifications_search_service",
            "/notifications",
            "POST",
            params={
                "user_id": user_id,
                "notification_type": notification_type,
                "content": content
            }
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error creating notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/notifications/{user_id}")
async def get_notifications(user_id: str, limit: int = Query(50)):
    """الحصول على الإشعارات"""
    try:
        result = await service_manager.call_service(
            "notifications_search_service",
            "/notifications",
            "GET",
            params={
                "user_id": user_id,
                "limit": limit
            }
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error getting notifications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ البحث ============

@app.get("/search")
async def search(
    user_id: str = Query(...),
    query: str = Query(...),
    search_type: str = Query("global"),
    limit: int = Query(50)
):
    """البحث"""
    try:
        result = await service_manager.call_service(
            "notifications_search_service",
            "/search",
            "GET",
            params={
                "user_id": user_id,
                "query": query,
                "search_type": search_type,
                "limit": limit
            }
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error searching: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ الإدارة ============

@app.post("/admin/reports")
async def create_report(
    reporter_id: str = Query(...),
    reported_user_id: str = Query(...),
    reason: str = Query(...)
):
    """إنشاء إبلاغ"""
    try:
        result = await service_manager.call_service(
            "admin_dashboard_service",
            "/reports",
            "POST",
            params={
                "reporter_id": reporter_id,
                "reported_user_id": reported_user_id,
                "reason": reason
            }
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error creating report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/admin/stats/platform")
async def get_platform_stats():
    """الحصول على إحصائيات المنصة"""
    try:
        result = await service_manager.call_service(
            "admin_dashboard_service",
            "/stats/platform",
            "GET"
        )
        return result
    except Exception as e:
        logger.error(f"❌ Error getting platform stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ معلومات النظام ============

@app.get("/system/info")
async def get_system_info():
    """الحصول على معلومات النظام"""
    return {
        "platform": "Yamshat",
        "version": "2.0.0",
        "services": list(SERVICES.keys()),
        "active_sessions": len(session_manager.sessions),
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/system/services")
async def get_services_status():
    """الحصول على حالة الخدمات"""
    services_status = {}
    
    for service_name, base_url in SERVICES.items():
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{base_url}/health", timeout=5)
                services_status[service_name] = {
                    "status": "online" if response.status_code == 200 else "offline",
                    "url": base_url
                }
        except Exception as e:
            services_status[service_name] = {
                "status": "offline",
                "url": base_url,
                "error": str(e)
            }
    
    return {
        "success": True,
        "services": services_status
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
