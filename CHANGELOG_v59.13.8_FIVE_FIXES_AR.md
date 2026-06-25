# 📝 Yamshat Dashboard — v59.13.8 — إصلاح 5 نواقص جديدة (تتمة v59.13.7)

## 🎯 ملخّص الإصدار

بعد فحص منهجي جديد ومنفصل عن جلسات الفحص السابقة (v59.13.3 → v59.13.7)،
لأقسام: **الشات / المجموعات / الستوري / الريلز / المنشورات**،
تم اكتشاف **5 نواقص جديدة** خفيّة لم تُعالَج من قبل.

النواقص الجديدة المُكتشفة تتعلّق بمحاور غير مغطّاة في v59.13.7:
- **Hook المشترك للـ typing indicator** (يؤثّر على كل محادثة في التطبيق).
- **`PostComposer` (محرّر المنشور الرئيسي)** الذي لم يُغطَّ في الإصلاحات السابقة
  رغم أن `StoryEditor` و `ReelComposer` تمّ إصلاحهما.
- **`Reels.jsx` (الصفحة الرئيسية للريلز)** التي لم تُغطَّ بفحص isMountedRef
  بينما `ReelComposer` فقط تم إصلاحه.
- **`ChatInput.jsx`** على مستوى تبديل المحادثة (peer change) — تسرّب blob URLs مرفقات.
- **`StoryViewerEnhanced.jsx`** على مستوى التفاعلات async (poll vote / react / viewers).

النتائج المتوقّعة بعد الإصلاحات:
- ⌨️ مؤشّر الكتابة (typing indicator) يعمل بشكل صحيح عند تبديل المحادثات
  دون البقاء عالقاً في حالة `isTyping=true`.
- 🔇 اختفاء تحذيرات React: `Can't perform a state update on an unmounted component`
  من رفع المنشورات، تفاعلات الريلز، رفع مرفقات الشات، والتصويت على استطلاع الستوري.
- 🧠 خفض ملحوظ في استهلاك ذاكرة الجوال عند التنقّل بين 5+ محادثات
  مع وجود مرفقات قيد المعاينة (تحرير blob URLs المتراكمة).
- 📝 لا فقدان للـ state عند نشر فيديو كبير (>50MB) في المنشورات إذا أغلق المستخدم المؤلِّف.

---

## ✅ المشكلة 1 — `src/hooks/useTypingIndicator.js`

### الموقع: حالة `isTyping` تبقى عالقة عند تبديل المحادثة + stale closure

**السبب الجذري — الجانب (أ) الحالة العالقة (الأخطر عملياً):**

عند تبديل المحادثة في تطبيق الشات (المستخدم يضغط على محادثة جديدة)،
الـ `receiver` يتغيّر فيُعاد تشغيل الـ effect النهائي (سطر 97–118)، وهذا
يُرسل `is_typing: false` للمحادثة السابقة بشكل صحيح. **لكن:**

1. `currentStateRef.current` لا يُعاد ضبطه إلى `false` ⇒ يبقى `true` من المحادثة السابقة.
2. `setIsTyping(false)` لا يُستدعى ⇒ React state `isTyping` يبقى `true`.
3. `lastEmitRef.current` يحتفظ بـ timestamp قديم ⇒ rate limit لا يصلح للمحادثة الجديدة.

السيناريو المعطِّب — يحصل في كل تبديل محادثة وكاتب نشط:
- المستخدم يكتب في محادثة A → `isTyping=true`.
- يضغط على محادثة B → الـ effect cleanup يُرسل stop لـ A، لكن `isTyping` لا يزال `true`.
- في محادثة B، يبدأ بالكتابة → `handleTypingStart` يفحص `if (isTyping) return;` → **لا يبدأ
  مؤشّر الكتابة في B إطلاقاً**. المستخدم الآخر لا يرى أن المرسل يكتب.

**السبب الجذري — الجانب (ب) Stale closure داخل setTimeout:**

في `handleTypingStart` (سطر 60–72):
```js
debounceTimerRef.current = setTimeout(() => {
  emitTypingState(true);
  stopTimerRef.current = setTimeout(() => {
    handleTypingStop();   // ← مرجع للـ var القديم!
  }, stopTimeoutMs);
}, debounceMs);
```

