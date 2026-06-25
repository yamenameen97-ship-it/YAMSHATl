# 📝 Yamshat Dashboard — v59.13.10 — إصلاح 5 نواقص جديدة (تتمّة v59.13.9)

## 🎯 ملخّص الإصدار

بعد فحص منهجي **جديد ومنفصل تماماً** عن جلسات الفحص السابقة (v59.13.3 → v59.13.9)،
لأقسام: **الشات / المجموعات / الستوري / الريلز / المنشورات / الإشعارات /
طلبات الصداقة / البلاغات**، تم اكتشاف **5 نواقص جديدة** خفيّة لم تُعالَج
من قبل، ثم إصلاحها جميعاً والتوقّف عند الخامسة.

النواقص الجديدة المُكتشفة تتعلّق بمحاور **لم تُغطَّ في v59.13.9**:

1. **`components/notifications/GlobalNotificationListener.jsx`** —
   استدعاء `Notification.permission` بدون فحص `typeof Notification !== 'undefined'`.
2. **`pages/FriendsAll.jsx`** — `handleAction` فيه ثلاثة عيوب: `confirm()` بعد
   `setBusy`، و`mountedRef` غير مفحوص بعد `await`، و`actionError` السابق لا يُمسح.
3. **`components/feed/NestedComments.jsx`** — `FixedSizeList` بحجم ثابت 220px
   يقطع محتوى صنادق الرد/التعديل، إضافةً إلى عرض أزرار تعديل/حذف/تثبيت/إخفاء
   لكل تعليق بدون فحص ملكية أو صلاحية إشراف + حذف بدون تأكيد.
4. **`pages/notifications/NotificationsPage.jsx`** — أربع دوال أسنكرونية
   (`loadNotifications` و `loadPreferences` و `handleSaveSettings` و
   `handleMarkAllRead`) تستدعي `setState` بعد `await` بدون `mountedRef`.
5. **`components/chat/NewChatDialog.jsx`** — `useEffect` بحث المستخدمين يُلغي
   `setTimeout` فقط في cleanup ولا يحمي `setUsers/setLoading` بعد رجوع
   `await getUsers(...)` → سباق طلبات + `setState` بعد غلق المودال.

النتائج المتوقّعة بعد الإصلاحات:

- 📱 **iOS Safari < 16.4 / WebView**: لا انهيار في
  `GlobalNotificationListener` بسبب `Notification` غير المعرّف، وبقيّة
  مستمعي الإشعارات (الجرس، التوست، البيب) تُسجَّل بنجاح.
- 🔘 **زر "إزالة" في صفحة الأصدقاء/الكل**: لا يبقى عالقاً في حالة loading
  دائماً عند الضغط على "إلغاء" في مربّع التأكيد.
- 🔇 **تحذيرات React** `Can't perform a state update on an unmounted
  component` تختفي من: إجراءات الأصدقاء بعد التنقّل، تحميل/حفظ إعدادات
  الإشعارات، بحث المستخدمين في "دردشة جديدة".
- 🛡️ **التعليقات**: زر الحذف لا يحذف فوراً بدون سؤال؛ أزرار التعديل/التثبيت/
  الإخفاء/الإبلاغ تظهر فقط لمن يملك الصلاحية (المالك أو المشرف).
- 📐 **التعليقات**: ارتفاع الصفّ يتمدّد ديناميكياً عند فتح صندوق الرد/التعديل
  أو عند وجود نصّ طويل → لا تداخل ولا قَصّ بصري.
- 🧯 **سباق البحث**: في "دردشة جديدة" آخر طلب بحث ينتهي هو الذي يُعرض،
  وإغلاق المودال يُلغي الطلب الجاري عبر `AbortController`.

---

## ✅ المشكلة 1 — `src/components/notifications/GlobalNotificationListener.jsx`

### الموقع: السطر 104 — تسجيل Web Push عند منح الإذن

**السبب الجذري:**

```js
if (typeof window !== 'undefined' && Notification.permission === 'granted') {
  registerWebPush().catch(() => {});
}
```

شرط الحماية يفحص `window` فقط، لكنه يصل مباشرةً إلى `Notification.permission`.
في iOS Safari قبل 16.4 (مع PWA مثبّت) وفي بعض WebView على Android وفي SSR،
`Notification` غير معرّف كرمز عام → `ReferenceError: Notification is not defined`،
وهو يُلقى أعلى `useEffect` فيوقف بقيّة التسجيلات اللاحقة (مستمع `yamshat:notification`
المحلي) من العمل.

كانت هناك حماية صحيحة في السطر 26 و 53 (`typeof Notification !== 'undefined'`)،
لكن هذا السطر الواحد تُسي.

**الإصلاح:**

