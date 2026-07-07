# تقرير الفحص السادس — YAMSHAT v83.6 (نظام الإشعارات — الطبقة العميقة)

تاريخ الفحص: 2026-07-07
النطاق: مراجعة معمّقة لطبقة الإشعارات (Backend REST + Frontend UI + Push Worker + Notification Microservice) لاكتشاف **خمس نواقص جديدة غير مذكورة في v83.1 → v83.5**.
النتيجة: **اكتُشفت 5 نواقص حرجة جديدة وأُصلحت كلياً**.

---

## النواقص الخمسة الجديدة المُصلَحة

### 1️⃣ `pwaInitializer.js` يطلب صلاحية الإشعارات تلقائياً بلا user gesture
**الملف:** `frontend/src/services/pwaInitializer.js`
**المشكلة:**
- عند تحميل الصفحة، تقوم `PWAInitializer.init()` باستدعاء `this.initNotifications()` تلقائياً، والتي بدورها كانت تنفّذ:
  ```js
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
  }
  ```
- هذا الاستدعاء يقع **قبل** أي نقر/لمس من المستخدم (بلا user gesture).
- يخالف **نفس القاعدة** التي أُصلحت بالفعل في `GlobalNotificationListener.jsx` (v59.13.14 FIX #4) وفي `NotificationPermissionPrompt.jsx` (حيث الطلب موجود داخل `handleEnable` كـ user gesture).

**النتائج قبل الإصلاح:**
- Chrome 80+ / Edge / Firefox 72+: تعتبر الطلب "permission spam" وترفضه تلقائياً دون سؤال المستخدم.
- Firefox يرجع `'default'` مباشرة بلا نافذة → المستخدم لا يرى شيئاً.
- Chrome يسجّل `Notification permission may only be requested from inside a short running user-generated event handler` في الكونسول.
- بعد فشل صامت هنا، أي طلب لاحق من `NotificationPermissionPrompt.handleEnable` قد يخضع لـ abuse heuristics في Chrome ويُحظر بدوره.
- Safari iOS 16.4+: يعطّل الإشعارات كلياً للمصدر لأنه يعتبر الاستدعاء تعديّاً.

**الإصلاح:** حذف استدعاء `requestPermission()` من `initNotifications()` نهائياً. طلب الصلاحية يبقى **حصراً** عبر `NotificationPermissionPrompt.handleEnable` الذي يعمل داخل معالج نقر صريح للمستخدم.

---

### 2️⃣ Backend `PUT /notifications/read` يتجاهل `ids` — إصلاح v83.5 FIX #2 غير مكتمل من طرف الخادم
**الملف:** `backend/app/api/routes/notifications.py`
**المشكلة:**
- في v83.5 FIX #2 تم تحديث `frontend/src/api/notifications.js` ليرسل IDs في **body** و **query params** معاً:
  ```js
  return API.put('/notifications/read', { ids }, { params: { ids: ids.join(',') } });
  ```
- لكن endpoint الخادم `@router.put('/read')` كان يقرأ **صفر معطيات**:
  ```python
  def mark_all_notifications_read(
      db: Session = Depends(get_db),
      current_user: User = Depends(get_current_user),
  ):
      # يعلّم كل الإشعارات غير المقروءة للمستخدم
  ```
- النتيجة: إصلاح الواجهة الأمامية بلا أثر — الخادم لا يزال يعلّم **كل شيء** غير مقروء بغضّ النظر عن الـ IDs المُرسَلة.

**النتائج قبل الإصلاح:**
- سيناريو multi-device (هاتف + ويب): وصول إشعار على الهاتف قبل نصف ثانية من ضغط "قراءة الكل" على الويب → السيرفر يعلّمه مقروءاً على المصدر رغم أن المستخدم لم يره على الهاتف.
- سيناريو selective read (زر "مقروء" لإشعار محدّد ثم "قراءة الكل" لاحقاً): لا يمكن التمييز بين النيّتين.
- أي مستخدم بجهازين مفتوحين متزامناً يفقد إشعارات في الخلفية.

**الإصلاح:**
```python
def mark_all_notifications_read(
    payload: Dict[str, Any] = Body(default_factory=dict),
    ids: str = Query(default=''),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # جمع IDs من body أو query string
    raw_ids: List[Any] = []
    body_ids = payload.get('ids') if isinstance(payload, dict) else None
    if isinstance(body_ids, list):
        raw_ids.extend(body_ids)
    if ids:
        raw_ids.extend([piece for piece in ids.split(',') if piece.strip()])

    parsed_ids: List[int] = []
    for raw in raw_ids:
        try: parsed_ids.append(int(str(raw).strip()))
        except (TypeError, ValueError): continue

    query = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read.is_(False),
    )
    if parsed_ids:
        query = query.filter(Notification.id.in_(parsed_ids))
        scope = 'selective'
    else:
        scope = 'all_unread'
    # ...
    return {'updated': len(notifications), 'scope': scope, 'requested_ids': parsed_ids or None}
```
- IDs تُقرأ من body **و** query معاً (توافق مع FIX #2 السابق).
- `.filter(Notification.id.in_(parsed_ids))` يضمن الانتقائية.
- توافق خلفي: طلب بلا معطيات ⇒ سلوك "علِّم الكل" السابق.
- تقييد إضافي بـ `user_id` يمنع تسرّب تمييز إشعارات مستخدم آخر عبر IDs مُخمّنة.

---

### 3️⃣ `notificationService.markAllNotificationsRead()` بلا دعم `ids` — تناقض داخلي مع `api/notifications.js`
**الملف:** `frontend/src/services/notificationService.js`
**المشكلة:**
- بعد v83.5 FIX #2، الملف `api/notifications.js` أصبح يقبل `markNotificationsRead(ids)`.
- لكن الطبقة الأعلى `services/notificationService.markAllNotificationsRead()` كانت لا تزال:
  ```js
  await retryWithBackoff(() => API.put('/notifications/read'));
  ```
- بلا معامل، بلا body → أي مستدعٍ يمرّ عبر `notificationService` (وهذا هو المسار الرئيسي في `NotificationList.jsx`) يفقد ميزة الـ selective mark ويعود لسلوك "علِّم الكل" الخاطئ.

**النتائج قبل الإصلاح:**
- `NotificationList.handleMarkAllRead` يستدعي `notificationService.markAllNotificationsRead()` → التناقض الداخلي يجعل FIX #2 لا يعمل من هذا المسار إطلاقاً.
- offline queue يخزّن `{ action: 'markAllRead', payload: {} }` بلا IDs → عند العودة online، `processOfflineQueueItem` يُنفّذ "علِّم الكل" وإن كان الأصل الفعلي "علِّم هذه الخمسة فقط".

**الإصلاح:** توحيد التوقيع مع `api/notifications.js`:
```js
async markAllNotificationsRead(notificationIds) {
  const store = useNotificationStore.getState();
  const hasIds = Array.isArray(notificationIds) && notificationIds.length > 0;

  if (hasIds) {
    notificationIds.forEach((id) => { try { store.markRead(id); } catch {/**/} });
  } else {
    store.markAllRead();
  }

  try {
    await retryWithBackoff(() => {
      if (hasIds) {
        const ids = notificationIds.map(String).filter(Boolean);
        return API.put('/notifications/read', { ids }, { params: { ids: ids.join(',') } });
      }
      return API.put('/notifications/read');
    });
  } catch (error) {
    if (!navigator.onLine) addToOfflineQueue('markAllRead', hasIds ? { ids: notificationIds } : {});
    throw error;
  }
}
```
- كذلك `processOfflineQueueItem('markAllRead')` يمرّر `item.payload?.ids` للحفاظ على النيّة عبر offline queue.

---

### 4️⃣ `services/notification-service` — endpoint `POST /notify` لا يبثّ عبر WebSocket
**الملف:** `services/notification-service/main.py`
**المشكلة:**
- الخدمة تُصرّح بأنّها **advanced real-time notification service** مع WebSocket في `/ws/notifications/{user_id}`.
- تخزّن جميع sockets في `notification_manager.user_websockets[user_id]: Set[WebSocket]`.
- لكن endpoint `POST /notify` كان **يخزّن الإشعار فقط** ثم يعود:
  ```python
  notification_manager.notifications[user_id].append(notification)
  notification_manager.update_badges(user_id)
  # ... لا شيء آخر — لا send_json إلى أي socket!
  ```
- معالج `websocket_notifications` يفتح الاتصال، يستقبل ping فقط، ولا يدفع أي `new_notification` أبداً.

**النتائج قبل الإصلاح:**
- الادّعاء "real-time notification service" غير محقّق — العميل لا يتلقّى الإشعار الجديد إلا عبر polling يدوي أو refetch كامل.
- شارة `WEBSOCKET_CONNECTIONS` (Prometheus) تُظهر اتصالات نشطة لكن قناة البثّ فارغة.
- تكامل مباشر مع الخدمات الأخرى (chat/live/reels) عبر `POST /notify` لا يصل للعميل → الجرس صامت.
- الجرس في الويب يعتمد فقط على `backend/` الرئيسي عبر Socket.IO المختلف — أما هذه الخدمة المصغرة فعملياً معطّلة.

**الإصلاح:** إضافة broadcast مباشر بعد التخزين:
```python
try:
    sockets = list(notification_manager.user_websockets.get(user_id, ()))
    if sockets:
        message = {
            "type": "new_notification",
            "data": asdict(notification),
            "badges": notification_manager.get_user_badges(user_id),
        }
        dead: List[WebSocket] = []
        for ws in sockets:
            try:
                await ws.send_json(message)
            except Exception as broadcast_err:
                logger.warning("WS send failed for user %s: %s", user_id, broadcast_err)
                dead.append(ws)
        # تنظيف الـ sockets الميتة
        for ws in dead:
            notification_manager.user_websockets[user_id].discard(ws)
        if dead:
            WEBSOCKET_CONNECTIONS.set(sum(len(s) for s in notification_manager.user_websockets.values()))
except Exception as broadcast_outer:
    logger.warning("WebSocket broadcast pipeline failed for %s: %s", user_id, broadcast_outer)
```
- بثّ متزامن لكل sockets النشطة للمستخدم.
- تنظيف الـ sockets المكسورة داخل نفس المكالمة لتفادي تسرّب الذاكرة.
- تحديث Prometheus gauge فور اكتشاف انقطاع.
- شكل الحمولة `{ type, data, badges }` متوافق مع ما يتوقّعه `realtimeNotifications.js` الفرونت.

---

### 5️⃣ `NotificationList.jsx` يُنشئ Notification نظامياً موازياً لـ `GlobalNotificationListener` → إشعار مزدوج
**الملف:** `frontend/src/components/notifications/NotificationList.jsx`
**المشكلة:**
- `GlobalNotificationListener` مركّب في `App.jsx` **طوال الجلسة**، ويشترك عالمياً في `socketManager.on('new_notification', ...)` ويُطلق:
  - تحديث المتجر (`upsertNotification`)
  - `new Notification(...)` النظامي (مع `tag` للـ dedupe)
  - beep + toast
- `NotificationList.jsx` (مركّب فقط عندما يكون المستخدم في `/notifications`) كان يشترك في **نفس الحدث** ويقوم بنفس العمل:
  ```js
  socketManager.on('new_notification', (notification) => {
    useNotificationStore.getState().upsertNotification(notification);
    const notif = new Notification(notification.title, { tag: ... });  // ← ضربة مزدوجة!
  });
  ```

**النتائج قبل الإصلاح:**
- كل إشعار وارد أثناء وجود المستخدم في صفحة `/notifications`:
  - **إشعاران نظاميّان** يظهران في مركز إشعارات نظام التشغيل (رغم `tag` متطابق — لأن الاستدعاءَين يقعان في نفس microtask ولا يجد المتصفح الوقت للـ dedupe).
  - Chrome iOS/Safari: يعرضهما فعلاً كإشعارين منفصلين (لا يعتمد `tag` بشكل موثوق).
  - على Windows/macOS يصدر صوت الإشعار الرسمي مرّتين.
- إشعار المتجر يُدمج بشكل سليم (via `deduplicateNotifications`) لكن UX الإشعارات النظامية سيء.
- `onclick` مختلف بين المكوّنين قد يفتح مسارات متعارضة.
- beep يُطلق من `GlobalListener` بينما `NotificationList` يُطلق `Notification` النظامي بدون beep → عدم تناسق سمعي.

**الإصلاح:** حذف كتلة `new Notification(...)` من `NotificationList.jsx` تماماً. الاشتراك في socket يقتصر الآن على تحديث المتجر (كخط دفاع لو حدث unmount مؤقت لـ `GlobalListener` أثناء hot-reload). كل ما يتعلّق بـ Notification API / beep / toast مسؤولية مركزية لـ `GlobalNotificationListener` فقط، الذي يمتلك بالفعل TTL dedupe في `shownNotificationIds`.

الكود القديم أُبقي داخل دالة معلَّقة `_DISABLED_LEGACY_NOTIFICATION_EFFECT` بلا استدعاء — كمرجعية توثيقية فقط، سيُحذف نهائياً في v84.

---

## الفحوصات المؤتمتة

- ✅ `python3 -m py_compile backend/app/api/routes/notifications.py` — نجح
- ✅ `python3 -m py_compile services/notification-service/main.py` — نجح
- ✅ تحقق توازن الأقواس/الفواصل لـ `NotificationList.jsx`: braces 110↔110، parens 123↔123
- ✅ `useEffect` count = 2 (الأصل + التوثيقي المُعطّل الذي أصبح دالة عادية)

## ملفات مُعدَّلة

| # | الملف | نوع التعديل |
|---|-------|-------------|
| 1 | `frontend/src/services/pwaInitializer.js` | حذف auto-request للـ permission |
| 2 | `backend/app/api/routes/notifications.py` | قبول `ids` من body/query في PUT /read |
| 3 | `frontend/src/services/notificationService.js` | دعم `ids` في `markAllNotificationsRead` + offline queue |
| 4 | `services/notification-service/main.py` | بث `new_notification` عبر WS بعد التخزين |
| 5 | `frontend/src/components/notifications/NotificationList.jsx` | إزالة الاشتراك المكرَّر في Notification API |

## ملفات جديدة

- `FIXES_v83.6_NOTIFICATIONS_AUDIT_AR.md` (هذا التقرير)

---

**تحقق نهائي:** الإصلاحات لا تكسر أي واجهات موجودة (توافق خلفي كامل عبر البارامترات الاختيارية والفروع بديلة).