`handleTypingStart` معرَّفة **قبل** `handleTypingStop` في الـ scope (سطر 49 vs 73)،
لذا في وقت الـ closure، JavaScript تشير إلى `handleTypingStop` بمرجع ثابت
على الإعلان الأول. مع تغيّر `isTyping` و `emitTypingState` في dependencies،
`handleTypingStop` يُعاد إنشاؤها لكن الـ closure داخل setTimeout يحمل النسخة القديمة.

**الإصلاح:**

1. إضافة `isMountedRef = useRef(true)` + cleanup يضبطه على `false`.
2. إضافة `handleTypingStopRef = useRef(null)` + `useEffect` يزامن `handleTypingStopRef.current = handleTypingStop`
   عند كل render → يكسر stale closure.
3. داخل setTimeout: `if (typeof handleTypingStopRef.current === 'function') handleTypingStopRef.current();`
4. **useEffect جديد على [receiver]:** عند تبديل المحادثة:
   - يلغي `debounceTimerRef` و `stopTimerRef` السابقَين.
   - يضبط `currentStateRef.current = false`.
   - يضبط `lastEmitRef.current = 0`.
   - يستدعي `setIsTyping(false)`.
5. الـ useEffect النهائي (unmount) فُصِل عن useEffect [receiver] ودِيب deps فارغة `[]`
   ليعمل مرّة واحدة فقط (cleanup حقيقي).
6. فحص `isMountedRef.current` داخل كل callback من setTimeout.

---

## ✅ المشكلة 2 — `src/components/feed/PostComposer.jsx`

### الموقع: `handleSubmit` async طويلة بدون `isMountedRef`

**السبب الجذري:**

دالة `handleSubmit` (سطر 165–284) async تستدعي:
- `setUploadProgress(percent)` داخل `onProgress` callback لرفع الفيديو (قد يأخذ 30s+).
- `setIsUploading(false)` في `finally`.
- `pushToast(...)` بعد كل عملية (نجاح، فشل، fallback).
- `clearComposer()` الذي يستدعي 10+ من setState.

السيناريو المعطِّب:
1. المستخدم يبدأ رفع فيديو 100MB كمنشور.
2. أثناء الرفع (يستغرق دقيقة)، يضغط على زر "خلف" أو ينتقل لصفحة أخرى.
3. الـ component يُزال، لكن `mediaUploadService.uploadFile` يستمر.
4. `onProgress` يستمر باستدعاء `setUploadProgress` → **تحذير React**.
5. عند انتهاء الرفع نجاحاً → `injectPostIntoFeedCache` (سليم، لا يعتمد على المكون)،
   ثم `pushToast`, `clearComposer`, `setIsUploading(false)` → **تحذيرات متعدّدة**.
6. في الـ `catch` fallback: رفع احتياطي + setState مرة أخرى → **تحذيرات إضافية**.

**هذا الموقف لم يُغطَّ في v59.13.7 رغم أن `StoryEditor` (الستوري) و `ReelComposer` (الريلز)
حصلا على نفس الإصلاح.**

**الإصلاح:**

1. إضافة `isMountedRef = useRef(true)` + `useEffect` cleanup.
2. داخل `onProgress`: `if (!isMountedRef.current) return;` قبل `setUploadProgress`.
3. بعد نجاح إنشاء المنشور: نُحدِّث الـ cache (آمن، عالمي) ثم نفحص `isMountedRef` قبل `pushToast` و `clearComposer`.
4. في مسار الـ fallback (رفع فيديو احتياطي): فحص `isMountedRef` قبل `createPost`، بعد `pushToast`، وعند الـ fallback error.
5. في `catch` العام: فحص قبل `pushToast`.
6. في `finally`: `if (isMountedRef.current) setIsUploading(false);`.

**ميزة الترتيب الجديد:** نُحدِّث الـ queryClient cache **قبل** فحص isMounted،
لأن الـ cache عالمي ولا يعتمد على المكون → المنشور يظهر في الفيد حتى لو غادر المستخدم
الصفحة (تجربة أفضل).

