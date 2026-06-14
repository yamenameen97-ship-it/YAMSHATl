# إصلاح فشل النشر على Render — pydantic-core / Python 3.14

## 🔴 سبب المشكلة (Root Cause)

من سجلات النشر على Render في الصور:

```
Downloading pydantic_core-2.27.2.tar.gz (413 kB)   ← يُنزّل tar.gz بدلاً من wheel
...
Checking for Rust toolchain ....
Running `maturin pep517 write-dist-info ... --interpreter /opt/render/project/src/.venv/bin/python3.14`
...
warning: failed to write cache, path: /usr/local/cargo/registry/index/... 
error: Read-only file system (os error 30)
error: failed to create directory `/usr/local/cargo/registry/cache/...`
maturin failed
Caused by: Cargo metadata failed. Does your crate compile with `cargo build`?
error: metadata-generation-failed
× Encountered error while generating package metadata.
  └─ pydantic-core
```

### تحليل المشكلة
1. **Render حدّث Python الافتراضي إلى الإصدار `3.14.3`** ([المرجع الرسمي](https://render.com/docs/language-support)).
2. **`pydantic-core==2.27.2` لا توجد له wheels مُجمّعة مسبقاً لـ Python 3.14** على PyPI.
3. عندما لا يجد pip wheel جاهز، يُنزّل ملف المصدر `.tar.gz` ويحاول بناءه عبر **Rust + maturin**.
4. عملية البناء تحتاج إلى **الكتابة في `/usr/local/cargo/registry/...`**، لكن هذا المسار **للقراءة فقط** على Render أثناء البناء → `os error 30`.

> هذه مشكلة موثّقة في [PyO3 issue #5000](https://github.com/PyO3/pyo3/issues/5000) و [PyPI - pydantic](https://pypi.org/project/pydantic/) — pydantic v2.12+ هو أول إصدار يدعم Python 3.14 رسمياً.

---

## ✅ الإصلاح المطبق

### 1) تثبيت إصدار Python على 3.11.10 (المدعوم من جميع المكتبات)

أُضيف `PYTHON_VERSION=3.11.10` كمتغير بيئة لكل خدمة Python في `render.yaml`.

كذلك أُضيف الملفات التالية في الجذر وفي مجلد كل خدمة:

- **`.python-version`** يحتوي على `3.11.10`
- **`runtime.txt`** يحتوي على `python-3.11.10`

> Render يقرأ هذه الملفات بثلاث طرق متراكبة لضمان التطبيق:
> 1. متغير البيئة `PYTHON_VERSION` (أعلى أولوية)
> 2. `.python-version` (المسار الموصى به حديثاً)
> 3. `runtime.txt` (الطريقة القديمة)

### 2) ترقية pip/setuptools/wheel قبل التثبيت

في كل `buildCommand` في `render.yaml` صار يبدأ بـ:
```bash
python -m pip install --upgrade pip setuptools wheel && pip install -r requirements.txt
```
هذا يضمن دعم أحدث wheel formats ويتجنب fallback إلى البناء من المصدر.

### 3) تحديث `nixpacks.toml` للـ backend

أُضيفت خطوة ترقية pip قبل التثبيت.

---

## 📋 قائمة الملفات المُعدّلة / المُضافة

| الملف | الحالة | السبب |
|---|---|---|
| `render.yaml` | **مُعدَّل** | إضافة `PYTHON_VERSION=3.11.10` + ترقية pip لكل خدمة Python (11 خدمة) |
| `backend/nixpacks.toml` | **مُعدَّل** | إضافة ترقية pip |
| `.python-version` | **جديد** (في الجذر) | تثبيت إصدار Python |
| `runtime.txt` | **جديد** (في الجذر) | تثبيت إصدار Python (طريقة قديمة) |
| `backend/.python-version` | **جديد** | تثبيت Python للخدمة |
| `backend/runtime.txt` | **جديد** | تثبيت Python للخدمة |
| `gateway/.python-version` | **جديد** | |
| `gateway/runtime.txt` | **جديد** | |
| `notification-service/.python-version` | **جديد** | |
| `notification-service/runtime.txt` | **جديد** | |
| `services/*/. python-version` | **جديد** (لـ 20 خدمة) | |
| `services/*/runtime.txt` | **جديد** (لـ 20 خدمة) | |

---

## 🚀 خطوات إعادة النشر

1. ارفع جميع الملفات إلى مستودع Git المربوط بـ Render (أو ارفع الملف المضغوط مباشرة لو كنت تستخدم upload).
2. في لوحة Render انقر **Manual Deploy → Clear build cache & deploy** (مهم جداً لمسح كاش Python 3.14 القديم).
3. راقب سجلات البناء — يجب أن تظهر سطر مشابه لـ:
   ```
   ==> Using Python version 3.11.10 (default)
   ```
   بدلاً من `python3.14`.
4. التثبيت يجب أن ينتهي بنجاح خلال 1-2 دقيقة لأن `pydantic-core==2.27.2` لديه wheel جاهز لـ Python 3.11 على linux-x86_64.

---

## 🛡️ خطة احتياطية (لو فشل النشر مجدداً)

لو لسبب ما استمرّ Render في استخدام Python 3.14، يُمكن ترقية pydantic إلى الإصدار 2.12.x الذي يدعم Python 3.14 رسمياً:

```diff
- pydantic==2.10.4
+ pydantic==2.12.0
- pydantic-settings==2.7.1
+ pydantic-settings==2.8.1
```

ثم إعادة النشر مع **Clear build cache**.

---

## 📚 مراجع

- [Render — Setting Your Python Version](https://render.com/docs/python-version)
- [Render — Supported Languages](https://render.com/docs/language-support)
- [Pydantic v2.12 release notes — initial Python 3.14 support](https://pydantic.dev/articles/pydantic-v2-12-release)
- [PyO3 issue #5000 — Potential Python 3.14 incompatibility](https://github.com/PyO3/pyo3/issues/5000)

---

**تاريخ الإصلاح:** 2026-06-14
