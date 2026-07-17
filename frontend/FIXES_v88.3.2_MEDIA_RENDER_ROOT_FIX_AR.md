# v88.3.2 — إصلاح جذري لعرض القصص والريلز عبر المشتركين (MEDIA RENDER ROOT FIX)

## الأعراض قبل الإصلاح
- **القصص تظهر مكسورة للمشتركين**: الصورة/الفيديو لا يُحمَّل عند شخص آخر رغم أن الناشر يراه أحياناً.
- **الريلز لا يظهر بعد رفعه**: لا في الشريط الرأسي، ولا في الملف الشخصي، رغم أن الرفع «ينجح» ظاهرياً بنسبة 100%.

## السبب الجذري (Root Cause)

يمكن تلخيصه في ثلاث نقاط مترابطة:

1. **مسار الوسائط في DB كان نسبياً `/uploads/xxx`**
   - `save_upload` كان يُرجِع `media_url: "/uploads/abc.mp4"` (نسبي).
   - عندما تُخدَم الواجهة من نفس Origin الخاص بالباك‑إند فقد يعمل مؤقتاً.
   - لكن على Render (وأي حاوية Docker) الملف يُكتب في `filesystem` غير دائم — أي إعادة نشر أو إعادة تشغيل تُمحيه فوراً → كل القصص والريلز القديمة تصبح روابط 404.

2. **فشل Cloudinary صامت (Silent failure)**
   - `_apply_remote_storage` كان يبتلع أي استثناء دون log صريح.
   - عندما يفشل الرفع السحابي (Timeout، API limit، مفاتيح غير مضبوطة على Render) يبقى الرابط محلياً بلا أي تحذير → لن تعرف أبداً لماذا القصص تتكسر.

3. **`normalize_media_url` كان ينتج مسارات نسبية عند غياب `BACKEND_ORIGIN`**
   - في بعض النشرات على Render لا تُضبَط `BACKEND_ORIGIN` بشكل تلقائي → يعود المسار `/uploads/xxx` كما هو → الواجهة تحاول جلبه من Origin الفرونت‑إند (وليس الباك‑إند) → 404 للمشتركين حتى لو كان الملف موجوداً في الخادم.

النتيجة الطردية: **الناشر يرى الوسائط في متصفحه لأنها في ذاكرة blob:/الجلسة الحالية، لكن المشترك الآخر يفتح فيرى صفحة فارغة أو أيقونة مكسورة.**

## الإصلاحات المطبقة

### 1. `backend/app/core/media_urls.py` — إعادة كتابة كاملة
- الآن ترجع **دائماً** رابطاً مطلقاً `https://…/uploads/xxx` عند توفر `CDN_BASE_URL` أو `BACKEND_ORIGIN` أو `RENDER_EXTERNAL_URL`.
- تتعرف على روابط CDN معروفة (Cloudinary، ImageKit، BunnyCDN، R2، S3، DigitalOcean Spaces، Cloudflare) وتُبقيها كما هي.
- تُعيد كتابة الروابط القديمة من `yamshat.onrender.com`, `yamshat-backend.onrender.com` تلقائياً إلى Origin الحالي.
- تُصلح المسارات المشوّهة `api/uploads/…` → `/uploads/…`.

### 2. `backend/app/api/routes/upload.py` — إجبار الرابط المطلق
- دالة `_finalize_upload_payload` تمرّر الرابط عبر `normalize_media_url` مباشرةً → لا مزيد من مسارات نسبية في الاستجابة.
- دالة `_apply_remote_storage` الآن **تسجّل الأخطاء صراحةً في logs** بدلاً من الفشل الصامت → أي فشل في Cloudinary يظهر فوراً في `render logs` مع اسم الملف والاستثناء.
- إضافة `local_path` منفصلاً في الاستجابة للحاجة الداخلية، مع `media_url` كرابط مطلق للاستهلاك.

### 3. `backend/app/api/routes/stories.py` — تطبيع media_url قبل الحفظ
- `add_story` يمرّر `media_url` عبر `normalize_media_url` قبل حفظه في DB.
- النتيجة: كل قصة جديدة تُحفظ برابط مطلق دائم يعمل لجميع المشتركين.

### 4. `backend/app/services/story_db_service.py` — تطبيع عند القراءة أيضاً
- `serialize_story` يُطبّع `media_url` عند الإخراج للاستجابة → حتى القصص القديمة المُخزَّنة بمسار نسبي في DB تُعرَض بروابط مطلقة صحيحة **دون الحاجة إلى ترحيل قاعدة البيانات**.

### 5. `backend/app/api/routes/reels.py` — كان يعمل جزئياً
- `create_reel` كان يمرر `video_url` عبر `normalize_media_url` (وهذا صحيح)، والآن مع `media_urls.py` المُصلَح أصبح ينتج رابطاً مطلقاً دائماً.
- `_serialize_reel` يستدعي `normalize_media_url` عند كل قراءة → الريلز القديمة تعمل أيضاً.

## متطلبات النشر على Render

بعد النشر، **يجب** ضبط متغيرات البيئة التالية على خدمة الباك‑إند لضمان عمل الحل:

### الحد الأدنى (بدون Cloudinary — يعتمد على Persistent Disk):
```
BACKEND_ORIGIN=https://yamshat-backend.onrender.com   # أو Render External URL
PERSISTENT_DISK_PATH=/var/data/uploads                 # ثبِّت Persistent Disk هنا
```
**⚠️ بدون Persistent Disk** ستُمحى كل الوسائط بعد أول إعادة نشر — لكن الروابط المطلقة ستظل صحيحة (فقط الملف يختفي). لهذا فإن Cloudinary أفضل.

### الأفضل (Cloudinary — لا داعي لقرص دائم):
```
BACKEND_ORIGIN=https://yamshat-backend.onrender.com
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
CLOUDINARY_FOLDER=yamshat
```
مع Cloudinary مضبوط، كل قصة/ريل جديد يُرفَع مباشرة إلى Cloudinary ويحصل على رابط `https://res.cloudinary.com/...` دائم يعمل حتى لو أُعيد نشر الباك‑إند 1000 مرة.

## كيف تتحقق من نجاح الإصلاح

1. **افتح `render logs` بعد النشر** — لا يجب أن ترى الآن `[upload] Cloudinary upload FAILED`. إن رأيتها فالمفاتيح خطأ.
2. **افتح قصة جديدة من حساب A**، ثم افتحها من حساب B على متصفح آخر → يجب أن تظهر الوسائط.
3. **افحص Network tab في متصفح B** أثناء عرض القصة → طلب الصورة/الفيديو يجب أن يذهب إلى `https://yamshat-backend.onrender.com/uploads/…` أو `https://res.cloudinary.com/…`، وليس إلى Origin الواجهة.
4. **ارفع ريل جديد** ثم ارجع إلى `/reels` → يجب أن يظهر في الأعلى فوراً.
