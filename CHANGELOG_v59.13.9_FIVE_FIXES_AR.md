# 📝 Yamshat Dashboard — v59.13.9 — إصلاح 5 نواقص جديدة (تتمة v59.13.8)

## 🎯 ملخّص الإصدار

بعد فحص منهجي **جديد ومنفصل** عن جلسات الفحص السابقة (v59.13.3 → v59.13.8)،
لأقسام: **الشات / المجموعات / الستوري / الريلز / المنشورات / الإشعارات /
طلبات الصداقة / البلاغات**،
تم اكتشاف **5 نواقص جديدة** خفيّة لم تُعالَج من قبل، ثم إصلاحها جميعاً.

النواقص الجديدة المُكتشفة تتعلّق بمحاور **لم تُغطَّ في v59.13.8**:
- **`pages/Notifications.jsx`** — معالج socket realtime async بدون `isMountedRef`.
- **`components/notifications/NotificationList.jsx`** — خطأ ترجمة + استدعاء
  `Notification API` بدون فحص الدعم والرؤية.
- **`components/reports/ReportModal.jsx`** — حالة `submitting` لا تُعاد ضبطها
  عند إعادة فتح المودال + لا يوجد `AbortController` للطلب الجاري.
- **`pages/Friends.jsx`** — 6 معالِجات لإجراءات الصداقة (تأكيد/حذف/إضافة/إلغاء/
  إزالة مقترح/إلغاء صداقة) لا تفحص `mountedRef` بعد `await`.
- **`pages/Inbox.jsx`** — `loadData` بـ 8+ من `setState` بعد `Promise.allSettled`
  بدون حماية unmount + `NewChatComposeModal` بحث المستخدمين وإنشاء المجموعة
  بدون حماية.

النتائج المتوقّعة بعد الإصلاحات:
- 🔇 اختفاء تحذيرات React: `Can't perform a state update on an unmounted component`
  من: استلام الإشعارات في الوقت الفعلي، صفحة الإشعارات الجانبية، إرسال البلاغات،
  إجراءات الأصدقاء، الدخول/الخروج السريع من صفحة الشات الرئيسية.
- 🔒 طلبات البلاغ المُلغاة تُلغى فعلياً (AbortController) ولا تستمر في الخلفية.
- ⏳ زر "إرسال البلاغ" يعود لحالته الطبيعية فوراً عند إعادة فتح مودال البلاغ.
- 🌐 إصلاح ترجمة فلتر الإشعارات: `Mentions` كان معروضاً "منشورات" (Posts).
- 📱 لا يصدر إشعار نظام (OS notification) إذا المستخدم بالفعل ينظر إلى التطبيق
  (احترام `document.visibilityState`).

---

## ✅ المشكلة 1 — `src/pages/Notifications.jsx`

### الموقع: `useEffect` المستمع لـ `socketManager.on('new_notification', ...)`

**السبب الجذري:**

```js
const handleIncoming = async (incoming) => {
  const nextItem = normalizeNotification(incoming);
  upsertNotification(nextItem);                          // setState عبر zustand
  audioService.onNotification(nextItem.type || 'generic');
  pushToast({ ... });                                    // setState داخل ToastProvider
  if (settings.pushEnabled)
    await maybeShowBrowserNotification(nextItem)         // عمليّة async طويلة
      .catch(() => null);
};
```

السيناريو المعطِّب:
1. المستخدم يفتح صفحة `/notifications`، يصل إشعار socket جديد، تبدأ `handleIncoming`.
2. أثناء `await maybeShowBrowserNotification(...)` (قد يأخذ ثوانٍ على الجوال)،
   المستخدم يضغط على إشعار ليفتح المحتوى → `Notifications.jsx` يُزال (unmount).
3. عند انتهاء `await` → `pushToast` و `audioService.onNotification` يستدعيان على
   مكوّن مُزال → **تحذيرات React** + إشعار صوتي مكرّر.
4. كذلك: عند تبديل `settings.realtimeEnabled` من `true` إلى `false`، الـ effect
   يُلغي الاشتراك لكن أي `handleIncoming` قيد التنفيذ يستكمل setState.

**الإصلاح:**

1. إضافة `isMountedRef = useRef(true)` + `useEffect` cleanup يضبطه على `false`.
2. إضافة علم محلي `subscriptionActive` داخل effect الاشتراك يُضبط `false` في cleanup.
3. فحص `subscriptionActive && isMountedRef.current` قبل **كل** استدعاء:
   - قبل `upsertNotification` (للأمان).
   - قبل `audioService.onNotification` و `pushToast`.
   - مرة أخرى بعد `await maybeShowBrowserNotification`.
