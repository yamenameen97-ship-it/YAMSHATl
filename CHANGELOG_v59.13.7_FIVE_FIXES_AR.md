# 📝 Yamshat Dashboard — v59.13.7 — إصلاح 5 نواقص جديدة (تتمة v59.13.6)

## 🎯 ملخّص الإصدار

بعد فحص منهجي جديد ومنفصل عن جلسات الفحص السابقة (v59.13.3 → v59.13.6)،
لأقسام: **الشات / المجموعات / الستوري / الريلز / المنشورات**،
تم اكتشاف **5 نواقص جديدة** خفيّة لم تُعالَج من قبل.

كل النواقص متعلّقة بأحد المحاور التالية:
- `setState` على مكوّن مُزال (unmounted) أثناء عمليات async طويلة (رفع/شبكة).
- تسرّب موارد حقيقية: `blob URL`, `MediaStream` على `<video>` element, `setInterval`,
  `requestAnimationFrame`.
- استدعاء دوال جانبية (مثل `startRecording`) على مكوّن مُزال بعد عدّ تنازلي.

النتائج المتوقّعة بعد الإصلاحات:
- 🔇 اختفاء تحذيرات React: `Can't perform a state update on an unmounted component`
  من الستوري والريلز والـ feed.
- 🧠 خفض ملحوظ في استهلاك ذاكرة الجوال عند رفع 3+ قصص متتالية
  (تحرير حقيقي لـ blob URLs المتراكمة من القصص التفاؤلية).
- 📷 اختفاء ظاهرة "مؤشّر الكاميرا يبقى مضيئاً" على iOS Safari بعد مغادرة شاشة كاميرا الريلز
  (تحرير كل `srcObject` على ١٤ video element لشريط الفلاتر).
- ⏱️ لا يمكن أن يبدأ تسجيل ريل تلقائياً بعد مغادرة الصفحة في منتصف العدّ التنازلي.
- 📐 لا يحدث setState متراكم على Feed عند إعادة تحجيم النافذة بسرعة.

---

## ✅ المشكلة 1 — `src/components/stories/StoryEditor.jsx`

### الموقع: `handleUpload` يستدعي setState بعد unmount

**السبب الجذري:**

دالة `handleUpload` (سطر 100–138) دالة async تستدعي:
- `setProgress(...)` داخل onProgress callback عند رفع الملف.
- `setError(...)` في `catch`.
- `setUploading(false)` في `finally`.

لا يوجد أي حارس `isMountedRef`. السيناريو المعطِّب:
1. المستخدم يبدأ رفع ستوري كبيرة (فيديو 50MB+ مثلاً، يستغرق 10–30 ثانية).
2. يضغط على زر الإغلاق ✕، أو يعود من زر الجوال → المكوّن يُزال.
3. الرفع لا يزال جارياً → onProgress يستمر → `setProgress` على مكوّن مزال → تحذير React.
4. عند انتهاء الرفع (نجاح أو فشل) → `setError` أو `setUploading(false)` → تحذير ثاني.
5. وأسوأ: استدعاء `onSuccess(uploadedStory, ...)` بعد إغلاق المحرر → سلوك متضارب.

**الإصلاح:**

- إضافة `isMountedRef = useRef(true)` مع `useEffect` cleanup يضبطه على `false`.
- داخل onProgress: `if (!isMountedRef.current) return;` قبل setState.
- داخل `try` بعد `await`: `if (isMountedRef.current && typeof onSuccess === 'function')`.
- داخل `catch`: حارس قبل `setError`.
- داخل `finally`: حارس قبل `setUploading(false)`.

---

## ✅ المشكلة 2 — `src/components/stories/StoriesBar.jsx`

### الموقع: تسرّب blob URLs من القصص التفاؤلية + setState بعد unmount في loadGroups

**السبب الجذري — الجانب (أ) blob URL leak (الأخطر):**

