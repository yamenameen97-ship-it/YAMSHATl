# إصلاح مشكلة تسجيل الدخول v59

## المشاكل المُكتشفة من الكونسول

### 1) خطأ 503 — Authentication service is temporarily unavailable
**المصدر**: `backend/app/api/routes/auth.py` سطر 722 (catch-all handler)

**السبب الجذري**: أي استثناء غير متوقع داخل `_login_impl` (خطأ DB / جدول `user_sessions` ناقص / `mark_failed_login` فشل / `store_refresh_token` فشل / `record_audit_log` فشل) كان يُحوَّل إلى 503 ويُخفي السبب الحقيقي ويمنع المستخدم من تسجيل الدخول رغم أن بياناته صحيحة.

### 2) InvalidAccessError — applicationServerKey is not valid
**المصدر**: `frontend/src/services/realtimeNotifications.js` + `notificationService.js`

**السبب**: متغير البيئة `VITE_VAPID_PUBLIC_KEY` فارغ أو غير صالح، والكود كان يحاول استخدامه دون فحص الطول/التنسيق، مما يُسبب `PushManager.subscribe()` يفشل.

## الإصلاحات المُطبَّقة

### Backend

**`backend/app/services/auth_service.py`**
- `prune_expired_sessions`: مُغلَّفة بـ try/except — لا تُفشل تسجيل الدخول إذا فشل التنظيف.
- `store_refresh_token`: مُغلَّفة بـ try/except + استخدام `hasattr` للحقول legacy على User + محاولة ثانية بـ record فقط عند الفشل.
- `mark_failed_login`: استدعاؤها داخل `authenticate_user` صار مُغلَّفاً ولا يُفشل العملية.

**`backend/app/api/routes/auth.py`**
- إضافة دالة `_login_fallback()` جديدة: مسار طوارئ يُصدر access + refresh token صحيحين دون كتابة سجل الجلسة في DB (آمن لأنه يستدعي `authenticate_user` بنفسه ولا يتخطى أي تحقق أمني).
- استدعاء الـ fallback تلقائياً قبل إرجاع 503.
- جميع side-effects بعد المصادقة الناجحة (`mark_successful_login`, `record_audit_log`, الـ commit النهائي) صارت مُغلَّفة بـ try/except.
- `store_refresh_token` داخل `_issue_session` صار محمياً، ومحاولة الكوكي كذلك.

### Frontend

**`frontend/src/services/notificationService.js`**
- فحص طول وصلاحية `VAPID_PUBLIC_KEY` قبل استدعاء `urlBase64ToUint8Array`.
- إرجاع `null` بصمت إذا كان المفتاح غير صالح.

**`frontend/src/services/realtimeNotifications.js`**
- نفس الفحص + التحقق من أن المفتاح المُفكَّك بطول 65 بايت (P-256 uncompressed key).
- منع `pushManager.subscribe` من الانطلاق بمفتاح خاطئ.

## ما يجب فعله على Render بعد النشر

1. **اضبط متغير `VITE_VAPID_PUBLIC_KEY`** في إعدادات الـ frontend service على Render. لتوليده محلياً:
   ```bash
   npx web-push generate-vapid-keys
   ```
   ضع الـ public key في `VITE_VAPID_PUBLIC_KEY` والـ private في متغير `VAPID_PRIVATE_KEY` على backend.

2. **تأكد من تطبيق migrations الـ alembic** على Postgres:
   ```bash
   cd backend && alembic upgrade head
   ```
   هذا يضمن وجود جدول `user_sessions` وأعمدة `refresh_token_*` على جدول users.

3. **`SECRET_KEY` / `JWT_SECRET_KEY`** يجب أن يكون موحَّداً ولا يتغير بين إعادات النشر، وإلا الكابتشا والـ tokens يفشلون.
