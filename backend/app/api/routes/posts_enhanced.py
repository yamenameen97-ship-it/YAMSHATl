"""
نظام المنشورات المحسّن - Enhanced Posts System
يوفر:
- نظام لايكات احترافي مع عداد تفاعلات
- نظام تعليقات متقدم مع ردود
- مشاركة المنشورات (داخلي وخارجي)
- حفظ المنشورات مع مجلدات
- تعديل وحذف المنشورات
- تحريكات احترافية
"""

from fastapi import APIRouter, Depends, Query, HTTPException, Body, status
from typing import List, Optional, Dict
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from dataclasses import dataclass, asdict
import logging

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.post import Post

logger = logging.getLogger(__name__)
router = APIRouter()

# ============ تعريفات الأنواع ============

@dataclass
class LikeInfo:
    """معلومات اللايك"""
    id: str
    post_id: str
    user_id: str
    user_name: str
    user_avatar: str
    timestamp: str


@dataclass
class CommentInfo:
    """معلومات التعليق"""
    id: str
    post_id: str
    user_id: str
    user_name: str
    user_avatar: str
    content: str
    parent_id: Optional[str] = None
    replies_count: int = 0
    likes_count: int = 0
    timestamp: str = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat()


@dataclass
class PostEngagementStats:
    """إحصائيات التفاعل مع المنشور"""
    post_id: str
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    saves_count: int = 0
    views_count: int = 0
    current_user_liked: bool = False
    current_user_saved: bool = False
    current_user_shared: bool = False
    engagement_rate: float = 0.0
    timestamp: str = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat()


# ============ المسارات (Routes) ============

# ============ نظام اللايكات ============

