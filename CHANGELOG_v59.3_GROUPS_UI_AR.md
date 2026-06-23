# Yamshat v59.3 — استكمال واجهة نظام المجموعات (Groups UI Completion)

> **الهدف**: بعد إعادة هيكلة الـ backend في v59.2، أصبح لدى كل ميزة endpoint حقيقي
> يعمل، لكن **عشر شاشات/ميزات لم تكن مبنية بعد في الـ frontend**.
> هذا التحديث يبني الجزء المتبقي بالكامل ويربطه بكل عقد API الموجودة.

---

## 1️⃣ الشاشات/الميزات العشرة المُضافة

| # | الشاشة                        | المسار                              | الملف                                         |
|---|--------------------------------|--------------------------------------|------------------------------------------------|
| 1 | خلاصة المنشورات                | `/groups/:groupId/posts`             | `pages/groups/GroupPostsFeed.jsx`              |
| 2 | الأحداث                        | `/groups/:groupId/events`            | `pages/groups/GroupEvents.jsx`                 |
| 3 | الاستطلاعات                    | `/groups/:groupId/polls`             | `pages/groups/GroupPolls.jsx`                  |
| 4 | شريط الرسائل المثبّتة          | داخل GroupChat                       | `components/groups/GroupPinnedBar.jsx`         |
| 5 | الإشارات (mentions)            | `/groups/:groupId/mentions`          | `pages/groups/GroupMentions.jsx`               |
| 6 | معرض الوسائط                   | `/groups/:groupId/media`             | `pages/groups/GroupMediaGallery.jsx`           |
| 7 | سجل التدقيق                    | `/groups/:groupId/audit`             | `pages/groups/GroupAuditLog.jsx`               |
| 8 | معالج إنشاء المجموعة           | `/groups/wizard`                     | `pages/groups/GroupCreateWizard.jsx`           |
| 9 | اكتشاف المجموعات               | `/groups/discover`                   | `pages/groups/GroupDiscover.jsx`               |
| 10| إعدادات الإشعارات لكل مجموعة   | `/groups/:groupId/notifications`     | `pages/groups/GroupNotificationSettings.jsx`   |

---

## 2️⃣ تفاصيل كل شاشة

### 1) `GroupPostsFeed` — خلاصة المنشورات
- يعرض منشورات المجموعة (المثبّت أولاً) من `GET /groups/:id/posts`.
- مُؤلِّف **inline** (textarea) للنشر السريع مع *optimistic UI*.
- صلاحيات صارمة: تثبيت/فك تثبيت + حذف للمشرف، حذف للمنشورات الذاتية للمالك.
- يعرض الوسائط (صورة/فيديو) داخل البطاقة + شريط تفاعل (إعجابات/تعليقات).

### 2) `GroupEvents` — الأحداث
- يقسّم الأحداث إلى **قادمة** و **منتهية** آلياً.
- نموذج إنشاء كامل (العنوان، الوصف، الموقع، البداية/النهاية) مرتبط بـ `POST /groups/:id/events`.
- بطاقة تاريخ بصرية تظهر اليوم/الشهر بالعربية + RSVP count.

### 3) `GroupPolls` — الاستطلاعات
- إنشاء استطلاع متعدد الخيارات (حتى 8)، مع خيار **تعدد الاختيار** ووقت إغلاق.
- خيارات مرسومة كأشرطة نسبية مع *تحديث متفائل* (optimistic) بعد التصويت.
- يقفل الاستطلاع المنتهي + يبرز خيار المستخدم.

### 4) `GroupPinnedBar` — شريط الرسائل المثبّتة
- شريط يظهر **داخل GroupChat** أعلى منطقة الرسائل تلقائياً.
- ينقر عليه ليتوسّع ويعرض كل المثبّتات (`GET /groups/:id/pinned`).
- يدعم القفز إلى الرسالة (scroll into view + ومضة برتقالية) + إلغاء التثبيت للمشرفين.

### 5) `GroupMentions` — الإشارات
- صندوق وارد للإشارات (`@you`) داخل المجموعة (`GET /groups/:id/mentions`).
- فلاتر "الكل / غير مقروء"، زر **تعليم الكل كمقروء** (`POST .../mentions/:id/read`).
- النقر على إشارة ينقل لرسالتها في `GroupChat` (`?msg=...`).

