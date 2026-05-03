from functools import lru_cache
from pathlib import Path

from app.core.config import BASE_DIR, settings

try:
    import firebase_admin
    from firebase_admin import credentials, messaging
except Exception:  # pragma: no cover - optional dependency
    firebase_admin = None
    credentials = None
    messaging = None


@lru_cache(maxsize=1)
def get_firebase_messaging():
    if firebase_admin is None or credentials is None or messaging is None:
        return None

    credentials_path = settings.FIREBASE_CREDENTIALS_PATH.strip()
    if not credentials_path:
        return None

    resolved_path = Path(credentials_path)
    if not resolved_path.is_absolute():
        resolved_path = BASE_DIR / credentials_path

    if not resolved_path.exists():
        return None

    if not firebase_admin._apps:
        firebase_admin.initialize_app(credentials.Certificate(str(resolved_path)))

    return messaging
