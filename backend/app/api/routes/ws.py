from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.core.security import ACCESS_TOKEN_TYPE, TokenError, decode_token
from app.core.socket_manager import manager
from app.db.session import SessionLocal
from app.models.user import User

router = APIRouter()


def _is_websocket_authorized(websocket: WebSocket, user_id: int, db) -> bool:
    token = websocket.query_params.get('token')
    if not token:
        return False

    try:
        payload = decode_token(token, expected_type=ACCESS_TOKEN_TYPE)
    except TokenError:
        return False

    token_user_id = payload.get('user_id')
    if token_user_id is None or int(token_user_id) != user_id:
        return False

    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    return user is not None


@router.websocket('/ws/notifications/{user_id}')
async def websocket_notifications_endpoint(websocket: WebSocket, user_id: int):
    db = SessionLocal()
    try:
        if not _is_websocket_authorized(websocket, user_id, db):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        await manager.connect(user_id, websocket)

        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(user_id, websocket)
    finally:
        db.close()
