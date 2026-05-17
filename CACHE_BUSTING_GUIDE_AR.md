# دليل نظام مسح الكاش التلقائي

## المقدمة

تم إضافة نظام متقدم لمسح الكاش التلقائي إلى مشروع Yamshat. هذا النظام يضمن أن المستخدمين يحصلون دائماً على أحدث نسخة من التطبيق عند إضافة ميزات جديدة أو إصلاح أخطاء.

## المشكلة التي يحلها

عند نشر تحديثات جديدة للتطبيق، قد يواجه المستخدمون المشاكل التالية:

- **الكاش القديم**: يستمر المتصفح في استخدام نسخة قديمة من الملفات
- **عدم ظهور الميزات الجديدة**: الميزات المضافة لا تظهر حتى بعد تحديث الصفحة
- **الأخطاء المستمرة**: الأخطاء المصلحة تظهر مجدداً لأن الكود القديم لا يزال مخزناً

## كيفية عمل النظام

### 1. تحديث رقم الإصدار التلقائي

عند تشغيل أمر البناء، يتم تحديث رقم الإصدار تلقائياً:

```bash
npm run build
```

هذا الأمر يقوم بـ:
1. تشغيل سكريبت `cache-buster.js`
2. تحديث رقم الإصدار في `sw-enhanced.js`
3. بناء التطبيق بـ Vite

**مثال على رقم الإصدار:**
```
yamshat-v20260518-143022-1716033622
```

يتضمن:
- التاريخ: `20260518` (2026-05-18)
- الوقت: `143022` (14:30:22)
- الطابع الزمني: `1716033622`

### 2. Service Worker المحسّن

تم إنشاء `sw-enhanced.js` بميزات متقدمة:

#### أ. مسح الكاش القديم تلقائياً
```javascript
// عند تفعيل Service Worker الجديد، يتم حذف جميع نسخ الكاش القديمة
async function clearLegacyCaches() {
  const keys = await caches.keys();
  const cachePromises = keys
    .filter((key) => !key.startsWith(VERSION))
    .map((key) => caches.delete(key));
  
  await Promise.all(cachePromises);
}
```

#### ب. استراتيجيات كاش ذكية

| نوع الملف | الاستراتيجية | الفائدة |
|---------|-----------|--------|
| HTML | Network-First | الحصول على أحدث نسخة من الصفحة |
| JS/CSS | Network-First | تحديث الكود والأنماط فوراً |
| الصور/الفيديو | Cache-First | أداء أفضل وتقليل استهلاك البيانات |
| API | Network-First | البيانات الحديثة دائماً |

#### ج. إخطار المستخدمين بالتحديثات

عند توفر تحديث جديد، يظهر إخطار جميل للمستخدم:

```javascript
// إظهار إخطار التحديث
showUpdateNotification(version, message);
```

### 3. مدير Service Worker

تم إنشاء `service-worker-manager.js` لإدارة Service Worker:

```javascript
// تسجيل Service Worker
await registerServiceWorker();

// الاستماع للتحديثات
window.addEventListener('yamshat:update-available', (event) => {
  console.log('تحديث جديد متاح:', event.detail.version);
});

// فحص دوري للتحديثات (كل 5 دقائق)
// يتم تلقائياً عند التسجيل
```

## التثبيت والاستخدام

### الخطوة 1: التأكد من وجود الملفات الجديدة

تحقق من وجود الملفات التالية:

```
frontend/
├── scripts/
│   └── cache-buster.js          ✅ جديد
├── public/
│   └── sw-enhanced.js           ✅ جديد
├── src/
│   └── service-worker-manager.js ✅ جديد
└── package.json                  ✅ محدّث
```

### الخطوة 2: تحديث ملف main.jsx

قم بتحديث `frontend/src/main.jsx` لاستخدام مدير Service Worker الجديد:

```javascript
// أضف هذا في بداية الملف
import { registerServiceWorker } from './service-worker-manager';

// أضف هذا بعد تحميل التطبيق
window.addEventListener('load', async () => {
  // تسجيل Service Worker المحسّن
  await registerServiceWorker();
});

// الاستماع للتحديثات
window.addEventListener('yamshat:update-available', (event) => {
  console.log('تحديث جديد متاح:', event.detail);
});
```

