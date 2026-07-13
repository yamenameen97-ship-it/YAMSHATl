# 🛠️ إصلاحات v87.8 — التعليقات لا تُخزَّن ظاهرياً + زر "تعديل المنشور" مفقود

## 🐛 المشكلة #1: التعليقات تختفي بعد إغلاق وإعادة فتح صحيفة التعليقات

### 🔬 السبب الجذري (Root Cause)
في `backend/app/api/routes/comments.py` كان الـ endpoint `GET /api/comments/{post_id}/comments` يستدعي دالة `rank_comments` **async** من `app.services.ai_service` بشكل **synchronous** (بدون `await`):

```python
payload['items'] = rank_comments(items, current_user)  # ⚠️ coroutine غير مُنتظَر
```

نتيجة ذلك:
1. `payload['items']` يصبح كائن **coroutine** بدلاً من قائمة.
2. FastAPI عند محاولة تحويل الاستجابة إلى JSON يرمي استثناء لأن الـ coroutine **غير قابل للتحويل**.
3. الاستثناء يُلتقط في `except Exception` الخارجي و يُعاد `empty_payload = {'items': []}`.
4. النتيجة النهائية: التعليقات **مخزَّنة فعلاً في قاعدة البيانات** لكن الـ API يُرجع دائماً قائمة فارغة، فتظهر رسالة "لا توجد تعليقات بعد" رغم أن `comments_count = 1`.

### ✅ الإصلاح
- إزالة استيراد `rank_comments` من `ai_service` بالكامل من الـ route (لأنه async ولا يمكن استخدامه في route sync).
- الاعتماد على الترتيب الداخلي في `get_comments` service (يدعم `newest` / `oldest` / `popular`).
- تحصين إنشاء التعليق: `detect_spam` يُرجع dict (dict غير فارغ = truthy دائماً) — الآن نتحقق من `spam_result.get('is_spam')` بدل الـ dict كاملاً، ونتعامل مع أي خطأ بصمت بدل رفض التعليق خطأً.

### 🎁 إصلاح إضافي على الواجهة
- في `MobileCommentsSheet.jsx` بعد إرسال التعليق بنجاح، **نعيد جلب القائمة من الخادم فوراً** بدل الاكتفاء بالإضافة المحلية. هكذا يعرف المستخدم على الفور إن كان التعليق قد خُزِّن فعلاً أم لا.

## 🐛 المشكلة #2: زر "تعديل المنشور" لا يظهر في قائمة الخيارات

### 🔬 السبب الجذري
في `pages/FeedMobile.jsx`، دالة `isOwnMoreMenuPost` كانت تعتمد **حصراً** على مقارنة `session.username` مع `moreMenuPost.username`. المشكلة:
- `session.username` قد يكون `undefined` أو غير مُرطَّب بشكل صحيح في بعض مسارات إعادة تحميل الجلسة (خصوصاً بعد `refreshSession` من `sessionManager`).
- عند مقارنة `undefined === 'yasryameen21'` النتيجة `false` → لا يظهر زر التعديل.
- كائن الـ post من الـ backend يتضمن `user_id` (رقم) لكن `normalizePost` لم يكن يحتفظ به → استحال الاعتماد عليه.

### ✅ الإصلاح
1. **`normalizePost`**: نحتفظ الآن بحقل `userId` من `p.user_id ?? p.author_id ?? p.userId`.
2. **`isOwnMoreMenuPost`**: مطابقة ذات طبقتين:
   - **الأولوية:** مطابقة رقمية بين `session.id` و `post.userId` (أقوى وأأمن — لا يتأثر بمشاكل الترطيب).
   - **الاحتياطي:** مطابقة `username` كما كان سابقاً (لتغطية الحالات القديمة إن وُجدت).
3. دعم عدة أسماء ممكنة للحقل في الـ session: `id`, `user_id`, `userId`, و `username`, `user`.

## 📁 الملفات المعدَّلة
| الملف | التغيير |
|-------|---------|
| `backend/app/api/routes/comments.py` | إزالة استدعاء `rank_comments` async من route sync + تحصين `detect_spam` |
| `frontend/src/pages/FeedMobile.jsx` | حفظ `userId` في `normalizePost` + مطابقة owner ذات طبقتين |
| `frontend/src/components/mobile/MobileCommentsSheet.jsx` | إعادة جلب التعليقات من الخادم فور الإرسال |

## 🧪 كيفية التحقق
### التعليقات:
1. افتح منشوراً واضغط على أيقونة التعليق.
2. اكتب تعليقاً واضغط إرسال — يظهر التعليق فوراً.
3. أغلق الصحيفة (`✕`) ثم اضغط أيقونة التعليق مرة أخرى.
4. **يجب أن يظهر تعليقك** بدلاً من رسالة "لا توجد تعليقات بعد".

### زر التعديل:
1. من الصفحة الرئيسية على الجوّال، افتح قائمة الخيارات (⋮) لمنشور **أنت نشرته**.
2. **يجب أن ترى**: متابعة | كتم | حظر | **تعديل المنشور** | حذف المنشور | بلاغ.
3. للمنشورات التي لم تنشرها: متابعة | كتم | حظر | بلاغ (بدون تعديل/حذف — سلوك صحيح).

