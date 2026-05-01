
from __future__ import annotations

from datetime import datetime
from flask import Blueprint, jsonify, request

audit_bp = Blueprint("audit", __name__)
AUDIT_LOGS = []


def write_audit(action: str, actor: str = "system", details: str = ""):
    AUDIT_LOGS.append({
        "time": datetime.utcnow().isoformat(),
        "actor": actor,
        "action": action,
        "details": details
    })


@audit_bp.get("/admin/audit-logs")
def audit_logs():
    return jsonify({
        "total": len(AUDIT_LOGS),
        "logs": AUDIT_LOGS[-200:]
    })


@audit_bp.post("/admin/audit-logs")
def create_manual_audit():
    payload = request.get_json(silent=True) or {}
    write_audit(
        action=payload.get("action", "manual_entry"),
        actor=payload.get("actor", "admin"),
        details=payload.get("details", "")
    )
    return jsonify({"status": "saved"})
