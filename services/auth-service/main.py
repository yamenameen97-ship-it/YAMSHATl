"""
Auth Service - نسخة قائمة بذاتها للنشر على Render
================================================
- لا تعتمد على استيرادات backend.* (التي كانت معطلة)
- JWT باستخدام PyJWT (الموجودة في requirements)
- Rate limiting + Brute-force protection داخليان
- متوافقة مع gateway و render.yaml
"""
import os
import time
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import FastAPI, Request, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# ============================================================
# الإعدادات
# ============================================================
SECRET_KEY = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY", "change-me-in-production-yamshat")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))

CORS_ORIGINS = [o.strip() for o in os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173"
).split(",") if o.strip()]
CORS_ORIGIN_REGEX = os.getenv("CORS_ORIGIN_REGEX", r"^https://.*\.onrender\.com$")

# ============================================================
# Logger
# ============================================================
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("yamshat.auth")

# ============================================================
# App init
# ============================================================
app = FastAPI(title="Yamshat Auth Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# in-memory stores (يفضل استبدالها بـ Redis في الإنتاج)
# ============================================================
_revoked_tokens: set[str] = set()
_user_sessions: dict[str, list[str]] = {}
_login_attempts: dict[str, list[float]] = {}
_rate_limit_buckets: dict[str, list[float]] = {}

# ============================================================
# JWT helpers
# ============================================================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    user_id = data.get("user_id") or data.get("sub")
    if user_id:
        _user_sessions.setdefault(str(user_id), []).append(token)
    return token

def verify_token(token: str) -> dict:
    if token in _revoked_tokens:
        raise HTTPException(status_code=401, detail="Token revoked")
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

def revoke_token(token: str) -> None:
    _revoked_tokens.add(token)

def rotate_refresh_token(old_token: str, user_id: str) -> str:
    revoke_token(old_token)
    return create_refresh_token({"sub": user_id, "user_id": user_id})

def revoke_user_session(user_id: str, token: str) -> None:
    revoke_token(token)
    sessions = _user_sessions.get(str(user_id), [])
    if token in sessions:
        sessions.remove(token)

# ============================================================
# Rate limiting & brute-force
# ============================================================
def rate_limiter(request: Request):
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    bucket = _rate_limit_buckets.setdefault(ip, [])
    # نحتفظ بطلبات آخر 60 ثانية فقط
    bucket[:] = [t for t in bucket if now - t < 60]
    if len(bucket) >= 60:  # 60 req/min
        raise HTTPException(status_code=429, detail="Too many requests")
    bucket.append(now)

async def brute_force_protector(request: Request, username: str):
    now = time.time()
    key = f"{username}:{request.client.host if request.client else 'x'}"
    attempts = _login_attempts.setdefault(key, [])
    attempts[:] = [t for t in attempts if now - t < 300]  # 5 دقائق
    if len(attempts) >= 5:
        raise HTTPException(status_code=429, detail="Too many login attempts. Try again in 5 minutes.")
    attempts.append(now)

# ============================================================
# Schemas
# ============================================================
class LoginRequest(BaseModel):
    username: str
    password: Optional[str] = None

class RefreshRequest(BaseModel):
    refresh_token: str

class RevokeRequest(BaseModel):
    refresh_token: str

# ============================================================
# Endpoints
# ============================================================
@app.get("/")
async def root():
    return {"service": "auth", "status": "ok", "version": "2.0.0"}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "auth-service"}

@app.post("/login")
async def login(body: LoginRequest, request: Request, _=Depends(rate_limiter)):
    await brute_force_protector(request, username=body.username)
    try:
        access_token = create_access_token(data={"sub": body.username})
        refresh = create_refresh_token(data={"sub": body.username, "user_id": body.username})
        logger.info(f"User {body.username} logged in")
        return {"access_token": access_token, "refresh_token": refresh, "token_type": "bearer"}
    except Exception as e:
        logger.exception(f"Login failed: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.post("/refresh")
async def refresh(body: RefreshRequest):
    try:
        payload = verify_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Not a refresh token")
        user_id = payload.get("user_id") or payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid payload")
        new_refresh = rotate_refresh_token(body.refresh_token, user_id)
        new_access = create_access_token(data={"sub": user_id})
        return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Refresh failed: {e}")
        raise HTTPException(status_code=500, detail="Refresh failed")

@app.post("/revoke")
async def revoke(body: RevokeRequest):
    try:
        payload = verify_token(body.refresh_token)
        user_id = payload.get("user_id") or payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid payload")
        revoke_user_session(user_id, body.refresh_token)
        return {"message": "Session revoked successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Revoke failed: {e}")
        raise HTTPException(status_code=500, detail="Revoke failed")

@app.get("/verify")
async def verify(token: str):
    try:
        payload = verify_token(token)
        return {"valid": True, "payload": payload}
    except HTTPException as e:
        return {"valid": False, "detail": e.detail}

# ============================================================
# Exception handler يضمن CORS headers حتى في 500
# ============================================================
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
        },
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
