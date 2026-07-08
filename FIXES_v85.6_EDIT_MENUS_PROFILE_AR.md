# إصلاحات v85.6 — قوائم التعديل + ثبات الملف الشخصي

## المشاكل التي تم علاجها

### 1) عند الضغط المستمر على رسالتي في الدردشة لا يظهر خيار «تعديل»
**السبب الجذري:**
- في `pages/Chat.jsx` كانت المقارنة `isMe={msg.sender === currentUser}` صارمة (case-sensitive) وتفشل عند:
  - اختلاف حالة الأحرف (مثلاً `Yasser` ضد `yasser`).
  - وجود رمز `@` قبل اسم المرسل في بعض الحمولات الواردة من السوكت.
  - استخدام الخادم لحقل `sender_username` بدلاً من `sender` أحياناً.
  - مسافات زائدة/غير مرئية في اسم المستخدم.
- في `MessageContextPopup.jsx` كان زر «تعديل» يظهر بدون التأكد من:
  - أن `onEdit` مُمرّرة فعلاً.
  - أن الرسالة غير محذوفة.
  - أن الرسالة نصية (لا وسائط) — لأن API التعديل يقبل النص فقط.

**الإصلاح:**
- `pages/Chat.jsx`: تطبيع كلا الطرفين قبل المقارنة + دعم `sender_username`/`author`/`from` + احترام علم `msg.isMe` إن كان معيّناً مسبقاً.
- `components/chat/MessageContextPopup.jsx`: شرط أدق لعرض زر «تعديل» (شريط الأوامر + القائمة الفرعية):
  ```jsx
  isMe && onEdit && !message?.deleted && !message?.media_url
    && !['image','video','audio','voice','file','media'].includes(String(message?.type||'').toLowerCase())
  ```

---

### 2) عند الضغط على «⋯» في المنشور لا يظهر خيار «تعديل المنشور»
**السبب الجذري:**
- في كل من `pages/FeedMobile.jsx` و `pages/FeedEnhanced.jsx` كانت قائمة «خيارات المنشور» للمالك تعرض «حذف المنشور» فقط + «بلاغ» — وزر التعديل مفقود تماماً من الـ JSX.
- كان زر «بلاغ» يظهر أيضاً لصاحب المنشور (لا معنى له).

**الإصلاح:**
- `pages/FeedMobile.jsx`:
  - استيراد `updatePost` من `api/posts.js`.
  - إضافة `handleMenuEditOwnPost` (يستخدم `window.prompt` مؤقتاً — نفس ما يستخدمه Feed المكتبي، ثم `PATCH /posts/:id` + إبطال الكاش).
  - إضافة زر «تعديل المنشور» في المودال قبل زر «حذف المنشور».
  - إخفاء زر «بلاغ» من قائمة المالك.
- `pages/FeedEnhanced.jsx`:
  - استيراد `updatePost as apiUpdatePost`.
  - إضافة `handleEditPost` مقيّد بـ `isOwnPost && canCallBackend`.
  - إضافة زر «تعديل المنشور» في popover الخيارات فوق زر «حذف المنشور».

---

### 3) تعديلات ملف الشخصي (الاسم/السيرة) لا تُحفظ — تعود بعد الخروج والعودة
**السبب الجذري:**
- `getProfileBundle(username)` في `api/users.js` مُخزّن في cache Smart بمدة 30 ثانية.
  - بعد `updateMyProfile(payload)` كانت `loadProfile()` تُستدعى لكنها تحصل على الاستجابة المخزّنة القديمة، فيرجع الاسم القديم إلى الواجهة.
- الخادم لا يحفظ دائماً حقل `full_name` بشكل ثابت (يوجد Bug معروف في الـ backend مذكور في الكود).
- كان الحفظ المحلي (`writeLocalProfileImages`) يحفظ الصور فقط، بلا نسخة احتياطية للاسم/السيرة/الشعار.

**الإصلاح:**
- `api/users.js`: قبول `options.forceRefresh` في `getProfileBundle` لتجاوز الكاش عند الطلب.
- `pages/Profile.jsx`:
  - إضافة `readLocalProfileText`/`writeLocalProfileText` لتخزين `{full_name, bio, activity_tagline}` تحت مفتاح `yamshat:profile:text:<username>`.
  - `handleSaveProfile` يكتب هذه القيم محلياً بعد الحفظ الناجح.
  - `handleSaveProfile` يستدعي `loadProfile({ forceRefresh: true })` لتجاوز كاش 30 ثانية.
  - `loadProfile()` يدمج القيم النصية المحلية فوق استجابة الخادم للمستخدم الحالي فقط — بحيث لو أرجع الخادم قيمة قديمة أو فارغة، تبقى تعديلات المستخدم ظاهرة.

## الملفات المعدّلة
- `frontend/src/pages/Chat.jsx`
- `frontend/src/pages/FeedMobile.jsx`
- `frontend/src/pages/FeedEnhanced.jsx`
- `frontend/src/pages/Profile.jsx`
- `frontend/src/components/chat/MessageContextPopup.jsx`
- `frontend/src/api/users.js`

## اختبار سريع بعد النشر
1. **الدردشة:** أرسل رسالة نصية، اضغط عليها مطوّلاً — يجب أن يظهر شريط: `رد` `نسخ` `تعديل` `حذف` `المزيد`.
2. **المنشور:** انشر منشوراً، اضغط «⋯» — يجب أن تظهر `تعديل المنشور` ثم `حذف المنشور` (بدون `بلاغ` لأنه منشورك).
3. **الملف الشخصي:** غيّر الاسم واحفظ، انتقل لصفحة أخرى وعُد — يجب أن يبقى الاسم الجديد.