دالة `buildOptimisticSelfGroup` (سطر 11) كانت تستدعي `URL.createObjectURL(file)`
داخلياً (سطرين منفصلين 16 و 26) **دون إرجاع عنوان الـ URL إلى المستدعي**.
بمعنى آخر: blob URL يُنشأ → يُسند إلى story.media_url → لا يوجد أي مرجع خارجي له →
**لا يمكن استدعاء `URL.revokeObjectURL` عليه أبداً**.

النتيجة عملياً:
- كل قصة يرفعها المستخدم تنشئ blob URL يبقى في الذاكرة طوال الجلسة.
- على iOS/Android رفع 5 قصص فيديو ≈ احتفاظ بـ 5 ملفات فيديو كاملة في RAM.
- مع التحديث الدوري كل دقيقة (`setInterval` في loadGroups) الـ blob URL يصبح
  غير ضروري (الـ media_url الحقيقي يصل من الباك إند) لكنه لا يُحرَّر.

**السبب الجذري — الجانب (ب) setState بعد unmount:**

`loadGroups` (سطر 93) async تستدعي `setGroups`, `setLoading` بعد `await getStoriesGrouped()`
دون فحص mount. مع `setInterval` يعمل كل 60 ثانية، احتمال unmount أثناء fetch مرتفع.

**الإصلاح:**

1. **تعديل `buildOptimisticSelfGroup`** ليُرجع object بشكل:
   ```js
   { group: {...}, createdLocalUrl: 'blob:...' | '' }
   ```
   بدلاً من الـ group مباشرة.

2. **إضافة `optimisticBlobUrlsRef = useRef(new Set())`** لتتبّع كل blob URL تفاؤلي.

3. **دالة `trackOptimisticBlobUrl(url)`** تضيف الـ URL إلى الـ Set.

4. **دالة `revokeOptimisticBlobUrls()`** تستدعي `URL.revokeObjectURL` على كل واحد ثم تفرغ الـ Set.

5. **في `handleEditorSuccess`:** عند بناء الـ optimistic group، نلتقط `createdLocalUrl`
   ونمرّره إلى `trackOptimisticBlobUrl`.

6. **في `loadGroups` (المسار الناجح):** بعد وصول البيانات الحقيقية من الباك إند،
   نستدعي `revokeOptimisticBlobUrls()` قبل `setGroups(freshGroups)` — لأن الـ media_url
   الحقيقي أصبح متوفّراً ولم نعد بحاجة الـ blob المحلي.

7. **`isMountedRef = useRef(true)`** + فحوصات `isMountedRef.current` قبل كل setState في loadGroups.

8. **في cleanup العام:** `revokeOptimisticBlobUrls()` لضمان تحرير أي URL متبقّ عند unmount.

---

## ✅ المشكلة 3 — `src/pages/ReelComposer.jsx`

### الموقع: عدّاد تنازلي بـ setInterval بلا cleanup يستدعي startRecording بعد unmount

**السبب الجذري:**

دالة `onCenterPress` (سطر 311) تنشئ مؤقّت عدّ تنازلي:
```js
const id = setInterval(() => {
  countdown -= 1;
  if (countdown <= 0) {
    clearInterval(id);
    startRecording();
  }
}, 1000);
```

المشاكل المتعددة:
1. `id` محلي → لا يمكن إلغاؤه من cleanup.
2. لو غادر المستخدم الصفحة بعد ضغط زر التسجيل بعدّاد 3 ثوانٍ → الـ interval يستمر →
   عند `countdown === 0` يستدعي `startRecording()` على مكوّن مُزال.
3. `startRecording` يفتح MediaRecorder ويستدعي setState — كلاهما يفشل صامتاً
   أو يطلق تحذيرات.

**مشاكل إضافية مرتبطة عُولجت في نفس الـ FIX:**