---

## ✅ المشكلة 3 — `src/pages/Reels.jsx`

### الموقع: 4 handlers async (`handleLike`, `handleShare`, `openComments`, `sendComment`) بدون `isMountedRef`

**السبب الجذري:**

صفحة الريلز تستخدم `useCallback` async لكل تفاعل:

1. **`handleLike` (سطر 167–182):**
   - optimistic `setReels` فوراً.
   - `await API.post('/reels/:id/like')`.
   - في الـ `catch`: rollback `setReels` + `pushToast`.

2. **`handleShare` (سطر 184–197):**
   - `await navigator.share(...)` أو `navigator.clipboard.writeText(...)`.
   - `pushToast` + `setReels`.
   - **`navigator.share` على الجوال يفتح sheet نظامي يستغرق وقتاً**.

3. **`openComments` (سطر 199–206):**
   - `setShowComments(true)` فوراً.
   - `await getComments(reel.id)` (قد يأخذ ثوانٍ على شبكة بطيئة).
   - `setActiveComments(...)`.

4. **`sendComment` (سطر 208–226):**
   - `await addComment(...)` ثم `setActiveComments`, `setReels`, `setCommentText`.
   - في الـ `catch`: fallback API call ثم نفس setState.

السيناريو المعطِّب الأكثر شيوعاً على الريلز:
- المستخدم يفتح ريل → يضغط إعجاب → يقلب لريل آخر بسرعة عبر snap scroll.
- خلال 200–500ms قد يكون قد غادر صفحة الريلز كلياً (إلى الفيد أو الشات).
- استجابات الـ API تصل بعد الانتقال → `setReels`, `setActiveComments`, `setCommentText`
  على مكوّن مزال → **تحذيرات متراكمة**.

السيناريو الأخطر:
- المستخدم يكتب تعليقاً طويلاً ويضغط إرسال.
- يقفل الصفحة قبل وصول الرد.
- `addComment` تنجح على السيرفر، لكن `setActiveComments` و `setCommentText('')` يفشلان.
- **النتيجة:** الـ draft يبقى في `commentText` state العالق إذا عاد المستخدم لاحقاً.

**الإصلاح:**

1. إضافة `isMountedRef = useRef(true)` + `useEffect(() => () => { isMountedRef.current = false; }, [])`.
2. في `handleLike`: فحص `isMountedRef` قبل rollback في الـ `catch`.
3. في `handleShare`: فحص قبل `pushToast` بعد `clipboard.writeText`، وقبل `setReels` بعد الـ share sheet.
4. في `openComments`: فحص قبل `setActiveComments` في `try` وفي `catch`.
5. في `sendComment`: فحص في 4 مواضع (نجاح، نجاح fallback، فشل fallback).

---

## ✅ المشكلة 4 — `src/components/chat/ChatInput.jsx`

### الموقع: تسرّب blob URLs عند تبديل peer + `uploadAttachment` async بدون `isMountedRef`

**السبب الجذري — الجانب (أ) تسرّب blob URLs عند تبديل المحادثة:**

في الـ effect سطر 86–92 الحالي:
```js
useEffect(() => {
  if (!peer) {
    setText('');
    return;
  }
  setText(loadChatDraft(currentUser, peer));
}, [currentUser, peer]);
```

عند تبديل المحادثة (تغيّر `peer`)، الـ effect يستعيد فقط draft النصّ.
**لكن `attachments` (مرفقات قيد المعاينة) لا تُمسح ولا تُحرَّر!**

النتائج العملية:
1. المستخدم يفتح محادثة A → يضيف 3 صور كمعاينة → كل صورة تنشئ `URL.createObjectURL` (3 blob URLs).
2. يبدّل لمحادثة B دون إرسال → الـ blob URLs الـ 3 تبقى في `attachments` state.
3. في محادثة B تظهر معاينات الصور من محادثة A! (UX سيئ + خلط بين المحادثات).
4. لو بدّل لـ 5 محادثات بنفس الطريقة → 15 blob URL في الذاكرة، كل واحد يحجز ملف صورة كامل.

