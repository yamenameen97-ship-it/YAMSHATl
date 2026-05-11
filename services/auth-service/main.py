from datetime import datetime, timedelta, timezone

from jose import JWTError
from backend.auth.jwt_manager import create_access_token, create_refresh_token, verify_token, revoke_token, rotate_refresh_token, get_user_sessions, revoke_user_session, SECRET_KEY, ALGORITHM
from fastapi import FastAPI, Request, status, Depends
from fastapi.responses import JSONResponse
from backend.core.errors import APIException, ErrorCode
from backend.core.exception_handlers import api_exception_handler, http_exception_handler
from backend.core.logger import get_logger
import uuid
from backend.security.security import rate_limiter, brute_force_protector

app = FastAPI()

from backend.db.optimization import apply_database_optimizations

@app.on_event("startup")
async def startup_event():
    apply_database_optimizations()

logger = get_logger(__name__)

app.add_exception_handler(APIException, api_exception_handler)
app.add_exception_handler(Exception, http_exception_handler)

# SECRET = 'supersecret' # No longer needed as it's in jwt_manager

@app.post('/login')
async def login(user: str, request: Request, _=Depends(rate_limiter)):
    await brute_force_protector(request, username=user)
    try:
        access_token = create_access_token(data={"sub": user})
        refresh_token = create_refresh_token(data={"sub": user, "user_id": user}) # Assuming user is user_id for now
        logger.info(f"User {user} logged in successfully.")
        return {"access_token": access_token, "refresh_token": refresh_token}
    except Exception as e:
        logger.error(f"Login failed for user {user}: {e}")
        raise APIException(code=ErrorCode.INTERNAL_SERVER_ERROR, message="Login failed", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@app.post("/refresh")
async def refresh_token(refresh_token: str):
    try:
        payload = verify_token(refresh_token)
        user_id = payload.get("user_id")
        if not user_id:
            raise APIException(code=ErrorCode.INVALID_TOKEN, message="Invalid refresh token payload", status_code=status.HTTP_401_UNAUTHORIZED)
        
        new_refresh_token = rotate_refresh_token(refresh_token, user_id)
        new_access_token = create_access_token(data={"sub": user_id})
        return {"access_token": new_access_token, "refresh_token": new_refresh_token}
    except APIException as e:
        raise e
    except Exception as e:
        logger.error(f"Refresh token failed: {e}")
        raise APIException(code=ErrorCode.INTERNAL_SERVER_ERROR, message="Refresh token failed", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@app.post('/revoke')
async def revoke_session(refresh_token: str):
    try:
        payload = verify_token(refresh_token)
        user_id = payload.get("user_id")
        if not user_id:
            raise APIException(code=ErrorCode.INVALID_TOKEN, message="Invalid refresh token payload", status_code=status.HTTP_401_UNAUTHORIZED)
        revoke_user_session(user_id, refresh_token)
        return {"message": "Session revoked successfully"}
    except APIException as e:
        raise e
    except Exception as e:
        logger.error(f"Revoke session failed: {e}")
        raise APIException(code=ErrorCode.INTERNAL_SERVER_ERROR, message="Revoke session failed", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
