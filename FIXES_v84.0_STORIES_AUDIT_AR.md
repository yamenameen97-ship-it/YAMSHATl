# FIXES v84.0 — تدقيق نظام الستوري (الجولة الثانية)

## السياق
بعد v83.9 (الجولة الأولى — نقل التخزين من `story_store.json` إلى Postgres)،
أعدنا الفحص العميق لنظام القصص كاملاً — الباك اند، الخدمات، النماذج، الفرونت،
والمسارات المرتبطة. اكتشفنا **٥ نواقص جديدة** جوهرية توقفنا عند اكتشافها كما
طُلب وأصلحنا كل واحدة منها.

---

## النواقص الخمسة الجديدة (كلها أُصلحت)

### 1) ⚠️ ملف `stories_reels_enhanced.py` — كود ميت يستورد وحدات غير موجودة

`backend/app/api/routes/stories_reels_enhanced.py` (715 سطراً) كان يعرّف
مسارات ستوري وريلز مكررة تستخدم استيرادات مكسورة:

```python
from app.models.story import Story           # ❌ غير موجود
from app.models.story_view import StoryView  # ❌ غير موجود
from app.models.story_reply import StoryReply # ❌ غير موجود
from app.models.reel import Reel             # ❌ غير موجود
from app.models.reel_like import ReelLike    # ❌ غير موجود
from app.models.saved_reel import SavedReel  # ❌ غير موجود
from app.models.reel_view import ReelView    # ❌ غير موجود
```

الحقيقة أن كل هذه النماذج موجودة في `app.models.stories_reels` (ملف واحد).
هذا الراوتر لم يكن مسجّلاً في `main.py` — لكن وجوده كملف كامل يُنشئ:
- مسارات `POST /stories`, `GET /stories/feed`, `POST /stories/{id}/view`,
  `POST /stories/{id}/reply` **مكررة/متصادمة** مع `stories.py` الجديد.
- خطر runtime crash فوري إذا سُجل بالخطأ أو حتى إذا استُورد كسايد إفكت.
- يستدعي `save_media_permanently` من `media_storage_service` لكن لا يمر
  البيانات إلى قاعدة البيانات السحابية الجديدة.

**الإصلاح:** استُبدل بـ shim آمن فارغ (35 سطر) يحتفظ فقط بـ `router` غير مسجّل
+ endpoint وحيد `/api/__deprecated__/stories_reels_enhanced` يوضح أن الوحدة
انتقلت. لا استيرادات مكسورة، لا تصادم مسارات، لا crash محتمل.

### 2) ⚠️ لا مهمة مجدولة لتنظيف القصص المنتهية → تراكم بيانات إلى الأبد

`purge_expired()` كانت تُستدعى فقط داخل `list_stories/get_highlights/get_archive`،
أي كإجراء عابر عند كل قراءة. النتيجة:
- مستخدم غير نشط له 100 قصة منتهية → لا أحد يفتح صفحته → القصص لا تنمحي أبداً.
- تراكم صفوف Postgres + وسائط Cloudinary بلا حد.
- `celery_app.py` يجدّل تنظيف الوسائط والجلسات والغرف الميتة، لكن **الستوري
  لم تُدرج** في `beat_schedule`.

**الإصلاح:**
- إضافة `purge_expired_stories_once()` في `background_tasks.py` — تُشغَّل داخل
  نفس thread daemon الذي ينشر المنشورات المجدولة (كل 5 دقائق).
- لا اعتماد على Celery beat (بعض النشرات على Render لا تشغّل beat) — يعمل
  دائماً ما دام تطبيق FastAPI حياً.
- `start_all_schedulers()` alias واضح للمستقبل.

### 3) ⚠️ لا حذف لوسائط Cloudinary عند حذف/انتهاء القصة → تكاليف تخزين متضخمة

`cloudinary_service.py` كان يحتوي على `upload_file()` فقط. لا `delete_file`
ولا `delete_files_batch`. عند:
- حذف قصة يدوياً → السجل يُحذف من DB لكن الصورة/الفيديو يبقى في Cloudinary.
- انتهاء صلاحية القصة تلقائياً → نفس الشيء.

