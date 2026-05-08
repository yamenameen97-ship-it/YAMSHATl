from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.services.comment_service import create_comment, get_comments
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
    image_url = payload.get('image_url') or payload.get('media')
    media_urls = payload.get('media_urls') or payload.get('media') or payload.get('attachments') or ([] if not image_url else [image_url])
    return create_post(
        db,
        user_id=current_user.id,
        content=content,
        image_url=image_url,
        content_html=payload.get('content_html'),
        media_urls=media_urls,
        poll=payload.get('poll') or payload.get('poll_options'),
        scheduled_at=_parse_datetime(payload.get('scheduled_at')),
        is_draft=bool(payload.get('is_draft', False)),
        is_pinned=bool(payload.get('is_pinned', False)),
        allow_comments=bool(payload.get('allow_comments', True)),
    )


@router.get('/')
def get_all(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=30, ge=1, le=100),
    include_drafts: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_posts(db, current_user=current_user, skip=skip, limit=limit, include_drafts=include_drafts)


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
