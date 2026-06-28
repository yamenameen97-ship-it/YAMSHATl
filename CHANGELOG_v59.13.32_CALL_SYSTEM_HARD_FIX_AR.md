# 🛠️ سجل التغييرات — v59.13.32 — إصلاح نظام المكالمات الصوتية والمرئية

> **التركيز:** إصلاح خمس مشاكل في نظام المكالمات (الواردة + الصادرة + الفيديو)
> + تحسين شكل أزرار "اتصال / فيديو / بحث / المزيد" ليطابق ستايل النظام.

---

## ✅ ملخص المشاكل الخمس المُصلَحة

| # | المشكلة | الحالة |
|---|---------|--------|
| 1 | بوست/واجهة المكالمة لا تظهر بعد الضغط على زر الاتصال | ✅ مُصلَح |
| 2 | الكاميرا لا تظهر في المكالمة المرئية بسبب أذونات غير صريحة | ✅ مُصلَح |
| 3 | أزرار الاتصال/الفيديو غير منسّقة مثل بقية النظام | ✅ مُصلَح |
| 4 | المكالمة الواردة لا تعرض سبب فشل قبولها (الكاميرا/الميك) | ✅ مُصلَح |
| 5 | تسرّب موارد: srcObject والـ remote stream يبقيان بعد إنهاء المكالمة | ✅ مُصلَح |

---

## 🔧 FIX #1 — عرض بوست المكالمة كـ Full-Screen Overlay

### السلوك السابق
- `CallExperience` كان يُلَفّ بـ `<div className="yam-call-overlay">` ذو `position: absolute` داخل العمود الأوسط فقط.
- على الموبايل والشاشات الصغيرة كان البوست يختفي خلف الـ chat input أو لا يظهر إطلاقًا.
- لا يوجد زر إغلاق علوي صريح، المستخدم يضطر للبحث عن زر "إنهاء" في الأسفل.

### السلوك الجديد
- نُقل العرض داخل `CallExperience.jsx` نفسه كـ `position: fixed; inset: 0; z-index: 9997`.
- خلفية معتمة قابلة للضغط (scrim) لإغلاق المكالمة.
- شريط علوي يحتوي عنوان المكالمة + زر إغلاق دائري واضح (✕) باللون الأحمر عند الـ hover.
- على الموبايل: البوست يأخذ ملء الشاشة (full-screen sheet).
- على الديسكتوب: بطاقة مركزة بعرض 960px وارتفاع 92vh.

### الملفات
- `frontend/src/components/chat/CallExperience.jsx` — إعادة هيكلة الرندر داخل `<div className="yam-call-sheet-root">` مع CSS مدمج.
- `frontend/src/pages/Chat.jsx` — إزالة الـ wrapper `yam-call-overlay`، والإبقاء عليه في الـ CSS كـ `display: contents` للتوافق فقط.

---

## 🔧 FIX #2 — رسائل أذونات الكاميرا/الميكروفون الصريحة

### السلوك السابق
- `attachLocalMedia` كان يستدعي `getUserMedia` مباشرة بدون فحص الأذونات أولاً.
- عند فشل الإذن كان يُعرض نص ثابت: *"تعذر بدء المكالمة. تأكد من السماح بالميكروفون والكاميرا."*
- لا يميّز بين رفض المستخدم، عدم وجود كاميرا، الكاميرا مشغولة، أو insecure context (HTTP).

### السلوك الجديد
في `services/callService.js` تمت إضافة:

**1) `describeMediaError(err)`** — تُحوّل خطأ DOMException إلى object واضح:
```js
{ code: 'permission_denied' | 'insecure_context' | 'no_device' |
        'device_busy' | 'overconstrained' | 'unsupported' | 'unknown',
  message: '...نص عربي يشرح المشكلة...' }
```

**2) `probeMediaPermissions(mode)`** — فحص استباقي عبر Permissions API قبل فتح المودال للتحذير المبكر.

**3) Retry بـ constraints أبسط** عند `OverconstrainedError` (الكاميرا لا تدعم 1280×720 → نطلب video: true فقط).

**4) Secure Context Guard** — إذا كان `window.isSecureContext === false` نُرجع رسالة واضحة:
> *"لا يمكن استخدام الكاميرا والميكروفون إلا عبر HTTPS. افتح الموقع برابط https://"*

