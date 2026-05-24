"""خدمة الريلز والقصص المتقدمة - Enhanced Reels & Stories Service
يوفر:
- إدارة الريلز والفيديوهات
- نظام القصص مع الأرشيف والإضاءات
- التشغيل التلقائي والبث التكيفي
- اختيار الجودة والترجمات
- سجل المشاهدة والتوصيات
- حفظ وإعادة تمزيق الريلز
- تحليلات الريلز والمبدعين
- أدوات المبدعين والنقود
- منع التحميل
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from dataclasses import dataclass, asdict, field
from enum import Enum
import logging
import uuid

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Yamshat Enhanced Reels & Stories Service",
    description="خدمة الريلز والقصص المتقدمة",
    version="2.0.0"
)

# إضافة CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ تعريفات الأنواع ============

class VideoQuality(str, Enum):
    """جودة الفيديو"""
    ULTRA_HD = "4k"
    FULL_HD = "1080p"
    HD = "720p"
    SD = "480p"
    LOW = "360p"


class StoryType(str, Enum):
    """أنواع القصص"""
    IMAGE = "image"
    VIDEO = "video"
    TEXT = "text"


class ReelCategory(str, Enum):
    """فئات الريلز"""
    ENTERTAINMENT = "entertainment"
    EDUCATION = "education"
    MUSIC = "music"
    SPORTS = "sports"
    COMEDY = "comedy"
    LIFESTYLE = "lifestyle"
    TECHNOLOGY = "technology"
    TRAVEL = "travel"
    FOOD = "food"
    BEAUTY = "beauty"


@dataclass
class VideoMetadata:
    """بيانات الفيديو"""
    duration: int = 0  # بالثواني
    width: int = 0
    height: int = 0
    fps: int = 30
    bitrate: int = 0  # بالـ kbps
    format: str = "mp4"


@dataclass
class ReelAnalytics:
    """تحليلات الريل"""
    views_count: int = 0
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    saves_count: int = 0
    remixes_count: int = 0
    watch_time: int = 0  # بالثواني
    completion_rate: float = 0.0  # النسبة المئوية
    engagement_rate: float = 0.0  # النسبة المئوية
    average_watch_time: int = 0  # بالثواني


@dataclass
class Reel:
    """ريل (فيديو قصير)"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    creator_id: str = ""
    creator_name: str = ""
    creator_avatar: str = ""
    title: str = ""
    description: str = ""
    video_url: str = ""
    thumbnail_url: str = ""
    category: ReelCategory = ReelCategory.ENTERTAINMENT
    tags: List[str] = field(default_factory=list)
    metadata: VideoMetadata = field(default_factory=VideoMetadata)
    analytics: ReelAnalytics = field(default_factory=ReelAnalytics)
    is_public: bool = True
    is_monetized: bool = False
    allow_remix: bool = True
    allow_download: bool = False
    allow_comments: bool = True
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class StoryElement:
    """عنصر القصة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    type: StoryType = StoryType.IMAGE
    content_url: str = ""
    text: str = ""
    duration: int = 5  # بالثواني
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class StoryReaction:
    """تفاعل على القصة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    user_name: str = ""
    reaction_type: str = ""  # emoji
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class StoryReply:
    """رد على القصة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    user_name: str = ""
    user_avatar: str = ""
    content: str = ""
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class Story:
    """قصة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    creator_id: str = ""
    creator_name: str = ""
    creator_avatar: str = ""
    elements: List[StoryElement] = field(default_factory=list)
    viewers: List[str] = field(default_factory=list)
    reactions: List[StoryReaction] = field(default_factory=list)
    replies: List[StoryReply] = field(default_factory=list)
    is_archived: bool = False
    is_highlighted: bool = False
    highlight_name: str = ""
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    expires_at: str = field(default_factory=lambda: (datetime.utcnow() + timedelta(hours=24)).isoformat())


