# YAMSHAT — إصلاح v88.9 قص الصور على الجوال (2026-07-18)

## المشكلة المُبلَّغ عنها

قدّم المستخدم لقطتين توضّحان:

1. **في المنشورات على شاشة الجوال الصغيرة:**
   الصورة تظهر مقصوصة (يظهر منها الجزء الأعلى فقط) بينما تظهر كاملة على الشاشة الكبيرة.

2. **في الدردشة (شات ويب موبايل):**
   عند إرسال صورة تظهر مقصوصة داخل الفقاعة — لا يبدو منها إلا الأعلى فقط،
   كما في لقطة `t8.onrender.com`.

## السبب الجذري (Root Cause)

بعد فحص كامل الكود اتّضحت ثلاث قواعد CSS قديمة (من إصدارات v87.6, v87.16, v87.21)
تفرض `object-fit: cover !important` مع `max-height: 340px !important` على صور
الدردشة، وهذا التركيب يقصّ الأجزاء العلوية والسفلية من الصور الطويلة (البورتريه)
عند عرضها على شاشات الجوال الصغيرة، لأن نسبة الصورة الحقيقية أطول من الإطار.

كذلك في `MobilePostCard.jsx`، كانت حاويات البنر `.banner-image-container`
تعتمد `height: 100%` على حاوية أم لا يوجد بها ارتفاع صريح، فيصبح ارتفاع
الحاوية = 0 في بعض متصفحات الجوال، ثم يُطبَّق قصّ على الصورة.

## الإصلاحات المُطبَّقة

### 1. `styles/chat-mobile-fixes.css`
- تحويل `object-fit` من `cover` إلى **`contain`**.
- رفع `max-height` من `340px` ثابت إلى `min(70vh, 520px)`.
- تحويل `width: 100%` إلى `width: auto` مع `max-width` ذكي لتحافظ الصورة
  على نسبتها الأصلية دون تشوّه.

### 2. `styles/yamshat-fixes-v87.21-CHAT-MOBILE-WEB-MEDIA-VOICE.css`
- نفس المعالجة مع فرض `object-position: center` و`margin: 0 auto`
  لضمان توسيط الصورة بلا قصّ.

### 3. `styles/yamshat-fixes-v87.6-CHAT-MEDIA-VOICE-WHATSAPP.css`
- نفس المعالجة على قواعد `.yam-bubble.is-media-only .yam-safe-image img`
  والفيديو المرتبط بها.

### 4. `styles/yamshat-fixes-v88.9-IMAGE-CROP-FINAL-FIX.css` (ملف جديد)
- طبقة نهائية بأولوية قصوى (`html body … !important`) تكسر أي CSS legacy.
- تغطي: `.yam-media-button`, `.yam-safe-image`, `.yam-bubble-media`,
  `.ym-pc-media`, `.ym-post-banner-new`, `.banner-image-container`,
  `.banner-video-container`، ومعارض الصور المتعددة.
- Media queries لشاشات ≤ 720px و ≤ 400px لضمان التجربة على الشاشات الصغيرة.
- Fallback عبر `@supports not (max-height: 70dvh)` للمتصفحات القديمة.

### 5. `components/chat/MessageBubble.jsx`
- رفع `maxHeight` في استدعاء `<SafeImage>` من **340** إلى **520** بكسل.

### 6. `main.jsx`
- تسجيل ملف CSS الجديد `v88.9-IMAGE-CROP-FINAL-FIX.css` كآخر استيراد،
  ليضمن الفوز في cascade على جميع الطبقات السابقة.

## سلوك ما بعد الإصلاح

- الصور في المنشورات تظهر **كاملة** على جميع الشاشات: الجوال الصغير جداً
  (Redmi 5A / Galaxy Fold مغلق) والجوال العادي والتابلت وسطح المكتب.
- الصور في الدردشة تظهر **كاملة** كما في واتساب — بما فيها الصور الطويلة
  (بورتريه) والمربّعة والعريضة.
- لا يُقصّ أعلى الصورة أو أسفلها؛ فقط يُطبَّق حدّ ذكي على الطول (≤ 70dvh)
  لتفادي أن تملأ الصورة الطويلة جداً كامل الشاشة.

## الملفات المُعدَّلة (Summary)

| # | الملف | نوع التعديل |
|---|-------|-------------|
| 1 | `frontend/src/styles/chat-mobile-fixes.css` | تعديل |
| 2 | `frontend/src/styles/yamshat-fixes-v87.21-CHAT-MOBILE-WEB-MEDIA-VOICE.css` | تعديل |
| 3 | `frontend/src/styles/yamshat-fixes-v87.6-CHAT-MEDIA-VOICE-WHATSAPP.css` | تعديل |
| 4 | `frontend/src/styles/yamshat-fixes-v88.9-IMAGE-CROP-FINAL-FIX.css` | **جديد** |
| 5 | `frontend/src/components/chat/MessageBubble.jsx` | تعديل |
| 6 | `frontend/src/main.jsx` | تعديل (إضافة استيراد) |

## طريقة التحقق

1. افتح موقع YAMSHAT على جوال بشاشة ≤ 400px.
2. انشر صورة طويلة (بورتريه) من الاستوديو → يجب أن تظهر كاملة داخل بطاقة
   المنشور بلا قصّ.
3. افتح محادثة، وأرسل نفس الصورة → يجب أن تظهر كاملة داخل فقاعة الدردشة.
4. جرّب صورة عريضة وأخرى مربّعة — يجب أن يعمل الجميع بشكل صحيح.

---

**الإصدار:** v88.9
**التاريخ:** 2026-07-18
**النطاق:** Frontend فقط (لا تغيير في Backend)
