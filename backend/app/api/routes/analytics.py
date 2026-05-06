from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Body, Depends, Header, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security import ACCESS_TOKEN_TYPE, TokenError, decode_token
from app.models.user import User
from app.services.analytics_service import build_event, dispatch_event, provider_status

router = APIRouter()
security = HTTPBearer(auto_error=False)


def _resolve_user(credentials: HTTPAuthorizationCredentials | None, db: Session) -> User | None:
    if credentials is None:
        return None
    try:
        payload = decode_token(credentials.credentials, expected_type=ACCESS_TOKEN_TYPE)
        user_id = payload.get('user_id')
    except TokenError:
        return None
    if not user_id:
        return None
    return db.query(User).filter(User.id == int(user_id), User.is_active.is_(True)).first()


@router.get('/health')
def analytics_health() -> dict[str, Any]:
    return provider_status()


@router.post('/events')
async def capture_analytics_event(
    request: Request,
    payload: dict[str, Any] = Body(...),
    x_session_id: str | None = Header(default=None),
    x_anonymous_id: str | None = Header(default=None),
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    user = _resolve_user(credentials, db)
    event = build_event(
        payload=payload,
        user_id=user.id if user else None,
        request_meta={
            'route': str(payload.get('route') or request.url.path),
            'platform': payload.get('platform') or request.headers.get('x-yamshat-client') or 'web',
            'session_id': x_session_id,
            'anonymous_id': x_anonymous_id,
            'client_ip': request.client.host if request.client else '',
            'user_agent': request.headers.get('user-agent') or '',
            'referer': request.headers.get('referer') or '',
        },
    )
    delivery = await dispatch_event(event)
    return {
        'message': 'Analytics event processed',
        'event': event,
        'delivery': delivery,
    }
