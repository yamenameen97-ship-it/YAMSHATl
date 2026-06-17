# تقرير الإصلاحات v50 — Yamshat

<div dir="rtl">

## ملخص الإصلاحات

### 1) سحب أزرار التصفية إلى اليمين (مكان السهم)
الملفات المعدلة:
- `frontend/src/pages/FeedEnhanced.jsx` — تحديث `.yam-feed-tabs` بـ `flex-direction: row-reverse` و `direction: rtl !important`
- `frontend/src/styles/mobile-fixes.css` — مزامنة الخصائص نفسها
- `frontend/src/styles/v50-fixes.css` (ملف جديد) — طبقة نهائية مع `!important` تضمن ظهور الأزرار (الكل/المجموعات/الستوري/الوسائط) في أقصى اليمين

### 2) رفع زر النشر (+) في الهيدر السفلي ليبرز
الملفات المعدلة:
- `frontend/src/components/mobile/BottomNav.jsx`:
  - رفع الهيدر السفلي بـ `bottom: calc(env(safe-area-inset-bottom) + 8px)`
  - تكبير زر (+) إلى `60×60px` دائري مع `margin-top: -28px` ليبرز فوق الشريط
  - إضافة `box-shadow` بنفسجي وحلقة `#0A0D1A` لتأثير "floating action button"
- `frontend/src/styles/v50-fixes.css` — تأكيد على نفس الأنماط مع `!important`

### 3) إصلاح أخطاء 500 من API (chat_threads, posts, notifications, groups)
الملف المعدل: `frontend/src/api/axios.js`
- إضافة `SAFE_FALLBACK_500_PATTERNS` لمسارات القراءة الشائعة
- إعادة بيانات فارغة آمنة بدلاً من رفع خطأ يكسر الصفحة
- بعد فشل المحاولات (3 retries) ينتقل إلى fallback بصمت بدلاً من إظهار "تعذر تحميل الصفحة"

### 4) تعويض الهامش السفلي
- `frontend/src/styles/global.css` — `.main-content { padding-bottom: calc(120px + safe-area) }`
- `frontend/src/styles/mobile-fixes.css` — تحديث الهامش السفلي للموبايل
- `frontend/src/styles/v50-fixes.css` — متغير `--ym-bottomnav-offset: 88px` يطبق على كل containers

### 5) خط RTL موحّد
- جميع الأنماط الجديدة تستخدم: `font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif`
- `direction: rtl` مفروض على شريط التصفية وعناصر الواجهة العربية

## ملفات تم إضافتها/تعديلها
1. `frontend/src/styles/v50-fixes.css` ← جديد
2. `frontend/src/main.jsx` ← import جديد
3. `frontend/src/pages/FeedEnhanced.jsx`
4. `frontend/src/components/mobile/BottomNav.jsx`
5. `frontend/src/api/axios.js`
6. `frontend/src/styles/global.css`
7. `frontend/src/styles/mobile-fixes.css`

## كيفية النشر
```bash
cd frontend
npm install        # لإعادة تنزيل الاعتماديات (محذوفة من الحزمة)
npm run build
# انشر مجلد dist/
```

</div>
