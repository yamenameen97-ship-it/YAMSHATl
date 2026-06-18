"""Add phone verification columns to users table.

Revision ID: 20260618_0013
Revises: 20260616_0012
Create Date: 2026-06-18

السبب:
نموذج User يحتوي على أعمدة phone_number, phone_verified, phone_verification_*
لكنها لم تكن مضمّنة في أي migration سابق، فكانت قاعدة البيانات على Render
لا تحتوي عليها مما يُسبب SQLAlchemy ProgrammingError (f405) عند SELECT users
ويُترجم إلى 503 Service Unavailable على POST /api/auth/login.

هذا الـ migration يضيفها بشكل آمن idempotent (IF NOT EXISTS) ليعمل سواء
كانت قاعدة البيانات جديدة أو قديمة.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect


revision = "20260618_0013"
down_revision = "20260616_0012"
branch_labels = None
depends_on = None


def _has_column(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    try:
        cols = {col["name"] for col in inspector.get_columns(table_name)}
    except Exception:
        return False
    return column_name in cols


def _has_index(table_name: str, index_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    try:
        idxs = {ix["name"] for ix in inspector.get_indexes(table_name)}
    except Exception:
        return False
    return index_name in idxs


def upgrade() -> None:
    # أضف الأعمدة فقط إذا لم تكن موجودة (idempotent)
    if not _has_column("users", "phone_number"):
        op.add_column(
            "users",
            sa.Column("phone_number", sa.String(length=20), nullable=True),
        )
    if not _has_column("users", "phone_verified"):
        op.add_column(
            "users",
            sa.Column(
                "phone_verified",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            ),
        )
    if not _has_column("users", "phone_verification_code"):
        op.add_column(
            "users",
            sa.Column("phone_verification_code", sa.String(length=128), nullable=True),
        )
    if not _has_column("users", "phone_verification_expires_at"):
        op.add_column(
            "users",
            sa.Column("phone_verification_expires_at", sa.DateTime(), nullable=True),
        )
    if not _has_column("users", "phone_verification_attempts"):
        op.add_column(
            "users",
            sa.Column(
                "phone_verification_attempts",
                sa.Integer(),
                nullable=False,
                server_default="0",
            ),
        )
    if not _has_column("users", "phone_verification_locked_until"):
        op.add_column(
            "users",
            sa.Column("phone_verification_locked_until", sa.DateTime(), nullable=True),
        )

    # فهارس
    if not _has_index("users", "ix_users_phone_number"):
        try:
            op.create_index(
                "ix_users_phone_number",
                "users",
                ["phone_number"],
                unique=True,
            )
        except Exception:
            # في حال وجود قيم مكررة قديمة، أنشئ فهرس غير فريد
            try:
                op.create_index(
                    "ix_users_phone_number",
                    "users",
                    ["phone_number"],
                    unique=False,
                )
            except Exception:
                pass
    if not _has_index("users", "ix_users_phone_verified"):
        try:
            op.create_index(
                "ix_users_phone_verified", "users", ["phone_verified"], unique=False
            )
        except Exception:
            pass


def downgrade() -> None:
    # تراجع آمن (لا يكسر القاعدة لو الأعمدة غير موجودة)
    for idx in ("ix_users_phone_verified", "ix_users_phone_number"):
        if _has_index("users", idx):
            try:
                op.drop_index(idx, table_name="users")
            except Exception:
                pass
    for col in (
        "phone_verification_locked_until",
        "phone_verification_attempts",
        "phone_verification_expires_at",
        "phone_verification_code",
        "phone_verified",
        "phone_number",
    ):
        if _has_column("users", col):
            try:
                op.drop_column("users", col)
            except Exception:
                pass
