# Yamshat — تحديث صيانة v58.1 (إصلاح صفحات المنشورات)

> الإصدار: **v58.1 — yamshat-posts-fix-v58-1**
> التاريخ: 2026-06-22
> النوع: 🔧 صيانة (Hotfix) — لا يوجد كسر في API
> الحالة: ✅ جاهز للنشر

---

## 🔍 ما تم فحصه

تمّت مراجعة شاملة لكل ملفات صفحات المنشورات (المسارات + المكونات + الخدمات):

| المجال | عدد الملفات المفحوصة |
|---|---|
| صفحات (`src/pages`) | 3 (FeedEnhanced, FeedMobile, PostCard.tsx) |
| مكونات الخلاصة (`src/components/feed`) | 23 ملف |
| بطاقة الجوال (`src/components/mobile`) | 1 (MobilePostCard.jsx) |
| خدمات / Hooks مرتبطة | 7 |
| طبقة CSS الخاصة بـ v58 | 1 (mobile-touch-paw-v58.css) |

النتيجة: تم اكتشاف **مشكلتين فعليتين** + **تحسين جودة** واحد، وكلها أُصلحت.

---

## 🐛 الأخطاء التي عُولِجت

### 🔴 خطأ حرج #1 — ملف فارغ يكسر البناء عند الاستيراد
**الملف:** `frontend/src/components/feed/PostCardEnhanced.jsx`

كان الملف **فارغاً تماماً (0 سطر)**. أي محاولة لاستيراده من أي مكان كانت ستُسبّب:
```
SyntaxError: The requested module './PostCardEnhanced.jsx' does not provide an export named 'default'
```

**الإصلاح:** ملء الملف بـ wrapper آمن يعيد تصدير `PostCard` الرئيسي:
```jsx
import PostCard from './PostCard.jsx';
export default function PostCardEnhanced(props) {
  return <PostCard {...props} />;
}
```

---

### 🔴 خطأ منطقي #2 — مالك المنشور لا يستطيع حذف منشوره
**الملف:** `frontend/src/pages/FeedMobile.jsx` (السطر 391 سابقاً)

كان الكود يقارن **الاسم المعروض** بـ **اسم المستخدم**:
```js
// ❌ قبل
const isOwnMoreMenuPost = moreMenuPost?.authorName === session?.username;
```
هذه المقارنة **لا تنجح أبداً** لأن `authorName` يحتوي قيمة مثل "أحمد محمد ✨" بينما `session.username` يحتوي قيمة مثل "ahmed97".
النتيجة: زر **"حذف المنشور"** كان مخفياً دائماً حتى للمالك، وكانت أزرار **متابعة/كتم/حظر** تظهر بدلاً منه.

**الإصلاح:** مقارنة دقيقة على مستوى `username` (case-insensitive، بدون @):
```js
// ✅ بعد
const isOwnMoreMenuPost = (() => {
  const myUsername = String(session?.username || '').trim().toLowerCase().replace(/^@/, '');
  if (!myUsername || !moreMenuPost) return false;
  const postUsername = String(
    moreMenuPost.username
    || (moreMenuPost.handle || '').replace(/^@/, '')
    || ''
  ).trim().toLowerCase();
  return Boolean(postUsername) && postUsername === myUsername;
})();
```

---

### 🟡 تحسين جودة #3 — تنظيف `console.log` في إنتاج
**الملف:** `frontend/src/components/feed/RichTextEditor.jsx` (السطر 357 و 362)

كانت أزرار **الوسوم (#hashtag)** و **الإشارات (@mention)** في معاينة المنشور تستدعي `console.log` بدلاً من توجيه المستخدم.

**الإصلاح:** استبدالها بتوجيه فعلي:
- النقر على `#tag` → ينقلك إلى `#/search?tag=<value>`
- النقر على `@user` → ينقلك إلى `#/profile/<value>`

---

## ✅ ما تم التحقق منه ولم تكن به أخطاء

- ✅ `src/pages/FeedEnhanced.jsx` (2257 سطر) — سليم نحوياً، imports نظيفة
- ✅ `src/pages/FeedMobile.jsx` (بعد الإصلاح) — سليم
- ✅ `src/components/feed/PostCard.jsx` (698 سطر) — سليم
- ✅ `src/components/feed/PostCardAdvanced.jsx` — سليم
- ✅ `src/components/feed/PostCardOptimized.jsx` — سليم
- ✅ `src/components/feed/PostComposer.jsx` (828 سطر) — سليم
- ✅ `src/components/feed/ProFeedPostCard.jsx` — سليم
- ✅ `src/components/feed/NestedComments.jsx` — سليم
- ✅ `src/components/feed/RepostUI.jsx` — سليم
- ✅ `src/components/feed/FeedLiveStreamWidget.jsx` — سليم
- ✅ `src/components/mobile/MobilePostCard.jsx` (619 سطر) — سليم
- ✅ `src/services/pawTouchEnhancer.js` — سليم
- ✅ `src/api/posts.js` — جميع 22 endpoint مُصدَّرة بشكل صحيح
- ✅ `src/styles/mobile-touch-paw-v58.css` (702 سطر) — سليم

أداة الفحص (Babel parser + ESM resolver) أكدت:
- **0** خطأ syntax
- **0** import مكسور
- **0** ملف ناقص

---

## 📦 الملفات المُعدّلة

| الملف | نوع التعديل |
|---|---|
| `frontend/src/components/feed/PostCardEnhanced.jsx` | **إصلاح حرج** — ملف فارغ |
| `frontend/src/pages/FeedMobile.jsx` | **إصلاح منطقي** — مالك المنشور |
| `frontend/src/components/feed/RichTextEditor.jsx` | تحسين — توجيه فعلي بدل console.log |
| `CHANGELOG_v58.1_POSTS_FIX_AR.md` | **جديد** — هذا الملف |

---

## 🧪 ما يجب اختباره بعد النشر

1. ✅ افتح أي صفحة فيها مكوّن PostCard — لا أخطاء في الكونسول
2. ✅ افتح منشور **خاص بك** على الجوال → اضغط ⋯ → يجب أن يظهر **"حذف المنشور"** (وليس متابعة/كتم/حظر)
3. ✅ افتح منشور **مستخدم آخر** → اضغط ⋯ → يجب أن تظهر: متابعة، كتم، حظر، بلاغ
4. ✅ في صفحة المُنشئ، أضف `#وسم` و `@مستخدم` ثم انقر عليهم في المعاينة → يجب أن ينقلوك للصفحات الصحيحة

---

**Yamshat Engineering — 2026-06-22**
