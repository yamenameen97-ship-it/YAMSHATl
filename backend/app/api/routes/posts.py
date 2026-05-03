from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.post import PostCreate
from app.services.post_service import create_post, delete_post, get_posts, like_post

router = APIRouter()


@router.post('/', status_code=status.HTTP_201_CREATED)
def create(post: PostCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_post(db, user_id=current_user.id, content=post.content, image_url=post.image_url)


@router.get('/')
def get_all(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return get_posts(db, skip, limit)


@router.post('/{post_id}/like')
def like(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return like_post(db, user_id=current_user.id, post_id=post_id)


@router.delete('/{post_id}')
def delete(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return delete_post(db, post_id, current_user.id)
