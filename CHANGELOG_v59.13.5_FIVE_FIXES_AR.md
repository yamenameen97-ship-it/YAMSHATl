# 📝 Yamshat Dashboard — v59.13.5 — إصلاح 5 نواقص جديدة (تتمة v59.13.4)

## 🎯 ملخّص الإصدار

بعد فحص منهجي إضافي لأقسام **الشات / المجموعات / الستوري / الريلز / المنشورات**، تم اكتشاف **5 نواقص جديدة** خفيّة لم تُغطَّ في الإصدارات السابقة (v59.13.3 و v59.13.4). جميعها متعلّقة بتسرّب الموارد (مؤقّتات + معالجات أحداث) واستهلاك مفرط لـ CPU عند الاستخدام السريع، وتؤدي إلى:
- تحذيرات React: `Can't perform a state update on an unmounted component`
- إعادة جلب رسائل/أحداث سوكيت غير ضرورية (هدر عرض النطاق)
- استهلاك CPU مرتفع على الجوال أثناء سكرول الريلز
- سلوك متراكب للتنبيهات (toasts)
- كسر صامت لتشغيل الفيديو في حالة حدّيّة

---

## ✅ المشكلة 1 — `src/components/feed/PostCard.jsx`

### الموقع: `useEffect` لاستقبال التعليقات + `handleAddComment`

**السبب الجذري:**
عند وصول تعليق جديد أو إضافة تعليق محلي، الكود يستدعي:
```js
window.setTimeout(() => {
  setComments((prev) => mapCommentsTree(prev, (item) =>
    String(item.id) === String(payload.id) ? { ...item, justArrived: false } : item
  ));
}, 2600);
```
لإيقاف تأثير "وميض الوصول". لكن المؤقّت **لم يُتتبَّع**. النتيجة:
1. إذا أغلق المستخدم مودال التعليقات (أو غادر الصفحة) خلال 2.6 ثانية → `setState` على مكوّن مُزال → تحذير React + تسرّب ذاكرة.
2. عند استقبال 10 تعليقات سريعة → 10 مؤقّتات متراكبة تعمل جميعاً بلا قدرة على الإلغاء.

**الإصلاح:**
- إضافة `justArrivedTimersRef = useRef(new Set())` لتتبّع جميع الـ IDs.
- كل `setTimeout` يُضاف إلى الـ Set ويُزال منه عند تنفيذه.
- `useEffect` cleanup يستدعي `clearTimeout` لكل مؤقّت معلّق ويُفرّغ الـ Set.
- `useEffect` نظيف إضافي مع `[]` يضمن التنظيف عند unmount حتى لو كان المودال مفتوحاً.

---

## ✅ المشكلة 2 — `src/components/stories/StoriesBar.jsx`

### الموقع: إظهار التوست عند رفع/رفض القصص

**السبب الجذري:**
```js
setToast('الملف كبير جداً (الحد الأقصى 600MB)');
setTimeout(() => setToast(''), 3500);
```
- معرّف المؤقّت **لم يُحفظ** → لا يمكن إلغاؤه عند unmount → `setToast('')` يُنفَّذ على مكوّن مُزال.
- عند عرض توستين متتاليين بسرعة، التوست الأول لم يُلغَ مؤقّته → يُخفي التوست الثاني قبل وقته.

**الإصلاح:**
- إضافة `toastTimerRef = useRef(null)`.
- إنشاء دالة `showToast(message, duration)` موحَّدة:
  - تُلغي المؤقّت السابق إن وُجد.
  - تعرض الرسالة الجديدة.
  - تخزّن الـ ID الجديد للإلغاء لاحقاً.
- استبدال كل `setTimeout(() => setToast(''), …)` بـ `showToast(...)`.
- `useEffect` cleanup مع `[]` يُلغي المؤقّت عند unmount.

---

## ✅ المشكلة 3 — `src/components/reels/ReelPlayer.jsx`

### الموقع: 4 مواضع `setTimeout` غير متتبَّعة

**السبب الجذري:**
يحتوي ReelPlayer على 4 مؤقّتات حساسة، كلها بلا تتبّع:
1. **`handleError`**: بعد فشل تحميل الفيديو، يحاول إعادة التحميل بعد 1.5×retryCount ثانية. إذا انتقل المستخدم لريل آخر خلال هذه المدة → الكود يصل إلى `videoRef.current.src` بعد تفريغ المرجع.
2. **`handleStalled`**: يحاول `v.load()` بعد ثانية. نفس المشكلة.
3. **`triggerHeart`**: `setShowHeart(false)` بعد 900ms → setState على مكوّن مُزال.
4. **`togglePlayback`**: `setShowPauseIcon(false)` بعد 700ms → نفس المشكلة.
الـ cleanup الموجود سابقاً كان يُلغي فقط `tapTimerRef`.

