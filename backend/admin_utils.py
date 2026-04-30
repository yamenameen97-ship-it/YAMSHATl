from __future__ import annotations

import json
from typing import Any

from flask import has_request_context, request

from utils import current_user, normalize_text

ACTIVE_MODERATION_ACTIONS = {"ban", "mute", "restrict"}


def _safe_json(value: Any) -> str:
    try:
        return json.dumps(value if value is not None else {}, ensure_ascii=False, default=str)
    except Exception:
        return json.dumps({"value": str(value)}, ensure_ascii=False)


def log_audit(
    cur,
    action: str,
    actor: str | None = None,
    target_type: str = "",
    target_value: str = "",
    details: str = "",
    severity: str = "info",
    metadata: Any | None = None,
) -> None:
    safe_actor = normalize_text(actor or current_user() or "system", 80)
    safe_action = normalize_text(action, 80)
    safe_target_type = normalize_text(target_type, 80)
    safe_target_value = normalize_text(target_value, 255)
    safe_details = normalize_text(details, 2000)
    safe_severity = normalize_text(severity or "info", 20).lower() or "info"

    ip_address = ""
    user_agent = ""
    if has_request_context():
        try:
            ip_address = (
                request.headers.get("X-Forwarded-For", request.remote_addr or "")
                .split(",")[0]
                .strip()
            )
            user_agent = normalize_text(request.headers.get("User-Agent"), 500)
        except Exception:
            ip_address = ""
            user_agent = ""

    cur.execute(
        """
        INSERT INTO audit_logs(actor, action, target_type, target_value, details, severity, metadata, ip_address, user_agent)
        VALUES(%s,%s,%s,%s,%s,%s,%s::jsonb,%s,%s)
        """,
        (
            safe_actor,
            safe_action,
            safe_target_type,
            safe_target_value,
            safe_details,
            safe_severity,
            _safe_json(metadata),
            ip_address,
            user_agent,
        ),
    )


def get_active_moderation(cur, username: str | None) -> dict[str, dict | None]:
    safe_username = normalize_text(username, 80)
    state = {"ban": None, "mute": None, "restrict": None}
    if not safe_username:
        return state

    cur.execute(
        """
        SELECT id, action, reason, created_by, duration_minutes, expires_at, auto_generated, created_at
        FROM moderation_actions
        WHERE username=%s
          AND is_active=TRUE
          AND action = ANY(%s)
          AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY created_at DESC
        """,
        (safe_username, list(ACTIVE_MODERATION_ACTIONS)),
    )
    for row in cur.fetchall() or []:
        action = str(row.get("action") or "").strip().lower()
        if action in state and state[action] is None:
            state[action] = row
    return state


def moderation_flags(state: dict[str, dict | None]) -> dict[str, bool]:
    return {key: bool(value) for key, value in (state or {}).items()}


def enforce_moderation(cur, username: str | None, capability: str = "general") -> str | None:
    state = get_active_moderation(cur, username)
    if state.get("ban"):
        reason = state["ban"].get("reason") or "مخالفة سياسات المنصة"
        return f"تم إيقاف هذا الحساب بواسطة الإدارة. السبب: {reason}"

    if state.get("mute") and capability in {"chat", "message", "live_comment", "live", "social"}:
        reason = state["mute"].get("reason") or "قرار إداري مؤقت"
        return f"هذا الحساب مكتوم مؤقتًا ولا يمكنه إرسال رسائل أو تعليقات الآن. السبب: {reason}"

    if state.get("restrict") and capability in {"chat", "message", "live_comment", "live", "social", "profile_edit"}:
        reason = state["restrict"].get("reason") or "مراجعة أمنية"
        return f"هذا الحساب تحت التقييد المؤقت. السبب: {reason}"

    return None


def apply_moderation(
    cur,
    actor: str,
    username: str,
    action: str,
    reason: str = "",
    duration_minutes: int = 0,
    auto_generated: bool = False,
    metadata: Any | None = None,
) -> None:
    safe_actor = normalize_text(actor or "system", 80) or "system"
    safe_username = normalize_text(username, 80)
    safe_action = normalize_text(action, 40).lower()
    safe_reason = normalize_text(reason, 1000) or "بدون ملاحظات"
    minutes = max(int(duration_minutes or 0), 0)

    if not safe_username or not safe_action:
        return

    clear_map = {"unban": "ban", "unmute": "mute", "unrestrict": "restrict"}
    if safe_action in clear_map:
        target_action = clear_map[safe_action]
        cur.execute(
            """
            UPDATE moderation_actions
            SET is_active=FALSE
            WHERE username=%s
              AND action=%s
              AND is_active=TRUE
            """,
            (safe_username, target_action),
        )
        log_audit(
            cur,
            action=f"moderation_{safe_action}",
            actor=safe_actor,
            target_type="user",
            target_value=safe_username,
            details=safe_reason,
            severity="info",
            metadata={"cleared_action": target_action},
        )
        return

    if safe_action not in ACTIVE_MODERATION_ACTIONS:
        return

    cur.execute(
        "UPDATE moderation_actions SET is_active=FALSE WHERE username=%s AND action=%s AND is_active=TRUE",
        (safe_username, safe_action),
    )

    if minutes > 0:
        cur.execute(
            """
            INSERT INTO moderation_actions(username, action, reason, created_by, duration_minutes, expires_at, auto_generated, metadata)
            VALUES(%s,%s,%s,%s,%s,CURRENT_TIMESTAMP + (%s * INTERVAL '1 minute'),%s,%s::jsonb)
            """,
            (safe_username, safe_action, safe_reason, safe_actor, minutes, minutes, auto_generated, _safe_json(metadata)),
        )
    else:
        cur.execute(
            """
            INSERT INTO moderation_actions(username, action, reason, created_by, duration_minutes, expires_at, auto_generated, metadata)
            VALUES(%s,%s,%s,%s,%s,NULL,%s,%s::jsonb)
            """,
            (safe_username, safe_action, safe_reason, safe_actor, 0, auto_generated, _safe_json(metadata)),
        )

    log_audit(
        cur,
        action=f"moderation_{safe_action}",
        actor=safe_actor,
        target_type="user",
        target_value=safe_username,
        details=safe_reason,
        severity="warning" if safe_action == "ban" else "info",
        metadata={"duration_minutes": minutes, "auto_generated": auto_generated, **(metadata or {})},
    )


def record_spam_violation(cur, username: str, context: dict[str, Any] | None, reason: str) -> dict[str, Any] | None:
    safe_username = normalize_text(username, 80)
    if not safe_username:
        return None

    log_audit(
        cur,
        action="spam_blocked",
        actor=safe_username,
        target_type="system",
        target_value=(context or {}).get("receiver") or "",
        details=normalize_text(reason, 400),
        severity="warning",
        metadata=context or {},
    )

    cur.execute(
        """
        SELECT COUNT(*) AS total
        FROM audit_logs
        WHERE actor=%s
          AND action='spam_blocked'
          AND created_at > NOW() - INTERVAL '15 minutes'
        """,
        (safe_username,),
    )
    total = int((cur.fetchone() or {}).get("total") or 0)
    state = get_active_moderation(cur, safe_username)
    if total >= 3 and not state.get("mute"):
        apply_moderation(
            cur,
            actor="system",
            username=safe_username,
            action="mute",
            reason="تفعيل كتم تلقائي بسبب تكرار محاولات السبام",
            duration_minutes=15,
            auto_generated=True,
            metadata={"violations": total, "context": context or {}, "trigger_reason": reason},
        )
        return {"auto_action": "mute", "duration_minutes": 15, "violations": total}
    return None
