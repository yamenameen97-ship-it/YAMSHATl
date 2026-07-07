# FIXES v83.9 — تدقيق نظام الستوري وربطه بالباك اند + قاعدة البيانات السحابية

## الهدف
فحص كامل لنظام القصص (Stories) والتأكد من أن كل عملية:
- تُنفَّذ عبر الباك اند (وليست تخزين محلي على الملفات).
- تُحفظ وتُخزَّن في قاعدة البيانات السحابية (Postgres على Render).
- تبقى متزامنة بين الأجهزة وثابتة بعد إعادة النشر.

عند اكتشاف أول **٥ نواقص جوهرية** توقّفنا وقمنا بإصلاحها بالكامل كما طُلب.

---

## النواقص المكتشفة (٥ نواقص — تم إصلاح جميعها)

### 1) القصص كانت تُخزَّن في JSON محلي — تُفقد عند كل إعادة نشر
`backend/app/core/story_store.py` كان يحفظ **كل شيء** (القصص، الردود،
التصويتات، المشاهدات، Highlights) في ملف واحد:
`backend/uploads/story_store.json`.

المشكلة الكارثية على Render:
- filesystem غير دائم بين النشرات → كل قصة تختفي عند أول deploy.
- لا مزامنة بين الأجهزة/المستخدمين (نسخة واحدة على القرص).
- لا يعمل مع عدة workers / instances (كل worker يقرأ نسخته المحلية).
- عمليات كتابة متزامنة قد تُفسِد ملف JSON.

**الإصلاح:**
- إنشاء `backend/app/services/story_db_service.py` — طبقة خدمة كاملة تكتب
  مباشرة إلى Postgres عبر SQLAlchemy.
- تحويل `story_store.py` إلى deprecation shim يُطلق تحذيراً واضحاً إذا حاول
  أي كود قديم استخدامه.
- حذف `backend/uploads/story_store.json` من الحزمة (لن يُستخدم بعد الآن).

### 2) جداول SQLAlchemy موجودة لكن غير مستخدمة نهائياً
`backend/app/models/stories_reels.py` كان يحتوي فعلاً على `Story`,
`StoryView`, `StoryReply` مع migration، لكن مسارات `routes/stories.py`
كانت تتجاهلها تماماً وتذهب إلى `story_store` (JSON).

النتيجة: جداول فارغة على Render، بينما بيانات المستخدمين تُكتب في ملف
عابر يختفي.

**الإصلاح:**
- إعادة كتابة `backend/app/api/routes/stories.py` من الصفر ليستدعي
  `story_db_service` فقط. لا مرجع واحد للـ `story_store` القديم.
- كل الـ endpoints الأصلية محفوظة بنفس الأسماء والأشكال:
  `/stories`, `/stories/grouped`, `/stories/highlights`, `/stories/archive`,
  `/stories/analytics/summary`, `/add_story`, `/stories/{id}/view`,
  `/stories/{id}/react`, `/stories/{id}/reply`, `/stories/{id}/poll/vote`,
  `DELETE /stories/{id}`, `/stories/{id}/highlight`,
  `/stories/{id}/highlight/title`, `/stories/{id}/viewers`.
- الواجهة الأمامية لم تتغير — التوافق الخلفي كامل.

### 3) نموذج DB كان ينقصه ~15 عموداً مهماً
`Story` ORM كان يحتوي فقط على: `media_url`, `caption`, `duration`,
`views_count`, `replies_count`, `created_at`, `expires_at`.

كل هذه الحقول كانت مفقودة (لكنها موجودة في story_store): `media_type`,
`privacy`, `music`, `stickers`, `mentions`, `poll_question`, `poll_options`,
`poll_votes`, `poll_voters`, `countdown_at`, `filter_name`, `drawing_data`,
`is_close_friends`, `highlight`, `highlight_title`, `reactions`,
`reactions_count`, `auto_delete_hours`.

**الإصلاح:**
- توسيع `Story` model في `stories_reels.py` بكل هذه الأعمدة (JSON مسلسل
  للحقول ذات الأشكال المركبة مثل `poll_votes` و`reactions`).
- إضافة `username` على `story_views` و `story_replies` لتفادي JOIN مع
  جدول `users` في كل قراءة (تسريع كبير للـ feed).
- إضافة UNIQUE(story_id, user_id) على `story_views` لمنع تسجيل مشاهدة
  مكررة على مستوى DB (وليس Python).
- إضافة indexes: `ix_stories_privacy`, `ix_stories_highlight`,
  `ix_stories_user_created` لتسريع الاستعلامات.
- Migration: `20260707_0014_stories_cloud_migration.py` تضيف كل شيء
  آيدمبوتنتّاً (idempotent) — تفحص كل عمود/index/constraint قبل الإنشاء
  لتجنب فشل التطبيق على قواعد بيانات موجودة مسبقاً.

