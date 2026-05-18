from __future__ import annotations

from app.core.content_sanitizer import sanitize_text
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
        'parent_id': comment.parent_id,
        'content': comment.content,
        'created_at': comment.created_at,
        'reply_count': 0,
        'replies': [],
    }


def _build_comment_tree(db: Session, comments: list[Comment]) -> list[dict]:
    nodes = [_serialize_comment(db, comment) for comment in comments]
    by_id = {node['id']: node for node in nodes}
    roots: list[dict] = []

    for node in nodes:
        parent_id = node.get('parent_id')
        parent = by_id.get(parent_id)
        if parent:
            parent['replies'].append(node)
        else:
            roots.append(node)

    def finalize(node: dict) -> int:
        children = sorted(node.get('replies') or [], key=lambda item: item.get('created_at') or '')
        node['replies'] = children
        node['reply_count'] = len(children)
        for child in children:
            finalize(child)
        return node['reply_count']

    roots = sorted(roots, key=lambda item: item.get('created_at') or '', reverse=True)
    for root in roots:
        finalize(root)
    return roots


def create_comment(db: Session, user_id: int, post_id: int, content: str, parent_id: int | None = None) -> dict:
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')
    if not bool(post.allow_comments):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Comments are disabled for this post')

    parent_comment = None
    if parent_id is not None:
        parent_comment = db.query(Comment).filter(Comment.id == parent_id, Comment.post_id == post_id).first()
        if parent_comment is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Parent comment not found')

    clean_content = sanitize_text(content or '', max_length=400)
    if not clean_content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Comment content is required')

    comment = Comment(user_id=user_id, post_id=post_id, parent_id=parent_comment.id if parent_comment else None, content=clean_content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _serialize_comment(db, comment)


def get_comments(db: Session, post_id: int) -> list[dict]:
    comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at.asc()).all()
    return _build_comment_tree(db, comments)


def delete_comment(db: Session, comment_id: int, user_id: int) -> dict:
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Comment not found')
    if comment.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')

    descendants = db.query(Comment).filter(Comment.parent_id == comment.id).all()
    for child in descendants:
        db.delete(child)
    db.delete(comment)
    db.commit()
    return {'message': 'Deleted'}
