# v59.13.12 — خمس إصلاحات جديدة (Five New Fixes)

## الإصلاحات الخمسة المطبّقة

### ✅ #1 — الإشعارات (NotificationList)
**المشكلة:** الضغط على إشعار **مقروء بالفعل** كان يستدعي `markNotificationRead` API بلا داعٍ (هدر شبكة). كذلك العنصر لم يكن يدعم لوحة المفاتيح (Enter/Space) ولا focus state.
**الحل:** إضافة فحص `if (n.read) return` قبل استدعاء الـ API، إضافة `role="button"`, `tabIndex={0}`, `onKeyDown` لدعم Enter/Space، وإضافة `outline` بصري عند التركيز. حذف `markRead/markAllRead` غير المستخدمَين.

### ✅ #2 — مودال البلاغات (ReportModal)
**المشكلة:** المودال يفتح فوق كل الصفحات لكن:
- لا يُغلق بمفتاح ESC.
- لا يُقفل تمرير الخلفية، فالمستخدم يستطيع scroll للصفحة من تحت المودال.

**الحل:** إضافة `useEffect` جديد عند `open=true` يضيف listener لـ Escape ويضبط `document.body.style.overflow='hidden'`، ويُعيد القيمة الأصلية عند الإغلاق.

### ✅ #3 — الريلز (ReelPlayer)
**المشكلة:** الضغط المزدوج (double-tap) كان يستدعي `onLike` بدون النظر إلى `reel.isLiked`. النتيجة: لو الريل مُعجَب به مسبقاً → double-tap **يلغي الإعجاب** (سلوك مخالف لـ Instagram/TikTok).
**الحل:** فحص `if (!reel?.isLiked)` قبل استدعاء `onLike` داخل `triggerHeart`. الآن double-tap = إعجاب فقط، لا toggle.

### ✅ #4 — الشات (ChatInput) — إلغاء الرفع عند تبديل المحادثة
**المشكلة:** عند رفع مرفقات كبيرة ثم تبديل peer:
- `setAttachments([])` يُفرغ الواجهة، لكن `mediaUploadService.uploadFile` لم يكن يستقبل `signal`.
- نتيجة: الرفع يستمر في الخلفية، يستهلك شبكة، وقد يصل المرفق لمحادثة خاطئة على السيرفر.

**الحل:** إضافة `uploadControllersRef = useRef(new Set())` يتتبّع كل `AbortController` نشط، تمرير `controller.signal` إلى `mediaUploadService.uploadFile`، استدعاء `abortAllUploads()` عند تبديل peer وعند unmount، وتجاهل `AbortError/ERR_CANCELED` في catch block.

### ✅ #5 — شريط الستوريات (StoriesBar) — وقف polling في الخلفية
**المشكلة:** `setInterval(loadGroups, 60_000)` يستمر بالتشغيل حتى عندما يكون التبويب مخفياً → استنزاف بطارية وبيانات على الجوال.
**الحل:**
- داخل callback الـ interval: فحص `document.hidden` وتجاوز fetch.
- إضافة `visibilitychange` listener: عند العودة للتبويب (`!document.hidden`) → استدعاء `loadGroups()` فوراً لتحديث المحتوى.
- تنظيف صحيح للـ listener عند unmount.

## الملفات المعدّلة (5)
1. `frontend/src/components/notifications/NotificationList.jsx`
2. `frontend/src/components/reports/ReportModal.jsx`
3. `frontend/src/components/reels/ReelPlayer.jsx`
4. `frontend/src/components/chat/ChatInput.jsx`
5. `frontend/src/components/stories/StoriesBar.jsx`
