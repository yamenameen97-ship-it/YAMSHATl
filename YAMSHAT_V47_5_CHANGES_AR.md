# YAMSHAT v47.5 — مطابقة الصفحة الرئيسية بكسل-لبكسل + ربط backend كامل

## 🎯 الهدف
مطابقة صفحة الويب للجوال (الصفحة الرئيسية للمنشورات) مع الصورة المرجعية بدقة كاملة،
مع إزالة أي بيانات تجريبية وربط كل العدّادات (إعجابات/تعليقات/مشاركات/حفظ) بقاعدة البيانات
الحقيقية عبر backend.

---

## ✅ ما تم في هذه النسخة (v47.5)

### 1. إزالة الأرقام التجريبية من بطاقة المنشور
**ملف:** `frontend/src/components/mobile/MobilePostCard.jsx`

كانت البطاقة تعرض fallback ثابت (`356` للمشاركات، `128` للتعليقات، `1.2 ألف` للإعجابات)
عندما تكون القيم القادمة من backend صفراً أو غير معرّفة. هذا الـ fallback أُزيل بالكامل:

```jsx
// قبل
<span>{formatCount(reposts || 356)}</span>
<span>{formatCount(comments || 128)}</span>
<span className="text-purple">{formatCount(likes || 1200)}</span>

// بعد — قيم حقيقية فقط من قاعدة البيانات
<span>{formatCount(Number(reposts) || 0)}</span>
<span>{formatCount(Number(comments) || 0)}</span>
<span className={liked ? 'text-purple' : ''}>{formatCount(Number(likes) || 0)}</span>
```

### 2. زر الإعجاب: لون ديناميكي صحيح
كان قلب الإعجاب يظهر دائماً ممتلئاً بنفسجياً حتى عندما لا يكون المستخدم
معجباً بالمنشور — صار الآن:
- **معجب (liked = true):** قلب ممتلئ بنفسجي `#8B5CF6` + رقم بنفسجي
- **غير معجب (liked = false):** قلب فارغ (outline فقط) + رقم رمادي عادي

### 3. تأكيد الربط الكامل بـ backend
تم التحقق من كل المسارات الحرجة:

| العنصر | Hook/API | Backend Endpoint | الحالة |
|--------|----------|------------------|--------|
| جلب المنشورات | `useSmartFeed` → `useFeed` → `getPosts` | `GET /posts/` | ✅ حقيقي |
| الإعجاب | `likePost(postId)` | `POST /posts/{id}/like` | ✅ حقيقي |
| الحفظ | `savePost(postId)` | `POST /posts/{id}/save` | ✅ حقيقي |
| المشاركة | `sharePost(postId, platform)` | `POST /posts/{id}/share` | ✅ حقيقي |
| إعادة النشر | `sharePost(postId, 'repost')` | `POST /posts/{id}/share` | ✅ حقيقي |
| التعليقات | `addComment / getComments` | `POST/GET /posts/{id}/comment(s)` | ✅ حقيقي |
| الحذف | `deletePost(postId)` | `DELETE /posts/{id}` | ✅ حقيقي |
| المتابعة/الكتم/الحظر | `followUser / muteUser / blockUserApi` | `POST /users/*` | ✅ حقيقي |
| الصور/الفيديو | `resolveMediaUrl` + `media_urls[]` | `GET /upload/...` | ✅ حقيقي |

### 4. حقول قاعدة البيانات المُستخدَمة (من backend `posts_routes`)
```python
{
  "id": int,
  "user_id": int,
  "username": str,
  "user_avatar": str,
  "verified": bool,
  "content": str,
  "media_urls": list[str],
  "media_type": "image" | "video",
  "has_video": bool,
  "thumbnail_url": str,
  "likes_count": int,        # ← يظهر بجوار القلب
  "comments_count": int,     # ← يظهر بجوار فقاعة التعليق
  "share_count": int,        # ← يظهر بجوار سهم المشاركة
  "is_liked": bool,          # ← يفعّل لون القلب البنفسجي
  "is_saved": bool,          # ← يفعّل لون الـ bookmark البنفسجي
  "reposted": bool,
  "created_at": ISO datetime,
}
```
كل هذه الحقول يُطبّعها `normalizePost()` في `FeedMobile.jsx`.

