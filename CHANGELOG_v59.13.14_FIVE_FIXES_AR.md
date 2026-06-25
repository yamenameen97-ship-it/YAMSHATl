# v59.13.14 — خمس إصلاحات جديدة (Five New Fixes)

## النواقص الخمس المكتشفة في الفحص الجديد

### ✅ #1 — نافذة الإبلاغ (ReportModal) — إمكانية الوصول (a11y) الكاملة
**القسم:** البلاغات + المنشورات + الريلز + الستوري + الشات + المجموعات (يُستخدم في كل أنواع المحتوى)
**المشكلة:**
- المودال يفتح بدون `role="dialog"` و `aria-modal="true"` → قارئات الشاشة لا تعلن أنه نافذة حوار.
- لا يوجد **focus trap**: مفتاح Tab يتسرّب خارج المودال إلى عناصر الصفحة المحجوبة بصرياً خلف الـ backdrop.
- لا يحصل أي عنصر على **focus تلقائي** عند الفتح → مستخدمو لوحة المفاتيح يجب أن يضغطوا Tab عدة مرات للوصول للأزرار.
- بعد الإغلاق لا يعود التركيز إلى الزر الذي فتح المودال → فقدان السياق لمستخدمي قارئات الشاشة.
- `<label>` الخاص بـ "تفاصيل إضافية" غير مربوط بـ `htmlFor` مع `id` الـ textarea → لا يقرأ NVDA/VoiceOver النص الوصفي عند التركيز على الحقل.

**الحل:**
- إضافة `role="dialog"` + `aria-modal="true"` + `aria-labelledby` يشير إلى عنوان النافذة.
- إضافة معالج `Tab`/`Shift+Tab` يحبس التركيز داخل المودال (focus trap) عبر `getFocusables()` ديناميكي.
- حفظ `document.activeElement` قبل الفتح في `previouslyFocusedRef` وإرجاع التركيز إليه عند الإغلاق.
- `setTimeout(30ms)` بعد paint لتركيز زر الإلغاء تلقائياً كنقطة دخول آمنة.
- `React.useId()` لإنشاء `id` فريد لكل من العنوان والـ textarea والربط بـ `htmlFor`.
- `aria-hidden="true"` على إيموجي 🚨 و ✅ لمنع قارئة الشاشة من نطقها.
- `role="status"` + `aria-live="polite"` على شاشة "تم استلام بلاغك" لإعلان النجاح صوتياً.

---

### ✅ #2 — قائمة الإشعارات (NotificationList) — منع طلب API بلا فائدة + تحسينات a11y
**القسم:** الإشعارات
**المشكلة:**
1. زر "تحديد الكل كمقروء" يستدعي `notificationService.markAllNotificationsRead()` **دون التحقق** من وجود إشعارات غير مقروءة → طلب API مهدور عند كل نقرة عبثية، ضغط على الخادم وضجيج في logs.
2. لا يوجد **عدّاد ظاهر** لعدد الإشعارات غير المقروءة في الـ header → المستخدم لا يعرف كم إشعار سيتم تحديده.
3. الفلاتر (الكل / غير مقروء / Mentions) أزرار عادية بدون `role="tablist"` و `role="tab"` ولا `aria-selected` → قارئات الشاشة لا تفهم أنها مجموعة فلاتر متبادلة.
4. لا يوجد **توست** نجاح/فشل عند الضغط على "تحديد الكل كمقروء" → المستخدم لا يعرف ما حدث.

**الحل:**
- إضافة `unreadCount` عبر `useMemo` يحسب عدد غير المقروءة من store.
- زر "تحديد الكل كمقروء" أصبح `disabled` تلقائياً عندما `unreadCount === 0` مع `aria-disabled` و `aria-label` مناسب للسياقَين.
- إضافة **شارة برتقالية** بجانب العنوان "التنبيهات" تعرض `unreadCount` ديناميكياً مع `aria-label`.
- معالج `handleMarkAllRead` يدعم Promise وغير-Promise، ويُطلق `yamshat:toast` على النجاح والفشل.
- الفلاتر صارت `role="tablist"` + `role="tab"` + `aria-selected` + `tabIndex={isActive ? 0 : -1}` (نمط tab roving القياسي).

