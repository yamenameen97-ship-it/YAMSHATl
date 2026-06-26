# YAMSHAT — تحديث v59.13.23 (UX/A11y — خمسة إصلاحات)

> فحص وتدقيق لتجربة المستخدم: تم العثور على 5 نواقص حقيقية في تجربة المستخدم وإصلاحها بدون كسر أي سلوك قائم.

## 🎯 ملخّص النواقص المكتشفة والإصلاحات

| # | النقص (Issue) | الموقع (Location) | تأثير المستخدم |
|---|---|---|---|
| 1 | لا يوجد `focus-visible` على شريط التنقل السفلي / أزرار التصفية / Composer | `BottomNav.jsx`, `MobileFilterPills.jsx`, `MobileComposer.jsx` | مستخدمو الكيبورد لا يرون أين يقف التركيز — كسر WCAG 2.4.7 |
| 2 | قائمة الإنشاء (groups menu) لا تُغلق بـ `Escape` ولا تعيد التركيز للزر | `BottomNav.jsx` | عالق داخل القائمة بالكيبورد + ضياع التركيز بعد الإغلاق |
| 3 | السحب للتحديث (PTR) بلا أي إعلان لقارئات الشاشة | `usePullToRefresh.js`, `PullToRefresh.jsx` | مستخدمو NVDA/VoiceOver لا يعرفون أن تحديث بدأ/انتهى |
| 4 | لا يحترم `prefers-reduced-motion` (FAB + قائمة + pills + composer + PTR spinner) | كل الملفات أعلاه | مستخدمو الدوار vestibular يرون حركات غير مرغوبة |
| 5 | `onTouchEnd` + `preventDefault()` في FilterPills يسبب إطلاق مزدوج + لا مكافئ كيبورد | `MobileFilterPills.jsx` | نقرة واحدة قد تُحسب اثنتين + لا يمكن التنقل بالأسهم |

---

## 1️⃣ إضافة `focus-visible` لكل عناصر التنقل (Keyboard a11y)

**المشكلة:** كان فقط `.ym-create-menu-item:focus-visible` معرَّفاً. كل بقية الأزرار (الرئيسية/الدردشات/الريلز/حسابي/فلاتر/Composer) كانت تعتمد على outline افتراضي لا يظهر أو يُزال بصمت في الموبايل.

**الحل:**
- إضافة قواعد `:focus-visible` صريحة بإطار `#A78BFA` بسماكة 2px في:
  - `.ym-nav-item` (شريط سفلي)
  - `.ym-filter-pill-new` (التصفية)
  - `.ym-composer` و `.ym-composer-action` (Composer)
- زر الـ FAB يحصل على ring مزدوج (`0 0 0 3px #0A0D1A, 0 0 0 6px #A78BFA`) لإبرازه فوق الخلفية الداكنة.

**النتيجة:** المستخدم الذي يستخدم Tab يرى بوضوح أين يقف.

---

## 2️⃣ دعم Escape + Focus Management في قائمة الإنشاء

**المشكلة:** عند فتح قائمة "إنشاء مجموعة نصية / غرفة صوتية" على صفحة `/groups`:
- لا توجد طريقة للخروج بالكيبورد إلا بـ Tab خارج القائمة.
- بعد إغلاق القائمة (سواء بضغطة backdrop أو اختيار عنصر)، يضيع التركيز.

**الحل في `BottomNav.jsx`:**
```jsx
const createBtnRef = useRef(null);
const firstMenuItemRef = useRef(null);

useEffect(() => {
  if (!menuOpen) return;
  const onKey = (e) => {
    if (e.key === 'Escape') {
      setMenuOpen(false);
      createBtnRef.current?.focus(); // ⭐ يعيد التركيز للزر
    }
  };
  document.addEventListener('keydown', onKey);
  // ⭐ ينقل التركيز لأول عنصر داخل القائمة فور فتحها
  setTimeout(() => firstMenuItemRef.current?.focus(), 20);
  return () => document.removeEventListener('keydown', onKey);
}, [menuOpen]);
```
- إضافة `aria-haspopup="menu"` و `aria-expanded={menuOpen}` على زر FAB.

**النتيجة:** التنقل بالكيبورد يتبع نمط ARIA Authoring Practices للقوائم.

---

## 3️⃣ إعلان `aria-live` لقارئات الشاشة عند Pull-to-Refresh

**المشكلة:** عند سحب الصفحة لتحديثها:
- مستخدم البصر يرى spinner ونصاً عربياً.
- مستخدم قارئ الشاشة (NVDA/JAWS/VoiceOver/TalkBack) **لا يعرف شيئاً** — لا إعلان لبدء التحديث ولا لانتهائه.

**الحل في `usePullToRefresh.js`:**
- إضافة state جديدة `a11yMessage` تُحدَّث عند:
  - تجاوز عتبة التفعيل: `"حرّر للتحديث"`
  - بدء التحديث: `"جارٍ تحديث المحتوى…"`
  - النجاح: `"تمّ تحديث المحتوى."`
  - الفشل: `"تعذّر تحديث المحتوى."`
