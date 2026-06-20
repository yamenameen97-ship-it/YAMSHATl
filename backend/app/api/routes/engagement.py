"""
Engagement API Routes
=====================
- /api/engagement/tasks                 -> المهام اليومية
- /api/engagement/level                 -> مستوى المستخدم
- /api/engagement/host-level            -> مستوى المضيف
- /api/engagement/achievements          -> الشارات
- /api/engagement/wheel/spin            -> عجلة الحظ
- /api/engagement/referral              -> كود الإحالة
- /api/engagement/shop                  -> المتجر
- /api/engagement/inventory             -> مخزون المستخدم
- /api/engagement/equip                 -> تجهيز عنصر
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.engagement import (
    Achievement, UserAchievement, ShopItem, UserInventory,
    LuckyWheelPrize, ReferralCode, Referral,
)
from app.services import engagement_service as svc

router = APIRouter(tags=["engagement"])


# ============== مهام يومية ==============
@router.get("/tasks")
def get_tasks(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return {"tasks": svc.get_today_tasks(db, user.id)}


@router.post("/tasks/{task_id}/claim")
def claim_task_reward(task_id: int, db: Session = Depends(get_db),
                       user: User = Depends(get_current_user)):
    res = svc.claim_task(db, user.id, task_id)
    if not res.get("ok"):
        raise HTTPException(400, res.get("error", "claim_failed"))
    return res


# ============== مستوى المستخدم ==============
@router.get("/level")
def my_level(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ul = svc.get_or_create_user_level(db, user.id)
    return {
        "level": ul.level, "xp": ul.xp, "total_xp": ul.total_xp,
        "next_level_xp": ul.next_level_xp,
        "title": ul.title, "badge_color": ul.badge_color,
        "progress_pct": round((ul.xp / max(1, ul.next_level_xp)) * 100, 1),
    }


# ============== شارات الإنجازات ==============
@router.get("/achievements")
def get_achievements(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return {"achievements": svc.list_user_achievements(db, user.id)}


@router.post("/achievements/{achievement_id}/pin")
def pin_achievement(achievement_id: int, pinned: bool = True,
                    db: Session = Depends(get_db),
                    user: User = Depends(get_current_user)):
    ua = db.execute(select(UserAchievement).where(
        UserAchievement.user_id == user.id,
        UserAchievement.achievement_id == achievement_id,
    )).scalar_one_or_none()
    if not ua:
        raise HTTPException(404, "not_unlocked")
    ua.is_pinned = pinned
    db.commit()
    return {"ok": True, "pinned": pinned}


# ============== عجلة الحظ ==============
@router.get("/wheel")
def wheel_state(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    prizes = db.execute(select(LuckyWheelPrize).where(
        LuckyWheelPrize.is_active.is_(True)
    )).scalars().all()
    return {
        "free_spin_available": svc.can_spin_free_today(db, user.id),
        "spin_cost_coins": 100,
        "prizes": [
            {
                "id": p.id, "label": p.label, "type": p.prize_type,
                "value": p.prize_value, "color": p.color, "icon": p.icon,
            } for p in prizes
        ],
    }


@router.post("/wheel/spin")
def wheel_spin(paid: bool = False, db: Session = Depends(get_db),
               user: User = Depends(get_current_user)):
    res = svc.spin_lucky_wheel(db, user.id, paid=paid)
    if not res.get("ok"):
        raise HTTPException(400, res.get("error", "spin_failed"))
    return res


# ============== الإحالة ==============
@router.get("/referral")
def my_referral(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rc = svc.get_or_create_referral_code(db, user.id)
    referred = db.execute(select(Referral).where(Referral.referrer_id == user.id)).scalars().all()
    return {
        "code": rc.code,
        "share_url": f"https://yamshat.app/ref/{rc.code}",
        "uses_count": rc.uses_count,
        "total_earned_coins": rc.total_earned_coins,
        "referrer_reward": svc.REFERRER_REWARD,
        "referred_reward": svc.REFERRED_REWARD,
        "referrals": [
            {"id": r.id, "referred_id": r.referred_id, "status": r.status,
             "created_at": r.created_at.isoformat()} for r in referred
        ],
    }


@router.post("/referral/apply")
def apply_referral(code: str, db: Session = Depends(get_db),
                   user: User = Depends(get_current_user)):
    res = svc.apply_referral_code(db, user.id, code)
    if not res.get("ok"):
        raise HTTPException(400, res.get("error", "invalid"))
    return res


# ============== المتجر ==============
@router.get("/shop")
def shop_items(item_type: Optional[str] = Query(None),
               category: Optional[str] = Query(None),
               db: Session = Depends(get_db),
               user: User = Depends(get_current_user)):
    items = svc.list_shop_items(db, item_type=item_type, category=category)
    owned_ids = {
        i.item_id for i in db.execute(
            select(UserInventory).where(UserInventory.user_id == user.id)
        ).scalars().all()
    }
    return {
        "items": [
            {
                "id": it.id, "code": it.code, "name": it.name,
                "description": it.description, "item_type": it.item_type,
                "category": it.category, "image_url": it.image_url,
                "preview_url": it.preview_url, "style": it.style,
                "price_coins": it.price_coins, "price_diamonds": it.price_diamonds,
                "rarity": it.rarity, "required_level": it.required_level,
                "is_vip_only": it.is_vip_only, "is_limited": it.is_limited,
                "duration_days": it.duration_days,
                "owned": it.id in owned_ids,
            } for it in items
        ]
    }


@router.post("/shop/{item_id}/buy")
def buy_item(item_id: int, db: Session = Depends(get_db),
             user: User = Depends(get_current_user)):
    res = svc.purchase_item(db, user.id, item_id)
    if not res.get("ok"):
        raise HTTPException(400, res.get("error", "purchase_failed"))
    return res


# ============== المخزون والتجهيز ==============
@router.get("/inventory")
def my_inventory(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.execute(
        select(ShopItem, UserInventory).join(UserInventory,
            UserInventory.item_id == ShopItem.id
        ).where(UserInventory.user_id == user.id)
    ).all()
    return {
        "items": [
            {
                "id": it.id, "code": it.code, "name": it.name,
                "item_type": it.item_type, "image_url": it.image_url,
                "style": it.style, "rarity": it.rarity,
                "is_equipped": inv.is_equipped,
                "acquired_at": inv.acquired_at.isoformat(),
                "expires_at": inv.expires_at.isoformat() if inv.expires_at else None,
                "source": inv.source,
            } for it, inv in rows
        ],
        "equipped": svc.get_equipped_items(db, user.id),
    }


@router.post("/inventory/{item_id}/equip")
def equip(item_id: int, db: Session = Depends(get_db),
          user: User = Depends(get_current_user)):
    res = svc.equip_item(db, user.id, item_id)
    if not res.get("ok"):
        raise HTTPException(400, res.get("error", "equip_failed"))
    return res