---

### ✅ #3 — اختصارات المجموعة (GroupQuickLinks) — قابلية الوصول + تمييز الرابط النشط
**القسم:** المجموعات
**المشكلة:**
- الإيموجي 📝 📅 📊 🖼️ 📜 🔔 بدون `aria-hidden="true"` → قارئة الشاشة تنطق "صورة كاميرا — المنشورات، صورة تقويم — الأحداث..." (مكرر مزعج).
- الأزرار بدون `aria-label` صريح → بعض القارئات تفشل في فهم نص الزر الكامل.
- **لا يوجد تمييز** لزر القسم النشط حسب المسار الحالي → المستخدم لا يعرف أين هو الآن في المجموعة.
- لا يدعم Arrow Keys للتنقل بين الأزرار داخل الشريط (سلوك Toolbar القياسي WAI-ARIA).
- العنصر الحاوي بدون `role="navigation"` ولا `aria-label`.

**الحل:**
- استدعاء `useLocation()` من react-router لتمييز الزر الذي `to === location.pathname` بصرياً وعبر `aria-current="page"`.
- إضافة `aria-hidden="true"` على كل span الإيموجي.
- `aria-label={l.label}` صريح على كل زر.
- معالج `handleKey` يدعم `ArrowLeft/Right/Up/Down/Home/End` مع احترام RTL (في RTL: السهم الأيمن = العنصر السابق).
- إضافة `role="navigation"` + `aria-label="اختصارات أقسام المجموعة"` على الحاوية.
- إضافة `data-testid` لكل زر لتسهيل الاختبارات الآلية (Playwright/Jest).

---

### ✅ #4 — مستمع الإشعارات العالمي (GlobalNotificationListener) — صلاحية الإشعار + Beep ذكي + SPA navigation
**القسم:** الإشعارات
**ثلاث مشاكل:**

