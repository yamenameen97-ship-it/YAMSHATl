# FIXES v85.4 — تدقيق نظام الستوري (Stories) والبحث عن ٥ نواقص وإصلاحها

## الهدف
فحص شامل لنظام القصص (Stories) عبر كامل المسار: **الباك اند → قاعدة البيانات → الواجهة الأمامية → المهام المجدولة**، مع البحث عن أول **٥ نواقص جوهرية** وإصلاحها بالكامل قبل التوقف.

---

## النواقص المكتشفة (٥ نواقص — تم إصلاح جميعها ✅)

### 1) الأفاتار الحقيقي للمستخدمين لا يظهر في الشريط الدائري ولا في العارض
**الملفات المتأثرة:** `frontend/src/components/stories/StoriesBar.jsx` + `frontend/src/components/stories/StoryViewerEnhanced.jsx`

**الوصف:**
- الباك اند في `story_db_service.py::serialize_story` يُرجع **`avatar_url`** و **`user_avatar`** لكل قصة/مجموعة.
- الفرونت اند في StoriesBar (سطر ~389) و StoryViewerEnhanced (سطر ~380) كان يستخدم دائماً:
  ```jsx
  src={`https://ui-avatars.com/api/?name=${username}&background=random`}
  ```
- **النتيجة:** كل الأفاتار في نظام الستوري كانت مجرد أحرف على خلفية عشوائية. صور المستخدمين الحقيقية (المرفوعة بجدية إلى Cloudinary) لا تظهر في الشريط الأهم في التطبيق.

**الإصلاح:**
- استخدام `group.user_avatar || group.avatar_url` أولاً.
- `onError` handler يعيد التوجيه إلى ui-avatars فقط إذا فشل تحميل الأفاتار الحقيقي.
- نفس المعالجة في هيدر عارض الستوري (`StoryViewerEnhanced.jsx`).

---

### 2) `POST /stories/purge_expired` (admin) موثّق لكنه غير مُطبَّق نهائياً
**الملف المتأثر:** `backend/app/api/routes/stories.py`

**الوصف:**
- docstring الملف يذكر صراحةً: `POST /stories/purge_expired (admin) — تشغيل يدوي للتنظيف.`
- الواقع: **لا يوجد `@router.post('/stories/purge_expired')` في الكود!**
- أي مدير يحاول تشغيل التنظيف يدوياً بعد اكتشاف بيانات قديمة سيحصل على `404 Not Found`.

**الإصلاح:**
- إضافة endpoint فعلي مع فحص صلاحيات صارم (`role in {admin, superadmin, moderator}`).
- يستدعي `story_svc.purge_expired(db)` مباشرة (متزامن، يعود بالنتيجة الفورية).
- يعيد `{ok: true, deleted: N}` مع عدد القصص المحذوفة.

---

### 3) لا يوجد إشعار عند التفاعل مع قصة (react + poll vote)
**الملف المتأثر:** `backend/app/api/routes/stories.py`

**الوصف:**
- عند `POST /stories/{id}/reply` → يُرسل `_emit_notification('story:reply', ...)`.
- عند إنشاء قصة → يُرسل `story:new` و `story:mention` لكل mention.
- **لكن** عند `POST /stories/{id}/react` (تفاعل بإيموجي) → **لا يوجد إشعار على الإطلاق!**
- **النتيجة:** صاحب القصة لا يعلم بأي تفاعل عاطفي (❤️🔥😂). كل تفاعلات المتابعين تضيع صامتة.
- نفس المشكلة في `poll/vote`.

**الإصلاح:**
- إضافة `_emit_notification('story:reaction', {owner_id, from_user_id, from_username, emoji})` بعد `add_reaction`.
- إضافة `_emit_notification('story:poll_vote', {...})` بعد `vote_poll` (bonus).
- التحقق من `owner_id != current_user.id` لتفادي إشعارات ذاتية.

---

### 4) تنظيف القصص المنتهية غير مسجل في Celery beat_schedule
**الملفات المتأثرة:** `backend/app/celery_app.py` + `backend/app/services/background_tasks.py`

**الوصف:**
- `background_tasks._scheduler_loop()` يعتمد على **thread داخلي** في كل worker.
- على Render/gunicorn يعمل عادة بـ **N workers** = N threads تحاول تنظيف نفس الجدول بالتوازي → race conditions ممكنة.
- **`beat_schedule` في celery_app.py لا يحتوي على مهمة تنظيف القصص إطلاقاً**، رغم أنه المكان الأصحّ لمثل هذه المهام.

**الإصلاح:**
- إضافة `app.services.background_tasks` إلى `include` في Celery.
- تسجيل decorator `@celery_app.task(name='...purge_expired_stories_task')` يستدعي `purge_expired_stories_once()`.
- إضافة entry في `beat_schedule` بجدول `crontab(minute='*/5')` (كل 5 دقائق).
- Thread الداخلي يبقى كـ fallback إذا لم يعمل celery beat.

---

### 5) لا يوجد endpoint لجلب قصص مستخدم محدد (`GET /stories/user/{user_id}`)
**الملف المتأثر:** `backend/app/api/routes/stories.py` + `backend/app/services/story_db_service.py`

**الوصف:**
- كل endpoints الموجودة: `/stories`, `/stories/grouped`, `/stories/highlights`, `/stories/archive`, `/stories/{id}` (قصة واحدة).
- **لا يوجد أي مسار لجلب "قصص مستخدم كاملة بمعرّفه".**
- **النتيجة:**
  - لا يمكن فتح قصص شخص من صفحته التعريفية (`/profile/@username`) دون تحميل كل الشريط وفلترته يدوياً.
  - deep-linking من إشعار (مثلاً: "أحمد نشر قصة") صعب أو مستحيل بشكل نظيف.
  - لا يمكن بناء "معرض قصص" لصفحة الحساب.

**الإصلاح:**
- إضافة دالة `list_user_stories(db, target_user_id, viewer_user_id, viewer_username)` في `story_db_service.py`.
- تحترم:
  - **الخصوصية** (friends → أصدقاء فقط | close_friends → مقربون فقط | private → للمالك فقط).
  - **الحظر المتبادل** (`_is_blocked_between`).
  - **قصص الشخص نفسه** (يرى كل شيء).
- endpoint جديد: `GET /stories/user/{user_id}` يعيد بنية **group** متوافقة كلياً مع `StoryViewerEnhanced` (يمكن تمريرها كما هي).

---

## ملخص الملفات المعدَّلة

| # | الملف | التعديل |
|---|-------|---------|
| 1 | `backend/app/api/routes/stories.py` | +3 endpoints (`/stories/purge_expired`, `/stories/user/{id}`) + إشعار react + إشعار poll_vote + تحديث docstring |
| 2 | `backend/app/services/story_db_service.py` | +`list_user_stories()` (~75 سطر) مع فحص خصوصية وحظر |
| 3 | `backend/app/celery_app.py` | +تسجيل background_tasks + entry في beat_schedule |
| 4 | `backend/app/services/background_tasks.py` | +`purge_expired_stories_task` Celery task |
| 5 | `frontend/src/components/stories/StoriesBar.jsx` | استخدام `user_avatar/avatar_url` الحقيقية + fallback |
| 6 | `frontend/src/components/stories/StoryViewerEnhanced.jsx` | استخدام أفاتار المالك الحقيقي في هيدر العارض |

---

## التوافق الخلفي
- ✅ لا تغيير في أي endpoint موجود (فقط إضافات).
- ✅ لا تعديل في schemas أو DB models (لا حاجة لـ migration جديد).
- ✅ لا تغيير في أسماء الحقول التي تعتمد عليها الواجهة.
- ✅ الأفاتار fallback يبقى `ui-avatars.com` تلقائياً عند فشل تحميل الرابط الحقيقي.
- ✅ celery beat schedule يبقى اختيارياً — thread الداخلي يعمل بشكل مستقل كخط دفاع ثانٍ.

## الاختبار
- Python: كل الملفات المعدّلة تجتاز `python3 -m py_compile` بدون أخطاء.
- JSX: توازن الأقواس والحواصر مؤكد في ملفات الفرونت.
- Endpoints جديدة مخترعة بنفس نمط الموجود (Depends + HTTPException).
