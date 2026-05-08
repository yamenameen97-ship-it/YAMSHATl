from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.models.post import Post
from app.models.user import User


def _serialize_comment(db: Session, comment: Comment) -> dict:
    user = db.query(User).filter(User.id == comment.user_id).first()
    return {
        'id': comment.id,
        'user_id': comment.user_id,
        'username': user.username if user else 'unknown',
        'avatar': user.avatar if user else None,
        'post_id': comment.post_id,
        'content': comment.content,
        'created_at': comment.created_at,
    }


def create_comment(db: Session, user_id: int, post_id: int, content: str) -> dict:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')

    comment = Comment(user_id=user_id, post_id=post_id, content=content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _serialize_comment(db, comment)


def get_comments(db: Session, post_id: int) -> list[dict]:
    comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at.desc()).all()
    return [_serialize_comment(db, comment) for comment in comments]


def delete_comment(db: Session, comment_id: int, user_id: int) -> dict:
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Comment not found')
    if comment.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')

    db.delete(comment)
    db.commit()
    return {'message': 'Deleted'}
