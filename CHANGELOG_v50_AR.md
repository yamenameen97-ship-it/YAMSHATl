# v50 — توحيد صفحة الإنشاء (Composer Unification) + إصلاح زر "post" المغطى في BottomNav

## ملخص التغيير
في النسخة v49 وما قبلها كان هناك **مؤلّفان متوازيان** للنشر:
1. `MobileComposeModal.jsx` (Modal خفيف للنص + صورة) — كان يُفتح من زر (+) في الـ BottomNav.
2. `ReelComposer.jsx` (صفحة كاملة بتصميم Pixel-perfect مطابقة للصورة المرجعية: كاميرا + فلاتر + مؤثرات + مدة + سرعة + جودة + ميكروفون + ترجمة + ...) — كانت **معرّفة لكن غير مربوطة بأي route**.

نتج عن ذلك:
- زر "post" في الهيدر السفلي يظهر **مغطّى/مسحوب للأسفل** ولا يفتح الصفحة المطلوبة (الصورة 2 المرفقة).
- المستخدم يرى مؤلّفاً قديماً بميزات محدودة بدلاً من صفحة الرفع الكاملة المطلوبة (الصورة 1).

في v50 تم:

### 1. اعتماد ReelComposer كصفحة الإنشاء **الموحّدة** لكل سياقات الرفع
- إضافة routes جديدة في `App.jsx`:
  - `/compose` (الافتراضي)
  - `/compose?tab=post|reel|story|photo|live|templates` (يحدد التبويب الأولي)
  - `/reels/compose`, `/reels/new`, `/post/compose`, `/post/new` (aliases)
- `ReelComposer` يقرأ `?tab=...` ويفتح التبويب الصحيح تلقائياً.

### 2. إعادة توجيه زر "+" في BottomNav
`components/mobile/BottomNav.jsx` — تم تغيير `resolveCreateAction`:
- داخل `/reels` → `/compose?tab=reel`
- داخل `/stories` → `/compose?tab=story`
- في أي مكان آخر → `/compose?tab=post`
- استثناءات محفوظة: `/groups` (مجموعة جديدة), `/inbox|/chat` (دردشة جديدة عبر event).
- **الزر لم يعد يطلق modal**، بل ينتقل لصفحة كاملة → اختفاء مشكلة "post المغطى".

### 3. ربط جميع أزرار ReelComposer بأحداثها
كانت الأحداث موجودة لكن غير قابلة للوصول لأن الصفحة لم تكن مربوطة بـ route. تم التأكد أن:
- **الشريط العلوي:** إغلاق (X) → `navigate(-1)` | إضافة صوت → `BottomSheet[audio]` | الإعدادات → `BottomSheet[settings]`
- **العمود الأيمن (يمين الشاشة):** قلب الكاميرا (front/back) | الفلاش (off/on/auto) | الجودة (480p/720p/1080p/2K/4K) | الميكروفون (on/off) | فلاتر الضوضاء (on/off) | كتم الأصوات | الترجمة
- **العمود الأيسر:** المدة (15/30/60/90s) | السرعة (0.3x→3x) | تحسين | الفلاتر (none/enhance/warm/cool/vintage/mono) | المؤثرات | المؤقت (0/3/5/10s) | التخطيط (9:16/1:1/4:5/16:9) | تجميل
- **زر التسجيل (الوسط):** ضغطة → بدء/إيقاف التسجيل عبر `MediaRecorder` (يحترم `timer` و `duration`)
- **زر الإلغاء (X):** يفرّغ المسجَّل/المختار
- **زر التأكيد (✓):** يرفع الفيديو عبر `mediaUploadService.uploadFile` ثم `POST /reels` (مع fallback لـ `/reels/create`)
- **تابات النوع (نشر/لايف/ريلز/صورة/قوالب):** تتبدّل داخل نفس الصفحة، باستثناء **لايف** الذي ينتقل لـ `/voice`.
- **الشريط السفلي:** المعرض → فتح ملف من الجهاز | المسودات → `/settings/reels`
- **حدث تبديل التابات** يحدّث `?tab=...` في URL لكي يصمد التحديث.

