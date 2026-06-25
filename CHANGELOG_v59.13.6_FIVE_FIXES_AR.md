# 📝 Yamshat Dashboard — v59.13.6 — إصلاح 5 نواقص جديدة (تتمة v59.13.5)

## 🎯 ملخّص الإصدار

بعد فحص منهجي إضافي وعميق لأقسام **الشات / المجموعات / الستوري / الريلز / المنشورات**،
تم اكتشاف **5 نواقص جديدة** خفيّة لم تُعالَج في الإصدارات السابقة (v59.13.3 / v59.13.4 / v59.13.5).
كل النواقص متعلّقة بـ: تسرّب موارد (مؤقّتات + AudioContext + blob URLs)، race conditions
في طلبات الشبكة، و `setState` على مكوّنات مُزالة.

النتائج المتوقّعة بعد الإصلاحات:
- اختفاء تحذيرات React: `Can't perform a state update on an unmounted component`
- خفض استهلاك ذاكرة الجهاز عند رفع عدّة قصص متتالية (إزالة تسرّب blob URLs)
- إغلاق فوري لإشعارات النظام عند إنهاء الرنين (بدلاً من بقائها معلّقة)
- تحرير عتاد الصوت (AudioContext) بشكل صحيح عند مغادرة شاشة المكالمة
- نتائج بحث المجموعات تتطابق دائماً مع آخر استعلام (لا يوجد flicker لنتائج قديمة)

---

## ✅ المشكلة 1 — `src/components/stories/StoryViewerEnhanced.jsx`

### الموقع: 4 مؤقّتات `setTimeout` غير متتبَّعة للتوست (Toast)

**السبب الجذري:**
يحتوي العارض على 4 مواضع تستدعي:
```js
setToast('...');
setTimeout(() => setToast(''), 2500);
```
في `handleDelete` (سطر 178)، `handleDownload` (سطر 191)، `handleHighlight` (سطر 205)،
و `handleVotePoll` (سطر 250). جميع الـ IDs **غير محفوظة** → لا يمكن إلغاؤها:
1. إذا أغلق المستخدم العارض خلال 2.5 ثانية → `setToast('')` على مكوّن مُزال → تحذير React.
2. إذا عرض المستخدم توستين متتاليين بسرعة (مثل: تنزيل + حذف) → التوست الأول لا يُلغى → يُخفي الثاني قبل وقته.
3. مؤقّت `longPressRef` أيضاً بلا cleanup عند unmount.

**الإصلاح:**
- إضافة `toastTimerRef = useRef(null)` لتتبّع المؤقّت النشط.
- إضافة `isMountedRef = useRef(true)` كحارس لمنع `setState` بعد unmount.
- إنشاء دالة `showToast(message, duration, onAfter)` موحَّدة:
  - تُلغي المؤقّت السابق إن وُجد.
  - تتحقّق من `isMountedRef.current` قبل أيّ `setState`.
  - تستدعي `onAfter` بعد إخفاء التوست (يحلّ مشكلة `handleDownload` الذي كان يدمج `setPaused(false)` مع إخفاء التوست).
- استبدال جميع `setTimeout(() => setToast(''), 2500)` بـ `showToast(...)`.
- `useEffect` cleanup مع `[]` يضبط `isMountedRef=false` ويُلغي مؤقّت التوست + مؤقّت long-press.

---

## ✅ المشكلة 2 — `src/components/chat/MessageBubble.jsx`

### الموقع: `longPressTimerRef` بلا cleanup عند unmount

**السبب الجذري:**
المكوّن يستخدم `longPressTimerRef` لتفعيل القائمة السياقية بعد 500ms من الضغط المطوّل،
لكن **لا يوجد `useEffect` cleanup** يُلغي هذا المؤقّت عند unmount. السيناريو المُعطِب:
1. المستخدم يبدأ الضغط المطوّل على رسالة.
2. يقوم virtualized list (في الشات) بإعادة تدوير العنصر — أو يُغلق المستخدم النافذة — خلال 500ms.
3. الكولباك يُنفَّذ بعد unmount → يستدعي `openContextMenu` → `setContextMenu` → تحذير React.

**الإصلاح:**
- إضافة `isMountedRef = useRef(true)`.
- إضافة `useEffect` بـ `[]` يضبط `isMountedRef.current = false` في cleanup ويُلغي `longPressTimerRef`.
- كولباك `setTimeout` يفحص `isMountedRef.current` قبل استدعاء `openContextMenu`.

---

## ✅ المشكلة 3 — `src/components/chat/IncomingCallOverlay.jsx`

### الموقع: `AudioContext` + إشعار النظام بلا إغلاق

**السبب الجذري:**
1. **AudioContext leak:** `startRingtone()` ينشئ AudioContext ويحفظه في `ringtoneCtxRef`،
   ثم يُعاد استخدامه طوال عمر التطبيق. عند unmount للأوفرلاي (نادر — مرّة عند logout)،
   الـ context **لم يُغلَق أبداً** → يبقى يستهلك عتاد الصوت ويمنع تحرير المورد.
2. **Notification leak:** `new Notification('مكالمة واردة', { requireInteraction: true })`
   ينشئ إشعار نظام دائم. لا يوجد مرجع له ولا `close()` عند انتهاء الرنين →
   الإشعار يظلّ على شاشة المستخدم حتى بعد رفض المكالمة أو قبولها.

