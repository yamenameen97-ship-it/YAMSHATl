from __future__ import annotations

import os

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in str(value or "").split(",") if item.strip()]


limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=os.environ.get("RATELIMIT_STORAGE_URI", "memory://"),
    default_limits=_split_csv(os.environ.get("RATELIMIT_DEFAULT", "300 per hour,60 per minute")),
    headers_enabled=True,
)
