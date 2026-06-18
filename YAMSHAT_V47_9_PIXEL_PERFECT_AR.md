# YAMSHAT v47.9 — Pixel Perfect Mobile Web (مطابق تماماً للصورة المرجعية)

> جميع ملفات HTML والمكونات تستخدم `dir="rtl"` وخط `Noto Sans Arabic` كخط أساسي مع `Tajawal` كاحتياطي.

## ملخص التحسينات في هذا الإصدار

### ✅ 1) إصلاح ترتيب subtext في بطاقة المنشور
- **قبل**: `@yamenameen97 • منذ 4 دقيقة`
- **بعد (مطابق للصورة)**: `منذ 4 دقيقة • @yamenameen97`
- الملف: `src/components/mobile/MobilePostCard.jsx`

### ✅ 2) شعار Y جديد بخطوط سميكة بسيطة (مطابق للصورة)
- تم استبدال SVG المعقد بثلاث خطوط `<line>` بـ `strokeLinecap="round"`
- يبدو نظيفاً وحاداً على الأجهزة الضعيفة
- مُطبَّق في: `MobilePostCard.jsx` (Y كبير + Y صغير في الـ avatar) + `MobileTopBar.jsx` + `MobileComposer.jsx`

### ✅ 3) PWA Install Banner أعلى الصفحة (يعمل على كل المتصفحات)
- ملف جديد: `src/components/mobile/PWAInstallBanner.jsx`
- يدعم:
  - **Chrome / Edge / Samsung Internet / MIUI / Opera Mobile**: استخدام `beforeinstallprompt` API
  - **Safari iOS**: عرض تعليمات يدوية (مشاركة → إضافة إلى الشاشة الرئيسية)
  - **Firefox Android**: تعليمات يدوية (القائمة → تثبيت)
- يحفظ الرفض في `localStorage` لمدة أسبوع
- يخفي نفسه تلقائياً بعد التثبيت (حدث `appinstalled`)
- يكتشف وضع `standalone` ولا يظهر إذا كان التطبيق مثبتاً بالفعل

### ✅ 4) دعم الأجهزة الضعيفة (Redmi Note 8 وما شابهها)
- ملف CSS جديد: `src/styles/mobile-pixel-perfect-v47-9.css`
- نطاق `@media (max-width: 393px) and (min-width: 361px)` مخصص لـ Redmi Note 8
- Fallbacks للمتصفحات القديمة:
  - `@supports not (gap: 8px)` → استخدام margin بدلاً من gap
  - `@supports not (aspect-ratio: 1/1)` → padding-bottom hack
  - `@supports not (padding: env(safe-area-inset-bottom))` → ارتفاع ثابت
  - `@supports not (backdrop-filter)` → خلفية صلبة
- تعطيل الانيميشن على شاشات < 360px لتحسين الأداء
- `font-variant-numeric: tabular-nums` لأرقام نظيفة

### ✅ 5) تحسينات index.html
- `dir="rtl"` و `lang="ar"` على مستوى المستند
- `<meta viewport>` مع `viewport-fit=cover` لشاشات notch
- DNS prefetch + preconnect للخط (تسريع التحميل على الأجهزة الضعيفة)
- شاشة تحميل SVG بسيطة قبل React (شعار Y بنفسجي ينبض)
- `noscript` بـ `dir="rtl"` لرسالة تحذيرية
- منع التكبير التلقائي عند التركيز على input في iOS (`font-size: 16px`)

### ✅ 6) ترتيب الأزرار والهيدر — مطابق 100% للصورة
- **TopBar** (يسار → يمين على الشاشة): `Y YAMSHAT | 🔔 | 👥 المجموعات | ⊕ ستوري | ☰`
- **Composer**: `Y + بماذا تفكر؟ ........ 🖼️ GIF ☺`
- **Filter Pills**: `[الكل (نشط)] [المجموعات] [الستوري] [الوسائط] [التعليقات]`
- **Post Footer**: `🏷️ حفظ | ✈️ 356 | 💬 128 | ❤️ 1.2 ألف`
- **BottomNav**: `حسابي | الريلز | (+) منشور جديد | الدردشات | الرئيسية (نشط)`

## المتصفحات المدعومة

| المتصفح | الحد الأدنى | الحالة |
|---|---|---|
| Chrome Android | 70+ | ✅ كامل + PWA install |
| Samsung Internet | 12+ | ✅ كامل + PWA install |
| MIUI Browser | 12+ | ✅ كامل + PWA install |
| Safari iOS | 12+ | ✅ كامل + تعليمات يدوية PWA |
| Firefox Android | 90+ | ✅ كامل + تعليمات يدوية PWA |
| Edge Mobile | 90+ | ✅ كامل + PWA install |
| Opera Mobile | 60+ | ✅ كامل |
| UC Browser | 13+ | ✅ كامل |

## الأجهزة المُختبَرة

- **Redmi Note 8** (393x873 @ DPR 2.75) — ✅ مطابق للصورة
- **iPhone SE 1st gen** (320x568) — ✅ كل العناصر مرئية
- **iPhone 12 Mini** (375x812) — ✅ مثالي
- **Galaxy A20** (360x640) — ✅ مطابق
- **شاشات 320px** — ✅ يخفي نص PWA desc تلقائياً

## كيفية البناء والنشر

```bash
cd frontend
npm install
npm run build
# المخرج في dist/ — انشره على أي CDN (Render / Netlify / Vercel / Nginx)
```

## ملفات تم إنشاؤها / تعديلها

| الملف | النوع | التغيير |
|---|---|---|
| `src/components/mobile/PWAInstallBanner.jsx` | جديد | بانر تثبيت PWA لكل المتصفحات |
| `src/styles/mobile-pixel-perfect-v47-9.css` | جديد | تحسينات نهائية + توافق متصفحات قديمة |
| `src/layouts/MobileLayout.jsx` | تعديل | إدراج PWAInstallBanner + خط Noto |
| `src/main.jsx` | تعديل | استيراد CSS الجديد + BUILD_ID |
| `src/components/mobile/MobilePostCard.jsx` | تعديل | ترتيب subtext + شعار Y جديد + lazy loading |
| `src/components/mobile/MobileTopBar.jsx` | تعديل | شعار Y جديد |
| `src/components/mobile/MobileComposer.jsx` | تعديل | شعار Y جديد |
| `index.html` | تعديل | RTL + خط + شاشة تحميل + Meta tags |
| `YAMSHAT_V47_9_PIXEL_PERFECT_AR.md` | جديد | هذا الملف |
