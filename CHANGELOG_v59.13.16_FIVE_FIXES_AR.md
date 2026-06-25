# 📋 CHANGELOG v59.13.16 — إصلاح 5 نواقص جديدة

**التاريخ:** 2026-06-25
**الإصدار:** 59.13.16
**النوع:** Bug Fixes (5 نواقص حقيقية مكتشفة)

---

## 🎯 الملخص التنفيذي

تم اكتشاف وإصلاح **5 نواقص فعلية** عبر مراجعة دقيقة للكود، لم تكن قد عُولجت في الإصدارات السابقة:

| # | القسم | الملف الرئيسي |
|---|---|---|
| 1 | الريلز | `pages/Reels.jsx` |
| 2 | الستوري | `components/stories/StoryViewerEnhanced.jsx` |
| 3 | الإشعارات | `pages/settings/NotificationsSettingsPage.jsx` |
| 4 | الشات (الصوت) | `components/chat/VoiceRecorder.jsx` |
| 5 | المنشورات | `components/feed/ProFeedPostCard.jsx` |

---

## 🔧 الإصلاحات بالتفصيل

### FIX #1 — زر "إبلاغ" في صفحة الريلز ✅
**المشكلة:** `ReportModal` كان موجوداً في الكود لكنه لم يُربط أبداً بصفحة الريلز، فلم يكن هناك أي زر إبلاغ على الريل.

**الحل:**
- استيراد `ReportModal` في `pages/Reels.jsx`.
- إضافة زر "إبلاغ" 🚩 في القائمة الجانبية للريل (تحت زر "مشاركة").
- إضافة state `reportTarget` لتخزين الريل المستهدف.
- ربط الزر بفتح المودال مع `targetType="reel"`.

```jsx
import ReportModal from '../components/reports/ReportModal.jsx';
// ...
const [reportTarget, setReportTarget] = useState(null);
// ...
<button onClick={() => setReportTarget({ id: reel.id, label: `ريل @${reel.username}` })}>
<ReportModal open={!!reportTarget} ... targetType="reel" />
```

---

### FIX #2 — زر "إبلاغ" في عارض الستوري ✅
**المشكلة:** لا يوجد طريقة للإبلاغ عن قصة شخص آخر من داخل عارض الستوري.

**الحل:**
- استيراد `ReportModal` في `StoryViewerEnhanced.jsx`.
- إضافة state `showReport`.
- إضافة زر 🚩 في هيدر العارض **فقط لقصص الآخرين** (`!isOwner`).
- عند فتح المودال يتم إيقاف الستوري مؤقتاً (`setPaused(true)`) واستئنافه عند الإغلاق.
- ربط بـ `targetType="story"` والـ `current.id`.

---

### FIX #3 — حفظ إعدادات الإشعارات + طلب صلاحية Push ✅
**المشاكل:**
1. الإعدادات الجديدة (Push/Realtime/DeepLink) لم تكن تُحفظ فعلياً.
2. تفعيل "Push" لم يكن يطلب صلاحية المتصفح، فيبقى التبديل ON بلا تأثير حقيقي.

**الحل:**
- إعادة كتابة `NotificationsSettingsPage.jsx` بالكامل:
  - مفتاح localStorage الجديد: `yamshat:notifications-settings:v2` (+ نشر `CustomEvent('yamshat:notifications-settings-changed')` ليلتقطها بقية الخدمات).
  - افتراضي `pushEnabled: false` (لأن المتصفح يحتاج إذناً صريحاً).
  - إضافة مفتاحَين صريحَين: `realtimeEnabled` و `deepLinkEnabled`.
  - دالة `requestBrowserPushPermission()` تستدعي `Notification.requestPermission()` فعلياً.
  - `onTogglePush()` يتعامل مع كل الحالات: `granted` / `denied` / `default` / `unsupported`.
  - رسالة واضحة للمستخدم عند الرفض أو عدم الدعم.
  - عند التحميل: إن كان push مفعَّلاً سابقاً لكن المتصفح لم يعد يمنح الإذن، تتم إعادة المزامنة تلقائياً إلى OFF.

