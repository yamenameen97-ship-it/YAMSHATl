# إصلاح مشكلة تسجيل الدخول v60 — تحليل جذري دقيق

## أعراض المشكلة (من سكرين‌شوت المستخدم)
- `POST /api/auth/login → 400 Bad Request` يتكرر 3 مرات حتى مع بيانات صحيحة 100%.
- في الواجهة تظهر رسالة: **"الكابتشا انتهت أو غير موجودة. حدّثها وجرب تاني."**
- المستخدم يحلّ الكابتشا بإجابة صحيحة ومع ذلك يفشل تسجيل الدخول.

## التحليل الجذري (Root Cause Analysis)

بعد فحص الكود طبقة-طبقة، ثلاث مشكلات جذرية متضافرة:

### 🔴 السبب الجذري #1 — Nonce سيلف-أوس يقتل أي إعادة محاولة

**الموقع**: `backend/app/api/routes/auth.py` — دالة `_consume_nonce` (السطور 116-127 سابقاً).

**التسلسل المسبب للخطأ**:
1. المستخدم يفتح صفحة تسجيل الدخول → يصل captcha-token وفيه `n` (nonce).
2. المستخدم يكتب البيانات + يحل الكابتشا → يرسل POST `/api/auth/login`.
3. السيرفر يتحقق من الكابتشا، **يستهلك الـ nonce فوراً**، ثم يتحقق من كلمة المرور.
4. إذا حدث **أي خطأ بعد ذلك** (كلمة مرور غير صحيحة بحرف، 2FA challenge، Rate limit مؤقت، حتى الـ user.last_login_at commit) → المستخدم يحاول مرة ثانية.
5. الفرونت إند **يبقي نفس captcha_id في state** (لا يحدّثه إلا إذا الرسالة فيها كلمة "كابتشا").
6. المحاولة التانية تصل بنفس الـ nonce → `_consume_nonce` يرفض → **400 Captcha expired or missing**.

**المشكلة الأعمق**: حتى لو فشل authenticate_user (بإلقاء HTTPException قبل الـ register_failed_login)، فالـ nonce قد استُهلك بالفعل → كل محاولات إعادة المحاولة محكوم عليها بالفشل ما لم يضغط المستخدم على زر "تحديث الكابتشا" يدوياً.

### 🔴 السبب الجذري #2 — Mismatch في أسماء حقول الـ captcha token

**الموقع**: `backend/app/main.py` (السطور 211-235) ضد `backend/app/api/routes/auth.py` (السطور 90-110).

- `main.py::_issue_simple_captcha` كان يصدر token بحقول: `a`, `iat`, `exp`, `nonce`
- `auth.py::_verify_captcha_token` يتوقع الحقول: `a`, `e`, `n`, `v`

**النتيجة**: في حالة سقوط الـ auth.router بأي خطأ في الـ imports (حصل من قبل بسبب dependencies)، الـ inline fallback في `main.py` كان يصدر كابتشا **مستحيل التحقق منها أبداً** → كل تسجيلات الدخول تموت بـ 400.

### 🔴 السبب الجذري #3 — الفرونت إند يحدّث الكابتشا فقط عند رسالة محددة

**الموقع**: `frontend/src/pages/Login.jsx` (السطور 213-219).

كان الكود يحدّث الكابتشا فقط إذا كانت رسالة الخطأ فيها كلمة "كابتشا" أو "captcha". لكن:
- الـ 400 الأول من الـ nonce المستهلك يأتي برسالة `Captcha expired or missing` ✅ يتم التحديث.
- لكن إذا فشل تسجيل الدخول لأي سبب آخر (مثلاً كلمة مرور خاطئة)، الكابتشا الحالية أصبحت **مستهلكة** بالفعل ولكن الفرونت إند لا يعرف ولا يحدّثها → المحاولة الثانية تموت.

## الإصلاحات المُطبَّقة في v60

### Backend

#### `backend/app/api/routes/auth.py`

**1. تخفيف قاعدة الـ nonce من single-use إلى limited-use (5 محاولات):**
```python
_CAPTCHA_NONCE_MAX_USES = 5
```
- نفس الـ captcha_id يصلح لـ 5 محاولات تسجيل دخول قبل الانتهاء.
- الكابتشا تنتهي بعد 5 دقائق (لم يتغير).
- **الأمان محفوظ**: المحاولات الـ 5 محدودة بالـ rate-limit الموجود أصلاً (10 محاولات/دقيقة) وانتهاء الصلاحية الزمنية.

**2. دعم خلفي لحقول الـ token القديمة (`exp`/`nonce`):**
```python
expires_ts = float(token_payload.get('e') or token_payload.get('exp') or 0)
nonce = str(token_payload.get('n') or token_payload.get('nonce') or '')
```
- يضمن أن أي كابتشا يصدرها الـ inline fallback في `main.py` يمكن التحقق منها.

#### `backend/app/main.py`

**3. مزامنة حقول inline-fallback captcha مع verifier:**
```python
token_payload = {
    "a": str(answer),
    "e": now + _CAPTCHA_TTL_SECONDS,    # ← المفتاح الجديد
    "exp": now + _CAPTCHA_TTL_SECONDS,  # ← back-compat
    "iat": now,
    "n": secrets.token_urlsafe(12),     # ← المفتاح الجديد
    "v": 1,
}
```
بالإضافة لإضافة `expires_in_seconds` للتوافق مع الـ frontend.

### Frontend

#### `frontend/src/pages/Login.jsx`

**4. تحديث الكابتشا تلقائياً عند أي 4xx (ما عدا 403):**
```javascript
const shouldRefreshCaptcha = captchaRelated
  || (typeof status === 'number' && status >= 400 && status < 500 && status !== 403);
if (shouldRefreshCaptcha) {
  setForm((prev) => ({ ...prev, captchaAnswer: '' }));
  loadCaptcha(true);
}
```
- أي 400 أو 401 أو 429 يستدعي كابتشا جديدة فوراً.
- استثناء 403 لأنه `email_verification_required` ولا داعي لكابتشا جديدة.

#### `frontend/public/sw-pwa-enhanced.js`

**5. ترقية إصدار الـ service worker** من `1.0.3-pwa-enhanced-fixed` إلى `1.0.4-pwa-v60-login-fix`.
- يجبر المتصفح على invalidate caches القديمة بعد النشر.

## كيفية التحقق بعد النشر

1. **افتح المتصفح في وضع InPrivate / Incognito** (لتجاوز SW القديم).
2. اذهب إلى صفحة `/login`.
3. أدخل بيانات صحيحة + حل الكابتشا → يجب أن ينجح.
4. **اختبر الإعادة**: أدخل بيانات خاطئة عمداً → سترى رسالة خطأ → الكابتشا ستتحدث تلقائياً.
5. أدخل بيانات صحيحة في نفس الجلسة → يجب أن ينجح.
6. كرر 5 مرات بنفس الكابتشا (لو لم يتم تحديثها يدوياً) → في الـ 6 مرة سترى "Captcha expired or missing" (هذا متوقع وأمني).

## ملفات تم تعديلها

- ✅ `backend/app/api/routes/auth.py`
- ✅ `backend/app/main.py`
- ✅ `frontend/src/pages/Login.jsx`
- ✅ `frontend/public/sw-pwa-enhanced.js`

## ما لا يحتاج تغيير

- ❌ DB schema — لا تغيير.
- ❌ متغيرات البيئة — لا تغيير.
- ❌ `requirements.txt` / `package.json` — لا تغيير.
