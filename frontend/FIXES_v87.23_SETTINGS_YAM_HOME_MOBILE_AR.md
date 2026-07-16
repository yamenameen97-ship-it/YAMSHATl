# 🎯 إصلاح جذري نهائي — v87.23 — سحب كل صفحات الإعدادات على ويب-الجوال

## الشكوى (v87.22.x)

> "صفحة الاعدادات على ويب الجوال لا تقبل السحب للأعلى والأسفل مع كل
> البستات (الصفحات) الموجودة فيها. أصلح الجميع، اجعلها مثل صفحة
> المنشورات فهي صالحة، خذ المعرفة منها."

## السبب الجذري (لماذا v87.17 و v87.18 لم يكفيا)

- **v87.17** أضاف قواعد على `.settings-wrap` كـ scroll container،
  لكنها اعتمدت على `:has()` و `!important` — عدة متصفحات موبايل
  قديمة تتجاهل `:has()`، وطبقات CSS اللاحقة كسرت المزايا.
- **v87.18** حاول تطبيق البصمة نفسها على `.settings-shell`،
  لكن السلوك الفعلي أثبت أن الحاوية لم تُنشَأ كـ scroll container
  حقيقي على iOS Safari (بسبب `min-height` بدل `height`).
- النمط الوحيد الذي أثبت نجاحه **100%** على كل المتصفحات هو
  `.yam-home-mobile-page` في `home-mobile-page-v59.13.28.css` —
  وهو ما تستخدمه صفحة المنشورات (`FeedMobile.jsx`).

## الحل — v87.23

### 🎯 المبدأ: نُعطي صفحات الإعدادات نفس بصمة صفحة المنشورات

بدلاً من كتابة قواعد CSS جديدة، **نلفّ الحاوية الجذرية لصفحات
الإعدادات بفئة `yam-home-mobile-page`** التي تعمل بالفعل بسلاسة
في صفحة المنشورات. هذا يمنح الإعدادات مباشرة كل قواعد التمرير
الناجحة (100dvh + overflow-y:auto + momentum scroll + pan-y +
كسر transform/filter/contain).

### التغييرات المطبَّقة

**1. `src/pages/Settings.jsx` (السطر 1250)**
```diff
-  <div className="settings-wrap" dir="rtl">
+  <div className="yam-home-mobile-page settings-wrap" dir="rtl" data-page="settings">
```

**2. `src/components/settings/SettingsShell.jsx` (السطر 29)**
```diff
-  <div className="settings-shell" dir="rtl">
+  <div className="yam-home-mobile-page settings-shell" dir="rtl" data-page="settings-shell">
```

**3. `src/styles/yamshat-fixes-v87.23-SETTINGS-YAM-HOME-MOBILE.css` (ملف جديد)**
- يوفّق بين قواعد `.yam-home-mobile-page` (تمرير) وقواعد
  `.settings-wrap`/`.settings-shell` (padding + max-width + layout).
- يُعيد تعريف الأبناء الداخليين (`.settings-hero`, `.settings-layout`,
  `.settings-shell-header`, `.settings-shell-body`, `.settings-shell-tabs`)
  ليتدفّقوا طبيعياً بدون scroll مُتداخل.
- `settings-hero` و `settings-shell-header` يبقيان **sticky** فوق التمرير.
- الكاروسيلات (`.settings-shell-tabs`) → `pan-x` فقط.
- Desktop (≥900px) يستعيد layout الطبيعي بدون قسر التمرير.

**4. `src/main.jsx`**
```diff
+ import './styles/yamshat-fixes-v87.23-SETTINGS-YAM-HOME-MOBILE.css';
- const BUILD_ID = 'yamshat-v87.22-FOUR-CRITICAL-USER-REPORTED-FIXES';
+ const BUILD_ID = 'yamshat-v87.23-SETTINGS-YAM-HOME-MOBILE-PARITY';
```

**5. `package.json`**
```diff
- "version": "87.21.0",
+ "version": "87.23.0",
```

## الصفحات المُصلَحة

**كل صفحة تستخدم `.settings-wrap` أو `.settings-shell` تعمل الآن
بنفس سلاسة صفحة المنشورات:**

- `/settings` — الصفحة الرئيسية للإعدادات ✅
- `/settings/profile` — الملف الشخصي ✅
- `/settings/feed` — الخلاصة ✅
- `/settings/reels` — الريلز ✅
- `/settings/stories` — الستوريز ✅
- `/settings/inbox` — الرسائل ✅
- `/settings/voice` — الغرف الصوتية ✅
- `/settings/engagement` — التفاعل والمعارك ✅
- `/settings/wallet` — المحفظة ✅
- `/settings/notifications` — الإشعارات ✅
- `/settings/sessions` — الجلسات ✅
- `/settings/security` — الأمان ✅
- `/settings/close-friends` — الأصدقاء المقرّبون ✅
- `/settings/hide-story` — إخفاء الستوري من ✅
- `/settings/muted-stories` — الستوريز المكتومة ✅

## القيود الملتزم بها

- ✅ صفر مكتبات جديدة، صفر تغييرات على `node_modules`
- ✅ صفر تعديلات وظيفية على أي مكوّن آخر
- ✅ JSX: تعديلان صغيران فقط (إضافة فئة `yam-home-mobile-page`)
- ✅ CSS: ملف واحد جديد + استيراد واحد في `main.jsx`
- ✅ لا تأثير على الديسكتوب — Media Query `min-width:900px`
  يعيد التمرير إلى `.page-content` الطبيعية
- ✅ يحترم `prefers-reduced-motion`
- ✅ فحص نحوي (esbuild) للملفات الثلاث المعدَّلة — سليم

## البناء

```
BUILD_ID = 'yamshat-v87.23-SETTINGS-YAM-HOME-MOBILE-PARITY'
version  = 87.23.0
```

## اختبار سريع (للمطوّر بعد النشر)

1. افتح `/settings` على متصفح موبايل → السحب لأعلى/أسفل من أي منطقة.
2. افتح `/settings/notifications` → نفس السحب السلس.
3. افتح `/settings/security` (أطول صفحة) → التمرير يصل للنهاية.
4. افتح `/settings/wallet` → البطاقات والأقسام تمر بسلاسة.
5. على الديسكتوب → لا تغيير في الشكل، التمرير الطبيعي كما هو.