```js
if (
  typeof window !== 'undefined' &&
  typeof Notification !== 'undefined' &&
  Notification.permission === 'granted'
) {
  registerWebPush().catch(() => {});
}
```

---

## ✅ المشكلة 2 — `src/pages/FriendsAll.jsx`

### الموقع: `handleAction(type, target)` — معالج الإجراءات (تأكيد/حذف/إضافة/إلغاء/إزالة مقترح/إلغاء صداقة)

**السبب الجذري — ثلاث مشاكل متراكبة:**

#### عيب (1): `confirm()` بعد `setBusy()` يسبّب علقة دائمة

```js
} else if (type === 'decline' || type === 'cancel' || type === 'unfriend') {
  setBusy(`${type}-${target}`);                           // ← busy ضُبط
  if (type === 'unfriend' && !window.confirm('...؟')) return;  // ← خروج بدون تصفير busy
  await removeFriendship(target);
  ...
}
```

عند ضغط زر "إزالة" لصديق:
1. `setBusy('unfriend-123')` يُضبط فوراً → الزر يظهر بحالة loading.
2. متصفح يفتح مربّع تأكيد native.
3. المستخدم يضغط "إلغاء" → الدالة تخرج عبر `return` مبكراً.
4. **لا يصل إلى كتلة `finally` التي تُصفّر busy**.
5. الزر يبقى عالقاً في حالة loading حتى reload الصفحة، ولا يمكن إعادة المحاولة.

#### عيب (2): `mountedRef.current` غير مفحوص بعد `await`

`load()` كان يفحص `mountedRef.current` صحيحاً قبل كل setState (السطور 89–96)،
لكن `handleAction` يُجري 4 طلبات (`acceptFriendRequest`, `removeFriendship`,
`sendFriendRequest`, `dismissSuggestion`) وبعد كل واحد يستدعي `setItems(...)`
دون أي فحص. إذا انتقل المستخدم إلى تبويب آخر أو خرج من الصفحة، setState تُنفَّذ
على مكوّن مُزال.

#### عيب (3): `actionError` السابق لا يُمسح إذا أُلغي confirm() مبكراً

```js
try {
  setActionError('');     // مسح خطأ سابق
  if (type === 'accept') ...
```

لكن مع عيب (1) يخرج المستخدم قبل وصول `setActionError('')`؛ نتيجة: رسالة خطأ
قديمة (مثلاً من محاولة سابقة فشلت في الشبكة) تبقى مرئية، يفترض المستخدم أنها
متعلّقة بإجراءه الجديد.

**الإصلاح:**

1. نقل `window.confirm(...)` إلى **أوّل سطر** قبل أي `setBusy` أو `setActionError`.
2. مسح `actionError` فور المرور من `confirm()` (وبالتالي يُمسح حتى لو لم تكن
   هناك حاجة لـ confirm).
3. إضافة فحص `if (!mountedRef.current) return;` بعد كل `await`، وفحص
   `if (mountedRef.current)` قبل `setActionError`/`setBusy('')` في
   `catch`/`finally`.

```js
const handleAction = async (type, target) => {
  if (type === 'unfriend' && !window.confirm('هل تريد إزالة هذا الصديق؟')) {
    return;
  }
  setActionError('');
  try {
    if (type === 'accept') {
      setBusy(`accept-${target}`);
      await acceptFriendRequest(target);
      if (!mountedRef.current) return;
      setItems((p) => p.filter((u) => u.friendship?.friendship_id !== target));
    }
    // ... باقي الفروع بنفس النمط ...
  } catch (err) {
    if (mountedRef.current) {
      setActionError(err?.response?.data?.detail || 'فشلت العملية.');
    }
  } finally {
    if (mountedRef.current) setBusy('');
  }
};
```

---

## ✅ المشكلة 3 — `src/components/feed/NestedComments.jsx`

### الموقع (أ): قائمة `react-window` ثابتة الارتفاع تقطع المحتوى

**السبب الجذري:**

```js
import { FixedSizeList as List } from 'react-window';
// ...
<List
  height={height}
  width={width}
  itemCount={flatComments.length}
  itemSize={220}            // ← ثابت دائماً
  itemData={listData}
>
  {CommentRow}
</List>
```

كل صفّ تعليق يأخذ 220px بالتمام، لكن:

- عند الضغط على "رد" يظهر `<textarea rows={2}>` + شريط أزرار → الارتفاع
  الفعلي ~310px.
- عند الضغط على "تعديل" يظهر `<textarea rows={3}>` + شريط أزرار → ~330px.
- المحتوى الطويل (>80 حرف) يلتفّ على 3–4 أسطر → ~250–290px.

النتيجة: الجزء المقطوع يختفي خلف الصفّ التالي، أو يتداخل مع الإطار، فيظنّ
المستخدم أن صندوق الرد/التعديل لا يعمل.

