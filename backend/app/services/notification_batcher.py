"""
Smart Notification Batching Service — v89.30
=============================================

يعالج نقص #4 من قائمة المشاكل:
    "نقص خدمة الإشعارات تطبيق نظام التجميع الذكي (Batching) لتفادي إزعاج
     المستخدم بالإشعارات المتكررة على نفس المنشور."

آلية العمل (مطابقة لسلوك Instagram/Facebook):
────────────────────────────────────────────────
- كل إشعار جديد يمر عبر NotificationBatcher.enqueue().
- يُحسب مفتاح تجميع (bucket_key) من (user_id + target_type + target_id + notif_type).
- إذا كان هناك إشعار مماثل غير مقروء ضمن نافذة زمنية (BATCH_WINDOW_SECONDS)،
  يتم دمج الإشعار الجديد في القديم بدلاً من إنشاء إشعار مستقل:
    "أحمد أعجب بمنشورك"          -> إشعار واحد
    "أحمد ومحمد أعجبا بمنشورك"    -> دُمج
    "أحمد و3 آخرون أعجبوا بمنشورك" -> دُمج
- تُخزَّن قائمة الفاعلين (actors) داخل data['batch_actors'] بحد أقصى MAX_ACTORS.
- عند تجاوز نافذة الوقت أو قراءة الإشعار، يبدأ إشعار جديد.

الفوائد:
- تقليل ضجيج الإشعارات المتكرر على نفس المنشور.
- تقليل استهلاك FCM/APNS Push credits.
- تحسين تجربة المستخدم.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import and_, desc
from sqlalchemy.orm import Session

from app.models.notification import Notification

logger = logging.getLogger(__name__)


# ============ إعدادات التجميع ============

# مدة نافذة التجميع بالثواني — أي إشعار مماثل خلال هذه المدة يُدمج
BATCH_WINDOW_SECONDS = 3600  # ساعة واحدة (مطابق لسلوك IG)

# أقصى عدد فاعلين يظهرون بالاسم في نص الإشعار
MAX_ACTORS_IN_TITLE = 2

# أقصى عدد فاعلين نحتفظ بهم داخل data['batch_actors']
MAX_ACTORS_STORED = 20

# الأنواع التي تُجمَّع (لا يُجمَّع system_alert أو الرسائل المباشرة)
BATCHABLE_TYPES = {
    "new_like",
    "new_comment",
    "new_share",
    "new_follow",
    "story_view",
    "story_reply",
    "mention",
    "new_mention",
    "gift_received",
}


# ============ أدوات مساعدة ============

def _bucket_key(
    user_id: int,
    notif_type: str,
    target_id: Optional[int],
    target_type: Optional[str],
) -> str:
    """
    مفتاح فريد يحدد "نفس المنشور/نفس القصة/نفس التعليق".
    كل الإشعارات التي تتشارك هذا المفتاح تُجمَّع معاً.
    """
    return f"{user_id}:{notif_type}:{target_type or '-'}:{target_id or '-'}"


def _actor_repr(actor_id: Any, actor_username: Optional[str]) -> Dict[str, Any]:
    return {
        "actor_id": actor_id,
        "actor_username": actor_username or "",
        "at": datetime.utcnow().isoformat(),
    }


def _compose_batched_text(
    notif_type: str,
    actors: List[Dict[str, Any]],
) -> Tuple[str, str]:
    """
    ينتج (title, body) بشكل ذكي حسب عدد الفاعلين.
    مثال ناتج: ("إعجاب جديد ❤️", "أحمد و3 آخرون أعجبوا بمنشورك")
    """
    total = len(actors)
    names = [
        (a.get("actor_username") or "").strip()
        for a in actors
        if (a.get("actor_username") or "").strip()
    ]

    # نص الفاعلين
    if total == 0:
        subject = "شخص ما"
    elif total == 1:
        subject = names[0] if names else "شخص ما"
    elif total == 2:
        subject = f"{names[0]} و{names[1]}" if len(names) >= 2 else f"{names[0]} وشخص آخر"
    else:
        first = names[0] if names else "شخص ما"
        others = total - 1
        subject = f"{first} و{others} آخرون"

    verbs = {
        "new_like": ("إعجاب جديد ❤️", "أعجب" if total == 1 else "أعجبوا", "بمنشورك"),
        "new_comment": ("تعليق جديد 💬", "علّق" if total == 1 else "علّقوا", "على منشورك"),
        "new_share": ("مشاركة جديدة 🔁", "شارك" if total == 1 else "شاركوا", "منشورك"),
        "new_follow": ("متابع جديد 👤", "بدأ" if total == 1 else "بدأوا", "بمتابعتك"),
        "story_view": ("مشاهدة قصة 👁", "شاهد" if total == 1 else "شاهدوا", "قصتك"),
        "story_reply": ("رد على قصة 💭", "رد" if total == 1 else "ردوا", "على قصتك"),
        "mention": ("تم ذكرك ✨", "ذكرك" if total == 1 else "ذكروك", "في منشور"),
        "new_mention": ("تم ذكرك ✨", "ذكرك" if total == 1 else "ذكروك", "في منشور"),
        "gift_received": ("هدية جديدة 🎁", "أرسل" if total == 1 else "أرسلوا", "لك هدية"),
    }
    title, verb, tail = verbs.get(
        notif_type,
        ("تنبيه جديد", "تفاعل" if total == 1 else "تفاعلوا", "معك"),
    )
    body = f"{subject} {verb} {tail}"
    return title, body


# ============ الواجهة الرئيسية ============

def try_batch_into_existing(
    db: Session,
    *,
    user_id: int,
    notif_type: str,
    actor_id: Optional[int],
    actor_username: Optional[str],
    target_id: Optional[int],
    target_type: Optional[str],
    extra_data: Optional[Dict[str, Any]] = None,
) -> Optional[Notification]:
    """
    يحاول دمج الإشعار الجديد في إشعار قائم غير مقروء ضمن النافذة الزمنية.

    Returns:
        Notification المحدَّث إذا تم الدمج، أو None لو يجب إنشاء إشعار جديد.
    """
    if notif_type not in BATCHABLE_TYPES:
        return None

    bucket = _bucket_key(user_id, notif_type, target_id, target_type)
    cutoff = datetime.utcnow() - timedelta(seconds=BATCH_WINDOW_SECONDS)

    # نبحث عن آخر إشعار غير مقروء بنفس المفتاح
    candidates = (
        db.query(Notification)
        .filter(
            and_(
                Notification.user_id == user_id,
                Notification.type == notif_type,
                Notification.is_read.is_(False),
                Notification.created_at >= cutoff,
            )
        )
        .order_by(desc(Notification.created_at))
        .limit(10)
        .all()
    )

    existing: Optional[Notification] = None
    for cand in candidates:
        cand_data = cand.data or {}
        cand_bucket = cand_data.get("_bucket_key")
        # مطابقة مباشرة بالمفتاح المخزَّن
        if cand_bucket == bucket:
            existing = cand
            break
        # مطابقة احتياطية بمقارنة target_id + target_type
        if (
            cand_data.get("target_id") == target_id
            and cand_data.get("target_type") == target_type
        ):
            existing = cand
            break

    if existing is None:
        return None

    # لا ندمج نفس الفاعل مرتين (Idempotency)
    data = dict(existing.data or {})
    actors: List[Dict[str, Any]] = list(data.get("batch_actors") or [])
    if actor_id is not None and any(a.get("actor_id") == actor_id for a in actors):
        # نفس الشخص كرر نفس التفاعل — لا نضخّم العدّاد
        return existing

    actors.append(_actor_repr(actor_id, actor_username))
    if len(actors) > MAX_ACTORS_STORED:
        actors = actors[-MAX_ACTORS_STORED:]

    data["batch_actors"] = actors
    data["batch_count"] = len(actors)
    data["_bucket_key"] = bucket
    data["target_id"] = target_id
    data["target_type"] = target_type
    if extra_data:
        # نُدخل بيانات إضافية دون طمس الأصلية
        for k, v in extra_data.items():
            data.setdefault(k, v)

    title, body = _compose_batched_text(notif_type, actors)
    existing.title = title
    existing.body = body
    existing.data = data
    # نُحدّث الطابع الزمني حتى يقفز الإشعار لأعلى القائمة
    existing.created_at = datetime.utcnow()

    db.add(existing)
    db.commit()
    db.refresh(existing)

    logger.info(
        "notification_batched user_id=%s type=%s bucket=%s total_actors=%s",
        user_id, notif_type, bucket, len(actors),
    )
    return existing


def stamp_new_notification_bucket(
    notification: Notification,
    *,
    notif_type: str,
    actor_id: Optional[int],
    actor_username: Optional[str],
    target_id: Optional[int],
    target_type: Optional[str],
) -> Dict[str, Any]:
    """
    عند إنشاء إشعار جديد (لم يُدمج) نضع بذرة التجميع فيه حتى يتمكن
    الإشعار التالي من الدمج معه.
    """
    if notif_type not in BATCHABLE_TYPES:
        return notification.data or {}

    data = dict(notification.data or {})
    data["_bucket_key"] = _bucket_key(
        notification.user_id, notif_type, target_id, target_type
    )
    data["batch_actors"] = [_actor_repr(actor_id, actor_username)]
    data["batch_count"] = 1
    data["target_id"] = target_id
    data["target_type"] = target_type
    return data