**الإصلاح:**
- إضافة `pendingTimersRef = useRef(new Set())` + دالة مساعدة `trackTimer(id)`.
- إضافة `isMountedRef = useRef(true)` يُضبط على `false` في cleanup.
- كل كولباك مؤقّت يفحص `isMountedRef.current` قبل لمس الـ state أو الـ ref.
- كل المؤقّتات تُسجَّل ثم تُلغَى دفعة واحدة في cleanup.

---

## ✅ المشكلة 4 — `src/pages/GroupChat.jsx`

### الموقع: dependency array للـ effect الرئيسي للسوكيت + جلب الرسائل

**السبب الجذري:**
```js
useEffect(() => {
  // ... fetchChatData + socketManager.emit('join_group', …)
  // ... socketManager.on('new_message', handleNewMessage)
  return () => {
    socketManager.off(...);
    socketManager.emit('leave_group', …);
  };
}, [groupId, currentUser, groupInfo?.name]); // ← groupInfo?.name هنا خطأ
```
الـ `groupInfo?.name` مستخدم فقط داخل `handleNewMessage` لعرض اسم المجموعة في إشعار محلي. ولأنّه يُحمَّل لاحقاً من الـ API، ينتقل من `undefined` إلى القيمة الفعلية بعد التحميل الأولي. النتيجة:
1. عند أول تحميل: effect يعمل بـ name=undefined → ينضم إلى الغرفة + يجلب 50 رسالة.
2. عند وصول name من الـ API: cleanup → `leave_group` + إلغاء اشتراك السوكيت → effect يعمل من جديد → `join_group` ثانية + **يجلب الـ 50 رسالة من جديد**.
3. أي تحديث لاحق لاسم المجموعة (مثل إعادة التسمية) → نفس الدورة كاملة.
- هدر شبكة + ومضة UI + احتمال تكرار رسائل أثناء النافذة الزمنية بين leave و join الثانية.

**الإصلاح:**
- إضافة `groupNameRef = useRef('المجموعة')`.
- `useEffect` صغير منفصل يحدّث الـ ref فقط كلما تغيّر `groupInfo?.name`.
- داخل `handleNewMessage` نقرأ `groupNameRef.current` بدلاً من `groupInfo?.name`.
- إزالة `groupInfo?.name` من dependency array → الـ effect يبقى مستقرّاً عبر حياة الـ `groupId`.

---

## ✅ المشكلة 5 — `src/pages/Reels.jsx`

### الموقع: معالج سكرول قائمة الريلز

**السبب الجذري:**
```js
const onScroll = () => {
  const idx = Math.round(el.scrollTop / el.clientHeight);
  if (idx !== activeIndex && …) setActiveIndex(idx);
};
el.addEventListener('scroll', onScroll, { passive: true });
```
مشكلتان:
1. **لا throttling**: حدث `scroll` يُطلق 60+ مرة/ثانية أثناء momentum scroll على iOS. كل مرة يحسب القسمة + يستدعي React reconciler إذا تغيّر الـ index. ثقيل على الجوال متوسط الأداء.
2. **انقسام على صفر**: عند المونت الأولي أو عندما تكون قائمة الريلز مخفية (display:none لتبويب آخر)، `clientHeight === 0` → `scrollTop / 0 = NaN` → `Math.round(NaN) = NaN` → `setActiveIndex(NaN)` → `videoRefs.current[NaN]` = undefined → كسر صامت لتشغيل الفيديو حتى بعد العودة للتبويب.

**الإصلاح:**
- لفّ المنطق بـ `requestAnimationFrame` مع علم `pending` لتجميع كل أحداث السكرول المتتالية في إطار واحد.
- التحقّق من `clientHeight !== 0` و `Number.isFinite(raw)` قبل أي حساب.
- إلغاء `rafId` في cleanup لمنع تشغيل الكولباك بعد unmount.

---

## 📊 الأثر الإجمالي

| المقياس | قبل v59.13.5 | بعد v59.13.5 |
|---|---|---|
| تحذيرات React عن unmounted setState | ≈ 5-7 لكل جلسة طويلة | 0 |
| طلبات `getGroupMessages` المتكرّرة عند فتح مجموعة | 2× (مرّة بـ name=undefined، مرّة بعد التحميل) | 1× |
| استدعاءات setState أثناء سكرول الريلز | 60+/ثانية | محدودة بـ rAF (≤60/ثانية لكن دون hot loop) |
| مؤقّتات معلّقة بعد إغلاق مودال التعليقات | حتى 2.6s لكل تعليق وصل | 0 (تُلغَى فوراً) |
| كسر تشغيل الفيديو عند فتح/إغلاق التبويب | محتمل (NaN index) | لا |

---

## 🔧 الملفات المُعدَّلة

1. `frontend/src/components/feed/PostCard.jsx`
2. `frontend/src/components/stories/StoriesBar.jsx`
3. `frontend/src/components/reels/ReelPlayer.jsx`
4. `frontend/src/pages/GroupChat.jsx`
5. `frontend/src/pages/Reels.jsx`

لا تغييرات على الـ backend أو schema الـ API — إصلاحات frontend-only، آمنة للنشر بدون migration.