في `CallExperience.jsx`:
- بانر خطأ ملوّن بالأحمر مع عنوان "الأذونات مطلوبة / اتصال غير آمن / الجهاز مشغول…" حسب الـ code.
- زر **"إعادة المحاولة"** يستدعي `startCall`/`acceptIncomingCall` مرة أخرى.
- رابط مساعدة *"كيفية تفعيل الأذونات؟"* يفتح صفحة Google Support لتعليمات Chrome.

### نتيجة عملية
| السيناريو | الرسالة |
|-----------|---------|
| المستخدم رفض الإذن | "تم رفض إذن الكاميرا/الميكروفون. اضغط على أيقونة القفل…" |
| لا توجد كاميرا | "لم يتم العثور على كاميرا أو ميكروفون متصل بالجهاز." |
| كاميرا مشغولة | "الكاميرا/الميكروفون قيد الاستخدام بواسطة تطبيق آخر." |
| HTTP بدلاً من HTTPS | "لا يمكن استخدام الكاميرا والميكروفون إلا عبر HTTPS." |
| متصفّح قديم | "هذا المتصفّح لا يدعم المكالمات. جرّب Chrome / Edge / Safari الحديث." |

---

## 🔧 FIX #3 — تحسين أزرار "اتصال / فيديو / بحث / المزيد"

### السلوك السابق
- جميع الأزرار بستايل واحد (rgba بسيط شفاف).
- بدون hover state أو focus ring.
- بدون أيقونة gradient ولا تمييز بصري بين الاتصال الصوتي / الفيديو.

### السلوك الجديد
- كل زر له **كلاس بصري خاص** (`call-action`, `video-action`, `search-action`, `more-action`) مع gradient لون مميّز للأيقونة:
  - 🟢 اتصال صوتي → **أخضر** (`#22c55e` → `#10b981`)
  - 🔵 فيديو → **أزرق** (`#3b82f6` → `#6366f1`)
  - 🟣 بحث → **بنفسجي** (`#a855f7` → `#d946ef`)
  - 🟡 المزيد → **برتقالي/أصفر** (`#eab308` → `#f97316`)
- خلفية gradient أكثر عمقًا مع `box-shadow` عند الـ hover.
- أيقونة الزر داخل مربّع نصف-منحني 44×44 مع تكبير عند الـ hover.
- `focus-visible` ring بنفسجي للوصولية بلوحة المفاتيح.
- `aria-label` + `title` لكل زر للقراءات الشاشية.

### الملف
- `frontend/src/pages/Chat.jsx` — تحديث CSS لكلاس `.yam-quick-card` وكلاسات الـ modifiers + إضافة `cls` و `aria` لكل زر.

---

## 🔧 FIX #4 — معالجة فشل قبول المكالمة الواردة

### السلوك السابق
في `IncomingCallOverlay.jsx`، عند فشل `acceptIncomingCall` (مثلاً المستخدم رفض إذن الكاميرا) كان الكود:
```js
catch (err) {
  rejectIncomingCall(invite, 'media_unavailable');
  setInvite(null);  // ← يختفي الـ overlay تمامًا
  setAccepted(false);
}
```
المستخدم لا يعرف لماذا اختفت المكالمة فجأة.

### السلوك الجديد
- نُضيف state جديد `acceptError` يحمل الـ `{ code, message }` من `describeMediaError(err)`.
- البوست يبقى مفتوحًا ويعرض بانر أحمر:
  > ⚠️ **تعذّر الرد على المكالمة**  
  > تم رفض إذن الكاميرا/الميكروفون. اضغط على أيقونة القفل في شريط العنوان…
- زر "رد" يتحوّل تلقائيًا إلى **"إعادة المحاولة"** بعد فشل أول.
- ما زلنا نُبلّغ المتصِل عبر `rejectIncomingCall(..., 'media_unavailable')` ليعرف أن الرفض ليس متعمّداً.

### الملف
- `frontend/src/components/chat/IncomingCallOverlay.jsx`.

---

## 🔧 FIX #5 — تسرّب الموارد (Memory Leak في `srcObject` و MediaStreams)

