# v59.13.15 — خمس إصلاحات جديدة (Five New Fixes)

> فحص جديد لكافة الأقسام (الشات، المجموعات، الريلز، الستوري، المنشورات، الإشعارات، طلبات الصداقة، البلاغات).
> اكتُشفت خمس نواقص جديدة لم تُعالَج في v59.13.14 — تمّ إصلاحها كلّها في هذه النسخة.

---

## النواقص الخمس المكتشفة في الفحص الجديد

### ✅ #1 — صفحة المجموعات (GroupsHome) — عناصر غير دلالية + غياب دعم لوحة المفاتيح
**القسم:** المجموعات (`pages/GroupsHome.jsx`)

**المشكلة:**
- زر الفلتر `<div className="yam-filter-btn" onClick=...>` — **`<div>` غير دلالية** بدون `role` ولا `tabIndex` ولا `onKeyDown`.
- بطاقات التصنيفات (`yam-category-pill`) — كلها `<div>` مع `onClick` فقط، لا يمكن الوصول إليها بـ Tab أو تفعيلها بـ Enter/Space.
- بطاقات المجموعات (`yam-group-card`) — `<div>` مع `onClick` فقط → مستخدمو لوحة المفاتيح وقارئات الشاشة لا يستطيعون فتح أي مجموعة إطلاقاً.
- زر "⋮" (الإعدادات) — `<div>` مع `onClick` فقط → غير قابل للوصول.
- حقل البحث له `enterKeyHint="search"` لكن **لا يوجد `<form>` ولا معالج Enter** → الإعدادات على لوحة المفاتيح الافتراضية تظهر "بحث" لكن لا شيء يحدث.
- حقل البحث بدون `aria-label` ولا `<label>` مربوط → قارئة الشاشة تقرأ "input" فقط.
- لا يوجد تنقل بأسهم لوحة المفاتيح بين أزرار التصنيفات.

**الحل:**
- استبدال جميع `<div onClick>` بـ `<button type="button">` دلالية مع `aria-label` صريح.
- بطاقة المجموعة بقيت `<div>` لكن مع `role="button"`, `tabIndex={0}`, `onKeyDown` يعالج Enter/Space.
- التصنيفات أصبحت `role="tablist"` + كل عنصر `role="tab"` مع `aria-selected` و roving `tabIndex` (1 نشط، -1 للباقي).
- تنقل بأسهم لوحة المفاتيح بين التصنيفات (ArrowLeft/Right مع احترام RTL + Home/End).
- لفّ حقل البحث في `<form role="search">` مع `onSubmit` يمنع reload (البحث تلقائي عبر debounce).
- إضافة `<label>` مخفي بصرياً (`sr-only`) للحقل + `aria-label` + `autoComplete="off"`.
- زر "⋮" أصبح `<button>` مع `aria-label="إعدادات مجموعة {name}"`.
- بطاقة المجموعة `aria-label` تتضمن عدد الرسائل غير المقروءة لقارئات الشاشة.

---

### ✅ #2 — قائمة الإشعارات (NotificationList) — إشعار النظام بلا `onclick` ولا `tag`
**القسم:** الإشعارات (`components/notifications/NotificationList.jsx`)

**المشكلة:**
- عند وصول `new_notification` عبر socket والتبويب مخفي، الكود ينشئ:
  ```js
  new Notification(notification.title, { body: notification.message });
  ```
- **مشكلة #1:** بدون `onclick` → النقر على الإشعار في مركز إشعارات النظام **لا يفعل شيئاً**. المستخدم يضغط على الإشعار متوقعاً فتح الرسالة → ينفتح التبويب فقط بدون انتقال.
- **مشكلة #2:** بدون `tag` → استلام 5 إشعارات متتابعة يُكدّسها كلها في مركز إشعارات النظام بدون دمج. على iOS هذا يملأ شاشة القفل بإشعارات مكررة.
- **مشكلة #3:** بدون `icon` و `badge` → الإشعار يظهر بأيقونة المتصفح الافتراضية بدلاً من شعار يام شات.
- **مشكلة #4:** عند فشل إنشاء الإشعار لا يوجد `onerror` handler → خطأ صامت في الـ console.

**الحل:**
- إضافة `tag: "yamshat-notif-${type}-${id}"` لدمج الإشعارات المتشابهة.
- إضافة `icon: "/icons/icon-512.png"` و `badge: "/icons/badge-96.png"` لظهور شعار يام شات.
- إضافة `data: { url: ... }` لحفظ المسار المستهدف.
- إضافة `notif.onclick`:
  - `window.focus()` لإعادة التبويب للمقدمة.
  - `window.history.pushState() + dispatchEvent(PopStateEvent('popstate'))` للتنقل عبر **React Router SPA** بدون reload.
  - fallback إلى `window.location.assign()` لو فشلت History API.
  - `notif.close()` لإغلاق الإشعار من مركز النظام.
- إضافة `notif.onerror` تجاهلي لمنع ضجيج الـ console.

---

