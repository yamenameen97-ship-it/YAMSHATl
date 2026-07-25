"""
Shop router — إدارة إعلانات صفحة التسوق عبر API عام
يحل مشكلة: "الإعلان الذي أنشره لا يظهر لدى بقية المشتركين"
السبب السابق: كان الفرونت يعتمد على localStorage فقط.
الآن أي إعلان يُنشَر يُخزَّن في قاعدة البيانات ويعرضه GET /api/shop/ads لكل المشتركين.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_current_user_optional, get_db
from app.models.shop_ad import ShopAd, ShopAdOrder
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)


def _safe_load_json(raw: Optional[str], default):
    if not raw:
        return default
    try:
        val = json.loads(raw)
        return val if val is not None else default
    except Exception:
        return default


def _serialize_ad(ad: ShopAd, me_username: Optional[str] = None) -> dict:
    liked_by = _safe_load_json(ad.liked_by_json, [])
    reactions = _safe_load_json(ad.reactions_json, {})
    return {
        "id": f"srv-{ad.id}",
        "server_id": ad.id,
        "seller": ad.seller_username or "",
        "sellerName": ad.seller_name or ad.seller_username or "",
        "name": ad.name,
        "price": float(ad.price or 0),
        "currency": ad.currency or "USD",
        "address": ad.address or "",
        "description": ad.description or "",
        "image": ad.image or "",
        "createdAt": int((ad.created_at or datetime.utcnow()).timestamp() * 1000),
        "likes": int(ad.likes or 0),
        "likedBy": liked_by if isinstance(liked_by, list) else [],
        "reactions": reactions if isinstance(reactions, dict) else {},
        "saved": False,
        "isMine": bool(me_username and ad.seller_username == me_username),
    }


# =====================================================================
# GET /api/shop/ads — كل الإعلانات النشطة (متاح لأي مستخدم مصادَق)
# =====================================================================
@router.get("/ads")
@router.get("/ads/")
def list_ads(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    q = (
        db.query(ShopAd)
        .filter(ShopAd.is_deleted.is_(False), ShopAd.is_active.is_(True))
        .order_by(desc(ShopAd.created_at))
        .offset(offset)
        .limit(limit)
    )
    ads = q.all()
    me = current_user.username if current_user else None
    return {
        "items": [_serialize_ad(a, me) for a in ads],
        "total": len(ads),
    }


# =====================================================================
# POST /api/shop/ads — نشر إعلان جديد
# =====================================================================
@router.post("/ads", status_code=status.HTTP_201_CREATED)
@router.post("/ads/", status_code=status.HTTP_201_CREATED)
def create_ad(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    name = str(payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="اسم المنتج مطلوب")

    try:
        price = float(payload.get("price") or 0)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="سعر غير صالح")
    if price <= 0:
        raise HTTPException(status_code=400, detail="أدخل سعراً صحيحاً")

    address = str(payload.get("address") or "").strip()
    if not address:
        raise HTTPException(status_code=400, detail="العنوان مطلوب")

    currency = str(payload.get("currency") or "USD").strip() or "USD"
    description = str(payload.get("description") or "").strip()
    image = str(payload.get("image") or "").strip()

    # حد أقصى بسيط لطول الوصف والصورة (data-url قد تكون ضخمة)
    if len(image) > 6_000_000:  # ~6MB
        raise HTTPException(status_code=413, detail="حجم الصورة كبير جداً")

    ad = ShopAd(
        seller_id=current_user.id,
        seller_username=current_user.username,
        seller_name=getattr(current_user, "display_name", None) or current_user.username,
        name=name,
        price=price,
        currency=currency,
        address=address,
        description=description,
        image=image,
        is_active=True,
        is_deleted=False,
        likes=0,
        liked_by_json="[]",
        reactions_json="{}",
    )
    db.add(ad)
    db.commit()
    db.refresh(ad)
    logger.info(f"[shop] user {current_user.username} published ad #{ad.id}: {name}")
    return _serialize_ad(ad, current_user.username)


# =====================================================================
# DELETE /api/shop/ads/{ad_id}
# =====================================================================
@router.delete("/ads/{ad_id}")
def delete_ad(
    ad_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ad = db.query(ShopAd).filter(ShopAd.id == ad_id).first()
    if not ad or ad.is_deleted:
        raise HTTPException(status_code=404, detail="الإعلان غير موجود")
    is_admin = bool(getattr(current_user, "is_admin", False) or getattr(current_user, "is_superuser", False))
    if ad.seller_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية حذف هذا الإعلان")
    ad.is_deleted = True
    ad.is_active = False
    ad.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True, "id": ad_id}


# =====================================================================
# POST /api/shop/ads/{ad_id}/like — إعجاب / إلغاء إعجاب
# =====================================================================
@router.post("/ads/{ad_id}/like")
def toggle_like(
    ad_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ad = db.query(ShopAd).filter(ShopAd.id == ad_id, ShopAd.is_deleted.is_(False)).first()
    if not ad:
        raise HTTPException(status_code=404, detail="الإعلان غير موجود")

    liked_by = _safe_load_json(ad.liked_by_json, [])
    if not isinstance(liked_by, list):
        liked_by = []
    uname = current_user.username
    if uname in liked_by:
        liked_by = [u for u in liked_by if u != uname]
        ad.likes = max(0, int(ad.likes or 0) - 1)
        liked_now = False
    else:
        liked_by.append(uname)
        ad.likes = int(ad.likes or 0) + 1
        liked_now = True
    ad.liked_by_json = json.dumps(liked_by, ensure_ascii=False)
    ad.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True, "liked": liked_now, "likes": ad.likes, "likedBy": liked_by}


# =====================================================================
# POST /api/shop/ads/{ad_id}/react — إضافة تفاعل (emoji)
# =====================================================================
@router.post("/ads/{ad_id}/react")
def react(
    ad_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    key = str(payload.get("key") or "").strip()
    if key not in {"like", "love", "wow", "fire"}:
        raise HTTPException(status_code=400, detail="نوع تفاعل غير صالح")

    ad = db.query(ShopAd).filter(ShopAd.id == ad_id, ShopAd.is_deleted.is_(False)).first()
    if not ad:
        raise HTTPException(status_code=404, detail="الإعلان غير موجود")

    reactions = _safe_load_json(ad.reactions_json, {})
    if not isinstance(reactions, dict):
        reactions = {}
    reactions[key] = int(reactions.get(key, 0)) + 1
    ad.reactions_json = json.dumps(reactions, ensure_ascii=False)
    ad.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True, "reactions": reactions}


# =====================================================================
# GET /api/shop/health — فحص سريع
# =====================================================================
@router.get("/health")
def health():
    return {"ok": True, "service": "shop", "ts": datetime.utcnow().isoformat()}
