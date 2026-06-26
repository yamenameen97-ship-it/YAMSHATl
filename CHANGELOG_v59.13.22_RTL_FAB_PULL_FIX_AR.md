# YAMSHAT — تحديث v59.13.22 (RTL + FAB + Pull-Anywhere Fix)

## 🎯 ملخص الإصلاحات الأربعة

### 1️⃣ شريط التصفية يهرب نحو اليسار (الكل/المجموعات/الستوري/الوسائط)
**المشكلة:** الشريط كان يبدأ من اليسار، وزر "الكل" النشط يخرج خارج حدود الشاشة من اليمين.

**السبب الجذري:** `styles/mobile-pixel-perfect-v47-9.css:116` كان يفرض:
```css
.ym-filters { direction: ltr !important; }
```
هذه القاعدة كانت تكسر RTL وتنعكس مع `justify-content: flex-start` فيُدفع المحتوى لليسار.

**الحل:** حذف القاعدة من v47-9.css نهائياً، والإبقاء على RTL في:
- `MobileFilterPills.jsx` (`dir="rtl"` + `direction: rtl`)
- `yamshat-fixes-v59.13.1.css` (تأكيد `direction: rtl !important`)

---

### 2️⃣ مربع "بماذا تفكر؟" يُسحب نحو اليسار
**المشكلة:** الصندوق كان يظهر مدفوعاً لليسار بدلاً من ملء العرض، والترتيب البصري معكوس.

**السبب:** نفس المصدر — قاعدة `direction: ltr !important` كانت تنطبق على حاويات composer.

**الحل:**
- ملف `yamshat-fixes-v59.13.1.css` يفرض RTL على `.ym-composer-wrap`, `.ym-composer`, `.ym-composer-input`.
- الترتيب الصحيح الآن (RTL، يمين → يسار): شعار Y → "بماذا تفكر؟" → أيقونات (🖼️ GIF ☺).

---

### 3️⃣ زر الرفع (+) في الشريط السفلي "هارب بكل الصفحات"
**المشكلة:** زر (+) كان يظهر:
- إما مسطّحاً 34×28 بدون النص "منشور جديد"
- أو يتمدّد للأسفل ويختفي تحت شريط النظام
- أو لا يظهر نصه مثل جيرانه (الرئيسية، الدردشات، الريلز، حسابي)

**السبب:** ملف `yamshat-fixes-v59.13.1.css` القديم كان يفرض:
```css
.ym-nav-icon--create { width: 34px !important; height: 28px !important; }
```
بينما `BottomNav.jsx` v59.13.21 يستخدم 54×54 دائري FAB مرفوع بـ `margin-top: -22px`.

**الحل:** إعادة كتابة كاملة لقواعد `.ym-nav-icon--create` في `yamshat-fixes-v59.13.1.css`:
- 54×54 دائري مع حدود غامقة (3px solid #0A0D1A)
- gradient بنفسجي ولمعان (box-shadow)
- `margin-top: -22px` لرفع FAB فوق الشريط
- النص "منشور جديد / إنشاء / ريلز جديد / دردشة جديدة" يظهر بنفس حجم بقية الـ labels
- تكييفات متّسقة لكل الشاشات (400px, 360px, 320px, 393px Redmi)

---

### 4️⃣ السحب يعمل فقط من حواف الشاشة (المنتصف لا يستجيب)
**المشكلة المزمنة:** PTR (اسحب للتحديث) كان يعمل فقط عند السحب من الحواف الفارغة (يمين/يسار/أسفل الشريط)، أما من منتصف الشاشة على البطاقات والصور والنصوص فلا شيء يحدث.

**السبب الجذري:**
- في v59.13.20 كانت معالجات touch مُلصقة على `main.mobile-main-content` فقط.
- أي عنصر فرعي (post-card, image, video) يستخدم `stopPropagation` أو touch-action مخالف كان يستهلك الحدث **قبل** وصوله إلى main → السحب لا يعمل من فوقها.

**الحل في v59.13.22:**

#### أ) ملف `hooks/usePullToRefresh.js` — إعادة كتابة شاملة:
```js
// ⭐ الآن المعالجات على document مع capture:true
const target = document;
target.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
target.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
```
- `target=document`: يضمن استلام الحدث قبل أي child.
- `capture:true`: نلتقط في مرحلة capture قبل أن يستهلكها أي عنصر فرعي.
- نضيف فحص `isPointInsideScrollArea` للتأكد أن نقطة البدء داخل main.
- نضيف فحص `isInsideInteractiveOverlay` لتجاهل: modals, drawers, inputs, video, horizontal scrollers (الفلاتر، الستوري).

#### ب) ملف `styles/mobile-pull-fix-v59.13.20.css` — قواعد دعم:
```css
main.mobile-main-content *:not(button):not(a)...:not(video):not(.ym-filters)... {
  touch-action: pan-y pinch-zoom; /* لا child يمنع التمرير العمودي */
}
main.mobile-main-content .ym-filters { touch-action: pan-x; } /* الفلاتر تظل أفقية */
main.mobile-main-content video { touch-action: manipulation; }
```

**النتيجة:** السحب يعمل الآن من **أي موضع** في الصفحة (بطاقة منشور، صورة، نص، فيديو، فراغ...) ما دامت الصفحة في القمة (`scrollTop === 0`).

---

## 📁 الملفات المعدّلة

| الملف | نوع التغيير |
|---|---|
| `frontend/package.json` | bump إلى 59.13.22 |
| `frontend/src/styles/mobile-pixel-perfect-v47-9.css` | حذف `.ym-filters { direction: ltr !important }` و `.ym-bottomnav-inner { direction: ltr !important }` |
| `frontend/src/styles/yamshat-fixes-v59.13.1.css` | إعادة كتابة شاملة — RTL + FAB دائري بارز 54×54 |
| `frontend/src/hooks/usePullToRefresh.js` | معالجات على `document` بـ `capture:true` + فحوصات interactive overlay |
| `frontend/src/styles/mobile-pull-fix-v59.13.20.css` | قواعد touch-action لجميع أبناء main |

---

## 🧪 كيفية اختبار النتيجة

1. افتح الموقع على جوال (أو DevTools → Toggle device toolbar)
2. **اختبر شريط التصفية:** يجب أن تكون "الكل" (نشط، بنفسجي) في **أقصى اليمين** والوسائط في أقصى اليسار.
3. **اختبر "بماذا تفكر؟":** الصندوق يملأ العرض، الشعار Y على اليمين، الأيقونات (☺ GIF 🖼️) على اليسار، والنص "بماذا تفكر؟" في الوسط.
4. **اختبر زر (+):** يظهر دائري بارز فوق الشريط، بـ gradient بنفسجي ولمعان، مع النص "منشور جديد" (أو حسب الصفحة) أسفله مثل جيرانه.
5. **اختبر السحب:** ضع إصبعك على **بطاقة منشور في المنتصف** واسحب لأسفل. يجب أن يظهر مؤشر التحديث ويعمل التحديث.

---

## ✨ ملاحظة للنشر

لا حاجة لتغييرات في الخادم. مجرد build للفرونت ونشره:
```bash
cd frontend && npm run build
# الخرج في frontend/dist
```
