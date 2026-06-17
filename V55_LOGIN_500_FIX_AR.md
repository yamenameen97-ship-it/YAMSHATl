# إصلاح v55 — تسجيل الدخول يفشل بـ 500/400

## السبب الجذري (Root Cause)

روتر `/api/auth/*` لم يكن مُحَمَّلاً على الخادم أصلاً!

السلسلة:
1. `app/api/routes/auth.py` يستورد `app.services.email`
2. `app/services/email.py` يستورد `from app.celery_app import celery_app` على المستوى العلوي
3. حزمة `celery` غير مثبتة (أو فشل تثبيتها) → `ModuleNotFoundError`
4. روتر `auth` يفشل في التحميل بالكامل
5. النتيجة: `POST /api/auth/login` غير موجود → الخادم يرجع **500** و **400** من معالج fallback

## الإصلاح

### 1. `app/services/email.py`
استيراد celery أصبح **دفاعياً**: لو `celery_app` غير متاح، نوفّر `_NoopCeleryApp` يحاكي `.task` decorator + `.delay/.apply_async` تشتغل بشكل متزامن inline.

### 2. `app/api/routes/voice_rooms.py` و `engagement.py`
تصحيح `from app.db.session import get_db` → `from app.core.dependencies import get_db` (المسار الصحيح).

## مقارنة Before vs After

| البند | قبل (v54) | بعد (v55) |
|---|---|---|
| `app.api.routes.auth.router` | ❌ FAILED: `No module named 'celery'` | ✅ mounted at /api/auth |
| `app.api.routes.users.router` | ❌ FAILED | ✅ mounted |
| `app.api.routes.admin.router` | ❌ FAILED | ✅ mounted |
| `app.api.routes.voice_rooms` | ❌ FAILED: `get_db` import | ✅ mounted |
| `app.api.routes.engagement` | ❌ FAILED: `get_db` import | ✅ mounted |
| `POST /api/auth/login` | 500 / 400 (المسار غير موجود) | 200 + JWT token صحيح |
| `email.py` بدون celery | يفشل التحميل بالكامل | يعمل inline بأمان |

## الاختبار

تم اختبار محلياً مع SQLite:
- `GET /api/auth/captcha` → 200 + captcha صالح
- `POST /api/auth/login` مع `yasryameen21@gmail.com / 12345678` → **200** + access_token + refresh + session

## ملاحظة للنشر على Render

تأكد من وجود `celery==5.3.6` في `requirements.txt` (موجود فعلاً) — هذا الإصلاح يجعل التطبيق يعمل حتى لو فشل تثبيت celery لأي سبب، ولكنه احتياطي. السبب الأصلي على Render قد يكون cache قديم لم يثبّت celery.
