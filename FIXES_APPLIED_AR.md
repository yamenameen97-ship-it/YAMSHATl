# ✅ الإصلاحات المُطبَّقة على Yamshat — صفحة الريلز

## ملخّص المشاكل التي تم حلها

### 1) إصلاح أخطاء الكونسول الخاصة بـ Service Worker
**الخطأ:**
```
TypeError: Failed to construct 'Response': Response with null body status cannot have body
    at mediaStrategy (sw-pwa-enhanced.js:197:12)
```

**السبب:** كود الـ Service Worker كان يُنشئ `new Response('', { status: 204 })`. حسب
معيار Fetch API، الاستجابات بحالة 204/205/304 **لا يُسمح لها بأن تحمل body** —
حتى لو كان نصاً فارغاً `''`. هذا أدّى لرمي استثناء غير مُعالَج عند كل طلب
يفشل من /uploads/.

**الإصلاح:** استبدال جميع حالات `new Response('', { status: 204 })` بـ
`new Response(null, { status: 204 })` في:
- `frontend/public/sw-pwa-enhanced.js`
- `frontend/dist/sw-pwa-enhanced.js`

(ثلاث مواضع في الدالة `mediaStrategy`)

### 2) شيل الشعار العائم فوق فيديو الريل
**السبب:** عندما يفشل تحميل فيديو من /uploads/ (404)، كانت `mediaStrategy`
تُعيد شعار Yamshat كـ fallback في بعض الحالات، مما يجعل شعار العلامة التجارية
يظهر فوق إطار الفيديو الأسود.

**الإصلاح:** في `mediaStrategy`، استثناء أي مسار يبدأ بـ `/uploads/` من منطق
الـ logo fallback. الآن طلبات /uploads/ المفقودة تُرجع 204 صامتة بدلاً من
صورة الشعار، فلا يظهر أي شعار عائم فوق الفيديو.

### 3) إظهار الهيدر العلوي والسفلي في صفحة الريلز
**السبب:** صفحة `Reels.jsx` كانت تستدعي `<MainLayout hideNav>` ممّا يخفي:
- الهيدر العلوي (MobileTopBar)
- شريط التنقّل السفلي (BottomNav)

**الإصلاح:** إزالة `hideNav` من `<MainLayout>` في:
- `frontend/src/pages/Reels.jsx`
- `frontend/dist/chunks/Reels-B-huy0aZ.js` (نسخة البناء)

**تعديل تكميلي:** تحديث `.reels-page-shell` لاستخدام:
```css
height: calc(100dvh - var(--yam-top-chrome-height, 60px) - var(--yam-bottom-chrome-height, 70px));
```
بدل `100vh` حتى لا يتقاطع المحتوى مع الهيدر/الفوتر العائمَين.

## الملفات المُعدَّلة
| الملف | نوع التعديل |
| --- | --- |
| `frontend/public/sw-pwa-enhanced.js` | إصلاح 204 + استثناء /uploads/ من logo fallback، رفع نسخة SW إلى 1.0.3 |
| `frontend/dist/sw-pwa-enhanced.js` | نفس الإصلاح (نسخة البناء) |
| `frontend/src/pages/Reels.jsx` | إزالة hideNav + ضبط ارتفاع المسرح |
| `frontend/dist/chunks/Reels-B-huy0aZ.js` | نفس الإصلاحَين في نسخة البناء |

## ملاحظات مهمة عند النشر
1. **بعد رفع الإصدار الجديد**، يجب على المستخدم تحديث الصفحة (أو إعادة فتح
   التطبيق) حتى يتم تنزيل الـ Service Worker الجديد. زيادة `SW_VERSION` من
   `1.0.2` إلى `1.0.3` تضمن إعادة تثبيت الـ SW تلقائياً.
2. **ملفات البناء (`dist/`) سليمة وغير محذوفة** — تم تعديل ملفّين فقط بداخلها
   مع المحافظة على بقية الـ chunks وأصول البناء.
3. **لا يحتوي المشروع على node_modules** كما هو مطلوب.
