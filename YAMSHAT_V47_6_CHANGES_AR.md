# YAMSHAT v47.6 — نظام الإشعارات اللحظي الحقيقي

## 🎯 الهدف
رفع نظام الإشعارات إلى مستوى المنصات العالمية (Instagram / Twitter / WhatsApp):
إشعارات فورية متعددة الأجهزة، تعمل حتى عند إغلاق التبويب.

## 🔍 الثغرات التي تم إصلاحها
1. ❌ → ✅ الإشعارات كانت تُحفظ في DB فقط بدون بث WebSocket
2. ❌ → ✅ لا يوجد جدول لتخزين FCM/APNS/Web Push tokens
3. ❌ → ✅ لا يوجد Redis Pub/Sub للتوسع الأفقي
4. ❌ → ✅ لا يوجد WebSocket endpoint مخصّص للإشعارات
5. ❌ → ✅ لا يوجد Service Worker لاستقبال Web Push
6. ❌ → ✅ لا يوجد heartbeat / reconnect منطق
7. ❌ → ✅ دوال إنشاء الإشعارات صامتة (لا تبث ولا تُرسل Push)

## 📂 الملفات الجديدة
| الملف | الوظيفة |
|---|---|
| `backend/app/models/user_device.py` | نموذج DB لأجهزة المستخدمين |
| `backend/app/schemas/user_device.py` | مخططات Pydantic |
| `backend/app/services/realtime_hub.py` | WebSocket Hub + Redis Pub/Sub |
| `backend/app/services/device_service.py` | إدارة دورة حياة الأجهزة |
| `backend/app/services/notification_dispatcher.py` | الموزّع الموحَّد (DB + WS + Push) |
| `backend/app/api/routes/ws_notifications.py` | WebSocket /ws/notifications |
| `backend/app/api/routes/devices.py` | REST لتسجيل الأجهزة |
| `backend/alembic/versions/20260616_0012_user_devices_realtime.py` | Migration |
| `frontend/public/sw-push.js` | Service Worker للويب |
| `frontend/src/services/realtimeNotifications.js` | عميل WebSocket مخصّص |

## ✏️ الملفات المعدّلة
- `backend/app/services/notification_service_v2.py` — دمج Dispatcher داخل دوال الإنشاء
- `backend/app/main.py` — تسجيل الراوترات + startup/shutdown للـ Hub
- `frontend/src/components/notifications/GlobalNotificationListener.jsx` — تشغيل العميل اللحظي + Web Push

## 📡 قنوات التسليم الخمسة
1. **WebSocket مباشر** — المستخدم نشط في التطبيق
2. **Redis Pub/Sub** — توزيع بين عقد الخادم
3. **FCM** — Android في الخلفية
4. **APNS** — iOS في الخلفية
5. **Web Push (VAPID)** — متصفح ديسكتوب مغلق

## 🔌 نقاط النهاية الجديدة
- `WS  /ws/notifications?token=JWT`
- `POST   /api/devices/register`
- `GET    /api/devices`
- `PUT    /api/devices/{device_id}/preferences`
- `DELETE /api/devices/{device_id}`

## ⚙️ المتغيرات البيئية المضافة
```
REDIS_URL=redis://localhost:6379/0
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VITE_VAPID_PUBLIC_KEY=...
VITE_WS_HOST=api.yamshat.app
```

## 🧪 الاختبار
```bash
alembic upgrade head
uvicorn app.main:app --reload
# سجّل دخول نفس المستخدم في تبويبَين، أرسل إعجاب من حساب آخر،
# الإشعار يصل لحظياً في التبويبَين ثم على نظام التشغيل عند إغلاقهما.
```
