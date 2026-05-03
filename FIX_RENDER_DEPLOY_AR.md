# حل نشر YAMSHAT على Render

## إعدادات الباك إند الصحيحة
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Pre-Deploy Command:** `bash scripts/predeploy.sh`
- **Start Command:** `bash scripts/start.sh`
- **Health Check Path:** `/health`

## إعدادات الفرونت إند الصحيحة
- **Root Directory:** `frontend`
- **Build Command:** `npm ci && npm run build`
- **Publish Directory:** `dist`
- **Rewrite / SPA:** `/* -> /index.html`

## لماذا كان النشر يفشل؟
1. كان Render يشغّل `uvicorn main:app` بينما التطبيق الحقيقي داخل `backend/app/main.py`، لذلك ظهر الخطأ `Could not import module 'main'`.
2. في بعض الحالات تكون قاعدة البيانات موجودة بالفعل لكن جدول `alembic_version` غير موجود، فيفشل أول migration لأنه يحاول إنشاء جداول موجودة مسبقًا.
3. الفرونت إند كان يستنتج رابط الباك إند فقط عندما يكون اسم الخدمة منتهيًا بـ `-1`، بينما رابطك الحالي يستخدم لاحقة مثل `-11`.

## ما الذي تم إصلاحه؟
- إضافة سكربت تشغيل ثابت للباك إند.
- إضافة سكربت pre-deploy ذكي يتعامل مع قاعدة جديدة أو قاعدة موجودة سابقًا.
- توسيع منطق ربط الفرونت إند ليتعامل مع أي لاحقة رقمية على Render مثل `-11` و `-12`.
- تفعيل CORS regex في الباك إند للسماح بنفس عائلة دومينات Render الخاصة بالخدمة.

## متغيرات البيئة المهمة
- `DATABASE_URL`
- `SECRET_KEY`
- `FRONTEND_ORIGIN`
- `BACKEND_ORIGIN`
- `RENDER_EXTERNAL_URL`
- `CORS_ORIGINS`
- `CORS_ORIGIN_REGEX`

## قيم مقترحة لو رابط الفرونت الحالي هو yamshatl-11
- `FRONTEND_ORIGIN=https://yamshatl-11.onrender.com`
- `BACKEND_ORIGIN=https://yamshatl.onrender.com`
- `RENDER_EXTERNAL_URL=https://yamshatl.onrender.com`
- `CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,https://yamshatl-11.onrender.com,https://yamshatl.onrender.com`
- `CORS_ORIGIN_REGEX=^https://yamshatl(?:-\d+)?\.onrender\.com$`
