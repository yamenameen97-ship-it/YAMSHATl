from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.services.comment_service import create_comment, get_comments
from app.services.post_service import create_post, delete_post, get_posts, like_post

router = APIRouter()


@router.post('/', status_code=status.HTTP_201_CREATED)
def create(payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    content = str(payload.get('content') or '').strip()
    image_url = payload.get('image_url') or payload.get('media')
    if not content and not image_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='content or media is required')
    return create_post(db, user_id=current_user.id, content=content, image_url=image_url)


@router.get('/')
def get_all(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return get_posts(db, skip, limit)


@router.post('/{post_id}/like')
def like(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return like_post(db, user_id=current_user.id, post_id=post_id)


@router.post('/{post_id}/comment', status_code=status.HTTP_201_CREATED)
def add_comment(post_id: int, payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    text = str(payload.get('text') or payload.get('comment') or payload.get('content') or '').strip()
    if not text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='comment text is required')
    return create_comment(db, user_id=current_user.id, post_id=post_id, content=text)


@router.get('/{post_id}/comments')
def comments(post_id: int, db: Session = Depends(get_db)):
    return get_comments(db, post_id)


@router.delete('/{post_id}')
def delete(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return delete_post(db, post_id, current_user.id)