@dataclass
class WatchHistory:
    """سجل المشاهدة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    reel_id: str = ""
    watched_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    watch_duration: int = 0  # بالثواني


# ============ مدير الريلز والقصص ============

class EnhancedReelsStoriesManager:
    """مدير الريلز والقصص المتقدم"""

    def __init__(self):
        # الريلز
        self.reels: Dict[str, Reel] = {}
        
        # القصص
        self.stories: Dict[str, Story] = {}
        
        # سجل المشاهدة
        self.watch_history: List[WatchHistory] = []
        
        # المحفوظات
        self.saved_reels: Dict[str, List[str]] = {}  # {user_id: [reel_ids]}
        
        # الريلز المعاد تمزيقها
        self.remixed_reels: Dict[str, List[str]] = {}  # {user_id: [reel_ids]}

    async def create_reel(
        self,
        creator_id: str,
        creator_name: str,
        creator_avatar: str,
        title: str,
        description: str,
        video_url: str,
        thumbnail_url: str,
        category: ReelCategory,
        tags: List[str] = [],
        is_public: bool = True,
        allow_remix: bool = True,
        allow_download: bool = False,
        allow_comments: bool = True
    ) -> Reel:
        """إنشاء ريل جديد"""
        reel = Reel(
            creator_id=creator_id,
            creator_name=creator_name,
            creator_avatar=creator_avatar,
            title=title,
            description=description,
            video_url=video_url,
            thumbnail_url=thumbnail_url,
            category=category,
            tags=tags,
            is_public=is_public,
            allow_remix=allow_remix,
            allow_download=allow_download,
            allow_comments=allow_comments
        )

        self.reels[reel.id] = reel
        logger.info(f"✅ Reel created: {reel.id} (Title: {title})")
        return reel

    async def update_reel(
        self,
        reel_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        category: Optional[ReelCategory] = None,
        tags: Optional[List[str]] = None,
        is_public: Optional[bool] = None
    ) -> bool:
        """تحديث الريل"""
        if reel_id not in self.reels:
            return False

        reel = self.reels[reel_id]
        if title:
            reel.title = title
        if description:
            reel.description = description
        if category:
            reel.category = category
        if tags:
            reel.tags = tags
        if is_public is not None:
            reel.is_public = is_public

        reel.updated_at = datetime.utcnow().isoformat()
        logger.info(f"✅ Reel updated: {reel_id}")
        return True

    async def delete_reel(self, reel_id: str) -> bool:
        """حذف ريل"""
        if reel_id not in self.reels:
            return False

        del self.reels[reel_id]
        logger.info(f"✅ Reel deleted: {reel_id}")
        return True

    async def like_reel(self, reel_id: str, user_id: str) -> bool:
        """إعجاب بريل"""
        if reel_id not in self.reels:
            return False

        reel = self.reels[reel_id]
        reel.analytics.likes_count += 1
        logger.info(f"👍 Like added to reel {reel_id}")
        return True

    async def save_reel(self, user_id: str, reel_id: str) -> bool:
        """حفظ ريل"""
        if reel_id not in self.reels:
            return False

        if user_id not in self.saved_reels:
            self.saved_reels[user_id] = []

        if reel_id not in self.saved_reels[user_id]:
            self.saved_reels[user_id].append(reel_id)
            self.reels[reel_id].analytics.saves_count += 1
            logger.info(f"💾 Reel {reel_id} saved by {user_id}")
            return True
        return False

    async def unsave_reel(self, user_id: str, reel_id: str) -> bool:
        """إلغاء حفظ ريل"""
        if user_id in self.saved_reels and reel_id in self.saved_reels[user_id]:
            self.saved_reels[user_id].remove(reel_id)
            self.reels[reel_id].analytics.saves_count -= 1
            logger.info(f"💾 Reel {reel_id} unsaved by {user_id}")
            return True
        return False

    async def remix_reel(self, user_id: str, original_reel_id: str) -> Optional[Reel]:
        """إعادة تمزيق ريل"""
        if original_reel_id not in self.reels:
            return None

        original_reel = self.reels[original_reel_id]
        if not original_reel.allow_remix:
            return None

        # إنشاء ريل جديد كنسخة معاد تمزيقها
        remixed_reel = await self.create_reel(
            creator_id=user_id,
            creator_name="",
            creator_avatar="",
            title=f"Remix: {original_reel.title}",
            description=f"Remix of {original_reel.creator_name}'s reel",
            video_url="",
            thumbnail_url="",
            category=original_reel.category,
            tags=original_reel.tags
        )

        original_reel.analytics.remixes_count += 1

        if user_id not in self.remixed_reels:
            self.remixed_reels[user_id] = []
        self.remixed_reels[user_id].append(remixed_reel.id)

        logger.info(f"🎬 Reel {original_reel_id} remixed by {user_id}")
        return remixed_reel

    async def record_view(self, user_id: str, reel_id: str, watch_duration: int) -> bool:
        """تسجيل مشاهدة"""
        if reel_id not in self.reels:
            return False

        reel = self.reels[reel_id]
        reel.analytics.views_count += 1

        # تحديث متوسط وقت المشاهدة
        if reel.analytics.watch_time > 0:
            reel.analytics.average_watch_time = (
                reel.analytics.watch_time + watch_duration
            ) // 2
        else:
            reel.analytics.average_watch_time = watch_duration

        reel.analytics.watch_time += watch_duration

        # حساب معدل الإكمال
        if reel.metadata.duration > 0:
            reel.analytics.completion_rate = (
                watch_duration / reel.metadata.duration
            ) * 100

        # تسجيل في سجل المشاهدة
        watch_record = WatchHistory(
            user_id=user_id,
            reel_id=reel_id,
            watch_duration=watch_duration
        )
        self.watch_history.append(watch_record)

        logger.info(f"👁️ View recorded for reel {reel_id}")
        return True

    async def create_story(
        self,
        creator_id: str,
        creator_name: str,
        creator_avatar: str,
        elements: List[StoryElement] = []
    ) -> Story:
        """إنشاء قصة جديدة"""
        story = Story(
            creator_id=creator_id,
            creator_name=creator_name,
            creator_avatar=creator_avatar,
            elements=elements
        )

        self.stories[story.id] = story
        logger.info(f"✅ Story created: {story.id}")
        return story

    async def add_story_element(
        self,
        story_id: str,
        element_type: StoryType,
        content_url: str = "",
        text: str = "",
        duration: int = 5
    ) -> bool:
        """إضافة عنصر إلى القصة"""
        if story_id not in self.stories:
            return False

        story = self.stories[story_id]
        element = StoryElement(
            type=element_type,
            content_url=content_url,
            text=text,
            duration=duration
        )
        story.elements.append(element)

        logger.info(f"✅ Element added to story {story_id}")
        return True

    async def view_story(self, user_id: str, story_id: str) -> bool:
        """عرض قصة"""
        if story_id not in self.stories:
            return False

        story = self.stories[story_id]
        if user_id not in story.viewers:
            story.viewers.append(user_id)
            logger.info(f"👁️ Story {story_id} viewed by {user_id}")
            return True
        return False

    async def react_to_story(
        self,
        story_id: str,
        user_id: str,
        user_name: str,
        reaction_type: str
    ) -> bool:
        """التفاعل مع القصة"""
        if story_id not in self.stories:
            return False

        story = self.stories[story_id]
        reaction = StoryReaction(
            user_id=user_id,
            user_name=user_name,
            reaction_type=reaction_type
        )
        story.reactions.append(reaction)

        logger.info(f"😊 Reaction added to story {story_id}")
        return True

    async def reply_to_story(
        self,
        story_id: str,
        user_id: str,
        user_name: str,
        user_avatar: str,
        content: str
    ) -> bool:
        """الرد على القصة"""
        if story_id not in self.stories:
            return False

        story = self.stories[story_id]
        reply = StoryReply(
            user_id=user_id,
            user_name=user_name,
            user_avatar=user_avatar,
            content=content
        )
        story.replies.append(reply)

        logger.info(f"💬 Reply added to story {story_id}")
        return True

    async def archive_story(self, story_id: str) -> bool:
        """أرشفة قصة"""
        if story_id not in self.stories:
            return False

        story = self.stories[story_id]
        story.is_archived = True
        logger.info(f"📦 Story {story_id} archived")
        return True

    async def highlight_story(
        self,
        story_id: str,
        highlight_name: str
    ) -> bool:
        """إضاءة القصة"""
        if story_id not in self.stories:
            return False

        story = self.stories[story_id]
        story.is_highlighted = True
        story.highlight_name = highlight_name
        logger.info(f"⭐ Story {story_id} highlighted as {highlight_name}")
        return True

    def get_reel(self, reel_id: str) -> Optional[Reel]:
        """الحصول على الريل"""
        return self.reels.get(reel_id)

    def get_reels_by_creator(self, creator_id: str, limit: int = 50) -> List[Reel]:
        """الحصول على ريلز المبدع"""
        creator_reels = [
            reel for reel in self.reels.values()
            if reel.creator_id == creator_id
        ]
        return creator_reels[:limit]

    def get_reels_by_category(self, category: ReelCategory, limit: int = 50) -> List[Reel]:
        """الحصول على الريلز حسب الفئة"""
        category_reels = [
            reel for reel in self.reels.values()
            if reel.category == category and reel.is_public
        ]
        return category_reels[:limit]

    def get_trending_reels(self, limit: int = 50) -> List[Reel]:
        """الحصول على الريلز الرائجة"""
        trending = sorted(
            self.reels.values(),
            key=lambda r: r.analytics.engagement_rate,
            reverse=True
        )
        return trending[:limit]

    def get_recommended_reels(self, user_id: str, limit: int = 50) -> List[Reel]:
        """الحصول على الريلز الموصى بها"""
        # بناءً على سجل المشاهدة والفئات المفضلة
        user_watched = [h.reel_id for h in self.watch_history if h.user_id == user_id]
        
        recommendations = [
            reel for reel in self.reels.values()
            if reel.id not in user_watched and reel.is_public
        ]
        
        # ترتيب حسب الشهرة والمشاهدات
        recommendations.sort(
            key=lambda r: r.analytics.views_count,
            reverse=True
        )
        
        return recommendations[:limit]

    def get_saved_reels(self, user_id: str, limit: int = 50) -> List[Reel]:
        """الحصول على الريلز المحفوظة"""
        if user_id not in self.saved_reels:
            return []

        saved_reel_ids = self.saved_reels[user_id]
        saved_reels = [
            self.reels[reel_id] for reel_id in saved_reel_ids
            if reel_id in self.reels
        ]
        return saved_reels[:limit]

    def get_story(self, story_id: str) -> Optional[Story]:
        """الحصول على القصة"""
        return self.stories.get(story_id)

    def get_user_stories(self, creator_id: str) -> List[Story]:
        """الحصول على قصص المستخدم"""
        user_stories = [
            story for story in self.stories.values()
            if story.creator_id == creator_id and not story.is_archived
        ]
        return user_stories

    def get_user_story_highlights(self, creator_id: str) -> List[Story]:
        """الحصول على إضاءات قصص المستخدم"""
        highlights = [
            story for story in self.stories.values()
            if story.creator_id == creator_id and story.is_highlighted
        ]
        return highlights

    def get_watch_history(self, user_id: str, limit: int = 50) -> List[WatchHistory]:
        """الحصول على سجل المشاهدة"""
        user_history = [
            h for h in self.watch_history
            if h.user_id == user_id
        ]
        return user_history[-limit:]


# ============ مثيل مدير الريلز والقصص ============

reels_stories_manager = EnhancedReelsStoriesManager()


# ============ المسارات (Routes) ============

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "enhanced-reels-stories-service",
        "version": "2.0.0",
        "total_reels": len(reels_stories_manager.reels),
        "total_stories": len(reels_stories_manager.stories)
    }


@app.post("/reels")
async def create_reel(
    creator_id: str = Query(...),
    creator_name: str = Query(...),
    creator_avatar: str = Query(""),
    title: str = Query(...),
    description: str = Query(...),
    video_url: str = Query(...),
    thumbnail_url: str = Query(...),
    category: ReelCategory = Query(...),
    tags: List[str] = Query([]),
    is_public: bool = Query(True),
    allow_remix: bool = Query(True),
    allow_download: bool = Query(False),
    allow_comments: bool = Query(True)
):
    """إنشاء ريل جديد"""
    try:
        reel = await reels_stories_manager.create_reel(
            creator_id, creator_name, creator_avatar, title, description,
            video_url, thumbnail_url, category, tags, is_public,
            allow_remix, allow_download, allow_comments
        )
        return {
            "success": True,
            "reel_id": reel.id,
            "reel": asdict(reel)
        }
    except Exception as e:
        logger.error(f"❌ Error creating reel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reels/{reel_id}")
async def get_reel(reel_id: str):
    """الحصول على الريل"""
    try:
        reel = reels_stories_manager.get_reel(reel_id)
        if reel:
            return {
                "success": True,
                "reel": asdict(reel)
            }
        else:
            raise HTTPException(status_code=404, detail="الريل غير موجود")
    except Exception as e:
        logger.error(f"❌ Error getting reel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/reels/{reel_id}")
async def update_reel(
    reel_id: str,
    title: Optional[str] = Query(None),
    description: Optional[str] = Query(None),
    category: Optional[ReelCategory] = Query(None),
    tags: Optional[List[str]] = Query(None),
    is_public: Optional[bool] = Query(None)
):
    """تحديث الريل"""
    try:
        if await reels_stories_manager.update_reel(reel_id, title, description, category, tags, is_public):
            return {"success": True, "message": "تم تحديث الريل"}
        else:
            raise HTTPException(status_code=404, detail="الريل غير موجود")
    except Exception as e:
        logger.error(f"❌ Error updating reel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/reels/{reel_id}")
async def delete_reel(reel_id: str):
    """حذف ريل"""
    try:
        if await reels_stories_manager.delete_reel(reel_id):
            return {"success": True, "message": "تم حذف الريل"}
        else:
            raise HTTPException(status_code=404, detail="الريل غير موجود")
    except Exception as e:
        logger.error(f"❌ Error deleting reel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reels/{reel_id}/like")
async def like_reel(reel_id: str, user_id: str = Query(...)):
    """إعجاب بريل"""
    try:
        if await reels_stories_manager.like_reel(reel_id, user_id):
            return {"success": True, "message": "تم الإعجاب"}
        else:
            raise HTTPException(status_code=404, detail="الريل غير موجود")
    except Exception as e:
        logger.error(f"❌ Error liking reel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reels/{reel_id}/save")
async def save_reel(reel_id: str, user_id: str = Query(...)):
    """حفظ ريل"""
    try:
        if await reels_stories_manager.save_reel(user_id, reel_id):
            return {"success": True, "message": "تم حفظ الريل"}
        else:
            raise HTTPException(status_code=400, detail="فشل حفظ الريل")
    except Exception as e:
        logger.error(f"❌ Error saving reel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/reels/{reel_id}/save")
async def unsave_reel(reel_id: str, user_id: str = Query(...)):
    """إلغاء حفظ ريل"""
    try:
        if await reels_stories_manager.unsave_reel(user_id, reel_id):
            return {"success": True, "message": "تم إلغاء حفظ الريل"}
        else:
            raise HTTPException(status_code=404, detail="الريل غير محفوظ")
    except Exception as e:
        logger.error(f"❌ Error unsaving reel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reels/{reel_id}/remix")
async def remix_reel(reel_id: str, user_id: str = Query(...)):
    """إعادة تمزيق ريل"""
    try:
        remixed_reel = await reels_stories_manager.remix_reel(user_id, reel_id)
        if remixed_reel:
            return {
                "success": True,
                "remixed_reel": asdict(remixed_reel)
            }
        else:
            raise HTTPException(status_code=400, detail="فشل إعادة التمزيق")
    except Exception as e:
        logger.error(f"❌ Error remixing reel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reels/{reel_id}/view")
async def record_view(
    reel_id: str,
    user_id: str = Query(...),
    watch_duration: int = Query(...)
):
    """تسجيل مشاهدة"""
    try:
        if await reels_stories_manager.record_view(user_id, reel_id, watch_duration):
            return {"success": True, "message": "تم تسجيل المشاهدة"}
        else:
            raise HTTPException(status_code=404, detail="الريل غير موجود")
    except Exception as e:
        logger.error(f"❌ Error recording view: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reels/creator/{creator_id}")
async def get_reels_by_creator(creator_id: str, limit: int = Query(50)):
    """الحصول على ريلز المبدع"""
    try:
        reels = reels_stories_manager.get_reels_by_creator(creator_id, limit)
        return {
            "success": True,
            "reels": [asdict(r) for r in reels]
        }
    except Exception as e:
        logger.error(f"❌ Error getting creator reels: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reels/category/{category}")
async def get_reels_by_category(category: ReelCategory, limit: int = Query(50)):
    """الحصول على الريلز حسب الفئة"""
    try:
        reels = reels_stories_manager.get_reels_by_category(category, limit)
        return {
            "success": True,
            "reels": [asdict(r) for r in reels]
        }
    except Exception as e:
        logger.error(f"❌ Error getting category reels: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reels/trending")
async def get_trending_reels(limit: int = Query(50)):
    """الحصول على الريلز الرائجة"""
    try:
        reels = reels_stories_manager.get_trending_reels(limit)
        return {
            "success": True,
            "reels": [asdict(r) for r in reels]
        }
    except Exception as e:
        logger.error(f"❌ Error getting trending reels: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reels/recommended/{user_id}")
async def get_recommended_reels(user_id: str, limit: int = Query(50)):
    """الحصول على الريلز الموصى بها"""
    try:
        reels = reels_stories_manager.get_recommended_reels(user_id, limit)
        return {
            "success": True,
            "reels": [asdict(r) for r in reels]
        }
    except Exception as e:
        logger.error(f"❌ Error getting recommended reels: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reels/saved/{user_id}")
async def get_saved_reels(user_id: str, limit: int = Query(50)):
    """الحصول على الريلز المحفوظة"""
    try:
        reels = reels_stories_manager.get_saved_reels(user_id, limit)
        return {
            "success": True,
            "reels": [asdict(r) for r in reels]
        }
    except Exception as e:
        logger.error(f"❌ Error getting saved reels: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/stories")
async def create_story(
    creator_id: str = Query(...),
    creator_name: str = Query(...),
    creator_avatar: str = Query("")
):
    """إنشاء قصة جديدة"""
    try:
        story = await reels_stories_manager.create_story(
            creator_id, creator_name, creator_avatar
        )
        return {
            "success": True,
            "story_id": story.id,
            "story": asdict(story)
        }
    except Exception as e:
        logger.error(f"❌ Error creating story: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/stories/{story_id}/elements")
async def add_story_element(
    story_id: str,
    element_type: StoryType = Query(...),
    content_url: str = Query(""),
    text: str = Query(""),
    duration: int = Query(5)
):
    """إضافة عنصر إلى القصة"""
    try:
        if await reels_stories_manager.add_story_element(
            story_id, element_type, content_url, text, duration
        ):
            return {"success": True, "message": "تم إضافة العنصر"}
        else:
            raise HTTPException(status_code=404, detail="القصة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error adding story element: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/stories/{story_id}/view")
async def view_story(story_id: str, user_id: str = Query(...)):
    """عرض قصة"""
    try:
        if await reels_stories_manager.view_story(user_id, story_id):
            return {"success": True, "message": "تم عرض القصة"}
        else:
            raise HTTPException(status_code=404, detail="القصة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error viewing story: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/stories/{story_id}/react")
async def react_to_story(
    story_id: str,
    user_id: str = Query(...),
    user_name: str = Query(...),
    reaction_type: str = Query(...)
):
    """التفاعل مع القصة"""
    try:
        if await reels_stories_manager.react_to_story(story_id, user_id, user_name, reaction_type):
            return {"success": True, "message": "تم التفاعل"}
        else:
            raise HTTPException(status_code=404, detail="القصة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error reacting to story: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/stories/{story_id}/reply")
async def reply_to_story(
    story_id: str,
    user_id: str = Query(...),
    user_name: str = Query(...),
    user_avatar: str = Query(""),
    content: str = Query(...)
):
    """الرد على القصة"""
    try:
        if await reels_stories_manager.reply_to_story(story_id, user_id, user_name, user_avatar, content):
            return {"success": True, "message": "تم الرد"}
        else:
            raise HTTPException(status_code=404, detail="القصة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error replying to story: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/stories/{story_id}/archive")
async def archive_story(story_id: str):
    """أرشفة قصة"""
    try:
        if await reels_stories_manager.archive_story(story_id):
            return {"success": True, "message": "تم أرشفة القصة"}
        else:
            raise HTTPException(status_code=404, detail="القصة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error archiving story: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/stories/{story_id}/highlight")
async def highlight_story(story_id: str, highlight_name: str = Query(...)):
    """إضاءة القصة"""
    try:
        if await reels_stories_manager.highlight_story(story_id, highlight_name):
            return {"success": True, "message": "تم إضاءة القصة"}
        else:
            raise HTTPException(status_code=404, detail="القصة غير موجودة")
    except Exception as e:
        logger.error(f"❌ Error highlighting story: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stories/user/{creator_id}")
async def get_user_stories(creator_id: str):
    """الحصول على قصص المستخدم"""
    try:
        stories = reels_stories_manager.get_user_stories(creator_id)
        return {
            "success": True,
            "stories": [asdict(s) for s in stories]
        }
    except Exception as e:
        logger.error(f"❌ Error getting user stories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stories/highlights/{creator_id}")
async def get_user_story_highlights(creator_id: str):
    """الحصول على إضاءات قصص المستخدم"""
    try:
        highlights = reels_stories_manager.get_user_story_highlights(creator_id)
        return {
            "success": True,
            "highlights": [asdict(h) for h in highlights]
        }
    except Exception as e:
        logger.error(f"❌ Error getting story highlights: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/watch-history/{user_id}")
async def get_watch_history(user_id: str, limit: int = Query(50)):
    """الحصول على سجل المشاهدة"""
    try:
        history = reels_stories_manager.get_watch_history(user_id, limit)
        return {
            "success": True,
            "history": [asdict(h) for h in history]
        }
    except Exception as e:
        logger.error(f"❌ Error getting watch history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8010)
