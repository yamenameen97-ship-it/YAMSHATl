# 🔧 التحديث v85.0 — تكامل الملف الشخصي (Profile Completeness)

## 📋 ملخّص الفحص

بعد مراجعة صفحة الملف الشخصي (`ProfilePage.jsx` + `ProfileHeader.jsx` + `ProfileSettingsPage.jsx` + `profileFeatureMatrix.js`) ومقارنتها بالملفات الشخصية في منصات مثل **Instagram / Facebook / TikTok / WhatsApp**، تم رصد **خمس نواقص جوهرية** — وتم إصلاحها جميعاً في هذه النسخة.

---

## ❌ النواقص الخمس المكتشفة (وتم إصلاحها ✅)

### 1️⃣ تبويب "الوسائط المُعلَّمة" (Tagged Posts) — كان مفقوداً في الواجهة
- **الحالة السابقة:** `taggedPosts: true` مذكور في `profileFeatureMatrix.js` لكن **لا يوجد تبويب** في `ProfileHeader.jsx` ولا في `ProfilePage.jsx`.
- **الحالة الحالية ✅:**
  - أُضيف تبويب `tagged` مع أيقونة 🏷️ في شريط التبويبات.
  - أُضيف مفتاح `TABS.TAGGED = 'tagged'` في `ProfilePage.jsx` مع قراءة `profile.tagged_posts`.
  - أُضيفت حالة فارغة (empty hint) لطيفة تشرح للمستخدم آلية عمل التبويب.

### 2️⃣ روابط السيرة الذاتية (Bio Links) — كانت غير مرئية
- **الحالة السابقة:** `bioLinks: true` في feature matrix لكن لا يوجد أي عرض للروابط في البروفايل، مع أن هذه ميزة أساسية في Instagram/TikTok/Twitter.
- **الحالة الحالية ✅:**
  - أُضيف مكوّن `<BioLinks />` أسفل السيرة الذاتية مباشرة.
  - يقرأ من ثلاثة مصادر: `profile.user.profile.bio_links`، `profile.user.profile.links`، `profile.user.links`.
  - **اكتشاف ذكي للأيقونة**: Instagram / X / TikTok / YouTube / Facebook / LinkedIn / GitHub / Telegram / WhatsApp.
  - عرض على شكل شارات دائرية قابلة للنقر (`target="_blank"` + `rel="noopener noreferrer nofollow"`).
  - حد أعلى ذكي 5 روابط + قص النص الطويل بـ ellipsis.

### 3️⃣ زر المشاركة + قائمة "المزيد" (⋯) — كان مفقوداً كلياً
- **الحالة السابقة:** لا يوجد أي زر مشاركة، ولا قائمة `Block / Report / Copy Link` — وهي ميزة معيارية في **كل** منصة اجتماعية.
- **الحالة الحالية ✅:**
  - **زر مشاركة** جديد بجانب أزرار المتابعة/التعديل يستخدم `navigator.share` عندما يكون متاحاً، وإلا ينسخ رابط البروفايل.
  - **قائمة (⋯)** منسدلة تحتوي:
    - 🔗 نسخ رابط الملف
    - 📤 مشاركة الملف
    - 🚫 حظر @username (تظهر فقط في ملفات الآخرين)
    - 🚩 إبلاغ (تظهر فقط في ملفات الآخرين)
  - **Toast** أنيق يظهر عند نسخ الرابط: "✅ تم نسخ رابط الملف".
  - القائمة تُغلق تلقائياً عند النقر خارجها.
  - Props جديدة: `onBlockUser(username)` و `onReportUser(username)`.

### 4️⃣ القصص المميزة (Story Highlights) — كانت غائبة
- **الحالة السابقة:** لا يوجد قسم Highlights أسفل معلومات البروفايل، وهي **الميزة الأشهر في Instagram**.
- **الحالة الحالية ✅:**
  - قسم `Story Highlights` جديد بين صف الإجراءات وصف التبويبات.
  - شريط أفقي قابل للتمرير مع scroll snap ودون ظهور scrollbar.
  - كل عنصر يظهر بحلقة تدرّج ملوّنة (نفس هوية Instagram) + صورة الغلاف + عنوان.
  - زر ➕ "جديد" يظهر في ملفك فقط لإضافة قصة مميزة.
  - يقرأ من: `profile.user.profile.highlights` أو `profile.highlights`.
  - Prop جديد: `onAddHighlight()`.

