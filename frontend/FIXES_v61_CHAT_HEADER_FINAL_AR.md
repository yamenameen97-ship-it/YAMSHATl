# 🎯 إصلاحات v61 — رأس صفحة الدردشة (الإصلاح النهائي والمتقن)

## المشاكل التي تم حلها

### 1️⃣ اسم الشخص وحالة "نشط الآن" لا تظهر في رأس صفحة الشات
**السبب:** أزرار الاتصال (📞 🎥 ⋮) كانت تحجز مساحة كبيرة وتغطي منطقة عرض الاسم.

**الحل:**
- تصغير أزرار الأيقونات (36-38px على الجوال، 40px على اللاب توب).
- منطقة الـ peer (الأفاتار + الاسم + الحالة) تأخذ `flex: 1 1 auto` مع `min-width: 0` بحيث تأخذ كل المساحة المتبقية ولا تنضغط لصفر.
- ضمان `overflow: hidden` و `text-overflow: ellipsis` لاسم المشترك لكي يقتطع بأناقة لو طويل.
- إخفاء زر البحث (الأيقونة الثالثة `⌕`) لتوفير مساحة إضافية.

### 2️⃣ زر الرجوع المكرر
**السبب:** المكوّن `GlobalPageBackButton` كان يظهر تلقائياً على كل صفحة باستثناء قائمة محدودة من المسارات، ولم تكن صفحة `/chat/:userId` ضمن القائمة، فظهر زر رجوع عائم إضافي بجانب زر الرجوع الموجود أصلاً داخل هيدر الشات.

**الحل:**
- إضافة `/^\/chat$/` و `/^\/chat\/[^/]+$/` و `/^\/groups\/[^/]+\/chat$/` إلى `HIDDEN_PATHS` في `GlobalPageBackButton.jsx`.
- إضافة طبقة حماية ثانية في CSS عبر `body.is-chat-open .yam-global-back-btn { display: none !important }`.

### 3️⃣ تكدّس ملفات CSS قديمة جعل الإصلاحات السابقة لا تظهر
**السبب:** كان هناك 9 ملفات `chat-mobile-redesign-v60.x.css` (v60، v60.1 إلى v60.8) محمّلة بالتتابع، بالإضافة إلى ملفات قديمة (`chat-mobile-fixes.css`, `chat-layout-fix.css`, `chat-enhancements.css`, `chat-long-press-swipe.css`) تتداخل في الـ cascade وتُربك الـ specificity.

**الحل (تنظيف جذري):**
- ✅ **حذف** كل ملفات `chat-mobile-redesign-v60.css` → `chat-mobile-redesign-v60.8.css`.
- ✅ **حذف** `chat-mobile-fixes.css`، `chat-layout-fix.css`، `chat-enhancements.css`، `chat-long-press-swipe.css`.
- ✅ **حذف** الملفات الميتة: `src/index.css` (الجذر)، `pages/App.tsx`، `pages/Messages.tsx`، `pages/chat/ChatPage.jsx`، `pages/chat/InboxPage.jsx`.
- ✅ **إنشاء** ملف واحد جديد ونظيف: `styles/chat-redesign-v61.css` يحكم كل أحجام الشاشات (جوال + لاب توب) بـ single source of truth.

## الملفات المتأثرة

| الملف | الإجراء |
|------|---------|
| `src/styles/chat-redesign-v61.css` | ✨ **جديد** — الإصلاح النهائي الموحّد |
| `src/main.jsx` | تنظيف 9 imports قديمة وإضافة v61 |
| `src/components/ui/GlobalPageBackButton.jsx` | إضافة مسارات الشات إلى HIDDEN_PATHS |
| `src/pages/Chat.jsx` | حذف import القديم |
| `src/pages/GroupChat.jsx` | حذف import القديم |
| `src/styles/index.css` | حذف `@import` للملفات القديمة |
| 9 ملفات `chat-mobile-redesign-v60.x.css` | 🗑️ محذوفة |
| `chat-mobile-fixes.css` + `chat-layout-fix.css` + `chat-enhancements.css` + `chat-long-press-swipe.css` | 🗑️ محذوفة |
| `src/index.css` + `pages/App.tsx` + `pages/Messages.tsx` + `pages/chat/` | 🗑️ محذوفة |

## نتيجة الإصلاح

📱 **على الجوال:**
```
┌───────────────────────────────────────────────────┐
│ ←  [Y]  yamenameen97          📞  🎥  ⋮          │
│         نشط الآن                                   │
└───────────────────────────────────────────────────┘
```

💻 **على اللاب توب/الديسكتوب:** نفس البنية، حجم أكبر، يبقى داخل صندوق الـ chat-stage بزوايا دائرية بدون تثبيت fixed (لأن السايدبار موجود على اليسار).

## كيف نضمن أن الإصلاحات ستظهر هذه المرة؟

1. **Single source of truth**: ملف CSS واحد فقط `chat-redesign-v61.css` يحكم الهيدر.
2. **Specificity عالية**: استخدام `body .yam-chat-stage-header` بدل `.yam-chat-stage-header` لتفوّق inline `<style>` داخل JSX.
3. **!important مدروس**: على كل خصائص layout الحرجة لمنع تجاوزها من ملفات سابقة قد تُضاف لاحقاً.
4. **حذف كل المنافسين**: لم يعد هناك ملفات CSS قديمة تتنازع على نفس المحددات.
