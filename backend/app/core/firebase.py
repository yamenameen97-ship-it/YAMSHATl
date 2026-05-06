import json
import os
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


CLIENT_CONFIG_FILENAMES = {'google-services.json', 'GoogleService-Info.plist'}


def _resolve_credentials_source() -> str | None:
    env_path = (os.getenv('GOOGLE_APPLICATION_CREDENTIALS') or '').strip()
    service_account_path = (os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH') or '').strip()
    configured_path = settings.FIREBASE_CREDENTIALS_PATH.strip()

    for candidate in [service_account_path, configured_path, env_path]:
        if not candidate:
            continue
        resolved_path = Path(candidate)
        if not resolved_path.is_absolute():
            resolved_path = BASE_DIR / candidate
        if not resolved_path.exists():
            continue
        if resolved_path.name in CLIENT_CONFIG_FILENAMES:
            continue
        return str(resolved_path)

    return None


@lru_cache(maxsize=1)
def get_firebase_messaging():
    if firebase_admin is None or credentials is None or messaging is None:
        return None

    if not firebase_admin._apps:
        raw_service_account = (os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON') or '').strip()
        if raw_service_account:
            try:
                info = json.loads(raw_service_account)
                firebase_admin.initialize_app(credentials.Certificate(info))
                return messaging
            except Exception:
                return None

        credentials_source = _resolve_credentials_source()
        if not credentials_source:
            return None

        try:
            firebase_admin.initialize_app(credentials.Certificate(credentials_source))
        except Exception:
            return None

    return messaging
