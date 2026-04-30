# Yamshat — دليل الربط الصحيح على Render

## 1) تشخيص المشكلة الحالية
من اللوج الظاهر عندك كان في **SyntaxError داخل backend/db.py** أثناء إقلاع Gunicorn، وبالتالي خدمة الـ backend كانت تقع قبل ما تبدأ فعلياً.

ومن لقطة قاعدة البيانات واضح إن PostgreSQL نفسها كانت **تستقبل الاتصال وتسمح بالمصادقة بنجاح**، وده معناه إن المشكلة الأساسية لم تكن في تشغيل قاعدة البيانات نفسها، بل في إقلاع الباك إند وربط الواجهة معه.

## 2) أفضل طريقة نشر للمشروع
### الخيار الموصى به: خدمة ويب واحدة
- خدمة Web واحدة على Render
- Flask يخدم الـ API على `/api`
- ونفس الخدمة تخدم ملفات `frontend/`
- ساعتها الواجهة والخلفية يشتغلوا من نفس الدومين، ومش هتحتاج تعقيد ربط بين دومينين

### الخيار الثاني: فصل الواجهة عن الخلفية
لو مصرّ تستخدم:
- Web Service للباك إند
- Static Site للفرونت إند

فلازم الواجهة تعرف رابط الباك إند بشكل صحيح.
تم تعديل `frontend/app-config.js` بحيث:
- يقرأ أولاً القيمة المخزنة في `localStorage.apiBase`
- يقبل رابط من الـ query string مثل:
  - `?backend=https://your-backend.onrender.com`
  - أو `?api=https://your-backend.onrender.com/api`
- ويحاول تلقائياً استنتاج رابط الباك إند لو كان رابط الواجهة ينتهي بـ `-1.onrender.com`

## 3) ماذا تم تعديله في هذا الباندل
- تم تحويل صفحات الويب لتقرأ الإعداد من `frontend/app-config.js` بدل الاعتماد الإجباري على `/api/app-config.js`
- تم تحسين `frontend/app-config.js` ليدعم:
  - نفس الدومين
  - فصل الفرونت إند عن الباك إند
  - تمرير رابط الباك إند من الـ URL
  - الاستدلال التلقائي على Render بين `service-1` و `service`
- تم تصحيح القيم الافتراضية الخاطئة/المكتوبة بشكل غير متسق في ملفات Android (`yamshatl` → `yamshati`)
- تم تحديث هذا الدليل لشرح كل مفتاح في Render ومصدره

## 4) مفاتيح Render — كل مفتاح وظيفته ومن أين تحصل عليه
### مفاتيح أساسية إجبارية
#### `DATABASE_URL`
- **وظيفته:** ربط Flask بقاعدة PostgreSQL
- **من أين تحصل عليه:**
  - من خدمة PostgreSQL على Render
  - افتح قاعدة البيانات → **Connections**
  - خذ **External Database URL** لو الاتصال من خارج الخدمة
  - أو **Internal Database URL** لو كله داخل Render
- **مهم:** لازم يكون نفس رابط قاعدة المشروع الحقيقي، مش قاعدة قديمة ولا قاعدة تجريبية

#### `SECRET_KEY`
- **وظيفته:** توقيع جلسات Flask والكوكيز
- **من أين تحصل عليه:**
  - لا يأتي جاهزاً من Render
  - أنت تنشئه بنفسك
- **قيمة مقترحة:** نص عشوائي طويل 32–64 حرف أو أكثر

#### `JWT_SECRET_KEY`
- **وظيفته:** توقيع توكنات JWT
- **من أين تحصل عليه:**
  - أنت تنشئه بنفسك
- **أفضل ممارسة:** يكون مختلفاً عن `SECRET_KEY`

### مفاتيح الدومين والربط
#### `FRONTEND_ORIGIN`
- **وظيفته:** تعريف دومين الواجهة المسموح له بطلبات CORS والكوكيز
- **من أين تحصل عليه:**
  - من رابط الـ Static Site لو عندك واجهة منفصلة
  - أو من نفس رابط الـ Web Service لو عندك خدمة واحدة
- **مثال:** `https://yamshati-1.onrender.com`

#### `BACKEND_ORIGIN`
- **وظيفته:** تعريف رابط الباك إند العام
- **من أين تحصل عليه:**
  - من رابط خدمة الـ Web Service في Render
- **مثال:** `https://yamshati.onrender.com`

#### `RENDER_EXTERNAL_URL`
- **وظيفته:** مرجع للرابط العام للخدمة الخلفية داخل الإعدادات
- **من أين تحصل عليه:**
  - نفس رابط الـ Web Service العام تقريباً
- **غالباً:** يكون نفس `BACKEND_ORIGIN`

#### `ALLOWED_ORIGINS`
- **وظيفته:** قائمة الـ origins المسموح لها الوصول للـ API وSocket.IO
- **من أين تحصل عليه:**
  - تكتبها أنت يدوياً
