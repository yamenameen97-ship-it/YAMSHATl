"""
نظام البحث المتقدم المحسّن - Enhanced Search System
يوفر:
- نتائج بحث مباشرة وفورية (Live Search Results)
- اقتراحات ذكية (Smart Suggestions)
- سجل البحث الشخصي (Search History)
- البحث الضبابي (Fuzzy Search)
- ترتيب ذكي للنتائج (Smart Ranking)
- تصفية متقدمة (Advanced Filtering)
"""

from fastapi import APIRouter, Depends, Query, HTTPException, Body
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
import asyncio
from difflib import SequenceMatcher
from dataclasses import dataclass, asdict
from enum import Enum
import logging

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.post import Post
from app.models.group import Group

logger = logging.getLogger(__name__)
router = APIRouter()

# ============ تعريفات الأنواع ============

class SearchResultType(str, Enum):
    """أنواع نتائج البحث"""
    USER = "user"
    POST = "post"
    GROUP = "group"
    HASHTAG = "hashtag"
    LOCATION = "location"


class SearchCategory(str, Enum):
    """فئات البحث"""
    TOP = "top"
    ACCOUNTS = "accounts"
    POSTS = "posts"
    GROUPS = "groups"
    HASHTAGS = "hashtags"


@dataclass
class SearchResult:
    """نتيجة البحث"""
    id: str
    type: SearchResultType
    title: str
    description: str
    image: Optional[str] = None
    relevance_score: float = 0.0
    metadata: Dict = None
    timestamp: str = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat()


@dataclass
class SearchSuggestion:
    """اقتراح البحث"""
    id: str
    text: str
    type: str  # search, hashtag, user, location
    icon: str = "🔍"
    frequency: int = 0
    is_trending: bool = False
    timestamp: str = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat()


# ============ محرك البحث المتقدم ============

class AdvancedSearchEngine:
    """محرك البحث المتقدم"""

    def __init__(self):
        self.search_frequency = {}
        self.trending_searches = []

    def fuzzy_match(self, query: str, text: str, threshold: float = 0.6) -> float:
        """حساب درجة التطابق الضبابي"""
        query_lower = query.lower()
        text_lower = text.lower()

        # البحث المباشر
        if query_lower in text_lower:
            return 1.0

        # البحث الضبابي
        ratio = SequenceMatcher(None, query_lower, text_lower).ratio()
        return ratio if ratio >= threshold else 0.0

    def calculate_relevance_score(
        self,
        query: str,
        title: str,
        description: str,
        metadata: Dict = None,
        is_verified: bool = False,
        engagement_score: float = 0.0
    ) -> float:
        """حساب درجة الملاءمة الشاملة"""
        if metadata is None:
            metadata = {}

        # درجة التطابق في العنوان (أعلى أولوية)
        title_match = self.fuzzy_match(query, title, threshold=0.5)
        
        # درجة التطابق في الوصف
        desc_match = self.fuzzy_match(query, description, threshold=0.5)
        
        # الدرجة النهائية
        score = (title_match * 0.6) + (desc_match * 0.2)
        
        # إضافة نقاط للحسابات الموثقة
        if is_verified:
            score += 0.15
        
        # إضافة نقاط بناءً على التفاعل
        if engagement_score > 0:
            score += min(engagement_score / 100, 0.15)
        
        return min(score, 1.0)

    def update_trending(self, query: str):
        """تحديث قائمة البحث الشائع"""
        self.search_frequency[query] = self.search_frequency.get(query, 0) + 1
        
        # تحديث الـ trending
        self.trending_searches = sorted(
            self.search_frequency.items(),
            key=lambda x: x[1],
            reverse=True
        )[:20]


search_engine = AdvancedSearchEngine()


# ============ المسارات (Routes) ============

