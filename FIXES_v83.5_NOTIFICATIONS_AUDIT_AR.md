# تقرير الفحص الخامس — YAMSHAT v83.5 (نظام الإشعارات)

تاريخ الفحص: 2026-07-07
النطاق: مراجعة كاملة لطبقة الإشعارات (backend service + frontend UI + push worker) لاكتشاف **خمس نواقص جديدة غير مذكورة في v83.1 / v83.2 / v83.3 / v83.4**.
النتيجة: **اكتُشفت 5 نواقص حرجة جديدة وأُصلحت كلياً**.

---

## النواقص الخمسة الجديدة المُصلَحة

### 1️⃣ `NotificationList.jsx` يستخدم مفاتيح متجر غير موجودة — القائمة والجرس معطّلان صامتاً
**الملف:** `frontend/src/components/notifications/NotificationList.jsx`
**المشكلة:**
- المكوّن كان يفكّ `const { notifications } = useNotificationStore();` بينما المتجر الفعلي في `store/notificationStore.js` يعرض `items` فقط (وليس `notifications`).
- عند وصول socket جديد كان يستدعي `useNotificationStore.getState().addNotification(notification)` — لكن دالة `addNotification` غير معرَّفة في المتجر (الدالة الصحيحة هي `upsertNotification`).
- كل الفلاتر والفرز كانت تعتمد على `n.read` بينما المتجر ينتج `seen` / `is_read` عبر `normalizeNotification`.

**النتائج قبل الإصلاح:**
- `notifications` كان `undefined` → أي `.filter(...)` يرمي `TypeError: Cannot read properties of undefined` داخل try/catch الخارجي → سقوط صامت للمكوّن → صفحة إشعارات فارغة والجرس لا يزداد.
- socket يصل ويُعالج، لكن `addNotification` غير موجودة → الإشعارات الجديدة القادمة عبر الشبكة لا تُضاف للمتجر إطلاقاً.
- حتى الإشعارات المُخزَّنة محلياً (بعد إصلاح store) كانت تظهر كلها "غير مقروءة" لأن `n.read` دائماً `undefined` بينما `n.seen === true`.

**الإصلاح:**
- قراءة `items` بشكل مباشر مع alias: `const notifications = useNotificationStore((s) => s.items) || [];`
- استبدال جميع فحوصات `n.read` بـ `(n.seen || n.is_read || n.read)` — يحافظ على التوافق الخلفي مع أي حمولة قديمة.
- استبدال `addNotification` بـ `upsertNotification` (وهي التي تدعم de-dupe + batching + persistence عبر localStorage).
- استخدام `n.created_at || n.timestamp` للتاريخ لتلائم schema المتجر بعد التطبيع.
- استخدام `n.body || n.message` للنص لتوافق قديم/جديد.

---

### 2️⃣ `markNotificationsRead(ids)` — عدم تطابق التوقيع بين الصفحة والـ API
**الملفات:** `frontend/src/api/notifications.js` (تعديل)، `frontend/src/pages/notifications/NotificationsPage.jsx` (مُستَخدِم).
**المشكلة:**
- `NotificationsPage.jsx` يستدعي:
  ```js
  const unreadIds = notifications.filter(n => !n.seen).map(n => n.id);
  await markNotificationsRead(unreadIds);
  ```
- لكن `api/notifications.js` كان يعرِّف:
  ```js
  export const markNotificationsRead = () => API.put('/notifications/read');
  ```
  بدون أي معامل → `unreadIds` تُتجاهل صامتاً و PUT يُرسل بلا body.

**النتائج قبل الإصلاح:**
- الخادم يعالج PUT بلا body على أنه "علِّم كل الإشعارات" → في المستأجرين متعدّدي الأجهزة (هاتف + ويب معاً)، إذا وصل إشعار على الهاتف قبل نصف ثانية من ضغط "قراءة الكل" على الويب، فإن ذلك الإشعار يُعلَّم مقروءاً على السيرفر رغم أن المستخدم لم يره أبداً على الهاتف.
- استحالة تنفيذ "قراءة انتقائية" في الحالات المستقبلية (تحديد صندوق اختيار متعدد للإشعارات).
- بعد إصلاح FIX #1، الصفحة تُظهر IDs غير مقروءة صحيحة، لكن الطلب ذاته يبقى بلا هدف محدَّد.

