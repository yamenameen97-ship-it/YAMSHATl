"""hidden_story_users table (v87.11 stories completeness)

يُنشئ جدول hidden_story_users لتخزين قائمة المستخدمين الذين يخفي
عنهم صاحب الحساب قصصه (Hide Story From).

- owner_id: صاحب القصص الذي يريد الإخفاء
- hidden_id: المستخدم المُخفى عنه

مستقل تماماً عن user_blocks (الحظر الكامل). المستخدم المُخفى عنه لا يزال
يستطيع رؤية بقية محتوى الحساب — فقط الستوريز مخفية.

Revision ID: 20260712_0015
Revises: 20260707_0014
Create Date: 2026-07-12
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "20260712_0015"
down_revision = "20260707_0014"
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

    if _has_table(bind, "hidden_story_users"):
        return

    op.create_table(
        "hidden_story_users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "owner_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "hidden_id",
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
        sa.UniqueConstraint("owner_id", "hidden_id", name="uq_hidden_story_users_pair"),
    )


def downgrade() -> None:
    bind = op.get_bind()
    if _has_table(bind, "hidden_story_users"):
        op.drop_table("hidden_story_users")
