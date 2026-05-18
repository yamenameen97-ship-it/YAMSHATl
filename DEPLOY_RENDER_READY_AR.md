# Yamshat Render Ready

## ارفع على GitHub
ارفع فقط:
- backend/
- frontend/
- mobile/
- render.yaml
- README.md
- database_schema.sql
- Dockerfile
- Procfile
- .gitignore

## لا ترفع على GitHub
- backend/.env
- frontend/.env.production
- frontend/dist
- node_modules
- mobile/.gradle
- mobile/local.properties
- backend/firebase/service-account.json
- أي مفاتيح أو أسرار

## Render Backend env
استخدم الملف: `backend/.env.render`

## Render Frontend env
استخدم الملف: `frontend/.env.render`

## ملاحظات
- الإشعارات تحتاج `FIREBASE_SERVICE_ACCOUNT_JSON` الصحيح في Render.
- التحقق بالبريد يحتاج دومين/مرسل Resend مفعل. لو استخدمت `onboarding@resend.dev` فده للتجربة فقط.
- البث المباشر يعتمد على LiveKit ومفاتيحه الموجودة في ملف البيئة.
- رفع الوسائط أصبح يدعم ImageKit مباشرة لو متغيراته موجودة.
