"""engagement & gamification features

Revision ID: 20260610_0006
Revises: 20260605_0005
Create Date: 2026-06-10
"""
from alembic import op
import sqlalchemy as sa

revision = "20260610_0006"
down_revision = "20260605_0005"
branch_labels = None
depends_on = None


def upgrade():
    # ---- daily_tasks ----
    op.create_table(
        "daily_tasks",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("code", sa.String(60), nullable=False, unique=True, index=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("icon", sa.String(255), nullable=True),
        sa.Column("reward_coins", sa.Integer, nullable=False, server_default="0"),
        sa.Column("reward_xp", sa.Integer, nullable=False, server_default="0"),
        sa.Column("target_count", sa.Integer, nullable=False, server_default="1"),
        sa.Column("category", sa.String(40), nullable=False, server_default="general"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "user_daily_tasks",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("task_id", sa.Integer, sa.ForeignKey("daily_tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("task_date", sa.Date, nullable=False),
        sa.Column("progress", sa.Integer, nullable=False, server_default="0"),
        sa.Column("completed", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("claimed", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("completed_at", sa.DateTime, nullable=True),
        sa.Column("claimed_at", sa.DateTime, nullable=True),
        sa.UniqueConstraint("user_id", "task_id", "task_date", name="uq_user_task_date"),
    )
    op.create_index("idx_udt_user_date", "user_daily_tasks", ["user_id", "task_date"])

    # ---- user_levels ----
    op.create_table(
        "user_levels",
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("level", sa.Integer, nullable=False, server_default="1"),
        sa.Column("xp", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_xp", sa.Integer, nullable=False, server_default="0"),
        sa.Column("title", sa.String(80), nullable=False, server_default="مبتدئ"),
        sa.Column("badge_color", sa.String(20), nullable=False, server_default="#9CA3AF"),
        sa.Column("next_level_xp", sa.Integer, nullable=False, server_default="100"),
        sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )

    # ---- host_levels ----
    op.create_table(
        "host_levels",
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("level", sa.Integer, nullable=False, server_default="1"),
        sa.Column("host_xp", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_diamonds_received", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_live_minutes", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_viewers", sa.Integer, nullable=False, server_default="0"),
        sa.Column("title", sa.String(80), nullable=False, server_default="مضيف جديد"),
        sa.Column("badge_icon", sa.String(255), nullable=True),
        sa.Column("next_level_xp", sa.Integer, nullable=False, server_default="500"),
        sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )

    # ---- achievements ----
    op.create_table(
        "achievements",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("code", sa.String(60), unique=True, nullable=False),
        sa.Column("title", sa.String(150), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("icon", sa.String(255), nullable=True),
        sa.Column("rarity", sa.String(20), nullable=False, server_default="common"),
        sa.Column("reward_coins", sa.Integer, nullable=False, server_default="0"),
        sa.Column("reward_xp", sa.Integer, nullable=False, server_default="0"),
        sa.Column("condition_json", sa.JSON, nullable=True),
        sa.Column("is_hidden", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "user_achievements",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("achievement_id", sa.Integer, sa.ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False),
        sa.Column("unlocked_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("is_pinned", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("progress", sa.Integer, nullable=False, server_default="0"),
        sa.UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )

    # ---- shop_items (needed before lucky_wheel_prizes FK) ----
    op.create_table(
        "shop_items",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("code", sa.String(80), unique=True, nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("item_type", sa.String(40), nullable=False, index=True),
        sa.Column("category", sa.String(40), nullable=False, server_default="general"),
        sa.Column("image_url", sa.String(500), nullable=False),
        sa.Column("preview_url", sa.String(500), nullable=True),
        sa.Column("style", sa.String(40), nullable=False, server_default="static"),
        sa.Column("price_coins", sa.Integer, nullable=False, server_default="0"),
        sa.Column("price_diamonds", sa.Integer, nullable=False, server_default="0"),
        sa.Column("rarity", sa.String(20), nullable=False, server_default="common"),
        sa.Column("required_level", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_vip_only", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("is_limited", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("duration_days", sa.Integer, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "user_inventory",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("item_id", sa.Integer, sa.ForeignKey("shop_items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("is_equipped", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("acquired_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime, nullable=True),
        sa.Column("source", sa.String(40), nullable=False, server_default="purchase"),
        sa.UniqueConstraint("user_id", "item_id", name="uq_user_item"),
    )
    op.create_index("idx_inv_equipped", "user_inventory", ["user_id", "is_equipped"])

    # ---- lucky wheel ----
    op.create_table(
        "lucky_wheel_prizes",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("label", sa.String(80), nullable=False),
        sa.Column("prize_type", sa.String(40), nullable=False),
        sa.Column("prize_value", sa.Integer, nullable=False, server_default="0"),
        sa.Column("item_id", sa.Integer, sa.ForeignKey("shop_items.id", ondelete="SET NULL"), nullable=True),
        sa.Column("icon", sa.String(255), nullable=True),
        sa.Column("color", sa.String(20), nullable=False, server_default="#F59E0B"),
        sa.Column("probability_weight", sa.Float, nullable=False, server_default="1.0"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
    )
    op.create_table(
        "lucky_wheel_spins",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("prize_id", sa.Integer, sa.ForeignKey("lucky_wheel_prizes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("spin_cost", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_free_spin", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("prize_snapshot", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now(), index=True),
    )

    # ---- referrals ----
    op.create_table(
        "referral_codes",
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("code", sa.String(20), unique=True, nullable=False, index=True),
        sa.Column("uses_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_earned_coins", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "referrals",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("referrer_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("referred_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("code_used", sa.String(20), nullable=True),
        sa.Column("reward_paid", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("referrer_coins_awarded", sa.Integer, nullable=False, server_default="0"),
        sa.Column("referred_coins_awarded", sa.Integer, nullable=False, server_default="0"),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("validated_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )

    # ---- voice rooms ----
    op.create_table(
        "voice_rooms",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("owner_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("cover_image", sa.String(500), nullable=True),
        sa.Column("background_id", sa.Integer, sa.ForeignKey("shop_items.id", ondelete="SET NULL"), nullable=True),
        sa.Column("category", sa.String(60), nullable=False, server_default="general", index=True),
        sa.Column("language", sa.String(10), nullable=False, server_default="ar"),
        sa.Column("seats_count", sa.Integer, nullable=False, server_default="8"),
        sa.Column("max_listeners", sa.Integer, nullable=False, server_default="1000"),
        sa.Column("is_private", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true(), index=True),
        sa.Column("agora_channel", sa.String(120), unique=True, nullable=True),
        sa.Column("current_listeners", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_visits", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_gifts_value", sa.Integer, nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("ended_at", sa.DateTime, nullable=True),
    )
    op.create_table(
        "voice_room_members",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("room_id", sa.Integer, sa.ForeignKey("voice_rooms.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("role", sa.String(20), nullable=False, server_default="listener"),
        sa.Column("seat_index", sa.Integer, nullable=True),
        sa.Column("is_muted", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("is_locked", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("joined_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("left_at", sa.DateTime, nullable=True),
        sa.UniqueConstraint("room_id", "seat_index", name="uq_room_seat"),
    )
    op.create_index("idx_vrm_active", "voice_room_members", ["room_id", "left_at"])

    op.create_table(
        "voice_room_messages",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("room_id", sa.Integer, sa.ForeignKey("voice_rooms.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("msg_type", sa.String(20), nullable=False, server_default="text"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    for t in [
        "voice_room_messages", "voice_room_members", "voice_rooms",
        "referrals", "referral_codes",
        "lucky_wheel_spins", "lucky_wheel_prizes",
        "user_inventory", "shop_items",
        "user_achievements", "achievements",
        "host_levels", "user_levels",
        "user_daily_tasks", "daily_tasks",
    ]:
        op.drop_table(t)
