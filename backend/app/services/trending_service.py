"""
======================================================================
Yamshat — Trending Service (v88.51)
----------------------------------------------------------------------
منطق تحديد الوسوم/المنشورات "التريند" ورفع إشارة (Socket + Notification)
عند بلوغ عتبة التريند، مع تصنيف عالمي وحسب الدولة.

## كيف نميّز الخبر أنه "تريند"؟
نعتمد على درجة مركّبة (Trend Score) في نافذة زمنية قصيرة (آخر 6 ساعات):

    score = (0.35 * likes)
          + (0.25 * comments)
          + (0.20 * shares)
          + (0.15 * views)
          + (0.05 * saves)

ثم نضرب النتيجة بمعامل نمو (velocity) نسبةً لآخر ساعة:
    velocity = (interactions_last_1h + 1) / (interactions_last_6h + 1)
    trend_score = score * (1 + velocity)

- عتبة التريند العالمي:  trend_score ≥ 500
- عتبة تريند الدولة:      trend_score_country ≥ 120

عند اجتياز العتبة أول مرة يتم:
  1. تحديد المنشور/الوسم trending=True في الذاكرة (Redis-like state)
  2. إطلاق إشارة `trending:new` عبر Socket.IO للأدمن
  3. إنشاء إشعار Notification في قاعدة البيانات
  4. إبلاغ صاحب المنشور بإشعار خاص "🔥 منشورك أصبح تريند"

======================================================================
"""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from typing import Any, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.post import Post
from app.models.like import Like
from app.models.comment import Comment
from app.models.user import User
from app.models.notification import Notification

# v88.52 — حارس السلامة: يمنع المحتوى التحريضي/الطائفي/الإرهابي من الصعود
try:
    from app.services.trending_safety import (
        classify_trending_content,
        is_trending_blocked,
        record_safety_audit,
    )
    _SAFETY_ENABLED = True
except Exception:  # pragma: no cover
    _SAFETY_ENABLED = False

# --------------------------------------------------------------------
# ثوابت الخوارزمية
# --------------------------------------------------------------------
TREND_WINDOW_HOURS = 6         # النافذة الزمنية لحساب النقاط
VELOCITY_WINDOW_HOURS = 1      # نافذة قياس السرعة
GLOBAL_TREND_THRESHOLD = 500   # عتبة التريند العالمي
COUNTRY_TREND_THRESHOLD = 120  # عتبة تريند الدولة

HASHTAG_REGEX = re.compile(r'#[\w\u0600-\u06FF_-]+', re.UNICODE)

# ذاكرة داخلية لحفظ حالة "منشور/وسم بالفعل تريند" حتى لا نبعث إشارات مكررة.
# (في الإنتاج تُستبدل بـ Redis)
_TRENDING_STATE: dict[str, dict[str, Any]] = {
    "global_posts": {},      # post_id -> {"since": datetime, "score": float}
    "global_hashtags": {},   # tag -> {...}
    "country_posts": defaultdict(dict),      # country_code -> {post_id: ...}
    "country_hashtags": defaultdict(dict),   # country_code -> {tag: ...}
}


# --------------------------------------------------------------------
# نماذج نتيجة
# --------------------------------------------------------------------
@dataclass
class TrendingItem:
    kind: str                    # "post" | "hashtag"
    key: str                     # post_id أو hashtag
    title: str
    score: float
    velocity: float
    likes: int = 0
    comments: int = 0
    shares: int = 0
    views: int = 0
    saves: int = 0
    country: Optional[str] = None
    is_new: bool = False         # هل بلغ للتو مرحلة التريند؟
    author: Optional[str] = None
    author_id: Optional[int] = None
    post_id: Optional[int] = None
    detected_at: Optional[str] = None
    threshold: Optional[float] = None
    # v88.52 — حقول السلامة
    safety_action: str = 'allow'          # allow | review | block
    safety_risk: int = 0                  # 0..100
    safety_categories: list = field(default_factory=list)
    safety_labels: list = field(default_factory=list)
    safety_matched: list = field(default_factory=list)
    blocked_from_trending: bool = False   # منع الصعود آلياً أو يدوياً

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# --------------------------------------------------------------------
# المساعدات
# --------------------------------------------------------------------
def _extract_hashtags(text: str | None) -> list[str]:
    if not text:
        return []
    return [t.lower() for t in HASHTAG_REGEX.findall(text)]


