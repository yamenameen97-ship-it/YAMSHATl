"""
نظام الستوري والريلز المحسّن - Enhanced Stories & Reels System
يوفر:
- تشغيل تلقائي للستوري والريلز
- تقدم زمني (Progress Bar)
- ردود على الستوري
- مشاهدات وإحصائيات
- خوارزمية اقتراح ذكية
- تمرير عمودي سلس (Swipe)
"""

from fastapi import APIRouter, Depends, Query, HTTPException, Body, status, UploadFile, File
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, desc
from dataclasses import dataclass, asdict
import logging
import asyncio

from app.core.dependencies import get_current_user, get_db
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()

# ============ تعريفات الأنواع ============

@dataclass
class StoryInfo:
    """معلومات الستوري"""
    id: str
    user_id: str
    user_name: str
    user_avatar: str
    media_url: str
    caption: Optional[str] = None
    duration: int = 5  # بالثواني
    views_count: int = 0
    replies_count: int = 0
    timestamp: str = None
    expires_at: str = None
    is_viewed: bool = False
    viewed_at: Optional[str] = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat()


@dataclass
class ReelInfo:
    """معلومات الريل"""
    id: str
    user_id: str
    user_name: str
    user_avatar: str
    video_url: str
    thumbnail_url: str
    caption: Optional[str] = None
    duration: int = 0
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    views_count: int = 0
    timestamp: str = None
    is_liked: bool = False
    is_saved: bool = False

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat()


@dataclass
class ReelRecommendation:
    """توصية الريل"""
    reel_id: str
    score: float  # درجة التوصية
    reason: str  # سبب التوصية
    category: str  # الفئة


# ============ محرك التوصيات الذكي ============

class SmartRecommendationEngine:
    """محرك التوصيات الذكي للريلز"""

    def __init__(self):
        self.user_preferences = {}
        self.engagement_history = {}

    def calculate_recommendation_score(
        self,
        reel,
        user,
        user_engagement_history: Dict = None,
        user_preferences: Dict = None
    ) -> float:
        """حساب درجة التوصية للريل"""
        if user_engagement_history is None:
            user_engagement_history = {}
        if user_preferences is None:
            user_preferences = {}

        score = 0.0

        # 1. درجة التفاعل (Engagement Score)
        total_engagement = (reel.likes_count or 0) + (reel.comments_count or 0) + (reel.shares_count or 0)
        engagement_rate = (total_engagement / max(reel.views_count or 1, 1)) * 100
        score += min(engagement_rate / 100, 0.3)

        # 2. درجة الحداثة (Recency Score)
        time_diff = (datetime.utcnow() - reel.created_at).total_seconds()
        if time_diff < 3600:  # أقل من ساعة
            score += 0.25
        elif time_diff < 86400:  # أقل من يوم
            score += 0.15
        elif time_diff < 604800:  # أقل من أسبوع
            score += 0.1

        # 3. درجة المتابعة (Following Score)
        if reel.user_id in user_preferences.get('following', []):
            score += 0.2

        # 4. درجة الفئة (Category Score)
        if reel.category in user_preferences.get('preferred_categories', []):
            score += 0.15

        # 5. درجة التفاعل السابق (Historical Score)
        if reel.category in user_engagement_history:
            score += 0.1

        return min(score, 1.0)

    def get_recommendations(
        self,
        user,
        reels: List,
        limit: int = 10,
        exclude_ids: List[str] = None
    ) -> List[ReelRecommendation]:
        """الحصول على توصيات الريلز"""
        if exclude_ids is None:
            exclude_ids = []

        recommendations = []

        for reel in reels:
            if str(reel.id) in exclude_ids:
                continue

            score = self.calculate_recommendation_score(
                reel,
                user,
                self.engagement_history.get(user.id, {}),
                self.user_preferences.get(user.id, {})
            )

            reason = self._get_recommendation_reason(score, reel, user)

            recommendations.append(ReelRecommendation(
                reel_id=str(reel.id),
                score=score,
                reason=reason,
                category=getattr(reel, 'category', 'general')
            ))

        # ترتيب حسب الدرجة
        recommendations.sort(key=lambda x: x.score, reverse=True)
        return recommendations[:limit]

    def _get_recommendation_reason(self, score: float, reel, user: User) -> str:
        """الحصول على سبب التوصية"""
        if score > 0.7:
            return "محتوى شهير"
        elif score > 0.5:
            return "قد يعجبك"
        elif score > 0.3:
            return "محتوى حديث"
        else:
            return "توصية"


