# 🔴 إصلاحات بطاقة البث المباشر + فشل فتح كاميرا البث

## المشاكل المُبلَّغ عنها

1. **بوست البث في الفيد يظهر بشكل بسيط/مكسور** (مجرد توجل برتقالي "مباشر" + دائرة LIVE) بدلاً من التصميم المطلوب الذي يحتوي على شعار Y كبير + عدّاد المشاهدين + بطاقة احترافية مثل بقية المنشورات.
2. **فشل فتح كاميرا البث** عند بدء بث جديد — مع رسالة `500 Internal Server Error` على endpoint `/api/live_room/{id}/token`.
3. خطأ في الكونسول: `InvalidStateError: Failed to execute 'register' on 'SyncManager': Registration failed - no active Service Worker`.

## الإصلاحات المطبقة

### 1) أزرار الفلاتر (الكل / التحديثات / الستوري / البث) كانت لا تتفاعل
**الملف**: `frontend/src/components/mobile/MobileFilterPills.jsx`

كان المكون يتوقع `activeId` و `onChange`، بينما `FeedMobile.jsx` يمرر `activeFilter` و `onFilterChange` → لذا الفلتر النشط لم يكن يتغير بصرياً أبداً، والنقر لم يصل لمعالج.

**الحل**: قبول الاسمين معاً (backward compatible).

### 2) فلتر "البث" لم يكن يفلتر فعلياً لمنشورات البث
**الملف**: `frontend/src/pages/FeedMobile.jsx`

كانت دالة `filtered` تعالج فقط `all/updates/ads/community` — أي ضغطة على "البث" أو "الستوري" تسقط للحالة الافتراضية وتعرض كل المنشورات.

**الحل**: إضافة حالتين جديدتين:
- `live` / `broadcast` → يُرجع فقط المنشورات التي `isLive` أو `type === 'live_stream'` أو لها `liveStreamId`.
- `stories` / `story` → يُرجع فقط منشورات الستوري.

### 3) ⭐ السبب الجذري لفشل كاميرا البث: خطأ 500 على `/token`
**الملف**: `backend/app/api/routes/live.py`

المكتبة `livekit-api==1.0.5` غيّرت الـ API بالكامل:

| API القديم (server-sdk القديم) | API الجديد (livekit-api 1.x) |
|---|---|
| `VideoGrant(...)` | `VideoGrants(...)` (بصيغة الجمع) |
| `AccessToken(key, secret, identity=..., name=...)` | `AccessToken(key, secret).with_identity(...).with_name(...)` |
| `access_token.add_grant(grant)` | `.with_grants(grants)` |

الكود القديم كان يستخدم `VideoGrant` (مفرد) و `add_grant`، فيرفع `AttributeError` ويُترجم لـ HTTP 500. هذا هو سبب رسالة الكونسول:
```
Failed to load resource: the server responded with a status of 500 () /token:1
```

**الحل**: إعادة كتابة دالة `get_live_token` لتجرب **API الجديد أولاً** (fluent builder pattern) ثم تسقط لـ **API القديم** فقط إذا فشل — أي توافق مع كل إصدارات `livekit-api`.

كما تم إضافة:
- ضبط TTL للتوكن 6 ساعات (مهم للبثوث الطويلة).
- معالجة آمنة + رسائل أوضح في الـ logs.

### 4) خطأ PWA Background Sync (تجميلي لكن مزعج)
**الملف**: `frontend/src/services/pwaInitializer.js`

كان يحاول تسجيل `sync-data` قبل أن يصبح الـ Service Worker `active` (لا يزال في حالة `installing`).

**الحل**: انتظار `serviceWorker.ready` + مراقبة `statechange` حتى `activated` قبل تسجيل المزامنة. مع timeout 5 ثوان كحماية. الفشل لن يعطّل تهيئة PWA.

### 5) تحسين Placeholder بطاقة البث (عندما لا يوجد thumbnail)
**الملف**: `frontend/src/components/mobile/MobileLiveStreamCard.jsx`

- شعار Y أكبر (96×96 بدلاً من 56×56) في منتصف البطاقة.
- تدرج لوني ثلاثي (`#c4b5fd → #a78bfa → #7c3aed`) بدلاً من ثنائي.
- أنيميشن تعويم خفيف للشعار (`ymLogoFloat`).
- ظل سفلي ملوّن + text-shadow على "YAMSHAT LIVE".
- معرّف gradient فريد لكل بطاقة (`ymGrad-${id}`) لتجنب تداخل SVG defs.

## ملاحظات للنشر

- إذا كان متغير البيئة `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` غير معبأ، السيرفر سيرجع **503** برسالة واضحة بدلاً من 500 صامت — تأكد من ضبطها في Render/الإنتاج.
- لا حاجة لتثبيت أي تبعيات جديدة — جميع الإصلاحات تستخدم الحزم الموجودة.

— تم في {{date}}
