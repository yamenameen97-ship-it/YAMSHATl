# Checklist إصلاح الكابتشا و CORS

## تم إصلاحه داخل المشروع
- تحديث إعدادات `backend/.env` بحيث تشمل رابط الواجهة الحالي `yamshat1-1-vg10.onrender.com`.
- إضافة `CORS_ORIGIN_REGEX` مرن يقبل تغيّر suffix الخاص بخدمات Render لنفس عائلة المشروع.
- تحسين اشتقاق `cors_origin_regex` داخل `backend/app/core/config.py` ليتعامل مع روابط Render المتغيرة مثل:
  - `yamshat1-1-yg1o.onrender.com`
  - `yamshat1-1-vg10.onrender.com`
  - `yamshat1-ahj8.onrender.com`
- إضافة `CORSMiddleware` إلى `gateway/main.py` حتى لا تفشل طلبات `OPTIONS` / `preflight` عند المرور عبر الـ gateway.
- رفع رقم الـ build في `frontend/src/main.jsx` لإجبار المتصفح على تنظيف التخزين المحلي والـ service worker والكاش القديم.

## Checklist النشر على Render
1. أعد نشر خدمة **backend** بعد رفع الملفات الجديدة.
2. إذا كنت تستخدم **gateway** كخدمة أمامية للـ API، أعد نشرها أيضاً.
3. تأكد أن متغيرات البيئة في Render مطابقة للقيم التالية:
   - `FRONTEND_ORIGIN=https://yamshat1-1-vg10.onrender.com`
   - `BACKEND_ORIGIN=https://yamshat1-ahj8.onrender.com`
   - `RENDER_EXTERNAL_URL=https://yamshat1-ahj8.onrender.com`
   - `CORS_ORIGIN_REGEX=^https://yamshat1(?:-1)?(?:-[a-z0-9]+)?\.onrender\.com$`
4. بعد نشر الواجهة، افتح الموقع بمتصفح جديد أو اعمل Hard Refresh.
5. لو استمرت المشكلة، امسح Site Data / Cookies للموقعين على Render ثم جرّب مرة أخرى.

## فحص سريع بعد النشر
- افتح صفحة تسجيل الدخول.
- تأكد أن الكابتشا تتحمل بدون الرسالة الحمراء.
- من Network/Console يجب ألا ترى أخطاء:
  - `blocked by CORS policy`
  - `No 'Access-Control-Allow-Origin' header`
  - `net::ERR_FAILED` على `/api/auth/refresh`
- جرّب Refresh للجلسة أو تسجيل دخول طبيعي.

## ملاحظة مهمة
لو Render غيّر suffix الواجهة لاحقاً، الكود المعدل الحالي يفترض أن يستوعب ذلك بدون الحاجة لتعديل يدوي كل مرة، طالما الرابط ضمن نفس عائلة المشروع.
