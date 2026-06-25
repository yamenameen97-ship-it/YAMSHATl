# v59.13.13 — خمس إصلاحات جديدة (Five New Fixes)

## النواقص الخمس المكتشفة في الفحص الجديد

### ✅ #1 — قائمة الثلاث نقاط (••• MoreOptionsMenu) — المنشورات/الريلز/الستوري/البلاغات
**القسم:** البلاغات + المنشورات + الريلز + الستوري (كل أنواع المحتوى تستخدم هذا المكوّن)
**المشكلة:**
- القائمة المنسدلة لا تُغلق بمفتاح **ESC**.
- لا تستجيب للمس على الجوال (`mousedown` فقط بدون `touchstart`) → النقر خارج القائمة على الجوال لا يغلقها.
- زر الـ trigger يفتقر إلى `aria-haspopup` و `aria-expanded` (إمكانية الوصول).
- بعد الإغلاق بـ ESC، التركيز يضيع ولا يعود إلى زر الـ trigger.

**الحل:**
- إضافة listener لـ `keydown` يلتقط **Escape** ويغلق القائمة + يعيد التركيز لزر الـ trigger.
- إضافة listener لـ `touchstart` بجانب `mousedown` ليغلق القائمة عند اللمس خارجها.
- إضافة `aria-haspopup="menu"` و `aria-expanded={openMenu}` على زر الـ trigger.
- إضافة `role="menu"` على الحاوية و `role="menuitem"` على كل عنصر.
- استخدام `triggerRef` لإرجاع التركيز بعد ESC.

---

### ✅ #2 — عارض الستوري (StoryViewerEnhanced) — تنظيف الحالة عند تبديل المستخدم
**القسم:** الستوري
**المشكلة (Privacy bug خطير):**
عند تغيير `group?.user_id` (التنقل بين ستوريات مستخدمين مختلفين):
- `replyText` لا يُمسح → مسوّدة الرد لـ User A تبقى في صندوق إدخال ستوري User B.
- `showReactions` لا تُعاد → لوحة الإيموجي تبقى مفتوحة.
- `paused` لا يُعاد → الستوري الجديدة قد تفتح موقوفة.

**سيناريو الخلل:** المستخدم يبدأ كتابة رد حساس لـ User A → يضغط Tap لتجاوزه → يصل إلى User B → الضغط على Enter يُرسل النص إلى User B!

**الحل:** إضافة `setReplyText('')` و `setShowReactions(false)` و `setPaused(false)` داخل `useEffect` الخاص بـ `[group?.user_id]`.

---

### ✅ #3 — طلبات الصداقة (Friends.jsx) — مزامنة searchResults
**القسم:** طلبات الصداقة / الأصدقاء
**المشكلة:**
- `handleDismiss`: يحذف الشخص من `suggestions` لكن **لا يحذفه من `searchResults`**. إذا كان المستخدم يبحث بالاسم وضغط "إزالة"، الشخص يبقى في نتائج البحث، والضغط على "إزالة" مرة ثانية يُعيد طلب API ويُرجع خطأ.
- `handleAccept`: يضيف الشخص لقائمة `friends` لكن لا يُحدّث حالته في `suggestions` و `searchResults`. النتيجة: نفس الشخص يظهر بزرَّي "إضافة/حذف" بدل "صديقك".

**الحل:**
- في `handleDismiss`: إضافة `setSearchResults((prev) => prev.filter(...))`.
- في `handleAccept`: إضافة `markAccepted` updater يطبَّق على `suggestions` و `searchResults` ليغيّر `friendship.status` إلى `'accepted'`.

---

### ✅ #4 — شريط الرسائل المثبَّتة في المجموعات (GroupPinnedBar) — دعم لوحة المفاتيح
**القسم:** المجموعات
**المشكلة:**
- العنصر `<div role="button" onClick={...}>` لكن بدون `onKeyDown` ولا `tabIndex={0}`.
- مستخدمو لوحة المفاتيح وقارئات الشاشة (NVDA/VoiceOver) **لا يستطيعون** فتح قائمة الرسائل المثبّتة.
- لا يوجد `aria-label` يُعرّف عدد الرسائل المثبّتة.

**الحل:**
- إضافة `tabIndex={0}` ليكون العنصر قابلاً للتركيز بـ Tab.
- إضافة `onKeyDown={handleBarKey}` يدعم **Enter / Space** للفتح/الإغلاق و **Escape** للإغلاق فقط.
- إضافة `aria-label` ديناميكي بعدد الرسائل المثبّتة.

---

### ✅ #5 — نافذة تفعيل الإشعارات (NotificationPermissionPrompt) — TTL + isMounted
**القسم:** الإشعارات
**المشكلتان:**
1. عند ضغط "إخفاء"، تخزَّن قيمة `'1'` في `localStorage` **بدون أي انتهاء صلاحية**. النتيجة: المستخدم الذي رفض مرة واحدة لن يرى النافذة **أبداً** حتى لو غيّر رأيه بعد شهور — ولا توجد طريقة لإعادة عرضها إلا عبر إعدادات المتصفح يدوياً.
2. `handleEnable` يستدعي `setPermission` و `setBusy(false)` بعد `await` بدون فحص mount → خطأ React في لوج الكونسول لو المستخدم أغلق التطبيق أثناء الطلب.

**الحل:**
- استبدال `'1'` بطابع زمني `Date.now()` يُخزَّن عند الـ dismiss.
- إضافة دالة `isDismissActive()` تحسب TTL = **7 أيام** قبل إعادة عرض النافذة (متوافقة بأثر رجعي مع القيمة `'1'` القديمة).
- إضافة `isMountedRef` وحراسة جميع استدعاءات `setState` بعد `await` في `handleEnable`.

---

## الملفات المعدّلة (5)
1. `frontend/src/components/reports/MoreOptionsMenu.jsx`
2. `frontend/src/components/stories/StoryViewerEnhanced.jsx`
3. `frontend/src/pages/Friends.jsx`
4. `frontend/src/components/groups/GroupPinnedBar.jsx`
5. `frontend/src/components/notifications/NotificationPermissionPrompt.jsx`

## ملاحظات الانتشار
- لا تغييرات في الـ API ولا في الـ backend.
- لا تغييرات في `package.json` أو الـ dependencies.
- متوافق رجعياً 100% مع v59.13.12.
- لا حاجة لـ migrations.
