from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


def record_audit_log(
    db: Session,
    *,
    actor_user_id: int | None,
    action: str,
    entity_type: str,
    entity_id: str | int | None,
    description: str,
    meta: dict[str, Any] | None = None,
) -> None:
    try:
        db.add(
            AuditLog(
                actor_user_id=actor_user_id,
                action=action,
                entity_type=entity_type,
                entity_id=str(entity_id) if entity_id is not None else None,
                description=description[:500],
                meta=meta or {},
            )
        )
        db.commit()
    except Exception:
        db.rollback()
        logger.exception(
            'Failed to persist audit log action=%s entity_type=%s entity_id=%s',
            action,
            entity_type,
            entity_id,
        )
