# 🔌 ربط واجهة الموبايل بالبيانات الحقيقية — يمشات

تمّ ربط الأزرار والبيانات في صفحة الموبايل الجديدة بـ backend الحقيقي. لم تعد البيانات تجريبية، وجميع الأزرار (إعجاب/تعليق/مشاركة/حفظ/إعادة نشر/نشر منشور) أصبحت تعمل على API الفعلي.

---

## ✅ ما تمّ ربطه

### 1) الأزرار الآن فعّالة بالكامل

| الزر | API endpoint | السلوك |
|---|---|---|
| ❤ إعجاب | `POST /posts/:id/like` | Optimistic UI + قلب اللون للبنفسجي/الوردي + تحديث العدّاد فوراً |
| 💬 تعليق | `GET /comments/:id/comments` + `POST /posts/:id/comment` | يفتح بوتوم شيت يعرض التعليقات + حقل إرسال |
| 🔁 إعادة نشر | `POST /posts/:id/share` (platform=repost) | يلوّن الأيقونة بالأخضر + يزيد العدّاد |
| 🔖 حفظ | `POST /posts/:id/save` | يلوّن الأيقونة بالبنفسجي + يحفظ في المحفوظات |
| 📤 مشاركة | `navigator.share` ⇒ fallback نسخ الرابط + `POST /posts/:id/share` | يفتح قائمة المشاركة الأصلية + يسجل المشاركة |
| ⋯ المزيد | نسخ الرابط + حذف (إن كان منشورك) | clipboard.writeText + `DELETE /posts/:id` |
| ✏️ بماذا تفكر؟ | يفتح `MobileComposeModal` | — |
| ➕ زر + المركزي | يفتح نفس المودال (عبر CustomEvent) | — |

### 2) إنشاء منشور حقيقي

عند الضغط على شريط "بماذا تفكر؟" أو زرّ + المركزي، يُفتح **`MobileComposeModal`** الذي:
- يستدعي `POST /upload/` لرفع الصور/الفيديو فوراً عند اختيارها
- يستدعي `POST /posts/` (دالة `createPost`) لنشر المحتوى
- يستدعي `queryClient.invalidateQueries(['feed-data'])` ليعيد تحميل الفيد مباشرة بعد النشر
- يدعم: نص ≤ 2000 حرف + صورة/فيديو + إيموجي + معاينة + شريط رفع

### 3) البيانات

`FeedMobile` يستخدم نفس `useSmartFeed` المستخدَم في الديسكتوب، الذي يجلب البيانات من `GET /posts/` مع cache 10 دقائق + polling 30 ثانية. كل بطاقة الآن تستقبل `rawId` من backend وتمرره لـ API.

عند عدم وجود منشورات (أول استخدام أو fallback)، يظهر **منشور ترحيبي واحد فقط** بدلاً من 3 منشورات تجريبية. هذا المنشور لا يدعم الإعجاب/التعليق (لأنه ليس له `rawId` حقيقي).

### 4) التعارض مع التصميم القديم — تمّ حلّه

كانت `pages/FeedEnhanced.jsx` تستخدم **`components/layout/MainLayout.jsx`** (القديم) الذي يضيف `Topbar` + `MobileDock` قديمين فوق `MobileLayout` الجديد، فيظهر شريطان وقائمتان متراكبتان.

**الإصلاح:**
- الموبايل: يستخدم الآن `layouts/MainLayout.jsx` ⇒ `MobileLayout` (TopBar + BottomNav الجديدين فقط).
- الديسكتوب: يستخدم `MainLayoutDesktop` (alias لـ `components/layout/MainLayout.jsx` القديم) — تجربة الديسكتوب لم تتأثر.
- داخل `FeedDesktopInner`: أُزيل التغليف المضاعف بـ `<MainLayout>` (صار `<>` فقط) لأن التغليف يتم من الخارج.

---

## 📁 الملفات المضافة

| الملف | الدور |
|---|---|
| `src/components/mobile/MobileComposeModal.jsx` | مودال إنشاء منشور حقيقي (نص + ميديا + رفع + نشر) |
| `src/components/mobile/MobileCommentsSheet.jsx` | بوتوم شيت لعرض/إضافة التعليقات |

## 📝 الملفات المحدّثة

| الملف | التغيير |
|---|---|
| `src/pages/FeedMobile.jsx` | ربط كل الـ handlers (like/save/share/repost/comment/more/delete) بـ backend API + optimistic UI + استماع لحدث `yamshat:open-composer` + معالجة `?compose=1` في URL |
| `src/components/mobile/MobilePostCard.jsx` | إضافة `onSave` + زر الحفظ + حالات نشطة `is-active` لكل الأزرار + تمرير `post` للـ handlers |
| `src/components/mobile/MobileComposer.jsx` | بدلاً من التنقل لـ `/?compose=1` → يطلق `yamshat:open-composer` event ليفتح المودال داخل الصفحة |
| `src/components/mobile/BottomNav.jsx` | زر + المركزي يطلق `yamshat:open-composer` عند الصفحة الرئيسية بدل التنقل |
| `src/pages/FeedEnhanced.jsx` | الموبايل ⇒ `layouts/MainLayout` الجديد. الديسكتوب ⇒ `MainLayoutDesktop` (alias). إزالة التغليف المضاعف داخل `FeedDesktopInner`. |
| `src/styles/mobile-yamshat-redesign.css` | +200 سطر: أنماط `ym-modal`, `ym-sheet`, `ym-comment-*`, `ym-action.save.is-active` |
| `src/main.jsx` | `BUILD_ID = yamshat-pwa-mobile-wired-20260531-r6` (لضمان hard refresh للمستخدمين) |

## 🧹 ما لم يُحذف ولماذا

ملفات `components/layout/MainLayout.jsx`, `Topbar.jsx`, `MobileDock.jsx` **لم تُحذف** لأنها:
- تُستخدم في صفحات أخرى: `Chat.jsx`, `Dashboard.jsx`, `Groups.jsx`, `Inbox.jsx`, `Live.jsx`, `LivePage.jsx` (للديسكتوب وللصفحات الأخرى).
- حذفها سيُحطّم بناء التطبيق.

التعارض على الموبايل في صفحة الفيد فقط — وقد حُلّ عبر تحويل `FeedEnhanced` لاستخدام `layouts/MainLayout` الجديد للموبايل.

---

## 🧪 الاختبار اليدوي

1. افتح المتصفح على وضع الموبايل (DevTools → device toolbar) أو هاتف حقيقي.
2. سجّل الدخول.
3. اضغط على شريط "بماذا تفكر؟" → يجب أن يفتح المودال.
4. اكتب نصاً + اختر صورة → اضغط نشر → يجب أن يختفي المودال وتظهر toast نجاح وتتحدث الخلاصة.
5. على أي منشور: اضغط ❤ → يلوّن فوراً + يزداد العدّاد.
6. اضغط 💬 → يفتح البوتوم شيت بالتعليقات + اكتب وأرسل.
7. اضغط 🔖 → يلوّن الأيقونة (محفوظ).
8. اضغط 📤 → تفتح قائمة المشاركة الأصلية للنظام أو يُنسخ الرابط.
9. اضغط ⋯ على منشورك أنت → يُنسخ الرابط + يسأل عن الحذف.
10. اضغط زر + المركزي السفلي → يفتح المودال.

---

نسخة البناء: `yamshat-pwa-mobile-wired-20260531-r6`
تاريخ: 2026-05-31