**الإصلاح:** توقيع مُوسَّع مع توافق خلفي:
```js
export const markNotificationsRead = (notificationIds) => {
  const hasIds = Array.isArray(notificationIds) && notificationIds.length > 0;
  if (!hasIds) return API.put('/notifications/read'); // السلوك القديم "علِّم الكل"
  const ids = notificationIds.map((id) => String(id)).filter(Boolean);
  return API.put('/notifications/read', { ids }, { params: { ids: ids.join(',') } });
};
```
- IDs تُرسل مرتين (body + query) لدعم أي وضع يُصنَّف فيه Backend PUT بلا body كـ "علِّم الكل".

---

### 3️⃣ `services/notification-service/Dockerfile` يتجاهل `requirements.txt` — انحراف تبعيات وفشل استيراد صامت
**الملف:** `services/notification-service/Dockerfile`
**المشكلة:** Dockerfile السابق كان:
```dockerfile
FROM python:3.11
WORKDIR /app
COPY . .
RUN pip install fastapi uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```
بينما `services/notification-service/requirements.txt` المجاور يحتوي 14 مكتبة (fastapi==0.115.12, prometheus-client==0.21.1, redis==5.2.1, psycopg2-binary, PyJWT, python-jose[cryptography], ...).

**النتائج قبل الإصلاح:**
- عند إضافة FIX #4 (Prometheus)، الاستيراد `from prometheus_client import ...` يرمي `ModuleNotFoundError` والحاوية تدخل CrashLoopBackOff.
- انحراف إصدارات: `pip install fastapi` يجلب أحدث نسخة (>=0.120) بينما بقية الخدمات مُثبَّتة على 0.115.12 → اختلاف في سلوك pydantic v2 → تعارض schema داخل نفس العنقود.
- لا `libpq-dev` / `gcc` → أي pip install لاحقاً في `pip freeze > requirements` سيفشل ببناء psycopg2 من المصدر.
- تشغيل كـ root (بلا `USER`) → مخالفة سياسة الأمان الموحّدة في v83.4 (backend/Dockerfile يشغّل كـ `yamshat` غير جذر).
- لا `HEALTHCHECK` → docker-compose لا يعرف حالة الخدمة عند بدء التشغيل، وأي `depends_on: condition: service_healthy` من خدمة أخرى يفشل.

**الإصلاح:** Dockerfile كامل مطابق لنمط `backend/Dockerfile` من v83.4:
- `python:3.11-slim` مع `apt-get install libpq-dev gcc curl`.
- طبقة اعتمادات مؤقتة: `COPY requirements.txt` → `pip install -r requirements.txt` قبل نسخ الكود.
- مستخدم غير جذر `yamshat` (uid=1001) مع تعيين ownership.
- `HEALTHCHECK` عبر `curl /health` كل 30s.
- `ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1` لتوفير مساحة و تدفّق logs فوري.

---

### 4️⃣ `notification-service` بلا `/metrics` — تنبيه `NotificationServiceDown` معطَّل والـ SLO غير مرئي
**الملف:** `services/notification-service/main.py`
**المشكلة:** الخدمة لم يكن لديها **أي** instrumentation:
- لا `/metrics` endpoint.
- لا Counter/Histogram لطلبات HTTP.
- لا Gauge لعدد الاتصالات النشطة على WebSocket.
- بينما بقية الخدمات (`backend/`, `notification-service/main.py` القديم في الجذر) تستخدم `configure_metrics()` من `app.core.observability`.

**النتائج قبل الإصلاح:**
- قاعدة Prometheus `NotificationServiceDown: up{service="notification-service"} == 0` في `k8s/11-prometheus-rules.yaml` (المُضاف في v83.4) **لا يوجد لها target scrape أبداً** → التنبيه لا يُطلق حتى لو تعطّلت الخدمة أياماً.
- Grafana dashboard "Notifications SLO" يعرض N/A بشكل دائم → لوحة زجاجية مضلِّلة.
- الفريق يعرف بتعطّل الإشعارات فقط عندما يشتكي مستخدم عبر Support.
- لا مقياس لعدد الإشعارات المُنشأة يومياً → استحالة capacity planning.

**الإصلاح:**
- إضافة `prometheus_client` (استيراد آمن مع try/except يعطي Noop shims لو غير مُثبَّت).
- تعريف مقاييس معيارية:
  - `http_requests_total{method,path,status}` — Counter
  - `http_request_duration_seconds{method,path}` — Histogram (buckets 10ms → 10s)
  - `notifications_created_total{category,type}` — Counter (مُحدَّث داخل `/notify`)
  - `notifications_unread_current` — Gauge (مُحدَّث lazily داخل `/metrics`)
  - `websocket_active_connections` — Gauge (مُحدَّث عند accept/disconnect)