**السبب الجذري — الجانب (ب) `uploadAttachment` async بدون mount guard:**

`uploadAttachment` (سطر 213–231) تستدعي `updateAttachment` (الذي يستدعي `setAttachments`):
- داخل `onProgress` callback (يستمر طوال الرفع).
- بعد `await mediaUploadService.uploadFile(...)`.
- في `catch`.

سيناريو الخلل:
- المستخدم يضيف 5 فيديوهات كبيرة → يضغط إرسال → الرفع يبدأ.
- يبدّل المحادثة قبل اكتمال الرفع → الـ component يُعاد render لكنه قد يُمسح من React tree
  إذا تم unmount/remount للـ ChatInput بناءً على peer key (في الترتيبات الشائعة).
- `onProgress` يستمر → `updateAttachment` → `setAttachments` على مكوّن مزال.

**الإصلاح:**

1. إضافة `isMountedRef = useRef(true)` + ضبطه على `false` في الـ unmount cleanup الموجود.
2. **في useEffect على [currentUser, peer]:**
   - عند `!peer`: تحرير `revokeAttachments(attachmentsRef.current)` + `setAttachments([])`.
   - عند تبديل peer: نفس الشيء قبل تحميل draft المحادثة الجديدة.
3. **في `uploadAttachment`:** فحص `isMountedRef.current` قبل كل `updateAttachment` (داخل onProgress، بعد await، في catch).

---

## ✅ المشكلة 5 — `src/components/stories/StoryViewerEnhanced.jsx`

### الموقع: `handleVotePoll`, `handleReact`, `handleShowViewers`, `handleHighlight`, `handleDelete` async بدون فحص `isMountedRef`

**السبب الجذري:**

ملف `StoryViewerEnhanced.jsx` يحتوي على `isMountedRef` (سطر 56) وقد تم استخدامه
في عمليات async داخلية (مثل `showToast`)، **لكن handlers التفاعل مع الـ API لا
تستخدم الـ ref**:

1. **`handleReact` (سطر 189–193):** `await reactToStory(...)` ثم `setShowReactions(false)`.
2. **`handleVotePoll` (سطر 261–282):** optimistic `setPollVotes` + `setPollMyVote`،
   ثم `await voteStoryPoll(...)`، ثم `setPollVotes(res.data.poll_votes)`.
3. **`handleShowViewers` (سطر 240–253):** `await getStoryViewers(...)` ثم `setViewers(...)`.
4. **`handleDelete`, `handleHighlight`:** نفس النمط.

السيناريو المعطِّب الأكثر شيوعاً:
- المستخدم يفتح ستوري بها استطلاع → يصوّت → الـ vote يُرسل إلى السيرفر.
- خلال انتظار الرد (1–2s)، المستخدم يسحب لأسفل لإغلاق العارض (gesture موجود).
- `onClose` يُستدعى → المكوّن يُزال.
- الرد يصل → `setPollVotes(res?.data?.poll_votes || {})` → **setState على مكوّن مزال**.

**الأخطر:** التحديث المتفائل (optimistic) لـ `pollVotes` تم بنجاح **قبل** الـ await،
ثم الـ component يُزال، ثم الرد الحقيقي من السيرفر يصل لكن لا يُحدَّث في الـ UI
لأن المكون مزال — وعند فتح الستوري مرة أخرى، الـ component يُعاد إنشاؤه ويُحمَّل
الـ poll_votes من الـ prop `current.poll_votes` (سطر 102) — لكن قد يكون الـ prop قديماً!

**الإصلاح:**

إضافة فحص `if (!isMountedRef.current) return;` قبل كل `setState` بعد `await`:

- في `handleReact`: قبل `setShowReactions(false)`.
- في `handleSendReply`: لا حاجة (setReplyText قبل الـ await).
- في `handleDelete`: قبل `handleNextStory()` (يستدعي setState) وقبل `showToast` في catch.
- في `handleHighlight`: قبل `showToast` في try وفي catch.
- في `handleShowViewers`: قبل `setViewers(...)` في try وفي catch، و `setLoadingViewers(false)` في finally.
- في `handleVotePoll`: قبل `setPollVotes(res.data.poll_votes)` في try وقبل `showToast` في catch.