4. `MediaRecorder.onstop` (سطر 290) يستدعي `setRecordedBlob(blob)` بدون فحص mount.
   لو أوقف المستخدم التسجيل ثم غادر فوراً قبل أن يصل event الـ onstop → setState
   على مكوّن مُزال.

5. `onConfirm` async يستدعي عدّة setState بعد رفع طويل دون فحص mount.

**الإصلاح:**

- إضافة `countdownTimerRef = useRef(null)` لتتبّع مؤقّت العدّ التنازلي.
- إضافة `isMountedRef = useRef(true)`.
- إضافة `useEffect` cleanup عام يلغي:
  - `countdownTimerRef.current`
  - `recordTimerRef.current`
  - يعطّل `mediaRecorderRef.current.onstop` و `ondataavailable` (لمنع setState في onstop بعد unmount).
  - يستدعي `mediaRecorderRef.current.stop()` إن كان نشطاً.
- في `onCenterPress`: تخزين الـ interval id في `countdownTimerRef`، إلغاء أي مؤقّت سابق،
  وفحص `isMountedRef` داخل الـ callback.
- في `rec.onstop`: حارس `if (!isMountedRef.current) return;` قبل `setRecordedBlob`.
- في `onConfirm`: حارس `if (!isMountedRef.current)` قبل كل setState (onProgress, pushToast,
  setErrorMessage, setUploading).

---

## ✅ المشكلة 4 — `src/components/reels/CameraFilterCarousel.jsx`

### الموقع: `FilterThumb` لا يفك ارتباط `srcObject` عند unmount → 14 video elements تمسك المرجع

**السبب الجذري:**

شريط الفلاتر في كاميرا الريلز يحتوي على 14 دائرة معاينة (CAMERA_FILTERS.length).
كل `FilterThumb` يحتوي على `<video>` يُسند له `v.srcObject = stream` (سطر 181):
```js
useEffect(() => {
  const v = vidRef.current;
  if (stream) {
    v.srcObject = stream;
    v.play();
  }
  // ... else branches
}, [stream, galleryUrl]);
```

**لا يوجد cleanup function في الـ useEffect!**

النتائج العملية:
1. **iOS Safari:** بعد مغادرة صفحة الريلز، مؤشّر الكاميرا 🟢 في شريط الحالة
   يبقى مضيئاً، لأن 14 `<video>` element لا تزال تحمل مرجع `MediaStream`.
2. **Chrome/Firefox:** تسرّب ذاكرة GPU — كل `<video>` يحتفظ بإطارات.
3. عند التبديل بين stream و galleryUrl بشكل سريع، الـ effect السابق لم يُحرّر
   الـ srcObject القديم بشكل واضح.

**الإصلاح:**

إضافة دالة cleanup داخل الـ useEffect:
```js
return () => {
  try {
    v.pause();
    v.srcObject = null;
    v.removeAttribute('src');
    v.load();
  } catch { /* ignore */ }
};
```

هذا يضمن:
- فك الرابط بين `<video>` و `MediaStream` فوراً عند unmount.
- عند تغيير stream أو galleryUrl، الـ effect القديم يُنظَّف قبل تشغيل الجديد.
- استدعاء `v.load()` على عنصر منفصل (detached) آمن — يلغي أي عمليات بافرة.

---

## ✅ المشكلة 5 — `src/components/feed/VirtualizedInfiniteFeed.jsx`

### الموقع: `requestAnimationFrame` داخل render بلا cancel على unmount

**السبب الجذري:**

داخل دالة AutoSizer's render prop (سطر 75–79):
```js
if (listWidth !== width) {
  window.requestAnimationFrame(() => setListWidth(width));
}
```

ثلاث مشاكل تتراكم:
1. **استدعاء داخل render:** كل re-render أثناء انتظار rAF يطلق rAF آخر → تراكم rAF callbacks.
2. **لا cancel على unmount:** لو unmounted قبل تنفيذ الـ callback → `setListWidth` على مكوّن مُزال.
3. **عند resize سريع (drag الزاوية):** عشرات الـ rAFs متراكمة، آخر واحد فقط يفوز
   لكن الأولى تستدعي setState مرتفع التردد.

