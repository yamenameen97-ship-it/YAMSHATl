from app.core.firebase import get_firebase_messaging


def send_push_notification(token: str | None, title: str, body: str, data: dict | None = None) -> bool:
    if not token:
        return False

    messaging = get_firebase_messaging()
    if messaging is None:
        return False

    payload = {str(key): str(value) for key, value in (data or {}).items() if value is not None}

    message = messaging.Message(
        token=token,
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        data=payload,
    )

    try:
        messaging.send(message)
        return True
    except Exception:
        return False
