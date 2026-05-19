# تعليمات سريعة: تفعيل نظام مسح الكاش التلقائي

## الخطوات السريعة (5 دقائق)

### 1️⃣ تحديث ملف main.jsx

افتح `frontend/src/main.jsx` وأضف السطور التالية في البداية:

```javascript
// ✅ أضف هذا الاستيراد
import { registerServiceWorker } from './service-worker-manager';
```

ثم أضف هذا الكود بعد إنشاء root:

```javascript
// ✅ أضف هذا بعد root.render()
window.addEventListener('load', async () => {
  // تسجيل Service Worker المحسّن
  await registerServiceWorker();
});
```

**أو انسخ المثال الكامل من `frontend/src/main.jsx.example`**

### 2️⃣ اختبر التحديث

```bash
cd frontend

# بناء التطبيق (سيحدّث الكاش تلقائياً)
npm run build

# عرض النتيجة
npm run preview
```

### 3️⃣ تحقق من الملفات

تأكد من وجود هذه الملفات:

```
✅ frontend/scripts/cache-buster.js
✅ frontend/public/sw-enhanced.js
✅ frontend/src/service-worker-manager.js
✅ frontend/package.json (محدّث)
```

### 4️⃣ انشر التحديثات

```bash
# من مجلد المشروع الرئيسي
git add .
git commit -m "إضافة نظام مسح الكاش التلقائي"
git push

# سيتم النشر تلقائياً على Render
```

## ماذا يحدث الآن؟

✅ **عند كل بناء جديد:**
- يتم تحديث رقم الإصدار تلقائياً
- يتم مسح الكاش القديم
- يحصل المستخدمون على أحدث نسخة

✅ **عند فتح المستخدمين للتطبيق:**
- يظهر إخطار "تحديث جديد متاح"
- يمكنهم الضغط على "تحديث الآن"
- يتم تحميل النسخة الجديدة

✅ **كل 5 دقائق:**
- يتم البحث عن تحديثات جديدة تلقائياً
- عند توفر تحديث، يتم إخطار المستخدم

## اختبار محلي

```bash
# 1. بناء التطبيق
npm run build

# 2. عرض النسخة المبنية
npm run preview

# 3. افتح المتصفح على http://localhost:4173

# 4. افتح Developer Tools (F12)
# 5. اذهب إلى Application > Service Workers
# 6. يجب أن تري Service Worker نشط

# 7. عدّل ملف ما وأعد البناء
npm run build

# 8. حدّث الصفحة في المتصفح
# 9. يجب أن تري إخطار التحديث
```

## استكشاف الأخطاء

### ❌ لا يظهر إخطار التحديث

**تحقق من:**
1. هل `registerServiceWorker()` يتم استدعاؤه في `main.jsx`؟
2. افتح Developer Tools وتحقق من الأخطاء في Console
3. تحقق من أن `sw-enhanced.js` موجود في `frontend/public/`

### ❌ Service Worker لا يتم تسجيله

**جرّب:**
1. مسح كاش المتصفح (Ctrl+Shift+Delete)
2. إغلاق وفتح المتصفح من جديد
3. تحقق من أن JavaScript مفعّل

### ❌ الملفات القديمة لا تزال تظهر

**الحل:**
1. تأكد من تشغيل `npm run build` وليس `npm run dev`
2. مسح كاش المتصفح يدوياً
3. تحقق من أن `cache-buster.js` قد حدّث الإصدار

## الملفات الجديدة

| الملف | الوصف |
|------|-------|
| `frontend/scripts/cache-buster.js` | سكريبت تحديث الإصدار التلقائي |
| `frontend/public/sw-enhanced.js` | Service Worker محسّن مع كاش ذكي |
| `frontend/src/service-worker-manager.js` | مدير Service Worker والتحديثات |
| `frontend/src/main.jsx.example` | مثال على التكامل |
| `CACHE_BUSTING_GUIDE_AR.md` | دليل شامل (هذا الملف) |

## الأوامر المفيدة

```bash
# تحديث الإصدار يدوياً
npm run cache-buster

# بناء مع تحديث الإصدار تلقائياً
npm run build

# عرض النسخة المبنية
npm run preview

# تطوير محلي
npm run dev
```

## نصائح مهمة

💡 **استخدم `npm run build` دائماً للنشر**
- لا تستخدم `npm run dev` للنشر
- فقط `npm run build` يحدّث الإصدار تلقائياً

💡 **راقب الكاش في Developer Tools**
- Application > Cache Storage
- يجب أن تري كاش جديد بعد كل بناء

💡 **اختبر قبل النشر**
- استخدم `npm run preview` لاختبار النسخة المبنية
- تأكد من أن التحديثات تعمل بشكل صحيح

💡 **أخبر المستخدمين**
- أخبرهم بضرورة تحديث الصفحة عند ظهور الإخطار
- الإخطار يظهر تلقائياً عند توفر تحديث

## الدعم

إذا واجهت مشاكل:
1. تحقق من أن جميع الملفات موجودة
2. افتح Developer Tools وتحقق من الأخطاء
3. جرّب مسح كاش المتصفح
4. أعد تحميل الصفحة (Ctrl+F5)

---

**تم! نظام مسح الكاش التلقائي جاهز الآن! 🚀**
