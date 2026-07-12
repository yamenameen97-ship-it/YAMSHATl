"""muted_story_users table (v87.12 — mute user stories)

يُنشئ جدول muted_story_users لتخزين قائمة المستخدمين الذين كتم
منهم المستخدم قصصهم (Mute User Stories) — مستقل عن UserMute العام.

- muter_id: من قام بالكتم
- muted_id: من كُتمت قصصه

Revision ID: 20260712_0016
Revises: 20260712_0015
Create Date: 2026-07-12
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "20260712_0016"
down_revision = "20260712_0015"
branch_labels = None
depends_on = None


def _has_table(bind, table: str) -> bool:
    inspector = sa.inspect(bind)
    try:
        return table in inspector.get_table_names()
    except Exception:
        return False


def upgrade() -> None:
    bind = op.get_bind()

    if _has_table(bind, "muted_story_users"):
        return

    op.create_table(
        "muted_story_users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "muter_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "muted_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.UniqueConstraint("muter_id", "muted_id", name="uq_muted_story_users_pair"),
    )


def downgrade() -> None:
    bind = op.get_bind()
    if _has_table(bind, "muted_story_users"):
        op.drop_table("muted_story_users")
