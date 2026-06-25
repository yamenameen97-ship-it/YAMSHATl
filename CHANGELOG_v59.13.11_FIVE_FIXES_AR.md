# 📝 Yamshat Dashboard — v59.13.11 — إصلاح 5 نواقص جديدة (تتمّة v59.13.10)

## 🎯 ملخّص الإصدار

بعد فحص منهجي **جديد ومنفصل تماماً** عن جلسات الفحص السابقة
(v59.13.3 → v59.13.10)، لأقسام: **الشات / المجموعات / الستوري / الريلز /
المنشورات / الإشعارات / طلبات الصداقة / البلاغات**، تم اكتشاف **5 نواقص
جديدة** خفيّة لم تُعالَج من قبل، ثم إصلاحها جميعاً والتوقّف عند الخامسة.

النواقص الجديدة المُكتشفة في هذا الإصدار:

1. **`components/chat/MessageRetry.jsx`** — `setIsRetrying(false)` يُستدعى
   داخل `finally` بعد `await onRetry(message)` بدون أي حماية ضدّ unmount
   → تحذير React عند حذف الرسالة أو التنقّل أثناء إعادة المحاولة.
2. **`components/groups/GroupPinnedBar.jsx`** — `setPinned/setLoading`
   بعد `await listPinnedMessages(...)` بدون فحص mount + زرّ "إلغاء التثبيت"
   ينفّذ مباشرة بدون أي تأكيد.
3. **`components/feed/PostActions.jsx`** — نصوص أزرار التفاعل ثابتة
   بالإنجليزية (`Like / Save / Share / Report`) داخل تطبيق عربي بالكامل،
   لا يوجد `dir="rtl"`، ولا `aria-label` عربي → تجربة سيّئة للمستخدم
   ولقارئ الشاشة.
4. **`components/feed/TrendingTags.jsx`** — وسوم ثابتة بالإنجليزية
   (`#news / #gaming / #music`)، وعنصر `<span>` غير قابل للنقر،
   ولا `dir="rtl"`، ولا تخصيص قابل للتمرير من الخارج.
5. **`components/social/FollowersListModal.jsx`** — **كل** النصوص العربية
   في الملف معطوبة الترميز (mojibake): "ุงู„ู…ุชุงุจุนูˆู†" بدل "المتابِعون"،
   "โœ•" بدل "✕"، "ู„ุง ูŠูˆุฌุฏ" بدل "لا يوجد"... + لا `dir="rtl"` + لا إغلاق
   بـ Escape + لا قفل تمرير للخلفية.

---

## ✅ الإصلاح 1 — `src/components/chat/MessageRetry.jsx`

### السبب الجذري

```js
const handleRetry = useCallback(async () => {
  if (!isFailed || isRetrying || !onRetry) return;
  setIsRetrying(true);
  try {
    await onRetry(message);
  } finally {
    setIsRetrying(false);   // ← يُستدعى دائماً، حتى بعد unmount
  }
}, [isFailed, isRetrying, message, onRetry]);
```

أثناء إعادة المحاولة، قد يُزال المكوّن من الشجرة بسبب:
- حذف الرسالة من قائمة الرسائل (بعد نجاح الإرسال أو تراجع المستخدم).
- التنقّل لمحادثة أخرى أو إغلاق نافذة الشات.
- إعادة بناء الـ virtualized list بعد وصول دفعة جديدة.

عند رجوع `await onRetry(message)`، يصل التنفيذ إلى `finally`
ويستدعي `setIsRetrying(false)` على مكوّن مُزال → تحذير React الكلاسيكي:
*"Can't perform a state update on an unmounted component."*

### الإصلاح

```js
const isMountedRef = useRef(true);
useEffect(() => {
  isMountedRef.current = true;
  return () => { isMountedRef.current = false; };
}, []);

const handleRetry = useCallback(async () => {
  if (!isFailed || isRetrying || !onRetry) return;
  setIsRetrying(true);
  try {
    await onRetry(message);
  } finally {
    if (isMountedRef.current) setIsRetrying(false);   // ← محميّ
  }
}, [isFailed, isRetrying, message, onRetry]);
```

---

## ✅ الإصلاح 2 — `src/components/groups/GroupPinnedBar.jsx`

### السبب الجذري

عيبان منفصلان في الملف نفسه:

**أ) سباق unmount في `fetchPinned`:**

```js
const fetchPinned = useCallback(async () => {
  if (!groupId) return;
  try {
    setLoading(true);
    const res = await listPinnedMessages(groupId);
    setPinned(list);                  // ← بدون أي فحص mount
  } catch {
    setPinned([]);
  } finally {
    setLoading(false);                // ← بدون أي فحص mount
  }
}, [groupId]);
```

عند تغيير `groupId` (التنقّل بين مجموعتين بسرعة) أو إغلاق المجموعة
أثناء استدعاء `listPinnedMessages`، يتم `setPinned/setLoading` على
مكوّن مُزال.

**ب) إلغاء تثبيت بدون تأكيد:**

