# إصلاحات أخطاء الكونسول — v47.11

## الأخطاء التي تم إصلاحها

### 1) WebSocket Connection Failed على origin خاطئ
**الخطأ:**
```
WebSocket connection to 'wss://yamshat8.onrender.com/ws/notifications?token=...' failed
[realtime] WS endpoint unavailable after 3 attempts — disabled for this session
```

**السبب:**
دالة `buildWsUrl` في `src/services/realtimeNotifications.js` كانت تستخدم `window.location.host`
وهو host الفرونت إند (`yamshat8.onrender.com`)، بينما WebSocket مستضاف على الباك إند
(`yamshat-1ya4.onrender.com`).

**الإصلاح:**
- الاعتماد على `SOCKET_URL`/`BACKEND_ORIGIN` من `src/api/config.js` بدل `window.location.host`.
- تحويل http(s) إلى ws(s) تلقائياً.
- دعم `VITE_WS_HOST` كـ override.

**الملف:** `src/services/realtimeNotifications.js`

---

### 2) Web Push Registration Failed — InvalidAccessError
**الخطأ:**
```
web push registration failed InvalidAccessError: Failed to execute 'subscribe' on
'PushManager': The provided applicationServerKey is not valid.
```

**السبب:**
المفتاح في `.env`:
```
VITE_VAPID_PUBLIC_KEY=m0z2g5XsMfU7d6O5bHNSA4LZX8sSmshWj6MDtZZ7Mqo
```
هذا المفتاح **42 حرف فقط**، بينما مفتاح VAPID صالح (P-256 uncompressed، 65 بايت)
يجب أن يكون **~87 حرف Base64URL** ويبدأ البايت الأول بـ `0x04`.

**الإصلاح:**
- تم تعزيز دالة `urlBase64ToUint8Array` للتحقق من:
  - الطول المتوقع (≥80 حرف Base64URL).
  - أن البايتات الناتجة 65 بايت بالضبط.
  - أن أول بايت = `0x04` (نقطة P-256 uncompressed).
- إذا فشل التحقق، يُرجع `null` بدل رمي استثناء.
- استدعاء `pushManager.subscribe` يتم داخل `try/catch` إضافي.
- نُسجّل إشعاراً ودياً بدل `console.warn` صاخب.

**الملفات:**
- `src/services/realtimeNotifications.js`
- `src/services/notificationService.js`

**⚠️ ملاحظة للنشر:**
لتفعيل Web Push بشكل حقيقي، ولّد مفتاحاً صالحاً مثل:
```bash
npx web-push generate-vapid-keys
```
ثم استبدل قيمة `VITE_VAPID_PUBLIC_KEY` في كل من `.env` و `.env.production`.

---

### 3) Device Registration — relative path يذهب للفرونت إند
**السبب:**
كنا نستدعي `fetch('/api/devices/register', ...)` بمسار نسبي،
مما يجعله يذهب إلى `yamshat8.onrender.com/api/devices/register` (الفرونت)
بدلاً من الباك إند.

**الإصلاح:**
استخدام `API` axios client الذي يعرف `BACKEND_ORIGIN` ويتعامل مع CSRF/Auth تلقائياً.

**الملف:** `src/services/realtimeNotifications.js`

---

### 4) إغراق الكونسول بأخطاء 500 المتكررة
**الخطأ المتكرر:**
```
GET https://yamshat-1ya4.onrender.com/api/reels?... 500 (Internal Server Error)
GET https://yamshat-1ya4.onrender.com/api/posts/?... 500 (Internal Server Error)
GET https://yamshat-1ya4.onrender.com/api/chat_threads 500 (...)
... عشرات المرات
```

**السبب:**
الباك إند على Render في حالة cold-start أو يعاني من مشكلة. كل طلب 500 يُسجَّل في الكونسول،
مما يخلق ضجيج بصرياً ضخماً.

**الإصلاح في `src/api/axios.js`:**
- إضافة عداد `serverErrorCounters` لكل (method:endpoint).
- بعد **محاولتين فاشلتين** من نفس endpoint بحالة 5xx، نضع `error.isSilent = true`.
- منطق retry مع exponential backoff موجود مسبقاً ويعمل بشكل صحيح.

**الإصلاح في `src/pages/Profile.jsx`:**
- معالجة `error.isSilent` و `error.silent` لعدم استدعاء `console.error`.
- استخدام النسخة المحلية من الصور كـ fallback كما هو.

**ملاحظة:** هذا الإصلاح **يُسكِت ضوضاء الكونسول فقط**، لا يحل مشكلة الباك إند نفسها.
الـ 500 errors تحتاج إصلاحاً في `yamshat-1ya4.onrender.com` (logs/DB/cold-start).

---

### 5) Banner not shown (تحذير غير مؤذٍ — لا يحتاج إصلاحاً)
```
Banner not shown: beforeinstallpromptevent.preventDefault() called.
The page must call beforeinstallpromptevent.prompt() to show the banner.
```
هذا تحذير معلوماتي طبيعي من المتصفح عند استخدام PWA Install Prompt مع تأخير العرض —
السلوك المقصود في كل تطبيقات PWA المهنية.

---

## ملخص التغييرات

| الملف | التغيير |
|---|---|
| `src/services/realtimeNotifications.js` | إعادة كتابة كاملة v47.11 — WS URL من backend origin + VAPID validation + API client للتسجيل |
| `src/services/notificationService.js` | تحقق VAPID + try/catch حول subscribe |
| `src/api/axios.js` | عداد أخطاء 5xx + إسكات المتكرر منها |
| `src/pages/Profile.jsx` | احترام `error.isSilent` عند فشل تحميل الملف الشخصي |

## ما تبقى من مشاكل (خارج الفرونت إند)

🔴 **أخطاء 500 من الباك إند** تحتاج إصلاحاً على `https://yamshat-1ya4.onrender.com`:
- `/api/reels`, `/api/reels/feed`
- `/api/posts/`
- `/api/users/profile/{username}`
- `/api/chat_threads`

🟡 **VAPID Public Key** يحتاج توليد مفتاح صالح ووضعه في متغيرات البيئة.
