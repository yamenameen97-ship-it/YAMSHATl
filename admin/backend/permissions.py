from __future__ import annotations

ROLE_PERMISSIONS = {
    "admin": {"ban_user", "delete_message", "view_logs"},
    "moderator": {"delete_message"},
    "support": {"view_users"},
}


def _extract_role(user) -> str:
    if isinstance(user, dict):
        return str(user.get("role") or "").strip().lower()
    return str(user or "").strip().lower()


def has_permission(user, permission: str) -> bool:
    role = _extract_role(user)
    permission = str(permission or "").strip()
    if not role or not permission:
        return False
    return permission in ROLE_PERMISSIONS.get(role, set())
