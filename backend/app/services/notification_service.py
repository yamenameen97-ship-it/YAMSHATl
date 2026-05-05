from sqlalchemy.orm import Session

from app.core.socket_manager import manager
from app.models.notification import Notification
from app.models.user import User
from app.services.push_service import send_push_notification


def _notification_copy(notification_type: str, data: dict) -> tuple[str, str]:
    if notification_type == 'FOLLOW':
        username = data.get('username') or 'مستخدم جديد'
        return 'متابع جديد 🔥', f'{username} قام بمتابعتك'

    return 'إشعار جديد', 'لديك إشعار جديد'


async def create_and_send_notification(
    db: Session,
    user_id: int,
    notification_type: str,
    data: dict,
) -> Notification:
    title, body = _notification_copy(notification_type, data)

    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        body=body,
        data=data,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    realtime_payload = {
        'type': 'notification',
        'data': {
            'id': notification.id,
            'notification_type': notification.type,
            'title': notification.title,
            'body': notification.body,
            'is_read': notification.is_read,
            'created_at': notification.created_at.isoformat(),
            'payload': notification.data,
        },
    }
    await manager.send_to_user(user_id, realtime_payload)

    user = db.query(User).filter(User.id == user_id).first()
    if user and user.fcm_token and not manager.is_online(user_id):
        send_push_notification(
            token=user.fcm_token,
            title=title,
            body=body,
            data={
                'type': notification_type,
                'notification_id': notification.id,
                **data,
            },
        )

    return notification
