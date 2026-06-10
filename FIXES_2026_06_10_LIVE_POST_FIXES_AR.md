# 🔧 إصلاحات بث المباشر — 2026-06-10

تم إصلاح **4 مشاكل رئيسية** متعلقة ببوست البث المباشر في فيد الجوال وصفحة عرض البث.

---

## 1️⃣ المشكلة: بوست البث يظهر **مكرر 5 مرات** في الفيد

**السبب:**
- `FeedMobile.jsx` كان يجلب `getActiveLiveStreams({ limit: 5 })` ويدمجها مع منشورات الفيد بدون أي تحقق من التكرار.
- إذا كان للبث منشور مرتبط (عبر `has_live_stream`) كان يظهر مرتين (مرة من الفيد ومرة من قائمة البثوث المباشرة).
- لا يوجد تصفية للـ IDs المكررة داخل قائمة `liveStreams` نفسها.

**الإصلاح في `frontend/src/pages/FeedMobile.jsx`:**
- جمع كل `liveStreamId` الموجودة في المنشورات أولاً.
- تصفية `liveStreams` لإزالة:
  - البثوث التي لها منشور مرتبط بالفعل في الفيد.
  - البثوث المكررة داخل القائمة نفسها (`seenLiveIds`).
- إزالة تكرار نهائية بناءً على `id` عبر `Map`.
- في `loadStreams` في `LiveViewer.jsx`: تصفية إضافية للـ IDs المكررة عند تحميل القائمة.

---

## 2️⃣ المشكلة: شكل بوست البث **غير مطابق للتصميم المرجعي** (تويتر-style)

**السبب:**
- البطاقة القديمة كانت كبيرة جدًا مع عناصر مزخرفة (avatar-ring متحرك، أيقونة LIVE مزدوجة، شارات متعددة).
- لم تكن مطابقة لشكل المنشور العادي في الفيد (الصورة المرجعية الثالثة).

**الإصلاح في `frontend/src/components/mobile/MobileLiveStreamCard.jsx`:**
- إعادة تصميم كاملة بشكل **تويتر-style** خفيف:
  - هيدر مدمج: avatar صغير (40px) + اسم + handle + وقت + شارة "مباشر الآن".
  - نص البث في سطر واحد (clamp 3 أسطر) بمحاذاة المحتوى مع الـ avatar.
  - صورة الغلاف 16:9 مع شارة LIVE وعدد المشاهدين فقط (بدون overlays داكنة).
  - شريط أكشن نظيف بنفس نمط منشورات تويتر (تعليق / إعادة نشر / إعجاب / مشاركة).
- تخفيف الـ CSS بنسبة ~40% وإزالة الـ animations الثقيلة على الأجهزة منخفضة الإمكانيات.
- `contain: layout style` + `content-visibility: auto` لتحسين الأداء.
- دعم `prefers-reduced-motion` و `prefers-color-scheme`.

---

## 3️⃣ المشكلة: صفحة عرض البث تعرض **أرقام وهمية ثابتة** (12.8K، 25.7K، 1,245، 1,026)

**السبب:**
- في `LiveViewer.jsx` كانت الأرقام مكتوبة hardcoded:
  ```jsx
  <p>12.8K مشاهد</p>
  <span>25.7K</span>  // hearts
  <span>1,245</span>  // comments
  <span>1,026</span>  // shares
  ```

**الإصلاح في `frontend/src/pages/LiveViewer.jsx`:**
- استبدال **كل** القيم hardcoded بقيم حقيقية من `streamStats` المربوط بـ backend:
  - **عدد المشاهدين** = `streamStats.viewers` (من `/live_room/{id}/analytics`).
  - **القلوب** = `streamStats.hearts` (من analytics + socket events).
  - **التعليقات** = `streamStats.comments` (من `/live_comments/{id}`).
  - **المشاركات** = `streamStats.shares` (يبدأ من 0، يزيد عند المشاركة).
- إضافة وظيفة `formatLiveNum(n)` لتنسيق الأرقام بالعربية (1.2ألف، 2.5م).
- اسم الهيدر `Yamshat Official` → ديناميكي من `hostName` (اسم المضيف الحقيقي).
- إذا لا يوجد مشاهدين → عرض رسالة "لا يوجد مشاهدون حالياً" بدل رقم وهمي.
- إضافة `handleShareStream` لمشاركة رابط البث حقيقياً (Web Share API + clipboard fallback).
- تصفير `streamStats` الافتراضي (كان `0` لكن أضفنا `shares: 0` أيضاً).

---

## 4️⃣ المشكلة: **بعد انتهاء البث، البوست يختفي** + 404 spam في الكونسول

**السبب:**
- في `backend/app/api/routes/live.py`:
  - `GET /live_room/{id}` كان يرجع `404` فور `is_active = False`.
  - `GET /live_room/{id}/analytics` نفس الشيء.
  - `GET /live_comments/{id}` نفس الشيء.
- بعد إنهاء البث، الفرونت كان يستمر في polling هذه الـ endpoints → 404 spam مثل ما ظهر في الصورة الرابعة.
- البوست المرتبط بالبث لم يكن يختفي فعلياً (لا يوجد حذف)، لكن الفرونت كان يعرض حالة خطأ بدل الانتقال للوضع "بث منتهي".

**الإصلاح في `backend/app/api/routes/live.py`:**

### `GET /live_room/{room_id}`:
- لو السجل غير موجود → 404 (سلوك صحيح).
- لو السجل موجود ولكن `is_active = False`:
  - **بدل 404** → إرجاع البيانات مع `is_active: false`, `stream_status: 'ended'`, `live_ended: true`.

### `GET /live_room/{room_id}/analytics`:
- لو البث منتهي → إرجاع الأرقام النهائية المحفوظة (peak_viewer_count, hearts_count) مع `is_active: false`.

### `GET /live_comments/{room_id}`:
- لو البث منتهي → إرجاع `[]` بدل 404.

### النتيجة:
- ✅ البوست يظل ظاهراً في الفيد بعد انتهاء البث (يتحول من بطاقة بث إلى منشور عادي).
- ✅ صفحة `/live/view/{id}` تعرض رسالة "انتهى البث المباشر" بشكل سليم بدون 404 spam.
- ✅ الإحصائيات النهائية تبقى متاحة للعرض في البوست.

### في `FeedMobile.jsx`:
- تمييز البوست `wasLive: true` (كان بثاً وانتهى) — قابل للاستخدام مستقبلاً لإضافة شارة "بث منتهي" على المنشور العادي.

---

## 📦 الملفات المعدّلة

| الملف | التغيير |
|---|---|
| `frontend/src/pages/FeedMobile.jsx` | إزالة تكرار البثوث + معالجة `wasLive` |
| `frontend/src/components/mobile/MobileLiveStreamCard.jsx` | إعادة تصميم كاملة تويتر-style |
| `frontend/src/pages/LiveViewer.jsx` | تصفير الأرقام الوهمية + ربط حقيقي |
| `backend/app/api/routes/live.py` | منع 404 على البثوث المنتهية (3 endpoints) |

---

## ✅ التحقق

- اختبار البناء (esbuild) على جميع ملفات JSX: **OK**
- اختبار AST على ملف Python: **OK**
- توازن الأقواس: **OK**

---

**التاريخ:** 2026-06-10
**النسخة:** v4 - Live Post Fixes