**الإصلاح:**
- إضافة `systemNotificationRef = useRef(null)` لحفظ مرجع الإشعار.
- داخل `startRingtone`: حفظ `new Notification(...)` في الـ ref + إغلاق أي إشعار سابق.
- داخل `stopRingtone`: استدعاء `systemNotificationRef.current?.close()`.
- في cleanup الـ `useEffect` الرئيسي: `ringtoneCtxRef.current.close()` إن كان `state !== 'closed'`.

---

## ✅ المشكلة 4 — `src/pages/stories/StoriesPage.jsx`

### الموقع: `URL.createObjectURL` بلا `revokeObjectURL` (تسرّب blob URLs)

**السبب الجذري:**
عند رفع قصة، يُنشَأ كائن قصة تفاؤلي (optimistic) باستخدام:
```js
media_url: ctx.file ? URL.createObjectURL(ctx.file) : ''
```
في موضعين (سطر 77 و 87). البحث في الملف بأكمله يُظهر **0 استدعاءات لـ `URL.revokeObjectURL`**.
كل blob URL يبقى في الذاكرة حتى تُغلَق التبويبة. عند رفع عدّة قصص متتالية (سيناريو شائع):
- بعد 10 قصص: ~10 ملفات (قد تكون فيديوهات بحجم MB) محتجزة في ذاكرة المتصفّح.
- لا تُحرَّر أبداً، حتى بعد أن تستبدلها نتيجة `loadData()` بالـ URL الحقيقي من السيرفر.

**الإصلاح:**
- إضافة `optimisticBlobUrlsRef = useRef(new Set())` لتتبّع جميع الـ URLs المُنشأة.
- دالة مساعدة `makeTrackedBlobUrl(file)` تُسجّل كل URL في الـ Set.
- استبدال كلا الاستدعاءَين المباشرَين بـ `makeTrackedBlobUrl(ctx.file)`.
- `useEffect` cleanup مع `[]` يستدعي `URL.revokeObjectURL` لكل عنصر في الـ Set عند unmount.

---

## ✅ المشكلة 5 — `src/pages/groups/GroupDiscover.jsx`

### الموقع: Race condition في بحث المجموعات + `load()`

**السبب الجذري:**
المكوّن يحتوي على طلبَي شبكة async:
1. `load()` يُنفَّذ عند تغيير `category`.
2. `useEffect` للبحث: يُنفَّذ مع debounce 350ms عند تغيير `query`.
في كليهما، النتائج تُكتب مباشرة عبر `setItems(list)` **بدون فحص**:
- هل المكوّن لا يزال مرتكِبًا؟
- هل هذا الطلب أحدث طلب أُرسل؟

السيناريو المُعطِب:
- المستخدم يكتب "اكاد" بسرعة. تُرسَل 4 طلبات بحث متداخلة.
- يصل ردّ "ا" (الأول) متأخّراً، بعد ردّ "اكاد" (الرابع) → النتيجة المعروضة هي للطلب الأول الخاطئ.
- أو يغادر المستخدم الصفحة قبل وصول الردّ → `setItems` على مكوّن مُزال.

**الإصلاح:**
- إضافة `isMountedRef = useRef(true)` + cleanup `useEffect` لضبطه على `false`.
- إضافة عدّاد تسلسلي لكلّ طلب: `loadSeqRef` و `searchSeqRef`.
- كل دالة async تأخذ نسخة من العدّاد محليّاً، ثم تتحقّق قبل `setItems`:
  ```js
  if (!isMountedRef.current || seq !== loadSeqRef.current) return;
  ```
- نتيجة: فقط أحدث طلب يُحدّث `items`، وأيّ طلب بعد unmount يُتجاهل بصمت.

---

## 📦 الملفات المُعدَّلة (5 ملفات فقط)

| # | الملف | عدد التعديلات |
|---|------|---------------|
| 1 | `frontend/src/components/stories/StoryViewerEnhanced.jsx` | 5 |
| 2 | `frontend/src/components/chat/MessageBubble.jsx` | 2 |
| 3 | `frontend/src/components/chat/IncomingCallOverlay.jsx` | 2 |
| 4 | `frontend/src/pages/stories/StoriesPage.jsx` | 4 |
| 5 | `frontend/src/pages/groups/GroupDiscover.jsx` | 2 |

**الإجمالي:** 15 hunk عبر 5 ملفات. لا تغييرات في الـ backend أو الـ infra.

---

## 🧪 التحقق

تمّ تمرير جميع الملفات الخمسة عبر `@babel/parser` بنجاح (sourceType=module, plugins=jsx):
```
OK: stories/StoryViewerEnhanced.jsx
OK: chat/MessageBubble.jsx
OK: chat/IncomingCallOverlay.jsx
OK: stories/StoriesPage.jsx
OK: groups/GroupDiscover.jsx
```

---

## 🔄 التوافق

- ✅ متوافق رجعياً 100% — لا تغييرات في الـ API ولا في props أيّ مكوّن.
- ✅ لا تغييرات في الـ schema أو الـ alembic migrations.
- ✅ لا حاجة لإعادة تثبيت dependencies.
