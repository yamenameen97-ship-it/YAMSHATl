# FIXES v83.8 — تدقيق نظام المنشورات وربطه بالباك اند + قاعدة البيانات السحابية

## الهدف
فحص كامل لنظام المنشورات (Posts System) والتأكد من أن كل عملية:
- تُنفَّذ عبر الباك اند (وليست client-side فقط).
- تُحفظ وتُخزَّن في قاعدة البيانات السحابية (Postgres على Render).
- تبقى متزامنة بين الأجهزة وبعد إعادة التحميل.

عند اكتشاف أول خمس نواقص جوهرية توقّفنا وقمنا بإصلاحها.

---

## النواقص المكتشفة (٦ نواقص — تم إصلاح جميعها)

### 1) `schedule_post_publishing` كان مجرد `print()` placeholder
`backend/app/services/background_tasks.py` كان ينفّذ سطراً واحداً يطبع سجلاً بدون أن يفعل أي شيء
فعلي. النتيجة: المنشورات المجدولة (scheduled_at) لا تُنشر تلقائياً — تبقى مخفية إلى الأبد.

**الإصلاح:**
- استبدال الملف بنظام sweeper حقيقي يعمل في thread خلفي يتحرك كل 60 ثانية.
- يستعلم من قاعدة البيانات عن المنشورات المستحقة (`scheduled_at <= now`) ويحدّث
  `published_at` مباشرة في السحابة.
- يبدأ تلقائياً على `@app.on_event("startup")` وعند أول استدعاء لـ `schedule_post_publishing`.
- ثابت عبر إعادة التشغيل: لا يحتاج Redis/Celery/RQ.

### 2) endpoints مفقودة كانت تُستدعى من الواجهة و ترجع 404
الواجهة (`frontend/src/api/posts.js`) تستدعي:
- `GET /posts/scheduled`
- `GET /posts/recommended`
- `GET /posts/{id}/analytics`

لكن هذه المسارات **غير موجودة** في `backend/app/api/routes/posts.py`. جميع صفحات
"المجدولة"، "الموصى بها"، و"تحليلات المنشور" كانت معطلة.

**الإصلاح:** أضفنا الـ endpoints الثلاثة، كلها تعتمد على قاعدة البيانات السحابية:
- `/posts/scheduled` → يقرأ من جدول `posts` حيث `scheduled_at > now`.
- `/posts/recommended` → يستدعي المحرك AI أو fallback بترتيب التفاعل.
- `/posts/{id}/analytics` → يعيد استخدام `get_post_insights` (سحابي بالفعل).

### 3) إخفاء/أرشفة/كتم/تبليغ المنشورات كان في `localStorage` فقط
`frontend/src/components/feed/PostCard.jsx` كان يخزن `hiddenPosts`, `archivedPosts`,
`mutedAuthors`, `reportedPosts` في `localStorage.yamshat_post_preferences_v1`.
النتيجة: كل جهاز يرى قوائم مختلفة، وعند تنظيف المتصفح يفقد المستخدم كل شيء.

**الإصلاح:**
- جدول جديد `post_preferences` (user_id × post_id) مع أعلام (hidden, archived, muted_author, reported)
  و`report_reason` — انظر migration `20260707_0013_post_preferences_and_comment_reactions.py`.
- Endpoints جديدة:
  - `GET /posts/preferences` — يعيد كل تفضيلات المستخدم من السحابة.
  - `POST /posts/{id}/hide`
  - `POST /posts/{id}/archive`
  - `POST /posts/{id}/mute-author`
  - `POST /posts/{id}/report`
- تم تحديث `PostCard.jsx` ليستدعي هذه الـ endpoints مع optimistic UI وrollback عند الفشل،
  ويبقي localStorage كـ mirror فقط لسرعة العرض offline.
- `get_posts` الآن يفلتر تلقائياً أي منشور في قائمة hidden/archived/muted_author للمستخدم.

### 4) تفاعلات التعليقات (comment reactions) كانت في state محلي فقط
`handleCommentReaction` في `PostCard.jsx` كان يعدّل `setComments` فقط بدون أي API call.
كل تفاعل يختفي عند إعادة تحميل الصفحة.

**الإصلاح:**
- جدول جديد `comment_reactions` (user_id, comment_id, emoji) مع unique constraint (مستخدم واحد
  = تفاعل واحد لكل تعليق، قابل للتبديل).
