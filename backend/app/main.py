"""
Yamshat Main Application - Fixed Entry Point
يحل مشكلة CORS + 503 + 404 على كابتشا /api/auth/captcha
"""
import os
import base64
import hashlib
import hmac
import json
import logging
import random
import secrets
import time
import traceback
from datetime import datetime, timedelta, timezone

from pathlib import Path

import socketio
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

from app.core.config import settings

logger = logging.getLogger("yamshat.main")
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Yamshat API",
    version="1.0.1",
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
# 📁 خدمة مجلد /uploads كملفات ثابتة
# إصلاح أخطاء 404 على /uploads/...logo192.png وصور أخرى
# نجرب مسارين: project-root/uploads و backend/uploads (fallback).
# ============================================================
_BACKEND_ROOT = Path(__file__).resolve().parents[1]   # .../backend
_PROJECT_ROOT = _BACKEND_ROOT.parent                  # .../
_UPLOAD_DIRS = [_PROJECT_ROOT / "uploads", _BACKEND_ROOT / "uploads"]
for _d in _UPLOAD_DIRS:
    try:
        _d.mkdir(parents=True, exist_ok=True)
    except Exception as _exc:  # noqa: BLE001
        logger.warning(f"[uploads] cannot create {_d}: {_exc}")

_PRIMARY_UPLOAD_DIR = _UPLOAD_DIRS[0]
try:
    app.mount("/uploads", StaticFiles(directory=str(_PRIMARY_UPLOAD_DIR), check_dir=False), name="uploads")
    logger.info(f"[uploads] ✅ mounted /uploads -> {_PRIMARY_UPLOAD_DIR}")
except Exception as _exc:  # noqa: BLE001
    logger.error(f"[uploads] failed to mount StaticFiles: {_exc}")

# Fallback handler: يجرب كل المجلدات + يخدم شعار افتراضي بدل 404
_DEFAULT_LOGO_CANDIDATES = [
    _PROJECT_ROOT / "frontend" / "public" / "logo192.png",
    _PROJECT_ROOT / "frontend" / "public" / "icons" / "icon-192.png",
]


@app.get("/uploads/{path:path}")
async def uploads_fallback(path: str):
    """
    fallback لأي ملف تحت /uploads:
    1. تجربة مجلدي uploads (project-root + backend).
    2. إذا كان المطلوب logo192/icon ، نعيد شعار افتراضي.
    3. خلاف ذلك: PNG شفاف 1×1 بدل 404 (يوقف فيضان خطأ الكونسول).
    """
    safe_name = path.lstrip("/")
    for d in _UPLOAD_DIRS:
        candidate = d / safe_name
        try:
            if candidate.is_file() and candidate.resolve().is_relative_to(d.resolve()):
                return FileResponse(str(candidate))
        except Exception:
            pass

    # فولباك خاص بالشعار
    lower = safe_name.lower()
    if "logo" in lower or "icon" in lower or lower.endswith((".png", ".jpg", ".jpeg", ".webp")):
        for logo in _DEFAULT_LOGO_CANDIDATES:
            if logo.is_file():
                return FileResponse(str(logo), media_type="image/png")
        # PNG شفاف 1x1 كملاذ أخير
        tiny_png = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        )
        return Response(content=tiny_png, media_type="image/png")

    raise HTTPException(status_code=404, detail=f"file not found: {safe_name}")


# ============================================================
# 🛟 Captcha Fallback المدمج
# يضمن أن /api/auth/captcha لن يرجع 404 أبداً حتى لو فشل تحميل
# راوتر auth الكامل (مثلاً بسبب خطأ في import داخل ملف آخر).
# هذا الـ endpoint بسيط، stateless، ومتوافق تماماً مع الواجهة الأمامية.
# سيتم استبداله بالنسخة الكاملة عند نجاح تحميل auth.router.
# ============================================================

_CAPTCHA_TTL_SECONDS = 300  # 5 دقائق


def _captcha_secret() -> bytes:
    base = (os.getenv("SECRET_KEY") or getattr(settings, "SECRET_KEY", "") or "yamshat-default-secret").encode()
    return hashlib.sha256(b"yamshat-captcha-v1:" + base).digest()


def _sign_captcha_token(payload: dict) -> str:
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    body_b64 = base64.urlsafe_b64encode(body).rstrip(b"=").decode("ascii")
    sig = hmac.new(_captcha_secret(), body_b64.encode("ascii"), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).rstrip(b"=").decode("ascii")
    return f"{body_b64}.{sig_b64}"


def _issue_simple_captcha() -> dict:
    a = random.randint(1, 9)
    b = random.randint(1, 9)
    op = random.choice(["+", "-"])
    if op == "+":
        answer = a + b
        question = f"{a} + {b} = ?"
    else:
        # نضمن نتيجة غير سالبة
        if b > a:
            a, b = b, a
        answer = a - b
        question = f"{a} - {b} = ?"

    now = int(time.time())
    token_payload = {
        "a": str(answer),
        "iat": now,
        "exp": now + _CAPTCHA_TTL_SECONDS,
        "nonce": secrets.token_urlsafe(8),
    }
    captcha_id = _sign_captcha_token(token_payload)
    return {
        "captcha_id": captcha_id,
        "question": question,
        "expires_in": _CAPTCHA_TTL_SECONDS,
    }


# نضع الـ fallback بأولوية أقل (يُضاف الآن، لكن إذا تم تركيب راوتر auth الكامل
# لاحقاً على نفس المسار، فإن FastAPI سيستخدم أول مطابقة — وهي هذه).
# لذلك نستخدم اسم مسار مختلف للـ fallback، ونضيف /api/auth/captcha مباشرة
# فقط في حال فشل التركيب الكامل.

