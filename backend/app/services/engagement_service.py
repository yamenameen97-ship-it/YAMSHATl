"""
Engagement Service - منطق الأعمال للمهام، المستويات، الإنجازات، عجلة الحظ
"""
from datetime import datetime, date
from typing import Optional, Tuple, List
import random
import secrets
import string

from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from app.models.engagement import (
    DailyTask, UserDailyTask,
    UserLevel,
    Achievement, UserAchievement,
    LuckyWheelPrize, LuckyWheelSpin,
    ReferralCode, Referral,
    ShopItem, UserInventory,
)
from app.models.user_wallet import UserWallet


# ===================== مستويات المستخدم =====================
# منحنى XP تصاعدي: المستوى التالي يحتاج level^2 * 100
def xp_for_level(level: int) -> int:
    return int((level ** 2) * 100)


LEVEL_TITLES = [
    (1, "مبتدئ", "#9CA3AF"),
    (5, "نشيط", "#10B981"),
    (10, "محبوب", "#3B82F6"),
    (20, "نجم صاعد", "#8B5CF6"),
    (30, "نخبة", "#F59E0B"),
    (50, "أسطورة", "#EF4444"),
    (75, "إمبراطور", "#EC4899"),
    (100, "خالد", "#FBBF24"),
]


def get_or_create_user_level(db: Session, user_id: int) -> UserLevel:
    ul = db.get(UserLevel, user_id)
    if not ul:
        ul = UserLevel(user_id=user_id, level=1, xp=0, total_xp=0,
                       title="مبتدئ", badge_color="#9CA3AF",
                       next_level_xp=xp_for_level(2))
        db.add(ul)
        db.commit()
        db.refresh(ul)
    return ul


def _compute_title(level: int) -> Tuple[str, str]:
    title, color = "مبتدئ", "#9CA3AF"
    for min_lvl, t, c in LEVEL_TITLES:
        if level >= min_lvl:
            title, color = t, c
    return title, color


def add_user_xp(db: Session, user_id: int, amount: int) -> dict:
    """إضافة XP والتحقق من ترقية المستوى."""
    ul = get_or_create_user_level(db, user_id)
    ul.xp += amount
    ul.total_xp += amount
    leveled_up = False
    while ul.xp >= xp_for_level(ul.level + 1):
        ul.xp -= xp_for_level(ul.level + 1)
        ul.level += 1
        leveled_up = True
    ul.title, ul.badge_color = _compute_title(ul.level)
    ul.next_level_xp = xp_for_level(ul.level + 1)
    ul.updated_at = datetime.utcnow()
    db.commit()
    return {
        "level": ul.level, "xp": ul.xp, "next_level_xp": ul.next_level_xp,
        "title": ul.title, "badge_color": ul.badge_color, "leveled_up": leveled_up
    }


# ===================== المهام اليومية =====================
def get_today_tasks(db: Session, user_id: int) -> List[dict]:
    today = date.today()
    tasks = db.execute(
        select(DailyTask).where(DailyTask.is_active.is_(True))
        .order_by(DailyTask.sort_order)
    ).scalars().all()

    user_states = {
        ut.task_id: ut for ut in db.execute(
            select(UserDailyTask).where(
                and_(UserDailyTask.user_id == user_id,
                     UserDailyTask.task_date == today)
            )
        ).scalars().all()
    }

    out = []
    for t in tasks:
        st = user_states.get(t.id)
        out.append({
            "id": t.id, "code": t.code, "title": t.title, "description": t.description,
            "icon": t.icon, "category": t.category,
            "reward_coins": t.reward_coins, "reward_xp": t.reward_xp,
            "target_count": t.target_count,
            "progress": st.progress if st else 0,
            "completed": st.completed if st else False,
            "claimed": st.claimed if st else False,
        })
    return out


