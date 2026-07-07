"""stories cloud migration (v83.9 stories audit)

يضيف الأعمدة اللازمة لجدول stories حتى يمكن تخزين كل ما كان يُحفظ في
story_store.json مباشرة في Postgres. أعمدة جديدة:
- media_type, privacy, music, stickers, mentions
- poll_question, poll_options, poll_votes, poll_voters
- countdown_at, filter_name, drawing_data
- is_close_friends, highlight, highlight_title
- reactions, reactions_count, auto_delete_hours

ويضيف عمود username على story_views/story_replies لتجنب JOINs متكررة.
كذلك يضيف UNIQUE(story_id, user_id) على story_views لمنع التكرار.

Revision ID: 20260707_0014
Revises: 20260707_0013
Create Date: 2026-07-07
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "20260707_0014"
down_revision = "20260707_0013"
branch_labels = None
depends_on = None


def _has_column(bind, table: str, column: str) -> bool:
    inspector = sa.inspect(bind)
    try:
        cols = [c["name"] for c in inspector.get_columns(table)]
    except Exception:
        return False
    return column in cols


def _has_index(bind, table: str, index_name: str) -> bool:
    inspector = sa.inspect(bind)
    try:
        idxs = [i["name"] for i in inspector.get_indexes(table)]
    except Exception:
        return False
    return index_name in idxs


def _has_constraint(bind, table: str, name: str) -> bool:
    inspector = sa.inspect(bind)
    try:
        uqs = [u["name"] for u in inspector.get_unique_constraints(table)]
    except Exception:
        return False
    return name in uqs


def upgrade() -> None:
    bind = op.get_bind()

    # ================== stories ==================
    new_cols = [
        ("media_type", sa.Column("media_type", sa.String(length=16), nullable=False, server_default="image")),
        ("privacy", sa.Column("privacy", sa.String(length=24), nullable=False, server_default="friends")),
        ("music", sa.Column("music", sa.String(length=200), nullable=True)),
        ("stickers", sa.Column("stickers", sa.Text(), nullable=True)),
        ("mentions", sa.Column("mentions", sa.Text(), nullable=True)),
        ("poll_question", sa.Column("poll_question", sa.String(length=200), nullable=True)),
        ("poll_options", sa.Column("poll_options", sa.Text(), nullable=True)),
        ("poll_votes", sa.Column("poll_votes", sa.Text(), nullable=True)),
        ("poll_voters", sa.Column("poll_voters", sa.Text(), nullable=True)),
        ("countdown_at", sa.Column("countdown_at", sa.String(length=64), nullable=True)),
        ("filter_name", sa.Column("filter_name", sa.String(length=80), nullable=True)),
        ("drawing_data", sa.Column("drawing_data", sa.Text(), nullable=True)),
        ("is_close_friends", sa.Column("is_close_friends", sa.Boolean(), nullable=False, server_default=sa.text("false"))),
        ("highlight", sa.Column("highlight", sa.Boolean(), nullable=False, server_default=sa.text("false"))),
        ("highlight_title", sa.Column("highlight_title", sa.String(length=80), nullable=True)),
        ("reactions", sa.Column("reactions", sa.Text(), nullable=True)),
        ("reactions_count", sa.Column("reactions_count", sa.Integer(), nullable=False, server_default="0")),
        ("auto_delete_hours", sa.Column("auto_delete_hours", sa.Integer(), nullable=False, server_default="24")),
    ]
    for name, col in new_cols:
        if not _has_column(bind, "stories", name):
            op.add_column("stories", col)

    if not _has_index(bind, "stories", "ix_stories_privacy"):
        op.create_index("ix_stories_privacy", "stories", ["privacy"])
    if not _has_index(bind, "stories", "ix_stories_highlight"):
        op.create_index("ix_stories_highlight", "stories", ["highlight"])
    if not _has_index(bind, "stories", "ix_stories_user_created"):
        op.create_index("ix_stories_user_created", "stories", ["user_id", "created_at"])

    # ================== story_views ==================
    if not _has_column(bind, "story_views", "username"):
        op.add_column("story_views", sa.Column("username", sa.String(length=150), nullable=True))
    if not _has_constraint(bind, "story_views", "uq_story_views_story_user"):
        try:
            op.create_unique_constraint(
                "uq_story_views_story_user", "story_views", ["story_id", "user_id"]
            )
        except Exception:
            # قد يكون هناك سجلات مكررة موجودة — نحذف التكرار أولاً
            op.execute(
                """
                DELETE FROM story_views
                WHERE id NOT IN (
                    SELECT MIN(id) FROM story_views GROUP BY story_id, user_id
                )
                """
            )
            op.create_unique_constraint(
                "uq_story_views_story_user", "story_views", ["story_id", "user_id"]
            )

    # ================== story_replies ==================
    if not _has_column(bind, "story_replies", "username"):
        op.add_column("story_replies", sa.Column("username", sa.String(length=150), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()

    # story_replies
    if _has_column(bind, "story_replies", "username"):
        op.drop_column("story_replies", "username")

    # story_views
    if _has_constraint(bind, "story_views", "uq_story_views_story_user"):
        op.drop_constraint("uq_story_views_story_user", "story_views", type_="unique")
    if _has_column(bind, "story_views", "username"):
        op.drop_column("story_views", "username")

    # stories indexes
    for idx in ("ix_stories_user_created", "ix_stories_highlight", "ix_stories_privacy"):
        if _has_index(bind, "stories", idx):
            op.drop_index(idx, table_name="stories")

    for col in (
        "auto_delete_hours", "reactions_count", "reactions",
        "highlight_title", "highlight", "is_close_friends",
        "drawing_data", "filter_name", "countdown_at",
        "poll_voters", "poll_votes", "poll_options", "poll_question",
        "mentions", "stickers", "music", "privacy", "media_type",
    ):
        if _has_column(bind, "stories", col):
            op.drop_column("stories", col)
