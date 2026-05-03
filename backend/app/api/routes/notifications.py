from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.notification import Notification
from app.models.user import User

router = APIRouter()


@router.get('/')
def get_notifications(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
    ).order_by(Notification.created_at.desc()).limit(limit).all()

    return [
        {
            'id': notification.id,
            'type': notification.type,
            'title': notification.title,
            'body': notification.body,
            'data': notification.data,
            'is_read': notification.is_read,
            'created_at': notification.created_at,
        }
        for notification in notifications
    ]


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

    return {
        'message': 'Notification marked as read',
        'notification_id': notification.id,
        'is_read': notification.is_read,
    }
