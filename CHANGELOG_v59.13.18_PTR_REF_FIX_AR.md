# 📜 سجل التغييرات — v59.13.18

## 🎯 الإصلاح الجذري لمشكلة "السحب لا يعمل بين الصفحات"

### المشكلة (كما شخّصها المستخدم)
كان `usePullToRefresh` يعتمد على `document.querySelector('main.mobile-main-content')`
لإيجاد حاوية التمرير. هذا الأسلوب كان هشّاً ويسبّب فشل السحب في صفحات
معيّنة لأسباب متعدّدة:

1. **الـ DOM قد لا يكون جاهزاً** وقت تشغيل الـ `useEffect`.
2. **تغيير أسماء CSS classes** كان يكسر السحب بصمت تام.
3. **بعض الصفحات تستخدم حاويات تمرير داخلية** مختلفة عن `main.mobile-main-content`.
4. **التعارض بين `MainLayout` و `usePullToRefresh`** كان يجعل الـ Hook
   يعترض حركة الإصبع (`touchmove`) على عنصر خاطئ.

### الحل الجذري المطبَّق
استبدال نظام البحث في الـ DOM بنظام **تمرير مرجع مباشر** (`mainRef`)
من `MainLayout` إلى `usePullToRefresh` عبر `PullToRefresh`.

---

## 📁 الملفات المعدَّلة

### 1) `frontend/src/hooks/usePullToRefresh.js`
- ✅ أضيف parameter جديد: `scrollContainerRef`
- ✅ منطق جديد `resolveScrollContainer()`:
  - **الأولوية المطلقة** للـ ref الخارجي إن مُرِّر.
  - يتحقّق ذكياً: إن كان عنصر الـ ref نفسه ليس قابلاً للتمرير
    (`overflow:hidden`)، يبحث في أبنائه أولاً، ثم يقع على `window`.
- ✅ Legacy fallback محفوظ للتوافق العكسي مع أي مكوّن لم يُحدَّث بعد.
- ✅ Helper `isScrollable(el)` لفحص قابلية التمرير بشكل آمن.

### 2) `frontend/src/components/common/PullToRefresh.jsx`
- ✅ أضيف prop جديد: `scrollContainerRef`
- ✅ يمرَّر مباشرة إلى `usePullToRefresh`.
- ✅ لا تغيير في الشكل أو الـ API الخارجي للمستخدمين الحاليين.

### 3) `frontend/src/layouts/MobileLayout.jsx`
- ✅ ينشئ `mainRef = useRef(null)`.
- ✅ يربطه بـ `<main className="mobile-main-content" ref={mainRef}>`.
- ✅ يمرّره إلى `<PullToRefresh scrollContainerRef={mainRef}>`.

### 4) `frontend/src/layouts/DesktopLayout.jsx`
- ✅ نفس النمط: `mainRef` على `<main>` ثم تمريره إلى `PullToRefresh`.
- ✅ بما أن `desktop-main-content` لديه `overflow: hidden`، يكتشف الـ hook
  ذلك تلقائياً ويعود إلى `window` (السلوك الصحيح للديسكتوب).

### 5) `frontend/package.json`
- ✅ رفع الإصدار من `59.13.17` إلى `59.13.18`.

---

## ✅ النتيجة المتوقَّعة
- **السحب يعمل في جميع صفحات YamShat بدون استثناء.**
- لا اعتماد على أسماء CSS classes أو بنية صفحة محدّدة.
- إذا تغيّرت بنية أي صفحة في المستقبل، السحب يبقى يعمل ما دامت
  `MainLayout` تمرّر `mainRef`.
- الـ Legacy fallback يضمن عدم كسر أي مكوّن قديم.

## 🧪 الصفحات المتأثّرة (يجب اختبارها)
- الرئيسية (Feed)
- المنشورات
- الستوريز (داخل الصفحة، ليس المشغّل)
- الإشعارات
- الملف الشخصي
- المجموعات
- الإعدادات
- صفحات الإدارة (Admin)

## 🚫 الصفحات المُستثناة (سلوك مقصود — لم يتغيّر)
- `/reels` و `/reels/*` (snap عمودي)
- `/chat` و `/inbox` (تعارض مع لوحة المفاتيح)

---

**التاريخ:** 2026-06-25
**الإصدار:** v59.13.18
**نوع الإصلاح:** إصلاح جذري للبنية (Architectural Fix)