### 5️⃣ مؤشر حالة الاتصال (Online Status) — كان مفقوداً
- **الحالة السابقة:** لا مؤشر بصري إذا كان المستخدم متصلاً الآن (كما في WhatsApp/Facebook/Messenger).
- **الحالة الحالية ✅:**
  - نقطة خضراء نابضة على الصورة الشخصية (`.ymp-online-dot.is-online` مع `@keyframes ymp-online-pulse`).
  - نقطة رمادية للمستخدمين غير المتصلين.
  - نص "متصل الآن" أخضر تحت الاسم عندما يكون المستخدم متصلاً.
  - نص "آخر ظهور: منذ X دقيقة/ساعة/يوم" للمستخدمين غير المتصلين.
  - يقرأ من: `user.is_online` / `user.online` / `user.last_seen` / `user.last_active`.
  - **مُحترم للخصوصية**: إذا لم يوفّر الـ backend الحقل، لا يظهر شيء.

---

## 📁 الملفات المُعدَّلة

| الملف | التغيير |
|-------|---------|
| `frontend/src/components/profile/ProfileHeader.jsx` | إعادة كتابة كاملة مع الميزات الخمس (+ CSS كامل) |
| `frontend/src/pages/profile/ProfilePage.jsx` | إضافة تبويب `TAGGED` + قراءة `tagged_posts` + تسمية التبويب |
| `FIXES_v85.0_PROFILE_COMPLETENESS_AR.md` | هذا الملف الجديد |

---

## 🎨 ملاحظات التصميم

- جميع الإضافات محمية بـ **null-checks** ولا تكسر إذا كان الـ backend لا يوفّر الحقول الجديدة.
- الاحتفاظ الكامل بالهوية البصرية للمشروع (`Noto Sans Arabic`، `Tajawal`، dir="rtl"، ألوان الأزرق `#1877F2` والبنفسجي `#7C3AED`).
- استجابة كاملة (Responsive) عبر media queries عند `480px` و `360px`.
- إمكانية وصول (a11y): `role`, `aria-label`, `aria-expanded`, `role="menu"`, `role="menuitem"`, `role="status"`.

---

## 🔌 ما يحتاجه الـ Backend (اختياري — لا يكسر شيئاً إن لم يُضاف)

```jsonc
// GET /api/users/{username}/profile — الحقول الجديدة الاختيارية:
{
  "user": {
    "is_online": true,               // (5) حالة الاتصال
    "last_seen": "2026-07-07T02:00Z",// (5) آخر ظهور
    "profile": {
      "bio_links": [                 // (2) روابط السيرة
        { "url": "https://instagram.com/handle", "title": "Instagram" }
      ],
      "highlights": [                // (4) القصص المميزة
        { "id": 1, "title": "سفر", "cover": "https://.../h1.jpg" }
      ]
    }
  },
  "tagged_posts": [ /* ... */ ]      // (1) المنشورات المُعلَّمة
}
```

---

## ✅ الخلاصة

بعد التحديث، أصبح الملف الشخصي في `yam-shat` يحتوي على **كل الميزات القياسية** الموجودة في Instagram / Facebook / TikTok / WhatsApp Profile:
- ✅ Cover + Avatar + Verified badge
- ✅ Full name + username + bio + tagline
- ✅ **Bio links** (NEW)
- ✅ **Story Highlights** (NEW)
- ✅ **Online status + last seen** (NEW)
- ✅ Followers / Following / Posts count
- ✅ Follow / Message / Edit / Analytics
- ✅ **Share + More menu (Block / Report / Copy)** (NEW)
- ✅ Tabs: All / Reels / Photos / **Tagged** (NEW)
- ✅ Personal details (city, gender)
- ✅ Themes customization

**النسخة:** v85.0 — Profile Completeness Upgrade
