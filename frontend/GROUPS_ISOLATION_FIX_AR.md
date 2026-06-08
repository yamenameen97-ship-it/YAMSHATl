# 🩹 إصلاح: عزل شات المجموعات (Groups Chat Isolation)

## 🐞 المشكلة المُبلَّغ عنها
> «لما أنشئ مجموعة جديدة وأفتح الشات بيفتح لي شات مجموعة سابقة — كأن كل المجموعات في شات واحد، ما في استقلالية.»

## 🔎 السبب الجذري
الباك اند سليم ويعزل المجموعات بالكامل (`/api/groups/{group_id}/messages` يستخدم
متجرًا منفصلًا في `group_store_enhanced.py`). المشكلة كانت **بالكامل في الفرونت اند**:

1. **عدم إعادة Mount للمكوّن عند تغيير `groupId`** — كل مسارات
   `/groups/:groupId/chat` تشترك في نفس instance من `GroupChat.jsx`،
   لذا الـ React state (الرسائل، معلومات المجموعة) كان يبقى محتفظًا
   ببيانات المجموعة السابقة حتى يكتمل fetch جديد، فيظهر للمستخدم الشات القديم.
2. **استخدام endpoints الشات العامة** (`/messages?receiver=group:<id>` +
   `/send_message`) بدلًا من endpoints المجموعات المخصّصة
   (`/groups/{group_id}/messages`). هذا كان يخلط رسائل المجموعات
   في جدول الرسائل العام بدل مخزن المجموعات.
3. **عدم تنظيف غرفة السوكيت** عند الانتقال بين المجموعات،
   مما يُبقي المستخدم مشتركًا في رسائل المجموعة القديمة.
4. **`CreateGroup` كان يعود لقائمة المجموعات** بعد الإنشاء بدلاً من فتح
   شات المجموعة الجديدة مباشرة، فيظنّ المستخدم أن لا شيء حدث.

## ✅ ما تم إصلاحه

### 1) `src/App.jsx`
- إضافة wrapper `GroupChatPage` يستخدم `key={`group-chat-${groupId}`}`
  لإجبار React على Unmount/Remount كامل للمكوّن عند تغيير المجموعة.

### 2) `src/pages/GroupChat.jsx` (إعادة كتابة)
- **استخدام endpoints المجموعات المخصّصة** فقط:
  `getGroupMessages`، `sendGroupMessage`، `uploadGroupMedia`
  (مفصولة عن chat router العام).
- **مسح state فوريّ** (`setMessages([])`، `setGroupInfo(null)`)
  بمجرّد تغيّر `groupId`.
- **حفظ `groupId` الحالي في `ref`** ليتحقق منه socket handler.
- **فلتر دفاعي ثلاثي** على رسائل السوكيت:
  1. فحص `payload.group_id` يطابق `groupId` الحالي.
  2. fallback لـ `payload.receiver === 'group:<id>'`.
  3. فلتر إضافي في الـ render نفسه قبل عرض كل رسالة.
- **مغادرة غرفة السوكيت السابقة** (`leave_group`) في cleanup ضمن
  `useEffect`، قبل الانضمام لغرفة جديدة.

### 3) `src/pages/CreateGroup.jsx`
- بعد إنشاء المجموعة بنجاح:
  - استخراج `id` من response الباك اند.
  - الانتقال **مباشرة** إلى `/groups/<id>/chat` (مع `replace: true`)،
    لا إلى `/groups`.
  - fallback آمن لو لم يصل `id`.

## 🔗 تأكيد ربط الباك اند (لا تغييرات مطلوبة)

| الوظيفة                          | الـ Endpoint                              | المتجر                       |
|----------------------------------|-------------------------------------------|------------------------------|
| إنشاء مجموعة                     | `POST /api/groups`                        | `group_store_enhanced`       |
| جلب قائمة المجموعات              | `GET /api/groups`                         | `group_store_enhanced`       |
| تفاصيل مجموعة                    | `GET /api/groups/{id}`                    | `group_store_enhanced`       |
| رسائل مجموعة                     | `GET /api/groups/{id}/messages`           | `group_store_enhanced` (منفصل لكل مجموعة) |
| إرسال رسالة في مجموعة            | `POST /api/groups/{id}/messages`          | `group_store_enhanced`       |
| الإعدادات / الصلاحيات / الأعضاء  | `*/groups/{id}/...`                       | `group_store_enhanced`       |

كل المسارات مربوطة عبر `app/main.py`:
`fastapi_app.include_router(groups.router, prefix=settings.API_PREFIX, ...)`

## 🧪 خطوات الاختبار
1. أنشئ المجموعة A، أرسل فيها رسالة "AAA".
2. ارجع، أنشئ المجموعة B (يجب أن تفتح شات B تلقائيًا فارغًا).
3. أرسل في B رسالة "BBB".
4. ارجع وافتح A — يجب أن ترى "AAA" فقط، بدون "BBB".
5. افتح B — يجب أن ترى "BBB" فقط، بدون "AAA".

## 📦 الملفات المُعدَّلة
- `frontend/src/App.jsx`
- `frontend/src/pages/GroupChat.jsx`
- `frontend/src/pages/CreateGroup.jsx`
- `frontend/GROUPS_ISOLATION_FIX_AR.md` (هذا الملف — جديد)

> **لم يتم تشغيل `npm install`** ولا حذف `node_modules` (طلب المستخدم).