### 4. تعطيل المؤلّف القديم MobileComposeModal
- تحويله إلى **stub معطّل** في `components/mobile/MobileComposeModal.jsx`:
  - يستقبل `open={true}` ويقوم تلقائياً بـ `navigate('/compose?tab=...')` ثم يستدعي `onClose()`.
  - هذا يضمن **التوافق الخلفي**: أي كود قديم لم يُحدَّث بعد لن ينكسر، بل يفتح الصفحة الجديدة تلقائياً.
- إزالة جميع استخداماته من `pages/FeedMobile.jsx`:
  - حُذف `<MobileComposeModal />`.
  - حُذفت حالة `composerOpen` / `composerAction` / `setComposerOpen` / `setComposerAction`.
  - `openComposerWithAction(action)` أصبحت تستدعي `navigate('/compose?tab=...')`.
  - حدث `yamshat:open-composer` المُتلَقَّى أصبح يُحوّل لـ `/compose`.
  - معالجة `?compose=1` في URL تُحوّل لـ `/compose?tab=post`.

### 5. ربط شريط "بماذا تفكر؟" (MobileComposer)
`components/mobile/MobileComposer.jsx`:
- استيراد `useNavigate`.
- `open(action)` أصبح يستدعي `navigate('/compose?tab=...')` بدلاً من dispatch event.

### 6. ربط زر "إضافة ستوري" في MobileTopBar
`components/mobile/MobileTopBar.jsx`:
- زر `+` على دائرة الستوري يُحوّل لـ `/compose?tab=story`.

### 7. وضع fullscreen لصفحة /compose
`components/layout/MainLayout.jsx`:
- إضافة `isComposerRoute` (يطابق `/compose`, `/reels/compose`, `/reels/new`, `/post/compose`, `/post/new`).
- داخل هذه المسارات: **يُخفى الهيدر العلوي والسفلي معاً** → الصفحة fullscreen مطابقة للصورة المرجعية (1).

## الملفات المعدّلة
1. `frontend/src/App.jsx` — إضافة routes `/compose` + aliases.
2. `frontend/src/pages/ReelComposer.jsx` — قراءة `?tab=` + تحديث URL عند تبديل التابات.
3. `frontend/src/pages/FeedMobile.jsx` — إزالة modal القديم + ربط navigate.
4. `frontend/src/components/mobile/BottomNav.jsx` — توجيه زر "+" لـ `/compose`.
5. `frontend/src/components/mobile/MobileComposer.jsx` — navigate بدلاً من event.
6. `frontend/src/components/mobile/MobileComposeModal.jsx` — تحوّل لـ stub معطّل (redirect).
7. `frontend/src/components/mobile/MobileTopBar.jsx` — زر ستوري يُحوّل لـ `/compose?tab=story`.
8. `frontend/src/components/layout/MainLayout.jsx` — `isComposerRoute` لإخفاء الـ chrome.

## نتيجة بصرية
- **الصورة 1 (ReelComposer)** أصبحت تظهر كصفحة كاملة عند ضغط أي زر إنشاء.
- **الصورة 2 (post مغطى)** تم حلها لأن:
  - الـ BottomNav لم يعد يفتح modal بل ينتقل لصفحة جديدة.
  - الـ MobileComposeModal الذي كان يسحب نفسه للأعلى/الأسفل تم تعطيله كلياً.
  - الصفحة الجديدة تعمل fullscreen → لا يوجد عنصر "محشور" بين الـ BottomNav والمحتوى.

## فحوصات نُفِّذت
- ✅ Syntax check (esbuild) على كل الملفات الثمانية المعدّلة → جميعها OK.
- ✅ لا توجد استخدامات نشطة متبقية لـ `MobileComposeModal` خارج الـ stub.
- ✅ جميع الـ events (`yamshat:open-composer`) لها مستمع يحوّل لـ `/compose` للتوافق الخلفي.