**الإصلاح:**

استبدال `FixedSizeList` بـ `VariableSizeList` ودالة `getItemSize` ديناميكية
تأخذ في الحسبان:
- طول النصّ.
- وجود draft رد مفتوح (`replyDrafts[item.id]`).
- وجود draft تعديل مفتوح (`editDrafts[item.id]`).

```js
import { VariableSizeList as List } from 'react-window';
// ...
const getItemSize = (index) => {
  const item = flatComments[index];
  if (!item) return 180;
  let h = 180;
  const textLen = String(item.content || item.text || item.comment || '').length;
  if (textLen > 80) h += Math.min(220, Math.ceil((textLen - 80) / 60) * 18);
  if (typeof replyDrafts[item.id] === 'string') h += 130;
  if (typeof editDrafts[item.id] === 'string') h += 150;
  return h;
};
// ...
<List
  ...
  itemSize={getItemSize}
  estimatedItemSize={200}
>
```

### الموقع (ب): أزرار الإجراءات الإدارية بدون فحص ملكية/صلاحية

**السبب الجذري:**

```jsx
<button onClick={() => onEditStateChange(item.id, item.content || '')}>تعديل</button>
<button onClick={() => onPin?.(item.id, !item.is_pinned)}>تثبيت</button>
<button onClick={() => onHide?.(item.id, !item.is_hidden)}>إخفاء</button>
<button onClick={() => onDelete?.(item.id)}>حذف</button>
```

كل هذه الأزرار تظهر لكل تعليق بصرف النظر عن مالك التعليق أو إن كان
المستخدم الحالي مشرفاً. ينتج:
- ارتباك في تجربة الاستخدام (يضغط "تعديل" فيُحبط لأن السيرفر يرفض).
- في حال وُجد bug في حماية API → خطر فعلي.

**الإصلاح:**

إضافة `currentUserId` و `isModerator` كخصائص للمكوّن، وحساب
`is_owner` و `can_moderate` لكل تعليق داخل `useMemo`، ثم لفّ الأزرار
بشروط:

```jsx
{item.is_owner ? <button ...>تعديل</button> : null}
{item.can_moderate ? <button ...>تثبيت</button> : null}
{item.can_moderate ? <button ...>إخفاء</button> : null}
{!item.is_owner ? <button ...>إبلاغ</button> : null}
{(item.is_owner || item.can_moderate) ? (
  <button onClick={() => {
    if (window.confirm('هل تريد حذف هذا التعليق؟')) onDelete?.(item.id);
  }}>حذف</button>
) : null}
```

### الموقع (ج): حذف بدون تأكيد

`onDelete?.(item.id)` كان يُستدعى مباشرةً عند الضغط. أُضيف
`window.confirm('هل تريد حذف هذا التعليق؟')` كحماية أساسية ضد الحذف العرضي.

---

## ✅ المشكلة 4 — `src/pages/notifications/NotificationsPage.jsx`

### الموقع: أربع دوال أسنكرونية بدون حماية unmount

**السبب الجذري:**

```js
useEffect(() => {
  loadNotifications();
  loadPreferences();
}, []);

const loadPreferences = async () => {
  // ...
  const { data } = await getUserPreferences();
  if (data) setSettings(prev => ({ ... }));   // ← setState بدون فحص mount
};

const handleSaveSettings = async () => {
  // ...
  await updateUserPreferences({ ... });
  setShowSettings(false);                      // ← بعد await
};

const loadNotifications = async () => {
  const { data } = await getNotifications();
  setNotifications(data || []);                // ← بعد await
};

const handleMarkAllRead = async () => {
  // ...
  await markNotificationsRead(unreadIds);
  setNotifications(prev => prev.map(...));     // ← بعد await
};
```

أربعة مسارات تنفّذ setState بعد `await`. إذا غادر المستخدم صفحة الإشعارات
بسرعة (مثل الضغط على إشعار في القائمة لينتقل إلى محتوى) أثناء أي من
الطلبات → تحذير React + احتمال bug صغير في تحديث state معطوب.

**الإصلاح:**

إضافة `isMountedRef = useRef(true)` مع cleanup يضبطه على `false` عند unmount،
وفحصه قبل كل setState. كذلك في `catch` تجاهل أخطاء console بعد unmount
لتقليل ضجيج console.

```js
const isMountedRef = useRef(true);
useEffect(() => () => { isMountedRef.current = false; }, []);

const loadPreferences = async () => {
  try {
    const { data } = await getUserPreferences();
    if (!isMountedRef.current) return;
    if (data) setSettings(prev => ({ ... }));
  } catch (err) {
    if (isMountedRef.current) console.error('Failed to load preferences', err);
  }
};
// ... نفس النمط للدوال الثلاث الأخرى ...
```