def increment_task_progress(db: Session, user_id: int, task_code: str, inc: int = 1) -> Optional[dict]:
    """يستدعى من أي نقطة في النظام عند حدث (نشر، إعجاب، بث...).
    يبحث عن المهمة بالكود ويزيد التقدم."""
    today = date.today()
    task = db.execute(select(DailyTask).where(DailyTask.code == task_code)).scalar_one_or_none()
    if not task or not task.is_active:
        return None
    udt = db.execute(
        select(UserDailyTask).where(and_(
            UserDailyTask.user_id == user_id,
            UserDailyTask.task_id == task.id,
            UserDailyTask.task_date == today,
        ))
    ).scalar_one_or_none()
    if not udt:
        udt = UserDailyTask(user_id=user_id, task_id=task.id, task_date=today, progress=0)
        db.add(udt)
    if udt.completed:
        return {"task_code": task_code, "completed": True, "progress": udt.progress}
    udt.progress = min(udt.progress + inc, task.target_count)
    if udt.progress >= task.target_count and not udt.completed:
        udt.completed = True
        udt.completed_at = datetime.utcnow()
    db.commit()
    return {"task_code": task_code, "completed": udt.completed, "progress": udt.progress,
            "target": task.target_count}


def claim_task(db: Session, user_id: int, task_id: int) -> dict:
    today = date.today()
    udt = db.execute(select(UserDailyTask).where(and_(
        UserDailyTask.user_id == user_id,
        UserDailyTask.task_id == task_id,
        UserDailyTask.task_date == today,
    ))).scalar_one_or_none()
    if not udt or not udt.completed:
        return {"ok": False, "error": "task_not_completed"}
    if udt.claimed:
        return {"ok": False, "error": "already_claimed"}
    task = db.get(DailyTask, task_id)
    udt.claimed = True
    udt.claimed_at = datetime.utcnow()

    # دفع المكافآت
    wallet = db.execute(select(UserWallet).where(UserWallet.user_id == user_id)).scalar_one_or_none()
    if wallet and task.reward_coins:
        wallet.coins = (wallet.coins or 0) + task.reward_coins
    db.commit()
    level_info = add_user_xp(db, user_id, task.reward_xp) if task.reward_xp else None
    return {"ok": True, "reward_coins": task.reward_coins,
            "reward_xp": task.reward_xp, "level_info": level_info}


# ===================== شارات الإنجازات =====================
def unlock_achievement(db: Session, user_id: int, code: str) -> Optional[dict]:
    ach = db.execute(select(Achievement).where(Achievement.code == code)).scalar_one_or_none()
    if not ach:
        return None
    exists = db.execute(select(UserAchievement).where(and_(
        UserAchievement.user_id == user_id,
        UserAchievement.achievement_id == ach.id,
    ))).scalar_one_or_none()
    if exists:
        return None
    ua = UserAchievement(user_id=user_id, achievement_id=ach.id)
    db.add(ua)
    # دفع مكافآت الشارة
    wallet = db.execute(select(UserWallet).where(UserWallet.user_id == user_id)).scalar_one_or_none()
    if wallet and ach.reward_coins:
        wallet.coins = (wallet.coins or 0) + ach.reward_coins
    db.commit()
    if ach.reward_xp:
        add_user_xp(db, user_id, ach.reward_xp)
    return {"id": ach.id, "code": ach.code, "title": ach.title,
            "icon": ach.icon, "rarity": ach.rarity,
            "reward_coins": ach.reward_coins, "reward_xp": ach.reward_xp}


def list_user_achievements(db: Session, user_id: int) -> List[dict]:
    rows = db.execute(
        select(Achievement, UserAchievement)
        .join(UserAchievement,
              UserAchievement.achievement_id == Achievement.id,
              isouter=True)
        .where((UserAchievement.user_id == user_id) | (UserAchievement.user_id.is_(None)))
    ).all()
    seen = set()
    out = []
    for ach, ua in rows:
        if ach.id in seen:
            continue
        seen.add(ach.id)
        if ach.is_hidden and not ua:
            continue
        out.append({
            "id": ach.id, "code": ach.code, "title": ach.title,
            "description": ach.description, "icon": ach.icon,
            "rarity": ach.rarity, "reward_coins": ach.reward_coins,
            "reward_xp": ach.reward_xp,
            "unlocked": ua is not None,
            "unlocked_at": ua.unlocked_at.isoformat() if ua else None,
            "is_pinned": ua.is_pinned if ua else False,
        })
    return out


# ===================== عجلة الحظ =====================
DAILY_FREE_SPIN_TASK = "wheel_free_spin"


