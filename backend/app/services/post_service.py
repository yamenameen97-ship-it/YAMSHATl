from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.models.like import Like
from app.models.post import Post
from app.models.user import User


def _serialize_post(db: Session, post: Post) -> dict:
    user = db.query(User).filter(User.id == post.user_id).first()
    like_count = db.query(func.count(Like.id)).filter(Like.post_id == post.id).scalar() or 0
    comment_count = db.query(func.count(Comment.id)).filter(Comment.post_id == post.id).scalar() or 0
    return {
        'id': post.id,
        'user_id': post.user_id,
        'username': user.username if user else 'unknown',
        'avatar': user.avatar if user else None,
        'content': post.content,
        'image_url': post.image_url,
        'created_at': post.created_at,
        'like_count': like_count,
        'comment_count': comment_count,
    }


def create_post(db: Session, user_id: int, content: str, image_url: str | None = None) -> dict:
    post = Post(user_id=user_id, content=content, image_url=image_url)
    db.add(post)
    db.commit()
    db.refresh(post)
    return _serialize_post(db, post)


def get_posts(db: Session, skip: int = 0, limit: int = 10) -> list[dict]:
    posts = db.query(Post).order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    return [_serialize_post(db, post) for post in posts]


def like_post(db: Session, user_id: int, post_id: int) -> dict:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')

    existing_like = db.query(Like).filter(Like.user_id == user_id, Like.post_id == post_id).first()
    if existing_like:
        like_count = db.query(func.count(Like.id)).filter(Like.post_id == post_id).scalar() or 0
        return {'message': 'Already liked', 'post_id': post_id, 'like_count': like_count}

    like = Like(user_id=user_id, post_id=post_id)
    db.add(like)
    db.commit()
    like_count = db.query(func.count(Like.id)).filter(Like.post_id == post_id).scalar() or 0
    return {'message': 'Liked', 'post_id': post_id, 'like_count': like_count}


def delete_post(db: Session, post_id: int, user_id: int) -> dict:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')
    if post.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')

    db.delete(post)
    db.commit()
    return {'message': 'Deleted'}