---

## ✅ المشكلة 5 — `src/components/chat/NewChatDialog.jsx`

### الموقع: `useEffect` بحث المستخدمين (السطور 53–68)

**السبب الجذري:**

```js
useEffect(() => {
  if (!open) return undefined;
  const handle = setTimeout(async () => {
    setLoading(true);
    try {
      const resp = await getUsers({ q: query.trim(), limit: 20 });
      const list = ...;
      setUsers(Array.isArray(list) ? list : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, 250);
  return () => clearTimeout(handle);          // ← يلغي setTimeout فقط
}, [open, query]);
```

ثلاث مشاكل خفية:

1. **سباق طلبات (race condition)**: إذا كتب المستخدم بسرعة "ah" ثم "ahm" ثم
   "ahmad" خلال 700ms، فإن جميع `setTimeout` تُلغى عبر cleanup ما عدا الأخير.
   لكن لو كتب "ah" → انتظر 300ms (انطلق الطلب الأول) → ثم "ahmad" (يلغي
   `setTimeout` الجديد بعد 250ms ينطلق الطلب الثاني). الآن طلبان في الطيران.
   لو رجع طلب "ahmad" أوّلاً ثم طلب "ah" → نتائج "ah" تُكتب فوق "ahmad"!
2. **setState بعد غلق المودال**: لو ضغط المستخدم على "إغلاق" أثناء الطلب،
   `close()` يضبط `setOpen(false)` → effect cleanup يُلغي `setTimeout`،
   لكن لو الطلب انطلق فعلياً قبل ذلك، `setUsers(...)`/`setLoading(false)`
   يُنفَّذان بعد إغلاق المودال (المكوّن لا يزال مركّباً لكن في حالة `!open`،
   فيُهدر cycle render).
3. **لا `AbortController`**: الطلبات الشبكية القديمة تستمر في الطيران،
   تستهلك bandwidth وتشغل سيرفر.

قارن مع `useEffect` المحادثات السابقة (السطور 35–50) الذي يستخدم
`let cancelled = false` بشكل صحيح. هذا الـ effect نَسِيَه.

**الإصلاح:**

```js
useEffect(() => {
  if (!open) return undefined;
  let cancelled = false;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const handle = setTimeout(async () => {
    if (cancelled) return;
    setLoading(true);
    try {
      const resp = await getUsers({ q: query.trim(), limit: 20, signal: controller?.signal });
      if (cancelled) return;
      const list = Array.isArray(resp?.data) ? resp.data : (resp?.data?.users || []);
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      if (cancelled || err?.name === 'CanceledError' || err?.name === 'AbortError') return;
      setUsers([]);
    } finally {
      if (!cancelled) setLoading(false);
    }
  }, 250);
  return () => {
    cancelled = true;
    clearTimeout(handle);
    try { controller?.abort(); } catch { /* noop */ }
  };
}, [open, query]);
```

---

## 📂 الملفّات المُعدَّلة

| الملف | السطر | نوع التعديل |
|------|------|------------|
| `frontend/src/components/notifications/GlobalNotificationListener.jsx` | 100–113 | حماية `typeof Notification` |
| `frontend/src/pages/FriendsAll.jsx` | 112–155 | إعادة هيكلة `handleAction` |
| `frontend/src/components/feed/NestedComments.jsx` | 3, 84–115, 119–155, 196–230 | `VariableSizeList` + ownership + delete confirm |
| `frontend/src/pages/notifications/NotificationsPage.jsx` | 1, 41–135 | `mountedRef` لأربع دوال أسنكرونية |
| `frontend/src/components/chat/NewChatDialog.jsx` | 53–82 | `cancelled` + `AbortController` |

---

## 🔬 الفحص

تم تشغيل `@babel/parser` على الملفّات الخمسة المُعدَّلة وكلّها تَحلَّلت بنجاح
كـ JSX + ES modules. (`OK` على الخمسة).

---

## 🚀 ما بعد الإصدار

النواقص المُكتشفة في v59.13.3 → v59.13.10 (مجموع 25 + 5 = 30 نقصاناً) تغطّي
الآن النمط الأشيع: **`setState` بعد `await` بدون حماية**. مع ذلك يبقى
استحسان فحص:
- `pages/Reels.jsx` (1067 سطراً) — لم يُفحص في هذه الجلسة.
- `pages/Inbox.jsx` فروع NewChatComposeModal الفرعية.
- `components/feed/PostCard.jsx` و `PostCardAdvanced.jsx`.
- `pages/GroupChat.jsx` (1025 سطراً).
- خدمات الـ Workers الخلفية في `worker/` و `services/notifications-search-service`.

— نهاية v59.13.10 —