---

## 📊 ملخّص الإصلاحات

| # | الملف | القسم | نوع الإصلاح |
|---|------|------|-----------|
| 1 | `hooks/useTypingIndicator.js` | الشات | إعادة ضبط typing state عند تبديل المحادثة + isMountedRef + كسر stale closure |
| 2 | `components/feed/PostComposer.jsx` | المنشورات | isMountedRef على handleSubmit async (رفع فيديو طويل) |
| 3 | `pages/Reels.jsx` | الريلز | isMountedRef على 4 handlers (like/share/openComments/sendComment) |
| 4 | `components/chat/ChatInput.jsx` | الشات | تحرير blob URLs عند تبديل peer + isMountedRef على uploadAttachment |
| 5 | `components/stories/StoryViewerEnhanced.jsx` | الستوري | isMountedRef على 5 handlers تفاعل (vote/react/viewers/highlight/delete) |

---

## 🧪 كيفية الاختبار

### الاختبار 1 — Typing indicator stuck بين المحادثات
1. افتح محادثة A، اكتب نصاً (لا ترسل) → اطلب من صديق التحقق أنه يرى "يكتب...".
2. بدّل لمحادثة B دون إرسال.
3. اكتب نصاً في محادثة B.
4. **متوقّع قبل الإصلاح:** صديقك في محادثة B لا يرى "يكتب..." إطلاقاً.
5. **متوقّع بعد الإصلاح:** يرى "يكتب..." خلال أقل من ثانية.

### الاختبار 2 — رفع منشور كبير ثم مغادرة
1. افتح صفحة الفيد، حدّد فيديو 100MB في PostComposer.
2. اضغط نشر، انتظر حتى يصل التقدم لـ 30%.
3. اضغط زر الرجوع في المتصفح.
4. **متوقّع قبل الإصلاح:** تحذير React في Console + احتمال toast يظهر بعد المغادرة.
5. **متوقّع بعد الإصلاح:** صمت تام في Console + إذا اكتمل الرفع على السيرفر يظهر المنشور في الفيد عند العودة.

### الاختبار 3 — Reels swipe race condition
1. افتح صفحة الريلز على شبكة بطيئة (DevTools → Network → Slow 3G).
2. اضغط إعجاب على ريل، ثم اسحب لأعلى فوراً لتغيير الريل.
3. كرّر 5 مرّات بسرعة.
4. **متوقّع قبل الإصلاح:** عدّة تحذيرات React + احتمال rollback يحدث على ريل مختلف.
5. **متوقّع بعد الإصلاح:** صمت تام.

### الاختبار 4 — مرفقات الشات بين محادثتين
1. افتح محادثة A، أضف 3 صور كمعاينة (لا ترسل).
2. افتح DevTools → Memory → خذ snapshot قبل التبديل.
3. بدّل لمحادثة B.
4. **متوقّع قبل الإصلاح:** الصور الثلاث تظهر في محادثة B + الذاكرة تحتفظ بـ 3 blob URLs.
5. **متوقّع بعد الإصلاح:** محادثة B فارغة من المرفقات + الذاكرة محرّرة (snapshot ثانٍ يُظهر النقص).

### الاختبار 5 — تصويت استطلاع الستوري ثم إغلاق
1. افتح ستوري تحتوي على استطلاع.
2. صوّت على خيار → اسحب لأسفل لإغلاق العارض فوراً (قبل وصول الرد).
3. افتح ستوري آخر، ثم عُد لنفس الستوري.
4. **متوقّع قبل الإصلاح:** تحذير React في Console + التصويت قد يفقد المزامنة.
5. **متوقّع بعد الإصلاح:** صمت تام + التصويت مزامنة صحيحاً عند الفتح مرة أخرى.

---

## 🔢 الإصدار

**v59.13.8** — نواقص جديدة على 5 ملفات تغطّي 4 أقسام (شات / منشورات / ريلز / ستوري).
لم تُلامس أي ملفات تم إصلاحها سابقاً في v59.13.7 → الإصلاحات مستقلّة تماماً.
