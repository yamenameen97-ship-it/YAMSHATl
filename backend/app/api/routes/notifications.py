from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.dependencies import get_current_user, get_db
from app.models.notification import Notification
from app.models.user import User
from app.services.push_service import push_engine

router = APIRouter()

def _serialize(notification: Notification) -> dict:
    return {
        'id': notification.id,
        'type': notification.type,
        'title': notification.title,
        'body': notification.body,
        'message': notification.body,
        'text': notification.body,
        'data': notification.data,
        'is_read': notification.is_read,
        'seen': notification.is_read,
        'created_at': notification.created_at.isoformat() if notification.created_at else None,
    }

@router.get('')
@router.get('/')
def get_notifications(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
    ).order_by(Notification.created_at.desc()).limit(limit).all()
    return [_serialize(notification) for notification in notifications]

@router.post('/{notification_id}/read')
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Notification not found')

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return _serialize(notification)

@router.put('/read')
@router.put('/read/')
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read.is_(False),
    ).all()
    for notification in notifications:
        notification.is_read = True
    db.commit()
    return {'message': 'Notifications marked as read', 'updated': len(notifications)}

# --- Professional Notification Features (Admin Only) ---

@router.get('/analytics')
def get_notification_analytics(current_user: User = Depends(get_current_user)):
    if not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')
    return push_engine.get_analytics()

@router.get('/dlq')
def get_dead_letter_queue(current_user: User = Depends(get_current_user)):
    if not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')
    return push_engine.dead_letter_queue

@router.post('/broadcast')
async def broadcast_notification(
    payload: dict = Body(...), 
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')
    
    tokens = payload.get('tokens', [])
    title = payload.get('title', 'Yamshat')
    body = payload.get('body', '')
    data = payload.get('data', {})
    
    if not tokens:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Tokens list is required')
        
    await push_engine.send_push_batch(tokens, title, body, data)
    return {"status": "processing", "message": f"Broadcasting to {len(tokens)} devices"}

@router.post('/segmentation')
async def send_segmented_notification(
    payload: dict = Body(...), 
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')
    
    segment = payload.get('segment')
    title = payload.get('title')
    body = payload.get('body')
    
    # Mock tokens for demonstration
    mock_tokens = ["token_1", "token_2"] 
    
    await push_engine.send_push_batch(mock_tokens, title, body, {"segment": segment})
    return {"status": "success", "segment": segment, "recipient_count": len(mock_tokens)}
