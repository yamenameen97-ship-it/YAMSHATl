# 🔧 ملخص الإصلاحات والتحسينات

## 1️⃣ إصلاح مشكلة الكابتشا (الباك إند) — `backend/app/api/routes/auth.py`

### المشكلة الأصلية
- الكابتشا كانت متخزنة في dict في الذاكرة (`_CAPTCHA_STORE`)
- على Render: السيرفر بينام (sleep) بعد فترة خمول، وكمان لو فيه workers متعددين كل واحد بذاكرة منفصلة
- النتيجة: الكابتشا اللي اتعملت في طلب GET بتختفي قبل ما طلب POST يوصل → خطأ "الكابتشا انتهت أو غير موجود" مع HTTP 400، وأحياناً 500 من race conditions

### الحل: Stateless HMAC-signed captcha
- الـ `captcha_id` نفسه بقى توكن موقّع (`payload.signature`) يحتوي:
  - `a` → الإجابة الصحيحة
  - `e` → وقت الانتهاء (Unix timestamp)
  - `n` → nonce عشوائي (لمنع إعادة الاستخدام single-use)
  - `v` → version
- التوقيع HMAC-SHA256 بمفتاح مشتق من `SECRET_KEY`
- التحقق بدون أي تخزين على السيرفر → يشتغل صح مع multi-workers ومع server sleep
- `nonce` بيتخزن مؤقتاً بعد الاستخدام (دقايق قليلة) لمنع replay attack
- **Backward compatibility**: لو فيه `captcha_id` بالنظام القديم لسة شغال (يفرّق بإن النظام الجديد فيه `.` وطوله >40)

## 2️⃣ تحسينات صفحة تسجيل الدخول — `frontend/src/pages/Login.jsx`

- ✅ تجديد الكابتشا تلقائياً قبل انتهاء صلاحيتها بـ 30 ثانية (مفيش "انتهت" مفاجئ)
- ✅ لو حصل خطأ كابتشا، يمسح الإجابة القديمة فوراً + يحمّل واحدة جديدة force
- ✅ يتعامل مع رسائل الخطأ بالإنجليزي والعربي

## 3️⃣ تحسينات الريلز — Frontend

### `frontend/src/hooks/useReels.js`
- ✅ Prefetch ذكي لـ 3 ريلز قدّام (Map بدل Set)
- ✅ Cleanup للروابط البعيدة (`KEEP_WINDOW = 5`) → ميستهلكش الميموري
- ✅ Cleanup كامل عند unmount (مفيش memory leaks)
- ✅ Connection-aware: يوقف الـ prefetch تلقائياً على 2G/3G/Save-Data
- ✅ Retry logic مع exponential backoff (2s → 4s → 8s)
- ✅ `priority hint` على أول ريل جاي
- ✅ helpers: `next()`, `prev()`, `getReelStatus()`

### `frontend/src/components/video/ReelsPlayer.jsx`
- ✅ IntersectionObserver بثريشولدز أدق `[0, 0.25, 0.5, 0.65, 0.85, 1]`
- ✅ Debounce على تغيير الـ activeIndex (80ms) → مفيش flicker
- ✅ Preload للريلز اللي قبل النشط كمان (rewind سريع)
- ✅ Pause تلقائي ساعة الـ tab مش visible (Page Visibility API)
- ✅ Keyboard navigation (↑↓ / PageUp PageDown)
- ✅ Render window محدود (`keepWindow=2`) → الريلز البعيدة بتكون poster فقط
- ✅ ميمشيش onVisible تاني لنفس الريل (lastReportedRef)

### `frontend/src/components/reels/ReelPlayer.jsx`
- ✅ **إصلاح AudioContext warning** (اللي ظهر في الكونسول)
  - الـ video بيبدأ muted (متوافق مع autoplay policy)
  - تشغيل الصوت بـ user gesture فقط (tap على زر mute أو double-tap)
- ✅ Smart preload حسب الـ network connection
- ✅ Auto-recovery من errors (retry 2 مرات مع backoff)
- ✅ Stalled handler (يعيد التحميل لو الشبكة فصلت)
- ✅ Error UI لطيف مع زر "إعادة المحاولة"
- ✅ Touch + mouse scrubbing على progress bar
- ✅ Cleanup عند unmount (يلغي الـ src ويفرّغ الـ video element)
- ✅ Page visibility pause/resume

## 🔐 ملاحظات أمنية
- مفتاح التوقيع مشتق من `SECRET_KEY` الأصلي بـ SHA-256 (مينفعش يطلع منه نفس الـ key)
- إجابة الكابتشا داخل التوكن مش الـ hash بس لإنها أرقام صغيرة (HMAC هو اللي بيحميها)
- nonce بيمنع إعادة استخدام نفس الإجابة أكتر من مرة

## 🚀 نصيحة للنشر على Render
لا حاجة لتغيير أي env variable. النظام الجديد بيستخدم الـ `SECRET_KEY` الموجود أصلاً.