- تُمسح تلقائياً بعد 3 ثوانٍ.

**في `PullToRefresh.jsx`:**
- إضافة region خفية بصرياً (visually-hidden) لكنها معلَنة لقارئات الشاشة:
```jsx
<div role="status" aria-live="polite" aria-atomic="true" className="ym-ptr-sr-only">
  {a11yMessage || (isRefreshing ? loadingText : '')}
</div>
```
- استخدام تقنية CSS clip القياسية (`width:1px; height:1px; clip: rect(0,0,0,0)`) — لا تخفيها display:none الذي يخفيها أيضاً عن AT.

**النتيجة:** متوافق مع WCAG 4.1.3 (Status Messages).

---

## 4️⃣ احترام `prefers-reduced-motion`

**المشكلة:** أربع animations كانت تعمل دائماً بدون شرط:
- `.ym-nav-item--create:active { transform: scale(0.94) }` — pulse عند الضغط.
- `.ym-create-menu` keyframes `ym-pop-in` و `ym-fade-in`.
- `.ym-filter-pill-new:active { transform: scale(0.96) }`.
- `.ym-composer-action:active { transform: scale(0.93) }`.
- spinner PTR `ym-ptr-spin 0.9s linear infinite`.

هذه الحركات تسبب دواراً لمستخدمين يعانون من اضطراب دهليزي (vestibular disorder).

**الحل:** قاعدة `@media (prefers-reduced-motion: reduce)` في كل ملف معالج:
```css
@media (prefers-reduced-motion: reduce) {
  .ym-nav-item, .ym-nav-icon--create, .ym-create-menu,
  .ym-filter-pill-new, .ym-composer-action {
    transition: none !important;
    animation: none !important;
  }
  *:active { transform: none !important; }
}
```
- spinner الـ PTR يتوقف عن الدوران ويظهر كأيقونة ساكنة.
- قائمة الإنشاء تظهر مباشرة بدون pop-in.

**النتيجة:** متوافق مع WCAG 2.3.3 (Animation from Interactions).

---

## 5️⃣ إصلاح الإطلاق المزدوج في `MobileFilterPills` + تنقل بالأسهم

**المشكلة المزدوجة:**

**أ) Double-fire:**
```jsx
<button
  onClick={() => handleChange(f.id)}
  onTouchEnd={(e) => { e.preventDefault(); handleChange(f.id); }}
/>
```
على متصفّحات تحترم `touch-action: manipulation`، الـ `preventDefault` على touchend يلغي synthesised click — لكن إذا فشل `preventDefault` (passive listener) يُستدعى `handleChange` مرتين. وعلى Android Chrome مع PWA installed، رصدنا حالات نقرة واحدة → تغيير الفلتر مرتين متتاليتين.

**ب) لا مكافئ للكيبورد:** التنقل بين tabs بالأسهم (نمط ARIA Tabs Pattern) كان مفقوداً.

**الحل في `MobileFilterPills.jsx`:**
1. حذف `onTouchEnd` تماماً — `touch-action: manipulation` (موجود) يكفي لإلغاء تأخير 300ms من غير preventDefault.
2. إضافة معالج `onKeyDown` يدعم:
   - `ArrowLeft` (يمشي للأمام في RTL — التبويب التالي)
   - `ArrowRight` (يمشي للوراء في RTL — التبويب السابق)
   - `Home` (أول تبويب) / `End` (آخر تبويب)
   - يستخدم circular wrap (`% FILTERS.length`).
3. تطبيق **roving tabindex**: `tabIndex={isActive ? 0 : -1}` (تبويب واحد فقط في Tab order).
4. إضافة `aria-label="تصفية المحتوى"` على tablist.

**النتيجة:** نقرة واحدة = تغيير واحد. تنقل كامل بالكيبورد وفق ARIA APG.

---

## 📂 الملفات المعدّلة

```
frontend/src/components/mobile/BottomNav.jsx          (focus-visible + Escape + reduced-motion)
frontend/src/components/mobile/MobileFilterPills.jsx  (no double-fire + keyboard nav + focus-visible + reduced-motion)
frontend/src/components/mobile/MobileComposer.jsx     (focus-visible + reduced-motion)
frontend/src/components/common/PullToRefresh.jsx      (aria-live region + reduced-motion للـ spinner)
frontend/src/hooks/usePullToRefresh.js                (a11yMessage state)
```

## ✅ التحقق

- جميع الملفات اجتازت فحص esbuild syntax check بدون أي تحذير.
- لم نلمس أي API ولا أي مكوّن آخر — التغييرات معزولة في طبقة UX/A11y فقط.
- جميع إصلاحات v59.13.22 السابقة (RTL + FAB + Pull-Anywhere) محفوظة كما هي.

## 🔄 ترقية من v59.13.22

استبدل الملفات الخمسة أعلاه فقط. لا تغييرات على ملفات CSS الموجودة، لا حاجة لإعادة بناء أي شيء آخر.
