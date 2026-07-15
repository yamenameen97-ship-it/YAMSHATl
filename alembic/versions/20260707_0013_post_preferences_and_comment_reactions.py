"""post_preferences and comment_reactions tables (v83.8 posts audit)

Revision ID: 20260707_0013
Revises: 20260616_0012
Create Date: 2026-07-07
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260707_0013"
down_revision = "20260616_0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ============ post_preferences ============
    op.create_table(
        "post_preferences",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("is_hidden", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_muted_author", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_reported", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("report_reason", sa.String(length=200), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.UniqueConstraint("user_id", "post_id", name="uq_post_preferences_user_post"),
    )
    op.create_index("ix_post_preferences_user_id", "post_preferences", ["user_id"])
    op.create_index("ix_post_preferences_post_id", "post_preferences", ["post_id"])
    op.create_index("ix_post_preferences_is_hidden", "post_preferences", ["is_hidden"])
    op.create_index("ix_post_preferences_is_archived", "post_preferences", ["is_archived"])
    op.create_index("ix_post_preferences_user_flags", "post_preferences", ["user_id", "is_hidden", "is_archived"])

    # ============ comment_reactions ============
    op.create_table(
        "comment_reactions",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("comment_id", sa.Integer(), sa.ForeignKey("comments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("emoji", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.UniqueConstraint("user_id", "comment_id", name="uq_comment_reactions_user_comment"),
    )
    op.create_index("ix_comment_reactions_comment_id", "comment_reactions", ["comment_id"])
    op.create_index("ix_comment_reactions_user_id", "comment_reactions", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_comment_reactions_user_id", table_name="comment_reactions")
    op.drop_index("ix_comment_reactions_comment_id", table_name="comment_reactions")
    op.drop_table("comment_reactions")

    op.drop_index("ix_post_preferences_user_flags", table_name="post_preferences")
    op.drop_index("ix_post_preferences_is_archived", table_name="post_preferences")
    op.drop_index("ix_post_preferences_is_hidden", table_name="post_preferences")
    op.drop_index("ix_post_preferences_post_id", table_name="post_preferences")
    op.drop_index("ix_post_preferences_user_id", table_name="post_preferences")
    op.drop_table("post_preferences")
