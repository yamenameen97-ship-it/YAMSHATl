"""
Yamshat Main Application - Fixed Entry Point
يحل مشكلة CORS + 503 على كابتشا /api/auth/captcha
"""
import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings

logger = logging.getLogger("yamshat.main")
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Yamshat API",
    version="1.0.0",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url=None,
)

# ============================================================
# 🔧 إصلاح CORS الحاسم
# المشكلة: yamshat8.onrender.com -> yamshat-1ya4.onrender.com كانت تُرفض
# الحل: استخدام cors_origin_regex الذي يغطي كل *.onrender.com
# ============================================================
_cors_regex = settings.cors_origin_regex or r"^https://(?:[a-zA-Z0-9-]+\.)?onrender\.com$"
_cors_origins = list(set(settings.cors_origins))

logger.info(f"[CORS] origin_regex = {_cors_regex}")
logger.info(f"[CORS] explicit origins = {_cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=_cors_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-CSRF-Token", "X-Request-ID"],
    max_age=600,
)


# ============================================================
# 🛡️ معالج أخطاء يضمن وصول CORS headers حتى عند 500/503
# هذا يحل الخطأ الذي يظهر للمستخدم كـ "CORS blocked"
# بينما السبب الحقيقي هو 503 (cold start)
# ============================================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.url.path}: {exc}")
    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "path": request.url.path},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin",
        },
    )


# ============================================================
# 🔥 Health & Warmup endpoints (لحل cold-start على Render Free)
# ============================================================
@app.get("/health")
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "yamshat-backend"}


@app.get("/api/warmup")
async def warmup():
    """نقطة استيقاظ سريعة بدون أي تبعيات DB."""
    return {"warm": True}


# ============================================================
# 📦 تحميل الراوترات الكاملة (auth/captcha/users/posts/...)
# ============================================================
def _include(router_path: str, prefix: str = ""):
    try:
        module_name, attr = router_path.rsplit(".", 1)
        import importlib
        mod = importlib.import_module(module_name)
        router = getattr(mod, attr)
        app.include_router(router, prefix=prefix)
        logger.info(f"[router] mounted {router_path} at {prefix}")
    except Exception as e:
        logger.warning(f"[router] failed {router_path}: {e}")


# الراوتر الأهم - auth/captcha
_include("app.api.routes.auth.router", prefix="/api/auth")
_include("app.api.routes.users.router", prefix="/api/users")
_include("app.api.routes.posts.router", prefix="/api/posts")
_include("app.api.routes.comments.router", prefix="/api/comments")
_include("app.api.routes.notifications.router", prefix="/api/notifications")
_include("app.api.routes.search.router", prefix="/api/search")
_include("app.api.routes.upload.router", prefix="/api/upload")
_include("app.api.routes.admin.router", prefix="/api/admin")
_include("app.api.routes.follow.router", prefix="/api/follow")
_include("app.api.routes.chat.router", prefix="/api/chat")
_include("app.api.routes.stories.router", prefix="/api/stories")
_include("app.api.routes.reels.router", prefix="/api/reels")
_include("app.api.routes.live.router", prefix="/api/live")
_include("app.api.routes.groups.router", prefix="/api/groups")
_include("app.api.routes.inbox.router", prefix="/api/inbox")
_include("app.api.routes.recommendations.router", prefix="/api/recommendations")
_include("app.api.routes.analytics.router", prefix="/api/analytics")

# 🎮 Engagement & Gamification (المهام، المستويات، الشارات، عجلة الحظ، الإحالة، المتجر)
_include("app.api.routes.engagement.router", prefix="/api/engagement")
# 🔊 Voice Rooms - الغرف الصوتية الجماعية
_include("app.api.routes.voice_rooms.router", prefix="/api/voice")


@app.on_event("startup")
async def on_startup():
    logger.info("🚀 Yamshat backend started")
    logger.info(f"   DEBUG={settings.DEBUG}  CAPTCHA={settings.CAPTCHA_ENABLED}")
