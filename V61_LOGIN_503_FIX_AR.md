# إصلاح فشل تسجيل الدخول v61 — خطأ 503 / SQLAlchemy f405

## أعراض المشكلة الجديدة

من سكرين‌شوت الكنسول:
```
Failed to load resource: the server responded with a status of 503 ()
https://yamshat-1ya4.onrender.com/api/auth/login:1
```

من سكرين‌شوت لوجات الباك إند:
```
SELECT users.last_device_id_hash, ..., users.phone_number,
       users.phone_verified, users.phone_verification_code,
       users.phone_verification_expires_at,
       users.phone_verification_attempts,
       users.phone_verification_locked_until
FROM users WHERE users.is_active IS true AND ...

(Background on this error at: https://sqlalche.me/e/20/f405)
INFO: 176.123.31.160:0 - "POST /api/auth/login HTTP/1.1" 503 Service Unavailable
```

## التحليل الجذري

كود `v60` أصلح مشكلة **الكابتشا (400)**، لكن **ظهرت مشكلة منفصلة وأكثر خطورة**:

### السبب الجذري: عدم تطابق سكيمة قاعدة البيانات مع نموذج SQLAlchemy

نموذج `User` في `backend/app/models/user.py` يحتوي على ستة أعمدة جديدة:

```python
phone_number = Column(String(20), nullable=True, unique=True, index=True)
phone_verified = Column(Boolean, default=False, nullable=False, index=True)
phone_verification_code = Column(String(128), nullable=True)
phone_verification_expires_at = Column(DateTime, nullable=True)
phone_verification_attempts = Column(Integer, default=0, nullable=False)
phone_verification_locked_until = Column(DateTime, nullable=True)
```

**لكن لا يوجد أي ملف Alembic migration يضيف هذه الأعمدة لقاعدة البيانات!**

نتيجة ذلك على Render:
1. التطبيق يقلع → جدول `users` على PostgreSQL لا يحتوي الأعمدة الجديدة.
2. أول طلب `POST /api/auth/login` → SQLAlchemy يولّد `SELECT ... users.phone_number, users.phone_verified, ...`.
3. PostgreSQL يرد بـ `UndefinedColumn` → SQLAlchemy يلفّه بـ `ProgrammingError` (الكود `f405`).
4. FastAPI لا يلتقط الاستثناء → يعيد **503 Service Unavailable**.

### لماذا الإصلاح التلقائي في `bootstrap.py` لم يعمل؟

- `app/db/bootstrap.py::_migrate_users_table` **تحتوي بالفعل** على `_add_column_if_missing` لكل أعمدة الهاتف.
- لكن `initialize_database()` **لم تكن تُستدعى أبداً في startup الرئيسي للتطبيق**.
- كانت تُستدعى فقط lazy داخل بعض المسارات (`reels`, `users`) — لكن مسار `/api/auth/login` **لا يستدعيها**.
- على Render مع cold-start، عند أول طلب تسجيل دخول، الأعمدة لم تكن قد أُضيفت بعد → 503.

## الإصلاحات المُطبَّقة في v61

### 1. ✅ Backend — `app/main.py`: استدعاء `initialize_database` في startup

```python
@app.on_event("startup")
async def on_startup():
    ...
    # ✅ v61 FIX: التأكد من تحديث سكيمة قاعدة البيانات قبل قبول أي طلب
    try:
        from app.db.bootstrap import initialize_database
        from app.db.session import engine
        initialize_database(engine)
        logger.info("   🗄️  Database schema bootstrap completed (phone_* columns ensured)")
    except Exception as exc:
        logger.warning(f"   ⚠️  Database bootstrap soft-fail: {exc}")
```

**النتيجة**: في كل مرة يقلع فيها التطبيق، يتم فحص جدول `users` وإضافة أي عمود ناقص (idempotent).

### 2. ✅ Backend — `app/services/auth_service.py`: حارس دفاعي + إعادة محاولة ذكية

أُضيفت دالة `_ensure_users_schema(db)` تعمل **مرة واحدة فقط** في دورة حياة العملية (process-level cache)، وتُستدعى قبل أول استعلام في `authenticate_user`:

```python
_USERS_SCHEMA_GUARDED = False

def _ensure_users_schema(db: Session) -> None:
    global _USERS_SCHEMA_GUARDED
    if _USERS_SCHEMA_GUARDED:
        return
    try:
        from app.db.bootstrap import _add_column_if_missing
        engine = db.get_bind()
        _add_column_if_missing(engine, 'users', 'phone_number', 'phone_number VARCHAR(20)')
        _add_column_if_missing(engine, 'users', 'phone_verified', 'phone_verified BOOLEAN NOT NULL DEFAULT FALSE')
        _add_column_if_missing(engine, 'users', 'phone_verification_code', 'phone_verification_code VARCHAR(128)')
        _add_column_if_missing(engine, 'users', 'phone_verification_expires_at', 'phone_verification_expires_at TIMESTAMP NULL')
        _add_column_if_missing(engine, 'users', 'phone_verification_attempts', 'phone_verification_attempts INTEGER NOT NULL DEFAULT 0')
        _add_column_if_missing(engine, 'users', 'phone_verification_locked_until', 'phone_verification_locked_until TIMESTAMP NULL')
        _USERS_SCHEMA_GUARDED = True
    except Exception:
        db.rollback()
```

وفي `authenticate_user`، أُضيف try/except حول الاستعلام مع إعادة محاولة واحدة بعد إعادة تشغيل الحارس:

```python
try:
    user = db.query(User).filter(...).first()
except Exception as query_exc:
    db.rollback()
    _USERS_SCHEMA_GUARDED = False
    _ensure_users_schema(db)
    try:
        user = db.query(User).filter(...).first()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Login service temporarily unavailable. Please try again in a moment.',
        ) from query_exc
```

### 3. ✅ Backend — `alembic/versions/20260618_0013_users_phone_verification.py`: migration رسمي

ملف Alembic جديد يضيف أعمدة الهاتف بشكل **idempotent** (يفحص قبل الإضافة):

- `phone_number VARCHAR(20)` + فهرس `ix_users_phone_number` (unique مع fallback)
- `phone_verified BOOLEAN NOT NULL DEFAULT FALSE` + فهرس
- `phone_verification_code VARCHAR(128)`
- `phone_verification_expires_at TIMESTAMP`
- `phone_verification_attempts INTEGER NOT NULL DEFAULT 0`
- `phone_verification_locked_until TIMESTAMP`

`down_revision = "20260616_0012"` لتسلسل صحيح، و`downgrade()` يحذف الأعمدة بأمان لو لزم.

### 4. ✅ Backend — `app/db/bootstrap.py`: تحديث الإصدار المرجعي

```python
CURRENT_ALEMBIC_REVISION = '20260618_0013'  # كان '20260605_0005'
```

## دفاع متعدد الطبقات

الإصلاح يستخدم **ثلاث طبقات حماية متراكمة** بحيث إذا فشلت أي طبقة، الطبقات الأخرى تعالج المشكلة:

| الطبقة | الموقع | متى يعمل |
|---|---|---|
| 1. Alembic migration | `20260618_0013` | عند تشغيل `alembic upgrade head` يدوياً أو في pipeline |
| 2. Startup bootstrap | `main.py::on_startup` | عند كل إقلاع للتطبيق على Render |
| 3. Lazy guard | `auth_service.py::_ensure_users_schema` | عند أول طلب تسجيل دخول، حتى لو فشل startup |

## كيفية التحقق بعد النشر

1. ادفع التغييرات إلى مستودع Render → سيُعاد البناء والنشر.
2. راقب لوجات البدء — يجب أن ترى:
   ```
   🗄️  Database schema bootstrap completed (phone_* columns ensured)
   ```
3. افتح المتصفح في وضع InPrivate / Incognito.
4. اذهب إلى `/login` → أدخل بيانات صحيحة + حل الكابتشا → **يجب أن ينجح**.
5. إذا أردت تطبيق الـ migration يدوياً (اختياري):
   ```bash
   cd backend && alembic upgrade head
   ```

## ملفات تم تعديلها

- ✅ `backend/app/main.py` — استدعاء `initialize_database` في startup
- ✅ `backend/app/services/auth_service.py` — حارس + إعادة محاولة
- ✅ `backend/app/db/bootstrap.py` — تحديث `CURRENT_ALEMBIC_REVISION`
- ✅ `backend/alembic/versions/20260618_0013_users_phone_verification.py` — migration جديد (إنشاء)

## ما لا يحتاج تغيير

- ❌ نموذج `User` نفسه — صحيح كما هو.
- ❌ frontend — المشكلة كانت في الباك إند بالكامل.
- ❌ متغيرات البيئة — لا تغيير.
- ❌ `requirements.txt` — لا تغيير.