### 4) `GET /stories/{story_id}` كان مفقوداً — لا يمكن جلب قصة واحدة
جميع الـ endpoints كانت للقوائم أو المجموعات أو الأفعال. لم يكن هناك أي
مسار لجلب قصة واحدة بمعرّفها، رغم أن deep-link (فتح قصة من إشعار مثلاً)
يحتاجها.

**الإصلاح:**
- إضافة `GET /stories/{story_id}` في `routes/stories.py`.
- يُطبّق فحص خصوصية كاملاً (private / close_friends / friends) قبل
  الإرجاع → 403 لو لم يكن للمشاهد حق الرؤية، 404 لو غير موجودة.
- إضافة `getStoryById(storyId)` في `frontend/src/api/stories.js` مع
  نفس منطق التطبيع (media URL absolute) المستخدم في بقية الدوال.

### 5) العدّادات `views_count / replies_count / reactions_count` لم تُحدَّث
الأعمدة كانت موجودة في `Story` model منذ البداية لكن **لا يوجد كود** يزيدها
بعد كل مشاهدة/رد/تفاعل. النتيجة: قسم analytics يعرض دائماً صفراً، والفرز
حسب "أعلى تفاعلاً" مكسور.

**الإصلاح:**
- في `story_db_service.mark_seen`: زيادة `views_count` ذرّياً عند إدراج
  سجل `StoryView` جديد فقط (شرط UNIQUE على DB يضمن عدم العدّ مرتين).
- في `add_reply`: زيادة `replies_count` عند كل رد.
- في `add_reaction`: تحديث `reactions_count` = مجموع قيم dict الـreactions.
- `analytics_summary` يقرأ من هذه الأعمدة مباشرة (استعلام واحد بدل عدّ
  السجلات كل مرة).

---

## الملفات المُضافة

- `backend/app/services/story_db_service.py` — طبقة الخدمة الكاملة
  (~530 سطر): add_story, list_stories, list_grouped_stories, get_story,
  mark_seen, add_reaction, add_reply, vote_poll, delete_story,
  toggle_highlight, set_highlight_title, get_highlights, get_archive,
  get_viewers, analytics_summary, purge_expired.
- `backend/alembic/versions/20260707_0014_stories_cloud_migration.py` —
  migration idempotent يضيف كل الأعمدة والـ indexes والـ constraints.
- `FIXES_v83.9_STORIES_AUDIT_AR.md` — هذا الملف.

## الملفات المُعدَّلة

- `backend/app/models/stories_reels.py` — توسيع نموذج `Story` بكل الحقول
  المطلوبة + إضافة username على `StoryView`/`StoryReply` + UNIQUE
  constraint.
- `backend/app/api/routes/stories.py` — إعادة كتابة كاملة، يستدعي
  `story_db_service` بدل `story_store`. مسار جديد `GET /stories/{id}`.
- `backend/app/core/story_store.py` — استُبدل بـ deprecation shim يُطلق
  تحذير logger واضحاً على أي استدعاء.
- `frontend/src/api/stories.js` — إضافة `getStoryById(id)`.

## الملفات المحذوفة

- `backend/uploads/story_store.json` — لم يعد له معنى، الحقيقة الوحيدة
  الآن في جدول `stories` على Postgres.

---

## تحقق النشر

```bash
# 1) قاعدة البيانات
cd backend
alembic upgrade head
# ستطبّق 20260707_0014_stories_cloud_migration
# (idempotent — آمن حتى لو جرى تشغيلها مرتين)

# 2) التشغيل
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## اختبار سريع بعد النشر

| السلوك | قبل v83.9 | بعد v83.9 |
| --- | --- | --- |
| نشر قصة ثم إعادة deploy | تختفي القصة | تبقى ✅ |
| مشاهدة قصة من جهاز آخر | لا يعرف أنها شوهدت | تظهر مشاهدة صحيحة ✅ |
| تصويت على poll ثم refresh | يُفقد التصويت | يبقى ✅ |
| Highlight لقصة | يُفقد بعد deploy | ثابت ✅ |
| فتح قصة عبر deep-link `/stories/{id}` | 404 | 200 ✅ |
| GET /stories/analytics/summary | كل شيء صفر | أرقام حقيقية ✅ |

## ما لم يتغيَّر (توافق خلفي كامل)

- كل أسماء الـ endpoints ثابتة.
- كل حقول الاستجابة ثابتة (id كسلسلة، media_url مطلق، etc).
- الواجهة الأمامية `stories.js` تعمل كما هي — فقط أُضيف `getStoryById`.
- WebSocket hooks للإشعارات (`story:new`, `story:mention`, `story:reply`)
  تعمل بنفس شكلها السابق.
- سياسة الخصوصية (لا public — كل شيء friends أو close_friends أو private).