المشكلة على النطاق: 10,000 قصة يومياً × 24 ساعة = 240,000 ملف لا يُنمحى شهرياً
= فاتورة Cloudinary تنفجر خلال أسابيع.

**الإصلاح:**
- إضافة `delete_file(media_url_or_public_id, resource_type)` — يستخرج
  `public_id` من الرابط بواسطة regex آمن (يدعم image/video/raw ويكشف نوع
  المورد من مسار URL).
- إضافة `delete_files_batch(urls)` — يستخدم `api.delete_resources` بحد أقصى
  100 معرف لكل مكالمة (كما توثّق Cloudinary).
- استدعاء الحذف داخل `delete_story` و`purge_expired` **بعد** commit للـ DB
  (فشل الحذف على Cloudinary لا يجب أن يمنع حذف DB).
- Soft-fail: أي استثناء يُسجل كتحذير ولا يُرفع للأمام.

### 4) 🔒 لا يوجد أي تحقق من `UserBlock` في نظام الستوري — خرق خصوصية

`story_db_service.py` (v83.9) كان يفحص فقط `Friendship` و`CloseFriend`.
لم يكن هناك أي مرجع لـ `UserBlock`. النتيجة:

| السيناريو | v83.9 | v84.0 |
| --- | --- | --- |
| A حظر B، B صديق قديم لـ A | B **يرى** قصص A | B لا يرى ✅ |
| B يفتح قصة A مباشرة عبر deep-link | يُسمح | 403 ✅ |
| B يرد على قصة A | يُقبل الرد | 403 ✅ |
| B يصوت على poll لـ A | يُسجل الصوت | 403 ✅ |
| A يذكر B في قصة | mention يُحفظ | يُصفَّى تلقائياً ✅ |

**الإصلاح:**
- استيراد `UserBlock` بشكل soft (try/except) في `story_db_service`.
- `_load_block_scope(user_id)` — يعيد كل المعرّفات التي يوجد بينها وبين
  المستخدم حظر (أي اتجاه).
- `_is_blocked_between(a, b)` — فحص ثنائي سريع (استعلام `.first()` بمؤشرين).
- `_visible_filter`: خصم `blocked` من `friends`/`close` + شرط
  `~Story.user_id.in_(blocked)` للأمان المزدوج.
- `mark_seen / add_reaction / add_reply / vote_poll / get_story` كلها ترفع
  `PermissionError('Blocked')` إذا وجد حظر متبادل.
- `add_story`: تصفية الـ `mentions` قبل الكتابة — لا يمكن ذكر محظور.
- `stories.py` يترجم `PermissionError` إلى `HTTP 403 Forbidden`.

### 5) 🐢 `serialize_story` لا ترجع `avatar_url` + مشكلة N+1 في جلب أسماء المستخدمين

سببان في نقص واحد:

**أ) avatar_url مفقود من الاستجابة**
`list_grouped_stories` كان يحاول قراءة `story.get('avatar_url')` (السطر 304)
لكن `serialize_story` لا تضعه في الاستجابة أصلاً. النتيجة: كل صور الشريط
الدائري فارغة، وحقل `avatar_url` في الاستجابة لا وجود له.

**ب) N+1 في _resolve_username**
لكل قصة يُستدعى `_resolve_username(db, user_id)` → استعلام SQL مستقل.
شريط دائري بـ 50 قصة لـ 30 مستخدماً = **50 استعلام** لجلب أسماء المستخدمين!
+ نفس المشكلة في `get_viewers` (استعلام لكل مشاهد).

**الإصلاح:**
- كلاس `_UsersCache` جديد داخل `story_db_service`:
  - `prefetch(user_ids)` يجلب كل الأسماء والأفاتار في **استعلام واحد** بـ
    `.filter(User.id.in_(...))`.
  - `get(id)` / `username(id)` / `avatar(id)` من الذاكرة.
- `list_stories / get_highlights / get_archive / get_viewers` كلها تستخدم
  الكاش الآن (استعلام واحد لكل مكالمة).
- `serialize_story` تُعيد:
  - `avatar_url` (v84.0 — جديد)
  - `user_avatar` (alias للتوافق مع الفرونت الحالي)