recommendation_engine = SmartRecommendationEngine()


# ============ المسارات (Routes) ============

# ============ نظام الستوري ============

@router.post('/stories')
async def create_story(
    file: UploadFile = File(...),
    caption: str = Query(""),
    duration: int = Query(5, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    إنشاء ستوري جديد
    - تحميل الصورة/الفيديو
    - تعيين المدة
    - إضافة التعليق
    """
    try:
        from app.models.story import Story
        from app.services.media_storage_service import save_media_permanently

        # ✅ إصلاح v41: حفظ دائم بدلاً من filesystem المؤقت
        is_video = (file.content_type or "").startswith("video")
        media_result = await save_media_permanently(
            file=file,
            folder="stories",
            user_id=current_user.id,
            is_video=is_video,
        )

        # إنشاء الستوري برابط دائم
        story = Story(
            user_id=current_user.id,
            media_url=media_result["url"],
            caption=caption,
            duration=duration,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=24)
        )
        db.add(story)
        db.commit()

        return {
            "success": True,
            "message": "تم إنشاء الستوري",
            "story": {
                "id": story.id,
                "media_url": story.media_url,
                "caption": story.caption,
                "duration": story.duration,
                "created_at": story.created_at.isoformat() if story.created_at else None
            },
            "animation": "story_created"
        }
    except Exception as e:
        logger.error(f"Create story error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/stories/feed')
async def get_stories_feed(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    الحصول على قائمة الستوري من المتابعين
    - مع معلومات المشاهدة
    - مع التقدم الزمني
    """
    try:
        from app.models.story import Story
        from app.models.story_view import StoryView
        
        # الحصول على الستوري من المتابعين
        stories = db.query(Story).filter(
            Story.user_id.in_(
                db.query(User.id).filter(
                    User.followers.any(follower_id=current_user.id)
                )
            ),
            Story.expires_at > datetime.utcnow()
        ).order_by(desc(Story.created_at)).limit(limit).all()

        stories_data = []
        for story in stories:
            # التحقق من المشاهدة
            view = db.query(StoryView).filter(
                and_(
                    StoryView.story_id == story.id,
                    StoryView.user_id == current_user.id
                )
            ).first()

            stories_data.append({
                "id": story.id,
                "user": {
                    "id": story.user.id,
                    "username": story.user.username,
                    "full_name": story.user.full_name,
                    "avatar_url": story.user.avatar_url
                },
                "media_url": story.media_url,
                "caption": story.caption,
                "duration": story.duration,
                "views_count": story.views_count or 0,
                "is_viewed": view is not None,
                "viewed_at": view.viewed_at.isoformat() if view and view.viewed_at else None,
                "created_at": story.created_at.isoformat() if story.created_at else None,
                "expires_at": story.expires_at.isoformat() if story.expires_at else None,
                "progress": 0  # للتقدم الزمني
            })

        return {
            "success": True,
            "stories": stories_data,
            "total": len(stories_data),
            "autoplay": True,
            "duration_per_story": 5
        }
    except Exception as e:
        logger.error(f"Get stories feed error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/stories/{story_id}/view')
async def mark_story_as_viewed(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    تسجيل مشاهدة الستوري
    - يحدث عداد المشاهدات
    - يحفظ وقت المشاهدة
    """
    try:
        from app.models.story import Story
        from app.models.story_view import StoryView
        
        story = db.query(Story).filter(Story.id == story_id).first()
        if not story:
            raise HTTPException(status_code=404, detail="الستوري غير موجود")

        # التحقق من المشاهدة السابقة
        existing_view = db.query(StoryView).filter(
            and_(
                StoryView.story_id == story_id,
                StoryView.user_id == current_user.id
            )
        ).first()

        if not existing_view:
            view = StoryView(
                story_id=story_id,
                user_id=current_user.id,
                viewed_at=datetime.utcnow()
            )
            db.add(view)
            
            # تحديث عداد المشاهدات
            story.views_count = (story.views_count or 0) + 1
            db.commit()

        return {
            "success": True,
            "message": "تم تسجيل المشاهدة",
            "story_id": story_id,
            "views_count": story.views_count
        }
    except Exception as e:
        logger.error(f"Mark story viewed error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/stories/{story_id}/reply')
async def reply_to_story(
    story_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    الرد على الستوري
    - يمكن الرد برسالة نصية أو صورة
    """
    try:
        from app.models.story import Story
        from app.models.story_reply import StoryReply
        
        story = db.query(Story).filter(Story.id == story_id).first()
        if not story:
            raise HTTPException(status_code=404, detail="الستوري غير موجود")

        reply_type = payload.get('type', 'text')  # text, image
        content = payload.get('content', '')

        reply = StoryReply(
            story_id=story_id,
            user_id=current_user.id,
            reply_type=reply_type,
            content=content,
            created_at=datetime.utcnow()
        )
        db.add(reply)
        
        # تحديث عداد الردود
        story.replies_count = (story.replies_count or 0) + 1
        db.commit()

        return {
            "success": True,
            "message": "تم إرسال الرد",
            "story_id": story_id,
            "replies_count": story.replies_count,
            "animation": "message_sent"
        }
    except Exception as e:
        logger.error(f"Reply to story error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ نظام الريلز ============

@router.post('')
async def create_reel(
    file: UploadFile = File(...),
    thumbnail: UploadFile = File(...),
    caption: str = Query(""),
    category: str = Query("general"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    إنشاء ريل جديد
    - تحميل الفيديو والصورة المصغرة
    - تعيين الفئة
    """
    try:
        from app.models.reel import Reel
        from app.services.media_storage_service import save_media_permanently

        # ✅ إصلاح v41: حفظ دائم (Cloudinary أو Persistent Disk) بدل filesystem المؤقت
        video_result = await save_media_permanently(
            file=file,
            folder="reels/videos",
            user_id=current_user.id,
            is_video=True,
        )
        thumb_result = await save_media_permanently(
            file=thumbnail,
            folder="reels/thumbnails",
            user_id=current_user.id,
            is_video=False,
        )

        # إنشاء الريل — الرابط الآن دائم ولن يختفي عند إعادة النشر
        reel = Reel(
            user_id=current_user.id,
            video_url=video_result["url"],
            thumbnail_url=thumb_result["url"],
            caption=caption,
            category=category,
            created_at=datetime.utcnow()
        )
        db.add(reel)
        db.commit()
        logger.info(
            "✅ Reel saved permanently. storage=%s url=%s",
            video_result["storage"], video_result["url"],
        )

        return {
            "success": True,
            "message": "تم إنشاء الريل",
            "reel": {
                "id": reel.id,
                "video_url": reel.video_url,
                "thumbnail_url": reel.thumbnail_url,
                "caption": reel.caption,
                "category": reel.category,
                "created_at": reel.created_at.isoformat() if reel.created_at else None
            },
            "animation": "reel_created"
        }
    except Exception as e:
        logger.error(f"Create reel error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/feed')
async def get_reels_feed(
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    category: str = Query("all"),
    exclude_ids: List[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    الحصول على قائمة الريلز مع التوصيات الذكية
    - تمرير عمودي سلس
    - توصيات مخصصة
    - ترتيب ذكي
    """
    try:
        from app.models.reel import Reel
        from app.models.reel_like import ReelLike
        from app.models.saved_reel import SavedReel
        
        if exclude_ids is None:
            exclude_ids = []

        # الحصول على الريلز
        query = db.query(Reel)
        
        if category != "all":
            query = query.filter(Reel.category == category)
        
        if exclude_ids:
            query = query.filter(~Reel.id.in_(exclude_ids))

        reels = query.order_by(desc(Reel.created_at)).offset(offset).limit(limit).all()

        # الحصول على التوصيات
        recommendations = recommendation_engine.get_recommendations(
            current_user,
            reels,
            limit=limit,
            exclude_ids=[str(r_id) for r_id in exclude_ids]
        )

        reels_data = []
        for reel in reels:
            # التحقق من الإعجاب والحفظ
            is_liked = db.query(ReelLike).filter(
                and_(
                    ReelLike.reel_id == reel.id,
                    ReelLike.user_id == current_user.id
                )
            ).first() is not None

            is_saved = db.query(SavedReel).filter(
                and_(
                    SavedReel.reel_id == reel.id,
                    SavedReel.user_id == current_user.id
                )
            ).first() is not None

            reels_data.append({
                "id": reel.id,
                "user": {
                    "id": reel.user.id,
                    "username": reel.user.username,
                    "full_name": reel.user.full_name,
                    "avatar_url": reel.user.avatar_url
                },
                "video_url": reel.video_url,
                "thumbnail_url": reel.thumbnail_url,
                "caption": reel.caption,
                "category": reel.category,
                "likes_count": reel.likes_count or 0,
                "comments_count": reel.comments_count or 0,
                "shares_count": reel.shares_count or 0,
                "views_count": reel.views_count or 0,
                "is_liked": is_liked,
                "is_saved": is_saved,
                "created_at": reel.created_at.isoformat() if reel.created_at else None
            })

        return {
            "success": True,
            "reels": reels_data,
            "recommendations": [asdict(r) for r in recommendations],
            "total": len(reels_data),
            "autoplay": True,
            "swipe_direction": "vertical",
            "smooth_transition": True
        }
    except Exception as e:
        logger.error(f"Get reels feed error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/{reel_id}/like')
async def like_reel(
    reel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    إضافة لايك على ريل
    """
    try:
        from app.models.reel import Reel
        from app.models.reel_like import ReelLike
        
        reel = db.query(Reel).filter(Reel.id == reel_id).first()
        if not reel:
            raise HTTPException(status_code=404, detail="الريل غير موجود")

        existing_like = db.query(ReelLike).filter(
            and_(
                ReelLike.reel_id == reel_id,
                ReelLike.user_id == current_user.id
            )
        ).first()

        if existing_like:
            raise HTTPException(status_code=400, detail="لقد أعجبت بهذا الريل بالفعل")

        like = ReelLike(
            reel_id=reel_id,
            user_id=current_user.id,
            created_at=datetime.utcnow()
        )
        db.add(like)
        
        reel.likes_count = (reel.likes_count or 0) + 1
        db.commit()

        return {
            "success": True,
            "message": "تم الإعجاب بالريل",
            "reel_id": reel_id,
            "likes_count": reel.likes_count,
            "animation": "heart_pop"
        }
    except Exception as e:
        logger.error(f"Like reel error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/{reel_id}/view')
async def record_reel_view(
    reel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    تسجيل مشاهدة الريل
    - يحدث عداد المشاهدات
    - يحفظ في سجل التفاعل
    """
    try:
        from app.models.reel import Reel
        from app.models.reel_view import ReelView
        
        reel = db.query(Reel).filter(Reel.id == reel_id).first()
        if not reel:
            raise HTTPException(status_code=404, detail="الريل غير موجود")

        view = ReelView(
            reel_id=reel_id,
            user_id=current_user.id,
            viewed_at=datetime.utcnow()
        )
        db.add(view)
        
        reel.views_count = (reel.views_count or 0) + 1
        db.commit()

        # تحديث تفضيلات المستخدم
        if current_user.id not in recommendation_engine.user_preferences:
            recommendation_engine.user_preferences[current_user.id] = {
                'preferred_categories': [],
                'following': []
            }
        
        if reel.category not in recommendation_engine.user_preferences[current_user.id]['preferred_categories']:
            recommendation_engine.user_preferences[current_user.id]['preferred_categories'].append(reel.category)

        return {
            "success": True,
            "message": "تم تسجيل المشاهدة",
            "reel_id": reel_id,
            "views_count": reel.views_count
        }
    except Exception as e:
        logger.error(f"Record reel view error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/trending')
async def get_trending_reels(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    الحصول على الريلز الشهيرة (الأكثر مشاهدة)
    - مع معدل التفاعل
    """
    try:
        from app.models.reel import Reel
        
        reels = db.query(Reel).order_by(
            desc(Reel.views_count)
        ).limit(limit).all()

        reels_data = [
            {
                "id": reel.id,
                "user": {
                    "id": reel.user.id,
                    "username": reel.user.username,
                    "full_name": reel.user.full_name,
                    "avatar_url": reel.user.avatar_url
                },
                "video_url": reel.video_url,
                "thumbnail_url": reel.thumbnail_url,
                "caption": reel.caption,
                "views_count": reel.views_count or 0,
                "likes_count": reel.likes_count or 0,
                "engagement_rate": ((reel.likes_count or 0) / max(reel.views_count or 1, 1)) * 100
            }
            for reel in reels
        ]

        return {
            "success": True,
            "trending_reels": reels_data,
            "total": len(reels_data)
        }
    except Exception as e:
        logger.error(f"Get trending reels error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