4. تغليف `unsubscribe?.()` في cleanup بـ `try/catch` لحماية ضد socket مفصول مسبقاً.
5. تطبيق نفس النمط على `load()` الأولي (`active && isMountedRef.current`).

---

## ✅ المشكلة 2 — `src/components/notifications/NotificationList.jsx`

### الموقع (أ): زر فلتر `mentions` يعرض تسمية خاطئة

**السبب الجذري — خطأ ترجمة بسيط لكن مرئي:**

```js
{f === 'all' ? 'الكل' : f === 'unread' ? 'غير مقروء' : 'منشورات'}
```

`mentions` تعني "الإشارات/المنشنات" بينما `منشورات` تعني "Posts" — المستخدم
يضغط على الزر متوقّعاً المنشورات لكنه يحصل على الإشارات/المنشنات فقط، تجربة
مربكة جداً.

### الموقع (ب): استدعاء `Notification API` بدون حماية

**السبب الجذري:**

```js
if (Notification.permission === 'granted') {
  new Notification(notification.title, { body: notification.message });
}
```

ثلاث مشاكل:
1. **`Notification` غير معرّف في SSR** أو في إصدارات قديمة من iOS Safari (< 16.4)
   → استدعاء خاصية على `undefined` يرمي خطأ.
2. **لا يوجد `try/catch`** — حتى لو `Notification` موجود، `new Notification(...)`
   قد يرمي `NotAllowedError` على بعض المتصفّحات.
3. **إشعار OS يظهر حتى لو المستخدم بالفعل فاتح صفحة الإشعارات** — مزعج جداً
   ومكرّر بصرياً (هو يرى الإشعار في القائمة بالفعل).
4. **لا حماية unmount** — store يُحدَّث، ثم socket callback يُستدعى بعد unmount.

**الإصلاح:**

1. إضافة `isMountedRef = useRef(true)` + cleanup.
2. فحص `isMountedRef.current` في بداية callback الـ socket.
3. تغليف `new Notification(...)` بفحص ثلاثي:
   ```js
   if (typeof Notification !== 'undefined' &&
       Notification.permission === 'granted' &&
       typeof document !== 'undefined' &&
       document.visibilityState === 'hidden') {
     new Notification(notification.title, { body: notification.message });
   }
   ```
4. تغليف الكل بـ `try/catch` لحماية ضد متصفّحات تحجب البناء المباشر.
5. تصحيح تسمية الزر: `'منشورات'` → `'إشارات (Mentions)'`.
6. تغليف `unsubscribe?.()` بـ `try/catch`.

---

## ✅ المشكلة 3 — `src/components/reports/ReportModal.jsx`

### الموقع: `submit()` async + `useEffect([open])` لا يُعيد ضبط `submitting`

**السبب الجذري — الجانب (أ) `submitting` عالقة:**

```js
useEffect(() => {
  if (open) {
    setReason(''); setDetails(''); setDone(false); setError('');
    // ← submitting غير مُعاد ضبطه!
  }
}, [open]);
```

السيناريو:
1. المستخدم يضغط "إرسال البلاغ" → `setSubmitting(true)`.
2. أثناء `await axios.post(...)` يضغط "إلغاء" → `onClose()` → `open=false`.
3. الـ axios يُكمل في الخلفية → `setSubmitting(false)` يطرح **تحذير unmount**.
4. المستخدم يعيد فتح المودال (`open=true`) → reason/details/done/error مُعاد ضبطها،
   لكن **`submitting=true` إذا الطلب لم ينتهِ بعد** → الزر يبقى "جارٍ الإرسال..."
   ولا يمكن النقر عليه.

**السبب الجذري — الجانب (ب) لا يوجد `AbortController`:**

طلب البلاغ يستمر في الخلفية حتى لو أغلق المستخدم المودال — مضيعة لـ bandwidth
ومخاطرة بإرسال بلاغ غير مقصود (لو ضغط "إلغاء" بمعنى "لا أريد الإبلاغ").

**الإصلاح:**