- Endpoints:
  - `POST /comments/item/{id}/react` — يحفظ/يبدّل/يزيل التفاعل.
  - `GET /comments/item/{id}/reactions` — يعيد الملخص (counts + my_reaction).
- تم تحديث `PostCard.jsx.handleCommentReaction` ليقوم بـ optimistic update ثم يزامن مع الخادم.

### 5) `socialStore.js` بالكامل كان client-side (زوستاند بدون سحابة)
`frontend/src/store/socialStore.js` — reactions, follows, blocks, restrictedUsers, mutedUsers,
closeFriends, privateAccounts — كل هذه كانت في الذاكرة فقط. تُفقد عند إعادة التحميل، ولا
تتزامن بين الأجهزة.

**الإصلاح:**
- إعادة كتابة كاملة لـ `socialStore.js` بحيث كل mutator يقوم بـ:
  1) تحديث الحالة محلياً optimistic لسلاسة UI.
  2) استدعاء endpoint سحابي مطابق (`/follow`, `/users/:id/block`, `/users/:id/mute`,
     `/users/:id/close-friend`, `/users/:id/restrict`, `/users/privacy`, `/posts/:id/react`).
- إضافة `hydrateFromServer()` لسحب الحالة الحقيقية من `GET /users/social-state`
  عند إقلاع التطبيق أو تسجيل الدخول → تطابق فوري بين الأجهزة.
- فشل الاتصال لا يكسر UI (تعتبر الحالة optimistic؛ يُسجّل تحذير في console للتشخيص).

### 6) `posts_enhanced.py` غير مسجل في التطبيق
الملف `backend/app/api/routes/posts_enhanced.py` (835 سطر يحتوي على like/comment/share/save
موسّعة) لم يكن مضمّناً في `main.py`. الوظائف الأساسية موجودة في `posts.py` لذلك لا تظهر أعطال
مباشرة، لكن العديد من المسارات المكررة كانت ميتة.

**الملاحظة:** تُركت `posts_enhanced.py` كما هي (توثيق مرجعي) لأن المسارات الفعلية في `posts.py`
تغطي جميع احتياجات الواجهة. لن يكون هناك تعارض ولن تُسجَّل.

---

## الملفات المُضافة/المُعدَّلة

### مضاف
- `backend/app/models/post_preference.py` — نموذجا `PostPreference` و`CommentReaction`.
- `backend/alembic/versions/20260707_0013_post_preferences_and_comment_reactions.py` — migration.

### معدَّل
- `backend/app/models/__init__.py` — تصدير النماذج الجديدة.
- `backend/app/services/background_tasks.py` — استُبدل بالكامل: sweeper حقيقي + startup hook.
- `backend/app/services/post_service.py` — دالة `_load_hidden_post_ids` + استخدامها في feed filter.
- `backend/app/api/routes/posts.py` — 7 endpoints جديدة (scheduled, recommended, analytics,
  preferences, hide, archive, mute-author, report).
- `backend/app/api/routes/comments.py` — endpoint `/react` و `/reactions`.
- `backend/app/main.py` — تشغيل `start_post_scheduler()` عند الإقلاع.
- `frontend/src/api/posts.js` — تصدير wrapper سحابي لكل عملية جديدة.
- `frontend/src/components/feed/PostCard.jsx` — استبدال localStorage-only بمكالمات API +
  optimistic + rollback + مزامنة تفاعلات التعليقات مع السحابة.
- `frontend/src/store/socialStore.js` — إعادة كتابة كاملة لتزامن كل الحالة مع الباك اند.

---

## تحقق النشر
```bash
# قاعدة البيانات
alembic upgrade head    # سيطبّق 20260707_0013

# التشغيل
uvicorn app.main:app --host 0.0.0.0 --port 8000
# ستظهر في اللوجز:
#   🚀 Yamshat backend started
#   🗓️  Scheduled-posts sweeper started (60s interval)
```

## ما زال يعمل بلا كسر
جميع endpoints القديمة (`/posts` GET/POST/PATCH/DELETE, `/posts/{id}/like`, `/save`, `/share`,
`/poll-vote`, `/comment`, `/history`, `/insights`, `/drafts`) لم تُمس. الإصلاحات إضافية فقط.