@router.post('/{post_id}/like')
async def like_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    إضافة لايك على منشور
    - يتحقق من عدم وجود لايك سابق
    - يحدث عداد اللايكات
    - يرسل إشعار للمؤلف
    """
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="المنشور غير موجود")

        # التحقق من عدم وجود لايك سابق
        from app.models.like import Like
        existing_like = db.query(Like).filter(
            and_(
                Like.post_id == post_id,
                Like.user_id == current_user.id
            )
        ).first()

        if existing_like:
            raise HTTPException(status_code=400, detail="لقد أعجبت بهذا المنشور بالفعل")

        # إضافة اللايك
        like = Like(
            post_id=post_id,
            user_id=current_user.id,
            timestamp=datetime.utcnow()
        )
        db.add(like)
        
        # تحديث عداد اللايكات
        post.likes_count = (post.likes_count or 0) + 1
        db.commit()

        # إرسال إشعار للمؤلف
        if post.user_id != current_user.id:
            from app.models.notification import Notification
            notification = Notification(
                user_id=post.user_id,
                actor_id=current_user.id,
                type="like",
                content=f"أعجب {current_user.full_name or current_user.username} بمنشورك",
                related_post_id=post_id,
                timestamp=datetime.utcnow()
            )
            db.add(notification)
            db.commit()

        return {
            "success": True,
            "message": "تم الإعجاب بالمنشور",
            "post_id": post_id,
            "likes_count": post.likes_count,
            "animation": "heart_pop"  # تحريك احترافي
        }
    except Exception as e:
        logger.error(f"Like error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/{post_id}/unlike')
async def unlike_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    إزالة لايك من منشور
    - يتحقق من وجود لايك سابق
    - يحدث عداد اللايكات
    """
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="المنشور غير موجود")

        # البحث عن اللايك
        from app.models.like import Like
        like = db.query(Like).filter(
            and_(
                Like.post_id == post_id,
                Like.user_id == current_user.id
            )
        ).first()

        if not like:
            raise HTTPException(status_code=400, detail="لم تعجب بهذا المنشور")

        # حذف اللايك
        db.delete(like)
        
        # تحديث عداد اللايكات
        post.likes_count = max((post.likes_count or 1) - 1, 0)
        db.commit()

        return {
            "success": True,
            "message": "تم إزالة الإعجاب",
            "post_id": post_id,
            "likes_count": post.likes_count,
            "animation": "heart_fade"
        }
    except Exception as e:
        logger.error(f"Unlike error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/{post_id}/likes')
async def get_post_likes(
    post_id: int,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    الحصول على قائمة الأشخاص الذين أعجبوا بالمنشور
    - مع معلومات المستخدم
    - مع وقت الإعجاب
    """
    try:
        from app.models.like import Like
        
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="المنشور غير موجود")

        likes = db.query(Like).filter(
            Like.post_id == post_id
        ).order_by(
            Like.timestamp.desc()
        ).offset(offset).limit(limit).all()

        likes_data = [
            {
                "id": like.id,
                "user": {
                    "id": like.user.id,
                    "username": like.user.username,
                    "full_name": like.user.full_name,
                    "avatar_url": like.user.avatar_url,
                    "is_verified": like.user.is_verified
                },
                "timestamp": like.timestamp.isoformat() if like.timestamp else None
            }
            for like in likes
        ]

        return {
            "success": True,
            "post_id": post_id,
            "likes": likes_data,
            "total": post.likes_count,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        logger.error(f"Get likes error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ نظام التعليقات ============

@router.post('/{post_id}/comment')
async def add_comment(
    post_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    إضافة تعليق على منشور
    - يدعم الردود على التعليقات
    - يحدث عداد التعليقات
    - يرسل إشعارات
    """
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="المنشور غير موجود")

        if not post.allow_comments:
            raise HTTPException(status_code=403, detail="التعليقات معطلة على هذا المنشور")

        content = payload.get('content', '').strip()
        if not content:
            raise HTTPException(status_code=400, detail="محتوى التعليق مطلوب")

        parent_id = payload.get('parent_id')  # للردود على التعليقات

        from app.models.comment import Comment
        
        comment = Comment(
            post_id=post_id,
            user_id=current_user.id,
            content=content,
            parent_id=parent_id,
            timestamp=datetime.utcnow()
        )
        db.add(comment)
        
        # تحديث عداد التعليقات
        post.comments_count = (post.comments_count or 0) + 1
        db.commit()

        # إرسال إشعار للمؤلف
        if post.user_id != current_user.id:
            from app.models.notification import Notification
            notification = Notification(
                user_id=post.user_id,
                actor_id=current_user.id,
                type="comment",
                content=f"علّق {current_user.full_name or current_user.username} على منشورك",
                related_post_id=post_id,
                timestamp=datetime.utcnow()
            )
            db.add(notification)
            db.commit()

        return {
            "success": True,
            "message": "تم إضافة التعليق",
            "comment": {
                "id": comment.id,
                "post_id": post_id,
                "user": {
                    "id": current_user.id,
                    "username": current_user.username,
                    "full_name": current_user.full_name,
                    "avatar_url": current_user.avatar_url
                },
                "content": content,
                "parent_id": parent_id,
                "timestamp": comment.timestamp.isoformat()
            },
            "comments_count": post.comments_count,
            "animation": "slide_up"
        }
    except Exception as e:
        logger.error(f"Add comment error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/{post_id}/comments')
async def get_comments(
    post_id: int,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort: str = Query("recent", regex="^(recent|popular)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    الحصول على التعليقات على منشور
    - مع دعم الترتيب (الأحدث أو الأكثر تفاعلاً)
    - مع الردود على التعليقات
    """
    try:
        from app.models.comment import Comment
        
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="المنشور غير موجود")

        query = db.query(Comment).filter(
            and_(
                Comment.post_id == post_id,
                Comment.parent_id == None  # التعليقات الرئيسية فقط
            )
        )

        if sort == "popular":
            query = query.order_by(Comment.likes_count.desc())
        else:
            query = query.order_by(Comment.timestamp.desc())

        comments = query.offset(offset).limit(limit).all()

        comments_data = []
        for comment in comments:
            # الحصول على الردود
            replies = db.query(Comment).filter(
                Comment.parent_id == comment.id
            ).order_by(Comment.timestamp.asc()).limit(5).all()

            comments_data.append({
                "id": comment.id,
                "post_id": post_id,
                "user": {
                    "id": comment.user.id,
                    "username": comment.user.username,
                    "full_name": comment.user.full_name,
                    "avatar_url": comment.user.avatar_url,
                    "is_verified": comment.user.is_verified
                },
                "content": comment.content,
                "likes_count": comment.likes_count or 0,
                "replies_count": len(replies),
                "replies": [
                    {
                        "id": reply.id,
                        "user": {
                            "id": reply.user.id,
                            "username": reply.user.username,
                            "full_name": reply.user.full_name,
                            "avatar_url": reply.user.avatar_url
                        },
                        "content": reply.content,
                        "timestamp": reply.timestamp.isoformat() if reply.timestamp else None
                    }
                    for reply in replies
                ],
                "timestamp": comment.timestamp.isoformat() if comment.timestamp else None
            })

        return {
            "success": True,
            "post_id": post_id,
            "comments": comments_data,
            "total": post.comments_count,
            "limit": limit,
            "offset": offset,
            "sort": sort
        }
    except Exception as e:
        logger.error(f"Get comments error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/{post_id}/comment/{comment_id}')
async def delete_comment(
    post_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    حذف تعليق
    - يجب أن يكون المستخدم مالك التعليق أو مالك المنشور
    """
    try:
        from app.models.comment import Comment
        
        comment = db.query(Comment).filter(Comment.id == comment_id).first()
        if not comment:
            raise HTTPException(status_code=404, detail="التعليق غير موجود")

        if comment.user_id != current_user.id:
            post = db.query(Post).filter(Post.id == post_id).first()
            if post.user_id != current_user.id:
                raise HTTPException(status_code=403, detail="ليس لديك صلاحية لحذف هذا التعليق")

        post = db.query(Post).filter(Post.id == post_id).first()
        post.comments_count = max((post.comments_count or 1) - 1, 0)
        
        db.delete(comment)
        db.commit()

        return {
            "success": True,
            "message": "تم حذف التعليق",
            "comments_count": post.comments_count
        }
    except Exception as e:
        logger.error(f"Delete comment error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ نظام المشاركة ============

@router.post('/{post_id}/share')
async def share_post(
    post_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    مشاركة منشور
    - مشاركة داخلية (مع المتابعين)
    - مشاركة خارجية (نسخ الرابط)
    - مشاركة مع رسالة شخصية
    """
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="المنشور غير موجود")

        share_type = payload.get('type', 'internal')  # internal, external, link
        message = payload.get('message', '')
        recipients = payload.get('recipients', [])

        from app.models.share import Share
        
        share = Share(
            post_id=post_id,
            user_id=current_user.id,
            share_type=share_type,
            message=message,
            timestamp=datetime.utcnow()
        )
        db.add(share)
        
        # تحديث عداد المشاركات
        post.shares_count = (post.shares_count or 0) + 1
        db.commit()

        # إرسال إشعارات للمستقبلين
        if share_type == "internal" and recipients:
            from app.models.notification import Notification
            for recipient_id in recipients:
                notification = Notification(
                    user_id=recipient_id,
                    actor_id=current_user.id,
                    type="share",
                    content=f"شارك {current_user.full_name or current_user.username} منشوراً معك",
                    related_post_id=post_id,
                    timestamp=datetime.utcnow()
                )
                db.add(notification)
            db.commit()

        return {
            "success": True,
            "message": "تم مشاركة المنشور",
            "post_id": post_id,
            "shares_count": post.shares_count,
            "share_link": f"https://yamshat.app/posts/{post_id}",
            "animation": "share_success"
        }
    except Exception as e:
        logger.error(f"Share error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ نظام الحفظ ============

@router.post('/{post_id}/save')
async def save_post(
    post_id: int,
    payload: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    حفظ منشور
    - يمكن حفظ المنشور في مجلدات مختلفة
    - يتم تتبع المنشورات المحفوظة
    """
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="المنشور غير موجود")

        folder_id = payload.get('folder_id', 'default')

        from app.models.saved_post import SavedPost
        
        existing = db.query(SavedPost).filter(
            and_(
                SavedPost.post_id == post_id,
                SavedPost.user_id == current_user.id
            )
        ).first()

        if existing:
            raise HTTPException(status_code=400, detail="المنشور محفوظ بالفعل")

        saved = SavedPost(
            post_id=post_id,
            user_id=current_user.id,
            folder_id=folder_id,
            timestamp=datetime.utcnow()
        )
        db.add(saved)
        
        # تحديث عداد الحفظ
        post.saves_count = (post.saves_count or 0) + 1
        db.commit()

        return {
            "success": True,
            "message": "تم حفظ المنشور",
            "post_id": post_id,
            "saves_count": post.saves_count,
            "animation": "bookmark_add"
        }
    except Exception as e:
        logger.error(f"Save error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/{post_id}/unsave')
async def unsave_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    إزالة حفظ منشور
    """
    try:
        from app.models.saved_post import SavedPost
        
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="المنشور غير موجود")

        saved = db.query(SavedPost).filter(
            and_(
                SavedPost.post_id == post_id,
                SavedPost.user_id == current_user.id
            )
        ).first()

        if not saved:
            raise HTTPException(status_code=400, detail="المنشور غير محفوظ")

        db.delete(saved)
        
        # تحديث عداد الحفظ
        post.saves_count = max((post.saves_count or 1) - 1, 0)
        db.commit()

        return {
            "success": True,
            "message": "تم إزالة حفظ المنشور",
            "post_id": post_id,
            "saves_count": post.saves_count,
            "animation": "bookmark_remove"
        }
    except Exception as e:
        logger.error(f"Unsave error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/saved')
async def get_saved_posts(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    folder_id: str = Query('all'),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    الحصول على المنشورات المحفوظة
    - مع دعم التصفية حسب المجلد
    """
    try:
        from app.models.saved_post import SavedPost
        
        query = db.query(SavedPost).filter(
            SavedPost.user_id == current_user.id
        )

        if folder_id != 'all':
            query = query.filter(SavedPost.folder_id == folder_id)

        saved_posts = query.order_by(
            SavedPost.timestamp.desc()
        ).offset(offset).limit(limit).all()

        posts_data = [
            {
                "id": saved.post.id,
                "content": saved.post.content,
                "image_url": saved.post.image_url,
                "author": {
                    "id": saved.post.user.id,
                    "username": saved.post.user.username,
                    "full_name": saved.post.user.full_name,
                    "avatar_url": saved.post.user.avatar_url
                },
                "likes_count": saved.post.likes_count,
                "comments_count": saved.post.comments_count,
                "saved_at": saved.timestamp.isoformat() if saved.timestamp else None
            }
            for saved in saved_posts
        ]

        return {
            "success": True,
            "saved_posts": posts_data,
            "total": len(saved_posts),
            "limit": limit,
            "offset": offset,
            "folder_id": folder_id
        }
    except Exception as e:
        logger.error(f"Get saved posts error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ إحصائيات التفاعل ============

@router.get('/{post_id}/engagement')
async def get_engagement_stats(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    الحصول على إحصائيات التفاعل مع المنشور
    - عدد اللايكات والتعليقات والمشاركات
    - معدل التفاعل
    - ما إذا كان المستخدم قد أعجب أو حفظ المنشور
    """
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="المنشور غير موجود")

        from app.models.like import Like
        from app.models.saved_post import SavedPost

        # التحقق من إعجاب المستخدم
        user_liked = db.query(Like).filter(
            and_(
                Like.post_id == post_id,
                Like.user_id == current_user.id
            )
        ).first() is not None

        # التحقق من حفظ المستخدم
        user_saved = db.query(SavedPost).filter(
            and_(
                SavedPost.post_id == post_id,
                SavedPost.user_id == current_user.id
            )
        ).first() is not None

        # حساب معدل التفاعل
        total_engagement = (post.likes_count or 0) + (post.comments_count or 0) + (post.shares_count or 0)
        engagement_rate = (total_engagement / max(post.views_count or 1, 1)) * 100

        stats = PostEngagementStats(
            post_id=str(post_id),
            likes_count=post.likes_count or 0,
            comments_count=post.comments_count or 0,
            shares_count=post.shares_count or 0,
            saves_count=post.saves_count or 0,
            views_count=post.views_count or 0,
            current_user_liked=user_liked,
            current_user_saved=user_saved,
            current_user_shared=False,
            engagement_rate=round(engagement_rate, 2)
        )

        return {
            "success": True,
            "engagement": asdict(stats)
        }
    except Exception as e:
        logger.error(f"Get engagement error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ تعديل وحذف المنشورات ============

@router.patch('/{post_id}')
async def edit_post(
    post_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    تعديل منشور
    - يجب أن يكون المستخدم مالك المنشور
    - يتم حفظ سجل التعديلات
    """
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="المنشور غير موجود")

        if post.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="ليس لديك صلاحية لتعديل هذا المنشور")

        # حفظ النسخة السابقة
        from app.models.post_history import PostHistory
        history = PostHistory(
            post_id=post_id,
            content=post.content,
            content_html=post.content_html,
            timestamp=datetime.utcnow()
        )
        db.add(history)

        # تحديث المنشور
        if 'content' in payload:
            post.content = payload['content']
        if 'content_html' in payload:
            post.content_html = payload['content_html']
        if 'media_urls' in payload:
            post.media_urls = payload['media_urls']

        post.updated_at = datetime.utcnow()
        db.commit()

        return {
            "success": True,
            "message": "تم تعديل المنشور",
            "post": {
                "id": post.id,
                "content": post.content,
                "updated_at": post.updated_at.isoformat() if post.updated_at else None
            },
            "animation": "fade_in"
        }
    except Exception as e:
        logger.error(f"Edit post error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/{post_id}')
async def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    حذف منشور
    - يجب أن يكون المستخدم مالك المنشور
    """
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="المنشور غير موجود")

        if post.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="ليس لديك صلاحية لحذف هذا المنشور")

        post.is_deleted = True
        post.deleted_at = datetime.utcnow()
        db.commit()

        return {
            "success": True,
            "message": "تم حذف المنشور",
            "post_id": post_id,
            "animation": "slide_out"
        }
    except Exception as e:
        logger.error(f"Delete post error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
