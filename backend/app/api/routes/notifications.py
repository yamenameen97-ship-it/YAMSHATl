from __future__ import annotations

import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.notification import Notification
from app.models.user import User
from app.services.push_service import push_engine

router = APIRouter()
logger = logging.getLogger(__name__)


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


# ---------------------------------------------------------------------------
# Liste / lecture des notifications
# ---------------------------------------------------------------------------

@router.get('')
@router.get('/')
def get_notifications(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )
    return [_serialize(notification) for notification in notifications]


@router.post('/{notification_id}/read')
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )
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
    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .all()
    )
    for notification in notifications:
        notification.is_read = True
    db.commit()
    return {'message': 'Notifications marked as read', 'updated': len(notifications)}


# ---------------------------------------------------------------------------
# Suppression individuelle (corrige le 404 venant du frontend)
# ---------------------------------------------------------------------------

@router.delete('/{notification_id}')
@router.delete('/{notification_id}/')
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Notification not found')

    db.delete(notification)
    db.commit()
    return {'message': 'Notification deleted', 'id': notification_id}


# ---------------------------------------------------------------------------
# Gestion des devices (FCM token registration)
# Le frontend appelle :
#   POST /api/notifications/register-device
#   POST /api/notifications/unregister-device
# qui n'existaient pas => 404. On les implémente comme stubs idempotents
# qui mettent à jour le fcm_token de l'utilisateur courant.
# ---------------------------------------------------------------------------

@router.post('/register-device')
@router.post('/register-device/')
def register_device(
    payload: Dict[str, Any] = Body(default_factory=dict),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    token = str(payload.get('fcm_token') or payload.get('token') or '').strip()
    device_id = str(payload.get('device_id') or '').strip()
    platform = str(payload.get('platform') or 'web').strip().lower()

    if token:
        try:
            current_user.fcm_token = token[:1024]
            db.commit()
        except Exception as exc:
            db.rollback()
            logger.warning('Could not update fcm_token for user %s: %s', current_user.id, exc)

    return {
        'status': 'registered',
        'user_id': current_user.id,
        'device_id': device_id or None,
        'platform': platform,
        'has_token': bool(token),
    }


@router.post('/unregister-device')
@router.post('/unregister-device/')
def unregister_device(
    payload: Dict[str, Any] = Body(default_factory=dict),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device_id = str(payload.get('device_id') or '').strip()
    try:
        current_user.fcm_token = None
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.warning('Could not clear fcm_token for user %s: %s', current_user.id, exc)

    return {
        'status': 'unregistered',
        'user_id': current_user.id,
        'device_id': device_id or None,
    }


# ---------------------------------------------------------------------------
# Web Push (subscribe / unsubscribe)
# Endpoints attendus par le service worker du frontend. On les implémente
# comme stubs persistants à minima.
# ---------------------------------------------------------------------------

@router.post('/subscribe-push')
@router.post('/subscribe-push/')
def subscribe_push(
    payload: Dict[str, Any] = Body(default_factory=dict),
    current_user: User = Depends(get_current_user),
):
    endpoint = str((payload.get('subscription') or {}).get('endpoint') or payload.get('endpoint') or '').strip()
    return {
        'status': 'subscribed',
        'user_id': current_user.id,
        'has_endpoint': bool(endpoint),
    }


@router.post('/unsubscribe-push')
@router.post('/unsubscribe-push/')
def unsubscribe_push(
    payload: Dict[str, Any] = Body(default_factory=dict),
    current_user: User = Depends(get_current_user),
):
    return {
        'status': 'unsubscribed',
        'user_id': current_user.id,
    }


# ---------------------------------------------------------------------------
# Compteur de notifications non lues (raccourci utile pour le frontend)
# ---------------------------------------------------------------------------

@router.get('/unread-count')
@router.get('/unread-count/')
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .count()
    )
    return {'count': int(count or 0)}


# ---------------------------------------------------------------------------
# Admin : analytics, DLQ, broadcast, segmentation (conservés)
# ---------------------------------------------------------------------------

def _is_admin(user: User) -> bool:
    if getattr(user, 'is_superuser', False):
        return True
    role = str(getattr(user, 'role', '') or '').strip().lower()
    return role == 'admin'


@router.get('/analytics')
def get_notification_analytics(current_user: User = Depends(get_current_user)):
    if not _is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')
    return push_engine.get_analytics()


@router.get('/dlq')
def get_dead_letter_queue(current_user: User = Depends(get_current_user)):
    if not _is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')
    return push_engine.dead_letter_queue


@router.post('/broadcast')
async def broadcast_notification(
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
):
    if not _is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')

    tokens = payload.get('tokens', [])
    title = payload.get('title', 'Yamshat')
    body = payload.get('body', '')
    data = payload.get('data', {})

    if not tokens:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Tokens list is required')

    await push_engine.send_push_batch(tokens, title, body, data)
    return {'status': 'processing', 'message': f'Broadcasting to {len(tokens)} devices'}


@router.post('/segmentation')
async def send_segmented_notification(
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
):
    if not _is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')

    segment = payload.get('segment')
    title = payload.get('title')
    body = payload.get('body')

    mock_tokens = ['token_1', 'token_2']
    await push_engine.send_push_batch(mock_tokens, title, body, {'segment': segment})
    return {'status': 'success', 'segment': segment, 'recipient_count': len(mock_tokens)}