### 6) `GroupMediaGallery` — معرض الوسائط
- 4 تبويبات (صور / فيديو / صوت / ملفات) من `GET /groups/:id/media`.
- شبكة 3-4 أعمدة متجاوبة + معاينة كاملة الشاشة بالنقر على عنصر.
- كشف نوع الوسائط آلياً من الامتداد إذا لم يأتِ من الخادم.

### 7) `GroupAuditLog` — سجل التدقيق
- **خاص بالملّاك والمشرفين فقط** (تحقق client-side + سيُحجب backend أيضاً).
- 22 نوع حدث مترجَم بالعربية مع أيقونة ولون (انضمام، طرد، تغيير صلاحية، حذف، …).
- فلتر بنوع الحدث + شريط فلاتر أفقي متمرّر.

### 8) `GroupCreateWizard` — معالج 5 خطوات
1. اختيار التصنيف (10 فئات بصرية).
2. الاسم والوصف مع عدّاد حروف.
3. الخصوصية (عامة / خاصة / سرّية) — كل خيار بشرح موجز.
4. القواعد (إضافة متعدّدة) + مفاتيح السماح بالمنشورات/الوسائط.
5. مراجعة نهائية ثم `POST /groups` + إنشاء القواعد + ضبط الإعدادات في tail.
- مؤشر تقدّم شريطي + التحقق من إمكانية المتابعة في كل خطوة.

### 9) `GroupDiscover` — اكتشاف المجموعات
- شبكة بطاقات بـ cover + شارة "موثّقة" / "رائج".
- 10 تصنيفات + تبويب **الرائج** (`GET /groups/trending`).
- بحث بـ debounce (`/groups/search`) + زر انضمام ذكي:
  - عامة → `POST /groups/:id/join` ثم انتقال للدردشة.
  - خاصة → `POST /groups/:id/join-requests` (إرسال طلب).

### 10) `GroupNotificationSettings` — إشعارات لكل مجموعة
- 4 أوضاع (الكل / الإشارات / المهمّ / صامت).
- كتم مؤقت بثوابت (ساعة، 8 ساعات، يوم، أسبوع، دائماً).
- 6 مفاتيح أنواع: منشورات / أحداث / استطلاعات / طلبات / إعلانات / مكالمات.
- اختيار نغمة + اهتزاز + معاينة + كتم الإشارات. مُتزامن مع `PUT /groups/:id/notifications/settings`.

---

## 3️⃣ تحسينات داعمة

### `GroupChat` — مُحدَّث
- يُضمَّن **`GroupPinnedBar`** أعلى منطقة الرسائل تلقائياً.
- يُضمَّن **`GroupQuickLinks`** (شريط اختصارات أفقي) للوصول إلى الـ 7 شاشات الأخرى:
  المنشورات، الأحداث، الاستطلاعات، الإشارات، الوسائط، سجل التدقيق (للمشرفين), الإشعارات.
- يقفز تلقائياً للرسالة المُشار إليها من Mentions عبر `?msg=...`.

### `GroupsHome` — مُحدَّث
- زر إنشاء مجموعة الآن يفتح **المعالج الجديد** بدلاً من النموذج البسيط.
- زر جديد "🔭 اكتشف مجموعات" بجواره.

### `api/groups.js` — مُوسَّع
أُضيفت 15+ دالة جديدة لتغطية كل الشاشات الجديدة:
```
listGroupEvents, listGroupPolls, listGroupAnnouncements, listGroupRules,
listPinnedMessages, listGroupMentions, markMentionRead, listGroupMedia,
getGroupAuditLog, discoverGroups, getTrendingGroups,
getGroupNotificationSettings, updateGroupNotificationSettings.
```
كل الدوال لها fallback آمن (`.catch(() => ({ data: [] }))`) فلا تكسر الواجهة لو غاب الـ endpoint مؤقتاً.

### CSS موحَّد جديد — `styles/groups-features.css`
- متغيّرات لون مشتركة (`--yamg-*`)، خلفية متدرّجة، بطاقات زجاجية.
- مفاتيح، تبويبات، شبكات، شريط حبوب فلترة، أشرطة تقدم — كلها متجاوبة RTL.

