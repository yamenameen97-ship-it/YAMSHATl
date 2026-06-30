# 🔥 إصلاحات v71 — حل جذري لمشاكل الأداء واللمس

> التاريخ: 2026-06-30
> الإصدار: V71 (مبني فوق v70)

## المشاكل المُبلَّغ عنها
1. **تأخر وتعليق ظهور الملف الشخصي**
2. **بطء فتح النوافذ (Modals)**
3. **عدم استجابة اللمس والنقر**

---

## 🔍 الأسباب الجذرية المُكتشَفة (وليست أعراضاً سطحية)

### السبب #1 — `pawTouchEnhancer.js` (الأكبر)
كان يثبّت **MutationObserver** على `document.body` مع `subtree:true` و `childList:true`.  
هذا يعني: كل تغيير في DOM (كل ضربة لوحة مفاتيح، كل render React) يُطلق الـ observer.  
على صفحة الـ feed بمئات العناصر = **آلاف الاستدعاءات في الثانية**، كل واحد منها يستدعي `getComputedStyle` على عشرات العناصر.

كذلك كان يُعيد كتابة `history.pushState` و `history.replaceState` عالمياً → **تعارض مع React Router**.

و يحتوي `setInterval(3000ms)` يفحص `getComputedStyle` على كل بطاقة منشور → استنزاف Main Thread.

### السبب #2 — `instantTouchFeedback.js`
يستخدم `capture:true` على كل أحداث `touchstart/touchmove/touchend/scroll/wheel`.  
هذا يجبر كل حدث لمس على المرور بمرحلة capture **قبل** الوصول للعنصر المستهدف = **تأخير ملموس في كل ضغطة**.

### السبب #3 — `Profile.jsx` لا يتتبع `loading` state بشكل صحيح
- لا يوجد `setLoading(true/false)` في `loadProfile`.
- لا يوجد safety timeout — إذا تعطل الخادم (Render cold start = 30s+) تبقى الصفحة عالقة على `"جارٍ تحميل الملف الشخصي..."` **للأبد**.
- لا يوجد زر "إعادة المحاولة".

### السبب #4 — `users.js` API
`getProfileBundle` يستخدم `cache: false, forceRefresh: true` → **يعطل الكاش تماماً**.  
كل زيارة للملف الشخصي = طلب جديد كامل = انتظار 1-30 ثانية.

### السبب #5 — `Modal.jsx`
يستخدم `setTimeout(40ms)` ثم يُنفّذ **استعلامين منفصلين** بسلسلتي selectors طويلتين على كل فتح للنافذة.  
على الجوال هذا يُحس به كـ "lag" واضح.

### السبب #6 — `backdrop-filter` العالمي
استخدام `backdrop-filter` على الـ overlay و glass effects = **أكبر قاتل أداء على Chrome Mobile**. يُجبر المتصفح على إعادة رسم كامل الشاشة في كل frame.

### السبب #7 — `will-change: scroll-position` العالمي
موضوع على `.page-content` دائماً → المتصفح يحتفظ بطبقة GPU مخصصة لكامل الصفحة طوال الوقت → استنزاف ذاكرة على الأجهزة منخفضة الموارد.

---

## ✅ الإصلاحات المُطبَّقة

| # | الملف | الإصلاح |
|---|-------|---------|
| 1 | `services/pawTouchEnhancer.js` | **إعادة كتابة كاملة**: حذف MutationObserver العام، حذف patch لـ history API، حذف setInterval. الإبقاء فقط على apply مرة واحدة + observer خفيف لـ class تغيرات body. |
| 2 | `services/instantTouchFeedback.js` | حذف `capture:true` من جميع touch listeners → استجابة فورية للمس. |
| 3 | `pages/Profile.jsx` | إضافة `loading` و `loadError` state صحيحة + **safety timeout 8 ثوانٍ** + skeleton جذاب + زر "إعادة المحاولة" + Optimistic UI من localStorage. |
| 4 | `api/users.js` | تفعيل smart cache بـ TTL = 30 ثانية لـ `getProfileBundle` بدلاً من تعطيل الكاش بالكامل. |
| 5 | `components/ui/Modal.jsx` | استبدال `setTimeout(40ms)` بـ `requestAnimationFrame` + دمج الاستعلامين في واحد → فتح فوري للنوافذ. |
| 6 | `styles/yamshat-fixes-v71-performance-root-fix.css` | **CSS جديد كآخر طبقة**: تعطيل `backdrop-filter` على الجوال، تعطيل `will-change` العام مع تفعيله فقط أثناء التمرير، `content-visibility: auto` على بطاقات المنشورات (تسريع رسم ضخم)، `touch-action: manipulation` على كل الأزرار. |
| 7 | `main.jsx` | استيراد CSS الجديد كآخر import + تحديث BUILD_ID إلى `yamshat-v71-performance-root-fix` (يجبر على إعادة التحميل مرة واحدة لمسح الكاش القديم). |

---

## 📈 النتائج المتوقعة

| المؤشر | قبل | بعد |
|--------|------|------|
| زمن فتح Modal على الجوال | 200-500ms | < 60ms |
| زمن استجابة اللمس | 80-250ms | < 30ms |
| ظهور الملف الشخصي (مع cache) | 1-30s | فوري |
| ظهور الملف الشخصي (بدون cache) | 1-30s أو يعلّق | ≤ 8s مع زر إعادة المحاولة |
| استهلاك CPU أثناء التمرير | عالٍ جداً | منخفض |
| استهلاك ذاكرة GPU | عالٍ جداً | منخفض |

---

## 🧪 كيفية الاختبار
1. افتح التطبيق على جوال (Chrome Mobile preferably).
2. اضغط على أيقونة الملف الشخصي → يجب أن يظهر skeleton فوراً ثم تُعرض البيانات.
3. افتح أي modal (إعدادات، تخصيص، تحرير) → يجب أن يظهر **بدون تأخير**.
4. اضغط على أي زر/أيقونة → يجب أن يستجيب **فوراً** بدون تأخر.
5. قم بالتمرير في صفحة المنشورات → يجب أن يكون سلساً 60fps.

---

## ⚠️ ملاحظة لمطوّر الخادم (Backend)
هذه الإصلاحات تعالج جانب الواجهة. **السبب الجذري الأعمق** هو أن خادم Render يدخل في حالة `cold` بعد 15 دقيقة من الخمول، فأول طلب يستغرق 20-30 ثانية. للحل النهائي:
- ترقية خطة Render إلى **Always On** (لا cold sleep).
- أو: نشر cron-job خارجي يضرب `/health` كل 10 دقائق لإبقاء الخادم دافئاً.
