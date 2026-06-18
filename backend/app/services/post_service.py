from __future__ import annotations

import json
import logging
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
logger = logging.getLogger(__name__)


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


def _looks_like_video_url(value: str | None) -> bool:
    candidate = str(value or '').strip().lower()
    if not candidate:
        return False
    if candidate.startswith('data:video/'):
        return True
    video_markers = (
        '.mp4', '.webm', '.mov', '.m4v', '.mkv', '.avi', '.m3u8',
        '/video/upload/', '/videos/', '/stream/', '/reels/', 'resource_type=video',
        'content_type=video', 'mime_type=video', 'video/',
    )
    return any(marker in candidate for marker in video_markers)


def _infer_media_kind(media_list: list[str]) -> str | None:
    if not media_list:
        return None
    return 'video' if any(_looks_like_video_url(item) for item in media_list) else 'image'


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
    primary_media_url = media_list[0] if media_list else normalize_media_url(post.image_url or post.media or '') or ''
    media_kind = _infer_media_kind(media_list or ([primary_media_url] if primary_media_url else []))
    thumbnail_url = ''
    if media_kind == 'video':
        for item in media_list[1:]:
            if not _looks_like_video_url(item):
                thumbnail_url = item
                break
        if not thumbnail_url and post.image_url and not _looks_like_video_url(post.image_url):
            thumbnail_url = normalize_media_url(post.image_url) or ''
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
    # ✅ FIX (v48): حساب الاسم المعروض ديناميكياً من المستخدم الحالي
    # بحيث تتحدث كل المنشورات فوراً عند تغيير الاسم في الملف الشخصي.
    _author_display = ''
    if user is not None:
        _author_display = (getattr(user, 'display_name', None) or '').strip()
        if not _author_display:
            _author_display = user.username or ''
    if not _author_display:
        _author_display = getattr(post, 'username', None) or 'unknown'
    return {
        'id': post.id,
        'user_id': post.user_id,
        'username': user.username if user else (getattr(post, 'username', None) or 'unknown'),
        'author_name': _author_display,
        'display_name': _author_display,
        'full_name': _author_display,
        'user_avatar': user.avatar if user else (getattr(post, 'user_avatar', None) or None),
        'avatar': user.avatar if user else (getattr(post, 'user_avatar', None) or None),
        'content': post.content,
        'content_html': post.content_html or '',
        'image_url': thumbnail_url or primary_media_url,
        'media': primary_media_url,
        'media_url': primary_media_url,
        'media_urls': media_list,
        'media_type': media_kind or 'image',
        'has_video': media_kind == 'video',
        'thumbnail_url': thumbnail_url or '',
        'preview_url': thumbnail_url or primary_media_url,
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
        'type': 'video' if media_kind == 'video' else 'post',
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
    if not prepared['content'] and not prepared['image_url'] and not prepared['media'] and prepared['poll_options_json'] is None:
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
    posts = db.query(Post).order_by(func.coalesce(Post.published_at, Post.created_at).desc(), Post.id.desc()).offset(skip).limit(limit * 3).all()
    visible = []
    for post in posts:
        if not _can_view_post(post, current_user):
            continue
        if post.is_draft and not include_drafts:
            continue
        try:
            visible.append(_serialize_post(db, post, current_user=current_user))
        except Exception as exc:
            logger.warning('Skipping malformed post %s during feed serialization: %s', getattr(post, 'id', 'unknown'), exc)
            try:
                db.rollback()
            except Exception:
                pass
            continue
        if len(visible) >= limit:
            break
    return visible


def get_user_drafts(db: Session, user: User) -> list[dict]:
    posts = db.query(Post).filter(Post.user_id == user.id, Post.is_draft.is_(True)).order_by(Post.updated_at.desc(), Post.created_at.desc()).all()
    return [_serialize_post(db, post, current_user=user) for post in posts]


def get_posts_by_username(db: Session, username: str, current_user: User | None = None) -> list[dict]:
    user = db.query(User).filter(User.username == username, User.is_active.is_(True)).first()
    if user is not None:
        posts = db.query(Post).filter(Post.user_id == user.id).order_by(func.coalesce(Post.published_at, Post.created_at).desc(), Post.id.desc()).all()
        return [_serialize_post(db, post, current_user=current_user) for post in posts if _can_view_post(post, current_user)]
    posts = db.query(Post).filter(Post.username == username).order_by(func.coalesce(Post.published_at, Post.created_at).desc(), Post.id.desc()).all()
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
    for key, value in prepared.items():
        setattr(post, key, value)
    if scheduled_at is not None:
        post.scheduled_at = scheduled_at
    if is_draft is not None:
        post.is_draft = bool(is_draft)
    if is_pinned is not None:
        post.is_pinned = bool(is_pinned)
        if post.is_pinned:
            post.pinned_at = utcnow_naive()
    if allow_comments is not None:
        post.allow_comments = bool(allow_comments)
    post.updated_at = utcnow_naive()
    post.last_edited_at = post.updated_at
    post.edit_count = (post.edit_count or 0) + 1
    db.commit()
    db.refresh(post)
    return _serialize_post(db, post, current_user=db.query(User).filter(User.id == user_id).first())


def delete_post(db: Session, post_id: int, user_id: int) -> None:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')
    if post.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')
    db.delete(post)
    db.commit()


def get_post_by_id(db: Session, post_id: int, current_user: User | None = None) -> dict:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')
    if not _can_view_post(post, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')
    return _serialize_post(db, post, current_user=current_user)


def get_post_history(db: Session, post_id: int, user_id: int) -> dict:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')
    if post.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')

    history_rows = db.query(PostEditHistory).filter(PostEditHistory.post_id == post_id).order_by(PostEditHistory.edited_at.desc(), PostEditHistory.id.desc()).all()
    items = [
        {
            'id': row.id,
            'post_id': row.post_id,
            'editor_user_id': row.editor_user_id,
            'previous_content': row.previous_content or '',
            'previous_content_html': row.previous_content_html or '',
            'previous_media_urls': normalize_media_list(_loads_list(row.previous_media_json)),
            'previous_poll': _loads_list(row.previous_poll_json),
            'edited_at': row.edited_at,
        }
        for row in history_rows
    ]
    return {
        'post_id': post_id,
        'edit_count': int(post.edit_count or len(items)),
        'last_edited_at': post.last_edited_at,
        'items': items,
    }


def like_post(db: Session, user_id: int, post_id: int) -> dict:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')

    existing = db.query(Like).filter(Like.post_id == post_id, Like.user_id == user_id).first()
    if existing is not None:
        db.delete(existing)
        liked = False
    else:
        db.add(Like(post_id=post_id, user_id=user_id))
        liked = True

    db.flush()
    post_like_count = db.query(func.count(Like.id)).filter(Like.post_id == post_id).scalar() or 0
    db.commit()
    return {
        'post_id': post_id,
        'liked': liked,
        'like_count': int(post_like_count),
        'likes_count': int(post_like_count),
    }


def toggle_save_post(db: Session, user_id: int, post_id: int) -> dict:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')

    existing = db.query(PostSave).filter(PostSave.post_id == post_id, PostSave.user_id == user_id).first()
    if existing is not None:
        db.delete(existing)
        saved = False
    else:
        db.add(PostSave(post_id=post_id, user_id=user_id))
        saved = True

    db.flush()
    save_count = db.query(func.count(PostSave.id)).filter(PostSave.post_id == post_id).scalar() or 0
    post.save_count = int(save_count)
    db.commit()
    return {
        'post_id': post_id,
        'is_saved': saved,
        'saved_by_me': saved,
        'save_count': int(save_count),
        'saved_count': int(save_count),
    }


def share_post(db: Session, user_id: int, post_id: int, platform: str | None = None) -> dict:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')

    share = PostShare(post_id=post_id, user_id=user_id, platform=str(platform or 'copy')[:60] or 'copy')
    db.add(share)
    db.flush()
    share_count = db.query(func.count(PostShare.id)).filter(PostShare.post_id == post_id).scalar() or 0
    post.share_count = int(share_count)
    db.commit()
    return {
        'post_id': post_id,
        'share_count': int(share_count),
        'platform': share.platform,
        'share_url': _share_url(post_id),
    }


def vote_poll(db: Session, user_id: int, post_id: int, option_key: str) -> dict:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')

    poll_options = _loads_list(post.poll_options_json)
    option_keys = {str(option.get('id')) for option in poll_options if isinstance(option, dict) and option.get('id')}
    if option_key not in option_keys:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid poll option')

    existing_vote = db.query(PostPollVote).filter(PostPollVote.post_id == post_id, PostPollVote.user_id == user_id).first()
    if existing_vote is None:
        db.add(PostPollVote(post_id=post_id, user_id=user_id, option_key=option_key))
    else:
        existing_vote.option_key = option_key
    db.commit()

    serialized = _serialize_post(db, post, current_user=db.query(User).filter(User.id == user_id).first())
    return {
        'post_id': post_id,
        'poll': serialized.get('poll', []),
        'selected_option': option_key,
    }


def get_post_insights(db: Session, post_id: int, current_user: User) -> dict:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')
    if post.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')

    likes_count = db.query(func.count(Like.id)).filter(Like.post_id == post_id).scalar() or 0
    comments_count = db.query(func.count(Comment.id)).filter(Comment.post_id == post_id).scalar() or 0
    shares_count = db.query(func.count(PostShare.id)).filter(PostShare.post_id == post_id).scalar() or 0
    saves_count = db.query(func.count(PostSave.id)).filter(PostSave.post_id == post_id).scalar() or 0
    edits_count = db.query(func.count(PostEditHistory.id)).filter(PostEditHistory.post_id == post_id).scalar() or 0
    votes_count = db.query(func.count(PostPollVote.id)).filter(PostPollVote.post_id == post_id).scalar() or 0

    engagement_total = int(likes_count) + int(comments_count) + int(shares_count) + int(saves_count) + int(votes_count)
    return {
        'post_id': post_id,
        'like_count': int(likes_count),
        'likes_count': int(likes_count),
        'comment_count': int(comments_count),
        'comments_count': int(comments_count),
        'share_count': int(shares_count),
        'shares_count': int(shares_count),
        'save_count': int(saves_count),
        'saved_count': int(saves_count),
        'poll_votes_count': int(votes_count),
        'edit_count': int(edits_count),
        'engagement_total': engagement_total,
        'share_url': _share_url(post_id),
        'post': _serialize_post(db, post, current_user=current_user),
    }
