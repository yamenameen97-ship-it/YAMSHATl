# دليل النشر النهائي على Render

## 1) قبل الرفع
- ارفع المشروع بعد هذه الإصلاحات فقط.
- لا ترفع أي Build قديم من جهازك فوق `frontend/dist` بعد الآن.
- تأكد أن `render.yaml` موجود في جذر المشروع.

## 2) إنشاء الخدمات
### خدمة الباك إند
- النوع: **Web Service**
- الاسم المقترح: `yamshat-api`
- الجذر: `backend`
- أمر البناء: `pip install -r requirements.txt`
- أمر ما قبل النشر: `bash scripts/predeploy.sh`
- أمر التشغيل: `bash scripts/start.sh`
- Health Check: `/health`

### خدمة الفرونت إند
- النوع: **Static Site**
- الاسم المقترح: `yamshat-web`
- الجذر: `frontend`
- أمر البناء: `npm ci && npm run build`
- مجلد النشر: `dist`
- Rewrite rule: `/* -> /index.html`

## 3) متغيرات البيئة للباك إند
### إلزامي
- `DATABASE_URL`
- `SECRET_KEY`
- `FRONTEND_ORIGIN=https://YOUR-FRONTEND.onrender.com`
- `BACKEND_ORIGIN=https://YOUR-BACKEND.onrender.com`
- `RENDER_EXTERNAL_URL=https://YOUR-BACKEND.onrender.com`
- `CORS_ORIGINS=https://YOUR-FRONTEND.onrender.com`

### المصادقة والبريد
- `RESEND_API_KEY` أو إعدادات SMTP
- `RESEND_FROM`
- `RESEND_REPLY_TO`
- إذا ستستخدم الهاتف أو البريد فعلياً فعّل المزود المناسب

### البث والميديا
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## 4) متغيرات البيئة للفرونت إند
- `VITE_BACKEND_ORIGIN=https://YOUR-BACKEND.onrender.com`
- `VITE_API_BASE=https://YOUR-BACKEND.onrender.com/api`
- `VITE_SOCKET_URL=https://YOUR-BACKEND.onrender.com`
- `VITE_PRIMARY_ADMIN_EMAIL=YOUR_ADMIN_EMAIL`
- أضف أي متغيرات TURN/STUN أو Cloudinary إذا كنت ستستخدمها فعلياً

## 5) التنظيف النهائي قبل أول Deploy
1. احذف أي خدمة Frontend/Backend قديمة على Render كانت تشير إلى Build قديم.
2. احذف أي Domain قديم مربوط بخدمة مختلفة.
3. نفّذ Deploy جديد من نفس المستودع فقط.
4. بعد اكتمال نشر الفرونت إند افتح الموقع مع Hard Refresh.
5. من المتصفح امسح Site Data مرة واحدة إذا كنت جربت نسخ قديمة سابقاً.

## 6) لماذا كانت النسخة القديمة تظهر؟
- كان هناك اعتماد على إعدادات Runtime/Storage قديمة يمكن أن تعيد توجيه الواجهة إلى Backend Render قديم.
- كان `app-config.js` ثابتاً بدون كسر كاش قوي لكل Build.
- كانت هناك ملفات قديمة/احتياطية ومداخل Frontend غير لازمة وتسبب لخبطة أثناء المراجعة.

## 7) ما الذي تم إصلاحه
- إزالة الاعتماد على Host قديم ثابت داخل إعدادات الواجهة.
- إضافة كسر كاش فعلي لملف `app-config.js` في كل Build.
- إضافة رؤوس no-cache للملفات الحساسة في `frontend/public/_headers`.
- توصيل صفحة الـ Feed إلى النسخة المتقدمة الظاهرة فعلاً.
- ربط صفحة Groups بالـ API الحقيقي: تفاصيل المجموعة، الانضمام، الدعوات، الأدوار، الرقابة، وسجل التدقيق.
- حذف الملفات الاحتياطية/القديمة المتعارضة.

## 8) اختبار سريع بعد النشر
- افتح `/login`
- سجّل الدخول
- افتح `/`
- تأكد أن Feed المتقدم ظهر
- افتح `/groups`
- أنشئ مجموعة جديدة
- بدّل دور عضو أو أرسل دعوة
- افتح `/health` على الباك إند وتأكد أنها `ok`

## 9) لو ظهر لك Build قديم مرة ثانية
- اعمل Clear Site Data من المتصفح
- أعد نشر خدمة `yamshat-web`
- تأكد أن `VITE_API_BASE` يشير لنفس خدمة الباك إند الحالية
- لا تستخدم نفس دومين خدمة قديمة ما زالت شغالة لنفس المشروع