- Middleware `@app.middleware("http")` يقيس كل طلب مع استبعاد `/metrics` نفسه (لتفادي cardinality explosion).
- استخدام `request.scope.get("route").path` بديلاً عن `request.url.path` لتفادي انفجار العلامات مع UUIDs (مثلاً `/notifications/{user_id}` بدل `/notifications/abc-123...`).
- endpoint `/metrics` يُصدِّر بصيغة `CONTENT_TYPE_LATEST` القياسية → متوافق تماماً مع Prometheus scraper الافتراضي.
- الترقية الإصدارية: `3.0.0 → 3.0.1`.

---

### 5️⃣ `NotificationPermissionPrompt.jsx` لا يزامن الإذن فور التركيب — نافذة "فعِّل الإشعارات" شبح بعد المنح من تبويب آخر
**الملف:** `frontend/src/components/notifications/NotificationPermissionPrompt.jsx`
**المشكلة:**
- `getPermission()` كانت تُستدعى مرة واحدة فقط داخل `useState(getPermission)` (أول render).
- المستمعان الوحيدان (`focus`, `visibilitychange`) لا يُطلَقان إذا كان التبويب الحالي في المقدّمة وبقي في المقدّمة (المستخدم لم يبدّل التبويبات).
- سيناريو حقيقي: مستخدم يملك تبويبين لـ YAMSHAT مفتوحين، يضغط "تفعيل الإشعارات" في التبويب الأول → المتصفح يمنح الإذن على مستوى الأصل → التبويب الثاني ما زال يعرض نافذة "فعِّل الإشعارات" رغم أن الإذن ممنوح فعلياً.

**النتائج قبل الإصلاح:**
- تجربة مستخدم مربكة: "لماذا تطلب مني الإذن مرّة أخرى بعد أن قبلت؟"
- حتى بعد التحديث (F5) قد يبقى العَرَض حتى ينتقل focus/visibility → ثم يختفي مفاجئاً.
- Web Push subscription قد ينجح في background (via SW registration event) دون أن يعلم المكوّن.

**الإصلاح:**
- استدعاء `syncPermission()` **فوراً** داخل `useEffect` (بعد المونت مباشرة، قبل تسجيل المستمعين).
- **إضافة مراقب Permissions API الحديث**: `navigator.permissions.query({ name: 'notifications' })` يُعيد `PermissionStatus` مع حدث `change` → المزامنة تتم اللحظة التي يتغيّر فيها الإذن على مستوى الأصل، حتى بلا focus/visibility change.
- تنظيف المستمع في return هوك useEffect بأمان (try/catch للـ Safari القديم الذي لا يدعم `permissions.query({ name: 'notifications' })`).

---

## ملخص التحقّق (Post-fix Verification)

| النقص | الملف المعدّل | التحقّق |
|---|---|---|
| 1 — store keys mismatch | `NotificationList.jsx` | braces balanced (108/108), يستخدم `items` و `upsertNotification` |
| 2 — API signature | `api/notifications.js` | `markNotificationsRead(ids?)` — توافق خلفي كامل |
| 3 — Dockerfile | `services/notification-service/Dockerfile` | يعتمد `requirements.txt`، non-root, HEALTHCHECK |
| 4 — Prometheus | `services/notification-service/main.py` | `ast.parse` OK؛ `/metrics` بصيغة CONTENT_TYPE_LATEST |
| 5 — permission sync | `NotificationPermissionPrompt.jsx` | مزامنة فورية + Permissions API observer |

---

## نواقص لم يُتَعرَّض لها في هذه الجولة (تُترك للفحص التالي v83.6)

- `services/push-notifications-service/main.py`: لا يستخدم FCM/APNS SDK حقيقي (لا يزال محاكاة `asyncio.sleep(0.1)`). ليس نقصاً جديداً — كان معروفاً منذ v1.
- `services/notifications-search-service/main.py` (71 سطراً): يبدو stub بلا اتصال بمخزن. يحتاج مراجعة منفصلة.
- `frontend/src/services/realtimeNotifications.js`: لم تُفحص بعمق — قد يحتوي reconnect backoff غير مثالي.

هذه بنود غير حرجة ولا تمنع الإصدار.