def _user_country(user: User | None) -> Optional[str]:
    """
    استخراج دولة المستخدم. المخطط الحالي لا يخزّن country مباشرة على User،
    لذا نستخدم `getattr` مع fallback إلى 'GLOBAL'. عندما يُضاف عمود
    `country_code` مستقبلاً سيعمل تلقائياً.
    """
    if not user:
        return None
    return getattr(user, "country_code", None) or getattr(user, "country", None)


def _compute_post_score(
    likes: int, comments: int, shares: int, views: int, saves: int
) -> float:
    return (
        0.35 * likes
        + 0.25 * comments
        + 0.20 * shares
        + 0.15 * views
        + 0.05 * saves
    )


# --------------------------------------------------------------------
# الحساب الرئيسي
# --------------------------------------------------------------------
def compute_trending(
    db: Session,
    scope: str = "global",
    country: Optional[str] = None,
    limit: int = 20,
) -> list[TrendingItem]:
    """
    يُرجع قائمة العناصر التريند (منشورات + وسوم) حسب النطاق:
      - scope="global"  : تريند عالمي
      - scope="country" : تريند دولة محددة (country=..)
    """
    now = datetime.utcnow()
    window_start = now - timedelta(hours=TREND_WINDOW_HOURS)
    velocity_start = now - timedelta(hours=VELOCITY_WINDOW_HOURS)

    # 1) المنشورات النشطة في النافذة
    posts_query = (
        db.query(Post)
        .filter(Post.is_draft.is_(False))
        .filter(Post.created_at >= window_start)
    )
    posts = posts_query.all()

    # 2) عدّاد اللايكات لكل منشور في النافذة + نافذة السرعة
    like_counts_6h: dict[int, int] = dict(
        db.query(Like.post_id, func.count(Like.id))
        .filter(Like.post_id.in_([p.id for p in posts]) if posts else False)
        .group_by(Like.post_id)
        .all()
    )
    like_counts_1h_rows = (
        db.query(Like.post_id, func.count(Like.id))
        .filter(Like.post_id.in_([p.id for p in posts]) if posts else False)
        .filter(Like.id.isnot(None))  # placeholder – Like has no timestamp column here
        .group_by(Like.post_id)
        .all()
    )
    # لأن نموذج Like الأساسي لا يحتوي على timestamp، نقارب سرعة الساعة الأخيرة
    # بنسبة 1/6 من عدد اللايكات الكلي في النافذة كتقريب أوّلي، مع تفضيل
    # المنشورات الأحدث (كلما اقترب created_at من الآن زادت السرعة).
    like_counts_1h: dict[int, int] = {}
    for p in posts:
        age_hours = max((now - p.created_at).total_seconds() / 3600, 0.1)
        weight = max(0.15, min(1.0, 1.0 / age_hours))
        like_counts_1h[p.id] = int(like_counts_6h.get(p.id, 0) * weight)

    # 3) عدّاد التعليقات
    comment_counts: dict[int, int] = dict(
        db.query(Comment.post_id, func.count(Comment.id))
        .filter(Comment.post_id.in_([p.id for p in posts]) if posts else False)
        .filter(Comment.timestamp >= window_start)
        .group_by(Comment.post_id)
        .all()
    )

    # 4) بناء نتائج المنشورات
    items: list[TrendingItem] = []
    hashtag_bucket: Counter[str] = Counter()
    hashtag_meta: dict[str, dict[str, Any]] = {}

    threshold = (
        GLOBAL_TREND_THRESHOLD if scope == "global" else COUNTRY_TREND_THRESHOLD
    )

    for post in posts:
        likes = like_counts_6h.get(post.id, 0)
        comments = comment_counts.get(post.id, 0)
        shares = int(getattr(post, "share_count", 0) or 0)
        saves = int(getattr(post, "save_count", 0) or 0)
        views = max(likes * 4, comments * 8)  # تقريب حتى تُضاف جداول Views

        base = _compute_post_score(likes, comments, shares, views, saves)
        velocity = (like_counts_1h.get(post.id, 0) + 1) / (likes + 1)
        score = base * (1 + velocity)

        if score < threshold:
            continue

        # فلترة الدولة
        author = db.query(User).filter(User.id == post.user_id).first()
        author_country = _user_country(author)
        if scope == "country":
            if not country or (author_country or "GLOBAL").upper() != country.upper():
                continue

        item = TrendingItem(
            kind="post",
            key=f"post_{post.id}",
            title=(post.content or "")[:140] or f"منشور #{post.id}",
            score=round(score, 2),
            velocity=round(velocity, 3),
            likes=likes,
            comments=comments,
            shares=shares,
            views=views,
            saves=saves,
            country=author_country if scope == "country" else None,
            author=(author.username if author else None),
            author_id=(author.id if author else None),
            post_id=post.id,
            detected_at=now.isoformat(),
            threshold=threshold,
        )

        # v88.52 — تصنيف السلامة قبل قبول المنشور كتريند
        if _SAFETY_ENABLED:
            verdict = classify_trending_content(
                title=post.content or '',
                body=getattr(post, 'content_html', '') or '',
                hashtags=_extract_hashtags(post.content),
            )
            item.safety_action = verdict.action
            item.safety_risk = verdict.risk_score
            item.safety_categories = list(verdict.categories)
            item.safety_labels = list(verdict.labels)
            item.safety_matched = list(verdict.matched_words)
            if is_trending_blocked(item.key, verdict):
                item.blocked_from_trending = True
                record_safety_audit(
                    key=item.key,
                    title=item.title,
                    verdict=verdict,
                    outcome='blocked',
                    actor='auto',
                )
                # لا نضيفه لقائمة التريندات — المحتوى المحرّض ممنوع من الصعود
                continue
            elif verdict.action == 'review':
                record_safety_audit(
                    key=item.key,
                    title=item.title,
                    verdict=verdict,
                    outcome='review',
                    actor='auto',
                )

        items.append(item)

        # جمع وسوم المنشور
        tags = _extract_hashtags(post.content) + _extract_hashtags(post.content_html)
        for tag in set(tags):
            hashtag_bucket[tag] += int(score / 10)
            meta = hashtag_meta.setdefault(
                tag,
                {"likes": 0, "comments": 0, "shares": 0, "posts": 0, "country": author_country},
            )
            meta["likes"] += likes
            meta["comments"] += comments
            meta["shares"] += shares
            meta["posts"] += 1

    # 5) بناء عناصر الوسوم (مع نفس فحص السلامة على نص الوسم)
    for tag, tag_score in hashtag_bucket.most_common(limit):
        if tag_score < threshold / 2:
            continue
        meta = hashtag_meta.get(tag, {})
        tag_item = TrendingItem(
            kind="hashtag",
            key=tag,
            title=tag,
            score=float(tag_score),
            velocity=0.0,
            likes=meta.get("likes", 0),
            comments=meta.get("comments", 0),
            shares=meta.get("shares", 0),
            views=0,
            saves=0,
            country=meta.get("country") if scope == "country" else None,
            detected_at=now.isoformat(),
            threshold=threshold,
        )

        # v88.52 — فحص الوسم نفسه (كثير من التريندات الخطيرة تكون هاشتاق)
        if _SAFETY_ENABLED:
            v_tag = classify_trending_content(title=tag)
            tag_item.safety_action = v_tag.action
            tag_item.safety_risk = v_tag.risk_score
            tag_item.safety_categories = list(v_tag.categories)
            tag_item.safety_labels = list(v_tag.labels)
            tag_item.safety_matched = list(v_tag.matched_words)
            if is_trending_blocked(tag_item.key, v_tag):
                tag_item.blocked_from_trending = True
                record_safety_audit(
                    key=tag_item.key,
                    title=tag_item.title,
                    verdict=v_tag,
                    outcome='blocked',
                    actor='auto',
                )
                continue

        items.append(tag_item)

    # 6) وسم "جديد" لأول مرة يعبر العتبة
    state_key = "global_posts" if scope == "global" else "country_posts"
    for item in items:
        bucket = (
            _TRENDING_STATE[state_key]
            if scope == "global"
            else _TRENDING_STATE[state_key][(country or "GLOBAL").upper()]
        )
        if item.key not in bucket:
            item.is_new = True
            bucket[item.key] = {"since": now.isoformat(), "score": item.score}

    items.sort(key=lambda i: i.score, reverse=True)
    return items[:limit]


