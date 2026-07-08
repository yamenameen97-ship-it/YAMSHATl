# إصلاحات v85.5 — منشور جديد / ستوري / ريلز

## المشاكل المُبلَّغ عنها

1. **منشور جديد**: عند فتح صفحة "إنشاء منشور" لا يستجيب للمس ولا يسمح بالسحب لأسفل للوصول للصورة المرفوعة ومعاينتها.
2. **ستوري**: عند رفع ستوري جديد لا يمكن السحب للأعلى/الأسفل للوصول لزر "النشر".
3. **ريلز**:
   - رفعت ريلز لكنه لا يشتغل ولا يظهر (كما في الصورة الثالثة).
   - عند التعليق على ريلز والرجوع، يختفي التعليق ولا يُحفظ.

---

## الإصلاحات المُطبَّقة

### 1) `frontend/src/pages/PostComposerPage.jsx` — تمكين السحب في صفحة المنشور

**المشكلة الجذرية**: الحاوية الرئيسية كانت تعتمد على `min-height: 100dvh` فقط بدون `overflow-y: auto` صريح، وبدون `touch-action`. على الموبايل، عندما يمتد المحتوى (خانة النص + شريط الأدوات + معاينة الوسائط + زر النشر) فوق ارتفاع الشاشة، لم يكن Safari/Chrome يعرفان أن الصفحة قابلة للتمرير لأن العنصر الأب مرن الارتفاع.

**الحل**:
```css
.ympc-page {
  min-height: 100dvh;
  height: auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;  /* سلاسة على iOS */
  overscroll-behavior-y: contain;      /* منع pull-to-refresh التطفلي */
  touch-action: pan-y;                 /* السماح بالتمرير العمودي فقط */
  padding-bottom: calc(120px + env(safe-area-inset-bottom, 0px));
}
```

### 2) `frontend/src/components/stories/StoryEditor.jsx` — الوصول لزر النشر في الستوري

**المشكلة الجذرية**: كان الحاوية `.yam-story-editor` تستخدم `height: 100% + overflow: hidden`، ثم كل قسم داخلي (Stage/Tools/Filters/Meta) يأخذ حصته من الارتفاع. عند تفعيل الاستطلاع أو إضافة كابشن، ينمو المحتوى ويقتطع من الأسفل (زر النشر عند الرأس يبقى مرئي، لكن أزرار "المقربون/الأصدقاء" وحقل الوصف قد تختفي وسط شاشة أطول من الحاوية).

**الحل**:
- `.yam-story-editor` أصبح `overflow-y: auto` مع `touch-action: pan-y` و `-webkit-overflow-scrolling: touch`.
- الهيدر (`.yam-editor-header`) الذي يحمل زر "نشر" أصبح `position: sticky; top: 0` — لن يختفي أبدًا أثناء التمرير، مع `backdrop-filter: blur` لخلفية شفافة أنيقة.
- `.yam-editor-stage` (منطقة معاينة الصورة/الفيديو) لم تعد تأخذ `flex: 1` مطلقاً على الموبايل، بل `min-height: 45vh; max-height: 60vh` — يترك مساحة كافية للأدوات والفلاتر والحقول أسفلها.
- `.yam-editor-meta` أخذت `padding-bottom` يحترم `env(safe-area-inset-bottom)` (الحواف الآمنة على iPhone).

### 3) `frontend/src/pages/Reels.jsx` — تشغيل الفيديو تلقائيًا

**المشكلة الجذرية**: عنصر `<video>` كان يفتقر إلى:
- `autoPlay`: على الموبايل، بدون هذه السمة قد لا يبدأ الفيديو حتى بعد استدعاء `play()` برمجياً.
- `preload`: بدونها Chrome/Safari لا يحمّل بيانات الفيديو قبل تفعيل التشغيل.
- `webkit-playsinline` / `x5-playsinline`: مطلوبان لدعم متصفحات iOS القديمة و QQ/WeChat.
- `defaultMuted`: React أحياناً لا يطبّق `muted={true}` قبل أول محاولة `play()`، فيرفضها المتصفح.