### الخطوة 3: البناء والنشر

```bash
# البناء (سيحدّث الكاش تلقائياً)
npm run build

# النشر على Render أو أي منصة أخرى
# التحديثات ستظهر تلقائياً للمستخدمين
```

## الاستخدام المتقدم

### مسح الكاش يدوياً

إذا أردت مسح الكاش يدوياً من داخل التطبيق:

```javascript
import { clearCache } from './service-worker-manager';

// مسح جميع الكاش
await clearCache();
```

### إجبار تحديث فوري

```javascript
import { forceUpdate } from './service-worker-manager';

// إجبار التحديث الفوري
await forceUpdate();
```

### الحصول على معلومات Service Worker

```javascript
import { getServiceWorkerInfo } from './service-worker-manager';

const info = getServiceWorkerInfo();
console.log('Service Worker مسجل:', info.registered);
console.log('Service Worker نشط:', info.active);
```

## الفوائد الرئيسية

✅ **تحديث تلقائي**: لا حاجة لتحديث رقم الإصدار يدوياً  
✅ **مسح الكاش الذكي**: حذف الكاش القديم تلقائياً عند كل نشر  
✅ **إخطارات المستخدمين**: إعلام المستخدمين بالتحديثات الجديدة  
✅ **فحص دوري**: البحث عن التحديثات كل 5 دقائق  
✅ **استراتيجيات كاش محسّنة**: أداء أفضل مع ضمان الحصول على أحدث البيانات  
✅ **دعم Offline**: التطبيق يعمل بدون إنترنت مع أحدث بيانات مخزنة  

## استكشاف الأخطاء

### المشكلة: لا يزال المستخدمون يرون النسخة القديمة

**الحل:**
1. تأكد من تشغيل `npm run build` (وليس `npm run dev`)
2. تحقق من أن `cache-buster.js` قد حدّث رقم الإصدار
3. اطلب من المستخدمين مسح كاش المتصفح يدوياً:
   - Chrome: Ctrl+Shift+Delete
   - Firefox: Ctrl+Shift+Delete
   - Safari: Cmd+Option+E

### المشكلة: Service Worker لا يتم تسجيله

**الحل:**
1. تأكد من أن `sw-enhanced.js` موجود في `frontend/public/`
2. تحقق من أن `service-worker-manager.js` يتم استيراده بشكل صحيح
3. افتح Developer Tools وتحقق من الأخطاء في Console

### المشكلة: الإخطار لا يظهر

**الحل:**
1. تحقق من أن `registerServiceWorker()` يتم استدعاؤه في `main.jsx`
2. تأكد من أن المتصفح يدعم Service Worker
3. تحقق من أن JavaScript مفعّل في المتصفح

## الملفات المعدّلة والجديدة

### ملفات جديدة:
- `frontend/scripts/cache-buster.js` - سكريبت تحديث الإصدار
- `frontend/public/sw-enhanced.js` - Service Worker محسّن
- `frontend/src/service-worker-manager.js` - مدير Service Worker

### ملفات معدّلة:
- `frontend/package.json` - إضافة سكريبت `cache-buster`

### ملفات يجب تحديثها:
- `frontend/src/main.jsx` - إضافة تسجيل Service Worker

## أفضل الممارسات

1. **استخدم `npm run build` دائماً**: تأكد من تشغيل الأمر الصحيح للبناء
2. **راقب الكاش**: استخدم Developer Tools لمراقبة حالة الكاش
3. **اختبر التحديثات**: اختبر التحديثات محلياً قبل النشر
4. **أخبر المستخدمين**: أخبر المستخدمين بضرورة تحديث الصفحة عند ظهور الإخطار

## الدعم والمساعدة

إذا واجهت أي مشاكل:

1. تحقق من أن جميع الملفات موجودة
2. تحقق من أن `package.json` يحتوي على سكريبت `cache-buster`
3. تحقق من أن `main.jsx` يستدعي `registerServiceWorker()`
4. افتح Developer Tools وتحقق من الأخطاء
5. جرّب مسح كاش المتصفح يدوياً

---

**تم إنشاء هذا النظام لضمان أن مستخدمو Yamshat يحصلون دائماً على أحدث نسخة من التطبيق! 🚀**