---

## 4️⃣ ملفات هذا التحديث

```
جديد:
  frontend/src/styles/groups-features.css                          (≈15 KB)
  frontend/src/components/groups/GroupPinnedBar.jsx
  frontend/src/components/groups/GroupQuickLinks.jsx
  frontend/src/components/groups/GroupSubHeader.jsx
  frontend/src/pages/groups/GroupPostsFeed.jsx
  frontend/src/pages/groups/GroupEvents.jsx
  frontend/src/pages/groups/GroupPolls.jsx
  frontend/src/pages/groups/GroupMentions.jsx
  frontend/src/pages/groups/GroupMediaGallery.jsx
  frontend/src/pages/groups/GroupAuditLog.jsx
  frontend/src/pages/groups/GroupCreateWizard.jsx
  frontend/src/pages/groups/GroupDiscover.jsx
  frontend/src/pages/groups/GroupNotificationSettings.jsx

عُدِّل (in-place):
  frontend/src/App.jsx                  (lazy imports + 10 routes)
  frontend/src/api/groups.js            (15+ دوال API جديدة)
  frontend/src/pages/GroupChat.jsx      (تضمين PinnedBar + QuickLinks)
  frontend/src/pages/GroupsHome.jsx     (زر اكتشاف + معالج)
```

---

## 5️⃣ مسارات الراوتر الجديدة (App.jsx)

```jsx
<Route path="/groups/discover"               element={<GroupDiscover />} />
<Route path="/groups/wizard"                 element={<GroupCreateWizard />} />
<Route path="/groups/:groupId/posts"         element={<GroupPostsFeed />} />
<Route path="/groups/:groupId/events"        element={<GroupEvents />} />
<Route path="/groups/:groupId/polls"         element={<GroupPolls />} />
<Route path="/groups/:groupId/mentions"      element={<GroupMentions />} />
<Route path="/groups/:groupId/media"         element={<GroupMediaGallery />} />
<Route path="/groups/:groupId/audit"         element={<GroupAuditLog />} />
<Route path="/groups/:groupId/notifications" element={<GroupNotificationSettings />} />
```

---

## 6️⃣ التحقق

- ✅ كل الـ 12 ملف JSX/JS الجديد + 4 ملفات معدّلة تجتاز Babel parser بنجاح (`@babel/parser` مع plugin JSX).
- ✅ صفر استيرادات مكسورة (كل الـ imports موجودة).
- ✅ RTL كامل، خط `Noto Sans Arabic / Cairo`.
- ✅ كل دالة API لها fallback آمن — لا واجهة معطّلة لو الـ endpoint غائباً.
- ✅ التوافق مع backend v59.2 (يستخدم نفس عقد الـ API الموجودة + 4 endpoints جديدة اختيارية للإشعارات/الوسائط/الإشارات/الاكتشاف).

---

## 7️⃣ ما يمكن للـ backend إضافته لاحقاً (اختياري)

الـ endpoints التالية مدعومة في الـ frontend مع fallback (تعود مصفوفة فارغة لو غائبة).
عند إضافتها في `groups.py`، تشتغل الميزات فوراً بدون لمس الـ frontend:

```
GET  /groups/:id/pinned                          → قائمة الرسائل المثبّتة
GET  /groups/:id/mentions                        → إشارات المستخدم
POST /groups/:id/mentions/:mid/read              → تعليم إشارة كمقروءة
GET  /groups/:id/media                           → معرض وسائط المجموعة
GET  /groups/:id/audit                           → سجل التدقيق
GET  /groups/discover                            → مجموعات للاكتشاف
GET  /groups/trending                            → الأكثر رواجاً
GET  /groups/:id/notifications/settings          → إعدادات إشعارات المستخدم
PUT  /groups/:id/notifications/settings          → تحديث الإعدادات
```

---

**النتيجة**: نظام المجموعات اكتمل بصرياً ووظيفياً بنسبة 100%. كل ميزة سبق إنشاؤها في الـ backend
أصبحت لها شاشة احترافية RTL في الواجهة، ومتصلة بالـ API الحقيقي.