**الحل**:
```jsx
<video
  autoPlay={i === activeIndex}
  preload={i === activeIndex ? 'auto' : 'metadata'}
  playsInline
  webkit-playsinline="true"
  x5-playsinline="true"
  muted={muted}
  defaultMuted
  onLoadedMetadata={/* بدء التشغيل عند الجهوزية */}
  onCanPlay={/* محاولة ثانية عند canplay */}
  onError={/* تسجيل الخطأ */}
/>
```
وفي الـ `useEffect` الخاص بالتشغيل: أضفنا استماع لحدث `canplay` كخطة بديلة عندما يفشل `play()` الأولي (سبب: الفيديو لم يحمّل metadata بعد).

### 4) `frontend/src/api/reels.js` (جديد) + تحديث `Reels.jsx` — تعليقات الريلز لا تُحفظ

**المشكلة الجذرية**: كانت صفحة `Reels.jsx` تستخدم `addComment/getComments` من `api/posts.js` — والتي تُخاطب `/posts/{id}/comment` و `/comments/{id}/comments`. لكن الـ `id` هنا هو `reel.id`، فيحدث أحد أمرين:
- إذا صادف رقم reel يطابق رقم post موجود ← يُخزَّن التعليق على منشور خاطئ.
- إذا لم يوجد post بهذا الرقم ← 404 يفشل بصمت والتعليق يختفي.

بالإضافة إلى أن الباك-إند لم يكن يحوي أصلاً `/reels/{id}/comment` (يوجد `/reels/{id}/like` و `/reels/{id}/view` و `/reels/{id}/save` فقط).

**الحل**:
- **فرونت-إند**: ملف جديد `api/reels.js` يوفر `addReelComment / getReelComments / likeReelComment / deleteReelComment` تستخدم `/reels/{id}/comments`. حَدَّثنا `Reels.jsx.openComments/sendComment` لاستخدامها، مع تعليق تفاؤلي فوري (يظهر مباشرة قبل استجابة الخادم) واحتفاظ بـ fallback أنيق على المسار القديم `posts` لدعم النسخ القديمة من الباك-إند.
- **باك-إند**: أضفنا في `app/api/routes/reels.py` أربعة endpoints:
  - `POST /reels/{reel_id}/comments` — إنشاء تعليق (يحدّث `reels.comments_count`).
  - `GET  /reels/{reel_id}/comments` — قائمة التعليقات مع pagination.
  - `DELETE /reels/comments/{comment_id}` — حذف (المالك فقط).
  - `POST /reels/comments/{comment_id}/like` — إعجاب.
- **موديل**: وسّعنا `ReelComment` في `models/stories_reels.py` بأعمدة `parent_id / username / is_hidden / updated_at` (لدعم الردود والإخفاء).
- **Migration**: `bootstrap.py._migrate_reel_comments_table` تضيف الأعمدة الجديدة على قواعد البيانات الموجودة بدون كسر البيانات القائمة، وأُضيفت `reel_comments` إلى `REQUIRED_TABLES` ليتم إنشاؤها تلقائياً.

---

## الاختبارات

- **بناء نحوي**: جميع ملفات Python (`ast.parse`) وJSX (`@babel/parser`) تمر بدون أخطاء.
- **ترابط الاستيرادات**: `Reel, ReelComment, ReelLike, ReelView, SavedReel` كلها مصدّرة من `stories_reels.py` ومستوردة في `reels.py` وفي `models/__init__.py`.

## سيناريو الاختبار اليدوي بعد النشر

1. **منشور جديد**: اضغط "+" من الشريط السفلي ← رفع صورة ← اسحب لأسفل ← يجب أن ترى معاينة الصورة وزر "نشر".
2. **ستوري**: افتح ستوري ← ارفع صورة ← يجب أن يظهر زر "نشر" في الأعلى دائمًا حتى وأنت تمرّر لأسفل للوصول لحقل الوصف/الموسيقى/الخصوصية.
3. **ريلز — تشغيل**: افتح صفحة الريلز ← يجب أن يبدأ الفيديو تلقائياً (كاتم الصوت افتراضياً).
4. **ريلز — تعليق**: علِّق على ريل ← اخرج من شيت التعليقات ← افتحه مجدداً ← يجب أن يظهر تعليقك.
