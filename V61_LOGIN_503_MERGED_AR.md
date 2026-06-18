# V61 — دمج إصلاح 503 على /api/auth/login ✅

## ما الذي تم دمجه فعلياً في هذه النسخة

تم دمج خمس طبقات حماية مقابل خطأ `503 Service Unavailable` و `sqlalche.me/e/20/f405` على Render داخل الملفات الأصلية للمشروع:

### 1) `backend/app/db/session.py` — معزّز
- ✅ `pool_pre_ping=True` — فحص الاتصال قبل كل استخدام (كان موجوداً سابقاً)
- 🆕 `pool_recycle=280` — تجديد الاتصالات قبل أن تقطعها Render (~300s)
- 🆕 `pool_size`, `max_overflow`, `pool_timeout` من المتغيرات البيئية
- 🆕 `connect_args` يحتوي `keepalives` + `connect_timeout` + `application_name`
- 🆕 Listener `engine_connect` يلتقط الاتصالات الميتة ويلغيها تلقائياً
- 🆕 دالة `db_healthcheck()` لاستخدامها في `/api/health`
- ✅ تطبيع `postgres://` → `postgresql://` للتوافق مع SQLAlchemy 2.x
- ✅ الحفاظ على `_set_statement_timeout` listener القديم

### 2) `backend/app/core/retry.py` — جديد
- decorator `@db_retry(max_attempts=3, initial_delay=0.3)` يعيد المحاولة عند:
  - `DisconnectionError`
  - `OperationalError`
  - `InterfaceError`
  - `DBAPIError` (فقط عندما `connection_invalidated=True`)
- backoff تصاعدي + rollback تلقائي للجلسة عند الفشل اللحظي.

### 3) `backend/app/middleware/db_error_handler.py` — جديد
- يسجل exception handlers على `FastAPI` لتحويل أخطاء SQLAlchemy إلى استجابة `503` منظمة:
  ```json
  {
    "error": "db_disconnected",
    "message": "خدمة قاعدة البيانات غير متاحة مؤقتاً. حاول مرة أخرى.",
    "detail": "Authentication service is temporarily unavailable. Please try again.",
    "retry_after": 3
  }
  ```
- يضيف `Access-Control-Allow-Origin` على الاستجابات حتى لا يرى المتصفح "CORS blocked" بدل الخطأ الحقيقي.

### 4) `backend/app/services/auth_service.py` — معدّل
- استعلام البحث عن المستخدم في `authenticate_user` أصبح **مغلَّفاً بـ `@db_retry`**:
  ```python
  @db_retry(max_attempts=3, initial_delay=0.3)
  def _query_user_by_identifier(db, lowered_identifier):
      ...
  ```
- هذا هو المسار الذي كان يفشل بالضبط في صورة السجلات (الاستعلام `FROM users WHERE users.is_active IS true AND lower(users.email)=...`).

### 5) `backend/app/main.py` — معدّل
- استيراد وتفعيل `register_db_exception_handlers(app)` بعد إنشاء التطبيق.
- `/api/health` يستدعي `db_healthcheck()` لإرجاع حالة الـ pool.

### 6) `backend/app/core/config.py` — معدّل
- متغيرات جديدة: `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, `DB_POOL_TIMEOUT`, `DB_POOL_RECYCLE`.

### 7) `scripts/migration_indexes.sql` — مضاف
- فهارس على `lower(email)` و `lower(username)` لتسريع البحث الحرج في login.

---

## النشر على Render

```bash
# 1) رفع الكود
git add .
git commit -m "fix(v61): harden DB pool + retry against Render 503 on /api/auth/login"
git push

# 2) (اختياري لكن موصى به) إضافة الفهارس على قاعدة الإنتاج
psql $DATABASE_URL -f scripts/migration_indexes.sql
```

### متغيرات بيئية موصى بها على Render
| المتغير | القيمة |
|---|---|
| `DB_POOL_SIZE` | `5` |
| `DB_MAX_OVERFLOW` | `10` |
| `DB_POOL_TIMEOUT` | `20` |
| `DB_POOL_RECYCLE` | `280` |
| `DB_STATEMENT_TIMEOUT_MS` | `8000` |

---

## التحقق

```bash
# بيانات اعتماد خاطئة يجب أن ترجع 401 وليس 503
curl -X POST https://yamshat-1ya4.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"nobody@example.com","password":"wrong"}'

# فحص صحة قاعدة البيانات
curl https://yamshat-1ya4.onrender.com/api/health
# → {"status":"ok","service":"yamshat-backend","db":"ok","pool_size":5,...}
```

السلوك المتوقع بعد الإصلاح:
- ❌ قبل: `503 Service Unavailable` على أول طلب login بعد خمول.
- ✅ بعد: `401` (بيانات خاطئة) أو `200` (نجاح). لا 503 إلا في انقطاع DB حقيقي وطويل.