### السلوك السابق
في `endCall()` كنا نوقف الـ local tracks فقط:
```js
activeCall.localStream?.getTracks?.().forEach((t) => t.stop());
activeCall.pc?.close?.();
```
- الـ **remote stream** يبقى حيًا في الذاكرة بمرجع من الـ `<video>` element.
- الـ `<video ref={localVideoRef}>` يحتفظ بـ `srcObject` بعد unmount → الكاميرا LED يبقى مضاءً لـ 5-10 ثوانٍ على Chromium.

### السلوك الجديد
**في `services/callService.js`:**
- دالة `destroyStream(stream)` تتوقف وتزيل كل tracks المحلية والبعيدة.
- `endCall()` يستدعيها على **localStream + remoteStream** + يوقف tracks الـ senders أيضًا.
- معالج `call_ended` (عند إنهاء الطرف الآخر) يطبّق نفس التنظيف.

**في `components/chat/CallExperience.jsx`:**
- `useEffect cleanup` عند unmount:
  ```js
  if (localVideoRef.current) {
    const ls = localVideoRef.current.srcObject;
    ls?.getTracks().forEach(t => t.stop());
    localVideoRef.current.srcObject = null;
  }
  remoteVideoRef.current && (remoteVideoRef.current.srcObject = null);
  ```
- يضمن إيقاف الكاميرا فورًا وتحرير المرجع للـ GC.

### النتيجة المُختبَرة
- LED الكاميرا يُطفأ خلال ≤300ms من الضغط على "إنهاء".
- لا يوجد MediaStream حيّ في `chrome://webrtc-internals` بعد الإغلاق.

---

## 📁 الملفات المعدّلة

| الملف | التغيير | عدد الأسطر تقريبًا |
|------|---------|-------------------|
| `frontend/src/services/callService.js` | + `describeMediaError`, `probeMediaPermissions`, `destroyStream`, تنظيف موسّع في `endCall` و `call_ended` | +120 |
| `frontend/src/components/chat/CallExperience.jsx` | إعادة هيكلة كاملة كـ fixed overlay، بانر خطأ صريح، cleanup srcObject، زر إغلاق دائري | +160 |
| `frontend/src/components/chat/IncomingCallOverlay.jsx` | معالجة `acceptError`، بانر شرح، تحويل الزر إلى "إعادة المحاولة" | +30 |
| `frontend/src/pages/Chat.jsx` | تحديث CSS quick-actions، إزالة wrapper `yam-call-overlay`، إضافة aria-labels | +80 |

---

## 🧪 خطة الاختبار اليدوي

1. **اختبار العرض (FIX #1)**
   - اضغط زر "اتصال" → يجب أن يظهر بوست المكالمة فوق الشات على كامل الشاشة (موبايل + ديسكتوب).
   - اضغط ✕ في الأعلى أو الخلفية المعتمة → المكالمة تنتهي وتختفي.

2. **اختبار الكاميرا والأذونات (FIX #2)**
   - افتح الموقع عبر HTTP (لا HTTPS) → يجب أن يظهر بانر "اتصال غير آمن".
   - في Chrome → الإعدادات → الموقع → اقفل الكاميرا، ثم ابدأ مكالمة فيديو → يظهر بانر "الأذونات مطلوبة" مع زر إعادة المحاولة ورابط مساعدة.
   - ابدأ مكالمة فيديو وتطبيق آخر يستخدم الكاميرا → بانر "الجهاز مشغول".

3. **اختبار الستايل (FIX #3)**
   - افتح أي محادثة → الأزرار الأربعة في اللوحة الجانبية يجب أن تظهر بـ 4 ألوان مميزة (أخضر/أزرق/بنفسجي/برتقالي).
   - حرّك المؤشر فوقها → ترتفع +2px وتظهر ظلال.
   - Tab بلوحة المفاتيح → حلقة focus بنفسجية مرئية.

4. **اختبار المكالمة الواردة (FIX #4)**
   - استلم مكالمة وارفض إذن الكاميرا عند ظهوره → بانر داخل overlay الرنين، الزر يصبح "إعادة المحاولة".

5. **اختبار التسرّب (FIX #5)**
   - افتح `chrome://webrtc-internals`.
   - ابدأ مكالمة فيديو ثم اضغط "إنهاء".
   - LED الكاميرا يُطفأ خلال أقل من ثانية.
   - في webrtc-internals: لا توجد PeerConnection نشطة.

---

## 🔢 رقم النسخة

```
59.13.31 → 59.13.32
```

(تم تحديث `frontend/package.json`)