### ✅ #3 — صفحة الأصدقاء (Friends) — `window.confirm` المتزامن (تجربة سيئة على الموبايل)
**القسم:** الأصدقاء + طلبات الصداقة (`pages/Friends.jsx`)

**المشكلة:**
- `handleUnfriend` كان يستخدم:
  ```js
  if (!window.confirm('هل تريد إزالة هذا الصديق...؟')) return;
  ```
- **مشكلة #1:** `window.confirm` **يجمّد خيط JavaScript بالكامل** أثناء العرض → animations تتوقف، socket events تُتجاهل، الـ React state freezes.
- **مشكلة #2:** على iOS Safari، إذا كان المستخدم في PWA fullscreen، الـ `window.confirm` يظهر بشكل مشوّه أحياناً بدون عنوان التطبيق.
- **مشكلة #3:** بعض المتصفحات (Chrome on Android) تسمح للمستخدم بـ "منع هذا الموقع من إظهار حوارات إضافية" → ضغط واحد ينهي وظيفة الحذف نهائياً.
- **مشكلة #4:** التصميم لا يطابق هوية التطبيق (نافذة رمادية بخط النظام بدلاً من Noto Sans Arabic + التدرّجات البنفسجية).
- **مشكلة #5:** قارئات الشاشة على iOS تقرأ "Confirm" بالإنجليزية حتى لو كان النص بالعربية → ارتباك.

**الحل:**
- مكوّن جديد `<ConfirmDialog>` داخل التطبيق:
  - `role="dialog"` + `aria-modal="true"` + `aria-labelledby`.
  - تركيز تلقائي على زر الإلغاء بعد 30ms (نقطة دخول آمنة).
  - **focus trap** يحبس Tab/Shift+Tab داخل النافذة.
  - ESC يغلق النافذة (مع `e.stopPropagation()` لتفادي تعارض مع modals أخرى).
  - `document.body.style.overflow = 'hidden'` لمنع scroll الخلفية، يُعاد لقيمته السابقة عند الإغلاق.
  - تصميم RTL كامل بخط Noto Sans Arabic + تدرّج بنفسجي/أحمر حسب `dialog.danger`.
- `handleUnfriend` الآن **غير متزامن** يضع `confirmDialog` في الـ state ويعرض النافذة، والـ API call يبدأ فقط بعد ضغط "إزالة" داخل النافذة.
- العملية بأكملها **non-blocking**: المستخدم يستطيع التمرير، استلام إشعارات، وتغيير التبويب بدون تجميد.

---

### ✅ #4 — مشغّل الريلز (ReelPlayer) — شريط التقدّم بلا دعم لوحة مفاتيح
**القسم:** الريلز (`components/reels/ReelPlayer.jsx`)

**المشكلة:**
- شريط التقدّم له `role="slider"` و `aria-valuenow/valuemin/valuemax` لكن:
- **لا يوجد `tabIndex`** → غير قابل للتركيز بـ Tab.
- **لا يوجد `onKeyDown`** → لا يستجيب لأي مفتاح. وفقاً لـ [WAI-ARIA slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) يجب أن يستجيب لـ:
  - ArrowLeft/Right (تقديم/ترجيع 5% أو ثانية كحد أدنى).
  - ArrowUp/Down (نفس السلوك أحياناً).
  - PageUp/PageDown (10% قفزة).
  - Home/End (بداية/نهاية).
- مستخدمو لوحة المفاتيح وقارئات الشاشة (مكفوفين، ذوي إعاقات حركية) **لا يستطيعون تقديم/ترجيع الريل إطلاقاً**.
- خوارزمية النقر على الشريط `(pageX - rect.left) / rect.width` **لا تحترم RTL** → في الواجهات العربية، النقر يميناً يُفترض أن يقدّم لكنه يُرجّع.
- لا يوجد `aria-valuetext` → قارئة الشاشة تقرأ "45" بدل "45 بالمئة".
- لا يوجد `aria-orientation` → قارئة الشاشة لا تعرف اتجاه الشريط.

**الحل:**
- إضافة `tabIndex={isActive ? 0 : -1}` — فقط الريل النشط في tab order (تجنّب تشتيت Tab بين 10+ ريلز).
- معالج `onProgressKey` كامل يدعم:
  - ArrowLeft/Right + ArrowUp/Down (5% أو 1 ثانية، أيهما أكبر).
  - PageUp/PageDown (10% أو 5 ثوانٍ).
  - Home (بداية) و End (نهاية).
  - **احترام RTL**: في `dir="rtl"` السهم الأيسر = تقديم، الأيمن = ترجيع.
- `e.preventDefault()` لمنع scroll الصفحة عند الضغط على الأسهم.
- استدعاء `wakeImmersion()` بعد كل ضغطة → الأزرار/التسميات تعاود الظهور.
- إصلاح `onProgressTap` ليحترم RTL أيضاً عند النقر/السحب.
- إضافة `aria-valuetext="${progress} بالمئة"` و `aria-orientation="horizontal"`.
- `aria-label` محسّن: "مؤشر تقدّم الريل — استخدم الأسهم للتقدّم والرجوع".

