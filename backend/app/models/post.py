from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text

from app.db.base import Base


class Post(Base):
    __tablename__ = 'posts'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    username = Column(Text, nullable=True)
    content = Column(Text, nullable=False, default='')
    content_html = Column(Text, nullable=True)
    media = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    media_json = Column(Text, nullable=True)
    hashtags_json = Column(Text, nullable=True)
    mentions_json = Column(Text, nullable=True)
    poll_options_json = Column(Text, nullable=True)
    is_draft = Column(Boolean, default=False, nullable=False, index=True)
    is_pinned = Column(Boolean, default=False, nullable=False, index=True)
    allow_comments = Column(Boolean, default=True, nullable=False)
    scheduled_at = Column(DateTime, nullable=True, index=True)
    published_at = Column(DateTime, nullable=True, index=True)
    pinned_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_edited_at = Column(DateTime, nullable=True)
    edit_count = Column(Integer, default=0, nullable=False)
    share_count = Column(Integer, default=0, nullable=False)
    save_count = Column(Integer, default=0, nullable=False)
    # ✅ v88.99 — عدّاد إعادات النشر (منفصل عن المشاركة العادية)
    reposts_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # ==========================================================
    # ✅ v88.86 — دعم نظام المشاركة (Share) الموثق لدى Yamshat
    # ==========================================================
    # link_card: بيانات كارت الرابط الغني (JSON)
    #   { title, description, thumbnail, sourceName, sourceLogo, sourceUrl,
    #     platform, supportsBrowser, publishedAt, viewsCount, subscribersCount, duration }
    # يُعرض في الفيد ككارت مع زر "فتح المصدر" — في وضع 'link' فقط.
    link_card = Column(Text, nullable=True)

    # verified_by_yamshat: الطابع الرسمي "موثق لدى Yamshat"
    # يُفعَّل تلقائياً حين يختار المستخدم "تنزيل ومشاركة".
    verified_by_yamshat = Column(Boolean, default=False, nullable=False, index=True)

    # admin_source_* : بيانات المصدر الأصلية — لا تُعرض للمستخدمين،
    # يقرأها لوحة الأدمن فقط (audit/tracing للمحتوى المُشارك).
    admin_source_platform = Column(String(60), nullable=True, index=True)
    admin_source_platform_name = Column(String(120), nullable=True)
    admin_source_url = Column(Text, nullable=True)
    admin_source_title = Column(Text, nullable=True)
    admin_source_text = Column(Text, nullable=True)
    admin_source_author = Column(String(200), nullable=True)
    admin_source_channel = Column(String(200), nullable=True)
    admin_source_captured_at = Column(DateTime, nullable=True)
    admin_source_share_mode = Column(String(20), nullable=True)  # 'link' | 'download'
    admin_source_download_size = Column(Integer, nullable=True)
    admin_source_download_mime = Column(String(120), nullable=True)
