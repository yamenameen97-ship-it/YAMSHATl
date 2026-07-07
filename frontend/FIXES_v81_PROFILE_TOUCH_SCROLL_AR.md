# FIXES v81 — Profile Page: Fast Appear + Scrollable + Tappable

## شكاوى المستخدم

> "الملف الشخصي يظهر متأخر وبعد ظهوره يظهر وغير قابل للسحب للأعلى.
>  عند النقر للتعديل والنقر والمس ما يعمل ويتأخر."

باختصار: ثلاث مشاكل في صفحة `/profile`:
1. **تأخر الظهور** — تنتظر ~8 ثوانٍ قبل أن يظهر أي محتوى.
2. **لا يمكن السحب للأعلى (scroll)** — الصفحة تظهر ثم "تتجمد" ولا تمرَّر.
3. **النقر / اللمس بطيء أو لا يعمل** — أزرار التعديل والتخصيص لا تستجيب.

---

## التحليل الجذري

### السبب 1 — تأخر الظهور (8 ثوانٍ):
في `Profile.jsx` كان `safetyTimer = setTimeout(..., 8000)`.
هذا معناه: لو الخادم بارد (Render cold start) ينتظر المستخدم 8 ثوانٍ
كاملة قبل أن يرى أي شيء تفاعلي.

### السبب 2 — لا scroll بعد ظهور الصفحة:
في `MainLayout.jsx`، عنصر `.page-shell-glow` (وهو الأب المباشر
لمحتوى الصفحة) يستخدم:
```css
content-visibility: auto;
contain-intrinsic-size: 900px;
```
هذا يعطي المتصفح ارتفاعاً وهمياً 900px قبل الرسم الفعلي. النتيجة:
- `.page-content` (حاوية التمرير) تعتقد أن المحتوى ≤ 900px → **لا scroll**.
- على iOS Safari يؤخّر paint الأول → **تأخر النقر أيضاً**.

بالإضافة، طبقات shimmer/skeleton كانت أحياناً تحتفظ بـ
`pointer-events: auto` بعد انتهاء التحميل → تحجب النقر على المحتوى.

### السبب 3 — تأخر اللمس (300ms tap delay):
الأزرار داخل الملف الشخصي لم يكن لها `touch-action: manipulation`،
مما يجعل iOS/Chrome Mobile ينتظر 300ms لفحص double-tap-zoom قبل
تسجيل النقرة.

---

## الحل (v81)

### 1) تسريع الظهور — `frontend/src/pages/Profile.jsx`

- تقليل `safetyTimer` من **8000ms → 2500ms**.
- **إظهار placeholder تفاعلي فوراً** حتى قبل أول استجابة من الخادم
  (لو لا يوجد بيانات محلية سابقة). هذا يضمن أن الصفحة قابلة للتمرير
  وللنقر منذ اللحظة الأولى.
- إضافة `data-page="profile"` و `ym-profile-page` على العنصر الجذري
  للصفحة، ليتم استهدافها بدقة من CSS بدون تسرّب.

### 2) إصلاح Scroll + Touch — `styles/yamshat-fixes-v81-PROFILE-TOUCH-SCROLL.css`

ملف CSS جديد يفعل:

**أ) إلغاء `content-visibility: auto` على صفحة الملف الشخصي فقط:**
```css
.page-content:has(.ym-profile-page) .page-shell-glow,
.page-shell-glow:has(> .profile-page) {
  content-visibility: visible !important;
  contain-intrinsic-size: auto !important;
  contain: none !important;
}
```
- يبقى الأداء ممتازاً على باقي الصفحات (الفيد، الريلز...) لأننا
  نستهدف profile فقط.

**ب) ضمان أن `.profile-page` لا تحبس التمرير:**
- `overflow: visible` (التمرير يحدث في `.page-content` الأم).
- `height: auto` (تنمو مع المحتوى).
- `touch-action: pan-y` + `-webkit-overflow-scrolling: touch`.
- منع أي `transform` يكسر position:absolute.