# --------------------------------------------------------------------
# رفع الإشارة (Signal)
# --------------------------------------------------------------------
async def emit_trending_signals(
    db: Session,
    new_items: list[TrendingItem],
    scope: str,
    country: Optional[str] = None,
) -> int:
    """
    عند اكتشاف عناصر جديدة اجتازت عتبة التريند:
      - يبعث حدث `trending:new` عبر Socket.IO لغرفة الأدمن.
      - يُنشئ سجل Notification.
      - يُخطر صاحب المنشور بإشعار خاص.
    """
    if not new_items:
        return 0

    try:
        from app.core.socket_server import sio
    except Exception:
        sio = None

    dispatched = 0
    for item in new_items:
        if not item.is_new:
            continue

        payload = {
            "scope": scope,
            "country": country,
            "kind": item.kind,
            "key": item.key,
            "title": item.title,
            "score": item.score,
            "post_id": item.post_id,
            "author": item.author,
            "detected_at": item.detected_at,
        }

        # 1) Socket: بث لغرفة الأدمن
        if sio is not None:
            try:
                await sio.emit("trending:new", payload, room="admin_dashboard")
            except Exception:
                pass

        # 2) إشعار عام مسجّل في DB
        try:
            db.add(
                Notification(
                    user_id=item.author_id or 0,
                    type="trending",
                    title=(
                        "🔥 منشورك أصبح تريند عالمياً"
                        if scope == "global"
                        else f"🔥 منشورك أصبح تريند في {country}"
                    ),
                    body=item.title,
                    extra=json.dumps(payload, ensure_ascii=False),
                )
            )
            db.commit()
        except Exception:
            db.rollback()

        dispatched += 1

    return dispatched