- **شكلها:** قيم مفصولة بفواصل وتشمل على الأقل:
  - رابط الواجهة
  - رابط الباك إند لو مختلف
  - localhost للتجربة
  - capacitor/ionic لو عندك موبايل WebView
- **مثال:**
  `https://yamshati-1.onrender.com,https://yamshati.onrender.com,http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:5000,http://localhost:5000,capacitor://localhost,ionic://localhost`

### مفاتيح الجلسة والكوكيز
#### `SESSION_COOKIE_SECURE`
- **وظيفته:** يجعل الكوكي يرسل فقط عبر HTTPS
- **القيمة الموصى بها على Render:** `1`

#### `SESSION_COOKIE_SAMESITE`
- **وظيفته:** التحكم في إرسال الكوكي بين المواقع
- **القيمة الموصى بها عند الفصل بين الفرونت والباك:** `None`
- **القيمة الممكنة لو نفس الدومين فقط:** `Lax`

#### `SESSION_DAYS`
- **وظيفته:** مدة بقاء الجلسة بالأيام
- **من أين تأتي:** تحددها أنت
- **قيمة مناسبة:** `30`

#### `JWT_EXPIRE_DAYS`
- **وظيفته:** مدة صلاحية JWT بالأيام
- **من أين تأتي:** تحددها أنت
- **قيمة مناسبة:** `30`

### مفاتيح البث المباشر LiveKit
#### `LIVEKIT_WS_URL`
- **وظيفته:** عنوان WebSocket الذي يتصل به العميل للبث والمكالمات
- **من أين تحصل عليه:**
  - من مشروعك في LiveKit Cloud أو من خادم LiveKit الذاتي
- **شكل شائع:** `wss://xxxx.livekit.cloud`

#### `LIVEKIT_URL`
- **وظيفته:** بديل/نسخة احتياطية لنفس عنوان LiveKit
- **من أين تحصل عليه:**
  - نفس مصدر `LIVEKIT_WS_URL`
- **ملاحظة:** يمكن جعل القيمتين متطابقتين

#### `LIVEKIT_API_KEY`
- **وظيفته:** إنشاء التوكنات الخاصة بالغرف والمكالمات
- **من أين تحصل عليه:**
  - من لوحة مشروع LiveKit → API Keys / Project Settings

#### `LIVEKIT_SECRET`
- **وظيفته:** توقيع توكنات LiveKit في الباك إند
- **من أين تحصل عليه:**
  - من نفس مكان `LIVEKIT_API_KEY`
- **تحذير:** لا يوضع أبداً في الفرونت إند

#### `LIVEKIT_PROJECT_ID` و `LIVEKIT_SIP_URI`
- **وظيفتهما:** إعدادات إضافية فقط لو أنت تستخدم خصائص معينة من LiveKit
- **من أين تحصل عليهما:** من لوحة LiveKit إن كنت فعلاً تحتاجهما
- **لو لا تستخدمهم:** اتركهم فارغين

### مفاتيح الإدارة
#### `ADMIN_EMAILS`
- **وظيفته:** جعل حسابات معينة Admin حسب الإيميل
- **من أين تأتي:** تكتبها أنت يدوياً مفصولة بفواصل

#### `ADMIN_USERNAMES`
- **وظيفته:** جعل حسابات معينة Admin حسب اسم المستخدم
- **من أين تأتي:** تكتبها أنت يدوياً مفصولة بفواصل

### مفاتيح الرفع والأداء
#### `MAX_CONTENT_LENGTH_MB`
- **وظيفته:** أقصى حجم رفع بالميجابايت
- **من أين تأتي:** تحددها أنت
- **مثال:** `25`

#### `DEFAULT_COIN_BALANCE`
- **وظيفته:** الرصيد الابتدائي للعملات داخل التطبيق
- **من أين تأتي:** تحددها أنت

#### `LOG_LEVEL`
- **وظيفته:** مستوى تسجيل اللوجات
- **القيم الشائعة:** `INFO`, `WARNING`, `ERROR`, `DEBUG`
- **الموصى به للإنتاج:** `INFO`

#### `PYTHON_VERSION`
- **وظيفته:** تثبيت نسخة بايثون في Render لو استخدمتها كمتغير
- **من أين تأتي:** أنت تحددها
- **الأفضل:** الاعتماد على `runtime.txt` بدل هذا المتغير إن أمكن

### مفاتيح البريد واستعادة كلمة المرور
#### `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- **وظيفتها:** إرسال أكواد إعادة التعيين عبر البريد
- **من أين تحصل عليها:** من مزود البريد الذي تستخدمه
  - Gmail SMTP أو Brevo أو Mailgun أو Resend SMTP ... إلخ

#### `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`
- **وظيفتهما:** البريد والاسم الظاهر للمُرسل
- **من أين تأتي:** من حساب الإرسال المعتمد عندك

