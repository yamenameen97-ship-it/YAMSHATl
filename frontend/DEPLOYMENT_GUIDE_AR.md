# دليل النشر على Render - لوحة التحكم Yamshat

## المشاكل التي تم إصلاحها

### 1. المكتبة المفقودة: `recharts`
**المشكلة:** كان المشروع يستخدم مكتبة `recharts` في ملف `LiveStreamDashboard.jsx` لكنها لم تكن موجودة في قائمة الاعتمادات.

**الحل:** تم إضافة `"recharts": "^2.14.0"` إلى قسم `dependencies` في ملف `package.json`.

### 2. خطأ في صيغة JSON
**المشكلة:** كانت هناك فاصلة مفقودة بعد قسم `dependencies` في `package.json`.

**الحل:** تم إضافة الفاصلة المفقودة لإصلاح صيغة JSON.

## متطلبات النشر على Render

### إعدادات البيئة
- **Node.js Version:** 20.x أو 22.x
- **npm Version:** >= 10
- **Build Command:** `npm run build`
- **Start Command:** `npm run preview` أو استخدام Nginx

### متغيرات البيئة (Environment Variables)
إذا كنت تريد استخدام متغيرات البيئة، أضفها في لوحة تحكم Render:

| المتغير | الوصف | مثال |
|--------|-------|------|
| `VITE_API_URL` | عنوان API الخلفي | `https://api.yamshat.com` |
| `VITE_SOCKET_URL` | عنوان Socket.IO | `https://api.yamshat.com` |
| `VITE_CLOUDINARY_URL` | عنوان Cloudinary | `https://api.cloudinary.com/v1_1/...` |
| `VITE_CLOUDINARY_PRESET` | Preset لـ Cloudinary | `your_preset_name` |

### ملفات الإعداد المهمة

**Dockerfile:** يحتوي على إعدادات البناء والتشغيل باستخدام Node.js و Nginx.

**nginx.conf:** يحتوي على إعدادات الخادم لخدمة تطبيق SPA مع:
- ضغط Gzip
- تخزين مؤقت ذكي للأصول الثابتة
- توجيه جميع الطلبات إلى `index.html` لدعم التوجيه

**vite.config.js:** يحتوي على إعدادات البناء والتحسينات:
- تقسيم الأكواد (Code Splitting)
- ضغط Gzip و Brotli
- تكوين PWA
- تحسينات الأداء

## خطوات النشر على Render

### الخطوة 1: إنشاء خدمة جديدة
1. اذهب إلى [Render Dashboard](https://dashboard.render.com/)
2. انقر على "New +" ثم اختر "Web Service"
3. اربط مستودع GitHub الخاص بك

### الخطوة 2: إعدادات الخدمة
- **Name:** اختر اسماً للخدمة (مثل: `yamshat-dashboard`)
- **Environment:** اختر `Docker`
- **Build Command:** `npm run build`
- **Start Command:** `npm run preview`

### الخطوة 3: متغيرات البيئة
أضف المتغيرات المطلوبة من قسم `VITE_` في ملف `.env.example`:

```
VITE_API_URL=https://yamshat-1ya4.onrender.com
VITE_SOCKET_URL=https://yamshat-1ya4.onrender.com
```

### الخطوة 4: النشر
انقر على "Create Web Service" وانتظر اكتمال النشر.

## التحقق من النشر

بعد اكتمال النشر، تحقق من:

1. **الصفحة الرئيسية:** يجب أن تحمل بدون أخطاء
2. **وحدة التحكم:** تحقق من عدم وجود أخطاء في JavaScript
3. **الأداء:** تحقق من أن الملفات مضغوطة بشكل صحيح

## ملاحظات مهمة

### PWA Support
التطبيق يدعم Progressive Web App (PWA)، مما يسمح بتثبيته كتطبيق على الهاتف أو الكمبيوتر.

### Service Worker
يتم تسجيل Service Worker تلقائياً لتحسين الأداء والدعم الغير متصل.

### Compression
يتم ضغط جميع الملفات الثابتة تلقائياً باستخدام Gzip و Brotli لتقليل حجم التنزيل.

## استكشاف الأخطاء

### الخطأ: "Cannot read properties of undefined (reading 'createContext')"
**السبب:** مشكلة في تقسيم الأكواد (Code Splitting) مع React Router.

**الحل:** تم تعطيل `manualChunks` في `vite.config.js` للسماح لـ Vite بإدارة تقسيم الأكواد تلقائياً.

### الخطأ: "Rollup failed to resolve import"
**السبب:** مكتبة مفقودة من `package.json`.

**الحل:** تأكد من إضافة جميع المكتبات المستخدمة إلى `dependencies`.

## الملفات المعدلة

- `package.json` - تم إضافة `recharts` وإصلاح الصيغة
- `DEPLOYMENT_GUIDE_AR.md` - دليل النشر (هذا الملف)
- `RENDER_DEPLOYMENT.md` - ملخص إعدادات Render

## الدعم والمساعدة

إذا واجهت أي مشاكل:

1. تحقق من سجلات البناء في Render
2. تأكد من أن جميع متغيرات البيئة مضبوطة بشكل صحيح
3. تحقق من أن جميع الاعتمادات مثبتة بشكل صحيح محلياً قبل النشر
