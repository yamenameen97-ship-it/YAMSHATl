# دليل تكامل خدمة البث المباشر

## نظرة عامة

تم تطوير خدمة بث مباشر متكاملة بالكامل مع قاعدة البيانات في مشروع Yamshat. الخدمة توفر:

- ✅ إنشاء وإدارة جلسات البث المباشر
- ✅ إدارة المشاهدين والإحصائيات
- ✅ نظام التعليقات المتقدم مع الاعتدال
- ✅ نظام الهدايا والعملات المتكامل
- ✅ إدارة الصلاحيات والاعتدال
- ✅ تسجيل البث والتحليلات

## الجداول الجديدة المضافة

### 1. جداول البث الأساسية

#### `live_stream_sessions` - جلسات البث المباشر
```sql
- stream_id (STRING, PRIMARY KEY): معرف البث الفريد
- host_id (INTEGER, FK): معرف المضيف
- title (STRING): عنوان البث
- description (TEXT): وصف البث
- category (STRING): فئة البث
- status (STRING): حالة البث (pending, active, paused, ended)
- quality (STRING): جودة البث (720p, 1080p, إلخ)
- started_at (DATETIME): وقت بدء البث
- ended_at (DATETIME): وقت انتهاء البث
- duration_seconds (INTEGER): مدة البث بالثواني
- total_viewers (INTEGER): إجمالي المشاهدين
- peak_viewers (INTEGER): أقصى عدد مشاهدين
- unique_viewers (INTEGER): عدد المشاهدين الفريدين
- total_hearts (INTEGER): إجمالي الأقلب
- total_gifts (INTEGER): إجمالي الهدايا
- total_comments (INTEGER): إجمالي التعليقات
- total_coins_earned (FLOAT): إجمالي العملات المكتسبة
- health_score (INTEGER): درجة صحة البث (0-100)
- is_public (BOOLEAN): هل البث عام
- allow_comments (BOOLEAN): السماح بالتعليقات
- allow_gifts (BOOLEAN): السماح بالهدايا
- allow_recording (BOOLEAN): السماح بالتسجيل
- is_recording (BOOLEAN): هل البث قيد التسجيل
```

#### `live_stream_viewers` - المشاهدون
```sql
- id (INTEGER, PRIMARY KEY)
- stream_id (STRING, FK): معرف البث
- user_id (INTEGER, FK): معرف المستخدم
- username (STRING): اسم المستخدم
- user_avatar (STRING): صورة المستخدم
- joined_at (DATETIME): وقت الانضمام
- left_at (DATETIME): وقت المغادرة
- watch_duration_seconds (INTEGER): مدة المشاهدة
- is_active (BOOLEAN): هل المشاهد نشط
- is_banned (BOOLEAN): هل المشاهد محظور
- is_muted (BOOLEAN): هل المشاهد مكتوم
- hearts_sent (INTEGER): عدد الأقلب المرسلة
- gifts_sent (INTEGER): عدد الهدايا المرسلة
- comments_count (INTEGER): عدد التعليقات
```

#### `live_stream_host_settings` - إعدادات المضيف
```sql
- id (INTEGER, PRIMARY KEY)
- host_id (INTEGER, FK): معرف المضيف
- stream_id (STRING, FK): معرف البث
- auto_moderate (BOOLEAN): الاعتدال التلقائي
- filter_banned_words (BOOLEAN): تصفية الكلمات المحظورة
- require_comment_approval (BOOLEAN): الموافقة على التعليقات
- moderators_list (TEXT): قائمة المشرفين (JSON)
- allow_moderators_to_ban (BOOLEAN): السماح للمشرفين بالحظر
- allow_moderators_to_mute (BOOLEAN): السماح للمشرفين بكتم الصوت
- minimum_gift_amount (INTEGER): الحد الأدنى للهدايا
- gift_goal (INTEGER): هدف الهدايا
- chat_speed_limit (INTEGER): حد السرعة للرسائل
- allow_links_in_chat (BOOLEAN): السماح بالروابط في الدردشة
```

#### `live_stream_camera_states` - حالة الكاميرا
```sql
- id (INTEGER, PRIMARY KEY)
- stream_id (STRING): معرف البث
- host_id (INTEGER, FK): معرف المضيف
- camera_enabled (BOOLEAN): هل الكاميرا مفعلة
- microphone_enabled (BOOLEAN): هل الميكروفون مفعل
- screen_share_enabled (BOOLEAN): هل مشاركة الشاشة مفعلة
- device_id (STRING): معرف الجهاز
- camera_name (STRING): اسم الكاميرا
- microphone_name (STRING): اسم الميكروفون
- video_resolution (STRING): دقة الفيديو
- video_fps (INTEGER): إطارات الفيديو
- audio_bitrate (INTEGER): معدل البت الصوتي
- video_bitrate (INTEGER): معدل البت للفيديو
- is_recording (BOOLEAN): هل قيد التسجيل
- last_frame_timestamp (DATETIME): آخر وقت إطار
```

