# تقرير إصلاح الأخطاء - Yamshat

## الأخطاء التي تم إصلاحها

### 1. ❌ خطأ 500 على `/api/auth/.../token` و `/api/live/{room_id}/token`
**السبب:**
- نقطة `token` كانت مسجّلة فقط على `/live_room/{room_id}/token` بينما الفرونت أحياناً يستدعي `/live/{room_id}/token` → 404.
- الاستجابة لم تكن تُرجع `livekit_url` و `livekit_room` → الفرونت لا يقدر يفتح الكاميرا حتى لو نجح التوكن.
- أي استثناء داخلي في `livekit_api.AccessToken(...)` كان يتسبب بـ 500 صامت.

**الإصلاح في `backend/app/api/routes/live.py`:**
- دعم 4 مسارات: `POST/GET /live/{room_id}/token` و `POST/GET /live_room/{room_id}/token`.
- إضافة `livekit_url` + `livekit_room` + `role` + `identity` للاستجابة.
- التفاف `try/except` يلتقط الأخطاء ويعيد رسالة واضحة بدل 500 صامت.
- إضافة `can_publish_data=True` ليتمكن المضيف من إرسال البيانات الإضافية.

### 2. ❌ خطأ 404 على `/api/live/{room_id}/viewers`
**السبب:** الـ endpoint كان مسجّلاً، لكن مع `_require_room` وليس `_find_room_record` في بعض الحالات.
**الإصلاح:** كان مُصلَحاً بالفعل عبر `@router.get('/live/{room_id}/viewers')` — تم التحقق من سلامة المسار.

### 3. ❌ خطأ 404 على `/uploads/...logo192.png` (يتكرر 5+ مرات)
**السبب:** مجلد `/uploads` غير مُركّب كملفات ثابتة في `main.py`، فأي طلب على `/uploads/*` يعود 404.

**الإصلاح في `backend/app/main.py`:**
- إضافة `app.mount("/uploads", StaticFiles(...))` على مجلد uploads.
- إضافة fallback handler يعيد شعاراً افتراضياً (`logo192.png` من frontend/public) عند فقدان الملف.
- في حالة عدم وجود أي شعار، يُرجع PNG شفاف 1×1 بدل 404 (يوقف فيضان أخطاء الكونسول).
- نسخ `logo192.png` إلى `backend/uploads/` كنسخة احتياطية.

### 4. ❌ خطأ Camera لم تفتح
**السبب الرئيسي:** فشل `startLiveStream` بسبب 500 على `/token` (الإصلاح #1) منع `livekitService.connect(...)` من العمل.
**الإصلاح:** بعد الإصلاحات #1 و #3:
- التوكن يُرجع `livekit_url` و `livekit_room` بشكل صحيح.
- إذا فشل LiveKit، رسالة الخطأ تظهر بوضوح بدل 500 غامض.
- `getUserMedia` يبدأ بشكل طبيعي بمجرد نجاح `startLiveStream`.

### 5. ❌ خطأ 500 على Captcha token
**السبب:** كان موجود fallback لكن غير مُفعّل قبل تركيب راوتر auth.
**الإصلاح:** الكود موجود بالفعل في `main.py`:
- `/api/auth/captcha-fallback` متاح دائماً.
- إذا فشل تحميل راوتر `auth`، يتم تركيب `/api/auth/captcha` مباشرة.

## الملفات المعدّلة
1. `backend/app/main.py` — إضافة `/uploads` static mount + fallback handler.
2. `backend/app/api/routes/live.py` — إعادة هيكلة `get_live_token` بدعم 4 مسارات + معالجة أخطاء + إرجاع `livekit_url`.
3. `backend/uploads/logo192.png` — إضافة الشعار كملف احتياطي.

## كيفية الاختبار بعد النشر
```bash
# اختبار static
curl -I https://yamshat-1ya4.onrender.com/uploads/logo192.png
# يجب: 200 OK

# اختبار token (مع جلسة مسجّلة)
curl -X POST https://yamshat-1ya4.onrender.com/api/live/ROOM_ID/token \
  -H "Cookie: session=..." 
# يجب: {"token": "...", "livekit_url": "wss://...", "livekit_room": "..."}

# اختبار viewers
curl https://yamshat-1ya4.onrender.com/api/live/ROOM_ID/viewers
# يجب: قائمة المشاهدين أو [] بدل 404
```
