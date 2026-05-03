# YAMSHAT — Cleaned Ready-to-Use Project

ده أرشيف منظّف للمشروع بعد إزالة الملفات الزائدة وبقايا الشغل القديم، مع الإبقاء على الملفات الأساسية فقط:

- `backend/` — باك إند FastAPI
- `frontend/` — واجهة React + Vite
- `mobile/` — تطبيق Android
- `render.yaml` / `Dockerfile` / `Procfile` — ملفات النشر
- `database_schema.sql` — سكيمة قاعدة البيانات
- `DEPLOY_CHECKLIST_AR.txt` و `DEPLOY_LINKING_GUIDE.md` — ملاحظات النشر والربط

## ملاحظات مهمة
- تم حذف `node_modules` و `dist` وملفات الكاش وملفات البنية القديمة والمجلدات التجريبية/المكررة غير اللازمة للتطبيق الأساسي.
- ملف Firebase موجود في: `mobile/app/google-services.json`.
- تم تثبيت رابط LiveKit الصحيح في إعدادات الموبايل.
- إعدادات البريد الإلكتروني **تحتاج بيانات SMTP حقيقية** قبل أن يعمل إرسال رسائل استرجاع كلمة المرور فعليًا.
- تفعيل **التحقق بالبريد عند التسجيل** غير موجود كمسار مكتمل في الكود الحالي؛ الموجود حاليًا هو تدفق **استرجاع كلمة المرور** فقط.

## تشغيل الواجهة الأمامية
```bash
cd frontend
npm install
npm run build
```

## تشغيل الباك إند محليًا
```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## أهم الإعدادات قبل النشر
- `DATABASE_URL`
- `SECRET_KEY`
- `REDIS_URL`
- `EMAIL_ADDRESS`
- `EMAIL_PASSWORD`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `FIREBASE_CREDENTIALS_PATH`
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
