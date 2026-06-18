"""user_devices table for realtime notifications

Revision ID: 20260616_0012
Revises: 20260614_0011
Create Date: 2026-06-16
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260616_0012"
down_revision = "20260614_0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_devices",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("device_id", sa.String(length=128), nullable=False),
        sa.Column("push_token", sa.String(length=2048), nullable=False),
        sa.Column("platform", sa.String(length=20), nullable=False, server_default="web"),
        sa.Column("provider", sa.String(length=20), nullable=False, server_default="fcm"),
        sa.Column("web_push_p256dh", sa.String(length=255), nullable=True),
        sa.Column("web_push_auth", sa.String(length=255), nullable=True),
        sa.Column("device_name", sa.String(length=255), nullable=True),
        sa.Column("os_version", sa.String(length=50), nullable=True),
        sa.Column("app_version", sa.String(length=50), nullable=True),
        sa.Column("user_agent", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "notifications_enabled", sa.Boolean(), nullable=False, server_default=sa.true()
        ),
        sa.Column(
            "registered_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "last_seen_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("last_push_at", sa.DateTime(), nullable=True),
        sa.Column("failure_count", sa.Integer(), nullable=False, server_default="0"),
        sa.UniqueConstraint(
            "user_id", "device_id", "push_token", name="uq_user_device_token"
        ),
    )
    op.create_index("ix_user_devices_user_id", "user_devices", ["user_id"])
    op.create_index("ix_user_devices_device_id", "user_devices", ["device_id"])
    op.create_index("ix_user_devices_platform", "user_devices", ["platform"])
    op.create_index("ix_user_devices_active", "user_devices", ["user_id", "is_active"])
    op.create_index("ix_user_devices_last_seen", "user_devices", ["last_seen_at"])


def downgrade() -> None:
    op.drop_index("ix_user_devices_last_seen", table_name="user_devices")
    op.drop_index("ix_user_devices_active", table_name="user_devices")
    op.drop_index("ix_user_devices_platform", table_name="user_devices")
    op.drop_index("ix_user_devices_device_id", table_name="user_devices")
    op.drop_index("ix_user_devices_user_id", table_name="user_devices")
    op.drop_table("user_devices")