### 2. جداول التعليقات والاعتدال

#### `live_room_comments` - التعليقات
```sql
- id (INTEGER, PRIMARY KEY)
- room_id (STRING): معرف الغرفة/البث
- user_id (INTEGER, FK): معرف المستخدم
- content (TEXT): محتوى التعليق
- is_pinned (BOOLEAN): هل التعليق مثبت
- is_deleted (BOOLEAN): هل التعليق محذوف
- is_moderated (BOOLEAN): هل تم الاعتدال عليه
- moderation_score (INTEGER): درجة الاعتدال (0-100)
- created_at (DATETIME): وقت الإنشاء
- updated_at (DATETIME): وقت التحديث
```

#### `live_room_muted_users` - المستخدمون المكتومون
```sql
- id (INTEGER, PRIMARY KEY)
- room_id (STRING): معرف الغرفة
- user_id (INTEGER, FK): معرف المستخدم
- moderator_id (INTEGER, FK): معرف المشرف
- reason (TEXT): سبب كتم الصوت
- duration_minutes (INTEGER): مدة كتم الصوت (NULL = دائم)
- muted_at (DATETIME): وقت كتم الصوت
- unmuted_at (DATETIME): وقت إلغاء كتم الصوت
```

#### `live_room_banned_users` - المستخدمون المحظورون
```sql
- id (INTEGER, PRIMARY KEY)
- room_id (STRING): معرف الغرفة
- user_id (INTEGER, FK): معرف المستخدم
- host_id (INTEGER, FK): معرف المضيف
- reason (TEXT): سبب الحظر
- duration_days (INTEGER): مدة الحظر (NULL = دائم)
- banned_at (DATETIME): وقت الحظر
- unbanned_at (DATETIME): وقت إلغاء الحظر
```

#### `live_room_moderators` - المشرفون
```sql
- id (INTEGER, PRIMARY KEY)
- room_id (STRING): معرف الغرفة
- user_id (INTEGER, FK): معرف المشرف
- host_id (INTEGER, FK): معرف المضيف
- can_mute (BOOLEAN): يمكنه كتم الصوت
- can_kick (BOOLEAN): يمكنه الطرد
- can_ban (BOOLEAN): يمكنه الحظر
- can_delete_comments (BOOLEAN): يمكنه حذف التعليقات
- can_pin_comments (BOOLEAN): يمكنه تثبيت التعليقات
```

### 3. جداول الهدايا والعملات

#### `gifts` - الهدايا المتاحة
```sql
- id (INTEGER, PRIMARY KEY)
- name (STRING): اسم الهدية
- emoji (STRING): رمز الهدية
- description (TEXT): وصف الهدية
- price (INTEGER): سعر الهدية بالعملات
- image_url (STRING): صورة الهدية
- is_active (BOOLEAN): هل الهدية مفعلة
- created_at (DATETIME): وقت الإنشاء
```

#### `user_coins` - رصيد العملات
```sql
- id (INTEGER, PRIMARY KEY)
- user_id (INTEGER, FK, UNIQUE): معرف المستخدم
- balance (INTEGER): الرصيد الحالي
- total_earned (INTEGER): إجمالي الأرباح
- total_spent (INTEGER): إجمالي الإنفاق
- created_at (DATETIME): وقت الإنشاء
- updated_at (DATETIME): وقت التحديث
```

#### `gift_transactions` - معاملات الهدايا
```sql
- id (INTEGER, PRIMARY KEY)
- sender_id (INTEGER, FK): معرف المرسل
- receiver_id (INTEGER, FK): معرف المستقبل
- gift_id (INTEGER, FK): معرف الهدية
- live_room_id (STRING): معرف غرفة البث
- amount (INTEGER): عدد الهدايا
- total_coins (INTEGER): إجمالي العملات
- message (TEXT): رسالة مع الهدية
- created_at (DATETIME): وقت الإنشاء
```

#### `live_stream_recordings` - تسجيلات البث
```sql
- id (INTEGER, PRIMARY KEY)
- host_id (INTEGER, FK): معرف المضيف
- room_id (STRING): معرف الغرفة
- title (STRING): عنوان التسجيل
- description (TEXT): وصف التسجيل
- video_url (STRING): رابط الفيديو
- thumbnail_url (STRING): رابط الصورة المصغرة
- duration (INTEGER): مدة الفيديو بالثواني
- view_count (INTEGER): عدد المشاهدات
- like_count (INTEGER): عدد الإعجابات
- is_public (BOOLEAN): هل التسجيل عام
- created_at (DATETIME): وقت الإنشاء
- updated_at (DATETIME): وقت التحديث
```

