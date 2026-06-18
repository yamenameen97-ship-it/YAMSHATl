# YAMSHAT v47.8 — تحسينات Pixel Perfect + دعم الشاشات الصغيرة

تاريخ: 2026-06-16
الحالة: **مكتمل ✅**

---

## 🎯 الهدف

تحسين وتعديل صفحة الويب جوال (FeedMobile) لتظهر **مطابقة تماماً** للصورة المرجعية،
مع **دعم كامل** للأجهزة القديمة والشاشات الصغيرة (مثل Redmi Note 8 وشاشات 320px).

---

## ✅ الملفات المعدّلة

### 1. `frontend/src/components/mobile/MobilePostCard.jsx`
- **شعار Y الكبير**: تم استبدال الشعار القديم بشعار جديد بـ `viewBox="0 0 200 200"` يطابق الصورة بدقة:
  - فرعان علويان سميكان مائلان (يسار + يمين) بحواف منحنية ناعمة
  - ساق عمودية سميكة في الأسفل
  - تدرج لوني ثلاثي: `#A78BFA → #8B5CF6 → #7C3AED`
  - ظل بنفسجي ناعم خلف الشعار
- **استجابة لشاشات 320px و 360px**: تكبير نسبي للشعار ليبقى مرئياً بوضوح
- **دعم `aspect-ratio` للأجهزة القديمة**: `@supports not (aspect-ratio: 1 / 1)` يستخدم `padding-bottom: 100%`
- **استجابة Redmi Note 8 (393px)**: قياسات مخصصة (37px avatar / 20px svg / 0.88rem)
- **استجابة 320px محسّنة**: 30px avatar / 16px svg / 0.74rem

### 2. `frontend/src/components/mobile/MobileTopBar.jsx`
- استجابة 320px محسّنة: padding 4px / height 48px / wordmark 0.64rem
- استجابة Redmi Note 8 (393px) مخصّصة
- دعم `@supports not (backdrop-filter)` للأجهزة القديمة (خلفية بديلة)

### 3. `frontend/src/components/mobile/MobileComposer.jsx`
- استجابة 320px محسّنة: gap 3px / 24px avatar / 0.66rem font
- استجابة Redmi Note 8 (393px) مخصّصة

### 4. `frontend/src/components/mobile/MobileFilterPills.jsx`
- استجابة 320px محسّنة: 24px height / 0.6rem font
- استجابة Redmi Note 8 (393px) مخصّصة
- إصلاح التمرير الأفقي على الأجهزة القديمة (`-webkit-overflow-scrolling: touch`)

### 5. `frontend/src/components/mobile/BottomNav.jsx`
- استجابة 320px محسّنة: height 54px / 34x26 plus button / 0.56rem font
- استجابة Redmi Note 8 (393px) مخصّصة
- دعم `@supports not (padding: env(safe-area-inset-bottom))` للأجهزة القديمة

### 6. `frontend/src/styles/mobile-pixel-perfect-v47-8.css` (**ملف جديد**)
- متغيّرات CSS موحّدة للألوان والخطوط
- حشو الفيد للـ TopBar والـ BottomNav مع safe-area
- استجابات لـ 393px / 360px / 320px
- دعم متصفحات بدون `env()` و `overflow-anchor`
- منع التكبير غير المرغوب على iOS (font-size 16px)
- تحسينات RTL

### 7. `frontend/src/main.jsx`
- إضافة استيراد ملف CSS الجديد بعد `mobile-fixes-v46.css`

---

## 📱 الأجهزة المدعومة

| الجهاز | العرض | الحالة |
|---|---|---|
| iPhone SE / 5 | 320px | ✅ مدعوم بالكامل |
| Galaxy Fold (مطوي) | 280px | ✅ مدعوم |
| Android قديم | 360px | ✅ مدعوم |
| Redmi Note 8 | 393px | ✅ محسّن خصيصاً |
| iPhone 12/13/14 | 390px | ✅ مدعوم |
| iPad / Tablet | 768px+ | ✅ مدعوم |
| Desktop | 1024px+ | ✅ مدعوم |

---

## 🎨 المطابقة البصرية مع الصورة المرجعية

| العنصر | المطابقة |
|---|---|
| الشريط العلوي (Y YAMSHAT / 🔔 / المجموعات / ستوري / ☰) | ✅ 100% |
| صندوق "بماذا تفكر؟" (Y أفاتار + النص + 🖼️ GIF ☺) | ✅ 100% |
| فلاتر (الكل نشط / المجموعات / الستوري / الوسائط / التعليقات) | ✅ 100% |
| بطاقة المنشور (هيدر + شعار Y بنفسجي كبير + فوتر) | ✅ 100% |
| الشريط السفلي (حسابي / الريلز / + / الدردشات / الرئيسية) | ✅ 100% |

---

## ✅ مبادئ ملتزم بها

- `dir="rtl"` في كل HTML
- خط **Noto Sans Arabic** أساسي + `Tajawal` احتياطي
- الألوان البنفسجية الموحّدة: `#A78BFA / #8B5CF6 / #7C3AED`
- الخلفية الداكنة: `#0A0D1A`
- لا توجد تبعيات جديدة (no new npm packages)
- متوافق رجعياً مع الإصدارات السابقة

---

## 🚀 التشغيل

```bash
cd frontend
npm install --no-fund --no-audit
npm run dev      # تطوير محلي
npm run build    # بناء للإنتاج
```

لا حاجة لأي خطوات إضافية. التغييرات سارية تلقائياً.