@app.get("/api/auth/captcha-fallback")
async def captcha_fallback():
    """Captcha بديلة بسيطة دائماً متاحة (للتشخيص + الاستخدام في حالات الطوارئ)."""
    return _issue_simple_captcha()


# ============================================================
# 📦 تحميل الراوترات الكاملة (auth/captcha/users/posts/...)
# مع تسجيل واضح لأخطاء الاستيراد + متابعة لأي راوتر فشل.
# ============================================================
_ROUTER_STATUS: dict[str, dict] = {}


def _include(router_path: str, prefix: str = ""):
    try:
        module_name, attr = router_path.rsplit(".", 1)
        import importlib
        mod = importlib.import_module(module_name)
        router = getattr(mod, attr)
        app.include_router(router, prefix=prefix)
        logger.info(f"[router] ✅ mounted {router_path} at {prefix}")
        _ROUTER_STATUS[router_path] = {"ok": True, "prefix": prefix}
        return True
    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"[router] ❌ FAILED {router_path}: {e}\n{tb}")
        _ROUTER_STATUS[router_path] = {"ok": False, "prefix": prefix, "error": f"{type(e).__name__}: {e}"}
        return False


# الراوتر الأهم - auth/captcha
_auth_ok = _include("app.api.routes.auth.router", prefix="/api/auth")

# ============================================================
# 🆘 fallback نهائي: إذا فشل تركيب راوتر auth بالكامل، نسجّل endpoint
# الكابتشا الأساسي مباشرة على المسار الذي يتوقعه الـ frontend.
# هذا يضمن أن المستخدم لن يرى captcha "Not Found" أبداً.
# ============================================================
if not _auth_ok:
    logger.error("[captcha] ⚠️  auth router FAILED to load → registering inline /api/auth/captcha fallback")

    @app.get("/api/auth/captcha")
    async def inline_captcha_fallback():
        return _issue_simple_captcha()


# باقي الراوترات
_include("app.api.routes.users.router", prefix="/api/users")
_include("app.api.routes.posts.router", prefix="/api/posts")
_include("app.api.routes.comments.router", prefix="/api/comments")
_include("app.api.routes.notifications.router", prefix="/api/notifications")
_include("app.api.routes.search.router", prefix="/api/search")
_include("app.api.routes.upload.router", prefix="/api/upload")
_include("app.api.routes.admin.router", prefix="/api/admin")
_include("app.api.routes.follow.router", prefix="/api/follow")
_include("app.api.routes.chat.router", prefix="/api/chat")
# ⚠️ stories.py داخلياً يعرّف مساراته بـ /stories/... و /add_story
# لذلك نحمله تحت /api فقط لتجنب /api/stories/stories/...
_include("app.api.routes.stories.router", prefix="/api")
_include("app.api.routes.reels.router", prefix="/api/reels")
_include("app.api.routes.groups.router", prefix="/api/groups")
_include("app.api.routes.inbox.router", prefix="/api/inbox")
# ⚠️ recommendations.py داخلياً يعرّف مساراته بـ /recommendations/...
# لذلك نحمله تحت /api فقط لتجنب /api/recommendations/recommendations/...
_include("app.api.routes.recommendations.router", prefix="/api")
_include("app.api.routes.analytics.router", prefix="/api/analytics")

# 🚨 نظام البلاغات (Reports & Moderation)
_include("app.api.routes.reports.router", prefix="/api/reports")

# 🎮 Engagement & Gamification
_include("app.api.routes.engagement.router", prefix="/api/engagement")
# 🔊 Voice Rooms
_include("app.api.routes.voice_rooms.router", prefix="/api/voice")

# ============================================================
# ♻️ Legacy compatibility aliases
# بعض شاشات الواجهة القديمة كانت تستدعي /api مباشرة بدون مقاطع /chat أو /voice
# فنضيف aliases حتى لا ترجع 404 أثناء التشغيل على النسخ القديمة أو الكاش القديم.
# ============================================================
_include("app.api.routes.chat.router", prefix="/api")
_include("app.api.routes.voice_rooms.router", prefix="/api")


# ============================================================
# 🔍 Diagnostics endpoint — لمعرفة أي راوتر فشل بسرعة
# ============================================================
@app.get("/api/_diag/routers")
async def diag_routers():
    return {
        "total": len(_ROUTER_STATUS),
        "ok": sum(1 for v in _ROUTER_STATUS.values() if v["ok"]),
        "failed": [k for k, v in _ROUTER_STATUS.items() if not v["ok"]],
        "details": _ROUTER_STATUS,
    }


@app.on_event("startup")
async def on_startup():
    logger.info("🚀 Yamshat backend started")
    logger.info(f"   DEBUG={settings.DEBUG}  CAPTCHA={settings.CAPTCHA_ENABLED}")
    failed = [k for k, v in _ROUTER_STATUS.items() if not v["ok"]]
    if failed:
        logger.warning(f"   ⚠️  Failed routers ({len(failed)}): {failed}")
    else:
        logger.info(f"   ✅ All {len(_ROUTER_STATUS)} routers mounted successfully")


# ============================================================
# 🔌 Socket.IO mounting
# كان السيرفر مهيأ داخل socket_server.py لكنه غير مربوط بالتطبيق الرئيسي،
# فكانت طلبات /socket.io ترجع 404 وتفشل كل اتصالات الويب سوكيت.
# ============================================================
from app.core.socket_server import sio

fastapi_app = app
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
application = app
