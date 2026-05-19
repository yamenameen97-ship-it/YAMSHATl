# تحسينات نظام المصادقة (Auth Enhancements)

تمت إضافة التحسينات التالية إلى نظام المصادقة في الباك اند:

## 1. Google & Facebook OAuth
- تمت إضافة مسارات جديدة لتسجيل الدخول باستخدام Google و Facebook في `backend/app/api/routes/auth.py`.
- المسارات المضافة:
  - `GET /api/auth/oauth/google/login`
  - `GET /api/auth/oauth/google/callback`
  - `GET /api/auth/oauth/facebook/login`
  - `GET /api/auth/oauth/facebook/callback`
- تم تحديث `backend/app/services/auth_service.py` لإضافة دوال جلب بيانات المستخدم من Google و Facebook.
- تم تحديث `backend/app/core/config.py` لإضافة متغيرات البيئة اللازمة (Client ID, Client Secret, Redirect URI).

## 2. Device Fingerprint & Session Analytics
- تم الاستفادة من `request_binding_context` الموجود مسبقاً في `backend/app/core/request_security.py` والذي يقوم بجمع (IP, User Agent, Device ID) وإنشاء Hashes لها.
- تم ربط هذه البيانات مع كل عملية تسجيل دخول ناجحة لتحديث سجلات المستخدم (`last_login_ip_hash`, `last_login_user_agent_hash`, `last_device_id_hash`).

## 3. Suspicious Login Detection & Adaptive Authentication
- تم تحديث `backend/app/services/auth_feature_service.py` بإضافة دالة `evaluate_login_risk` التي تقوم بتقييم المخاطر بناءً على:
  - تغير عنوان IP.
  - تغير User Agent.
  - تغير الجهاز (Device ID).
  - عدد محاولات تسجيل الدخول المشبوهة السابقة.
- في حال اكتشاف تسجيل دخول مشبوه، يتم إيقاف عملية تسجيل الدخول وإصدار تحدي (Login Challenge) يتطلب التحقق بخطوتين (2FA) عبر البريد الإلكتروني.
- تم تحديث مسار تسجيل الدخول في `backend/app/api/routes/auth.py` لدعم هذا التحقق التكيفي.

## كيفية الاستخدام
1. قم بإضافة متغيرات البيئة التالية إلى ملف `.env`:
   ```env
   GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
   GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret
   GOOGLE_OAUTH_REDIRECT_URI=http://yourdomain.com/api/auth/oauth/google/callback

   FACEBOOK_OAUTH_CLIENT_ID=your_facebook_client_id
   FACEBOOK_OAUTH_CLIENT_SECRET=your_facebook_client_secret
   FACEBOOK_OAUTH_REDIRECT_URI=http://yourdomain.com/api/auth/oauth/facebook/callback
   ```
2. عند تسجيل الدخول، سيقوم النظام تلقائياً بتقييم المخاطر. إذا كان تسجيل الدخول مشبوهاً، سيعيد الخادم استجابة `403 Forbidden` مع ترويسات `X-Login-Challenge` و `X-Login-Challenge-Type`. يجب على الواجهة الأمامية التقاط هذه الترويسات وتوجيه المستخدم لإدخال رمز التحقق المرسل إلى بريده الإلكتروني.
