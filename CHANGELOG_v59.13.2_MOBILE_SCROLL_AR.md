# 🛠️ YAMSHAT v59.13.2 — إصلاح حرج: عدم استجابة الصفحات للسحب على الجوال

> **التقرير المُبلَّغ من المستخدم:**
> «صفحات الويب لا تستجيب للسحب على شاشة جوالي عند فتحها بويب للجوال أو بتجربة PWA.»

---

## 🔬 التشخيص الجذري (Root Cause Analysis)

### السبب الأول — تعارض overflow بين CSS و Layout JSX

منذ الإصدار **v59.10** تم تطبيق فلسفة "الدرّاور" على كل الصفحات عبر الملف:
```
src/styles/drawer-style-touch-final-v59.10.css
```

هذا الملف يفرض:
```css
html, body { overflow: hidden !important; height: 100% !important; }
#root      { overflow: hidden !important; height: 100dvh !important; }
```

ويفترض أن **`.page-content`** هي الحاوية الوحيدة المتمرّرة. لكن المكوّن
`MobileLayout.jsx` **لا يستخدم** هذا الـ class بل:
```
.mobile-layout-container > main.mobile-main-content
```

والإعدادات `inline` لهذين الكلاسين كانت لا تزال على نموذج **v57**:
```css
overflow-y: visible;  /* يعتمد على scroll الـ body */
min-height: 100vh;
```

🚨 **النتيجة:** الـ body مقفول، لكن الـ Layout يفترض أن الـ body يتمرّر →
**لا توجد حاوية صالحة للتمرير**.

ولزيادة الطين بِلّة، `drawer-style-touch-final-v59.10.css` يضع:
```css
.mobile-main-content, .mobile-layout-container {
  overflow-y: auto !important;
}
```
على **كلا** الحاويتين دفعةً واحدة → حاويتان متمرّرتان متداخلتان (parent + child)
**بدون** `min-height: 0` على الـ flex item → flexbox لا يسمح للابن بالتقلّص
دون ارتفاع محتواه → **التمرير معطّل فعلياً**.

---

### السبب الثاني — Pull-to-Refresh يخنق أحداث اللمس

الملف `src/hooks/usePullToRefresh.js` (نسخة v57) يستمع لأحداث اللمس على
`window` بـ `passive: false` ويفحص الموقع عبر:
```js
const getScrollTop = () => window.scrollY || document.documentElement.scrollTop || 0;
```

لكن بما أن `body` و `#root` مقفولان `overflow: hidden` منذ v59.10، فإن:
```
window.scrollY  ===  0   (دائماً!)
```

🚨 **النتيجة:** الـ hook يعتقد أن المستخدم في قمة الصفحة في كل لمسة، فيدخل في
وضع "السحب المُحتمل للتحديث" ويستدعي `preventDefault()` على `touchmove` →
**يمنع التمرير الفعلي داخل `main.mobile-main-content`**.

هذا هو السبب الأكثر إيلاماً: لا يبدو أن السحب يفعل أي شيء على الإطلاق.

---

## ✅ الإصلاح (3 ملفات)

### 1) ➕ ملف CSS جديد — `mobile-scroll-final-v59.13.2.css`

ملف CSS طبقة-نهائية (آخر import بعد v59.13.1) يفعل التالي:

| المنطقة | القاعدة | الهدف |
|--------|---------|------|
| `html`, `body` | `overflow: hidden`, `height: 100%`, `overscroll-behavior: contain` | تثبيت أساس الشاشة بدون تمرير |
| `#root` | `height: 100dvh`, `overflow: hidden`, `display: flex` | حاوية flex لـ Layout |
| `.mobile-layout-container` | `height: 100dvh`, `overflow: hidden`, **لا padding** | تثبيت الإطار فقط — لا تمرير |
| `main.mobile-main-content` | `flex: 1 1 auto`, **`min-height: 0`**, `overflow-y: auto`, `padding-top: 56px`, `padding-bottom: 70px+safe-area` | ⭐ **الـ scroll container الوحيد** بين TopBar و BottomNav |
| `.ym-ptr-container` | `overflow: visible`, `touch-action: pan-y` | شفّاف للتمرير، لا يحجب |
| الصفحات الفرعية | `overflow: visible`, `touch-action: pan-y` | تنساب طبيعياً داخل main |
| Reels | `:has()` لاستثناء صفحة الريلز (snap داخلي) | تمرير snap يبقى يعمل |

### 2) ✏️ تعديل `usePullToRefresh.js` — Scroll-Container Aware

تحديث الـ hook ليكتشف الـ scroll container الفعلي بدلاً من الافتراض الأعمى أن
`window` هو المتمرّر:

```js
const findScrollContainer = () => {
  // 1) أولاً: ابحث مباشرة عن main.mobile-main-content (سيناريو الجوال)
  const mainEl = document.querySelector('main.mobile-main-content, .mobile-main-content');
  if (mainEl) {
    const style = window.getComputedStyle(mainEl);
    if (/(auto|scroll)/.test(style.overflowY)) return mainEl;
  }

  // 2) ثانياً: اصعد من containerRef لأعلى بحثاً عن أوّل overflow:auto/scroll
  let node = containerRef.current;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }

  // 3) Fallback إلى window (سلوك Desktop القديم)
  return null;
};

// المستمعون يُركَّبون على scrollContainer أو window
const target = scrollContainer || window;
target.addEventListener('touchmove', onTouchMove, { passive: false });
```