```js
const handleUnpin = async (msgId, e) => {
  e.stopPropagation();
  try {
    await pinGroupMessage(groupId, msgId, false);   // ← فعل فوري عند أوّل ضغطة
    setPinned((prev) => prev.filter((p) => p.id !== msgId));
  } catch { /* ignore */ }
};
```

ضغطة واحدة خاطئة من المشرف على زرّ "إلغاء التثبيت" تفقده رسالة
مثبّتة كانت موضع تذكير مهم → لا توجد فرصة للتراجع.

### الإصلاح

- `isMountedRef` يحمي `setPinned` و `setLoading` بعد كل `await`.
- `window.confirm('هل أنت متأكد من إلغاء تثبيت هذه الرسالة؟')` قبل تنفيذ
  `pinGroupMessage(..., false)`.
- `dir="rtl"` + `Noto Sans Arabic` على الحاوية الرئيسية والقائمة المنسدلة.
- `aria-label` عربي على زرّ إلغاء التثبيت.

---

## ✅ الإصلاح 3 — `src/components/feed/PostActions.jsx`

### السبب الجذري

```jsx
return (
  <div className="flex gap-3 mt-2">
    <button type="button" onClick={onLike}>{liked ? 'Liked' : 'Like'}</button>
    <button type="button" onClick={onSave}>{saved ? 'Saved' : 'Save'}</button>
    <button type="button" onClick={handleShare}>Share</button>
    <button type="button" onClick={onReport}>Report</button>
  </div>
);
```

مشاكل متراكمة في 4 أسطر:

1. **نصوص إنجليزية حرفية** (`Like / Save / Share / Report`) داخل تطبيق
   عربي بالكامل — تكسر اللغة البصرية للواجهة وتعطي انطباع "غير مكتمل".
2. **لا `dir="rtl"`** — مع نصوص إنجليزية تُعرض بترتيب LTR وسط واجهة RTL
   فتظهر بمحاذاة معاكسة لباقي البطاقة.
3. **لا `aria-label` عربي** — قارئ الشاشة العربي يقرأ "Like, button"
   بدلاً من "إعجاب".
4. **لا `aria-pressed`** — لا توجد إشارة دلالية بأنّ الزر toggle.
5. **حالة `saved` غير منعكسة بصريّاً** — نفس النمط للحالتين.

### الإصلاح

نسخة محسّنة كاملة:

```jsx
<button
  type="button"
  onClick={onLike}
  aria-pressed={liked}
  aria-label={liked ? 'إلغاء الإعجاب' : 'إعجاب'}
  style={{ ...baseBtn, ...activeLike }}
>
  <span aria-hidden="true">{liked ? '❤️' : '🤍'}</span>
  <span>{liked ? 'أُعجبت' : 'إعجاب'}</span>
</button>
```

أربعة أزرار: **إعجاب / حفظ / مشاركة / إبلاغ**، كل واحد بأيقونة + لون
نشط/خامل، `aria-pressed` للحالة، حاوية `dir="rtl"` بخط Noto Sans Arabic.

---

## ✅ الإصلاح 4 — `src/components/feed/TrendingTags.jsx`

### السبب الجذري

```jsx
export default function TrendingTags() {
  const tags = ['#news', '#gaming', '#music'];
  return (
    <div className="flex gap-2 flex-wrap">
      {tags.map(tag => (
        <span key={tag} className="px-3 py-1 border rounded-full">
          {tag}
        </span>
      ))}
    </div>
  );
}
```

- **وسوم ثابتة بالإنجليزية** في تطبيق عربي.
- `<span>` بدلاً من `<button>` → غير قابل للنقر، غير قابل للوصول
  بلوحة المفاتيح، ولا يدعم تتبّع التحليلات للنقرات.
- **لا dependency injection**: المكوّن لا يقبل `tags` ولا `onTagClick`
  من الخارج → عديم الفائدة عمليّاً.
- لا `dir="rtl"`.

### الإصلاح

- وسوم عربية افتراضية: `#أخبار / #رياضة / #تقنية / #موسيقى / #ترفيه`.
- `tags` و `onTagClick` كـ props اختياريّة.
- عند غياب `onTagClick` يُطلق `window` حدث `yamshat:hashtag` عام.
- كل وسم زرّ `<button>` بـ `aria-label` يصف العملية.
- تأثير hover ولون متّسق مع تصميم Yamshat (`#8B5CF6`).

---

## ✅ الإصلاح 5 — `src/components/social/FollowersListModal.jsx`

### السبب الجذري

ملف الـ FollowersListModal بأكمله مُحفوظ بترميز خاطئ
(UTF-8 mojibake — يبدو أنه مرّ بترميز Windows-1252 ثم أُعيد ترميزه
إلى UTF-8). كلّ النصوص العربية في الملف غير قابلة للقراءة:

