# YAMSHAT — Changelog v59.13.27

## إصلاحات أبلغ عنها المستخدم (ويب الجوال)

تاريخ الإصدار: 2026-06-26

تم إصلاح ثلاث مشاكل حرجة في ويب الجوال (متصفح الموبايل) — بدون تعديل
على مجلد `node_modules`، وبدون ملفات اعتمادات إضافية تحتاج تثبيت.

---

### 🟥 المشكلة 1 — الستوري يظهر مكسوراً عند العرض

**الوصف من المستخدم:**
> "عند رفع الستور يظهر للمشترك مكسور ويعرض تحت هيدر الشات العلوي
> بأيقونة وهو مكسور. مثلاً أرفع صورة ستوري ما تظهر عند العرض ولا تظهر
> بالأيقونة."

**الجذر:**
- باك إند `backend/app/api/routes/upload.py::_finalize_upload_payload`
  يعيد `media_url` كمسار نسبي مثل `/uploads/abc123.jpg` بدون origin
  مطلق.
- الفرونت إند `StoryViewerEnhanced.jsx` كان يستخدم `current.media_url`
  مباشرة في `<img src>` و `<video src>`، فيحاول المتصفح تحميل الملف من
  نطاق الفرونت إند (مثلاً `https://yamshat-front.onrender.com/uploads/...`)
  بدلاً من نطاق الباك إند، فيرجع 404 → "تعذّر تحميل الوسائط".
- نفس الشيء في الـthumbnail المعروض في شريط الستوريات تحت هيدر الشات
  (عبر أفاتار المجموعة).

**الإصلاح:**
1. `frontend/src/api/stories.js`:
   - أضفت `normalizeStoryObject` و `normalizeStoryGroup` يطبقان
     `resolveMediaUrl()` على كل من `media_url` / `media` / `thumbnail_url`
     / `preview_url` / `user_avatar`.
   - تطبيق التطبيع تلقائياً داخل `getStories`, `getStoriesGrouped`,
     `getStoryHighlights`, `getStoryArchive`, و `uploadStory`.
   - `downloadStoryMedia` أيضاً يطبق `resolveMediaUrl` قبل `fetch`.

2. `frontend/src/components/stories/StoryViewerEnhanced.jsx`:
   - أضفت **safety-net** على مستوى المكوّن: يطبّق `resolveMediaUrl` مرة
     ثانية على `media_url` للقصة الحالية داخل `useMemo`، احتياطاً في
     حالة وصول قصة من مصدر آخر لم يمر عبر `api/stories.js` (مثل
     optimistic update أو cache قديم).

**النتيجة:**
- صورة/فيديو الستوري يظهر بشكل صحيح فور رفعه + يظهر بثقاب الأيقونة في
  شريط الستوريات تحت هيدر الشات.
- لا مزيد من رسالة "تعذّر تحميل الوسائط" بعد الرفع.

---

### 🟥 المشكلة 2 — أيقونة شريط الستوريات تحت هيدر الشات مكسورة

**الوصف من المستخدم:**
> "ولا تظهر بالأيقونة" — أي حتى الـthumbnail الدائري للستوري في الشريط
> العلوي تحت هيدر الشات يظهر مكسوراً.

**الجذر:**
نفس جذر المشكلة 1 — `user_avatar` و `media_url` في `getStoriesGrouped`
كانا مسارات نسبية.

**الإصلاح:**
نفس الإصلاحات في `api/stories.js` تحلّ هذه المشكلة تلقائياً لأن
`normalizeStoryGroup` يطبق `resolveMediaUrl` على `user_avatar` للمجموعة
وعلى كل قصة بداخلها.

---

### 🟥 المشكلة 3 — زر "منشور جديد" يفتح صفحة الريلز (خطأ كارثي)

**الوصف من المستخدم:**
> "عند الضغط على زر منشور جديد الموجود بالهيدر السفلي... ما يفتح بوست
> كتابة المنشور بل يفتح صفحة رفع الريلز وهذا خطأ كارثي."

**الجذر:**
- `BottomNav.jsx::resolveCreateAction` على الصفحة الرئيسية يرجع
  `target: '/compose?tab=post'` — صحيح.
- لكن في `App.jsx`، مسار `/compose` كان يفتح `ReelComposer` دائماً —
  بصرف النظر عن قيمة `?tab=`.
- `ReelComposer.jsx` هو واجهة كاميرا/ريلز كاملة، وحتى لو `activeTab===post`
  داخلياً، فالـrender لا يتفرّع لواجهة كتابة منشور نصي.

**الإصلاح:**
1. ملف جديد `frontend/src/pages/PostComposerPage.jsx`:
   - صفحة كاملة (header + main) تغلّف مكوّن `PostComposer` المعتمد
     (المستخدم في `FeedEnhanced`).
   - RTL + Noto Sans Arabic + زر رجوع.

2. ملف جديد `frontend/src/pages/ComposerRouter.jsx`:
   - موجّه ذكي: يقرأ `?tab=` من `useLocation().search` ويُرجع:
     - `tab=post` (أو pathname يبدأ بـ`/post`) → `PostComposerPage`
     - أي tab آخر (`reel|story|photo|live|templates`) → `ReelComposer`

3. تعديل `frontend/src/App.jsx`:
   - استيراد `ComposerRouter` بشكل lazy.
   - تحويل المسارات التالية لاستخدام `ComposerRouter` بدلاً من
     `ReelComposer` المباشر:
     - `/compose`
     - `/post/compose`
     - `/post/new`
   - المسارات `/reels/compose` و `/reels/new` تبقى تذهب مباشرة إلى
     `ReelComposer` (لا حاجة للتوجيه).

**النتيجة:**
- الضغط على زر (+) "منشور جديد" من الـBottomNav في الصفحة الرئيسية
  يفتح **بوست كتابة المنشور النصي** (PostComposer).
- زر "ريلز جديد" من صفحة `/reels` يبقى يفتح كاميرا الريلز كما هو.
- زر "ستوري جديد" من صفحة `/stories` يبقى يفتح ReelComposer مع tab=story.

---

## الملفات المعدلة / المُنشأة

| الملف | النوع |
|------|-------|
| `frontend/src/api/stories.js` | **معدّل** — إضافة normalize + resolveMediaUrl |
| `frontend/src/components/stories/StoryViewerEnhanced.jsx` | **معدّل** — safety-net للـ media_url |
| `frontend/src/pages/PostComposerPage.jsx` | **جديد** — صفحة بوست كتابة منشور |
| `frontend/src/pages/ComposerRouter.jsx` | **جديد** — موجّه ذكي حسب tab |
| `frontend/src/App.jsx` | **معدّل** — استخدام ComposerRouter للمسارات الثلاثة |

## التحقق

- ✅ كل الملفات تمر بـ Babel parser (jsx + ts) بدون أي أخطاء syntax.
- ✅ كل الأقواس متوازنة.
- ✅ لا تغييرات على `package.json` أو `node_modules`.
- ✅ لا تعديل على الـbackend (الإصلاح في الفرونت إند فقط).
- ✅ الإصلاح يعمل على ويب الجوال **و** ويب اللابتوب (لأنه على مستوى
  مشترك بين الاثنين).