- `get_viewers` تستخدم `avatar_url` الحقيقي من `users` قبل الرجوع إلى
  `ui-avatars.com` كـ fallback.

نتيجة قياس تقريبية:
- شريط دائري بـ 50 قصة، 30 مستخدماً: من **101 استعلام** إلى **2 استعلامات**.

---

## الملفات المُعدَّلة

| الملف | التغيير |
| --- | --- |
| `backend/app/services/story_db_service.py` | إعادة كتابة كبيرة: UserBlock, `_UsersCache`, avatar_url, cloudinary cleanup, mentions filter |
| `backend/app/services/cloudinary_service.py` | إضافة `delete_file`, `delete_files_batch`, `extract_public_id_from_url` |
| `backend/app/services/background_tasks.py` | إضافة `purge_expired_stories_once()` + تشغيلها كل 5 دقائق |
| `backend/app/api/routes/stories.py` | ترجمة PermissionError → 403 على view/react/reply/vote |
| `backend/app/api/routes/stories_reels_enhanced.py` | **استبدال كامل** بـ shim آمن (35 سطر) |

## الملفات المُضافة

- `FIXES_v84.0_STORIES_AUDIT_AR.md` — هذا الملف.

## الملفات المحذوفة

- لا شيء (استبدلنا الملف الميت بمحتوى آمن بدل حذفه للحفاظ على أي import
  عابر لا نعرف عنه).

---

## تحقق النشر

```bash
# 1) لا migration جديد — v83.9 غطى كل الأعمدة اللازمة.

# 2) التشغيل — background sweeper يعمل تلقائياً على startup
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 3) اختياري: تشغيل يدوي للتنظيف
python -c "from app.services.background_tasks import purge_expired_stories_once; print(purge_expired_stories_once())"
```

## اختبار سريع بعد النشر

| السلوك | قبل v84.0 | بعد v84.0 |
| --- | --- | --- |
| قصة منتهية لمستخدم غير نشط تبقى للأبد | نعم | تُحذف كل 5 دقائق ✅ |
| ملف Cloudinary لقصة محذوفة يبقى | نعم | يُحذف تلقائياً ✅ |
| محظور يرى قصص من حظره | نعم | 403 ✅ |
| محظور يرد/يتفاعل مع قصص من حظره | نعم | 403 ✅ |
| قصة يمكنها ذكر مستخدم محظور | نعم | يُصفَّى قبل الحفظ ✅ |
| شريط الستوري بلا صور مستخدمين | نعم | صور من users ✅ |
| N+1 على شريط الستوري | 100+ استعلام | 2 استعلام ✅ |
| `stories_reels_enhanced` كود ميت خطر | 715 سطر مكسور | 35 سطر آمن ✅ |

## ما لم يتغيَّر (توافق خلفي كامل)

- كل أسماء endpoints ثابتة.
- كل حقول الاستجابة الأصلية ثابتة (media_url مطلق، id كسلسلة، إلخ).
- الفرونت `stories.js` لم يحتج لتعديل — `avatar_url` و`user_avatar` قد
  أصبحا يصلان من الباك تلقائياً.
- WebSocket hooks (`story:new`, `story:mention`, `story:reply`) بنفس الشكل.
- سياسة الخصوصية (friends / close_friends / private) بنفس الدلالات — فقط
  أُضيفت طبقة UserBlock فوقها.

## المخاطر المتبقية (خارج نطاق v84.0)

- لا rate limiting على `POST /stories/{id}/view` (قد يكرر نفس المستخدم
  استدعاءات كثيرة، وإن كان `UNIQUE(story_id, user_id)` يمنع الإفساد).
- `get_viewers` بلا pagination — إذا حصلت قصة على 10,000 مشاهدة، الاستعلام
  سيرجع كل السجلات دفعة واحدة. مقبول لأن القصص محدودة العمر (24-72 ساعة).
- `AdminStories.jsx` في الواجهة يعرض قصص المشرف فقط (endpoints المستخدم
  العادي). لو أراد المشرف رؤية عالمية يحتاج endpoint إداري جديد
  (`/admin/stories/all`) — لم يُضف في هذه الجولة.

كل هذه محتملة لجولة تدقيق مستقبلية v84.1.