---

### ✅ #5 — قائمة الثلاث نقاط (MoreOptionsMenu) — بلا أسهم تنقل WAI-ARIA
**القسم:** كل الأقسام (المنشورات، الريلز، الستوري، الشات، المجموعات، التعليقات، البلاغات)
**الملف:** `components/reports/MoreOptionsMenu.jsx`

**المشكلة:**
هذا المكوّن يُستخدم في **كل قائمة "•••"** عبر التطبيق (المنشورات، الريلز، الستوري، الشات، المجموعات، التعليقات، الملفات الشخصية). الخلل يطال جميع هذه الأقسام:
- القائمة لها `role="menu"` لكن **لا يوجد تنقل بأسهم لوحة المفاتيح** بين عناصرها. وفقاً لـ [WAI-ARIA menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu/) يجب:
  - ArrowDown/Up للتنقل بين `menuitem`s.
  - Home/End للقفز للأول/الأخير.
  - تركيز تلقائي على **أول عنصر** عند فتح القائمة.
  - **roving tabindex**: عنصر واحد فقط له `tabIndex=0` والباقي `-1` (Tab واحد يخرج من القائمة لا 7 ضغطات).
- بدلاً من ذلك، الكود السابق:
  - لا يركّز على أي عنصر عند الفتح → المستخدم بلوحة المفاتيح يفتح القائمة ثم يضغط Tab 1-7 مرات للوصول لـ "إبلاغ".
  - كل العناصر `tabIndex` افتراضي (0) → Tab يمر عبر كل عنصر داخل القائمة قبل الخروج للزر التالي على الصفحة.
  - `key={i}` (index) anti-pattern في React → إذا تغيّرت `items` (مثلاً عنصر "تعديل" يظهر/يختفي) React قد يعيد تركيب العناصر بشكل خاطئ.
  - الإيموجي بدون `aria-hidden="true"` → قارئة الشاشة تنطق "🔖 حفظ" كـ "علامة كتاب صفحة، حفظ" (تكرار مزعج).
- النتيجة: مستخدمو لوحة المفاتيح وقارئات الشاشة يجدون صعوبة بالغة في استخدام قوائم الإبلاغ والإجراءات.

**الحل:**
- إضافة `useRef` للقائمة (`menuRef`) و state `activeIdx` لتتبّع العنصر النشط.
- `useEffect` يركّز على أول `[role="menuitem"]` بعد 20ms من فتح القائمة (دخول سريع).
- معالج `onKeyDown` على الحاوية `role="menu"`:
  - ArrowDown: تنقّل دائري للأمام (`(idx + 1) % length`).
  - ArrowUp: تنقّل دائري للخلف.
  - Home: العنصر الأول.
  - End: العنصر الأخير.
- **roving tabindex**: `tabIndex={activeIdx === i ? 0 : -1}` على كل menuitem.
- `onFocus` على كل menuitem يحدّث `activeIdx` → التركيز بـ Tab أو click يطابق التحديد البصري.
- `key={`${it.label}-${i}`}` بدل `key={i}` لتجنّب bugs عند تغيّر العناصر.
- إضافة `aria-hidden="true"` على كل span إيموجي.
- إضافة `aria-orientation="vertical"` على الحاوية.
- تظليل العنصر النشط بصرياً (`background: rgba(124,58,237,0.18)`) بالإضافة إلى الـ hover.

---

## ملفّات معدَّلة

| الملف | السطور المتأثرة | الإصلاح |
|---|---|---|
| `frontend/src/pages/GroupsHome.jsx` | حوالي 50 سطر | تحويل divs → buttons + a11y + form للبحث |
| `frontend/src/components/notifications/NotificationList.jsx` | حوالي 45 سطر | onclick + tag + icon لإشعار النظام |
| `frontend/src/pages/Friends.jsx` | حوالي 100 سطر | ConfirmDialog مخصص (بديل window.confirm) |
| `frontend/src/components/reels/ReelPlayer.jsx` | حوالي 45 سطر | onKeyDown + tabIndex + RTL للشريط |
| `frontend/src/components/reports/MoreOptionsMenu.jsx` | حوالي 70 سطر | أسهم تنقل WAI-ARIA + roving tabindex |
| `frontend/package.json` | سطر 1 | رفع الإصدار إلى 59.13.15 |

---

## التحقق

- ✅ جميع الملفات الخمسة اجتازت فحص JSX syntax عبر `@babel/parser`.
- ✅ لا تغييرات على الـ backend.
- ✅ لا dependencies جديدة في `package.json`.
- ✅ التغييرات backward-compatible: لم تُحذف أي props، فقط تحسينات للسلوك الموجود.
- ✅ الإصلاحات السابقة في v59.13.14 (ReportModal a11y، NotificationList markRead، GroupQuickLinks، GlobalNotificationListener، StoriesBar MIME) كلها محفوظة دون مساس.