@router.get('/live')
async def live_search(
    q: str = Query(..., min_length=2, max_length=100),
    category: Optional[SearchCategory] = Query(None),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    البحث الحي مع النتائج الفورية
    - يوفر نتائج فورية أثناء الكتابة
    - ترتيب ذكي بناءً على الملاءمة
    - دعم التصفية حسب النوع
    """
    try:
        results = []
        
        # البحث في المستخدمين
        if not category or category == SearchCategory.ACCOUNTS:
            users = db.query(User).filter(
                or_(
                    User.username.ilike(f'%{q}%'),
                    User.full_name.ilike(f'%{q}%')
                )
            ).limit(limit).all()
            
            for user in users:
                score = search_engine.calculate_relevance_score(
                    q,
                    user.full_name or user.username,
                    user.bio or "",
                    is_verified=user.is_verified,
                    engagement_score=user.followers_count or 0
                )
                
                if score > 0:
                    results.append(SearchResult(
                        id=str(user.id),
                        type=SearchResultType.USER,
                        title=user.full_name or user.username,
                        description=f"@{user.username}",
                        image=user.avatar_url,
                        relevance_score=score,
                        metadata={
                            "is_verified": user.is_verified,
                            "followers": user.followers_count,
                            "following": user.following_count
                        }
                    ))
        
        # البحث في المنشورات
        if not category or category == SearchCategory.POSTS:
            posts = db.query(Post).filter(
                or_(
                    Post.content.ilike(f'%{q}%'),
                    Post.content_html.ilike(f'%{q}%')
                ),
                Post.is_deleted == False
            ).limit(limit).all()
            
            for post in posts:
                score = search_engine.calculate_relevance_score(
                    q,
                    post.content[:100] if post.content else "",
                    post.content_html or "",
                    engagement_score=post.likes_count or 0
                )
                
                if score > 0:
                    results.append(SearchResult(
                        id=str(post.id),
                        type=SearchResultType.POST,
                        title=post.content[:50] if post.content else "منشور",
                        description=post.content[:150] if post.content else "",
                        image=post.image_url,
                        relevance_score=score,
                        metadata={
                            "likes": post.likes_count,
                            "comments": post.comments_count,
                            "shares": post.shares_count,
                            "author": post.user.username if post.user else ""
                        }
                    ))
        
        # البحث في المجموعات
        if not category or category == SearchCategory.GROUPS:
            groups = db.query(Group).filter(
                or_(
                    Group.name.ilike(f'%{q}%'),
                    Group.description.ilike(f'%{q}%')
                )
            ).limit(limit).all()
            
            for group in groups:
                score = search_engine.calculate_relevance_score(
                    q,
                    group.name,
                    group.description or "",
                    engagement_score=group.members_count or 0
                )
                
                if score > 0:
                    results.append(SearchResult(
                        id=str(group.id),
                        type=SearchResultType.GROUP,
                        title=group.name,
                        description=group.description or "",
                        image=group.image_url,
                        relevance_score=score,
                        metadata={
                            "members": group.members_count,
                            "is_private": group.is_private
                        }
                    ))
        
        # ترتيب النتائج حسب الملاءمة
        results.sort(key=lambda x: x.relevance_score, reverse=True)
        
        # تحديث البحث الشائع
        search_engine.update_trending(q)
        
        # حفظ في السجل
        from app.models.search_history import SearchHistory
        search_history = SearchHistory(
            user_id=current_user.id,
            query=q,
            category=category or SearchCategory.TOP,
            results_count=len(results),
            timestamp=datetime.utcnow()
        )
        db.add(search_history)
        db.commit()
        
        return {
            "success": True,
            "query": q,
            "category": category,
            "results": [asdict(r) for r in results[:limit]],
            "total": len(results),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/suggestions')
async def get_suggestions(
    q: str = Query(..., min_length=1, max_length=50),
    limit: int = Query(10, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    الحصول على اقتراحات البحث الذكية
    - اقتراحات من البحث الشائع
    - اقتراحات من الهاشتاجات
    - اقتراحات من المستخدمين
    - اقتراحات من المواقع
    """
    try:
        suggestions = []
        
        # اقتراحات من البحث الشائع
        for search, freq in search_engine.trending_searches[:limit]:
            if q.lower() in search.lower():
                suggestions.append(SearchSuggestion(
                    id=f"trending_{search}",
                    text=search,
                    type="search",
                    icon="🔥",
                    frequency=freq,
                    is_trending=True
                ))
        
        # اقتراحات من المستخدمين
        users = db.query(User).filter(
            or_(
                User.username.ilike(f'{q}%'),
                User.full_name.ilike(f'{q}%')
            )
        ).limit(limit).all()
        
        for user in users:
            suggestions.append(SearchSuggestion(
                id=f"user_{user.id}",
                text=f"@{user.username}",
                type="user",
                icon="👤",
                frequency=user.followers_count or 0
            ))
        
        # اقتراحات من الهاشتاجات (إذا كانت موجودة في المنشورات)
        hashtag_results = db.query(
            func.substring_index(Post.content, '#', 1)
        ).filter(
            Post.content.ilike(f'%#{q}%'),
            Post.is_deleted == False
        ).distinct().limit(limit).all()
        
        for hashtag in hashtag_results:
            if hashtag[0]:
                suggestions.append(SearchSuggestion(
                    id=f"hashtag_{hashtag[0]}",
                    text=f"#{hashtag[0]}",
                    type="hashtag",
                    icon="#",
                    frequency=1
                ))
        
        return {
            "success": True,
            "query": q,
            "suggestions": [asdict(s) for s in suggestions[:limit]],
            "total": len(suggestions)
        }
    except Exception as e:
        logger.error(f"Suggestions error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/history')
async def get_search_history(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    الحصول على سجل البحث الشخصي
    - آخر عمليات بحث للمستخدم
    - مع معلومات عن كل بحث
    """
    try:
        from app.models.search_history import SearchHistory
        
        history = db.query(SearchHistory).filter(
            SearchHistory.user_id == current_user.id
        ).order_by(
            SearchHistory.timestamp.desc()
        ).limit(limit).all()
        
        return {
            "success": True,
            "history": [
                {
                    "query": h.query,
                    "category": h.category,
                    "results_count": h.results_count,
                    "timestamp": h.timestamp.isoformat() if h.timestamp else None
                }
                for h in history
            ],
            "total": len(history)
        }
    except Exception as e:
        logger.error(f"History error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/history/clear')
async def clear_search_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    مسح سجل البحث الشخصي
    """
    try:
        from app.models.search_history import SearchHistory
        
        db.query(SearchHistory).filter(
            SearchHistory.user_id == current_user.id
        ).delete()
        db.commit()
        
        return {
            "success": True,
            "message": "تم مسح سجل البحث بنجاح"
        }
    except Exception as e:
        logger.error(f"Clear history error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/history/{query}')
async def remove_search_from_history(
    query: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    حذف بحث معين من السجل
    """
    try:
        from app.models.search_history import SearchHistory
        
        db.query(SearchHistory).filter(
            and_(
                SearchHistory.user_id == current_user.id,
                SearchHistory.query == query
            )
        ).delete()
        db.commit()
        
        return {
            "success": True,
            "message": "تم حذف البحث من السجل"
        }
    except Exception as e:
        logger.error(f"Remove history error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/trending')
async def get_trending_searches(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    الحصول على البحث الشائع
    - أكثر عمليات البحث تكراراً
    - مع معدل النمو
    """
    try:
        trending = []
        for i, (search, freq) in enumerate(search_engine.trending_searches[:limit], 1):
            trending.append({
                "rank": i,
                "query": search,
                "frequency": freq,
                "icon": "🔥",
                "growth": "+10%"  # يمكن حسابها من قاعدة البيانات
            })
        
        return {
            "success": True,
            "trending": trending,
            "total": len(trending),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Trending error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
