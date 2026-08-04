"""
Read Receipts Reconciler — v89.30
==================================

يعالج نقص #4 (الجزء الثاني) من قائمة المشاكل:
    "وفي نظام الدردشة، من الضروري تحسين دقة مؤشرات القراءة (Read Receipts)
     أثناء فترات الاتصال المتقطع بالشبكة."

المشكلة السابقة:
────────────────
- عندما يفتح المستخدم محادثة أثناء ضعف الشبكة، الطلب POST /message_seen
  قد يفشل أو يصل متأخراً.
- عند رجوع الاتصال، الرسائل تُعرَض للمُرسِل كـ "delivered" وليس "seen"،
  بينما هي مقروءة فعلياً لدى المستقبل.
- كذلك، لا يوجد آلية للاعتماد على "أحدث معرّف رأيته المستقبل" كنقطة مرجعية
  عند إعادة الاتصال (Reconciliation باستخدام last_read_message_id).

الحل (مطابق لسلوك WhatsApp/Signal):
────────────────────────────────────
1) نُطعّم Endpoint /message_seen بدعم:
   - client_timestamp: زمن قراءة المستخدم فعلياً على جهازه.
   - last_read_message_id: أحدث معرّف رسالة رآها المستخدم (نقطة مرجعية).
   - message_ids[]: قائمة صريحة إن أرسلها العميل.
2) نضيف Endpoint /message_seen/reconcile يستقبل دفعة مؤجَّلة من عدة محادثات
   بمجرد رجوع الشبكة (batched replay).
3) خدمة reconcile_read_receipts() تعالج الطلب باستراتيجية idempotent:
   - نحدّد جميع الرسائل المُرسَلة من `sender` إلى `viewer` والتي `id <= last_read_message_id`
     وما زالت is_seen=False.
   - نضع seen_at = min(client_timestamp, server_now) لضمان دقة زمنية،
     مع حماية من timestamps مستقبلية مزيّفة.
   - نبثّ الحدث `messages_seen` لغرفة المرسِل مرة واحدة (بدل بث لكل رسالة).
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Iterable, List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.message import Message
from app.models.user import User

logger = logging.getLogger(__name__)


# أقصى انحراف مسموح لطابع زمن العميل (لحماية من ساعات جهاز مغلوطة)
MAX_CLOCK_SKEW_SECONDS = 300  # 5 دقائق

# سقف عدد الرسائل التي نعالجها في دفعة واحدة
MAX_MESSAGES_PER_RECONCILE = 500


def _safe_client_timestamp(client_ts: Any) -> Optional[datetime]:
    """
    يحوّل client_timestamp إلى datetime آمن (يرفض الأزمنة المستقبلية أو
    القديمة جداً عن ساعة الخادم).
    """
    if client_ts is None:
        return None
    try:
        if isinstance(client_ts, (int, float)):
            # قد تكون بالميلي ثانية أو بالثواني
            if client_ts > 1e12:
                client_ts = client_ts / 1000.0
            dt = datetime.utcfromtimestamp(float(client_ts))
        else:
            dt = datetime.fromisoformat(str(client_ts).replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return None

    now = datetime.utcnow()
    if dt > now + timedelta(seconds=MAX_CLOCK_SKEW_SECONDS):
        return now  # ساعة العميل تسبق الخادم — نستخدم زمن الخادم
    if dt < now - timedelta(days=30):
        return None  # قديم جداً — تجاهله
    return dt


def reconcile_read_receipts(
    db: Session,
    *,
    viewer: User,
    sender: User,
    last_read_message_id: Optional[int] = None,
    message_ids: Optional[Iterable[int]] = None,
    client_timestamp: Any = None,
) -> Dict[str, Any]:
    """
    يوحّد حالة "قرأ حتى الرسالة X" بين العميل والخادم.

    استراتيجية:
    - إن أُرسلت message_ids صراحة → نعتمدها.
    - وإلا: نستخدم last_read_message_id ونعتبر كل شيء أقل أو مساوٍ مقروءاً.
    - إن كان كلاهما None → لا نفعل شيئاً (نُرجع 0).

    يعيد dict فيها:
        message_ids: الرسائل التي تحوّلت للتو من غير مقروءة إلى مقروءة
        seen_at: الزمن المطبَّق فعلياً
        already_seen: الرسائل التي كانت مقروءة سابقاً (لم تُعدَّل)
    """
    if last_read_message_id is None and not message_ids:
        return {"message_ids": [], "already_seen": [], "seen_at": None}

    resolved_ts = _safe_client_timestamp(client_timestamp) or datetime.utcnow()

    query = db.query(Message).filter(
        and_(
            Message.sender_id == sender.id,
            Message.receiver_id == viewer.id,
        )
    )

    if message_ids:
        ids_list = list({int(m) for m in message_ids})[:MAX_MESSAGES_PER_RECONCILE]
        query = query.filter(Message.id.in_(ids_list))
    elif last_read_message_id is not None:
        query = query.filter(Message.id <= int(last_read_message_id))

    query = query.order_by(Message.id.asc()).limit(MAX_MESSAGES_PER_RECONCILE)
    messages: List[Message] = query.all()

    newly_seen: List[int] = []
    already_seen: List[int] = []

    for msg in messages:
        if msg.is_seen:
            already_seen.append(msg.id)
            continue
        msg.is_seen = True
        msg.seen_at = resolved_ts
        # الرسالة المقروءة يجب أن تكون مسلّمة أيضاً
        msg.is_delivered = True
        if msg.delivered_at is None:
            msg.delivered_at = resolved_ts
        newly_seen.append(msg.id)

    if newly_seen:
        db.commit()

    logger.info(
        "read_receipts_reconciled viewer=%s sender=%s newly=%s already=%s ts=%s",
        viewer.username, sender.username, len(newly_seen), len(already_seen), resolved_ts.isoformat(),
    )

    return {
        "message_ids": newly_seen,
        "already_seen": already_seen,
        "seen_at": resolved_ts.isoformat(),
    }


def reconcile_bulk(
    db: Session,
    *,
    viewer: User,
    batches: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    يستقبل دفعة من عدة محادثات دفعة واحدة عند رجوع الاتصال.

    شكل كل عنصر داخل batches:
        {
            "sender_username": "ahmed",
            "last_read_message_id": 12345,
            "client_timestamp": "2026-08-03T10:20:30Z",
            "message_ids": [12340, 12341, 12345]  # اختياري
        }
    """
    results: List[Dict[str, Any]] = []
    if not batches:
        return results

    # نجمع أسماء المستخدمين مرة واحدة لتوفير استعلامات
    usernames = list({str(b.get("sender_username") or "").strip() for b in batches})
    usernames = [u for u in usernames if u]
    if not usernames:
        return results

    senders = (
        db.query(User)
        .filter(User.username.in_(usernames), User.is_active.is_(True))
        .all()
    )
    by_name = {s.username: s for s in senders}

    for entry in batches:
        sender_name = str(entry.get("sender_username") or "").strip()
        sender = by_name.get(sender_name)
        if sender is None:
            results.append({
                "sender_username": sender_name,
                "message_ids": [],
                "error": "sender_not_found",
            })
            continue
        outcome = reconcile_read_receipts(
            db,
            viewer=viewer,
            sender=sender,
            last_read_message_id=entry.get("last_read_message_id"),
            message_ids=entry.get("message_ids"),
            client_timestamp=entry.get("client_timestamp"),
        )
        outcome["sender_username"] = sender_name
        results.append(outcome)

    return results
