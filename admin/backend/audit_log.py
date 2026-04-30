from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock
from typing import Any

_AUDIT_LOGS: list[dict[str, Any]] = []
_AUDIT_LOCK = Lock()


def _utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def log_action(actor: str, action: str, target: str = "", details: dict[str, Any] | None = None) -> dict[str, Any]:
    entry = {
        "timestamp": _utc_timestamp(),
        "actor": str(actor or "system"),
        "action": str(action or "unknown"),
        "target": str(target or ""),
        "details": details or {},
    }
    with _AUDIT_LOCK:
        _AUDIT_LOGS.append(entry)
    return entry


def get_logs(limit: int = 100) -> list[dict[str, Any]]:
    limit = max(1, min(int(limit or 100), 500))
    with _AUDIT_LOCK:
        return list(reversed(_AUDIT_LOGS[-limit:]))