**(أ) طلب صلاحية الإشعار التلقائي عند mount:**
`Notification.requestPermission()` كان يُستدعى **تلقائياً** عند تحميل التطبيق دون أي نقر/لمس من المستخدم. هذا:
- **مخالف صراحةً** لـ [Notifications Best Practices](https://developer.chrome.com/blog/notifications-prompts) في Chrome 80+ وفايرفوكس.
- يُعرض المستخدم لـ prompt مفاجئ يربكه ويدفعه عادةً للضغط على "Block" نهائياً.
- بعض المتصفحات (Brave / Firefox مع `dom.webnotifications.requireuserinteraction`) ترفض الطلب تلقائياً.
- لدينا بالفعل `NotificationPermissionPrompt` كنافذة UI مخصصة تطلب الصلاحية بعد user gesture صريح — الاستدعاء المباشر هنا كان مكرراً ومضراً.

**(ب) صوت Beep يصدر حتى عندما يكون التبويب مرئياً ومركّزاً:**
الكود يصدر beep على كل إشعار جديد بغض النظر عن حالة التبويب → مستخدم يستعرض الإشعارات في صفحة /notifications يسمع beep متكرراً مزعجاً.

**(ج) النقر على إشعار النظام يُعيد تحميل التطبيق:**
`notif.onclick = () => window.location.assign(item.path)` → يُعيد تحميل التطبيق بالكامل، يفقد حالة Redux/Zustand، ويعيد تنفيذ كل تأسيس React → تجربة سيئة وبطيئة على الموبايل.

**الحل:**
- **حذف كامل** للـ `useEffect` الذي كان يستدعي `requestPermission()` تلقائياً. الطلب أصبح حصرياً عبر `NotificationPermissionPrompt` (زر صريح للمستخدم).
- شرط beep أصبح `document.hidden || !document.hasFocus()` → الصوت فقط عند الحاجة الفعلية.
- استبدال `window.location.assign(item.path)` بـ `window.history.pushState({}, '', item.path) + dispatchEvent(new PopStateEvent('popstate'))` → React Router يلتقطها كتنقل داخلي SPA بدون reload، مع fallback آمن لـ `location.assign` إن فشلت History API.

---

### ✅ #5 — شريط الستوريات (StoriesBar) — فحص MIME صارم للملفات
**القسم:** الستوري
**المشكلة:**
- `handleFileSelect` كان يفحص **فقط** `file.size > 600MB` ويُمرر أي شيء آخر إلى `StoryEditor`.
- المشكلة #1: مستخدم يمكن أن يختار **ملف PDF** مزوّر بامتداد `.jpg` (الـ `accept="image/*,video/*"` فلتر إرشادي فقط للمتصفح، يمكن للمستخدم تخطّيه عبر "All Files").
- المشكلة #2: ملف **فارغ تماماً** (0 بايت) أو ملف TXT أو حتى ملف Excel كل هذه تُمرَّر لـ StoryEditor → فشل غامض لاحقاً برسالة "تعذّر رفع القصة" بدون توضيح السبب.
- المشكلة #3: لا حد أدنى لحجم الملف → ملفات placeholder تالفة (4–10 بايت) تمر وتُسبب أخطاء في معالج الصور على الباك إند.

**الحل:**
- قائمتان صارمتان `ACCEPTED_IMAGE_TYPES` و `ACCEPTED_VIDEO_TYPES` تشملان أنواع MIME الفعلية (jpeg, png, gif, webp, heic, mp4, quicktime, webm، إلخ).
- التحقق: `type.startsWith('image/') && ACCEPTED_IMAGE_TYPES.includes(type)` — يرفض أي MIME غير مدرج حتى لو بدأ بـ `image/`.
- إضافة `MIN_FILE_SIZE = 1024` (1 KB) — يرفض الملفات الفارغة/التالفة برسالة مخصصة قبل وصولها للمحرر.
- ثلاث رسائل toast واضحة بدلاً من رسالة واحدة عامة: "صيغة غير مدعومة" / "الملف فارغ أو تالف" / "الملف كبير جداً".

---

## الملفات المعدّلة (5)

1. `frontend/src/components/reports/ReportModal.jsx` (+~50 سطر)
2. `frontend/src/components/notifications/NotificationList.jsx` (+~60 سطر)
3. `frontend/src/components/groups/GroupQuickLinks.jsx` (إعادة كتابة كاملة، +45 سطر صافي)
4. `frontend/src/components/notifications/GlobalNotificationListener.jsx` (تعديلات متفرقة، +20 سطر صافي)
5. `frontend/src/components/stories/StoriesBar.jsx` (+~25 سطر)

## ملاحظات الانتشار

- ✅ لا تغييرات في الـ API ولا في الـ backend.
- ✅ لا تغييرات في `package.json` أو الـ dependencies (فقط رفع الـ version إلى `59.13.14`).
- ✅ متوافق رجعياً 100% مع v59.13.13.
- ✅ لا حاجة لـ migrations.
- ✅ جميع الملفات مرّت فحص syntax بـ `@babel/parser` (JSX + ES2022).
- ✅ يحترم تماماً `dir="rtl"` + `font-family: 'Noto Sans Arabic'` كما هو معتمد في باقي التطبيق.

## ملاحظات للاختبار اليدوي

1. **ReportModal:** افتح أي قائمة ••• (منشور/ريل/ستوري) → اضغط Tab → يجب أن يبقى التركيز داخل المودال. اضغط Esc → يجب أن يعود التركيز للزر ••• الذي فتحته.
2. **NotificationList:** افتح صفحة الإشعارات بدون أي إشعار غير مقروء → زر "تحديد الكل كمقروء" يجب أن يكون رمادياً (disabled).
3. **GroupQuickLinks:** ادخل أي مجموعة → استخدم Tab للوصول للشريط → السهم الأيسر/الأيمن يجب أن ينتقل بين الأزرار. الزر النشط للقسم الحالي مظلل.
4. **GlobalNotificationListener:** أعد تحميل التطبيق → يجب ألا يظهر prompt صلاحية الإشعار تلقائياً (يجب أن يظهر فقط بعد ضغطك على زر تفعيل الإشعارات).
5. **StoriesBar:** حاول رفع ملف PDF كستوري → يجب أن تظهر رسالة "صيغة غير مدعومة" فوراً قبل فتح المحرر.
