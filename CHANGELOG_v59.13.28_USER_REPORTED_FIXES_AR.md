# YAMSHAT — تحديث v59.13.28
## إصلاحات بناءً على ملاحظات المستخدم

تاريخ: 2026-06-26

---

## 🐛 المشاكل المُبلَّغ عنها

### 1. بوست التعليق على المنشور في ويب الجوال يظهر بشكل خاطئ وكبير
**الوصف:** عند الضغط على زر التعليقات في منشور من Feed على ويب الجوال،
يظهر شيت (Sheet) التعليقات بشكل كبير جداً ويغطي الصفحة بالكامل،
ولا تظهر منطقة الكتابة (الـ composer) للمستخدم.

**التوقّع:** يجب أن يكون مطابقاً لتصميم بوست التعليق على Reels —
أصغر، أنيق، يظهر من أسفل الشاشة، مع ظهور واضح لمنطقة الكتابة.

### 2. ظهور دائرة ملوّنة فوق الصور في المنشورات (أيقونة Google Lens)
**الوصف:** عندما ينشر المستخدم صورة في المنشور، تظهر دائرة ملوّنة صغيرة
(أيقونة Google Lens / Search by image) في أسفل الصورة على متصفح Chrome في Android.
المستخدم يعتبر هذه الأيقونة عيباً ويرغب بإزالتها نهائياً.

---

## ✅ الإصلاحات المُطبّقة

### الإصلاح 1: تطابق Comments Sheet مع تصميم Reels Comments Drawer
**الملف:** `frontend/src/styles/mobile-yamshat-redesign.css`

**التغييرات:**
- إزالة `height: 55dvh; max-height: 55dvh;` الذي كان يجعل الشيت يأخذ نصف ارتفاع الشاشة بشكل جامد.
- استبدالها بـ `height: auto; max-height: 70vh; min-height: 320px;` (مطابق تماماً لتصميم `.ym-reels-drawer-panel`).
- توحيد لون الخلفية مع Reels: `#150f24` بدلاً من `var(--ym-card, #141A29)`.
- توحيد البوردر العلوي مع Reels: `border-top: 1px solid rgba(139,92,246,0.4)` (بنفسجي خفيف).
- توحيد border-radius: `22px 22px 0 0` بدلاً من `20px 20px 0 0`.
- إضافة `overflow: hidden` على `.ym-sheet` لمنع تجاوز المحتوى.
- تعديل `.ym-sheet-body` بإضافة `flex: 1 1 auto; min-height: 0` لضمان حساب الـ scroll الصحيح
  وضمان ظهور منطقة الكتابة (composer) دائماً.
- تعديل `.ym-sheet-composer` بإضافة `background: #0f0a1c` و `flex-shrink: 0` لضمان عدم اختفاء منطقة الكتابة.
- تكبير padding الـ head ليطابق Reels: `padding: 14px 18px`.

**النتيجة:** الشيت الآن يفتح بشكل مرن (يأخذ ما يحتاجه فقط حتى حد أقصى 70vh)،
يبدو متطابقاً مع Reels comment drawer، ومنطقة الكتابة تظهر دائماً في الأسفل.

---

### الإصلاح 2: إزالة أيقونة Google Lens (الدائرة الملوّنة) فوق الصور
**الملفات:**
- `frontend/src/components/mobile/MobilePostCard.jsx`
- `frontend/src/styles/mobile-yamshat-redesign.css`

**خلفية تقنية:**
هذه الأيقونة الملوّنة (دائرة بألوان شعار Google) ليست جزءاً من واجهة YAMSHAT.
هي أيقونة "Search image with Google Lens" يضعها متصفح **Chrome على Android**
فوق أي صورة في صفحات الويب عند الضغط المطوّل أو بشكل تلقائي على بعض الإصدارات.
لا يمكن إزالتها من Chrome مباشرةً، لكن يمكن تعطيل ميزة "image actions"
بمنع الإيماءات الافتراضية على عنصر `<img>`.

**التغييرات في MobilePostCard.jsx:**
- إضافة `draggable={false}` على عنصر `<img>` لصورة المنشور.
- إضافة `onContextMenu={(e) => e.preventDefault()}` لمنع قائمة الصورة الافتراضية.
- إضافة CSS داخلي:
  ```css
  -webkit-touch-callout: none;
  -webkit-user-drag: none;
  user-select: none;
  pointer-events: none; /* على الصورة فقط */
  ```
- إضافة طبقة `::after` شفافة فوق الصورة تمتص أحداث اللمس.

**التغييرات في mobile-yamshat-redesign.css:**
- قواعد عامة `!important` على كل صور المنشورات (selectors متعددة لتغطية جميع PostCards):
  ```css
  .ym-post-banner img, .ym-post-banner-new img, .banner-image-container img,
  .ym-post-image img, .post-media img, .feed-post-media img,
  .ym-feed-card img, .mobile-post-card img {
    -webkit-touch-callout: none !important;
    -webkit-user-drag: none !important;
    user-drag: none !important;
    user-select: none !important;
    pointer-events: none !important;
  }
  ```
- طبقات شفافة على حاويات الصور (`::before`) تمنع Chrome من تنشيط
  ميزة "image actions" التي تعرض أيقونة Lens.
- قاعدة احتياطية لإخفاء `::-webkit-image-extraction-overlay` (الأيقونة المعنية).

**النتيجة:** أيقونة Google Lens الملوّنة لم تعد تظهر فوق الصور في المنشورات.
المستخدم لا يزال قادراً على رؤية الصور بشكل طبيعي والتفاعل مع زر المنشور والـ feed.

---

## 📦 الإصدار

- **رقم الإصدار:** `59.13.28`
- **الملف:** `frontend/package.json` تم تحديثه.
- **ملاحظة:** لم نضف أي مكتبات/Node modules جديدة (تم الإصلاح بـ CSS و JSX فقط).

---

## 🧪 خطوات الاختبار للتحقّق

1. افتح Yamshat على متصفح Chrome في Android.
2. انتقل إلى الـ Feed (الرئيسية).
3. اضغط على زر التعليقات (💬) في أي منشور.
   - ✅ يجب أن يفتح شيت أصغر مطابق لشكل Reels comment drawer.
   - ✅ يجب أن تظهر منطقة الكتابة (input + زر إرسال) بوضوح في الأسفل.
   - ✅ لا يجب أن يغطي الشيت كامل الشاشة.
4. انشر صورة في منشور جديد، ثم اعرضه في الـ Feed.
   - ✅ يجب ألا تظهر الدائرة الملوّنة (أيقونة Google Lens) أسفل/فوق الصورة.
5. كرّر الاختبار على Reels — يجب أن تكون التجربة كما هي (لم نلمس Reels).

---

## 🔗 الملفات المُعدَّلة

| الملف | نوع التعديل |
|---|---|
| `frontend/package.json` | تحديث رقم الإصدار |
| `frontend/src/styles/mobile-yamshat-redesign.css` | إعادة تصميم `.ym-sheet*` + قواعد إخفاء Lens |
| `frontend/src/components/mobile/MobilePostCard.jsx` | حماية صورة المنشور من image actions |
| `CHANGELOG_v59.13.28_USER_REPORTED_FIXES_AR.md` | (جديد) هذا الملف |