و `getScrollTop()` يقرأ من `scrollContainer.scrollTop` بدلاً من `window.scrollY`.

🎯 **الأثر:** على الجوال، الـ hook يقيس scroll الحقيقي لـ `main`. الآن
`preventDefault()` لا يُستدعى إلا عندما يكون المستخدم **فعلاً** في قمة `main`
ويسحب للأسفل — التمرير الطبيعي يعمل بلا خنق.

### 3) ✏️ تعديل `MobileLayout.jsx` — مزامنة inline styles مع نموذج v59.13.2

- إزالة `min-height: 100vh` المتعارض من `.mobile-layout-container`.
- تعيين `height: 100dvh` و `overflow: hidden` على الحاوية الأم.
- نقل `padding-top: 56px` و `padding-bottom: calc(70px + safe-area)` من
  الحاوية إلى `main.mobile-main-content` (حيث يحدث التمرير).
- إضافة **`min-height: 0`** الحرجة على main لجعل flex overflow يعمل.
- تأكيد `overflow-y: auto` و `touch-action: pan-y pinch-zoom` على main.

### 4) ✏️ تعديل `main.jsx`

إضافة import واحد جديد كآخر CSS:
```js
import './styles/mobile-scroll-final-v59.13.2.css';
```

---

## 🧪 خطوات التحقق

افتح التطبيق على جوال (Chrome Mobile + PWA installed)، وعلى كل صفحة من التالي:

| الصفحة | المتوقع |
|-------|---------|
| الرئيسية (Feed) | ✅ السحب لأعلى/أسفل يعمل بسلاسة، Pull-to-Refresh من القمة |
| الإشعارات | ✅ تمرير قائمة الإشعارات بسلاسة |
| الأصدقاء | ✅ تمرير قائمة المستخدمين |
| المجموعات | ✅ تمرير قائمة المجموعات |
| الملف الشخصي | ✅ تمرير محتوى البروفايل |
| البحث | ✅ تمرير النتائج |
| المحفوظات | ✅ تمرير العناصر المحفوظة |
| الإعدادات | ✅ تمرير صفحات الإعدادات الطويلة |
| الريلز | ✅ Snap عمودي (مستثنى عبر `:has()`) |
| الدردشة | ✅ Keyboard awareness يعمل، لا اختناق لمس |

### اختبارات إضافية

1. **Pull-to-Refresh:**
   - من قمة الصفحة، اسحب لأسفل → يظهر المؤشّر الدوّار، يستجيب haptic، عند تجاوز
     عتبة 70px يتحوّل اللون إلى أخضر.
   - حرّك أصبعك للأعلى أثناء السحب لإلغائه → يعود المؤشّر بسلاسة.

2. **عدم تداخل التمرير مع Pull-to-Refresh:**
   - عندما لا تكون في قمة `main` (مثلاً بعد التمرير لأسفل)، اسحب لأسفل →
     **لا يجب** أن يظهر مؤشّر التحديث (السلوك الصحيح).

3. **iOS Safari:**
   - `safe-area-inset-bottom` يحترم notch
   - لا bounce overscroll على body
   - الشاشة لا تقفز عند ظهور الكيبورد

4. **PWA Standalone:**
   - بعد التثبيت، أعد تشغيل التطبيق → نفس السلوك بدون أي اختلاف

---

## 📁 الملفات المعدّلة

```diff
+ frontend/src/styles/mobile-scroll-final-v59.13.2.css   (جديد — 12 KB)
~ frontend/src/hooks/usePullToRefresh.js                 (تحديث: findScrollContainer)
~ frontend/src/layouts/MobileLayout.jsx                  (تحديث: inline styles)
~ frontend/src/main.jsx                                  (إضافة import واحد)
+ CHANGELOG_v59.13.2_MOBILE_SCROLL_AR.md                 (هذا الملف)
```

---

## 🔒 ملاحظات للمحافظة على الاستقرار

1. **لا تُضف import CSS بعد** `mobile-scroll-final-v59.13.2.css` —
   يجب أن يبقى **آخر** ملف CSS في `main.jsx`.

2. **إذا احتجت تعديلاً مستقبلياً**، انشر `v59.13.3` ملفاً جديداً يلي v59.13.2
   في الـ cascade. لا تُعدّل v59.13.2 بعد النشر.

3. **اختبار قبل النشر** على شاشات صغيرة فعلية (Redmi Note 8 أو ما يعادلها)
   لأن DevTools simulator لا يعكس سلوك Pull-to-Refresh بدقة.

4. **متابعة console** على الجوال: يجب ألا تظهر تحذيرات
   `[Intervention] Unable to preventDefault inside passive event listener` —
   الإصلاح يضمن أن `preventDefault` يُستدعى فقط في وضع `locked` (passive:false).

---

**الإصدار:** v59.13.2
**التاريخ:** 2026-06-25
**النوع:** Hotfix حرج — يجب نشره فوراً
