"""
خدمة ربط البث المباشر بالخلاصة (Feed)
يتعامل مع إنشاء وإدارة بطاقات البث المباشر في الخلاصة
وتحويل البثوث المنتهية إلى منشورات مسجلة
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
import logging

from app.models.post import Post
from app.models.live_session import LiveRoomSession
from app.models.user import User
from app.models.follow import Follow

logger = logging.getLogger(__name__)


def utcnow_naive() -> datetime:
    """الحصول على الوقت الحالي بصيغة naive"""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class LiveFeedService:
    """خدمة ربط البث المباشر بالخلاصة"""

    def __init__(self, db: Session):
        self.db = db

    async def create_live_post(
        self,
        user_id: int,
        stream_id: str,
        title: str,
        thumbnail_url: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Post:
        """
        إنشاء منشور بث مباشر جديد
        يظهر في الخلاصة عند بدء البث
        """
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError("المستخدم غير موجود")

            # إنشاء منشور البث المباشر
            live_post = Post(
                user_id=user_id,
                username=user.username,
                content=title or "بث مباشر جديد",
                post_type="LIVE",
                live_stream_id=stream_id,
                thumbnail_url=thumbnail_url,
                is_live=True,
                viewers_count=0,
                stream_started_at=utcnow_naive(),
                created_at=utcnow_naive(),
            )

            self.db.add(live_post)
            self.db.commit()
            self.db.refresh(live_post)

            logger.info(f"Created live post {live_post.id} for stream {stream_id}")
            return live_post

        except Exception as e:
            logger.error(f"Error creating live post: {e}")
            self.db.rollback()
            raise

    async def end_live_stream(
        self,
        stream_id: str,
        duration: Optional[str] = None,
    ) -> Post:
        """
        إنهاء البث المباشر وتحويل المنشور إلى بث مسجل
        """
        try:
            # البحث عن منشور البث المباشر
            live_post = self.db.query(Post).filter(
                and_(
                    Post.live_stream_id == stream_id,
                    Post.post_type == "LIVE",
                )
            ).first()

            if not live_post:
                raise ValueError(f"منشور البث {stream_id} غير موجود")

            # تحديث المنشور
            live_post.post_type = "RECORDED_STREAM"
            live_post.is_live = False
            live_post.stream_ended_at = utcnow_naive()
            live_post.stream_duration = duration

            self.db.commit()
            self.db.refresh(live_post)

            logger.info(f"Ended live stream {stream_id}, converted to recorded post {live_post.id}")
            return live_post

        except Exception as e:
            logger.error(f"Error ending live stream: {e}")
            self.db.rollback()
            raise

    async def update_stream_viewers(
        self,
        stream_id: str,
        viewer_count: int,
    ) -> Optional[Post]:
        """
        تحديث عدد المشاهدين للبث المباشر
        """
        try:
            live_post = self.db.query(Post).filter(
                and_(
                    Post.live_stream_id == stream_id,
                    Post.is_live == True,
                )
            ).first()

            if live_post:
                live_post.viewers_count = viewer_count
                self.db.commit()
                self.db.refresh(live_post)

            return live_post

        except Exception as e:
            logger.error(f"Error updating stream viewers: {e}")
            self.db.rollback()
            return None

    async def get_active_live_streams(
        self,
        current_user_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Post]:
        """
        الحصول على البثوث المباشرة النشطة مرتبة حسب:
        1. بثوث الأصدقاء
        2. بثوث المتابعين
        3. البثوث المقترحة
        """
        try:
            query = self.db.query(Post).filter(
                and_(
                    Post.post_type == "LIVE",
                    Post.is_live == True,
                )
            )

            if current_user_id:
                # الحصول على قائمة الأصدقاء والمتابعين
                friends_ids = self._get_friends_ids(current_user_id)
                following_ids = self._get_following_ids(current_user_id)

                # ترتيب البثوث
                friend_streams = query.filter(Post.user_id.in_(friends_ids)).all()
                following_streams = query.filter(
                    and_(
                        Post.user_id.in_(following_ids),
                        ~Post.user_id.in_(friends_ids),
                    )
                ).all()
                suggested_streams = query.filter(
                    ~Post.user_id.in_(friends_ids + following_ids)
                ).all()

                all_streams = friend_streams + following_streams + suggested_streams
                return all_streams[offset : offset + limit]
            else:
                # بدون تصفية، إرجاع أحدث البثوث
                return (
                    query.order_by(desc(Post.created_at))
                    .limit(limit)
                    .offset(offset)
                    .all()
                )

        except Exception as e:
            logger.error(f"Error getting active live streams: {e}")
            return []

    async def get_feed_content(
        self,
        current_user_id: int,
        content_type: Optional[str] = None,  # "posts", "stories", "live"
        limit: int = 20,
        offset: int = 0,
    ) -> List[Post]:
        """
        الحصول على محتوى الخلاصة مع تصفية حسب النوع
        """
        try:
            query = self.db.query(Post)

            # تصفية حسب النوع
            if content_type == "posts":
                query = query.filter(Post.post_type == "POST")
            elif content_type == "stories":
                query = query.filter(Post.post_type == "STORY")
            elif content_type == "live":
                query = query.filter(
                    and_(
                        Post.post_type == "LIVE",
                        Post.is_live == True,
                    )
                )

            # الحصول على قائمة الأصدقاء والمتابعين
            friends_ids = self._get_friends_ids(current_user_id)
            following_ids = self._get_following_ids(current_user_id)

            # ترتيب المحتوى
            friend_posts = query.filter(Post.user_id.in_(friends_ids)).order_by(
                desc(Post.created_at)
            ).all()
            following_posts = query.filter(
                and_(
                    Post.user_id.in_(following_ids),
                    ~Post.user_id.in_(friends_ids),
                )
            ).order_by(desc(Post.created_at)).all()
            suggested_posts = query.filter(
                ~Post.user_id.in_(friends_ids + following_ids)
            ).order_by(desc(Post.created_at)).all()

            all_posts = friend_posts + following_posts + suggested_posts
            return all_posts[offset : offset + limit]

        except Exception as e:
            logger.error(f"Error getting feed content: {e}")
            return []

    def _get_friends_ids(self, user_id: int) -> List[int]:
        """الحصول على قائمة معرفات الأصدقاء"""
        try:
            # البحث عن المتابعين والمتابع لهم (الأصدقاء المتبادلون)
            friends = self.db.query(Follow.following_id).filter(
                and_(
                    Follow.follower_id == user_id,
                    Follow.is_friend == True,
                )
            ).all()
            return [f[0] for f in friends]
        except Exception as e:
            logger.error(f"Error getting friends: {e}")
            return []

    def _get_following_ids(self, user_id: int) -> List[int]:
        """الحصول على قائمة معرفات المتابعين"""
        try:
            following = self.db.query(Follow.following_id).filter(
                Follow.follower_id == user_id
            ).all()
            return [f[0] for f in following]
        except Exception as e:
            logger.error(f"Error getting following: {e}")
            return []

    async def link_stream_to_post(
        self,
        stream_id: str,
        post_id: int,
    ) -> Optional[Post]:
        """
        ربط البث المباشر بمنشور موجود
        """
        try:
            post = self.db.query(Post).filter(Post.id == post_id).first()
            if not post:
                raise ValueError("المنشور غير موجود")

            post.live_stream_id = stream_id
            post.post_type = "LIVE"
            post.is_live = True

            self.db.commit()
            self.db.refresh(post)

            logger.info(f"Linked stream {stream_id} to post {post_id}")
            return post

        except Exception as e:
            logger.error(f"Error linking stream to post: {e}")
            self.db.rollback()
            return None

    async def get_live_stream_stats(
        self,
        stream_id: str,
    ) -> Optional[Dict[str, Any]]:
        """
        الحصول على إحصائيات البث المباشر
        """
        try:
            live_post = self.db.query(Post).filter(
                Post.live_stream_id == stream_id
            ).first()

            if not live_post:
                return None

            return {
                "stream_id": stream_id,
                "post_id": live_post.id,
                "viewers_count": live_post.viewers_count,
                "likes_count": live_post.share_count,  # استخدام share_count كـ likes_count مؤقتاً
                "created_at": live_post.created_at,
                "started_at": live_post.stream_started_at,
                "ended_at": live_post.stream_ended_at,
                "duration": live_post.stream_duration,
            }

        except Exception as e:
            logger.error(f"Error getting live stream stats: {e}")
            return None
