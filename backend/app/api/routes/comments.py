from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.comment import CommentCreate
from app.services.ai_service import moderate_comment, detect_spam, translate_and_moderate, rank_comments
from app.services.comment_service import create_comment, delete_comment, get_comments

router = APIRouter()


@router.post("/{post_id}", status_code=status.HTTP_201_CREATED)
def create(
    post_id: int,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Toxicity AI & Spam Detection Hooks
    if not moderate_comment(comment.content):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Comment failed AI moderation.")
    if detect_spam(comment.content):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Comment detected as spam.")

    # Multilingual Moderation (example: translate to English for moderation if needed)
    # translated_content = translate_and_moderate(comment.content, target_language='en')

    return create_comment(db, user_id=current_user.id, post_id=post_id, content=comment.content, parent_id=comment.parent_id)


@router.get("/{post_id}/comments")
def get_all(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comments = get_comments(db, post_id)
    # Comment ranking hook
    ranked_comments = rank_comments(comments, current_user)
    return ranked_comments


@router.delete("/{comment_id}")
def delete(comment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return delete_comment(db, comment_id, current_user.id)