**ج) إلغاء تسرّب `100vw` من v78 داخل profile:**
- أي `.ym-composer-wrap` أو `.ym-filters-container` قد يظهر داخل
  profile في المستقبل، لن يستخدم full-bleed هنا.

**د) استجابة فورية للأزرار:**
```css
.ym-profile-page button,
.ym-profile-page a,
.ym-profile-page [role="button"] {
  touch-action: manipulation !important;
  pointer-events: auto !important;
  -webkit-tap-highlight-color: rgba(124, 58, 237, 0.18) !important;
}
```
- `touch-action: manipulation` يزيل الـ 300ms tap delay على iOS.

**هـ) قتل طبقات التحميل العالقة:**
- كل `[class*="skeleton"]` و `[class*="shimmer"]` داخل profile
  تحصل على `pointer-events: none` كي لا تحجب النقر.

**و) تحسينات موبايل خاصة (`@media (max-width: 720px)`):**
- أزرار الـ hero (تعديل / تخصيص / تحليلات) — `z-index: 11`،
  `min-height: 42px`، `touch-action: manipulation`.
- التبويبات (posts / archive / saved) — `min-height: 46px` لضمان
  target أكبر من 44px (متطلب accessibility).
- الـ avatar / cover — `pointer-events: none` كي لا يحجبان الأزرار
  التي تعلوهما.

**ز) تحسين المودال (Modal) للتعديل:**
- `z-index: 100000` + `pointer-events: auto` + `touch-action: pan-y`.

**ح) Fallback للمتصفحات القديمة:**
- استخدام `@supports not selector(:has(*))` لضمان أن Firefox < 121
  والمتصفحات القديمة تحصل على تمرير يعمل حتى لو خسرنا شيئاً من الأداء.

### 3) تسجيل الملف — `frontend/src/main.jsx`
```js
import './styles/yamshat-fixes-v80-SEARCHBAR-COMMENT-LIFT.css';
import './styles/yamshat-fixes-v81-PROFILE-TOUCH-SCROLL.css';  // ⬅ جديد
```
مُستورد **بعد** v80 ليفوز في cascade.

---

## الملفات المضافة/المعدَّلة

| # | الملف | نوع التغيير |
|---|-------|-------------|
| 1 | `frontend/src/pages/Profile.jsx` | تعديل — safetyTimer 2500ms + placeholder فوري + data-page |
| 2 | `frontend/src/styles/yamshat-fixes-v81-PROFILE-TOUCH-SCROLL.css` | جديد |
| 3 | `frontend/src/main.jsx` | استيراد الملف الجديد بعد v80 |
| 4 | `frontend/FIXES_v81_PROFILE_TOUCH_SCROLL_AR.md` | هذا الملف |

---

## طريقة الاختبار

1. افتح `/profile` من جوال (أو DevTools بوضع الجوال).
2. **الظهور**: يجب أن يظهر skeleton/placeholder خلال < 300ms.
3. **التمرير**: حاول السحب لأعلى ولأسفل — يجب أن يعمل momentum
   scroll بسلاسة على iOS/Android.
4. **النقر على "✏️ تعديل الملف الشخصي"**: يجب أن يفتح المودال
   خلال < 100ms بلا تأخير.
5. **النقر على تبويبات (المنشورات/الأرشيف/المحفوظات)**: تفاعل فوري.
6. **داخل المودال**: كل الحقول (username, bio, tagline) قابلة
   للنقر والكتابة بلا تأخير.

---

## توافق مع الإصدارات السابقة

- ✅ لا يعارض v78 (RTL Full-bleed) — نلغي 100vw فقط داخل profile.
- ✅ لا يعارض v79/v80 — إضافات لا حذف.
- ✅ لا يعارض v66 (Profile hotfix) — يعزّزه بمستوى أعمق.
- ✅ لا يعارض v71 (Performance) — يبقي content-visibility على
  باقي الصفحات، يعطّله على profile فقط.
- ✅ محافظ على cascade: مُستورد **بعد** v80.