## الخدمة الرئيسية: `LiveStreamService`

### الموقع
```
backend/app/services/live_stream_service.py
```

### الدوال الرئيسية

#### إنشاء وإدارة البث
```python
# إنشاء بث جديد
stream = service.create_stream(
    host_id=user_id,
    title="عنوان البث",
    description="وصف البث",
    category="فئة",
    is_public=True
)

# بدء البث
stream = service.start_stream(stream_id, host_id)

# إيقاف البث
stream = service.end_stream(stream_id, host_id)

# إيقاف مؤقت
stream = service.pause_stream(stream_id, host_id)

# استئناف
stream = service.resume_stream(stream_id, host_id)
```

#### إدارة المشاهدين
```python
# إضافة مشاهد
viewer = service.add_viewer(
    stream_id=stream_id,
    user_id=user_id,
    username=username,
    user_avatar=avatar_url,
    platform="web",
    device_type="browser"
)

# إزالة مشاهد
success = service.remove_viewer(stream_id, user_id)

# الحصول على المشاهدين النشطين
viewers = service.get_active_viewers(stream_id, limit=100)
```

#### إدارة التعليقات
```python
# إضافة تعليق
comment = service.add_comment(stream_id, user_id, "محتوى التعليق")

# الحصول على التعليقات
comments = service.get_comments(stream_id, limit=50)

# حذف تعليق
success = service.delete_comment(comment_id, host_id)
```

#### إدارة الهدايا
```python
# إرسال هدية
transaction = service.send_gift(
    stream_id=stream_id,
    sender_id=user_id,
    gift_id=gift_id,
    amount=1
)

# الحصول على الهدايا المتاحة
gifts = service.get_available_gifts()
```

#### الإحصائيات
```python
# الحصول على إحصائيات البث
stats = service.get_stream_stats(stream_id)

# إرسال قلب
result = service.send_heart(stream_id, user_id)
```

#### الاعتدال
```python
# كتم صوت المستخدم
muted = service.mute_user(
    stream_id=stream_id,
    user_id=user_id,
    moderator_id=moderator_id,
    reason="سبب كتم الصوت",
    duration_minutes=30
)

# حظر المستخدم
banned = service.ban_user(
    stream_id=stream_id,
    user_id=user_id,
    host_id=host_id,
    reason="سبب الحظر",
    duration_days=7
)
```

## مسارات API الجديدة

### الموقع
```
backend/app/api/routes/live_stream_complete.py
```

### المسارات المتاحة

#### إنشاء وإدارة البث
```
POST   /api/v1/live/streams                    - إنشاء بث جديد
POST   /api/v1/live/streams/{stream_id}/start  - بدء البث
POST   /api/v1/live/streams/{stream_id}/end    - إنهاء البث
POST   /api/v1/live/streams/{stream_id}/pause  - إيقاف مؤقت
POST   /api/v1/live/streams/{stream_id}/resume - استئناف
```

#### استرجاع البيانات
```
GET    /api/v1/live/streams/{stream_id}       - الحصول على بث
GET    /api/v1/live/streams/active             - البثوث النشطة
GET    /api/v1/live/user/streams               - بثوث المستخدم
```

#### إدارة المشاهدين
```
POST   /api/v1/live/streams/{stream_id}/viewers/join    - الانضمام
POST   /api/v1/live/streams/{stream_id}/viewers/leave   - المغادرة
GET    /api/v1/live/streams/{stream_id}/viewers         - قائمة المشاهدين
```

#### التعليقات
```
POST   /api/v1/live/streams/{stream_id}/comments        - إضافة تعليق
GET    /api/v1/live/streams/{stream_id}/comments        - الحصول على التعليقات
DELETE /api/v1/live/comments/{comment_id}               - حذف تعليق
```

#### الهدايا
```
GET    /api/v1/live/gifts                               - الهدايا المتاحة
POST   /api/v1/live/streams/{stream_id}/gifts           - إرسال هدية
```

#### الإحصائيات
```
GET    /api/v1/live/streams/{stream_id}/stats           - إحصائيات البث
POST   /api/v1/live/streams/{stream_id}/hearts          - إرسال قلب
```

#### الاعتدال
```
POST   /api/v1/live/streams/{stream_id}/moderation/mute/{user_id}  - كتم الصوت
POST   /api/v1/live/streams/{stream_id}/moderation/ban/{user_id}   - الحظر
```

## التكامل مع التطبيق

