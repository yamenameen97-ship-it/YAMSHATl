from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.follow import Follow
from app.models.user import User
from app.services.comment_service import create_comment, get_comments
from app.services.ai_service import (
    moderate_content,
    rank_posts,
    get_recommendations,
)
from app.services.background_tasks import schedule_post_publishing
from app.services.post_service import (
    create_post,
    delete_post,
    get_post_history,
    get_posts,
    get_post_insights,
    get_user_drafts,
    like_post,
    share_post,
    toggle_save_post,
    update_post,
    vote_poll,
)

router = APIRouter()


def _parse_datetime(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    raw = str(value).strip()
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw.replace('Z', '+00:00')).replace(tzinfo=None)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid datetime value') from exc


@router.post('/', status_code=status.HTTP_201_CREATED)
def create(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    content = str(payload.get('content') or '').strip()
    
    # AI Moderation Hook
    if not moderate_content(content):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Content failed AI moderation.')
        
    image_url = payload.get('image_url') or payload.get('media')
    media_urls = payload.get('media_urls') or payload.get('media') or payload.get('attachments') or ([] if not image_url else [image_url])
    
    scheduled_at = _parse_datetime(payload.get('scheduled_at'))
    
    post = create_post(
        db,
        user_id=current_user.id,
        content=content,
        image_url=image_url,
        content_html=payload.get('content_html'),
        media_urls=media_urls,
        poll=payload.get('poll') or payload.get('poll_options'),
        scheduled_at=scheduled_at,
        is_draft=bool(payload.get('is_draft', False)),
        is_pinned=bool(payload.get('is_pinned', False)),
        allow_comments=bool(payload.get('allow_comments', True)),
    )
    
    # Scheduled publishing queue & Background processing
    if scheduled_at:
        schedule_post_publishing(post_id=post.id, scheduled_at=scheduled_at)
        
    return post


@router.get('/')
def get_all(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=30, ge=1, le=100),
    page: int | None = Query(default=None, ge=1),
    include_drafts: bool = Query(default=False),
    filter: str | None = Query(default=None),
    filter_type: str | None = Query(default=None),
    sort: str | None = Query(default=None),
    sort_by: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    effective_limit = int(limit)
    effective_skip = (page - 1) * effective_limit if page else skip
    active_filter = str(filter_type or filter or 'all').strip().lower()
    active_sort = str(sort_by or sort or 'recent').strip().lower()

    def interaction_score(post: dict) -> int:
        return int(post.get('likes') or post.get('like_count') or post.get('likes_count') or 0) + (int(post.get('comments_count') or post.get('comment_count') or 0) * 2) + (int(post.get('share_count') or 0) * 3)

    manual_pagination = active_filter in {'following', 'trending', 'mine'} or active_sort in {'trending', 'oldest'}
    candidate_limit = max(effective_limit * 6, 60) if manual_pagination else effective_limit
    candidate_skip = 0 if manual_pagination else effective_skip

    posts = get_posts(db, current_user=current_user, skip=candidate_skip, limit=candidate_limit, include_drafts=include_drafts)

    if active_filter == 'following':
        following_ids = {
            follow.following_id
            for follow in db.query(Follow).filter(Follow.follower_id == current_user.id).all()
        }
        posts = [
            post for post in posts
            if int(post.get('user_id') or 0) == current_user.id or int(post.get('user_id') or 0) in following_ids
        ]
    elif active_filter == 'mine':
        posts = [post for post in posts if int(post.get('user_id') or 0) == current_user.id]

    if active_filter == 'trending' or active_sort == 'trending':
        posts = sorted(posts, key=lambda post: (interaction_score(post), str(post.get('created_at') or '')), reverse=True)
    elif active_sort == 'oldest':
        posts = sorted(posts, key=lambda post: str(post.get('created_at') or ''))
    else:
        posts = rank_posts(posts, current_user)

    total_candidates = len(posts)
    paginated_posts = posts[effective_skip:effective_skip + effective_limit] if manual_pagination else posts
    has_more = total_candidates > (effective_skip + len(paginated_posts)) if manual_pagination else len(posts) == effective_limit

    recommended_posts = get_recommendations(current_user)

    return {
        "posts": paginated_posts,
        "recommendations": recommended_posts,
        "pagination": {
            "page": page or ((effective_skip // effective_limit) + 1),
            "skip": effective_skip,
            "limit": effective_limit,
            "has_more": has_more,
        },
        "filters": {
            "filter": active_filter,
            "sort_by": active_sort,
        },
    }


@router.get('/drafts')
def drafts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_user_drafts(db, current_user)


@router.post('/{post_id}/like')
def like(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return like_post(db, user_id=current_user.id, post_id=post_id)


@router.post('/{post_id}/save')
def save_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return toggle_save_post(db, user_id=current_user.id, post_id=post_id)


@router.post('/{post_id}/share')
def share(post_id: int, payload: dict = Body(default={}), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return share_post(db, user_id=current_user.id, post_id=post_id, platform=payload.get('platform'))


@router.post('/{post_id}/poll-vote')
def vote(post_id: int, payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    option_key = str(payload.get('option_key') or payload.get('optionId') or '').strip()
    if not option_key:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='option_key is required')
    return vote_poll(db, user_id=current_user.id, post_id=post_id, option_key=option_key)


@router.patch('/{post_id}')
def patch_post(post_id: int, payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_post(
        db,
        post_id=post_id,
        user_id=current_user.id,
        content=payload.get('content'),
        content_html=payload.get('content_html'),
        media_urls=payload.get('media_urls') if 'media_urls' in payload else payload.get('attachments'),
        poll=payload.get('poll') if 'poll' in payload else None,
        scheduled_at=_parse_datetime(payload.get('scheduled_at')) if 'scheduled_at' in payload else None,
        is_draft=payload.get('is_draft') if 'is_draft' in payload else None,
        is_pinned=payload.get('is_pinned') if 'is_pinned' in payload else None,
        allow_comments=payload.get('allow_comments') if 'allow_comments' in payload else None,
    )


@router.get('/{post_id}/history')
def history(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_post_history(db, post_id=post_id, user_id=current_user.id)


@router.post('/{post_id}/comment', status_code=status.HTTP_201_CREATED)
def add_comment(post_id: int, payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    text = str(payload.get('text') or payload.get('comment') or payload.get('content') or '').strip()
    if not text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='comment text is required')
    return create_comment(db, user_id=current_user.id, post_id=post_id, content=text, parent_id=payload.get('parent_id'))


@router.get('/{post_id}/comments')
def comments(post_id: int, db: Session = Depends(get_db)):
    return get_comments(db, post_id)


@router.get('/{post_id}/insights')
def insights(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_post_insights(db, post_id=post_id, current_user=current_user)


@router.delete('/{post_id}')
def delete(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return delete_post(db, post_id, current_user.id)
