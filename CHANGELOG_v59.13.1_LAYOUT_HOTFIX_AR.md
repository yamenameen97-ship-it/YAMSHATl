# 🩹 YAMSHAT v59.13.1 — Layout Hotfix (Composer + Filters + Bottom + Button)

## الهدف
إصلاح ثلاث مشاكل بصرية ظهرت في v59.13 بسبب تراكب طبقات CSS قديمة على
المكوّنات الجديدة (BottomNav الجديد + MobileFilterPills + MobileComposer).

## المشاكل التي تم حلّها

### ✅ 1) زر الإنشاء (+) في الشريط السفلي
- **العَرَض**: الزر يتمدّد لأسفل ويختفي نصّه "منشور جديد" أسفل الشاشة في كل صفحة.
- **السبب الجذري**:
  - `mobile-yamshat-redesign.css` كان يفرض على `.ym-bottomnav-inner` أن يكون
    `display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr;` وهو تخطيط
    قديم يتعارض مع flex الجديد في `BottomNav.jsx`.
  - `mobile-pixel-perfect-v47-9.css` كان يفرض `direction: ltr !important`
    على `.ym-bottomnav-inner` فيكسر ترتيب RTL.
  - بقايا كلاس `.ym-nav-plus` (الإصدار القديم) ما زالت موجودة بالـ CSS وقد
    تُطبَّق إن وُجدت بأي خطأ في DOM.
- **الإصلاح**: استعادة Flex بالقوة، إلغاء grid القديم، استعادة `direction: rtl`،
  ضمان `flex: 1 1 0` لكل العناصر بما فيها الزر المركزي، وإخفاء كلاسات الإصدار
  القديم `.ym-nav-plus*`.

### ✅ 2) أزرار التصفية (الكل / المجموعات / الستوري / الوسائط)
- **العَرَض**: الأزرار تظهر مدفوعة لجهة اليسار بدل اليمين (الترتيب العربي الصحيح).
- **السبب الجذري**: `mobile-pixel-perfect-v47-9.css` كان يحوي:
  ```css
  .ym-filters { direction: ltr !important; }
  ```
  وهذا يُلغي `direction: rtl` المضبوط في `MobileFilterPills.jsx`.
- **الإصلاح**: فرض `direction: rtl !important` على `.ym-filters` و
  `.ym-filters-container`، مع `justify-content: flex-start` (= البدء من اليمين
  في RTL).

### ✅ 3) صندوق "بماذا تفكر؟" (Composer)
- **العَرَض**: الصندوق يظهر ضيقاً ومدفوعاً لليسار بدل ملء العرض.
- **السبب الجذري**: نفس عائلة الفرض LTR + بقايا قواعد قديمة من
  `mobile-yamshat-redesign.css` على `.ym-composer`.
- **الإصلاح**: فرض `width: 100%`، `direction: rtl`، `flex-direction: row` على
  المكوّن، وإعطاء `flex: 1 1 auto` لمربع النص ليأخذ كل المساحة المتبقية.

## آلية الإصلاح (تقنياً)

تم إنشاء ملف CSS جديد:
```
frontend/src/styles/yamshat-fixes-v59.13.1.css
```
يُستورد كآخر CSS في `main.jsx` (بعد كل ملفات v59.12 وما قبلها) ليفوز في
سلسلة الـ cascade.

```js
import './styles/yamshat-fixes-v59.13.1.css';
```

## ملفات تم تعديلها
- ➕ `frontend/src/styles/yamshat-fixes-v59.13.1.css` (جديد)
- ✏️ `frontend/src/main.jsx` (أُضيف import واحد فقط)

## ملفات لم تُلمس
- `BottomNav.jsx` — يبقى كما هو (المنطق سليم، المشكلة كانت في CSS الخارجي فقط)
- `MobileComposer.jsx` — يبقى كما هو
- `MobileFilterPills.jsx` — يبقى كما هو

## التحقق
1. افتح الصفحة الرئيسية على جوال (Redmi Note 8 أو أي شاشة 360-400px):
   - ✅ صندوق "بماذا تفكر؟" يملأ كامل العرض.
   - ✅ أزرار التصفية تبدأ من اليمين، "الكل" (النشط) في أقصى اليسار.
   - ✅ زر (+) في الوسط بشكل كبسولة بنفسجية، تحته نص "منشور جديد" واضحاً.

2. تنقّل بين الصفحات (الرئيسية / الدردشات / الريلز / المجموعات / حسابي):
   - ✅ الشريط السفلي ثابت ومحاذٍ صحيح في كل الصفحات.
   - ✅ نص زر (+) يتغيّر حسب الصفحة دون تمدّد للأسفل.