# --------------------------------------------------------------------
# نظرة عامة (للـ Dashboard box)
# --------------------------------------------------------------------
def trending_overview(db: Session, limit: int = 5) -> dict[str, Any]:
    """
    ملخّص سريع للصندوق المُستبدل بـ "إدارة البثوث":
      - قمّة التريند العالمي (top 5)
      - قمّة التريند لكل دولة (top 3 من كل دولة)
    """
    global_items = compute_trending(db, scope="global", limit=limit)

    country_map: dict[str, list[dict]] = {}
    # نستخرج قائمة الدول الحاضرة من المستخدمين النشطين
    active_countries = (
        db.query(getattr(User, "country_code", User.role))
        .filter(User.is_active.is_(True))
        .distinct()
        .limit(10)
        .all()
        if hasattr(User, "country_code")
        else []
    )
    for row in active_countries:
        code = row[0]
        if not code:
            continue
        items = compute_trending(db, scope="country", country=code, limit=3)
        if items:
            country_map[code.upper()] = [i.to_dict() for i in items]

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "global": [i.to_dict() for i in global_items],
        "by_country": country_map,
        "algorithm": {
            "window_hours": TREND_WINDOW_HOURS,
            "global_threshold": GLOBAL_TREND_THRESHOLD,
            "country_threshold": COUNTRY_TREND_THRESHOLD,
            "formula": "0.35L + 0.25C + 0.20S + 0.15V + 0.05Sv × (1 + velocity)",
        },
    }
