# 📝 Yamshat Dashboard — v59.13.4 — إصلاح 5 نواقص حرجة (تتمة v59.13.3)

## 🎯 ملخّص الإصدار

بعد فحص منهجي إضافي لأقسام **الشات / المجموعات / الستوري / الريلز / المنشورات**، تم اكتشاف 5 نواقص خفيّة لم تكن مكشوفة سابقًا، وكلها تتسبب في تجارب سيئة أو تسرّب موارد أو سلوك خاطئ عند الاستخدام السريع. تم إصلاحها بالكامل في هذا الإصدار.

---

## ✅ المشكلة 1 — `src/components/chat/VoiceRecorder.jsx`

### الموقعان: `cancelRecording()` + `useEffect` cleanup

**السبب الجذري:**
1. عند ضغط زر **"إلغاء"** أثناء التسجيل، الكود كان يستدعي `mediaRecorderRef.current.stop()` بدون تعطيل الـ event handlers أولاً → بعد ميلي ثوانٍ يُطلق المتصفح `recorder.onstop` تلقائيًا → الذي يقوم ببناء `Blob` من الـ chunks ويعرض **preview للتسجيل الذي اختار المستخدم إلغاءه!**
2. الـ `useEffect` الخاص بـ cleanup كان dependency-array له `[previewUrl]` ويستدعي `URL.revokeObjectURL(previewUrl)`. بسبب closure، استبدال preview بآخر جديد كان يُلغي **الـ URL الجديد فورًا** بدلًا من القديم → الـ `<audio>` يصبح معطّلًا + الـ URL القديم يبقى متسرّبًا في الذاكرة.

**الإصلاح:**
- في `cancelRecording`: تعطيل `recorder.ondataavailable` و `recorder.onstop` **قبل** استدعاء `stop()`، ثم تفريغ `audioChunksRef` وإغلاق MediaStream.
- استبدال `useEffect` المتعلق بـ `previewUrl` بنمط **"capture current value, revoke on next change/unmount"** عبر متغيّر محلي `urlToRevoke` داخل الـ effect.
- إضافة `useEffect` نظيف مع `[]` لإيقاف الموارد عند unmount + تعطيل `onstop` قبل الإيقاف لمنع `setState` على مكوّن مزال.

---

## ✅ المشكلة 2 — `src/components/stories/StoryViewerEnhanced.jsx`

### الموقع: عنصر `<video>` في عارض الستوري

**السبب الجذري:**
- عنصر `<video>` كان بدون `ref`. النتيجة:
  1. عند **long-press** للإيقاف المؤقت، يتوقف فقط مؤقت شريط التقدم — أمّا الفيديو فيستمر بالتشغيل والصوت!
  2. عند الانتقال بين القصص، لا يتم استدعاء `pause()` على الفيديو السابق صراحةً (يعتمد على unmount الذي قد يتأخر مع AnimatePresence).
  3. تبديل الكتم/إلغاء الكتم لا ينعكس فورًا على فيديو يعمل بالفعل (يعتمد على re-render).

**الإصلاح:**
- إضافة `videoElRef = useRef(null)` وربطه بـ `<video ref={videoElRef} ...>`.
- إضافة `useEffect` يستجيب لـ `[paused, muted, current?.id]` ويستدعي فعليًا `v.play()` / `v.pause()` / تحديث `v.muted` على عنصر DOM.
- إضافة cleanup يستدعي `v.pause()` عند تغيّر القصة أو unmount.

---

## ✅ المشكلة 3 — `src/pages/GroupsHome.jsx`

### الموقع: useEffect الخاص بالبحث + `setGroups` المتراكم

**السبب الجذري:**
1. عند مسح حقل البحث (`!searchQuery.trim()`)، الكود كان يعمل `return` فورًا **بدون استعادة القائمة الأصلية** → القائمة تظل مدمجة مع نتائج بحوث سابقة، فيظهر للمستخدم خليط متراكم لا يعكس الفلتر الحالي.
2. لا توجد حماية من **race condition** في `searchGroups`: عند الكتابة السريعة، يمكن أن تصل استجابة بحث قديمة بعد الأحدث فتطغى عليها.
3. `setGroups((prev) => merge)` كان يُدمج النتائج مع الحالة السابقة (التي تحتوي بالفعل على بحوث سابقة) → تراكم لا نهائي للنتائج عبر بحوث متعاقبة.

