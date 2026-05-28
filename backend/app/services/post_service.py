from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from urllib.parse import quote

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.content_sanitizer import sanitize_text
from app.core.media_urls import normalize_media_list, normalize_media_url
from app.models.comment import Comment
from app.models.like import Like
from app.models.post import Post
from app.models.post_edit_history import PostEditHistory
from app.models.post_poll_vote import PostPollVote
from app.models.post_save import PostSave
from app.models.post_share import PostShare
from app.models.user import User

HASHTAG_RE = re.compile(r'(?<!\w)#([\w\u0600-\u06FF]{1,50})', re.UNICODE)
MENTION_RE = re.compile(r'(?<!\w)@([\w.\-]{1,50})', re.UNICODE)


def utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _loads_list(raw: str | None) -> list:
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


def _dumps(value) -> str | None:
    if value in (None, '', [], {}):
        return None
    return json.dumps(value, ensure_ascii=False)


def _extract_hashtags(text: str) -> list[str]:
    found = []
    for item in HASHTAG_RE.findall(text or ''):
        normalized = str(item).strip().lower()
        if normalized and normalized not in found:
            found.append(normalized)
    return found[:20]


def _extract_mentions(text: str) -> list[str]:
    found = []
    for item in MENTION_RE.findall(text or ''):
        normalized = str(item).strip().lower()
        if normalized and normalized not in found:
            found.append(normalized)
    return found[:20]


def _normalize_media(payload) -> list[str]:
    if isinstance(payload, str):
        items = [payload]
    elif isinstance(payload, list):
        items = payload
    else:
        items = []
    clean = []
    for item in items:
        normalized = normalize_media_url(item)
        if normalized and normalized not in clean:
            clean.append(str(normalized)[:1500])
    return clean[:8]


def _normalize_poll(poll) -> list[dict]:
    options = []
    if isinstance(poll, dict):
        poll = poll.get('options') or []
    if not isinstance(poll, list):
        return options
    for index, option in enumerate(poll, start=1):
        label = sanitize_text(option.get('label') if isinstance(option, dict) else option, max_length=120)
        if not label:
            continue
        options.append({'id': f'option-{index}', 'label': label})
    return options[:6]


def _can_view_post(post: Post, current_user: User | None) -> bool:
    now = utcnow_naive()
    if post.is_draft:
        return current_user is not None and current_user.id == post.user_id
    if post.scheduled_at and post.scheduled_at > now:
        return current_user is not None and current_user.id == post.user_id
    return True


def _share_url(post_id: int) -> str:
    return f'/post/{quote(str(post_id))}'


def _serialize_post(db: Session, post: Post, current_user: User | None = None) -> dict:
    user = db.query(User).filter(User.id == post.user_id).first()
    like_count = db.query(func.count(Like.id)).filter(Like.post_id == post.id).scalar() or 0
    comment_count = db.query(func.count(Comment.id)).filter(Comment.post_id == post.id).scalar() or 0
    media_list = normalize_media_list(_loads_list(post.media_json))
    if not media_list and post.image_url:
        media_list = normalize_media_list([post.image_url])
    if not media_list and getattr(post, 'media', None):
        media_list = normalize_media_list([post.media])
    poll_options = _loads_list(post.poll_options_json)
    poll_votes_rows = db.query(PostPollVote).filter(PostPollVote.post_id == post.id).all()
    poll_votes = {}
    for vote in poll_votes_rows:
        poll_votes[vote.option_key] = poll_votes.get(vote.option_key, 0) + 1
    saved_by_me = False
    liked_by_me = False
    if current_user is not None:
        saved_by_me = db.query(PostSave.id).filter(PostSave.post_id == post.id, PostSave.user_id == current_user.id).first() is not None
        liked_by_me = db.query(Like.id).filter(Like.post_id == post.id, Like.user_id == current_user.id).first() is not None
    poll_items = [
        {
            **option,
            'votes': int(poll_votes.get(option.get('id'), 0)),
            'voted_by_me': bool(current_user is not None and db.query(PostPollVote.id).filter(PostPollVote.post_id == post.id, PostPollVote.user_id == current_user.id, PostPollVote.option_key == option.get('id')).first()),
        }
        for option in poll_options
    ]
    return {
        'id': post.id,
        'user_id': post.user_id,
        'username': user.username if user else (getattr(post, 'username', None) or 'unknown'),
        'avatar': user.avatar if user else None,
        'content': post.content,
        'content_html': post.content_html or '',
        'image_url': media_list[0] if media_list else (post.image_url or ''),
        'media': media_list[0] if media_list else (post.image_url or ''),
        'media_urls': media_list,
        'hashtags': _loads_list(post.hashtags_json),
        'mentions': _loads_list(post.mentions_json),
        'poll': poll_items,
        'created_at': post.created_at,
        'updated_at': post.updated_at,
        'last_edited_at': post.last_edited_at,
        'scheduled_at': post.scheduled_at,
        'published_at': post.published_at,
        'is_draft': bool(post.is_draft),
        'is_pinned': bool(post.is_pinned),
        'allow_comments': bool(post.allow_comments),
        'like_count': like_count,
        'likes': like_count,
        'comment_count': comment_count,
        'comments_count': comment_count,
        'share_count': int(post.share_count or 0),
        'save_count': int(post.save_count or 0),
        'edit_count': int(post.edit_count or 0),
        'liked_by_me': liked_by_me,
        'saved_by_me': saved_by_me,
        'share_url': _share_url(post.id),
    }


