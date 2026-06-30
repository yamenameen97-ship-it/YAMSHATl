# 🔥 YAMSHAT v74 — إصلاح جذري نهائي لمشكلتي الستوري والريلز

## 🔴 شكاوى المستخدم

1. **صفحة الستوري الرئيسية:** "في الصفحة الرئيسية للستوري على الشاشات الصغيرة تظهر الستوريات محشورة تحت الشريط العلوي للصفحة، اسحبه ليظهر تحت الشريط بمسافة فوق منتصف الصفحة."
2. **التعليق على الريلز:** "مشكلة التعليق على الريلز لم تظهر منطقة كتابة التعليق، هاربة لتحت — اسحب صندوق التعليق للأعلى."

> الإصلاحات في v73 لم تكن كافية. هذا الإصدار v74 يحلّ المشكلتين بشكل جذري.

---

## 🔬 السبب الجذري

### 1) الستوري — `margin-bottom: 28px` لم يكن كافيًا لإنزال الفقاعات
- في v73 جُعل `.yam-stories-tabs` بـ `margin-bottom: 28px` فقط، وأُعطي `.yam-stories-freeflow` بـ `padding-top: 24px` + `margin-top: 8px`.
- على شاشات الجوال الصغيرة (Xiaomi/Redmi مثل صورة المستخدم)، النتيجة الإجمالية: الفقاعة الأولى تجلس على بُعد ~50px تحت الأزرار. هذا غير كافٍ والمستخدم يراها "محشورة" تحت الشريط العلوي.
- المطلوب: مسافة بصرية كبيرة تجعل الفقاعات تظهر فوق منتصف الصفحة، لا تحت الأزرار مباشرة.

### 2) الريلز — البانل كان يصل لأسفل الشاشة فيختفي تحت BottomNav
- في v73، `.ym-reels-drawer-panel` ارتفاعه `72dvh` و`.ym-reels-drawer-input` بـ `padding-bottom: calc(12px + safe-area-inset-bottom)`.
- المشكلة: الـ `align-items: flex-end` يضع البانل ملتصقًا بقاع الشاشة. شريط الإدخال داخل البانل يكون عند `bottom=0` من الـ viewport، لكن BottomNav (z-index ~1001-1003) يقف فوقه بـ ~64-72px → الشريط يختفي خلف BottomNav.
- `safe-area-inset-bottom` على الأجهزة بدون نتوء (notch) = 0px، فالـ padding المضاف من v73 (`12px`) لا يكفي لرفع شريط الإدخال فوق BottomNav بارتفاعه الفعلي 64-72px.

---

## ✅ الحلول الجذرية في v74

### Fix #1 — `pages/Reels.jsx` (درج التعليقات)

**التغيير الأساسي:** نقل مسؤولية الرفع فوق BottomNav من شريط الإدخال إلى **الحاوية كلها** `.ym-reels-drawer`.

```css
.ym-reels-drawer {
  position: fixed;
  inset: 0;
  z-index: 2147483600;
  display: flex;
  align-items: flex-end;
  /* ✅ v74: padding-bottom على الحاوية يدفع البانل بأكمله فوق BottomNav */
  padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px));
}

.ym-reels-drawer-panel {
  height: 60dvh;
  max-height: 60dvh;
  min-height: 320px;
  /* لا حاجة لـ safe-area هنا، الحاوية الأم تتكفّل */
}

.ym-reels-drawer-input {
  padding: 14px 14px;
  /* لا حاجة لـ safe-area هنا، البانل بأكمله مرفوع */
  position: relative;
  z-index: 2;
}
```

**النتيجة:** البانل بأكمله يجلس فوق BottomNav بفاصل 70px+safe-area، وشريط الإدخال جزء طبيعي من الـ flex column في أسفل البانل، مرئي دائمًا.

---

### Fix #2 — `pages/stories/StoriesPage.jsx` (فقاعات الستوري)

**التغيير الأساسي:** استبدال `margin-bottom + padding-top` الصغيرة بـ `margin-top` ديناميكي يعتمد على ارتفاع الشاشة (`vh`).

```css
.yam-stories-tabs {
  /* أزلنا margin-bottom: 28px لأن .yam-stories-freeflow يتولى الفصل */
  margin-bottom: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.yam-stories-freeflow {
  /* ✅ v74: margin-top بـ clamp يضع الفقاعات فوق منتصف الصفحة */
  /* على الجوال (شاشة ~700-900px): margin-top يصبح ~126-162px = ~18% من ارتفاع viewport */
  /* هذا يضع الفقاعات تقريبًا عند ~25-30% من أعلى الشاشة (فوق المنتصف بمسافة جيدة) */
  margin-top: clamp(60px, 18vh, 160px);
  padding: 0 4px 24px;
}

@media (min-width: 768px) {
  .yam-stories-freeflow { margin-top: clamp(40px, 8vh, 80px); }
}

@media (min-width: 1280px) {
  .yam-stories-freeflow { margin-top: clamp(32px, 5vh, 60px); }
}
```

**النتيجة:**
- على شاشات الجوال الصغيرة (مثل Redmi في صورة المستخدم، ~720x1600px): الفقاعات تنزل بـ ~145-160px تحت الأزرار → تظهر تقريبًا في الثلث الأعلى من الصفحة، فوق المنتصف بمسافة واضحة.
- على التابلت والديسكتوب: المسافة أقل (لأن الشاشة عريضة وكل المحتوى مرئي بدون حاجة لإنزال كبير).

---

## 🧪 محصلة الإصلاحات

| الشاشة | قبل v74 | بعد v74 |
|--------|---------|---------|
| **الستوري (جوال)** | الفقاعات ملتصقة تحت أزرار التبويبات (50px فقط) | الفقاعات تنزل ~145-160px لتجلس فوق منتصف الصفحة (طلب المستخدم) |
| **الريلز (جوال)** | شريط الإدخال "اكتب تعليقك…" مخفي خلف BottomNav | شريط الإدخال مرئي بالكامل فوق BottomNav بفاصل 70px |

---

## 📦 إصدار البناء
- **النسخة**: `74.0.0`
- **اسم الحزمة**: `yamshat-frontend`
- **الملفات المعدّلة**:
  - `frontend/src/pages/Reels.jsx`
  - `frontend/src/pages/stories/StoriesPage.jsx`
  - `frontend/package.json`