#### `SMTP_USE_TLS`, `SMTP_USE_SSL`
- **وظيفتهما:** نوع الاتصال مع SMTP
- **من أين تأتي:** حسب مزود البريد
- **الأكثر شيوعاً:** `TLS=1` و `SSL=0`

### مفاتيح واتساب/رسائل Twilio
#### `TWILIO_ACCOUNT_SID`
- **من أين تحصل عليه:** من Twilio Console

#### `TWILIO_AUTH_TOKEN`
- **من أين تحصل عليه:** من Twilio Console

#### `TWILIO_WHATSAPP_FROM`
- **من أين تحصل عليه:** رقم/معرّف المرسل المعتمد في Twilio WhatsApp

#### `TWILIO_WHATSAPP_CONTENT_SID`
- **من أين تحصل عليه:** من قوالب المحتوى في Twilio لو تستخدم Content Templates
- **لو لا تحتاجه:** اتركه فارغاً

### مفاتيح Firebase للإشعارات
#### `FIREBASE_SERVICE_ACCOUNT_JSON`
- **وظيفته:** محتوى JSON الخاص بحساب الخدمة كاملاً كنص
- **من أين تحصل عليه:**
  - Firebase Console → Project Settings → Service Accounts → Generate New Private Key
- **ملاحظة:** ضعه كنص JSON كامل لو حبيت تحفظه في متغير بيئة

#### `FIREBASE_SERVICE_ACCOUNT_PATH`
- **وظيفته:** مسار ملف JSON داخل السيرفر
- **من أين تحصل عليه:** من ملف الخدمة إذا كنت سترفعه كملف داخل البيئة
- **يكفي واحد فقط:** إما JSON أو PATH

### مفاتيح Redis / Celery
#### `REDIS_URL`
- **وظيفته:** تشغيل الكاش/الصفوف الخلفية
- **من أين تحصل عليه:** من خدمة Redis على Render أو أي Redis خارجي

#### `CELERY_BROKER_URL`
#### `CELERY_RESULT_BACKEND`
- **وظيفتهما:** إعداد Celery worker
- **من أين تحصل عليهما:** غالباً نفس `REDIS_URL`
- **لو لا تستخدم worker الآن:** ممكن تأجلهم مؤقتاً، لكن بعض المهام الخلفية لن تعمل

## 5) ما الذي لا يجب وضعه في الفرونت إند
لا تضع في صفحات الويب أبداً:
- `DATABASE_URL`
- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `LIVEKIT_SECRET`
- `TWILIO_AUTH_TOKEN`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

الفرونت إند لا يحتاج المفاتيح السرية. الواجهة تحتاج فقط **الرابط الصحيح للـ API**.

## 6) قيم مقترحة لك حسب شكل النشر
### لو خدمة واحدة فقط
- `FRONTEND_ORIGIN=https://yamshati.onrender.com`
- `BACKEND_ORIGIN=https://yamshati.onrender.com`
- `RENDER_EXTERNAL_URL=https://yamshati.onrender.com`
- `ALLOWED_ORIGINS=https://yamshati.onrender.com,http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:5000,http://localhost:5000,capacitor://localhost,ionic://localhost`

### لو الواجهة منفصلة عن الباك إند
- Frontend static site: `https://yamshati-1.onrender.com`
- Backend web service: `https://yamshati.onrender.com`

استخدم:
- `FRONTEND_ORIGIN=https://yamshati-1.onrender.com`
- `BACKEND_ORIGIN=https://yamshati.onrender.com`
- `RENDER_EXTERNAL_URL=https://yamshati.onrender.com`
- `ALLOWED_ORIGINS=https://yamshati-1.onrender.com,https://yamshati.onrender.com,http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:5000,http://localhost:5000,capacitor://localhost,ionic://localhost`

## 7) لماذا البث لم يعمل عندك
البث والمكالمات يتوقفان لو واحد أو أكثر من هذه القيم مفقود:
- `LIVEKIT_WS_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_SECRET`
- أو لو رابط الفرونت إند لا يصل للباك إند أصلاً

يعني حتى لو الواجهة جميلة ومفتوحة، **عدم وجود مفاتيح LiveKit أو عدم صحة رابط الـ API** سيوقف البث.

## 8) اختبار سريع بعد إعادة النشر
1. افتح `/health`
2. تأكد أن `status = ok`
3. جرّب `/api/me`
4. سجّل دخول
5. جرّب إنشاء منشور
6. افتح `live.html`
7. لو الواجهة منفصلة، افتحها مرة بالشكل التالي:
   - `https://yamshati-1.onrender.com/?backend=https://yamshati.onrender.com`
8. بعدها جرّب إنشاء بث مباشر

## 9) تذكير مهم
- قاعدة البيانات عندك ظهرت شغالة من اللوج
- السرّيات تكون في Render للباك إند فقط
- الذي يحتاجه الفرونت إند هو الربط الصحيح مع الباك إند، وليس أسرار الخدمة
