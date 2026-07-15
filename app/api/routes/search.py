from collections import Counter
from datetime import datetime
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.post import Post
from app.models.search_history import SearchCategoryEnum, SearchHistory
from app.models.user import User

router = APIRouter()
HASHTAG_REGEX = re.compile(r'#[\w\u0600-\u06FF_-]+', re.UNICODE)
MENTION_REGEX = re.compile(r'@[\w\u0600-\u06FF._-]+', re.UNICODE)


def _safe_text(value: str | None) -> str:
    return (value or '').strip()


def _extract_hashtags(*chunks: str) -> list[str]:
    text = ' '.join(_safe_text(chunk) for chunk in chunks if chunk)
    return list(dict.fromkeys(tag.lower() for tag in HASHTAG_REGEX.findall(text)))


def _extract_mentions(*chunks: str) -> list[str]:
    text = ' '.join(_safe_text(chunk) for chunk in chunks if chunk)
    return list(dict.fromkeys(tag.lower() for tag in MENTION_REGEX.findall(text)))


def _score_user(user: User, query: str) -> float:
    q = query.lower()
    username = (user.username or '').lower()
    full_name = (getattr(user, 'full_name', '') or '').lower()
    bio = ''
    score = 0.0
    if username == q:
        score += 1.0
    elif username.startswith(q):
        score += 0.82
    elif q in username:
        score += 0.68
    if full_name.startswith(q):
        score += 0.2
    elif q in full_name:
        score += 0.12
    if q in bio:
        score += 0.08
    if bool(getattr(user, 'role', '') == 'admin'):
        score += 0.05
    score += min(float(getattr(user, 'followers_count', 0) or 0) / 200000, 0.12)
    return round(min(score, 1.0), 4)


def _score_post(post: Post, query: str) -> float:
    q = query.lower()
    text = f"{_safe_text(post.content)} {_safe_text(post.content_html)}".lower()
    score = 0.0
    if text.startswith(q):
        score += 0.76
    elif q in text:
        score += 0.58
    hashtags = _extract_hashtags(post.content, post.content_html)
    mentions = _extract_mentions(post.content, post.content_html)
    if any(q in tag for tag in hashtags):
        score += 0.18
    if any(q in mention for mention in mentions):
        score += 0.08
    score += min(float(getattr(post, 'share_count', 0) or 0) / 1000, 0.08)
    score += min(float(getattr(post, 'save_count', 0) or 0) / 1000, 0.06)
    return round(min(score, 1.0), 4)


def _serialize_user(user: User, query: str) -> dict:
    return {
        'id': str(user.id),
        'type': 'users',
        'score': _score_user(user, query),
        'title': getattr(user, 'full_name', None) or user.username,
        'name': user.username,
        'description': f"@{user.username}",
        'avatar': getattr(user, 'avatar_url', None) or getattr(user, 'avatar', '') or '',
        'isVerified': bool(getattr(user, 'role', '') == 'admin'),
        'hashtags': [],
        'mentions': [f"@{user.username.lower()}"] if user.username else [],
        'metrics': {
            'followers': int(getattr(user, 'followers_count', 0) or 0),
            'following': int(getattr(user, 'following_count', 0) or 0),
        },
        'route': f"/profile/{user.username}",
    }


def _serialize_post(post: Post, query: str) -> dict:
    hashtags = _extract_hashtags(post.content, post.content_html)
    mentions = _extract_mentions(post.content, post.content_html)
    media_url = getattr(post, 'image_url', None) or getattr(post, 'media', None) or ''
    preview = _safe_text(post.content)[:160] or 'منشور جديد'
    return {
        'id': str(post.id),
        'type': 'posts',
        'score': _score_post(post, query),
        'title': preview[:60],
        'description': preview,
        'content': _safe_text(post.content),
        'avatar': '',
        'media': media_url,
        'hashtags': hashtags,
        'mentions': mentions,
        'isVerified': False,
        'metrics': {
            'shares': int(getattr(post, 'share_count', 0) or 0),
            'saves': int(getattr(post, 'save_count', 0) or 0),
        },
        'route': f"/post/{post.id}",
        'createdAt': post.created_at.isoformat() if getattr(post, 'created_at', None) else None,
    }


def _save_history(db: Session, user_id: int, query: str, category: str, results_count: int) -> None:
    try:
        category_enum = SearchCategoryEnum(category if category in SearchCategoryEnum._value2member_map_ else 'top')
        db.add(SearchHistory(user_id=user_id, query=query, category=category_enum, results_count=results_count))
        db.commit()
    except Exception:
        db.rollback()


