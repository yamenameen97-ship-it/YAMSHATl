"""
Payment service — v89.29 ROOT FIX
==================================
نظام دفع آمن مع Webhooks + جرد مخزون لحظي مع منع التعارض.

يعالج المشكلة الموصوفة في تقرير الفحص:
> «على مستوى مسارات المتاجر، يتطلب النظام استكمال الربط الآمن مع خطافات
> بوابات الدفع (Payment Webhooks) لضمان تحديث حالات الطلبات تلقائياً وبشكل
> موثوق. ينقص أيضاً نظام تكامل جرد المخزون اللحظي لمنع حدوث تعارض عند طلب
> نفس المنتج من عدة مستخدمين في وقت واحد.»

الجذر:
1) لم يكن هناك أيّ endpoint موحّد لاستقبال webhooks (paypal/stripe/tap/...)
2) لم يكن هناك التحقق من التوقيع HMAC → قابل للتزوير
3) لا idempotency → معالجة نفس الحدث مرتين تسبّب bug مضاعف
4) لم يكن هناك SELECT ... FOR UPDATE على `shop_ads.stock` → race conditions
5) لا orders reservation flow → أوّل من ينشر أوّل من يفوز حتى بدون دفع

كل ذلك تم إصلاحه هنا في مكان واحد.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
import secrets
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Tuple

from fastapi import HTTPException, Request, status
from sqlalchemy import and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.shop_ad import ShopAd, ShopAdOrder, ShopPaymentEvent

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# إعدادات (ENV vars) — كل مزوّد له سرّه المستقل
# ---------------------------------------------------------------------------
def _env(key: str, default: str = '') -> str:
    return (os.getenv(key) or default).strip()

STRIPE_WEBHOOK_SECRET  = _env('STRIPE_WEBHOOK_SECRET')
PAYPAL_WEBHOOK_ID      = _env('PAYPAL_WEBHOOK_ID')
PAYPAL_WEBHOOK_SECRET  = _env('PAYPAL_WEBHOOK_SECRET')
TAP_WEBHOOK_SECRET     = _env('TAP_WEBHOOK_SECRET')
HYPERPAY_WEBHOOK_SECRET = _env('HYPERPAY_WEBHOOK_SECRET')
GENERIC_WEBHOOK_SECRET = _env('GENERIC_WEBHOOK_SECRET')  # للتطوير/تكامل مخصص

# مدة صلاحية الحجز — إن لم يُدفع خلالها يتحرّر المخزون
RESERVATION_TTL_MIN = int(_env('SHOP_RESERVATION_TTL_MIN', '30'))

# حد أقصى لعمر الحدث (لمنع replay attacks)
MAX_EVENT_AGE_SEC = int(_env('SHOP_WEBHOOK_MAX_AGE_SEC', '300'))  # 5 دقائق


# ===========================================================================
# 1) التحقق من التوقيع (HMAC) — لكل مزوّد صيغته الخاصة
# ===========================================================================
def verify_signature(
    provider: str,
    raw_body: bytes,
    headers: Dict[str, str],
) -> Tuple[bool, str]:
    """
    يتحقق من صحة توقيع webhook. يُعيد (ok, reason).
    ملاحظة: لا يعتمد أبداً على بيانات الـ JSON نفسها — الحساب على raw bytes.
    """
    provider = (provider or '').lower().strip()

    if provider == 'stripe':
        secret = STRIPE_WEBHOOK_SECRET
        sig_header = headers.get('stripe-signature') or ''
        if not secret or not sig_header:
            return False, 'missing_secret_or_header'
        # Stripe: t=timestamp,v1=hash
        parts = dict(p.split('=', 1) for p in sig_header.split(',') if '=' in p)
        ts = parts.get('t')
        v1 = parts.get('v1')
        if not ts or not v1:
            return False, 'malformed_signature'
        try:
            if abs(int(datetime.utcnow().timestamp()) - int(ts)) > MAX_EVENT_AGE_SEC:
                return False, 'timestamp_out_of_tolerance'
        except ValueError:
            return False, 'bad_timestamp'
        signed = f"{ts}.".encode() + raw_body
        expected = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, v1), 'ok' if hmac.compare_digest(expected, v1) else 'signature_mismatch'

    if provider == 'paypal':
        # PayPal يستخدم Transmission-Sig + WEBHOOK_ID + certificate.
        # نتحقق مبدئياً من التوقيع المشترك (HMAC) إذا كان مُهيَّأ،
        # وإلا نطلب من الأدمن ضبط PAYPAL_WEBHOOK_SECRET.
        if not PAYPAL_WEBHOOK_SECRET:
            return False, 'paypal_secret_not_configured'
        sig = headers.get('paypal-transmission-sig') or ''
        if not sig:
            return False, 'missing_paypal_signature'
        expected = hmac.new(PAYPAL_WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, sig), 'ok' if hmac.compare_digest(expected, sig) else 'signature_mismatch'

    if provider == 'tap':
        secret = TAP_WEBHOOK_SECRET
        sig = headers.get('hashstring') or headers.get('x-tap-signature') or ''
        if not secret or not sig:
            return False, 'missing_secret_or_header'
        expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, sig), 'ok' if hmac.compare_digest(expected, sig) else 'signature_mismatch'

    if provider == 'hyperpay':
        secret = HYPERPAY_WEBHOOK_SECRET
        sig = headers.get('x-signature') or ''
        if not secret or not sig:
            return False, 'missing_secret_or_header'
        expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, sig), 'ok' if hmac.compare_digest(expected, sig) else 'signature_mismatch'

    if provider == 'generic':
        secret = GENERIC_WEBHOOK_SECRET
        sig = headers.get('x-yamshat-signature') or ''
        if not secret or not sig:
            return False, 'missing_secret_or_header'
        expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, sig), 'ok' if hmac.compare_digest(expected, sig) else 'signature_mismatch'

    return False, 'unknown_provider'


# ===========================================================================
# 2) استخراج معلومات الحدث من payload كل مزوّد إلى صيغة موحّدة
# ===========================================================================
def normalize_event(provider: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """يُرجع {event_id, event_type, status, payment_ref, order_id, amount, currency}."""
    provider = (provider or '').lower().strip()
    out = {
        'event_id': '',
        'event_type': '',
        'status': '',      # paid / failed / refunded / cancelled / pending
        'payment_ref': '',
        'order_id': None,
        'amount': 0.0,
        'currency': 'USD',
    }

    if provider == 'stripe':
        out['event_id']   = str(payload.get('id') or '')
        out['event_type'] = str(payload.get('type') or '')
        data = (payload.get('data') or {}).get('object') or {}
        out['payment_ref'] = str(data.get('id') or '')
        out['currency']    = (data.get('currency') or 'USD').upper()
        # المبلغ عند Stripe بالسنتات
        amount_cents = data.get('amount_received') or data.get('amount') or 0
        try:
            out['amount'] = float(amount_cents) / 100.0
        except (TypeError, ValueError):
            out['amount'] = 0.0
        meta = data.get('metadata') or {}
        try:
            if 'order_id' in meta:
                out['order_id'] = int(meta['order_id'])
        except (TypeError, ValueError):
            pass
        et = out['event_type']
        if et.endswith('.succeeded'):
            out['status'] = 'paid'
        elif et.endswith('.payment_failed') or et.endswith('.failed'):
            out['status'] = 'failed'
        elif 'refunded' in et:
            out['status'] = 'refunded'
        elif 'canceled' in et or 'cancelled' in et:
            out['status'] = 'cancelled'
        return out

    if provider == 'paypal':
        out['event_id']   = str(payload.get('id') or '')
        out['event_type'] = str(payload.get('event_type') or '')
        res = payload.get('resource') or {}
        out['payment_ref'] = str(res.get('id') or '')
        amt = (res.get('amount') or {}) if isinstance(res.get('amount'), dict) else {}
        try:
            out['amount'] = float(amt.get('value') or 0)
        except (TypeError, ValueError):
            out['amount'] = 0.0
        out['currency'] = (amt.get('currency_code') or 'USD').upper()
        custom_id = res.get('custom_id') or ''
        try:
            if custom_id.startswith('order_'):
                out['order_id'] = int(custom_id.split('_', 1)[1])
        except ValueError:
            pass
        et = out['event_type']
        if 'CAPTURE.COMPLETED' in et or 'PAYMENT.SALE.COMPLETED' in et:
            out['status'] = 'paid'
        elif 'DENIED' in et or 'FAILED' in et:
            out['status'] = 'failed'
        elif 'REFUNDED' in et:
            out['status'] = 'refunded'
        elif 'REVERSED' in et or 'CANCELLED' in et:
            out['status'] = 'cancelled'
        return out

    # Tap / Hyperpay / Generic — نفترض بنية {id, event, order_id, status, amount, currency}
    out['event_id']   = str(payload.get('id') or payload.get('event_id') or '')
    out['event_type'] = str(payload.get('event') or payload.get('type') or '')
    out['payment_ref'] = str(payload.get('reference') or payload.get('charge_id') or payload.get('id') or '')
    try:
        out['order_id'] = int(payload.get('order_id')) if payload.get('order_id') else None
    except (TypeError, ValueError):
        pass
    try:
        out['amount'] = float(payload.get('amount') or 0)
    except (TypeError, ValueError):
        out['amount'] = 0.0
    out['currency'] = str(payload.get('currency') or 'USD').upper()
    st = (payload.get('status') or '').lower()
    if st in ('captured', 'succeeded', 'paid', 'completed'):
        out['status'] = 'paid'
    elif st in ('failed', 'declined'):
        out['status'] = 'failed'
    elif st in ('refunded',):
        out['status'] = 'refunded'
    elif st in ('cancelled', 'canceled', 'voided'):
        out['status'] = 'cancelled'
    return out


# ===========================================================================
# 3) حجز المخزون — Concurrency-safe عبر SELECT ... FOR UPDATE
# ===========================================================================
def reserve_stock(
    db: Session,
    ad_id: int,
    quantity: int,
) -> ShopAd:
    """
    يقفل صف الإعلان ثم يتحقق من توفّر المخزون ويحجزه.
    يرفع HTTPException(409) إذا لم يكن هناك مخزون كافٍ.
    كل مسار الاستدعاء يجب أن يكون داخل نفس المعاملة (transaction).
    """
    if quantity <= 0:
        raise HTTPException(status_code=400, detail='الكمية غير صالحة')

    # قفل الصف — هذا هو المفتاح لمنع التعارض بين عدة مستخدمين
    ad = (
        db.query(ShopAd)
        .filter(ShopAd.id == ad_id, ShopAd.is_deleted.is_(False), ShopAd.is_active.is_(True))
        .with_for_update()
        .first()
    )
    if not ad:
        raise HTTPException(status_code=404, detail='الإعلان غير موجود')

    # منتج بلا جرد (خدمة / رقمي غير محدود) — نمرّ مباشرة
    if not ad.track_inventory:
        return ad

    available = int(ad.stock or 0) - int(ad.reserved or 0) - int(ad.sold or 0)
    if quantity > available:
        raise HTTPException(
            status_code=409,
            detail=f'نفدت الكمية (المتاح: {max(0, available)})',
        )

    ad.reserved = int(ad.reserved or 0) + quantity
    ad.updated_at = datetime.utcnow()
    db.flush()
    return ad


def release_reservation(db: Session, ad_id: int, quantity: int) -> None:
    """يحرّر كمية محجوزة (عند فشل/إلغاء/انتهاء صلاحية الطلب)."""
    if quantity <= 0:
        return
    ad = db.query(ShopAd).filter(ShopAd.id == ad_id).with_for_update().first()
    if not ad:
        return
    ad.reserved = max(0, int(ad.reserved or 0) - quantity)
    ad.updated_at = datetime.utcnow()
    db.flush()


def commit_sale(db: Session, ad_id: int, quantity: int) -> None:
    """يحوّل الكمية من reserved إلى sold (عند نجاح الدفع)."""
    if quantity <= 0:
        return
    ad = db.query(ShopAd).filter(ShopAd.id == ad_id).with_for_update().first()
    if not ad:
        return
    take = min(int(ad.reserved or 0), quantity)
    ad.reserved = max(0, int(ad.reserved or 0) - take)
    ad.sold = int(ad.sold or 0) + take
    ad.updated_at = datetime.utcnow()
    # إذا نفدت الكمية نُعطّل الإعلان تلقائياً
    if ad.track_inventory:
        remaining = int(ad.stock or 0) - int(ad.sold or 0) - int(ad.reserved or 0)
        if remaining <= 0:
            ad.is_active = False
    db.flush()


def refund_sale(db: Session, ad_id: int, quantity: int) -> None:
    """يعيد الكمية إلى المخزون بعد رد الدفع."""
    if quantity <= 0:
        return
    ad = db.query(ShopAd).filter(ShopAd.id == ad_id).with_for_update().first()
    if not ad:
        return
    ad.sold = max(0, int(ad.sold or 0) - quantity)
    ad.is_active = True
    ad.updated_at = datetime.utcnow()
    db.flush()


# ===========================================================================
# 4) إنشاء طلب مع حجز المخزون (idempotent)
# ===========================================================================
def create_order(
    db: Session,
    ad_id: int,
    buyer,
    quantity: int,
    contact: str,
    message: str,
    payment_provider: str = 'none',
    idempotency_key: Optional[str] = None,
) -> ShopAdOrder:
    """
    ينشئ طلب شراء ويحجز المخزون. آمن ضد تكرار الطلب عبر idempotency_key.
    """
    # 1) idempotency: هل هذا الطلب مُنشأ من قبل بنفس المفتاح؟
    if idempotency_key:
        existing = db.query(ShopAdOrder).filter(
            ShopAdOrder.idempotency_key == idempotency_key
        ).first()
        if existing:
            return existing

    # 2) نحجز داخل transaction — إذا فشلنا نتراجع
    ad = reserve_stock(db, ad_id, quantity)

    order = ShopAdOrder(
        ad_id=ad.id,
        buyer_id=buyer.id,
        buyer_username=buyer.username,
        buyer_name=getattr(buyer, 'display_name', None) or buyer.username,
        contact=contact,
        quantity=quantity,
        message=message or '',
        status='pending',
        replies_json='[]',
        payment_status='awaiting' if payment_provider and payment_provider != 'none' else 'unpaid',
        payment_provider=payment_provider or None,
        amount_total=float(ad.price or 0) * quantity,
        currency=ad.currency or 'USD',
        idempotency_key=idempotency_key or secrets.token_urlsafe(16),
        expires_at=datetime.utcnow() + timedelta(minutes=RESERVATION_TTL_MIN),
    )
    db.add(order)
    try:
        db.commit()
    except IntegrityError:
        # سباق مع طلب آخر بنفس idempotency_key — نسترجع الموجود
        db.rollback()
        if idempotency_key:
            existing = db.query(ShopAdOrder).filter(
                ShopAdOrder.idempotency_key == idempotency_key
            ).first()
            if existing:
                # نُفرغ الحجز الذي أنشأناه دون داعٍ
                release_reservation(db, ad_id, quantity)
                db.commit()
                return existing
        raise
    db.refresh(order)
    logger.info(f'[shop] order#{order.id} created ad#{ad_id} qty={quantity} by {buyer.username}')
    return order


# ===========================================================================
# 5) معالجة الحدث (المسار الرئيسي الذي يُستدعى من webhook endpoint)
# ===========================================================================
def process_webhook(
    db: Session,
    provider: str,
    raw_body: bytes,
    headers: Dict[str, str],
) -> Dict[str, Any]:
    """
    يعالج webhook دفع كاملاً:
      1) verify signature
      2) parse & normalize
      3) idempotency check (provider + event_id)
      4) locate order (by payment_ref أو order_id في metadata)
      5) update status + inventory
    يُرجع dict summary مناسب للرد على مزوّد الدفع.
    """
    # 1) توقيع
    ok, reason = verify_signature(provider, raw_body, headers)
    if not ok:
        logger.warning(f'[shop-webhook] signature FAIL provider={provider} reason={reason}')
        # نرد 200 مع خطأ لكي لا يُعيد المزوّد الإرسال بلا نهاية،
        # لكن نرفع HTTPException 401 في route نفسه لسجلات AWS.
        raise HTTPException(status_code=401, detail='invalid signature')

    # 2) parse
    try:
        payload = json.loads(raw_body.decode('utf-8') or '{}')
    except Exception as exc:
        logger.error(f'[shop-webhook] bad json: {exc}')
        raise HTTPException(status_code=400, detail='bad json')

    ev = normalize_event(provider, payload)
    if not ev['event_id']:
        raise HTTPException(status_code=400, detail='missing event id')

    # 3) idempotency — أنشئ سجلاً ولا تُعالج مرتين
    existing_evt = db.query(ShopPaymentEvent).filter(
        ShopPaymentEvent.provider == provider,
        ShopPaymentEvent.event_id == ev['event_id'],
    ).first()
    if existing_evt and existing_evt.processed:
        logger.info(f'[shop-webhook] duplicate event ignored {provider}:{ev["event_id"]}')
        return {'ok': True, 'duplicate': True}

    evt = existing_evt or ShopPaymentEvent(
        provider=provider,
        event_id=ev['event_id'],
        event_type=ev['event_type'] or '',
        payment_ref=ev['payment_ref'] or None,
        signature_ok=True,
        processed=False,
        payload_json=json.dumps(payload, ensure_ascii=False)[:500_000],
    )
    if not existing_evt:
        db.add(evt)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            # حدث آخر يسابقنا على نفس id — نعتبره duplicate
            return {'ok': True, 'duplicate': True}

    # 4) locate order
    order: Optional[ShopAdOrder] = None
    if ev['order_id']:
        order = db.query(ShopAdOrder).filter(ShopAdOrder.id == ev['order_id']).with_for_update().first()
    if not order and ev['payment_ref']:
        order = db.query(ShopAdOrder).filter(
            ShopAdOrder.payment_ref == ev['payment_ref']
        ).with_for_update().first()

    if not order:
        evt.processed = True
        evt.processed_at = datetime.utcnow()
        evt.error = 'order_not_found'
        db.commit()
        logger.warning(f'[shop-webhook] order not found for event {provider}:{ev["event_id"]}')
        # نرد 200 حتى لا يُعاد الإرسال — الأمر لا يخصنا
        return {'ok': True, 'ignored': True, 'reason': 'order_not_found'}

    evt.order_id = order.id
    order.payment_ref = order.payment_ref or ev['payment_ref']
    order.payment_provider = order.payment_provider or provider

    # 5) apply status + inventory changes
    st = ev['status']
    if st == 'paid':
        if order.payment_status != 'paid':
            order.payment_status = 'paid'
            order.status = 'accepted'
            order.paid_at = datetime.utcnow()
            # حوّل الحجز إلى مبيعات
            commit_sale(db, order.ad_id, int(order.quantity or 0))
    elif st == 'failed':
        if order.payment_status not in ('failed', 'refunded'):
            order.payment_status = 'failed'
            order.status = 'rejected'
            release_reservation(db, order.ad_id, int(order.quantity or 0))
    elif st == 'refunded':
        if order.payment_status != 'refunded':
            order.payment_status = 'refunded'
            order.status = 'refunded'
            order.refunded_at = datetime.utcnow()
            refund_sale(db, order.ad_id, int(order.quantity or 0))
    elif st == 'cancelled':
        if order.payment_status not in ('paid', 'refunded'):
            order.payment_status = 'failed'
            order.status = 'cancelled'
            release_reservation(db, order.ad_id, int(order.quantity or 0))
    # حالة أخرى (pending/authorized) — لا نغيّر شيء إلا payment_ref

    order.updated_at = datetime.utcnow()
    evt.processed = True
    evt.processed_at = datetime.utcnow()
    db.commit()
    logger.info(f'[shop-webhook] processed {provider}:{ev["event_id"]} order#{order.id} → {order.payment_status}')

    return {
        'ok': True,
        'order_id': order.id,
        'payment_status': order.payment_status,
        'status': order.status,
    }


# ===========================================================================
# 6) صيانة: تحرير الحجوزات المنتهية
# ===========================================================================
def sweep_expired_reservations(db: Session) -> int:
    """
    يُشغَّل دورياً (كل بضع دقائق) لتحرير الحجوزات التي لم تُدفع خلال RESERVATION_TTL.
    يُعيد عدد الطلبات التي حرَّرها.
    """
    now = datetime.utcnow()
    expired = (
        db.query(ShopAdOrder)
        .filter(
            ShopAdOrder.payment_status.in_(['awaiting', 'unpaid']),
            ShopAdOrder.status == 'pending',
            ShopAdOrder.expires_at.isnot(None),
            ShopAdOrder.expires_at < now,
        )
        .limit(200)
        .all()
    )
    count = 0
    for o in expired:
        try:
            release_reservation(db, o.ad_id, int(o.quantity or 0))
            o.payment_status = 'expired'
            o.status = 'cancelled'
            o.updated_at = now
            count += 1
        except Exception as exc:
            logger.warning(f'[shop-sweep] failed to release order#{o.id}: {exc}')
    if count:
        db.commit()
        logger.info(f'[shop-sweep] released {count} expired reservations')
    return count
