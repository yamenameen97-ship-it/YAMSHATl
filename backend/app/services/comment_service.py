from __future__ import annotations

import json
import re
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.content_sanitizer import sanitize_text
from app.models.comment import Comment
from app.models.comment_like import CommentLike
from app.models.post import Post
from app.models.user import User

MENTION_RE = re.compile(r'(?<!\w)@([\w.\-]{1,50})', re.UNICODE)
MAX_COMMENT_LENGTH = 1000
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
MAX_REPLY_DEPTH = 4


def _loads_list(raw: str | None) -> list:
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


def _dumps(value) -> str | None:
    if value in (None, '', [], {}):
        return None
    return json.dumps(value, ensure_ascii=False)


def _extract_mentions(text: str) -> list[str]:
    found: list[str] = []
    for item in MENTION_RE.findall(text or ''):
        normalized = str(item or '').strip().lower()
        if normalized and normalized not in found:
            found.append(normalized)
    return found[:20]


def _comment_depth(db: Session, parent_id: int | None) -> int:
    depth = 0
    cursor = parent_id
    while cursor is not None:
        parent = db.query(Comment).filter(Comment.id == cursor).first()
        if parent is None:
            break
        depth += 1
        cursor = parent.parent_id
    return depth


def _serialize_comment(db: Session, comment: Comment, current_user: User | None = None) -> dict:
    user = db.query(User).filter(User.id == comment.user_id).first()
    replies_count = db.query(Comment).filter(Comment.parent_id == comment.id, Comment.is_hidden.is_(False)).count()
    liked_by_me = False
    if current_user is not None:
        liked_by_me = db.query(CommentLike.id).filter(
            CommentLike.comment_id == comment.id,
            CommentLike.user_id == current_user.id,
        ).first() is not None
    return {
        'id': comment.id,
        'user_id': comment.user_id,
        'username': user.username if user else (getattr(comment, 'username', None) or 'unknown'),
        'avatar': user.avatar if user else None,
        'post_id': comment.post_id,
        'parent_id': comment.parent_id,
        'content': comment.content,
        'mentions': _loads_list(comment.mentions_json),
        'likes_count': int(comment.likes_count or 0),
        'is_liked': liked_by_me,
        'is_pinned': bool(comment.is_pinned),
        'is_hidden': bool(comment.is_hidden),
        'created_at': comment.created_at,
        'updated_at': comment.updated_at,
        'reply_count': int(replies_count),
        'replies': [],
    }


