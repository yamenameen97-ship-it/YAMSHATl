"""link posts to live_room_sessions

Revision ID: 20260611_0007
Revises: 20260610_0006
Create Date: 2026-06-11

The Feed wrongly showed every old post by a broadcaster as "LIVE" because
the serializer attached active LiveRoomSession data to ALL posts of the host.
This migration introduces an explicit link column `live_room_id` on `posts`
so the serializer can attach live data only to the actual broadcast post,
and so an ended broadcast cleanly degrades to a regular video post.
"""
from alembic import op
import sqlalchemy as sa


revision = "20260611_0007"
down_revision = "20260610_0006"
branch_labels = None
depends_on = None


def _has_column(table: str, column: str) -> bool:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    try:
        cols = [c["name"] for c in insp.get_columns(table)]
    except Exception:
        return False
    return column in cols


def upgrade():
    # Idempotent additive change — safe to re-run on environments where
    # the column was added out-of-band.
    if not _has_column("posts", "live_room_id"):
        op.add_column(
            "posts",
            sa.Column("live_room_id", sa.String(64), nullable=True, index=True),
        )
        try:
            op.create_index(
                "ix_posts_live_room_id", "posts", ["live_room_id"], unique=False
            )
        except Exception:
            # index may already exist on some dialects via index=True above
            pass


def downgrade():
    try:
        op.drop_index("ix_posts_live_room_id", table_name="posts")
    except Exception:
        pass
    try:
        op.drop_column("posts", "live_room_id")
    except Exception:
        pass