def can_spin_free_today(db: Session, user_id: int) -> bool:
    today_start = datetime.combine(date.today(), datetime.min.time())
    used = db.execute(select(LuckyWheelSpin).where(and_(
        LuckyWheelSpin.user_id == user_id,
        LuckyWheelSpin.is_free_spin.is_(True),
        LuckyWheelSpin.created_at >= today_start,
    ))).first()
    return used is None


def spin_lucky_wheel(db: Session, user_id: int, paid: bool = False) -> dict:
    if not paid and not can_spin_free_today(db, user_id):
        return {"ok": False, "error": "free_spin_used_today"}

    prizes = db.execute(select(LuckyWheelPrize).where(LuckyWheelPrize.is_active.is_(True))).scalars().all()
    if not prizes:
        return {"ok": False, "error": "no_prizes_configured"}

    SPIN_COST = 100  # تكلفة الدوران المدفوع
    wallet = db.execute(select(UserWallet).where(UserWallet.user_id == user_id)).scalar_one_or_none()
    if paid:
        if not wallet or (wallet.coins or 0) < SPIN_COST:
            return {"ok": False, "error": "insufficient_coins"}
        wallet.coins -= SPIN_COST

    # اختيار جائزة بناءً على الوزن
    weights = [p.probability_weight for p in prizes]
    chosen = random.choices(prizes, weights=weights, k=1)[0]

    # تسجيل الدوران
    spin = LuckyWheelSpin(
        user_id=user_id, prize_id=chosen.id,
        spin_cost=SPIN_COST if paid else 0,
        is_free_spin=not paid,
        prize_snapshot={
            "label": chosen.label, "type": chosen.prize_type,
            "value": chosen.prize_value, "color": chosen.color,
        }
    )
    db.add(spin)

    # تطبيق الجائزة
    awarded = {"type": chosen.prize_type, "value": chosen.prize_value, "label": chosen.label}
    if chosen.prize_type == "coins":
        if wallet:
            wallet.coins = (wallet.coins or 0) + chosen.prize_value
    elif chosen.prize_type == "xp":
        db.commit()
        add_user_xp(db, user_id, chosen.prize_value)
    elif chosen.prize_type in ("frame", "avatar", "background", "effect", "item") and chosen.item_id:
        # منح العنصر
        existing = db.execute(select(UserInventory).where(and_(
            UserInventory.user_id == user_id,
            UserInventory.item_id == chosen.item_id,
        ))).scalar_one_or_none()
        if not existing:
            db.add(UserInventory(user_id=user_id, item_id=chosen.item_id, source="wheel"))
        awarded["item_id"] = chosen.item_id

    db.commit()
    return {"ok": True, "prize": awarded, "prize_id": chosen.id}


# ===================== الإحالة =====================
def generate_referral_code(length: int = 8) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def get_or_create_referral_code(db: Session, user_id: int) -> ReferralCode:
    rc = db.get(ReferralCode, user_id)
    if rc:
        return rc
    # تأكد من الفرادة
    for _ in range(10):
        code = generate_referral_code()
        exists = db.execute(select(ReferralCode).where(ReferralCode.code == code)).first()
        if not exists:
            break
    rc = ReferralCode(user_id=user_id, code=code)
    db.add(rc)
    db.commit()
    db.refresh(rc)
    return rc


REFERRER_REWARD = 500
REFERRED_REWARD = 200


def apply_referral_code(db: Session, new_user_id: int, code: str) -> dict:
    """يُستدعى عند تسجيل مستخدم جديد بكود إحالة."""
    if not code:
        return {"ok": False, "error": "no_code"}
    rc = db.execute(select(ReferralCode).where(ReferralCode.code == code.upper())).scalar_one_or_none()
    if not rc:
        return {"ok": False, "error": "invalid_code"}
    if rc.user_id == new_user_id:
        return {"ok": False, "error": "self_referral"}
    # تأكد لا يوجد تسجيل مسبق
    exists = db.execute(select(Referral).where(Referral.referred_id == new_user_id)).scalar_one_or_none()
    if exists:
        return {"ok": False, "error": "already_referred"}

    ref = Referral(
        referrer_id=rc.user_id, referred_id=new_user_id,
        code_used=code.upper(), status="validated",
        validated_at=datetime.utcnow(),
        referrer_coins_awarded=REFERRER_REWARD,
        referred_coins_awarded=REFERRED_REWARD,
        reward_paid=True,
    )
    db.add(ref)
    rc.uses_count += 1
    rc.total_earned_coins += REFERRER_REWARD

    # دفع المكافآت لكلا الطرفين
    for uid, amount in [(rc.user_id, REFERRER_REWARD), (new_user_id, REFERRED_REWARD)]:
        w = db.execute(select(UserWallet).where(UserWallet.user_id == uid)).scalar_one_or_none()
        if w:
            w.coins = (w.coins or 0) + amount
    db.commit()
    return {"ok": True, "referrer_reward": REFERRER_REWARD,
            "referred_reward": REFERRED_REWARD}


