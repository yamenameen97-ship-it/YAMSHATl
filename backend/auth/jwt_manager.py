
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from backend.core.errors import APIException, ErrorCode
from backend.core.logger import get_logger

logger = get_logger(__name__)

SECRET_KEY = "supersecret" # Should be loaded from environment variables
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

# In a real application, this would be a persistent store like Redis
# For now, using in-memory dicts for demonstration
token_blacklist = set()
refresh_tokens_db = {}

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    refresh_tokens_db[encoded_jwt] = data['user_id'] # Store refresh token with user_id
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if token in token_blacklist:
            raise APIException(code=ErrorCode.INVALID_TOKEN, message="Token revoked", status_code=401)
        return payload
    except jwt.ExpiredSignatureError:
        raise APIException(code=ErrorCode.TOKEN_EXPIRED, message="Token has expired", status_code=401)
    except jwt.InvalidTokenError:
        raise APIException(code=ErrorCode.INVALID_TOKEN, message="Invalid token", status_code=401)

def revoke_token(token: str):
    token_blacklist.add(token)
    logger.info(f"Token revoked: {token[:10]}...")

def rotate_refresh_token(old_refresh_token: str, user_id: int):
    if old_refresh_token not in refresh_tokens_db or refresh_tokens_db[old_refresh_token] != user_id:
        raise APIException(code=ErrorCode.INVALID_TOKEN, message="Invalid refresh token", status_code=401)
    
    # Revoke old refresh token
    del refresh_tokens_db[old_refresh_token]

    # Create new refresh token
    new_refresh_token = create_refresh_token({"user_id": user_id})
    return new_refresh_token

def get_user_sessions(user_id: int):
    # In a real system, this would query a session store for all active sessions for a user
    # For now, we'll just return refresh tokens associated with the user
    return [token for token, u_id in refresh_tokens_db.items() if u_id == user_id]

def revoke_user_session(user_id: int, refresh_token: str):
    if refresh_token in refresh_tokens_db and refresh_tokens_db[refresh_token] == user_id:
        del refresh_tokens_db[refresh_token]
        logger.info(f"Session revoked for user {user_id} with refresh token: {refresh_token[:10]}...")
    else:
        raise APIException(code=ErrorCode.INVALID_TOKEN, message="Refresh token not found or does not belong to user", status_code=400)