@router.get('/')
async def search(
    q: str = Query(..., min_length=1, max_length=100),
    type: Optional[str] = Query('all'),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = _safe_text(q)
    if not query:
        raise HTTPException(status_code=400, detail='Query is required')

    normalized_type = (type or 'all').strip().lower()
    results: list[dict] = []

    if normalized_type in {'all', 'users', 'accounts'}:
        users = (
            db.query(User)
            .filter(
                User.is_active.is_(True),
                or_(
                    User.username.ilike(f'%{query}%'),
                    User.email.ilike(f'%{query}%'),
                ),
            )
            .order_by(User.followers_count.desc(), User.created_at.desc())
            .limit(limit)
            .all()
        )
        results.extend(_serialize_user(user, query) for user in users)

    if normalized_type in {'all', 'posts', 'hashtags'}:
        posts = (
            db.query(Post)
            .filter(
                Post.is_draft.is_(False),
                or_(
                    Post.content.ilike(f'%{query}%'),
                    Post.content_html.ilike(f'%{query}%'),
                ),
            )
            .order_by(Post.created_at.desc())
            .limit(limit)
            .all()
        )
        serialized_posts = [_serialize_post(post, query) for post in posts]
        if normalized_type == 'hashtags' or query.startswith('#'):
            hashtag_query = query if query.startswith('#') else f'#{query.lower()}'
            results.extend(item for item in serialized_posts if hashtag_query.lower() in item.get('hashtags', []))
        else:
            results.extend(serialized_posts)

    results = sorted(results, key=lambda item: item.get('score', 0), reverse=True)[:limit]
    _save_history(db, current_user.id, query, 'accounts' if normalized_type in {'users', 'accounts'} else 'posts' if normalized_type == 'posts' else 'top', len(results))

    return {
        'query': query,
        'results': results,
        'total': len(results),
        'engine': 'yamshat-smart-search',
        'timestamp': datetime.utcnow().isoformat(),
    }


@router.get('/trending')
def get_trending_topics(limit: int = Query(10, ge=1, le=30), db: Session = Depends(get_db)):
    recent_posts = db.query(Post).filter(Post.is_draft.is_(False)).order_by(Post.created_at.desc()).limit(200).all()
    counter: Counter[str] = Counter()
    for post in recent_posts:
        counter.update(_extract_hashtags(post.content, post.content_html))
    trending = [
        {
            'tag': tag,
            'score': count * 100,
            'growth': f'+{min(count * 4, 99)}%',
        }
        for tag, count in counter.most_common(limit)
    ]
    return {
        'category': 'all',
        'trending': trending,
        'timestamp': datetime.utcnow().isoformat(),
    }


@router.get('/suggestions')
async def search_suggestions(
    q: str = Query(..., min_length=1, max_length=50),
    limit: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = _safe_text(q)
    suggestions: list[dict] = []

    matching_users = (
        db.query(User)
        .filter(
            User.is_active.is_(True),
            or_(User.username.ilike(f'{query}%'), User.email.ilike(f'{query}%')),
        )
        .order_by(User.followers_count.desc())
        .limit(limit)
        .all()
    )
    for user in matching_users:
        suggestions.append({
            'id': f'user_{user.id}',
            'text': f'@{user.username}',
            'type': 'user',
            'icon': '👤',
            'frequency': int(getattr(user, 'followers_count', 0) or 0),
        })

    hashtag_counter: Counter[str] = Counter()
    recent_posts = db.query(Post).filter(Post.is_draft.is_(False), Post.content.ilike(f'%{query}%')).order_by(Post.created_at.desc()).limit(100).all()
    for post in recent_posts:
        for tag in _extract_hashtags(post.content, post.content_html):
            if query.lower().replace('#', '') in tag.replace('#', ''):
                hashtag_counter[tag] += 1
    for tag, count in hashtag_counter.most_common(limit):
        suggestions.append({
            'id': f'hashtag_{tag}',
            'text': tag,
            'type': 'hashtag',
            'icon': '#',
            'frequency': count,
        })

    suggestions.append({
        'id': f'search_{query}',
        'text': query,
        'type': 'search',
        'icon': '🔎',
        'frequency': 1,
    })

    deduped: list[dict] = []
    seen: set[str] = set()
    for item in suggestions:
        key = item['text'].lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
        if len(deduped) >= limit:
            break

    return {
        'suggestions': deduped,
        'total': len(deduped),
        'query': query,
    }