### 1. تسجيل الموديلات
تم تسجيل جميع الموديلات الجديدة في:
```python
# backend/app/models/__init__.py
from app.models.live_viewers import LiveStreamViewer, LiveStreamSession, ...
from app.models.live_moderation import LiveRoomComment, LiveRoomMutedUser, ...
from app.models.gift import Gift, UserCoins, GiftTransaction, ...
```

### 2. تسجيل المسارات
تم تسجيل المسارات الجديدة في:
```python
# backend/app/main.py
from app.api.routes import live_stream_complete
fastapi_app.include_router(live_stream_complete.router, tags=['live_stream'])
```

### 3. تحديث Bootstrap
تم إضافة جميع الجداول الجديدة إلى قائمة الجداول المطلوبة:
```python
# backend/app/db/bootstrap.py
REQUIRED_TABLES = {
    'live_stream_sessions',
    'live_stream_viewers',
    'live_stream_host_settings',
    'live_stream_camera_states',
    'live_room_comments',
    'live_room_muted_users',
    'live_room_banned_users',
    'live_room_moderators',
    'gifts',
    'user_coins',
    'gift_transactions',
    'live_stream_recordings',
    ...
}
```

## الاستخدام

### مثال: إنشاء بث مباشر

```python
from app.db.session import SessionLocal
from app.services.live_stream_service import LiveStreamService

db = SessionLocal()
service = LiveStreamService(db)

# إنشاء بث
stream = service.create_stream(
    host_id=1,
    title="بث مباشر جديد",
    description="وصف البث",
    category="ترفيه",
    is_public=True
)

# بدء البث
stream = service.start_stream(stream.stream_id, 1)

# إضافة مشاهد
viewer = service.add_viewer(
    stream_id=stream.stream_id,
    user_id=2,
    username="مشاهد",
    user_avatar="https://example.com/avatar.jpg"
)

# إضافة تعليق
comment = service.add_comment(
    stream_id=stream.stream_id,
    user_id=2,
    content="تعليق رائع!"
)

# إرسال هدية
transaction = service.send_gift(
    stream_id=stream.stream_id,
    sender_id=2,
    gift_id=1,
    amount=1
)

# الحصول على الإحصائيات
stats = service.get_stream_stats(stream.stream_id)

# إنهاء البث
stream = service.end_stream(stream.stream_id, 1)

db.close()
```

## الميزات المتقدمة

### 1. نظام الاعتدال المتقدم
- كتم صوت المستخدمين مؤقتاً أو دائماً
- حظر المستخدمين من البث
- حذف التعليقات غير المناسبة
- تصنيف درجة الاعتدال للتعليقات

### 2. نظام الهدايا والعملات
- إدارة العملات الافتراضية
- تتبع الأرباح والإنفاق
- معاملات آمنة للهدايا
- توزيع الأرباح للمضيف

### 3. الإحصائيات والتحليلات
- تتبع عدد المشاهدين والذروة
- حساب مدة المشاهدة لكل مستخدم
- تتبع الأقلب والهدايا والتعليقات
- درجة صحة البث

### 4. إدارة الأداء
- تتبع معدل البت والإطارات
- قياس زمن التأخير
- تسجيل البث

## الخطوات التالية

1. **تفعيل الخدمة**: تأكد من تشغيل التطبيق وإنشاء الجداول
2. **اختبار API**: استخدم Swagger UI على `/docs`
3. **ربط الواجهة الأمامية**: دمج المسارات مع تطبيق الويب/الموبايل
4. **إضافة WebSocket**: للتحديثات الفورية للتعليقات والهدايا
5. **تحسين الأداء**: إضافة Redis للتخزين المؤقت

## استكشاف الأخطاء

### الجداول غير موجودة
تأكد من تشغيل `initialize_database` عند بدء التطبيق:
```python
from app.db.bootstrap import initialize_database
from app.db.session import engine

initialize_database(engine, force=False)
```

### خطأ في الصلاحيات
تأكد من أن المستخدم الحالي لديه الصلاحيات المناسبة:
```python
# فقط مضيف البث يمكنه إنهاء البث
if stream.host_id != current_user.id:
    raise ValueError("ليس لديك صلاحية")
```

### مشاكل الأداء
استخدم الفهارس المتاحة:
```sql
CREATE INDEX ix_live_stream_sessions_host_id ON live_stream_sessions(host_id);
CREATE INDEX ix_live_stream_viewers_stream_id ON live_stream_viewers(stream_id);
CREATE INDEX ix_live_room_comments_room_id ON live_room_comments(room_id);
```

## الدعم والمساعدة

للمزيد من المعلومات، راجع:
- [توثيق SQLAlchemy](https://docs.sqlalchemy.org/)
- [توثيق FastAPI](https://fastapi.tiangolo.com/)
- [توثيق PostgreSQL](https://www.postgresql.org/docs/)
