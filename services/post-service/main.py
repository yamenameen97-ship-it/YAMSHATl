"""خدمة الريلز والقصص المحسّنة - Enhanced Reels & Stories Service
يوفر:
- إدارة الريلز والفيديوهات مع persistence
- نظام القصص مع الأرشيف والإضاءات
- التشغيل التلقائي والبث التكيفي
- اختيار الجودة والترجمات
- سجل المشاهدة والتوصيات
- حفظ وإعادة تمزيق الريلز
- تحليلات الريلز والمبدعين
"""

from fastapi import FastAPI, HTTPException, Query, Form
from fastapi.middleware.cors import CORSMiddleware
import json
import sqlite3
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from dataclasses import dataclass, asdict, field
from enum import Enum
import logging
import uuid
import os

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Yamshat Enhanced Reels & Stories Service",
    description="خدمة الريلز والقصص المحسّنة",
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

# ============ إعداد قاعدة البيانات ============

DB_PATH = os.getenv('DB_PATH', '/tmp/reels.db')

def init_db():
    """تهيئة قاعدة البيانات"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # جدول الريلز
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reels (
            id TEXT PRIMARY KEY,
            creator_id TEXT NOT NULL,
            creator_name TEXT,
            creator_avatar TEXT,
            title TEXT,
            description TEXT,
            video_url TEXT NOT NULL,
            thumbnail_url TEXT,
            category TEXT DEFAULT 'entertainment',
            tags TEXT,
            is_public BOOLEAN DEFAULT 1,
            is_monetized BOOLEAN DEFAULT 0,
            allow_remix BOOLEAN DEFAULT 1,
            allow_download BOOLEAN DEFAULT 0,
            allow_comments BOOLEAN DEFAULT 1,
            views_count INTEGER DEFAULT 0,
            likes_count INTEGER DEFAULT 0,
            comments_count INTEGER DEFAULT 0,
            shares_count INTEGER DEFAULT 0,
            saves_count INTEGER DEFAULT 0,
            remixes_count INTEGER DEFAULT 0,
            watch_time INTEGER DEFAULT 0,
            completion_rate REAL DEFAULT 0,
            engagement_rate REAL DEFAULT 0,
            average_watch_time INTEGER DEFAULT 0,
            duration INTEGER DEFAULT 0,
            width INTEGER DEFAULT 0,
            height INTEGER DEFAULT 0,
            fps INTEGER DEFAULT 30,
            bitrate INTEGER DEFAULT 0,
            format TEXT DEFAULT 'mp4',
            created_at TEXT,
            updated_at TEXT
        )
    ''')
    
    # جدول القصص
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stories (
            id TEXT PRIMARY KEY,
            creator_id TEXT NOT NULL,
            creator_name TEXT,
            creator_avatar TEXT,
            is_archived BOOLEAN DEFAULT 0,
            is_highlighted BOOLEAN DEFAULT 0,
            highlight_name TEXT,
            created_at TEXT,
            expires_at TEXT
        )
    ''')
    
    # جدول عناصر القصة
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS story_elements (
            id TEXT PRIMARY KEY,
            story_id TEXT NOT NULL,
            type TEXT,
            content_url TEXT,
            text TEXT,
            duration INTEGER DEFAULT 5,
            created_at TEXT,
            FOREIGN KEY(story_id) REFERENCES stories(id)
        )
    ''')
    
    # جدول سجل المشاهدة
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS watch_history (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            reel_id TEXT NOT NULL,
            watched_at TEXT,
            watch_duration INTEGER DEFAULT 0,
            FOREIGN KEY(reel_id) REFERENCES reels(id)
        )
    ''')
    
    # جدول الريلز المحفوظة
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS saved_reels (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            reel_id TEXT NOT NULL,
            saved_at TEXT,
            FOREIGN KEY(reel_id) REFERENCES reels(id)
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("✅ Database initialized")

# تهيئة قاعدة البيانات عند بدء التطبيق
init_db()

# ============ تعريفات الأنواع ============

class VideoQuality(str, Enum):
    """جودة الفيديو"""
    ULTRA_HD = "4k"
    FULL_HD = "1080p"
    HD = "720p"
    SD = "480p"
    LOW = "360p"


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
    category: str = "entertainment"
    tags: List[str] = field(default_factory=list)
    is_public: bool = True
    is_monetized: bool = False
    allow_remix: bool = True
    allow_download: bool = False
    allow_comments: bool = True
    
    # التحليلات
    views_count: int = 0
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    saves_count: int = 0
    remixes_count: int = 0
    watch_time: int = 0
    completion_rate: float = 0.0
    engagement_rate: float = 0.0
    average_watch_time: int = 0
    
    # بيانات الفيديو
    duration: int = 0
    width: int = 0
    height: int = 0
    fps: int = 30
    bitrate: int = 0
    format: str = "mp4"
    
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


# ============ مدير الريلز والقصص ============

class ReelsManager:
    """مدير الريلز والقصص"""

    def __init__(self):
        self.db_path = DB_PATH

    def get_connection(self):
        """الحصول على اتصال قاعدة البيانات"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    async def create_reel(
        self,
        creator_id: str,
        creator_name: str,
        creator_avatar: str,
        title: str,
        description: str,
        video_url: str,
        thumbnail_url: str,
        category: str = "entertainment",
        tags: List[str] = [],
        is_public: bool = True,
        allow_remix: bool = True,
        allow_download: bool = False,
        allow_comments: bool = True,
        duration: int = 0
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
            allow_comments=allow_comments,
            duration=duration
        )

        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO reels (
                id, creator_id, creator_name, creator_avatar, title, description,
                video_url, thumbnail_url, category, tags, is_public, allow_remix,
                allow_download, allow_comments, duration, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            reel.id, creator_id, creator_name, creator_avatar, title, description,
            video_url, thumbnail_url, category, json.dumps(tags), is_public, allow_remix,
            allow_download, allow_comments, duration, reel.created_at, reel.updated_at
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"✅ Reel created: {reel.id} (Title: {title})")
        return reel

    async def get_reel(self, reel_id: str) -> Optional[Reel]:
        """الحصول على ريل"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM reels WHERE id = ?', (reel_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
        
        return self._row_to_reel(row)

    async def get_reels(
        self,
        page: int = 1,
        limit: int = 10,
        category: str = "",
        sort_by: str = "recent"
    ) -> Dict:
        """الحصول على قائمة الريلز"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        query = "SELECT * FROM reels WHERE is_public = 1"
        params = []
        
        if category:
            query += " AND category = ?"
            params.append(category)
        
        # الترتيب
        if sort_by == "popular":
            query += " ORDER BY likes_count DESC"
        elif sort_by == "trending":
            query += " ORDER BY views_count DESC"
        else:  # recent
            query += " ORDER BY created_at DESC"
        
        # الترقيم
        offset = (page - 1) * limit
        query += " LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        # الحصول على العدد الكلي
        count_query = "SELECT COUNT(*) as count FROM reels WHERE is_public = 1"
        if category:
            count_query += " AND category = ?"
            cursor.execute(count_query, [category])
        else:
            cursor.execute(count_query)
        
        total = cursor.fetchone()['count']
        conn.close()
        
        reels = [self._row_to_reel(row) for row in rows]
        
        return {
            "reels": [asdict(r) for r in reels],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "has_more": (page * limit) < total
            }
        }

    async def update_reel_views(self, reel_id: str, watch_duration: int = 0) -> bool:
        """تحديث عدد المشاهدات"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE reels 
            SET views_count = views_count + 1,
                watch_time = watch_time + ?,
                updated_at = ?
            WHERE id = ?
        ''', (watch_duration, datetime.utcnow().isoformat(), reel_id))
        
        conn.commit()
        conn.close()
        
        logger.info(f"👁️ View recorded for reel {reel_id}")
        return True

    async def like_reel(self, reel_id: str) -> bool:
        """إعجاب بالريل"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE reels 
            SET likes_count = likes_count + 1,
                updated_at = ?
            WHERE id = ?
        ''', (datetime.utcnow().isoformat(), reel_id))
        
        conn.commit()
        conn.close()
        
        logger.info(f"👍 Like added to reel {reel_id}")
        return True

    async def save_reel(self, user_id: str, reel_id: str) -> bool:
        """حفظ ريل"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # التحقق من عدم وجود حفظ مسبق
        cursor.execute('SELECT id FROM saved_reels WHERE user_id = ? AND reel_id = ?', (user_id, reel_id))
        if cursor.fetchone():
            conn.close()
            return False
        
        # إضافة الحفظ
        save_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO saved_reels (id, user_id, reel_id, saved_at)
            VALUES (?, ?, ?, ?)
        ''', (save_id, user_id, reel_id, datetime.utcnow().isoformat()))
        
        # تحديث عدد الحفظات
        cursor.execute('''
            UPDATE reels 
            SET saves_count = saves_count + 1,
                updated_at = ?
            WHERE id = ?
        ''', (datetime.utcnow().isoformat(), reel_id))
        
        conn.commit()
        conn.close()
        
        logger.info(f"💾 Reel {reel_id} saved by {user_id}")
        return True

    async def unsave_reel(self, user_id: str, reel_id: str) -> bool:
        """إلغاء حفظ ريل"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM saved_reels WHERE user_id = ? AND reel_id = ?', (user_id, reel_id))
        
        # تحديث عدد الحفظات
        cursor.execute('''
            UPDATE reels 
            SET saves_count = MAX(0, saves_count - 1),
                updated_at = ?
            WHERE id = ?
        ''', (datetime.utcnow().isoformat(), reel_id))
        
        conn.commit()
        conn.close()
        
        logger.info(f"💾 Reel {reel_id} unsaved by {user_id}")
        return True

    async def get_saved_reels(self, user_id: str, page: int = 1, limit: int = 10) -> Dict:
        """الحصول على الريلز المحفوظة"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # الحصول على الريلز المحفوظة
        offset = (page - 1) * limit
        cursor.execute('''
            SELECT r.* FROM reels r
            INNER JOIN saved_reels sr ON r.id = sr.reel_id
            WHERE sr.user_id = ?
            ORDER BY sr.saved_at DESC
            LIMIT ? OFFSET ?
        ''', (user_id, limit, offset))
        
        rows = cursor.fetchall()
        
        # الحصول على العدد الكلي
        cursor.execute('''
            SELECT COUNT(*) as count FROM saved_reels WHERE user_id = ?
        ''', (user_id,))
        
        total = cursor.fetchone()['count']
        conn.close()
        
        reels = [self._row_to_reel(row) for row in rows]
        
        return {
            "reels": [asdict(r) for r in reels],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "has_more": (page * limit) < total
            }
        }

    async def record_watch(self, user_id: str, reel_id: str, watch_duration: int) -> bool:
        """تسجيل مشاهدة"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # إضافة سجل المشاهدة
        watch_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO watch_history (id, user_id, reel_id, watched_at, watch_duration)
            VALUES (?, ?, ?, ?, ?)
        ''', (watch_id, user_id, reel_id, datetime.utcnow().isoformat(), watch_duration))
        
        # تحديث إحصائيات الريل
        await self.update_reel_views(reel_id, watch_duration)
        
        conn.commit()
        conn.close()
        
        logger.info(f"👁️ Watch recorded for reel {reel_id} by {user_id}")
        return True

    def _row_to_reel(self, row) -> Reel:
        """تحويل صف من قاعدة البيانات إلى كائن Reel"""
        return Reel(
            id=row['id'],
            creator_id=row['creator_id'],
            creator_name=row['creator_name'],
            creator_avatar=row['creator_avatar'],
            title=row['title'],
            description=row['description'],
            video_url=row['video_url'],
            thumbnail_url=row['thumbnail_url'],
            category=row['category'],
            tags=json.loads(row['tags']) if row['tags'] else [],
            is_public=bool(row['is_public']),
            is_monetized=bool(row['is_monetized']),
            allow_remix=bool(row['allow_remix']),
            allow_download=bool(row['allow_download']),
            allow_comments=bool(row['allow_comments']),
            views_count=row['views_count'],
            likes_count=row['likes_count'],
            comments_count=row['comments_count'],
            shares_count=row['shares_count'],
            saves_count=row['saves_count'],
            remixes_count=row['remixes_count'],
            watch_time=row['watch_time'],
            completion_rate=row['completion_rate'],
            engagement_rate=row['engagement_rate'],
            average_watch_time=row['average_watch_time'],
            duration=row['duration'],
            width=row['width'],
            height=row['height'],
            fps=row['fps'],
            bitrate=row['bitrate'],
            format=row['format'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )


# إنشاء مدير الريلز
reels_manager = ReelsManager()


# ============ الـ Routes ============

@app.post('/reels/')
async def create_reel(
    creator_id: str = Form("user_1"),
    creator_name: str = Form("user"),
    creator_avatar: str = Form(""),
    title: str = Form(""),
    description: str = Form(""),
    video_url: str = Form(...),
    thumbnail_url: str = Form(""),
    category: str = Form("entertainment"),
    tags: str = Form("[]"),
    is_public: bool = Form(True),
    allow_remix: bool = Form(True),
    allow_download: bool = Form(False),
    allow_comments: bool = Form(True),
    duration: int = Form(0)
):
    """إنشاء ريل جديد"""
    try:
        tags_list = json.loads(tags) if isinstance(tags, str) else tags
        
        reel = await reels_manager.create_reel(
            creator_id=creator_id,
            creator_name=creator_name,
            creator_avatar=creator_avatar,
            title=title,
            description=description,
            video_url=video_url,
            thumbnail_url=thumbnail_url,
            category=category,
            tags=tags_list,
            is_public=is_public,
            allow_remix=allow_remix,
            allow_download=allow_download,
            allow_comments=allow_comments,
            duration=duration
        )
        
        return {
            "success": True,
            "reel": asdict(reel),
            "message": "تم رفع الريل بنجاح"
        }
    except Exception as error:
        logger.error(f"❌ Error creating reel: {error}")
        raise HTTPException(status_code=400, detail=str(error))


@app.get('/reels/')
async def get_reels(
    page: int = Query(1),
    limit: int = Query(10),
    category: str = Query(""),
    sort_by: str = Query("recent")
):
    """الحصول على قائمة الريلز"""
    try:
        result = await reels_manager.get_reels(
            page=page,
            limit=limit,
            category=category,
            sort_by=sort_by
        )
        return result
    except Exception as error:
        logger.error(f"❌ Error fetching reels: {error}")
        raise HTTPException(status_code=400, detail=str(error))


@app.get('/reels/{reel_id}')
async def get_reel(reel_id: str):
    """الحصول على ريل محدد"""
    reel = await reels_manager.get_reel(reel_id)
    if not reel:
        raise HTTPException(status_code=404, detail="الريل غير موجود")
    return asdict(reel)


@app.post('/reels/{reel_id}/like')
async def like_reel(reel_id: str):
    """إعجاب بالريل"""
    reel = await reels_manager.get_reel(reel_id)
    if not reel:
        raise HTTPException(status_code=404, detail="الريل غير موجود")
    
    await reels_manager.like_reel(reel_id)
    reel = await reels_manager.get_reel(reel_id)
    
    return {
        "success": True,
        "likes_count": reel.likes_count if reel else 0
    }


@app.post('/reels/{reel_id}/save')
async def save_reel(reel_id: str, user_id: str = Form("user_1")):
    """حفظ الريل"""
    reel = await reels_manager.get_reel(reel_id)
    if not reel:
        raise HTTPException(status_code=404, detail="الريل غير موجود")
    
    success = await reels_manager.save_reel(user_id, reel_id)
    reel = await reels_manager.get_reel(reel_id)
    
    return {
        "success": True,
        "is_saved": success,
        "saved_count": reel.saves_count if reel else 0
    }


@app.post('/reels/{reel_id}/unsave')
async def unsave_reel(reel_id: str, user_id: str = Form("user_1")):
    """إلغاء حفظ الريل"""
    reel = await reels_manager.get_reel(reel_id)
    if not reel:
        raise HTTPException(status_code=404, detail="الريل غير موجود")
    
    await reels_manager.unsave_reel(user_id, reel_id)
    reel = await reels_manager.get_reel(reel_id)
    
    return {
        "success": True,
        "is_saved": False,
        "saved_count": reel.saves_count if reel else 0
    }


@app.get('/reels/user/{user_id}/saved')
async def get_saved_reels(user_id: str, page: int = Query(1), limit: int = Query(10)):
    """الحصول على الريلز المحفوظة للمستخدم"""
    result = await reels_manager.get_saved_reels(user_id, page, limit)
    return result


@app.post('/reels/{reel_id}/watch')
async def record_watch(reel_id: str, user_id: str = Form("user_1"), watch_duration: int = Form(0)):
    """تسجيل مشاهدة"""
    reel = await reels_manager.get_reel(reel_id)
    if not reel:
        raise HTTPException(status_code=404, detail="الريل غير موجود")
    
    await reels_manager.record_watch(user_id, reel_id, watch_duration)
    
    return {
        "success": True,
        "message": "تم تسجيل المشاهدة"
    }


@app.get('/health')
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "reels-service",
        "version": "2.0.0",
        "database": DB_PATH
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
