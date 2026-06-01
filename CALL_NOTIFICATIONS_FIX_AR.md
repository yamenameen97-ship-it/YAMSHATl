# إصلاح المكالمات (الصوتية والمرئية) والإشعارات

## المشاكل التي تم حلها

### 1) المكالمة الصوتية / المرئية لا تصل للطرف الآخر
**قبل**: الواجهة كانت تفتح `getUserMedia` محلياً فقط بدون إرسال أي إشارة عبر السوكت إلى المستلم. الـ backend لم يكن يحتوي على أي معالج (`call_invite`, `call_signal`...) لذا لم يكن هناك طريقة لإخطار الطرف الآخر بوجود مكالمة.

**بعد**:
- أضفت 5 معالجات Socket.IO جديدة في الـ backend:
  - `call_invite` → يُرسل `incoming_call` للمستلم + إشعار دائم في قاعدة البيانات
  - `call_answer` → يُرسل `call_accepted` للمتصل
  - `call_reject` → يُرسل `call_rejected` للمتصل
  - `call_end` → يُرسل `call_ended` للطرفين
  - `call_signal` → يُمرّر SDP/ICE candidates بين الطرفين
- أنشأت خدمة `callService.js` في الـ frontend تُدير `RTCPeerConnection` كاملة (offer/answer + ICE).
- أعدت كتابة `CallExperience.jsx` لاستخدام `callService` بدلاً من العمل المحلي فقط، وتعرض الآن **الفيديو البعيد** (`remoteStream`) في كروت منفصلة.

### 2) عدم ظهور إشعار للمكالمة الواردة
**قبل**: لا يوجد أي مكوّن يستمع للمكالمات الواردة على مستوى التطبيق.

**بعد**:
- مكوّن جديد `IncomingCallOverlay.jsx` يتم تركيبه في `AppGuards` ويظهر كنافذة منبثقة عند استلام `incoming_call` من أي صفحة.
- يحتوي على زرّي "رد" و"رفض" وموسيقى رنين خفيفة (Web Audio).
- يطلق Browser Notification إذا كانت التبويبة في الخلفية.

### 3) الإشعارات (الجرس + المتصفح) لا تعمل عند الرسائل
**قبل**:
- الـ backend لا يُنشئ سجل `Notification` ولا يُرسل `new_notification` عند الرسائل (فقط عند المتابعة).
- في الـ frontend الـ listener لـ `new_notification` كان داخل صفحة `Notifications` فقط (لا تكون مفتوحة عادةً).

**بعد**:
- أضفت إنشاء سجل `Notification` + بث `new_notification` في:
  - `backend/app/api/routes/chat.py` → `send_message` (HTTP)
  - `backend/app/core/socket_server.py` → `chat_message` event (Socket.IO)
  - `backend/app/core/socket_server.py` → `call_invite` event (للمكالمات أيضاً)
- مكوّن `GlobalNotificationListener.jsx` جديد يُركّب في `AppGuards` ويستمع لـ `new_notification` على كل الصفحات: يُحدّث الجرس + يُظهر toast + يُرسل Browser Notification + بيب صوتي.

## الملفات المُعدّلة

### Backend
- `backend/app/core/socket_server.py` — إضافة 5 معالجات للمكالمات + إشعار للرسائل
- `backend/app/api/routes/chat.py` — إنشاء إشعار + بث عند إرسال رسالة

### Frontend
- `frontend/src/services/callService.js` — **جديد** (إدارة WebRTC + signaling)
- `frontend/src/components/chat/CallExperience.jsx` — إعادة كتابة لاستخدام callService
- `frontend/src/components/chat/IncomingCallOverlay.jsx` — **جديد** (نافذة المكالمة الواردة)
- `frontend/src/components/notifications/GlobalNotificationListener.jsx` — **جديد** (مستمع الإشعارات العالمي)
- `frontend/src/App.jsx` — تركيب المكوّنين الجديدين

## ملاحظات نشر مهمة

1. **TURN server**: للحصول على مكالمات تعمل عبر شبكات NAT صارمة، أضف هذه المتغيرات للبيئة:
   ```
   VITE_TURN_URL=turn:your-turn.example.com:3478
   VITE_TURN_USERNAME=user
   VITE_TURN_CREDENTIAL=pass
   ```
   بدون TURN، تعمل المكالمات على نفس الشبكة فقط أو عبر STUN العام.

2. **HTTPS مطلوب**: WebRTC `getUserMedia` يتطلب HTTPS في الإنتاج. التطبيق على Render/Vercel يحصل عليه تلقائياً.

3. **أذونات المتصفح**: المستخدم سيُطلب منه السماح بالميكروفون (وللفيديو الكاميرا أيضاً) عند أول مكالمة. الإشعارات تطلب الإذن من `GlobalNotificationListener` عند أول تشغيل.

4. **لا حاجة لتحديث Database Schema** — جدول `notifications` موجود بالفعل ويقبل الأنواع `CHAT` و `CALL` بدون تعديل.