def _prepare_post_fields(content: str, content_html: str | None, media_urls, poll, hashtags=None, mentions=None) -> dict:
    clean_content = sanitize_text(content or '', max_length=5000)
    clean_html = str(content_html or '').strip()[:12000] or None
    clean_media = _normalize_media(media_urls)
    clean_poll = _normalize_poll(poll)
    detected_hashtags = hashtags if isinstance(hashtags, list) else _extract_hashtags(clean_content)
    detected_mentions = mentions if isinstance(mentions, list) else _extract_mentions(clean_content)
    return {
        'content': clean_content,
        'content_html': clean_html,
        'image_url': clean_media[0] if clean_media else None,
        'media': clean_media[0] if clean_media else None,
        'media_json': _dumps(clean_media),
        'hashtags_json': _dumps(detected_hashtags),
        'mentions_json': _dumps(detected_mentions),
        'poll_options_json': _dumps(clean_poll),
    }


def create_post(
    db: Session,
    user_id: int,
    content: str,
    image_url: str | None = None,
    *,
    content_html: str | None = None,
    media_urls=None,
    poll=None,
    scheduled_at: datetime | None = None,
    is_draft: bool = False,
    is_pinned: bool = False,
    allow_comments: bool = True,
) -> dict:
    prepared = _prepare_post_fields(content, content_html, media_urls or ([image_url] if image_url else []), poll)
    if not prepared['content'] and not prepared['image_url'] and prepared['poll_options_json'] is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='content, media, or poll is required')
    now = utcnow_naive()
    publish_at = None if is_draft else (scheduled_at if scheduled_at and scheduled_at > now else now)
    current_user = db.query(User).filter(User.id == user_id).first()
    post = Post(
        user_id=user_id,
        username=current_user.username if current_user else None,
        scheduled_at=scheduled_at,
        published_at=publish_at,
        is_draft=bool(is_draft),
        is_pinned=bool(is_pinned),
        pinned_at=now if is_pinned else None,
        allow_comments=bool(allow_comments),
        updated_at=now,
        media=prepared.get('media'),
        **prepared,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return _serialize_post(db, post, current_user=current_user)


def _publish_due_posts(db: Session) -> None:
    now = utcnow_naive()
    due_posts = db.query(Post).filter(Post.is_draft.is_(False), Post.scheduled_at.isnot(None), Post.scheduled_at <= now, Post.published_at.is_(None)).all()
    changed = False
    for post in due_posts:
        post.published_at = post.scheduled_at or now
        post.updated_at = now
        changed = True
    if changed:
        db.commit()


def get_posts(db: Session, current_user: User | None = None, skip: int = 0, limit: int = 10, include_drafts: bool = False) -> list[dict]:
    _publish_due_posts(db)
    posts = db.query(Post).order_by(Post.is_pinned.desc(), Post.pinned_at.desc(), Post.created_at.desc()).offset(skip).limit(limit * 3).all()
    visible = []
    for post in posts:
        if not _can_view_post(post, current_user):
            continue
        if post.is_draft and not include_drafts:
            continue
        visible.append(_serialize_post(db, post, current_user=current_user))
        if len(visible) >= limit:
            break
    return visible


def get_user_drafts(db: Session, user: User) -> list[dict]:
    posts = db.query(Post).filter(Post.user_id == user.id, Post.is_draft.is_(True)).order_by(Post.updated_at.desc(), Post.created_at.desc()).all()
    return [_serialize_post(db, post, current_user=user) for post in posts]


def get_posts_by_username(db: Session, username: str, current_user: User | None = None) -> list[dict]:
    user = db.query(User).filter(User.username == username, User.is_active.is_(True)).first()
    if user is not None:
        posts = db.query(Post).filter(Post.user_id == user.id).order_by(Post.is_pinned.desc(), Post.created_at.desc()).all()
        return [_serialize_post(db, post, current_user=current_user) for post in posts if _can_view_post(post, current_user)]
    posts = db.query(Post).filter(Post.username == username).order_by(Post.is_pinned.desc(), Post.created_at.desc()).all()
    return [_serialize_post(db, post, current_user=current_user) for post in posts if _can_view_post(post, current_user)]


def update_post(
    db: Session,
    post_id: int,
    user_id: int,
    *,
    content: str | None = None,
    content_html: str | None = None,
    media_urls=None,
    poll=None,
    scheduled_at: datetime | None = None,
    is_draft: bool | None = None,
    is_pinned: bool | None = None,
    allow_comments: bool | None = None,
) -> dict:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')
    if post.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')

    history = PostEditHistory(
        post_id=post.id,
        editor_user_id=user_id,
        previous_content=post.content,
        previous_content_html=post.content_html,
        previous_media_json=post.media_json,
        previous_poll_json=post.poll_options_json,
    )
    db.add(history)

    prepared = _prepare_post_fields(
        content if content is not None else post.content,
        content_html if content_html is not None else post.content_html,
        media_urls if media_urls is not None else _loads_list(post.media_json),
        poll if poll is not None else _loads_list(post.poll_options_json),
    )
    post.content = prepared['content']
    post.content_html = prepared['content_html']
    post.image_url = prepared['image_url']
    post.media = prepared['media']
    post.media_json = prepared['media_json']
    post.hashtags_json = prepared['hashtags_json']
    post.mentions_json = prepared['mentions_json']
    post.poll_options_json = prepared['poll_options_json']
    if scheduled_at is not None:
        post.scheduled_at = scheduled_at
        if not post.is_draft:
            post.published_at = None if scheduled_at > utcnow_naive() else utcnow_naive()
    if is_draft is not None:
        post.is_draft = bool(is_draft)
        if not post.is_draft and post.published_at is None:
            post.published_at = utcnow_naive()
    if is_pinned is not None:
        post.is_pinned = bool(is_pinned)
        post.pinned_at = utcnow_naive() if post.is_pinned else None
    if allow_comments is not None:
        post.allow_comments = bool(allow_comments)
    post.edit_count = int(post.edit_count or 0) + 1
    post.last_edited_at = utcnow_naive()
    post.updated_at = utcnow_naive()
    db.commit()
    db.refresh(post)
    current_user = db.query(User).filter(User.id == user_id).first()
    return _serialize_post(db, post, current_user=current_user)


def get_post_history(db: Session, post_id: int, user_id: int) -> list[dict]:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')
    if post.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')
    rows = db.query(PostEditHistory).filter(PostEditHistory.post_id == post_id).order_by(PostEditHistory.edited_at.desc()).all()
    return [
        {
            'id': row.id,
            'previous_content': row.previous_content or '',
            'previous_content_html': row.previous_content_html or '',
            'previous_media_urls': _loads_list(row.previous_media_json),
            'previous_poll': _loads_list(row.previous_poll_json),
            'edited_at': row.edited_at,
        }
        for row in rows
    ]


def get_post_insights(db: Session, post_id: int, current_user: User | None = None) -> dict:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')
    if not _can_view_post(post, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')

    like_count = db.query(func.count(Like.id)).filter(Like.post_id == post_id).scalar() or 0
    comment_count = db.query(func.count(Comment.id)).filter(Comment.post_id == post_id).scalar() or 0
    save_count = db.query(func.count(PostSave.id)).filter(PostSave.post_id == post_id).scalar() or 0
    share_count = db.query(func.count(PostShare.id)).filter(PostShare.post_id == post_id).scalar() or 0
    latest_comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at.desc()).limit(5).all()
    recent_commenters = []
    for comment in latest_comments:
        user = db.query(User).filter(User.id == comment.user_id).first()
        recent_commenters.append({
            'id': comment.id,
            'username': user.username if user else 'unknown',
            'content': comment.content,
            'created_at': comment.created_at,
            'parent_id': comment.parent_id,
        })

    engagement_score = int(like_count + (comment_count * 2) + share_count + save_count)
    return {
        'post_id': post_id,
        'likes': int(like_count),
        'comments': int(comment_count),
        'shares': int(share_count),
        'saves': int(save_count),
        'edits': int(post.edit_count or 0),
        'engagement_score': engagement_score,
        'comment_velocity': 'مرتفع' if comment_count >= 10 else ('متوسط' if comment_count >= 3 else 'منخفض'),
        'share_url': _share_url(post_id),
        'recent_commenters': recent_commenters,
        'updated_at': post.updated_at or post.created_at,
    }


def like_post(db: Session, user_id: int, post_id: int) -> dict:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')

    existing_like = db.query(Like).filter(Like.user_id == user_id, Like.post_id == post_id).first()
    liked = False
    if existing_like:
        db.delete(existing_like)
    else:
        like = Like(user_id=user_id, post_id=post_id)
        db.add(like)
        liked = True
    db.commit()
    like_count = db.query(func.count(Like.id)).filter(Like.post_id == post_id).scalar() or 0
    return {'message': 'Liked' if liked else 'Unliked', 'post_id': post_id, 'like_count': like_count, 'likes': like_count, 'liked': liked}


def toggle_save_post(db: Session, user_id: int, post_id: int) -> dict:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')
    existing = db.query(PostSave).filter(PostSave.user_id == user_id, PostSave.post_id == post_id).first()
    saved = False
    if existing:
        db.delete(existing)
    else:
        db.add(PostSave(user_id=user_id, post_id=post_id))
        saved = True
    db.commit()
    post.save_count = db.query(func.count(PostSave.id)).filter(PostSave.post_id == post_id).scalar() or 0
    db.commit()
    return {'post_id': post_id, 'saved': saved, 'save_count': int(post.save_count or 0)}


def share_post(db: Session, user_id: int, post_id: int, platform: str | None = None) -> dict:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')
    db.add(PostShare(user_id=user_id, post_id=post_id, platform=(platform or 'copy')[:60]))
    post.share_count = int(post.share_count or 0) + 1
    post.updated_at = utcnow_naive()
    db.commit()
    return {'post_id': post_id, 'share_count': int(post.share_count or 0), 'share_url': _share_url(post_id)}


def vote_poll(db: Session, user_id: int, post_id: int, option_key: str) -> dict:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')
    options = _loads_list(post.poll_options_json)
    valid_keys = {item.get('id') for item in options if isinstance(item, dict)}
    if not valid_keys:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Poll is not available')
    if option_key not in valid_keys:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid poll option')
    existing = db.query(PostPollVote).filter(PostPollVote.post_id == post_id, PostPollVote.user_id == user_id).first()
    if existing:
        existing.option_key = option_key
    else:
        db.add(PostPollVote(post_id=post_id, user_id=user_id, option_key=option_key))
    db.commit()
    current_user = db.query(User).filter(User.id == user_id).first()
    return _serialize_post(db, post, current_user=current_user)


def delete_post(db: Session, post_id: int, user_id: int) -> dict:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')
    if post.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')

    db.delete(post)
    db.commit()
    return {'message': 'Deleted'}
