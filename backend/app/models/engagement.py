"""
Yamshat Engagement & Gamification Models
=========================================
يحتوي على جميع نماذج الميزات الإضافية:
- المهام اليومية (DailyTask + UserDailyTask)
- مستويات المستخدم (UserLevel)
- مستويات المضيف (HostLevel)
- شارات الإنجازات (Achievement + UserAchievement)
- عجلة الحظ (LuckyWheelSpin)
- نظام الإحالة (Referral + ReferralCode)
- متجر الإطارات والصور الشخصية (ShopItem + UserInventory)
- خلفيات الحساب المميزة (ProfileBackground)
- الغرف الصوتية الجماعية (VoiceRoom + VoiceRoomMember)
"""
from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date, Float, ForeignKey,
    Text, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.db.base import Base


# ============================================================
# 1) مركز المهام اليومية
# ============================================================
class DailyTask(Base):
    __tablename__ = "daily_tasks"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(60), unique=True, nullable=False, index=True)  # login, post_create, send_gift...
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(255), nullable=True)
    reward_coins = Column(Integer, default=0, nullable=False)
    reward_xp = Column(Integer, default=0, nullable=False)
    target_count = Column(Integer, default=1, nullable=False)
    category = Column(String(40), default="general", nullable=False)  # social, host, viewer, daily
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class UserDailyTask(Base):
    __tablename__ = "user_daily_tasks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("daily_tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    task_date = Column(Date, default=date.today, nullable=False, index=True)
    progress = Column(Integer, default=0, nullable=False)
    completed = Column(Boolean, default=False, nullable=False, index=True)
    claimed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    claimed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "task_id", "task_date", name="uq_user_task_date"),
        Index("idx_udt_user_date", "user_id", "task_date"),
    )


# ============================================================
# 2) مستويات المستخدم
# ============================================================
class UserLevel(Base):
    __tablename__ = "user_levels"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                     primary_key=True, index=True)
    level = Column(Integer, default=1, nullable=False, index=True)
    xp = Column(Integer, default=0, nullable=False)
    total_xp = Column(Integer, default=0, nullable=False)
    title = Column(String(80), default="مبتدئ", nullable=False)
    badge_color = Column(String(20), default="#9CA3AF", nullable=False)
    next_level_xp = Column(Integer, default=100, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


# ============================================================
# 3) مستويات المضيف (Host Levels for live streamers)
# ============================================================
class HostLevel(Base):
    __tablename__ = "host_levels"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                     primary_key=True, index=True)
    level = Column(Integer, default=1, nullable=False, index=True)
    host_xp = Column(Integer, default=0, nullable=False)
    total_diamonds_received = Column(Integer, default=0, nullable=False)
    total_live_minutes = Column(Integer, default=0, nullable=False)
    total_viewers = Column(Integer, default=0, nullable=False)
    title = Column(String(80), default="مضيف جديد", nullable=False)
    badge_icon = Column(String(255), nullable=True)
    next_level_xp = Column(Integer, default=500, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


# ============================================================
# 4) شارات الإنجازات
# ============================================================
class Achievement(Base):
    __tablename__ = "achievements"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(60), unique=True, nullable=False, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(255), nullable=True)
    rarity = Column(String(20), default="common", nullable=False)  # common, rare, epic, legendary
    reward_coins = Column(Integer, default=0, nullable=False)
    reward_xp = Column(Integer, default=0, nullable=False)
    condition_json = Column(JSON, nullable=True)  # شروط فتح الشارة
    is_hidden = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    achievement_id = Column(Integer, ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False)
    unlocked_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    progress = Column(Integer, default=0, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )


# ============================================================
# 5) عجلة الحظ
# ============================================================
class LuckyWheelPrize(Base):
    __tablename__ = "lucky_wheel_prizes"
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(80), nullable=False)
    prize_type = Column(String(40), nullable=False)  # coins, frame, avatar, background, xp, item
    prize_value = Column(Integer, default=0, nullable=False)
    item_id = Column(Integer, ForeignKey("shop_items.id", ondelete="SET NULL"), nullable=True)
    icon = Column(String(255), nullable=True)
    color = Column(String(20), default="#F59E0B", nullable=False)
    probability_weight = Column(Float, default=1.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class LuckyWheelSpin(Base):
    __tablename__ = "lucky_wheel_spins"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    prize_id = Column(Integer, ForeignKey("lucky_wheel_prizes.id", ondelete="SET NULL"), nullable=True)
    spin_cost = Column(Integer, default=0, nullable=False)  # 0 if free daily spin
    is_free_spin = Column(Boolean, default=False, nullable=False)
    prize_snapshot = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


# ============================================================
# 6) نظام الإحالة وكود الإحالة
# ============================================================
class ReferralCode(Base):
    __tablename__ = "referral_codes"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                     primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    uses_count = Column(Integer, default=0, nullable=False)
    total_earned_coins = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Referral(Base):
    __tablename__ = "referrals"
    id = Column(Integer, primary_key=True, index=True)
    referrer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                         nullable=False, index=True)
    referred_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                         nullable=False, unique=True, index=True)
    code_used = Column(String(20), nullable=True)
    reward_paid = Column(Boolean, default=False, nullable=False)
    referrer_coins_awarded = Column(Integer, default=0, nullable=False)
    referred_coins_awarded = Column(Integer, default=0, nullable=False)
    status = Column(String(20), default="pending", nullable=False)  # pending, validated, paid
    validated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# ============================================================
