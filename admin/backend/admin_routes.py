from __future__ import annotations

from flask import Blueprint, jsonify, request

try:
    from .admin_service import ban_user, delete_message, get_reports, get_stats, list_logs
    from .permissions import has_permission
except ImportError:  # pragma: no cover
    from admin_service import ban_user, delete_message, get_reports, get_stats, list_logs
    from permissions import has_permission

admin_bp = Blueprint("supplementary_admin", __name__)


def _current_user() -> dict:
    auth = request.headers.get("Authorization", "")
    role = (request.headers.get("X-Admin-Role") or request.args.get("role") or "admin").strip().lower()
    actor = (request.headers.get("X-Admin-User") or request.args.get("user") or "admin").strip()
    return {
        "name": actor or "admin",
        "role": role,
        "token_present": bool(auth.strip()),
    }


def _forbidden(permission: str):
    return jsonify({"message": f"missing permission: {permission}"}), 403


@admin_bp.get("/admin/stats")
def stats():
    user = _current_user()
    if not has_permission(user, "view_logs") and user.get("role") != "support":
        return _forbidden("view_logs")
    return jsonify(get_stats())


@admin_bp.get("/admin/reports")
def reports():
    user = _current_user()
    if user.get("role") not in {"admin", "moderator", "support"}:
        return _forbidden("view_users")
    limit = request.args.get("limit", 50, type=int)
    return jsonify(get_reports(limit))


@admin_bp.get("/admin/logs")
def logs():
    user = _current_user()
    if not has_permission(user, "view_logs"):
        return _forbidden("view_logs")
    limit = request.args.get("limit", 100, type=int)
    return jsonify(list_logs(limit))


@admin_bp.post("/admin/ban_user")
def ban_user_route():
    user = _current_user()
    if not has_permission(user, "ban_user"):
        return _forbidden("ban_user")
    payload = request.get_json(silent=True) or {}
    result = ban_user(payload.get("username"), actor=user.get("name", "admin"), reason=payload.get("reason", ""))
    return jsonify(result)


@admin_bp.post("/admin/delete_message")
def delete_message_route():
    user = _current_user()
    if not has_permission(user, "delete_message"):
        return _forbidden("delete_message")
    payload = request.get_json(silent=True) or {}
    result = delete_message(payload.get("message_id"), actor=user.get("name", "admin"))
    return jsonify(result)