### 5. الهيدر العلوي الموحّد (`MobileTopBar`)
الهيدر مُطبَّق فعلياً كهيدر رسمي عبر `MainLayout.jsx` لكل الصفحات التالية:

✅ الصفحة الرئيسية `/` (Feed)
✅ الدردشات `/inbox`
✅ الإشعارات `/notifications`
✅ الأصدقاء `/friends`
✅ المجموعات `/groups`
✅ غرفة المجموعة `/groups/:id`
✅ الستوريز `/stories`
✅ البحث `/search`
✅ الإعدادات `/settings`
✅ الملف الشخصي `/profile`
✅ المحفظة/التفاعل `/engagement`, `/voice-rooms`
✅ كل صفحات الإعدادات الفرعية

❌ **مستثنى تماماً:** صفحة الريلز `/reels` — `MainLayout` يخفي الهيدر العلوي
تلقائياً عبر `showTopBar = showChrome && !isReelsRoute` (TikTok-style full screen).

### 6. مطابقة الصورة المرجعية — الهيدر العلوي
المكونات بترتيب DOM (LTR position, محتوى RTL):

```
[ Y YAMSHAT ]   [ 🔔  👥 المجموعات  ⊕ ستوري ]   [ ☰ ]
   يسار الفعلي         الوسط                    يمين الفعلي
```

- شعار Y بتدرج بنفسجي (`#A78BFA → #7C3AED`) + كلمة YAMSHAT بيضاء عريضة (letter-spacing).
- جرس الإشعارات (outline 21×21).
- أيقونة مجموعات (دائرتان + شخصان) + كلمة "المجموعات".
- دائرة + علامة `+` + كلمة "ستوري".
- زر القائمة الهامبرغر (3 خطوط أفقية) يفتح `YamServicesMenu`.

استجابة كاملة للأحجام: 320 / 360 / 400 / 480px+ (الكلمات تختفي تحت 340px لإفساح المجال).

### 7. صندوق "بماذا تفكر؟" (MobileComposer)
```
[ Y(avatar) | بماذا تفكر؟ ... | 🖼️ GIF 😊 ]
   يمين         وسط                    يسار
```
- نقر في أي مكان → يفتح `MobileComposeModal`
- نقر 🖼️ → يفتح المُنشئ مع تبويب الصورة
- نقر GIF → يفتح المُنشئ مع تبويب GIF
- نقر 😊 → يفتح المُنشئ مع تبويب الإيموجي

### 8. شريط الفلاتر (Filter Pills)
الترتيب من اليمين لليسار (RTL):
```
[ الكل (نشط بنفسجي) ] [ المجموعات ] [ الستوري ] [ الوسائط ] [ التعليقات ]
```
- الزر النشط: `#7C3AED` ممتلئ + ظل `rgba(124,58,237,0.4)`
- غير النشط: خلفية `#1A1F2E` + نص رمادي `#9CA3AF`

### 9. بطاقة المنشور (RTL pixel-perfect)
**الهيدر:**
```
[ ⋯ ]                       [ yamenameen97 ✓ | Y(avatar) ]
                              @yamenameen97 • منذ 4 دقيقة
```
- زر `...` (أقصى اليسار) → قائمة خيارات (متابعة/كتم/حظر/بلاغ/حذف)
- صورة المستخدم: دائرة 36×36 بإطار بنفسجي `#8B5CF6` مع توهج
- اسم المستخدم + شارة التوثيق + handle + الوقت لحظياً

**الميديا:**
- مربع 1:1 مع `border-radius: 14px`
- إن وُجدت صورة حقيقية → عرضها بـ `object-fit: cover`
- إن لم توجد → شعار Y كبير بنفسجي مع `drop-shadow`
- أيقونة قوس قزح صغيرة (Yam services) في الزاوية السفلية اليسرى

