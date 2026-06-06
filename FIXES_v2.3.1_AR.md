# إصلاحات الإصدار v2.3.1 — يام شات

<div dir="rtl" style="font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;">

## ملخّص الإصلاحات الأربعة

### 1) ✅ زر "إنشاء" في صفحة المحادثات
- **قبل**: الضغط على زر "إنشاء" كان ينقل المستخدم إلى صفحة `/users` فقط.
- **بعد**: يفتح نافذة منبثقة (`ComposeModal`) فيها تبويبان:
  - **دردشة جديدة**: مربع بحث مباشر عن الأشخاص (مع debounce 250ms)، الضغط على شخص يفتح محادثة معه على `/chat/:username`.
  - **مجموعة جديدة**: نموذج لإدخال اسم المجموعة + وصف اختياري ثم إنشائها فعلياً عبر `createGroup` API.
- **الملف**: `frontend/src/pages/Inbox.jsx`

### 2) ✅ إخفاء البث/المجموعات/الستوري من الهيدر العلوي على الجوال
- **قبل**: كانت أيقونات (👫 المجموعات، 🎬 الريلز، 📖 القصص) تظهر في الهيدر العلوي على الجوال وتزاحم العناصر.
- **بعد**: أُخفيت تماماً على الجوال (`max-width: 1023.98px`) وتبقى متاحة فقط على الديسكتوب. الوصول إلى هذه الميزات على الجوال يبقى متوفّراً عبر BottomNav والصفحة الرئيسية.
- **الملفات**:
  - `frontend/src/components/layout/Topbar.jsx` (إضافة كلاس `topbar-desktop-only`)
  - `frontend/src/styles/mobile-app-experience.css` (`display: none !important` على الجوال)

### 3) ✅ إصلاح خطأ React #306 عند الضغط على البث
- **السبب الجذري**: ملف `pages/Live.jsx` كان **تالفاً بنيوياً**:
  - مكوّن `FloatingHearts` كان مدموجاً بشكل خاطئ مع كود المكوّن الرئيسي.
  - كان يستخدم متغيرات غير معرّفة (`comments`, `viewerCount`, `heartsCount`, `activeRoom`, إلخ) في نطاقه.
  - لا يوجد إعلان `function Live()` ولا `export default` — مما يجعل القيمة المُصدَّرة `undefined`.
  - خطأ React #306 معناه: "Element type is invalid. Expected a string... but got: **undefined**" — وهذا تماماً ما كان يحدث.
- **الحل**: إعادة بناء `pages/Live.jsx` بالكامل بصيغة سليمة:
  - مكوّن `Live` افتراضي مُصدَّر بشكل صحيح.
  - `FloatingHearts` منفصل ويستقبل `items` كـ prop.
  - عرض غرف البث، فلاتر (الكل/النشطة/الخاصة بي)، إنشاء غرفة، إرسال قلوب وهدايا وتعليقات.
  - تصميم RTL متجاوب مع الجوال.
- **الملف**: `frontend/src/pages/Live.jsx`

### 4) ✅ القائمة المنسدلة لاسم الحساب تخرج خارج الشاشة
- **قبل**: على الجوال، الضغط على اسم الحساب يفتح قائمة منسدلة جزء منها يخرج خارج حدود الشاشة من الجهة المقابلة.
- **بعد**:
  - على الديسكتوب: تبقى محاذية لـ `inset-inline-start: 0` (الجهة الأخرى من الزر في RTL) مع `max-width: calc(100vw - 24px)`.
  - على الجوال (`max-width: 1023.98px`): تصبح `position: fixed` بهامش 12px من كل جانب مع `max-height: calc(100vh - 140px)` وتمرير عمودي عند الحاجة.
- **الملف**: `frontend/src/styles/unified-overrides.css`

---

## تحسينات إضافية

- ✅ إضافة خط **Noto Sans Arabic** (مع Tajawal كبديل) من Google Fonts في `frontend/index.html`.
- ✅ تحديث `Content-Security-Policy` للسماح بـ `fonts.googleapis.com` و `fonts.gstatic.com`.
- ✅ جميع المكوّنات الجديدة/المعدّلة تستخدم `dir="rtl"` بشكل صريح.

---

## الملفات المُعدَّلة

| الملف | نوع التغيير |
|---|---|
| `frontend/index.html` | إضافة خط Noto Sans Arabic + تحديث CSP |
| `frontend/src/pages/Live.jsx` | إعادة بناء كامل (إصلاح React #306) |
| `frontend/src/pages/Inbox.jsx` | إضافة `ComposeModal` + state `composeOpen` |
| `frontend/src/components/layout/Topbar.jsx` | كلاس `topbar-desktop-only` للأزرار السريعة |
| `frontend/src/styles/mobile-app-experience.css` | إخفاء الأزرار السريعة على الجوال |
| `frontend/src/styles/unified-overrides.css` | إصلاح موضع القائمة المنسدلة |

---

**الإصدار**: v2.3.1
**التاريخ**: 2026-06-02

</div>