**الإصلاح:**
- إضافة `baseGroupsRef` يحفظ القائمة الأصلية من `getGroups()` مرة واحدة.
- إضافة `searchSeqRef` كرقم تسلسلي. كل بحث يحجز `mySeq` ويفحصها بعد `await` قبل أن يكتب في state.
- عند مسح البحث: إعادة `setGroups(baseGroupsRef.current)` فورًا.
- دمج نتائج البحث مع **الأصل** لا مع الحالة السابقة → لا تراكم.
- إضافة `cancelled` flag في `fetchGroups` الأولي لتجنب setState بعد unmount.

---

## ✅ المشكلة 4 — `src/components/feed/PostComposer.jsx`

### الموقع: `useEffect` لتنظيف `mediaPreview` ObjectURL

**السبب الجذري:**
```jsx
useEffect(() => () => {
  if (mediaPreview) URL.revokeObjectURL(mediaPreview);
}, [mediaPreview]);
```
هذا نمط خاطئ مشهور:
- عند تغيّر `mediaPreview` من URL قديم A إلى URL جديد B، React يُشغّل cleanup الـ effect القديم — لكن بسبب closure، `mediaPreview` داخل الـ cleanup يشير إلى **القيمة الجديدة B** (لأن الـ closure يلتقط المرجع وقت إنشاء الـ effect الجديد، ولكن السلوك بسبب dependency).
- النتيجة: يتم استدعاء `URL.revokeObjectURL(B)` فورًا بعد إنشائه → الصورة في `<img src={B}>` تصبح ميتة، بينما A يبقى متسرّبًا في الذاكرة بلا تحرير.

**الإصلاح:**
استبدال النمط بـ **capture current → revoke in cleanup**:
```jsx
useEffect(() => {
  const urlToRevoke = mediaPreview;
  return () => {
    if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
  };
}, [mediaPreview]);
```
بهذا الشكل، الـ cleanup يلتقط القيمة وقت الـ effect ويُلغي **الـ URL السابق** عند الاستبدال — وهو السلوك الصحيح.

---

## ✅ المشكلة 5 — `src/pages/Chat.jsx`

### الموقع: `loadMessages` + `getPresence` + `getBlockStatus` عند تبديل المحادثة

**السبب الجذري:**
نفس نمط مشكلة Profile التي عُولجت في v59.13.3، لكن لقسم الشات. عند التنقل بسرعة من محادثة A إلى B:
1. يبدأ تحميل رسائل A.
2. قبل وصول استجابة A، يبدأ تحميل B.
3. تصل B أولًا → state يعكس B بشكل صحيح.
4. تصل A متأخرة → تكتب رسائل A في state، و `getPresence(A)` يكتب presence A في presenceStore لمفتاح A، و `getBlockStatus(A)` يكتب block A → تشوّش بصري بين البيانات الصحيحة لـ B وبيانات شبحية لـ A.

**الإصلاح:**
- إضافة `peerLoadSeqRef = useRef(0)` كعدّاد تسلسلي.
- `loadMessages` أصبحت تأخذ `(forPeer, mySeq)` كباراميترات صريحة، وتفحص `mySeq !== peerLoadSeqRef.current` بعد كل `await` قبل أن تكتب في state.
- `getPresence` و `getBlockStatus` كذلك يتحققان من `mySeq` قبل setState.
- داخل الـ useEffect يتم زيادة `peerLoadSeqRef.current` وحجز `mySeq` والتقاط `localPeer` قبل الإطلاق.

---

## 🧪 التحقق

- جميع الملفات الخمسة تجتاز التحويل عبر `esbuild` بدون أخطاء بناء جملة.
- الإصلاحات لا تكسر أي API عام؛ تواقيع المكوّنات والـ props لم تتغير.
- لا توجد تبعيات جديدة (npm packages).

## 📋 الملفات المعدّلة

```
frontend/src/components/chat/VoiceRecorder.jsx
frontend/src/components/stories/StoryViewerEnhanced.jsx
frontend/src/pages/GroupsHome.jsx
frontend/src/components/feed/PostComposer.jsx
frontend/src/pages/Chat.jsx
```

---

**الإصدار السابق:** v59.13.3 (Five Fixes — Audio / Notifications / Profile / Reels / Wallet)
**الإصدار الحالي:** v59.13.4 (Five Fixes — VoiceRecorder / StoryVideo / GroupsSearch / PostComposerURL / ChatPeerRace)