def _build_comment_tree(db: Session, comments: list[Comment], current_user: User | None = None) -> list[dict]:
    nodes = [_serialize_comment(db, comment, current_user=current_user) for comment in comments]
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
        children = sorted(
            node.get('replies') or [],
            key=lambda item: (bool(item.get('is_pinned')), str(item.get('created_at') or '')),
            reverse=True,
        )
        node['replies'] = children
        node['reply_count'] = len(children)
        for child in children:
            finalize(child)
        return node['reply_count']

    roots = sorted(
        roots,
        key=lambda item: (bool(item.get('is_pinned')), str(item.get('created_at') or '')),
        reverse=True,
    )
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
        if _comment_depth(db, parent_id) >= MAX_REPLY_DEPTH:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Maximum reply depth reached')

    clean_content = sanitize_text(content or '', max_length=MAX_COMMENT_LENGTH)
    if not clean_content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Comment content is required')

    current_user = db.query(User).filter(User.id == user_id).first()
    comment = Comment(
        user_id=user_id,
        post_id=post_id,
        parent_id=parent_comment.id if parent_comment else None,
        username=current_user.username if current_user else None,
        comment=clean_content,
        content=clean_content,
        mentions_json=_dumps(_extract_mentions(clean_content)),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _serialize_comment(db, comment, current_user=current_user)


def get_comments(
    db: Session,
    post_id: int,
    *,
    current_user: User | None = None,
    page: int = 1,
    limit: int = DEFAULT_PAGE_SIZE,
    sort_by: str = 'newest',
    include_hidden: bool = False,
) -> dict:
    page = max(int(page or 1), 1)
    limit = max(1, min(int(limit or DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE))
    base_query = db.query(Comment).filter(Comment.post_id == post_id)
    if not include_hidden:
        base_query = base_query.filter(Comment.is_hidden.is_(False))

    root_query = base_query.filter(Comment.parent_id.is_(None))
    if sort_by == 'oldest':
        root_query = root_query.order_by(Comment.is_pinned.desc(), Comment.created_at.asc())
    elif sort_by == 'popular':
        root_query = root_query.order_by(Comment.is_pinned.desc(), Comment.likes_count.desc(), Comment.created_at.desc())
    else:
        root_query = root_query.order_by(Comment.is_pinned.desc(), Comment.created_at.desc())

    total_count = root_query.count()
    roots = root_query.offset((page - 1) * limit).limit(limit).all()
    root_ids = [item.id for item in roots]
    descendants = []
    if root_ids:
        descendants = base_query.filter((Comment.parent_id.in_(root_ids)) | (Comment.id.in_(root_ids))).all()
    tree = _build_comment_tree(db, descendants, current_user=current_user)
    return {
        'items': tree,
        'pagination': {
            'page': page,
            'limit': limit,
            'total_count': total_count,
            'has_more': (page * limit) < total_count,
        },
        'sort_by': sort_by,
    }


def update_comment(db: Session, comment_id: int, user_id: int, content: str) -> dict:
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Comment not found')
    if comment.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')

    clean_content = sanitize_text(content or '', max_length=MAX_COMMENT_LENGTH)
    if not clean_content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Comment content is required')

    comment.comment = clean_content
    comment.content = clean_content
    comment.mentions_json = _dumps(_extract_mentions(clean_content))
    comment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(comment)
    current_user = db.query(User).filter(User.id == user_id).first()
    return _serialize_comment(db, comment, current_user=current_user)


def pin_comment(db: Session, comment_id: int, acting_user_id: int, *, pinned: bool) -> dict:
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Comment not found')
    post = db.query(Post).filter(Post.id == comment.post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')
    if acting_user_id not in {comment.user_id, post.user_id}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')

    comment.is_pinned = bool(pinned)
    comment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(comment)
    current_user = db.query(User).filter(User.id == acting_user_id).first()
    return _serialize_comment(db, comment, current_user=current_user)


def hide_comment(db: Session, comment_id: int, acting_user_id: int, *, hidden: bool) -> dict:
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Comment not found')
    post = db.query(Post).filter(Post.id == comment.post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Post not found')
    if acting_user_id not in {comment.user_id, post.user_id}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')

    comment.is_hidden = bool(hidden)
    comment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(comment)
    current_user = db.query(User).filter(User.id == acting_user_id).first()
    return _serialize_comment(db, comment, current_user=current_user)


def toggle_like_comment(db: Session, comment_id: int, user_id: int) -> dict:
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Comment not found')

    existing = db.query(CommentLike).filter(CommentLike.comment_id == comment_id, CommentLike.user_id == user_id).first()
    if existing is None:
        db.add(CommentLike(comment_id=comment_id, user_id=user_id))
        comment.likes_count = int(comment.likes_count or 0) + 1
        liked = True
    else:
        db.delete(existing)
        comment.likes_count = max(0, int(comment.likes_count or 0) - 1)
        liked = False
    comment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(comment)
    return {
        'comment_id': comment.id,
        'liked': liked,
        'likes_count': int(comment.likes_count or 0),
    }


def report_comment(db: Session, comment_id: int, user_id: int, reason: str | None = None) -> dict:
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Comment not found')
    return {
        'success': True,
        'comment_id': comment.id,
        'reported_by': user_id,
        'reason': sanitize_text(reason or 'abuse', max_length=120),
        'status': 'queued_for_review',
    }


def delete_comment(db: Session, comment_id: int, user_id: int) -> dict:
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Comment not found')
    if comment.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')

    def _delete_descendants(parent_id: int) -> None:
        children = db.query(Comment).filter(Comment.parent_id == parent_id).all()
        for child in children:
            _delete_descendants(child.id)
            db.delete(child)

    _delete_descendants(comment.id)
    db.delete(comment)
    db.commit()
    return {'message': 'Deleted'}
