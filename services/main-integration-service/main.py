"""
main-integration-service - Entry Point
===================
نقطة الدخول الموحدة لخدمة main-integration-service.
يستورد التطبيق من الموديول الموجود مسبقاً (main_integration_service.py) ويوفر:
  - /health   : فحص الحالة
  - /         : معلومات أساسية
  - CORS صحيح
  - معالج أخطاء يضمن CORS headers حتى في 500
"""
import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("yamshat.main-integration-service")

# محاولة استيراد app من الموديول الموجود — إن لم نجده، نُنشئ FastAPI افتراضي
try:
    from main_integration_service import app as inner_app  # type: ignore
    app = inner_app
    logger.info("[main-integration-service] ✅ تم استيراد app من main_integration_service")
except Exception as exc:  # noqa: BLE001
    logger.warning(f"[main-integration-service] ⚠️  لم يُستورد main_integration_service ({exc}) — أُنشئ FastAPI افتراضي")
    app = FastAPI(title="main-integration-service", version="1.0.0")

# CORS
CORS_ORIGINS = [o.strip() for o in os.getenv(
    "CORS_ORIGINS", "http://localhost:3000,http://localhost:5173"
).split(",") if o.strip()]
CORS_ORIGIN_REGEX = os.getenv("CORS_ORIGIN_REGEX", r"^https://.*\.onrender\.com$")

# نتحقق ما إذا كان CORSMiddleware مُضافاً مسبقاً
_has_cors = any(getattr(m, "cls", None).__name__ == "CORSMiddleware" for m in app.user_middleware if getattr(m, "cls", None))
if not _has_cors:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_origin_regex=CORS_ORIGIN_REGEX,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Endpoints الأساسية
@app.get("/", include_in_schema=False)
async def _root():
    return {"service": "main-integration-service", "status": "ok"}

@app.get("/health")
async def _health():
    return {"status": "ok", "service": "main-integration-service"}

# معالج CORS-safe للأخطاء
@app.exception_handler(Exception)
async def _unhandled(request: Request, exc: Exception):
    logger.exception(f"Unhandled on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "service": "main-integration-service"},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
        },
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
