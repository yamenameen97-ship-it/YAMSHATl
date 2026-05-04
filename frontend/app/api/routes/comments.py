from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.comment import CommentCreate
from app.services.comment_service import create_comment, delete_comment, get_comments

router = APIRouter()


@router.post('/{post_id}', status_code=status.HTTP_201_CREATED)
def create(
    post_id: int,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_comment(db, user_id=current_user.id, post_id=post_id, content=comment.content)


@router.get('/{post_id}')
def get_all(post_id: int, db: Session = Depends(get_db)):
    return get_comments(db, post_id)


@router.delete('/{comment_id}')
def delete(comment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return delete_comment(db, comment_id, current_user.id)