# ===================== المتجر =====================
def list_shop_items(db: Session, item_type: Optional[str] = None,
                    category: Optional[str] = None) -> List[ShopItem]:
    stmt = select(ShopItem).where(ShopItem.is_active.is_(True))
    if item_type:
        stmt = stmt.where(ShopItem.item_type == item_type)
    if category:
        stmt = stmt.where(ShopItem.category == category)
    return db.execute(stmt.order_by(ShopItem.sort_order, ShopItem.id)).scalars().all()


def purchase_item(db: Session, user_id: int, item_id: int) -> dict:
    item = db.get(ShopItem, item_id)
    if not item or not item.is_active:
        return {"ok": False, "error": "item_not_found"}

    # مالك مسبقاً؟
    owned = db.execute(select(UserInventory).where(and_(
        UserInventory.user_id == user_id,
        UserInventory.item_id == item_id,
    ))).scalar_one_or_none()
    if owned and not item.duration_days:
        return {"ok": False, "error": "already_owned"}

    # تحقق من المستوى
    ul = get_or_create_user_level(db, user_id)
    if ul.level < item.required_level:
        return {"ok": False, "error": "level_too_low",
                "required_level": item.required_level}

    wallet = db.execute(select(UserWallet).where(UserWallet.user_id == user_id)).scalar_one_or_none()
    if not wallet:
        return {"ok": False, "error": "no_wallet"}

    if item.price_diamonds > 0:
        if (wallet.diamonds or 0) < item.price_diamonds:
            return {"ok": False, "error": "insufficient_diamonds"}
        wallet.diamonds -= item.price_diamonds
    elif item.price_coins > 0:
        if (wallet.coins or 0) < item.price_coins:
            return {"ok": False, "error": "insufficient_coins"}
        wallet.coins -= item.price_coins

    expires_at = None
    if item.duration_days:
        from datetime import timedelta
        expires_at = datetime.utcnow() + timedelta(days=item.duration_days)

    if owned:
        owned.expires_at = expires_at
        owned.acquired_at = datetime.utcnow()
    else:
        db.add(UserInventory(user_id=user_id, item_id=item_id,
                             source="purchase", expires_at=expires_at))
    db.commit()
    return {"ok": True, "item_id": item_id, "expires_at": expires_at.isoformat() if expires_at else None}


def equip_item(db: Session, user_id: int, item_id: int) -> dict:
    inv = db.execute(select(UserInventory).where(and_(
        UserInventory.user_id == user_id,
        UserInventory.item_id == item_id,
    ))).scalar_one_or_none()
    if not inv:
        return {"ok": False, "error": "not_owned"}
    item = db.get(ShopItem, item_id)
    # تجريد العناصر الأخرى من نفس النوع
    others = db.execute(select(UserInventory).join(ShopItem).where(and_(
        UserInventory.user_id == user_id,
        UserInventory.is_equipped.is_(True),
        ShopItem.item_type == item.item_type,
    ))).scalars().all()
    for o in others:
        o.is_equipped = False
    inv.is_equipped = True
    db.commit()
    return {"ok": True, "equipped_item": item_id, "type": item.item_type}


def get_equipped_items(db: Session, user_id: int) -> dict:
    rows = db.execute(
        select(ShopItem, UserInventory).join(UserInventory,
            UserInventory.item_id == ShopItem.id).where(and_(
            UserInventory.user_id == user_id,
            UserInventory.is_equipped.is_(True),
        ))
    ).all()
    out = {}
    for item, _inv in rows:
        out[item.item_type] = {
            "id": item.id, "code": item.code, "name": item.name,
            "image_url": item.image_url, "style": item.style,
        }
    return out
