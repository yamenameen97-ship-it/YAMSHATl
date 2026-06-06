from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
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
def get_all(
    post_id: int,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    sort_by: str = Query(default='newest'),
    include_hidden: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # إصلاح: تغليف العملية بـ try/except لإرجاع قائمة فارغة بدلاً من 500
    # عند غياب المنشور أو خلل في تحميل العلاقات
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
        items = payload.get('items', []) if isinstance(payload, dict) else []
        payload['items'] = rank_comments(items, current_user)
        return payload
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        import logging
        logging.getLogger(__name__).warning('get_comments failed for post_id=%s: %s', post_id, exc)
        return {
            'items': [],
            'total': 0,
            'page': page,
            'limit': limit,
            'has_more': False,
        }


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
