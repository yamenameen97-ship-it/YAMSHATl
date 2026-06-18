# 🎯 إصلاح اللمس والسحب على ويب الجوال — v49

## المشكلة المُبلّغ عنها
> "عندما أفتح صفحة الويب للجوال لا يعمل السحب على الشاشات.
> الضغط على الأزرار يعمل، لكن السحب للشاشات لا يعمل."

## السبب الجذري (Root Cause)
بعد فحص دقيق للكود تبيّن وجود **ثلاثة أسباب متراكمة** تمنع السحب العمودي للصفحات:

### 1️⃣ `overflow: hidden` على `<main class="mobile-main-content">`
في `src/layouts/MobileLayout.jsx` كانت الحاوية الرئيسية للمحتوى محدّدة بـ:
```css
.mobile-main-content {
  overflow: hidden;   ← 🚨 يقفل التمرير العمودي بالكامل!
  ...
}
```
هذا يعني أن أي محتوى يتجاوز ارتفاع الشاشة يُقصّ ولا يمكن السحب لرؤيته.

### 2️⃣ `touch-action: none` على `.gesture-container`
في `src/styles/gestureContainer.css`:
```css
.gesture-container { touch-action: none; }
```
هذا يمنع المتصفح من تفسير أي حركة لمس كـ scroll، حتى لو لم يكن المستخدم يسحب عنصراً قابلاً للسحب.

### 3️⃣ `smoothTouchLayer` على `document.documentElement`
في `main.jsx` كان يُلصق 4 معالجات لمس عامة على `<html>`:
```js
smoothTouchLayer.attachToElement(document.documentElement);
```
رغم أنها passive، فهي تتسبب في overhead ملحوظ على أجهزة Android الضعيفة (Redmi Note 8 / Honor / Galaxy A) ويتأخر معها رد فعل المتصفح للسحب.

---

## الإصلاحات المُطبَّقة

### ✅ 1) `src/layouts/MobileLayout.jsx`
- تغيير `overflow: hidden` → `overflow-y: visible; overflow-x: hidden`
- إضافة `touch-action: pan-x pan-y`
- إضافة `-webkit-overflow-scrolling: touch`
- إضافة `min-height: 0` لتمكين flex children من التمرير الداخلي

### ✅ 2) `src/styles/gestureContainer.css`
- تغيير `touch-action: none` → `touch-action: pan-y` (افتراضياً)
- إضافة قاعدة تقفل التمرير **فقط أثناء السحب الفعلي**:
  ```css
  .gesture-container[data-gesture-active="true"],
  .gesture-container.gesture-active { touch-action: none; }
  ```

### ✅ 3) `src/main.jsx`
- **تعطيل** `smoothTouchLayer.attachToElement(document.documentElement)` لمنع المعالجات العامة على `<html>`.
- (المعالجات المحلية داخل المكونات تبقى تعمل بشكل عادي عبر React.)
- تحديث `BUILD_ID` إلى `yamshat-mobile-touch-scroll-fix-v49-0` ليُحدّث الـ Service Worker تلقائياً عند المستخدمين.

### ✅ 4) ملف CSS نهائي جديد: `src/styles/mobile-touch-scroll-final-v49.css`
ملف يحوي قواعد دفاعية شاملة (آخر استيراد في cascade) ليفرض السلوك الصحيح حتى لو أعاد ملف آخر تعريف overflow أو touch-action:

- `html / body / #root`: `touch-action: pan-x pan-y`, `overflow-y: auto/visible`
- `.mobile-main-content`: `overflow-y: visible !important`
- `.ym-ptr-container`: `overflow-y: auto`, `touch-action: pan-y` (التمرير الفعلي يحدث هنا)
- القوائم الأفقية (Stories/Tabs): `touch-action: pan-x`
- منطقة الدردشة: `touch-action: pan-y`
- الأزرار: `touch-action: manipulation` (نقر سريع بدون تأخير 300ms)
- إزالة `pointer-events: none` غير الضرورية
- حماية ضد إضافة `position: fixed` غير المتعمّدة على body

---

## كيف تتحقق من الإصلاح بعد النشر؟
1. افتح الموقع على هاتفك (Chrome Android / Safari iOS).
2. جرّب السحب لأعلى/لأسفل على الصفحة الرئيسية → يجب أن يعمل بسلاسة.
3. جرّب السحب الأفقي على شريط الـ Stories/Tabs → يجب أن يعمل.
4. جرّب الضغط على أي زر → يجب أن يستجيب فوراً (بدون تأخير).
5. جرّب "اسحب لأسفل للتحديث" من أعلى الصفحة → يجب أن يظهر مؤشر التحديث.

## كيف تستعيد سلوك smoothTouchLayer إذا احتجته؟
الكود يبقى موجوداً ولم يُحذف. يكفي إزالة التعليق في `main.jsx`:
```js
smoothTouchLayer.attachToElement(document.documentElement); // أزل التعليق هنا
```
لكن يُنصح بإلصاقه على عنصر محدد بدلاً من الـ root:
```js
smoothTouchLayer.attachToElement(document.querySelector('.specific-gesture-area'));
```

---

## الملفات المعدّلة
| الملف | نوع التعديل |
|------|--------------|
| `frontend/src/layouts/MobileLayout.jsx` | إصلاح CSS داخلي |
| `frontend/src/styles/gestureContainer.css` | تعديل touch-action |
| `frontend/src/styles/mobile-touch-scroll-final-v49.css` | **ملف جديد** |
| `frontend/src/main.jsx` | تعطيل smoothTouchLayer العام + import v49 + رفع BUILD_ID |

---

تم بحمد الله — يام شات v49 🚀
