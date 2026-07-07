from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.comment import Comment
from app.models.post_preference import CommentReaction
from app.models.user import User
from app.schemas.comment import CommentCreate
from app.services.ai_service import moderate_comment, detect_spam, rank_comments
from app.services.comment_service import (
    create_comment,
    delete_comment,
    get_comments,
    hide_comment,
    pin_comment,
    report_comment,
    toggle_like_comment,
    update_comment,
)

router = APIRouter()


@router.post('/{post_id}', status_code=status.HTTP_201_CREATED)
def create(
    post_id: int,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not moderate_comment(comment.content):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Comment failed AI moderation.')
    if detect_spam(comment.content):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Comment detected as spam.')
    return create_comment(db, user_id=current_user.id, post_id=post_id, content=comment.content, parent_id=comment.parent_id)


@router.get('/{post_id}/comments')
@router.get('/{post_id}/comments:{cursor}')  # ✅ FIX (2026-06-13): دعم صيغة الواجهة الأمامية comments:1
def get_all(
    post_id: int,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    sort_by: str = Query(default='newest'),
    include_hidden: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ✅ إصلاح موسع (2026-06-13):
    #   — تغليف واسع لـ try/except
    #   — إرجاع بنية موحدة دائماً (items/total/page/limit) حتى لو فشلت الـ service داخلياً
    #   — لا نرفع 500 أبداً للواجهة الأمامية — نعيد قائمة فارغة بدلاً
    empty_payload = {'items': [], 'total': 0, 'page': page, 'limit': limit}
    try:
        payload = get_comments(
            db,
            post_id,
            current_user=current_user,
            page=page,
            limit=limit,
            sort_by=sort_by,
            include_hidden=include_hidden,
        )
        if not isinstance(payload, dict):
            return empty_payload
        items = payload.get('items', []) or []
        try:
            payload['items'] = rank_comments(items, current_user)
        except Exception:
            payload['items'] = items
        payload.setdefault('total', len(payload['items']))
        payload.setdefault('page', page)
        payload.setdefault('limit', limit)
        return payload
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        import logging
        logging.getLogger(__name__).warning('get_comments failed for post_id=%s: %s', post_id, exc)
        try:
            db.rollback()
        except Exception:
            pass
        return empty_payload


@router.patch('/item/{comment_id}')
def update(
    comment_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_comment(db, comment_id, current_user.id, str(payload.get('content') or '').strip())


@router.post('/item/{comment_id}/like')
def like(comment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return toggle_like_comment(db, comment_id, current_user.id)


@router.post('/item/{comment_id}/pin')
def pin(comment_id: int, payload: dict = Body(default={}), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return pin_comment(db, comment_id, current_user.id, pinned=bool(payload.get('pinned', True)))


@router.post('/item/{comment_id}/hide')
def hide(comment_id: int, payload: dict = Body(default={}), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return hide_comment(db, comment_id, current_user.id, hidden=bool(payload.get('hidden', True)))


@router.post('/item/{comment_id}/report')
def report(comment_id: int, payload: dict = Body(default={}), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return report_comment(db, comment_id, current_user.id, reason=str(payload.get('reason') or '').strip())


@router.delete('/item/{comment_id}')
def delete(comment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return delete_comment(db, comment_id, current_user.id)


# ============================================================
# v83.8 — Cloud-persisted emoji reactions on comments
# Previously handled only by local state; now saved per-user in DB.
# ============================================================

_ALLOWED_EMOJIS = {'👍', '❤️', '😂', '😢', '😡', '😮', '🔥', '🎉'}


def _reaction_summary(db: Session, comment_id: int, user_id: int | None = None) -> dict:
    rows = (
        db.query(CommentReaction.emoji, func.count(CommentReaction.id))
        .filter(CommentReaction.comment_id == comment_id)
        .group_by(CommentReaction.emoji)
        .all()
    )
    counts = {emoji: int(count) for emoji, count in rows}
    my_emoji = None
    if user_id is not None:
        existing = (
            db.query(CommentReaction)
            .filter(CommentReaction.comment_id == comment_id, CommentReaction.user_id == user_id)
            .first()
        )
        my_emoji = existing.emoji if existing else None
    return {
        'comment_id': comment_id,
        'reactions': counts,
        'total': sum(counts.values()),
        'my_reaction': my_emoji,
    }


@router.post('/item/{comment_id}/react')
def react_to_comment(
    comment_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emoji = str(payload.get('emoji') or '').strip()
    if not emoji:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='emoji is required')
    if emoji not in _ALLOWED_EMOJIS and len(emoji) > 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Unsupported emoji')
    if db.query(Comment.id).filter(Comment.id == comment_id).first() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Comment not found')

    existing = (
        db.query(CommentReaction)
        .filter(CommentReaction.comment_id == comment_id, CommentReaction.user_id == current_user.id)
        .first()
    )
    if existing is None:
        db.add(CommentReaction(comment_id=comment_id, user_id=current_user.id, emoji=emoji))
    elif existing.emoji == emoji:
        # Toggle off
        db.delete(existing)
    else:
        existing.emoji = emoji
    db.commit()
    return _reaction_summary(db, comment_id, current_user.id)


@router.get('/item/{comment_id}/reactions')
def get_comment_reactions(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _reaction_summary(db, comment_id, current_user.id)
