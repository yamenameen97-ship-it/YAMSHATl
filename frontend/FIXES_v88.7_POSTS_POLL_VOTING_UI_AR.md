# v88.7 — إصلاح جذري لعرض الاستطلاع في صفحة المنشورات (2026-07-18)

## المشكلة
عند نشر منشور يحتوي على استطلاع من مؤلف المنشورات:
- كان يظهر **سؤال الاستطلاع فقط كنص** في صفحة المنشورات.
- **أزرار التصويت لم تظهر** إطلاقاً.
- **النسب المئوية للتصويت غير موجودة**.
- بينما استطلاعات المجموعات تعمل بشكل صحيح مع أزرار + نسب.

## السبب الجذري
1. **الفرونت إند**: `PostComposer` كان يدمج سؤال الاستطلاع في `content` فقط،
   ولم يمرر `poll_question` منفصل، مما جعل من الصعب فصل السؤال عن نص المنشور.
2. **mapBackendPost** في `FeedMobile.jsx` و `FeedEnhanced.jsx` لم يكن يمرر
   الحقل `poll_question`، ولم يدعم كل الأشكال المحتملة للحقل (`poll`, `poll_options`, `options`).
3. **الباك إند**: `_serialize_post` لم يكن يُرجع حقل `poll_question` منفصلاً،
   مما جعل الفرونت إند يعرض السؤال كجزء من النص العادي.
4. **البطاقات (MobilePostCard, FeedEnhanced PostCard)** كانت تفترض شكلاً واحداً
   فقط للاستطلاع دون تطبيع البيانات.

## الحل الجذري

### 1) `PostComposer.jsx`
- إرسال `poll_question` منفصل في الـ payload.
- دعم `poll` كمصفوفة `{label}` (كما كان).
- تطبيق نفس التغييرات في المسار الاحتياطي (fallback) للفيديو.

### 2) `MobilePostCard.jsx` (منشورات الجوال)
- إضافة `normalizePollShape()` تتقبل جميع الأشكال:
  - `post.poll`، `post.poll_options`، `post.options`
  - عناصر نصية أو كائنات `{id, label, votes, voted_by_me}`
- استخراج سؤال الاستطلاع تلقائياً من `post.poll_question` أو من أول سطر في النص.
- عرض السؤال في **قسم منفصل بالأعلى** (class: `ym-poll-question`)
  ثم أزرار التصويت مع النسب المئوية بالأسفل.
- إخفاء السؤال من نص المنشور لتجنب التكرار.

### 3) `FeedEnhanced.jsx` (سطح المكتب)
- نفس منطق التطبيع (`normalizePollShape`).
- استخراج السؤال من `poll_question` أو أول سطر.
- عرض `yam-poll-question` في الأعلى + أزرار `yam-poll-option` مع النسب.

### 4) `feed-actions-compact-v39.css`
- إضافة نمط `.yam-poll-question` (نص عريض 15px مع border-bottom منقّط).

### 5) Backend `app/api/routes/posts.py`
- قبول `poll_question` من الـ payload ودمجه في مقدمة `content` إذا لم يكن موجوداً.

### 6) Backend `app/services/post_service.py`
- استخراج `poll_question` من أول سطر في `content` عند وجود استطلاع.
- إرجاع `poll_question` كحقل منفصل في `_serialize_post`.

## النتيجة النهائية
- ✅ السؤال يظهر بارزاً بالأعلى داخل صندوق الاستطلاع.
- ✅ أزرار التصويت تظهر كاملة أسفل السؤال.
- ✅ عند التصويت تظهر النسبة المئوية لكل خيار + شريط تعبئة.
- ✅ التصميم مطابق تماماً لاستطلاعات المجموعات.
- ✅ يعمل على الجوال والويب.
- ✅ متوافق مع RTL بالكامل.

## الملفات المعدّلة
1. `frontend/src/components/feed/PostComposer.jsx`
2. `frontend/src/components/mobile/MobilePostCard.jsx`
3. `frontend/src/pages/FeedEnhanced.jsx`
4. `frontend/src/pages/FeedMobile.jsx`
5. `frontend/src/styles/feed-actions-compact-v39.css`
6. `backend/app/api/routes/posts.py`
7. `backend/app/services/post_service.py`
