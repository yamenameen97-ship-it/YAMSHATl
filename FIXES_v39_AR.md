# إصلاحات الإصدار v39 — Yamshat

## ملخص المشاكل المعالَجة

تم في هذا الإصدار معالجة **خمس مشاكل حرجة** بلاغ عنها المستخدم بعد مسح الكاش وعند التفاعل اليومي.

---

## 1) ❌ خطأ `Failed to execute 'btoa' on 'Window'` عند تسجيل الدخول

### السبب الجذري
الملف `frontend/src/utils/secureStorage.js` كان يستخدم:
```js
btoa(JSON.stringify(value));
```
هذه الدالة تدعم Latin1 فقط، وكان يتم تمرير JSON يحتوي على بيانات مستخدم بأحرف عربية (اسم المستخدم "ياسر"، البريد، الملف الشخصي…) → فشل فوري.

### الإصلاح
استبدال `btoa` بدالة UTF-8 آمنة تعتمد على `TextEncoder + Uint8Array → base64`:
```js
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
```
كما تم تطبيق **تراجع تلقائي** عند فك الترميز للسجلات القديمة المخزّنة بـ `btoa` العادي حفاظاً على التوافق العكسي.

**الملف:** `frontend/src/utils/secureStorage.js`

---

## 2) ❌ خطأ `NotAllowedError: prompt() must be called with a user gesture` (PWA)

### السبب الجذري
في `services/pwaInstallPrompt.js` كان يتم استدعاء `deferredPrompt.prompt()` تلقائياً بعد `setTimeout(2000)` — وهذا يخالف سياسة المتصفحات التي تشترط استدعاء `prompt()` فقط من داخل user gesture مباشر (click).

### الإصلاح
- إزالة استدعاء `prompt()` من داخل `setTimeout`.
- عرض **UI مخصص** فقط عند `beforeinstallprompt`، والـ `prompt()` الفعلي يُستدعى الآن **فقط** داخل `click handler` لزر التثبيت → user gesture صحيح.
- إضافة معامل `fromUserGesture` يحمي من أي استدعاءات تلقائية مستقبلية.

**الملف:** `frontend/src/services/pwaInstallPrompt.js`

---

## 3) ❌ المنشورات لا تُحمّل تلقائياً عند الدخول للمنصة

### السبب الجذري
في `hooks/useFeed.js`:
1. `useInfiniteQuery` كان يُطلق قبل أن يتم تحميل الـ session token من `secureStorage` → 401 صامت → قائمة فارغة.
2. `refetchOnMount` لم يكن مُفعّلاً بـ `'always'` فكان يستخدم الكاش الفارغ.
3. `staleTime: 5 دقائق` كان يطول جداً.

### الإصلاح
- إضافة **انتظار التوكن** (`authReady`) قبل تفعيل الـ query (مع timeout 5 ثوان كحد أقصى).
- ضبط `refetchOnMount: 'always'` لإجبار جلب جديد عند دخول الصفحة.
- تقليل `staleTime` إلى 30 ثانية.
- إضافة `refetchOnReconnect: true` و `retry: 2` مع backoff.

**الملف:** `frontend/src/hooks/useFeed.js`

---

## 4) ❌ عداد الإعجابات يُزيح زر "حفظ" إلى الأسفل

### السبب الجذري
في `pages/FeedEnhanced.jsx` كانت أزرار التفاعل تحتوي على:
```jsx
<button>...{liked ? `تم الإعجاب (${likesCount})` : `أعجبني (${likesCount})`}</button>
```
- النصوص الطويلة + الأرقام داخل الأزرار تجعل عرض كل زر متغيراً.
- الحاوي لم يكن `flex-wrap: nowrap` بشكل صريح → عند زيادة الرقم، زر "حفظ" ينزل لأسطر تالية.

### الإصلاح
- إزالة كل النصوص من داخل الأزرار (`أعجبني` / `تم الإعجاب` / `تعليق` / `مشاركة` / `محفوظ` / `حفظ`).
- إبقاء **الأيقونة فقط + العداد الرقمي** (يظهر فقط إذا كان > 0).
- النصوص محفوظة كـ `aria-label` و `title` للوصولية (Screen reader + tooltip).
- ملف CSS جديد `feed-actions-compact-v39.css`:
  - `display: flex; flex-wrap: nowrap; flex: 1 1 0`
  - `font-variant-numeric: tabular-nums` (أرقام بعرض ثابت)
  - `min-height: 40px` ثابت
  - دعم RTL كامل

**الملفات:**
- `frontend/src/pages/FeedEnhanced.jsx`
- `frontend/src/styles/feed-actions-compact-v39.css` (جديد)
- `frontend/src/styles/index.css` (إضافة `@import`)

---

## 5) ❌ فيديو المنشور يستمر بالتشغيل عند السحب أو المغادرة

### السبب الجذري
في `pages/FeedEnhanced.jsx` كانت `MediaTile` تستخدم:
```jsx
<video autoPlay muted loop ... />
```
`autoPlay` يجعل المتصفح يحاول تشغيل الفيديو فور mount ويستمر بشكل غير منضبط — وحتى عند خروج الفيديو من الشاشة بالسحب، لا يتوقف تلقائياً.

### الإصلاح
- إزالة `autoPlay` نهائياً.
- إضافة **IntersectionObserver** مع `threshold: 0.6` → الفيديو يبدأ التشغيل فقط عندما يكون **60% منه ظاهراً** في viewport (أي عندما يتوقف المستخدم عليه فعلاً).
- استماع لحدث `visibilitychange` → إيقاف الفيديو عند تبديل التبويب / تصغير المتصفح.
- إيقاف فوري عبر `videoRef.current.pause()` عند السحب لأعلى أو لأسفل.
- إظهار `play overlay` عندما يكون الفيديو غير ظاهر للدلالة على وجود فيديو.

**الملف:** `frontend/src/pages/FeedEnhanced.jsx`

---

## قائمة الملفات المعدّلة

| # | الملف | نوع التعديل |
|---|------|------------|
| 1 | `frontend/src/utils/secureStorage.js` | إعادة كتابة كاملة لدعم UTF-8 |
| 2 | `frontend/src/services/pwaInstallPrompt.js` | تعديل سلوك beforeinstallprompt |
| 3 | `frontend/src/hooks/useFeed.js` | إضافة authReady + refetchOnMount |
| 4 | `frontend/src/pages/FeedEnhanced.jsx` | أزرار مدمجة + IntersectionObserver للفيديو |
| 5 | `frontend/src/styles/feed-actions-compact-v39.css` | **ملف جديد** |
| 6 | `frontend/src/styles/index.css` | إضافة `@import` |

---

## كيفية التحقق بعد النشر

1. **خطأ btoa** → امسح الكاش بالكامل، أعد تسجيل الدخول بحساب اسم مستخدمه عربي → لا يجب أن يظهر أي خطأ.
2. **PWA prompt** → افتح Console، يجب ألا يظهر `NotAllowedError`. زر التثبيت يعمل عند الضغط فقط.
3. **تحميل المنشورات** → سجل دخول، انتقل لصفحة الرئيسية → المنشورات تظهر تلقائياً خلال ثوانٍ بدون الحاجة للنشر.
4. **العداد** → جرّب منشوراً بـ 999+ إعجاب → كل الأزرار تبقى في نفس الصف، زر "حفظ" لا ينزل.
5. **الفيديو** → افتح منشور فيديو، سرّع للأسفل → الفيديو يتوقف فوراً. ارجع وقف فوقه → يبدأ التشغيل تلقائياً.
