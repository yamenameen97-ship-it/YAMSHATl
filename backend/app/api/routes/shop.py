"""
Shop router — إدارة إعلانات صفحة التسوق عبر API عام
يحل مشكلة: "الإعلان الذي أنشره لا يظهر لدى بقية المشتركين"
السبب السابق: كان الفرونت يعتمد على localStorage فقط.
الآن أي إعلان يُنشَر يُخزَّن في قاعدة البيانات ويعرضه GET /api/shop/ads لكل المشتركين.

v89.29 ROOT FIX — إضافات:
  * POST /api/shop/ads/{ad_id}/order         → إنشاء طلب مع حجز مخزون (concurrency-safe)
  * GET  /api/shop/orders                    → استعراض طلبات المستخدم (buyer/seller)
  * POST /api/shop/orders/{id}/attach-payment→ ربط PaymentIntent الخارجي بالطلب
  * POST /api/shop/webhook/{provider}        → استقبال webhooks كل بوابات الدفع
  * PATCH /api/shop/ads/{ad_id}/inventory    → تعديل المخزون من قبل البائع
  * GET  /api/shop/ads/{ad_id}/inventory     → استعلام المخزون الحالي
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query, Request, status
from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_current_user_optional, get_db
from app.models.shop_ad import ShopAd, ShopAdOrder, ShopPaymentEvent
from app.models.user import User
from app.services import payment_service

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
    available = None
    if ad.track_inventory:
        available = max(0, int(ad.stock or 0) - int(ad.reserved or 0) - int(ad.sold or 0))
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
        # v89.29 — بيانات المخزون
        "trackInventory": bool(ad.track_inventory),
        "stock": int(ad.stock or 0),
        "reserved": int(ad.reserved or 0),
        "sold": int(ad.sold or 0),
        "available": available,
        "lowStockThreshold": int(ad.low_stock_threshold or 0),
        "paymentProvider": ad.payment_provider or "none",
    }


def _serialize_order(order: ShopAdOrder) -> dict:
    return {
        "id": order.id,
        "adId": order.ad_id,
        "buyer": order.buyer_username,
        "buyerName": order.buyer_name,
        "contact": order.contact,
        "quantity": int(order.quantity or 0),
        "message": order.message or "",
        "status": order.status,
        "paymentStatus": order.payment_status,
        "paymentProvider": order.payment_provider,
        "paymentRef": order.payment_ref,
        "amountTotal": float(order.amount_total or 0),
        "currency": order.currency or "USD",
        "createdAt": int((order.created_at or datetime.utcnow()).timestamp() * 1000),
        "expiresAt": int(order.expires_at.timestamp() * 1000) if order.expires_at else None,
        "paidAt": int(order.paid_at.timestamp() * 1000) if order.paid_at else None,
    }


# =====================================================================
# GET /api/shop/ads
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

    if len(image) > 6_000_000:
        raise HTTPException(status_code=413, detail="حجم الصورة كبير جداً")

    # v89.29 — حقول المخزون (اختيارية)
    track_inventory = bool(payload.get("trackInventory") or False)
    try:
        stock = int(payload.get("stock") or 0)
    except (TypeError, ValueError):
        stock = 0
    try:
        low_stock_threshold = int(payload.get("lowStockThreshold") or 0)
    except (TypeError, ValueError):
        low_stock_threshold = 0
    payment_provider = str(payload.get("paymentProvider") or "none").lower().strip()
    if payment_provider not in {"none", "stripe", "paypal", "tap", "hyperpay", "generic"}:
        payment_provider = "none"

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
        track_inventory=track_inventory,
        stock=max(0, stock),
        reserved=0,
        sold=0,
        low_stock_threshold=max(0, low_stock_threshold),
        payment_provider=payment_provider,
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
# POST /api/shop/ads/{ad_id}/like
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
# POST /api/shop/ads/{ad_id}/react
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
# v89.29 — GET /api/shop/ads/{ad_id}/inventory
# =====================================================================
@router.get("/ads/{ad_id}/inventory")
def get_inventory(
    ad_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    ad = db.query(ShopAd).filter(ShopAd.id == ad_id, ShopAd.is_deleted.is_(False)).first()
    if not ad:
        raise HTTPException(status_code=404, detail="الإعلان غير موجود")
    available = None
    if ad.track_inventory:
        available = max(0, int(ad.stock or 0) - int(ad.reserved or 0) - int(ad.sold or 0))
    return {
        "adId": ad.id,
        "trackInventory": bool(ad.track_inventory),
        "stock": int(ad.stock or 0),
        "reserved": int(ad.reserved or 0),
        "sold": int(ad.sold or 0),
        "available": available,
        "lowStockThreshold": int(ad.low_stock_threshold or 0),
    }


# =====================================================================
# v89.29 — PATCH /api/shop/ads/{ad_id}/inventory (البائع فقط)
# =====================================================================
@router.patch("/ads/{ad_id}/inventory")
def update_inventory(
    ad_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ad = db.query(ShopAd).filter(ShopAd.id == ad_id, ShopAd.is_deleted.is_(False)).with_for_update().first()
    if not ad:
        raise HTTPException(status_code=404, detail="الإعلان غير موجود")
    is_admin = bool(getattr(current_user, "is_admin", False) or getattr(current_user, "is_superuser", False))
    if ad.seller_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="غير مصرح")

    if "trackInventory" in payload:
        ad.track_inventory = bool(payload.get("trackInventory"))
    if "stock" in payload:
        try:
            new_stock = max(0, int(payload.get("stock") or 0))
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="stock غير صالح")
        # لا يجوز جعل المخزون أقل من المحجوز + المباع
        min_stock = int(ad.reserved or 0) + int(ad.sold or 0)
        if new_stock < min_stock:
            raise HTTPException(
                status_code=409,
                detail=f"لا يمكن خفض المخزون تحت المستهلك بالفعل ({min_stock})",
            )
        ad.stock = new_stock
    if "lowStockThreshold" in payload:
        try:
            ad.low_stock_threshold = max(0, int(payload.get("lowStockThreshold") or 0))
        except (TypeError, ValueError):
            pass
    ad.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ad)
    logger.info(f"[shop] inventory updated ad#{ad.id} by {current_user.username}")
    return _serialize_ad(ad, current_user.username)


# =====================================================================
# v89.29 — POST /api/shop/ads/{ad_id}/order
# ينشئ طلباً ويحجز المخزون بشكل concurrency-safe.
# =====================================================================
@router.post("/ads/{ad_id}/order", status_code=status.HTTP_201_CREATED)
def create_order_endpoint(
    ad_id: int,
    payload: dict = Body(...),
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        quantity = int(payload.get("quantity") or 1)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="الكمية غير صالحة")
    if quantity <= 0 or quantity > 999:
        raise HTTPException(status_code=400, detail="الكمية خارج النطاق المسموح")

    contact = str(payload.get("contact") or "").strip()
    message = str(payload.get("message") or "").strip()
    provider = str(payload.get("paymentProvider") or "none").lower().strip()
    if provider not in {"none", "stripe", "paypal", "tap", "hyperpay", "generic"}:
        provider = "none"

    # يستخدم header 'Idempotency-Key' إذا وُجد، وإلا ما يمرّره في الـ payload
    idem = None
    if request is not None:
        idem = request.headers.get("idempotency-key") or request.headers.get("Idempotency-Key")
    idem = idem or payload.get("idempotencyKey") or None

    order = payment_service.create_order(
        db=db,
        ad_id=ad_id,
        buyer=current_user,
        quantity=quantity,
        contact=contact,
        message=message,
        payment_provider=provider,
        idempotency_key=idem,
    )
    return _serialize_order(order)


# =====================================================================
# v89.29 — POST /api/shop/orders/{order_id}/attach-payment
# يربط PaymentIntent الخارجي بالطلب لاحقاً (بعد إنشاء PI في الفرونت)
# =====================================================================
@router.post("/orders/{order_id}/attach-payment")
def attach_payment(
    order_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(ShopAdOrder).filter(ShopAdOrder.id == order_id).with_for_update().first()
    if not order:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")
    if order.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="غير مصرح")
    if order.payment_status in ("paid", "refunded"):
        raise HTTPException(status_code=409, detail="لا يمكن تعديل طلب مكتمل")

    payment_ref = str(payload.get("paymentRef") or "").strip()
    provider = str(payload.get("paymentProvider") or order.payment_provider or "").lower().strip()
    if not payment_ref:
        raise HTTPException(status_code=400, detail="paymentRef مطلوب")

    order.payment_ref = payment_ref
    order.payment_provider = provider or order.payment_provider
    order.payment_status = "awaiting"
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return _serialize_order(order)


# =====================================================================
# v89.29 — GET /api/shop/orders — طلبات المستخدم (كمشترٍ أو كبائع)
# =====================================================================
@router.get("/orders")
def list_orders(
    role: str = Query("buyer", regex="^(buyer|seller|any)$"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(ShopAdOrder)
    if role == "buyer":
        q = q.filter(ShopAdOrder.buyer_id == current_user.id)
    elif role == "seller":
        seller_ads = db.query(ShopAd.id).filter(ShopAd.seller_id == current_user.id).subquery()
        q = q.filter(ShopAdOrder.ad_id.in_(seller_ads))
    else:
        seller_ads = db.query(ShopAd.id).filter(ShopAd.seller_id == current_user.id).subquery()
        q = q.filter(or_(ShopAdOrder.buyer_id == current_user.id, ShopAdOrder.ad_id.in_(seller_ads)))
    q = q.order_by(desc(ShopAdOrder.created_at)).offset(offset).limit(limit)
    return {"items": [_serialize_order(o) for o in q.all()]}


# =====================================================================
# v89.29 — POST /api/shop/webhook/{provider}
# نقطة النهاية الآمنة التي تستقبل webhooks من بوابات الدفع.
# لا تتطلب مصادقة مستخدم — تعتمد على HMAC signature.
# =====================================================================
@router.post("/webhook/{provider}")
async def payment_webhook(
    provider: str = Path(..., regex="^(stripe|paypal|tap|hyperpay|generic)$"),
    request: Request = None,
    db: Session = Depends(get_db),
):
    raw_body = await request.body()
    # نحضّر headers بحساسية غير حرفية
    headers = {k.lower(): v for k, v in request.headers.items()}
    try:
        result = payment_service.process_webhook(
            db=db,
            provider=provider.lower(),
            raw_body=raw_body,
            headers=headers,
        )
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"[shop-webhook] unexpected error provider={provider}: {exc}")
        # نرد 200 مع خطأ لكي لا يُعاد الإرسال بلا نهاية، والتفاصيل في السجل
        return {"ok": False, "error": "internal_error"}


# =====================================================================
# v89.29 — POST /api/shop/maintenance/sweep-reservations
# صيانة يدوية (تُشغَّل تلقائياً أيضاً من background_tasks)
# =====================================================================
@router.post("/maintenance/sweep-reservations")
def sweep_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = bool(getattr(current_user, "is_admin", False) or getattr(current_user, "is_superuser", False))
    if not is_admin:
        raise HTTPException(status_code=403, detail="admin only")
    released = payment_service.sweep_expired_reservations(db)
    return {"ok": True, "released": released}


# =====================================================================
# GET /api/shop/health
# =====================================================================
@router.get("/health")
def health():
    return {"ok": True, "service": "shop", "version": "v89.29", "ts": datetime.utcnow().isoformat()}
