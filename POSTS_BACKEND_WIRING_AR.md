# استكمال ربط صفحات المنشورات بالـ Backend

تاريخ التعديل: 2026-06-05

## ملخص التغييرات

تم استكمال ربط الواجهة الأمامية (Frontend) بـ Backend الخاص بالمنشورات في الصفحة الرئيسية للديسكتوب (`FeedEnhanced.jsx`).

كانت الواجهة المحمولة (`FeedMobile.jsx`) و `PostCard.jsx` المتقدم مربوطين بشكل صحيح، لكن نسخة `PostCard` المضمنة داخل `FeedEnhanced.jsx` (تصميم الديسكتوب الجديد) كانت تستخدم **handlers محلية فقط** لا تتصل بـ backend (إعجاب، حفظ، مشاركة، تعليق، حذف).

## الملف المعدّل
- `frontend/src/pages/FeedEnhanced.jsx`

## ما تم ربطه بـ Backend

### 1) الإعجاب (Like) — `POST /api/posts/{post_id}/like`
- استدعاء `likePost(post.rawId)` من `api/posts.js`
- تحديث متفائل فوري للأيقونة والعدّاد
- تراجع تلقائي عند فشل الطلب + Toast خطأ
- يحدّث `is_liked` و `likes_count` من رد الـ backend
- يُبطل كاش `feed-data` لإعادة المزامنة

### 2) الحفظ (Save) — `POST /api/posts/{post_id}/save`
- استدعاء `savePost(post.rawId)`
- تحديث متفائل + تراجع
- يقرأ `is_saved` من الرد ويزامن الحالة

### 3) المشاركة (Share) — `POST /api/posts/{post_id}/share`
- يفتح Web Share API أو ينسخ الرابط أولاً
- ثم يسجّل المشاركة في backend مع `platform = 'native' | 'copy'`
- يحدّث `share_count` من الرد

### 4) التعليقات (Comments)
- **عرض**: `GET /api/comments/{post_id}/comments` عند فتح لوحة التعليقات لأول مرة
- **إضافة**: `POST /api/posts/{post_id}/comment` مع تحديث متفائل + تراجع
- يدعم تعليقات في انتظار التأكيد (`pending`) مع شفافية بصرية

### 5) حذف المنشور — `DELETE /api/posts/{post_id}`
- يظهر فقط لمالك المنشور (المستخدم الحالي)
- تأكيد قبل الحذف
- إزالة المنشور من الـ DOM فور النجاح

### 6) تحسينات على `buildFeedPosts` adapter
- يحفظ `rawId` (المعرف الأصلي من backend) للتمييز عن المنشورات الترحيبية
- يحفظ `userId`, `rawUsername`, `isLive`, `liveStreamId`
- يحفظ `isLiked`, `isSaved` لتهيئة الحالة من الـ backend

## ميزات الاستقرار

1. **`canCallBackend`**: يمنع استدعاءات backend للمنشورات الترحيبية أو منشورات البث المباشر التي لا تملك `rawId` صالحاً
2. **حالة `busyAction`**: تمنع الضغط المتكرر السريع على نفس الزر (debounce)
3. **التراجع التلقائي**: عند فشل أي طلب، يتم إعادة الحالة لما كانت عليه
4. **رسائل Toast**: لكل عملية نجاح/فشل
5. **`isDeleted`**: يخفي البطاقة فوراً بعد الحذف الناجح

## ملاحظات

- استُخدمت أسماء مستعارة (`apiLikePost`, `apiSavePost`, ...) لتجنّب التعارض مع متغيرات محلية محتملة.
- جميع الـ endpoints متوافقة مع ما هو موجود في `backend/app/api/routes/posts.py` و `backend/app/api/routes/comments.py`.
- لا حاجة لأي تعديل على Backend — كل النقاط النهائية موجودة بالفعل.

## نقاط النهاية (Endpoints) المستخدمة

| العملية | الطريقة | المسار |
|---|---|---|
| جلب المنشورات | GET | `/api/posts/` |
| إنشاء منشور | POST | `/api/posts/` |
| إعجاب | POST | `/api/posts/{id}/like` |
| حفظ | POST | `/api/posts/{id}/save` |
| مشاركة | POST | `/api/posts/{id}/share` |
| تعليق | POST | `/api/posts/{id}/comment` |
| قراءة التعليقات | GET | `/api/comments/{id}/comments` |
| حذف منشور | DELETE | `/api/posts/{id}` |