1. إضافة `isMountedRef = useRef(true)` + `abortRef = useRef(null)` + cleanup.
2. عند `open=true`: إعادة ضبط `submitting=false` أيضاً.
3. عند `open=false`: استدعاء `abortRef.current?.abort?.()` لإلغاء أي طلب جارٍ.
4. عند unmount: نفس الإلغاء.
5. داخل `submit()`:
   - إنشاء `AbortController` جديد وحفظه في `abortRef.current`.
   - تمرير `signal: controller.signal` لـ `axios.post`.
   - في `try`: `if (isMountedRef.current) setDone(true)`.
   - في `catch`: فحص `axios.isCancel || e.code === 'ERR_CANCELED'` للتجاهل.
   - في `finally`: تنظيف `abortRef.current === controller ? null` لمنع تسرّب المرجع.

---

## ✅ المشكلة 4 — `src/pages/Friends.jsx`

### الموقع: 6 معالِجات إجراءات (handleAccept, handleDeclineIncoming, handleSendRequest, handleCancelOutgoing, handleDismiss, handleUnfriend)

**السبب الجذري:**

الصفحة بالفعل تحوي `mountedRef` ولكنه يُستخدم **فقط** في `loadAll` والـ debounced
search effect. أما المعالِجات الستة لإجراءات المستخدم فلا تفحصه بعد `await`:

```js
const handleAccept = async (friendshipId) => {
  try {
    setBusy(`accept-${friendshipId}`);
    await acceptFriendRequest(friendshipId);     // ← await طويل
    setRequests((prev) => prev.filter(...));     // ← setState بدون فحص!
    setFriends((prev) => [...]);                  // ← setState بدون فحص!
    setStats((s) => ({ ... }));                   // ← setState بدون فحص!
  } catch (err) {
    setActionError(err?.response?.data?.detail || '...');  // ← setState!
  } finally {
    setBusy('');                                  // ← setState!
  }
};
```

السيناريو المتكرّر:
1. المستخدم يضغط "تأكيد" على طلب صداقة (`handleAccept`).
2. الـ API يأخذ ثانية أو اثنين.
3. المستخدم — بدون انتظار — يضغط على صورة الشخص لفتح ملفه الشخصي.
4. صفحة `Friends.jsx` تُزال (unmount).
5. عند انتهاء `await acceptFriendRequest` → 4 من setState تطلق تحذيرات.

هذا الموقف لم يُغطَّ في v59.13.8 — التركيز كان على الفيد/الستوري/الريلز.

**الإصلاح:**

في كل واحد من المعالِجات الستة، إضافة:
1. بعد `await ...`: `if (!mountedRef.current) return;`
2. في `catch`: `if (mountedRef.current) setActionError(...)`.
3. في `finally`: `if (mountedRef.current) setBusy('')`.

النتيجة: المستخدم يستطيع الانتقال السريع بعد أي إجراء صداقة دون تحذيرات أو
تسرّبات ذاكرة.

---

## ✅ المشكلة 5 — `src/pages/Inbox.jsx`

### الموقع (أ): `loadData` بـ 8+ من `setState` بعد `Promise.allSettled` بدون cleanup

**السبب الجذري:**

```js
const loadData = useCallback(async (silent = false) => {
  if (silent) setRefreshing(true); else setLoading(true);
  const results = await Promise.allSettled([
    getChatThreads(), getNotifications(40), getGroups(), getMe(),
  ]);
  // ← هنا قد يكون المستخدم خرج بالفعل من الصفحة
  setThreads(...); setNotifications(...); setGroups(...); setProfile(...);
  setLoading(false); setRefreshing(false);
}, [pushToast]);

useEffect(() => { loadData(false); }, [loadData]);
// ← لا cleanup، لا cancellation
```

`Inbox` هي صفحة `/inbox` الرئيسية للشات. المستخدم في 90% من المرّات يدخلها
ويضغط فوراً على محادثة → unmount. خلال هذه اللحظات الـ `Promise.allSettled`
لـ 4 طلبات API لم يكتمل بعد → كل 6 من setState يطلقون تحذيرات.

### الموقع (ب): `NewChatComposeModal` بحث المستخدمين وإنشاء المجموعة

نفس النمط داخل المودال:
- `useEffect([open, tab, query])` يستدعي `getUsers` ثم `setUsers/setSearching`
  بدون `cancelled` flag.
- `handleCreateGroup` async يستدعي `createGroup` ثم `setCreatingGroup(false)`
  بدون فحص mount (المستخدم قد يغلق المودال أثناء إنشاء المجموعة).

**الإصلاح:**