السيناريو المعطِّب:
- المستخدم يفتح صفحة الفيد على شاشة منقسمة (split view).
- يسحب الفاصل لتغيير عرض الـ feed.
- خلال 200ms يفتح تبويب آخر (unmount).
- rAFs المتراكمة تنفّذ بعد unmount → تحذيرات React + تأثير على الأداء العام.

**الإصلاح:**

- إضافة `rafIdRef = useRef(null)` لتتبّع آخر rAF id.
- إضافة `isMountedRef = useRef(true)` + cleanup يضبطه على false ويُلغي الـ rAF.
- داخل render: قبل جدولة rAF جديد، إلغاء أي سابق (`cancelAnimationFrame`).
- داخل الـ callback: فحص `isMountedRef.current` قبل `setListWidth`.

النتيجة: rAF واحد فقط نشط في أي لحظة، وبعد unmount لا setState يحدث.

---

## 📊 ملخّص الإصلاحات

| # | الملف | القسم | نوع الإصلاح |
|---|------|------|-----------|
| 1 | `StoryEditor.jsx` | الستوري | حارس isMounted على رفع async |
| 2 | `StoriesBar.jsx` | الستوري | تحرير blob URLs المتراكمة + حارس isMounted |
| 3 | `ReelComposer.jsx` | الريلز | إلغاء countdown setInterval + isMounted + onstop guard |
| 4 | `CameraFilterCarousel.jsx` | الريلز (الكاميرا) | cleanup لـ srcObject على 14 video element |
| 5 | `VirtualizedInfiniteFeed.jsx` | المنشورات | إلغاء rAF على unmount + منع التراكم |

## 🧪 كيفية الاختبار

1. **Stories upload race:** ارفع ستوري فيديو كبيرة (>30MB)، ثم أغلق المحرر فوراً.
   - قبل الإصلاح: تحذير في الكونسول `Can't perform a state update on unmounted...`.
   - بعد الإصلاح: لا تحذيرات.

2. **Stories memory leak:** ارفع 5 قصص فيديو متتالية، افتح DevTools → Memory → Take Heap Snapshot.
   - قبل الإصلاح: عدد كبير من `Blob` objects محتجزة.
   - بعد الإصلاح: تُحرَّر تلقائياً عند وصول البيانات من الباك إند.

3. **Reels countdown race:** افتح ReelComposer، فعّل timer 3 ثوانٍ، اضغط زر التسجيل،
   ثم غادر الصفحة فوراً قبل انتهاء العدّ.
   - قبل الإصلاح: محاولة فتح كاميرا/تسجيل بعد مغادرة الصفحة.
   - بعد الإصلاح: لا شيء يحدث.

4. **Camera indicator stickiness (iOS):** افتح كاميرا الريلز ثم اضغط زر الرجوع.
   - قبل الإصلاح: مؤشّر الكاميرا 🟢 يبقى مضيئاً لعدّة ثوانٍ.
   - بعد الإصلاح: يختفي فوراً.

5. **Feed resize warnings:** افتح الفيد على نافذة قابلة للتحجيم، حرّك الزاوية بسرعة،
   ثم ابتعد عن الصفحة.
   - قبل الإصلاح: عدّة تحذيرات React.
   - بعد الإصلاح: لا تحذيرات.

---

## 📁 الملفات المعدَّلة

```
frontend/src/components/stories/StoryEditor.jsx
frontend/src/components/stories/StoriesBar.jsx
frontend/src/pages/ReelComposer.jsx
frontend/src/components/reels/CameraFilterCarousel.jsx
frontend/src/components/feed/VirtualizedInfiniteFeed.jsx
```

**5 ملفات فقط** — لا تغييرات في الـ backend أو الـ infra.
