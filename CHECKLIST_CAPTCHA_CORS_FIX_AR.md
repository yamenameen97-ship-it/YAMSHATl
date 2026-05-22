# Checklist إصلاح الكابتشا و CORS

## تم إصلاحه داخل المشروع الآن
- تحويل الواجهة لاستخدام **same-origin proxy** عبر Nginx بدل النداء المباشر للـ backend الخارجي في بيئة Render، وبالتالي انتهت مشكلة CORS في `captcha` و `refresh` حتى لو Render غيّر الدومينات أو الكوكيز عبر خدمة مختلفة.
- إضافة proxy للمسارات التالية داخل `frontend/nginx.conf`:
  - `/api/`
  - `/socket.io/`
  - `/uploads/`
- نقل سياسة CSP من `<meta>` إلى **HTTP response header** داخل Nginx، وهذا يزيل تحذير الكونسول الخاص بـ:
  - `The Content Security Policy directive 'frame-ancestors' is ignored when delivered via a <meta> element`
- تعديل `public/app-config.js` و `src/public/app-config.js` حتى تعتمد الواجهة على نفس الدومين الحالي (`window.location.origin`) في Render، بدل ربط ثابت مباشر قد يعيد المشكلة.
- تعديل `frontend/src/api/auth.js` لتقليل احتمالات preflight غير الضروري عند تحميل الكابتشا، وتصحيح روابط OAuth إلى المسارات الصحيحة تحت `/api/auth/oauth/...`.
- تخفيف headers غير الضرورية في `frontend/src/auth/sessionManager.js` وتقليل مسببات `OPTIONS` الزائدة.
- رفع رقم الـ build إلى `yamshat-hotfix-20260522-cors-captcha-r4` لإجبار المتصفح على تنظيف الكاش و Service Worker القديم بعد النشر.

## المطلوب بعد رفع الملفات على Render
1. أعد نشر **خدمة frontend** أولاً.
2. إذا كان backend منشور بالفعل على:
   - `https://yamshat1-ahj8.onrender.com`
   فلا تحتاج تغيير كود backend لهذه المشكلة تحديداً.
3. افتح الموقع بعد النشر بمتصفح جديد أو استخدم Hard Refresh.
4. لو استمر الكاش القديم، امسح Site Data للموقع ثم افتحه من جديد.

## فحص سريع بعد النشر
- افتح صفحة تسجيل الدخول.
- تأكد أن الكابتشا تتحمل بدون الرسالة الحمراء.
- من Console / Network يجب ألا ترى أخطاء:
  - `blocked by CORS policy`
  - `No 'Access-Control-Allow-Origin' header`
  - `net::ERR_FAILED` على `/api/auth/refresh`
- يجب أن ترى الطلبات تخرج من نفس دومين الواجهة مثل:
  - `https://<frontend>/api/auth/captcha`
  - `https://<frontend>/api/auth/refresh`
  وليس مباشرة إلى دومين backend الخارجي.

## ملاحظة مهمة
- هذا الإصلاح أقوى من الاعتماد على CORS فقط، لأنه يخلي الواجهة تتكلم مع الـ API من نفس الـ origin، وبالتالي الكابتشا والكوكيز والـ refresh يشتغلوا بثبات أعلى على Render.