| السطر | القيمة المخزّنة (mojibake)              | المقصودة         |
|------|------------------------------------------|-------------------|
| 22   | `'ุงู„ู…ุชุงุจุนูˆู†'`                  | `'المتابِعون'`   |
| 23   | `'ุงู„ู…ุชุงุจูŽุนูˆู†'`               | `'المتابَعون'`   |
| 24   | `'ุฃุตุฏู‚ุงุก ู…ุดุชุฑูƒูˆู†'`     | `'أصدقاء مشتركون'`|
| 62   | `aria-label="ุฅุบู„ุงู‚"`             | `aria-label="إغلاق"` |
| 63   | `โœ•`                                    | `✕`              |
| 94   | `'ุฌุงุฑูŠ ุงู„ุชุญู…ูŠู„โ€ฆ'`            | `'جاري التحميل…'` |
| 97   | `'ุชุนุฐุฑ ุงู„ุชุญู…ูŠู„'`              | `'تعذّر التحميل'` |
| 100  | `'ู„ุง ูŠูˆุฌุฏ'`                          | `'لا يوجد'`       |

النتيجة: المستخدم يرى رموزاً عشوائية في تبويبات المودال،
وزرّ الإغلاق، ورسائل الحالة → القائمة عمليّاً غير صالحة للاستخدام
حتى لو كانت بياناتها تصل بنجاح.

بالإضافة إلى:
- **لا `dir="rtl"`** على المودال — تظهر مكوّناته بمحاذاة LTR.
- **لا إغلاق بمفتاح Escape** — معيار UX قياسي للمودالات.
- **لا قفل تمرير للخلفية** — صفحة الملف الشخصي تتمرّر تحت المودال.

### الإصلاح

- إصلاح كامل لترميز النصوص العربية (UTF-8 نظيف).
- `dir="rtl"` و `fontFamily: '"Noto Sans Arabic","Cairo",system-ui'` على
  الـ backdrop والـ content وكل الأزرار.
- `useEffect` يستمع لـ `Escape` ويستدعي `onClose`.
- `useEffect` آخر يحفظ ويستعيد `document.body.style.overflow`.
- `aria-label` و `aria-pressed` على تبويبات الفلترة.
- `aria-modal="true"` على المودال.

---

## 🧪 خطّة الاختبار اليدوي

1. **MessageRetry**: أرسل رسالة تفشل (افصل الشبكة) → اضغط "إعادة محاولة"
   → بينما يدور المؤشّر، احذف المحادثة أو انتقل لأخرى → لا تحذير في
   الـ console.
2. **GroupPinnedBar**: افتح مجموعة بها رسائل مثبّتة → اضغط "إلغاء التثبيت"
   → يظهر مربع تأكيد → اضغط "إلغاء" → الرسالة تبقى مثبّتة. ثم بدّل بين
   مجموعتين بسرعة → لا تحذير unmount.
3. **PostActions**: افتح أي بطاقة منشور → الأزرار تعرض "إعجاب / حفظ /
   مشاركة / إبلاغ" بالعربية وبمحاذاة RTL → اضغط "إعجاب" → يتحوّل لـ
   "أُعجبت" بلون أحمر.
4. **TrendingTags**: افتح الشريط الجانبي → تظهر وسوم عربية
   (#أخبار / #رياضة / ...) قابلة للنقر → اضغط أي وسم → يُطلق حدث
   `yamshat:hashtag` يمكن تلقّيه في الـ feed.
5. **FollowersListModal**: افتح ملف مستخدم → اضغط "المتابِعون" →
   كل النصوص عربية مقروءة → اضغط `Esc` → المودال يُغلق. تحقّق أن
   صفحة الخلفية لم تتمرّر أثناء فتح المودال.

---

## 📦 الملفات المعدّلة

| الملف | نوع التعديل |
|------|--------------|
| `frontend/src/components/chat/MessageRetry.jsx` | إضافة `isMountedRef` + حماية `setIsRetrying` في `finally` |
| `frontend/src/components/groups/GroupPinnedBar.jsx` | إعادة كتابة كاملة: حماية mount + تأكيد إلغاء + RTL |
| `frontend/src/components/feed/PostActions.jsx` | إعادة كتابة كاملة: تعريب + RTL + a11y + أيقونات |
| `frontend/src/components/feed/TrendingTags.jsx` | إعادة كتابة كاملة: وسوم عربية + أزرار قابلة للنقر + props |
| `frontend/src/components/social/FollowersListModal.jsx` | إعادة كتابة كاملة: إصلاح ترميز mojibake + RTL + Escape |
| `CHANGELOG_v59.13.11_FIVE_FIXES_AR.md` | ملفّ جديد (هذا الملف) |

---

## ✅ النتيجة

- 🔇 لا تحذيرات `Can't perform a state update on an unmounted component`
  من زرّ إعادة المحاولة في الشات أو من شريط الرسائل المثبّتة بالمجموعات.
- 🛡️ لا فقدان عَرَضي لرسالة مثبّتة في مجموعة بسبب نقرة خطأ.
- 🇸🇦 أزرار التفاعل أسفل المنشورات والوسوم الرائجة بالعربية وبمحاذاة
  صحيحة RTL، مع دعم كامل لقارئ الشاشة.
- 📖 قائمة المتابِعين/المتابَعين/الأصدقاء المشتركين تعرض نصوصاً عربية
  سليمة (انتهى عصر الـ mojibake)، تُغلق بـ Escape، وتقفل تمرير الخلفية.

**التوقّف عند 5/5 ✅** — كما طلب المستخدم.