**الفوتر (RTL — من اليمين):**
```
[ 🏷️ حفظ ]    [ ✈️ <مشاركات> ]    [ 💬 <تعليقات> ]    [ ❤️ <إعجابات> ]
   يسار                                                         يمين
```
- الأرقام كلها تأتي من backend (لا أرقام ثابتة).
- زر الإعجاب: قلب بنفسجي ممتلئ + رقم بنفسجي عند الإعجاب فقط.
- زر الحفظ: bookmark بنفسجي ممتلئ عند الحفظ.

### 10. شريط التنقل السفلي (BottomNav)
من اليمين لليسار:
```
[ 🏠 الرئيسية (نشط) ] [ 💬 الدردشات ] [ ⊕ منشور جديد (مربع بنفسجي) ] [ ▶ الريلز ] [ 👤 حسابي ]
```
- زر `+` مربع `44×36` بحواف `12px`, ظل بنفسجي.
- يتكيّف نصّه حسب الصفحة:
  - في `/groups` → "إنشاء مجموعة"
  - في `/inbox` → "دردشة جديدة"
  - في `/reels` → "ريل جديد"
  - في `/stories` → "ستوري جديد"
  - في أي مكان آخر → "منشور جديد"

---

## 🎨 الألوان المُعتمَدة (مطابقة للصورة)

| العنصر | اللون |
|--------|-------|
| خلفية التطبيق | `#0A0D1A` |
| خلفية البطاقات الفرعية | `#14172a` |
| البنفسجي الأساسي (Accent) | `#8B5CF6` / `#7C3AED` |
| تدرج Y | `#A78BFA → #7C3AED` |
| النص الأبيض | `#FFFFFF` / `#E5E7EB` |
| النص الرمادي | `#9CA3AF` / `#6B7280` |
| الحدود | `#1F2937` / `#1A1F2E` |

---

## 🌐 RTL & الخطوط
- `<html lang="ar" dir="rtl">` (في `index.html`)
- خط أساسي: **Noto Sans Arabic** (محمّل من Google Fonts)
- خط احتياطي: **Tajawal** ثم `system-ui, sans-serif`
- كل المكوّنات الجوّالة لها `dir="rtl"` صريحة
- استثناء واحد فقط: `MobileTopBar` له `direction: ltr` على الحاوية الخارجية
  لمنع انعكاس flex، مع `direction: rtl` على النصوص العربية بداخله.

---

## 📱 الاستجابة (Responsive)
كل المكوّنات مُختبَرة بكسر النقاط التالية:
- `320px` (الأقدم — Galaxy Fold مغلق)
- `360px` (Redmi Note قديم)
- `400px` (الجوالات المتوسطة)
- `480px+` (الجوالات الحديثة)
- `1024px+` (تابلت/ويب)

كل الأحجام (الخطوط، الأيقونات، المسافات) تتدرّج تلقائياً عبر `@media (max-width: ...)`.

---

## 🔗 ملفات تم تعديلها
1. `frontend/src/components/mobile/MobilePostCard.jsx` — إزالة أرقام Fallback + لون القلب الديناميكي

## 🔗 ملفات مُتحقَّق منها (سليمة بدون تعديل)
- `frontend/src/components/mobile/MobileTopBar.jsx` ✅
- `frontend/src/components/mobile/MobileComposer.jsx` ✅
- `frontend/src/components/mobile/MobileFilterPills.jsx` ✅
- `frontend/src/components/mobile/BottomNav.jsx` ✅
- `frontend/src/components/layout/MainLayout.jsx` ✅
- `frontend/src/layouts/MobileLayout.jsx` ✅
- `frontend/src/pages/FeedMobile.jsx` ✅
- `frontend/src/pages/FeedEnhanced.jsx` ✅
- `frontend/src/hooks/useSmartFeed.js` ✅
- `frontend/src/hooks/useFeed.js` ✅
- `frontend/src/api/posts.js` ✅
- `backend/app/api/routes/posts.py` ✅
- `frontend/index.html` ✅

---

تم إعداد v47.5 بنجاح. الصفحة الرئيسية مطابقة للصورة المرجعية بكسل-لبكسل
ومرتبطة بالكامل بـ backend وقاعدة البيانات.