1. **في `Inbox`:**
   - إضافة `inboxMountedRef = useRef(true)` + cleanup.
   - بعد `await Promise.allSettled(...)`: `if (!inboxMountedRef.current) return;`
   - فحص واحد يحمي جميع الـ 6 setState التالية.

2. **في `NewChatComposeModal` (نفس الملف):**
   - useEffect البحث: إضافة `cancelled = false` + cleanup يضبطه `true`،
     وفحص قبل كل `setUsers/setSearching`.
   - `handleCreateGroup`: إضافة `composeMountedRef` منفصل + فحص قبل
     `setCreatingGroup(false)` و `pushToast` و `onClose` و `navigate`.

---

## 📂 الملفات المُعدَّلة

| الملف | السطور المعدّلة | نوع التعديل |
|---|---|---|
| `frontend/src/pages/Notifications.jsx` | 1, 80-110, 100-115, 115-145 | إضافة isMountedRef + subscriptionActive |
| `frontend/src/components/notifications/NotificationList.jsx` | 1-25, 56-65 | إضافة isMountedRef + تصحيح ترجمة + حماية Notification API |
| `frontend/src/components/reports/ReportModal.jsx` | 17, 46-65, 67-100 | إضافة isMountedRef + abortRef + AbortController |
| `frontend/src/pages/Friends.jsx` | 270-380 | فحص mountedRef في 6 معالِجات إجراءات |
| `frontend/src/pages/Inbox.jsx` | 1, 247-280, 290-325, 540-610 | cancelled + inboxMountedRef + composeMountedRef |

---

## 🧪 خطوات الاختبار اليدوي المُوصى بها

### اختبار #1 — Notifications.jsx
1. افتح `/notifications`.
2. من جهاز آخر (أو أداة dev) أرسل إشعار جديد عبر socket.
3. أثناء وصول الإشعار، انقر فوراً على إشعار آخر لفتح صفحة المحتوى.
4. **النتيجة المتوقعة:** لا تحذيرات `unmounted component` في console.

### اختبار #2 — NotificationList.jsx
1. افتح القائمة الجانبية للإشعارات.
2. تحقّق أن زر فلتر `mentions` يعرض **"إشارات (Mentions)"** وليس "منشورات".
3. تأكد أن إشعار OS لا يظهر إذا التبويب مفتوح وظاهر.

### اختبار #3 — ReportModal.jsx
1. افتح ••• على أي منشور → "إبلاغ".
2. اختر سبباً واضغط "إرسال البلاغ".
3. أثناء التحميل، اضغط "إلغاء" بسرعة.
4. أعد فتح مودال البلاغ على نفس المنشور أو غيره.
5. **النتيجة المتوقعة:** الزر يظهر "إرسال البلاغ" (ليس "جارٍ الإرسال..."). 

### اختبار #4 — Friends.jsx
1. افتح `/friends`، شاهد طلب صداقة في القائمة.
2. اضغط "تأكيد" ثم — قبل اكتمال الـ API — اضغط على صورة الشخص لفتح ملفه.
3. **النتيجة المتوقعة:** لا تحذيرات console + الإجراء يكتمل في الخلفية بنجاح.

### اختبار #5 — Inbox.jsx
1. افتح `/inbox`، شاهد القائمة تحمّل.
2. قبل اكتمال التحميل، اضغط فوراً على أي محادثة.
3. **النتيجة المتوقعة:** لا تحذيرات console + المحادثة تفتح فوراً.
4. افتح مودال إنشاء محادثة جديدة → "مجموعة جديدة" → اكتب اسم → اضغط إنشاء →
   اضغط ESC/خلف قبل اكتمال الطلب.
5. **النتيجة المتوقعة:** لا تحذيرات + المجموعة تُنشأ في الخلفية بنجاح.

---

## 🛠️ معلومات تقنية إضافية

- **النمط المُتَّبع:** `isMountedRef` + فحص بعد كل `await` قبل أي `setState`.
- **الفائدة على الأداء:** خفض كل تحذيرات console مما يبسّط debugging.
- **الفائدة على الذاكرة:** لا تسرّبات `setState` على مكوّنات منزوعة.
- **التوافق الخلفي:** صفر تغييرات في API public للمكوّنات — كل التعديلات داخلية.

---

**رقم الإصدار:** v59.13.9
**التاريخ:** 2026-06-25
**المؤلف:** فحص آلي منهجي + إصلاح
**العلاقة بالإصدارات السابقة:** يبني فوق v59.13.8 بدون تكرار أي إصلاح سابق.
