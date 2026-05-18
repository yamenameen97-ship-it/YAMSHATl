# دليل النشر على Render

## نظرة عامة

هذا المشروع عبارة عن تطبيق Yamshat الاجتماعي مع فرانت اند React وباك اند FastAPI. يتم نشر كلا الجزأين على Render.

## المتطلبات

- حساب Render
- GitHub repository
- متغيرات البيئة المطلوبة

## خطوات النشر

### 1. إعداد المستودع

تأكد من أن المستودع يحتوي على:
- ملف `render.yaml` في الجذر
- مجلد `frontend/` مع تطبيق React
- مجلد `backend/` مع تطبيق FastAPI

### 2. متغيرات البيئة المطلوبة

#### للفرانت اند (Frontend)

```
VITE_API_BASE=https://YOUR-BACKEND.onrender.com/api
VITE_BACKEND_ORIGIN=https://YOUR-BACKEND.onrender.com
VITE_SOCKET_URL=https://YOUR-BACKEND.onrender.com
VITE_PRIMARY_ADMIN_EMAIL=your-admin@email.com
VITE_ENABLE_OFFLINE_QUEUE=true
VITE_ENABLE_CHAT_CACHE=true
VITE_ENABLE_FRONTEND_LOGGING=true
VITE_ENABLE_PERFORMANCE_METRICS=true
VITE_LOG_LEVEL=warn
```

#### للباك اند (Backend)

```
DATABASE_URL=postgresql://user:password@host:port/dbname
REDIS_URL=redis://host:port
SECRET_KEY=your-secret-key
FRONTEND_ORIGIN=https://YOUR-FRONTEND.onrender.com
BACKEND_ORIGIN=https://YOUR-BACKEND.onrender.com
CORS_ORIGINS=https://YOUR-FRONTEND.onrender.com
RESEND_API_KEY=your-resend-api-key
FIREBASE_SERVICE_ACCOUNT_JSON=your-firebase-json
IMAGEKIT_PUBLIC_KEY=your-imagekit-key
IMAGEKIT_PRIVATE_KEY=your-imagekit-private-key
IMAGEKIT_URL_ENDPOINT=your-imagekit-endpoint
LIVEKIT_URL=your-livekit-url
LIVEKIT_API_KEY=your-livekit-key
LIVEKIT_API_SECRET=your-livekit-secret
```

### 3. النشر عبر Render

1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. انقر على "New" ثم اختر "Web Service"
3. اختر المستودع الخاص بك
4. اختر "Connect"
5. سيتم تحديد الخدمات تلقائياً من ملف `render.yaml`

### 4. التحقق من النشر

بعد النشر، تحقق من:

- **الفرانت اند**: تأكد من أن الموقع يحمل بشكل صحيح
- **الباك اند**: تحقق من نقطة نهاية `/health`
- **الاتصال**: تأكد من أن الفرانت اند يمكنه الاتصال بالباك اند

### 5. استكشاف الأخطاء

#### خطأ: "Missing export"

تم حل هذه المشكلة بإضافة الدوال المفقودة في ملفات API:
- `src/api/admin.js` - تم إضافة دوال الإدارة
- `src/api/posts.js` - تم إضافة دوال المنشورات
- `src/api/chat.js` - تم إضافة دوال الدردشة

#### خطأ: "Cannot GET /"

تم حل هذه المشكلة بإضافة ملف `nginx.conf` الذي يوجه جميع الطلبات إلى `index.html` للـ SPA routing.

#### خطأ: CORS

تأكد من تعيين `CORS_ORIGINS` في متغيرات البيئة للباك اند بشكل صحيح.

## ملفات مهمة

- `render.yaml` - إعدادات النشر
- `frontend/Dockerfile` - صورة Docker للفرانت اند
- `frontend/nginx.conf` - إعدادات Nginx للـ SPA routing
- `frontend/.env.render` - متغيرات البيئة للفرانت اند على Render

## الدعم

للمزيد من المعلومات، راجع:
- [Render Documentation](https://render.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [React Vite Deployment](https://vitejs.dev/guide/ssr.html)
