from __future__ import annotations

import os

DEFAULT_PRIMARY_ADMIN_EMAIL = 'yamenameen97@gmail.com'


def normalize_email(value: str | None) -> str:
    return (value or '').strip().lower()


def primary_admin_email() -> str:
    return normalize_email(os.getenv('PRIMARY_ADMIN_EMAIL') or DEFAULT_PRIMARY_ADMIN_EMAIL)


def is_primary_admin_email(email: str | None) -> bool:
    return normalize_email(email) == primary_admin_email()


def is_primary_admin_user(user) -> bool:
    if user is None:
        return False
    return is_primary_admin_email(getattr(user, 'email', None))


def effective_role(user) -> str:
    if is_primary_admin_user(user):
        return 'admin'
    role = str(getattr(user, 'role', 'user') or 'user').strip().lower()
    return 'user' if role == 'admin' else role


def permissions_for_user(user, role_permissions: dict[str, list[str]]) -> list[str]:
    role = effective_role(user)
    return role_permissions.get(role, role_permissions.get('user', []))