# 7) متجر الإطارات والصور الشخصية + 8) خلفيات مميزة
# ============================================================
class ShopItem(Base):
    """عنصر متجر موحد: إطار / صورة شخصية / خلفية حساب / تأثير"""
    __tablename__ = "shop_items"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(80), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    # نوع العنصر: frame | avatar | background | effect | badge | entrance
    item_type = Column(String(40), nullable=False, index=True)
    category = Column(String(40), default="general", nullable=False)
    image_url = Column(String(500), nullable=False)
    preview_url = Column(String(500), nullable=True)
    # خاصية للخلفيات (animated, gradient, image, video)
    style = Column(String(40), default="static", nullable=False)
    # السعر بالعملات
    price_coins = Column(Integer, default=0, nullable=False)
    price_diamonds = Column(Integer, default=0, nullable=False)
    rarity = Column(String(20), default="common", nullable=False)  # common, rare, epic, legendary
    # مستوى مطلوب لشراء العنصر
    required_level = Column(Integer, default=0, nullable=False)
    # هل العنصر مجاني / VIP / حدث
    is_vip_only = Column(Boolean, default=False, nullable=False)
    is_limited = Column(Boolean, default=False, nullable=False)
    duration_days = Column(Integer, nullable=True)  # null = دائم
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class UserInventory(Base):
    """مخزون المستخدم من العناصر المملوكة (إطارات/خلفيات/...)"""
    __tablename__ = "user_inventory"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    item_id = Column(Integer, ForeignKey("shop_items.id", ondelete="CASCADE"), nullable=False, index=True)
    is_equipped = Column(Boolean, default=False, nullable=False, index=True)
    acquired_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    source = Column(String(40), default="purchase", nullable=False)  # purchase, gift, reward, wheel

    __table_args__ = (
        UniqueConstraint("user_id", "item_id", name="uq_user_item"),
        Index("idx_inv_equipped", "user_id", "is_equipped"),
    )


# ============================================================
# 9) الغرف الصوتية الجماعية
# ============================================================
class VoiceRoom(Base):
    __tablename__ = "voice_rooms"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    cover_image = Column(String(500), nullable=True)
    background_id = Column(Integer, ForeignKey("shop_items.id", ondelete="SET NULL"), nullable=True)
    category = Column(String(60), default="general", nullable=False, index=True)
    language = Column(String(10), default="ar", nullable=False)
    # عدد المقاعد المتاحة (عادة 8 أو 9)
    seats_count = Column(Integer, default=8, nullable=False)
    max_listeners = Column(Integer, default=1000, nullable=False)
    is_private = Column(Boolean, default=False, nullable=False)
    password_hash = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    agora_channel = Column(String(120), unique=True, nullable=True)
    current_listeners = Column(Integer, default=0, nullable=False)
    total_visits = Column(Integer, default=0, nullable=False)
    total_gifts_value = Column(Integer, default=0, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)


class VoiceRoomMember(Base):
    __tablename__ = "voice_room_members"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("voice_rooms.id", ondelete="CASCADE"),
                     nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                     nullable=False, index=True)
    role = Column(String(20), default="listener", nullable=False)  # owner, admin, speaker, listener
    seat_index = Column(Integer, nullable=True)  # موضع المقعد (0..N-1) للمتحدثين
    is_muted = Column(Boolean, default=False, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    left_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("room_id", "seat_index", name="uq_room_seat"),
        Index("idx_vrm_active", "room_id", "left_at"),
    )


class VoiceRoomMessage(Base):
    __tablename__ = "voice_room_messages"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("voice_rooms.id", ondelete="CASCADE"),
                     nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                     nullable=False, index=True)
    content = Column(Text, nullable=False)
    msg_type = Column(String(20), default="text", nullable=False)  # text, system, gift
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
