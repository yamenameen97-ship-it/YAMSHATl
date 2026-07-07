# v85.2 — ربط قاعدة البيانات الجديدة على Render (إصلاح شامل بدقة متناهية)

## 🎯 السياق

- القاعدة السابقة `yamshat_d` استنفذت المساحة المجانية على Render وحُذفت.
- تم إنشاء قاعدة جديدة `yamshatdt`.
- الرابط الداخلي الجديد نُسخ إلى Environment Variables في خدمة الباك اند على Render، لكن المنصة لم تتعرف عليه — الجداول لم تُنشأ والتطبيق يعود إلى SQLite أو يفشل بـ 500.

## 🔍 التشخيص (السبب الجذري)

بعد فحص المشروع، اكتُشفت **ست فجوات** متسلسلة:

| # | الملف | المشكلة |
|---|-------|---------|
| 1 | `backend/.env` | لا يزال يحمل الرابط القديم `yamshat_d_user@...yamshat_d` |
| 2 | `backend/app/main.py` | `startup event` **لا يستدعي** `initialize_database()` أبداً — لذا حتى مع قاعدة جديدة فارغة، لن تُنشأ الجداول تلقائياً |
| 3 | `backend/app/core/config.py` | `normalize_database_url` لا يضيف `sslmode=require` للروابط الخارجية → فشل SSL |
| 4 | `backend/app/db/session.py` | لا يوجد `pool_recycle` ولا `connect_timeout` → انقطاعات متكررة على Free tier |
| 5 | `backend/alembic/env.py` | يستخدم `settings.DATABASE_URL` الخام (بدون normalize) → قد يفشل مع `postgres://` |
| 6 | `backend/alembic.ini` | `sqlalchemy.url = %(DATABASE_URL)s` يسبب `InterpolationMissingOptionError` إذا احتوت كلمة المرور على `%` |

---

## ✅ الإصلاحات المطبَّقة

### 1️⃣ `backend/.env`
تحديث الرابط بالكامل + تفعيل bootstrap التلقائي:
```env
DATABASE_URL=postgresql://yamshatdt_user:I7IKG546v6Rq54mMFsrAyiE3G1jPxeT3@dpg-d96nf4uq1p3s73d2m95g-a/yamshatdt
DB_BOOTSTRAP_ON_START=true
```

### 2️⃣ `backend/app/main.py` — **الإصلاح الأهم**
إضافة استدعاء `initialize_database()` في `on_startup` (كان مفقوداً كلياً):
```python
try:
    from app.db.bootstrap import initialize_database
    from app.db.session import engine as _db_engine
    initialize_database(_db_engine)
    logger.info("   🗄️  Database initialization completed")
except Exception as exc:
    logger.error(f"   ❌ Database bootstrap failed: {exc}", exc_info=True)
```
هذا يضمن أنه عند أول إقلاع للخدمة على القاعدة الجديدة الفارغة، ستُنشأ **كل** الجداول + حسابات المسؤول والديمو تلقائياً.

### 3️⃣ `backend/app/core/config.py`
تحسين `normalize_database_url`:
- تحويل `postgres://` → `postgresql://` (SQLAlchemy 2.x يرفض القديم).
- إضافة `sslmode=require` تلقائياً **فقط** للروابط الخارجية (`.render.com`).
- عدم لمس الروابط الداخلية أو sqlite.

### 4️⃣ `backend/app/db/session.py` — إعادة كتابة كاملة للـ resolver
- `pool_recycle=280` → يتجنب "server closed the connection unexpectedly" على Render.
- `connect_timeout=10` → يمنع تعليق التطبيق دقائق إذا كانت القاعدة نائمة.
- Fallback ثلاثي: `settings.effective_database_url` → `settings.DATABASE_URL` → `os.getenv('DATABASE_URL')` → SQLite محلي — يكسر أي كاش قديم على Render.
- Log مقنّع لكلمة المرور: `postgresql://***@host/db`.

### 5️⃣ `backend/alembic/env.py`
```python
_alembic_db_url = getattr(settings, 'effective_database_url', None) or settings.DATABASE_URL
config.set_main_option('sqlalchemy.url', _alembic_db_url)
```
يضمن أن migrations تستخدم نفس المسار المُطبَّع (postgresql:// + sslmode).

### 6️⃣ `backend/alembic.ini`
إزالة `%(DATABASE_URL)s` — env.py يحقن القيمة برمجياً.

---

## 🧪 التحقق (تم اختبارها في sandbox)

| اختبار | النتيجة |
|--------|---------|
| `python3 -m py_compile` على كل الملفات المعدَّلة | ✅ OK |
| `settings.database_url_configured` مع الرابط الجديد | ✅ `True` |
| `settings.effective_database_url` | ✅ يعيد الرابط كما هو (داخلي، بدون تعديل زائد) |
| `normalize_database_url(external_render_url)` | ✅ يضيف `?sslmode=require` تلقائياً |
| `normalize_database_url("postgres://...")` | ✅ يحوّله إلى `postgresql://` |

---

## 🚀 خطوات النشر على Render

1. ارفع هذه النسخة إلى GitHub / Git.
2. في لوحة Render → خدمة الباك اند (`yamshat-1ya4`) → **Environment**:
   - تأكد أن `DATABASE_URL` = الرابط الداخلي الجديد الذي نسخته أنت (نفس الموجود في `.env` الآن).
3. **Manual Deploy → Deploy latest commit**.
4. راقب اللوجز. يجب أن ترى:
   ```
   Database engine will connect to: postgresql://***@dpg-d96nf4uq1p3s73d2m95g-a/yamshatdt
   🚀 Yamshat backend started
   🗄️  Database initialization completed
   ✅ All N routers mounted successfully
   ```
5. اختبر تسجيل الدخول بحساب المسؤول `yamenameen97@gmail.com / yamen1234` — سيُنشأ تلقائياً في القاعدة الجديدة.
