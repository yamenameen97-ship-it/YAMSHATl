# YAMSHAT v85.7 — إصلاحات ثلاث مشاكل حرجة

## 1) التعليقات لا تظهر رغم أن العدّاد ≥ 1
**السبب الجذري (backend):**
- `services/comment_service.py::get_comments` كان يجلب الجذور فقط
  بشرط `parent_id IS NULL`. عندما تكون كل التعليقات الظاهرة
  ردوداً (parent_id != null) على تعليق أب محذوف/مخفي، الجذور
  تعود فارغة فيصبح `items = []` رغم أن العدّاد يعرض 2.

**الحل:**
- تغيير الخدمة لتجلب كل التعليقات الظاهرة أولاً، ثم يعتبر كل
  تعليق ذو `parent_id` مفقود/مخفي **جذراً افتراضياً (orphan-root)**.
- بناء الشجرة على القائمة الكاملة → لا يوجد تعليق ضائع.

**Frontend:**
- `MobileCommentsSheet.jsx`: تسطيح الشجرة (roots + replies)
  إلى قائمة مسطّحة ليعرض جميع التعليقات في الشيت.

## 2) صندوق كتابة مكرَّر في دردشة المجموعة يغطي زر الإرسال
**السبب الجذري:**
- بقايا CSS من `chat-mobile-*.css` كانت تُطبّق `.yam-chat-input-wrap`
  (composer الدردشة الفردية) كطبقة `position:fixed` فوق شاشة
  المجموعة، مما يخفي زر الإرسال + الإرفاق.

**الحل:** ملف CSS جديد يخفي أي composer فردي داخل حاوية
`[data-yam-group-root="true"]` ويثبّت `.yam-group-input-area`
كعنصر relative واحد فقط أعلى BottomNav مع padding آمن لـ safe-area.

## 3) صفحة الأصدقاء لا تستجيب للسحب/التمرير على الجوال
**السبب:** نفس مشكلة v81 مع الملف الشخصي — `content-visibility`
والـ `.friends-page` لا تعلن `overflow: visible` بشكل صريح فيمتنع
`.page-content` (حاوية التمرير الحقيقية) عن السحب.

**الحل:**
- إضافة `data-page="friends"` على الحاوية.
- CSS يُلغي `content-visibility` ويجعل `.friends-page`
  ذات `overflow: visible` و `touch-action: pan-y`.

## الملفات المعدَّلة
- `backend/app/services/comment_service.py`
- `frontend/src/components/mobile/MobileCommentsSheet.jsx`
- `frontend/src/pages/Friends.jsx`
- `frontend/src/main.jsx`
- **جديد:** `frontend/src/styles/yamshat-fixes-v85.7-FRIENDS-CHAT-COMMENTS.css`