---

### FIX #4 — تسجيل صوتي بدون تجميد + حد أقصى للمدة ✅
**المشاكل:**
1. `window.alert` يجمّد الواجهة بالكامل عند رفض الميكروفون (UX سيء جداً).
2. لا يوجد حد أقصى للتسجيل → يمكن تسجيل ملف بحجم 100MB دون أي تحذير.

**الحل في `VoiceRecorder.jsx`:**
- إزالة `window.alert` بالكامل، استبدالها بـ **بنر خطأ غير حاجب** داخل المكوّن (مثل التوست).
- تصنيف ذكي لأخطاء `getUserMedia`:
  - `NotAllowedError` → "تم رفض الوصول للميكروفون..."
  - `NotFoundError` → "لا يوجد ميكروفون متاح..."
  - `NotReadableError` → "الميكروفون مشغول بتطبيق آخر..."
  - `SecurityError` → "يتطلب اتصالاً آمناً (HTTPS)..."
- إضافة prop `maxSeconds` (افتراضي **300 ثانية = 5 دقائق**).
- إيقاف تلقائي عند بلوغ الحد الأقصى مع رسالة واضحة.
- شريط تقدّم بصري للمدة `mm:ss / mm:ss` يتحوّل للون التحذيري عند تجاوز 90%.
- تنظيف `errorTimerRef` ضمن cleanup على unmount.

---

### FIX #5 — handleReport يرسل فعلياً إلى /reports ✅
**المشكلة:** `ProFeedPostCard.handleReport` كان يحفظ البلاغ في `localStorage` فقط ولم يُرسله أبداً للخادم، فالـ admin panel لا يرى البلاغات.

**الحل:**
- استيراد `submitReport` من `api/reports.js`.
- جعل `handleReport` async ويستدعي `submitReport()` فعلياً.
- استراتيجية "online-first مع fallback محلي":
  - يُرسل البلاغ للخادم → إن نجح، يُحفظ محلياً مع `synced: true`.
  - إن فشل → يُحفظ محلياً مع `synced: false` لإعادة الإرسال لاحقاً.
- رسالة Toast مختلفة لكل حالة (success / warning).
- التحقق من اختيار سبب البلاغ قبل الإرسال.
- payload متوافق مع schema الخادم: `target_type='post'`, `target_id`, `reason`, `details`, `context`.

---

## 🎁 إصلاح إضافي (Bonus)

### TDZ في ReelPlayer.jsx
**المشكلة:** `onProgressKey` (المُضاف في v59.13.15) كان يعتمد على `wakeImmersion` المُعرَّف **بعده** في الملف → ReferenceError في وقت التشغيل ("Cannot access 'wakeImmersion' before initialization").

**الحل:** إعادة ترتيب الـ hooks بحيث يُعرَّف `wakeImmersion` قبل `onProgressKey`.

---

## ✅ التحقق

- [x] جميع الملفات الست تجتاز فحص esbuild (JSX syntax valid).
- [x] لا أخطاء TDZ في ReelPlayer.
- [x] ReportModal مرتبط بكل من: المنشور، الريل، الستوري.
- [x] Push permission يُطلب فعلياً من Notification API.
- [x] VoiceRecorder لا يستخدم window.alert أبداً.
- [x] handleReport يستدعي POST /api/reports فعلياً.

---

## 📦 الملفات المُعدَّلة

```
frontend/package.json                                          (version bump)
frontend/src/pages/Reels.jsx                                   (FIX #1)
frontend/src/components/stories/StoryViewerEnhanced.jsx        (FIX #2)
frontend/src/pages/settings/NotificationsSettingsPage.jsx      (FIX #3, rewrite)
frontend/src/components/chat/VoiceRecorder.jsx                 (FIX #4)
frontend/src/components/feed/ProFeedPostCard.jsx               (FIX #5)
frontend/src/components/reels/ReelPlayer.jsx                   (Bonus TDZ fix)
```

---

**نهاية التغييرات — v59.13.16**
