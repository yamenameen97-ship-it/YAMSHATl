# 🔥 YAMSHAT v88.2 — إصلاح جذري نهائي لسحب صفحة الملف الشخصي على الجوال

## 📌 المشكلة
صفحة الملف الشخصي على ويب-الجوال (`/profile` و `/profile/:username`) لا تقبل السحب لأعلى/لأسفل رغم محاولات إصلاح متعددة سابقة (v81, v82, v87.22, v87.23, v87.24).

## 🎯 التشخيص الجذري (Root Cause)

المصدر الحقيقي كان في ملف CSS `yamshat-fixes-v87.24-FINAL-COMPLETE-FIX.css`، القاعدة:

```css
html body .profile-page-wrap,
html body [class*="profile-page"],   /* ⚠️ سيلكتور عريض جدّاً */
html body [class*="ProfilePage"] {
  overflow-y: auto !important;
  height: auto !important;           /* ⚠️ كارثة على .page-content */
  min-height: 100dvh !important;
  touch-action: pan-y !important;
}
```

في نفس الوقت، `ProfilePage.jsx` كان يضيف عبر JavaScript الـclass التالية على `<main class="page-content">`:

```js
pageContent.classList.add('profile-page-content-scroll');
```

نتيجة السلسلة الكارثية:
1. الـselector `[class*="profile-page"]` يُطابق أيضاً `profile-page-content-scroll` الموجود على `<main class="page-content">`.
2. تُفرض `height: auto !important` على `.page-content`.
3. لكن `.page-content` مبنية في `MainLayout.jsx` بـ `position: absolute; inset: 0` — أي أنها تعتمد على `top/right/bottom/left = 0` لتحديد ارتفاعها.
4. `height: auto` مع `position: absolute; inset: 0` تجعل الحاوية تتقلص فقدياً لارتفاع محتواها → لا يوجد `overflow` حقيقي → السحب لا يعمل.

## ✅ الحل — أخذ المعرفة من "بوست البلاغات"

فحصنا `src/components/reports/ReportModal.jsx` (الذي يعمل سحبه بنجاح). سرّه:

1. **حاوية خارجية** بـ `position: fixed; inset: 0` — أبعاد صريحة.
2. **flex column** مع `maxHeight: min(92dvh, ...)` و `overflow: hidden` على المستوى الخارجي.
3. **div داخلي** بـ `flex: 1 1 auto` + `overflowY: auto` + `WebkitOverflowScrolling: touch`.

**التطبيق على صفحة الملف الشخصي**:
- `.page-content` من `MainLayout` هي بالفعل مبنية بنفس الطريقة (`position: absolute; inset: 0; overflow-y: auto`) — نفس بصمة `.ym-reels-feed` الناجحة.
- الحل: **لا نُلوّث `.page-content` بأي class أو inline-style يُفسد `inset:0`** — نتركها كما هي وتعمل تلقائياً.
- `.profile-page-wrap` تصبح حاوية flow عادية (`overflow: visible; min-height: 100%`) مثلما تفعل `FeedMobile` والصفحة الرئيسية الناجحتين.

## 🔧 التغييرات

### 1. `src/styles/yamshat-fixes-v87.24-FINAL-COMPLETE-FIX.css`
- **حذف** القاعدة العريضة الخطرة `[class*="profile-page"]`.
- **إضافة** قواعد `.profile-page-wrap` طبيعية (`overflow: visible`).
- **إضافة** قاعدة `:has(.profile-page-wrap)` تضمن التمرير على `.page-content` للمتصفحات الحديثة، دون لمس `height` أو `inset`.

### 2. `src/pages/profile/ProfilePage.jsx`
- **إزالة** `pageContent.classList.add('profile-page-content-scroll')` (المصدر الذي كان يفعّل القاعدة الكارثية).
- **إضافة** `data-attribute` بديل (`data-yam-profile-active="true"`) — لا يُطابق أي selector قديم بـ `[class*=...]`.
- **fallback JS**: نضبط `overflow-y`, `-webkit-overflow-scrolling`, `touch-action` كـ inline-style على `.page-content` للمتصفحات القديمة (لا تدعم `:has()`).
- **تنظيف** الـ`<style>` المضمّن ليعكس النموذج الجديد.

## 🧪 كيفية التحقق (على الجوال)

1. افتح `/profile` (ملفك) أو `/profile/some-user`.
2. اسحب لأعلى/لأسفل — يجب أن ينتقل المحتوى بسلاسة مع momentum scroll مثل بقية الصفحات.
3. النقر على الأزرار (تعديل الغلاف، تعديل الملف، إلخ) ما زال يعمل فوراً.
4. الشريط السفلي (BottomNav) لا يحجب آخر عنصر (بفضل `padding-bottom: 140px + safe-area`).

## 🗑️ تنظيف
- تم حذف مجلد `dist/` (7.4 MB) لتخفيف حجم الأرشيف.
- تم حذف مجلد `node_modules/` (كما هو معتاد في التسليمات).
- version bump: `87.23.0` → `88.2.0`.

## 📁 الملفات المتأثرة
- `frontend/src/pages/profile/ProfilePage.jsx`
- `frontend/src/styles/yamshat-fixes-v87.24-FINAL-COMPLETE-FIX.css`
- `frontend/package.json` (version)
- `frontend/dist/` (محذوف)

---
**تاريخ الإصلاح**: 2026-07-16
**رقم الإصدار**: v88.2
**المرجع الناجح المستفاد منه**: `ReportModal.jsx` (بوست البلاغات)
