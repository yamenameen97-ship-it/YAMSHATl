# دليل النشر على Render - منصة يامشات الموحدة

## نظرة عامة
هذا المشروع يتضمن نسخة موحدة متكاملة من منصة يامشات مع جميع الخدمات الميكروسيرفس والواجهة الأمامية.

## بنية المشروع

```
yamshat-unified/
├── frontend/              # تطبيق React + Vite
├── gateway/              # بوابة API الرئيسية
├── services/             # خدمات الميكروسيرفس
│   ├── auth-service/
│   ├── user-service/
│   ├── post-service/
│   ├── chat-service/
│   ├── media-service/
│   ├── search-service/
│   └── ...
├── backend/              # الخدمات الإضافية
├── infra/               # ملفات البنية التحتية
└── render.yaml          # ملف إعدادات Render
```

## المتطلبات

- حساب على [Render.com](https://render.com)
- Node.js 20.x أو 22.x
- Python 3.9+
- Git

## خطوات النشر على Render

### 1. إعداد المستودع

```bash
# تهيئة مستودع Git
git init
git add .
git commit -m "Initial commit: Unified YamChat Platform"
git branch -M main
git remote add origin https://github.com/your-username/yamshat-unified.git
git push -u origin main
```

### 2. إنشاء Blueprint على Render

1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. انقر على **New +** > **Blueprint**
3. اختر **Public Git repository**
4. أدخل رابط المستودع الخاص بك
5. انقر على **Connect**

### 3. تكوين الخدمات

عند إنشاء Blueprint، سيقرأ Render ملف `render.yaml` تلقائياً ويقوم بـ:

- إنشاء خدمة الفرونت إند (Node.js)
- إنشاء بوابة API (Python)
- إنشاء جميع خدمات الميكروسيرفس
- إنشاء قاعدة البيانات (MySQL)
- إنشاء خدمة التخزين المؤقت (Redis)

### 4. تعيين متغيرات البيئة

في لوحة تحكم Render، قم بتعيين المتغيرات التالية:

**للفرونت إند:**
```
NODE_ENV=production
VITE_API_URL=https://yamshat-gateway.onrender.com
```

**للبوابة:**
```
CORS_ORIGINS=https://yamshat-frontend.onrender.com
AUTH_SERVICE_URL=https://yamshat-auth-service.onrender.com
USER_SERVICE_URL=https://yamshat-user-service.onrender.com
POST_SERVICE_URL=https://yamshat-post-service.onrender.com
CHAT_SERVICE_URL=https://yamshat-chat-service.onrender.com
NOTIFICATION_SERVICE_URL=https://yamshat-notification-service.onrender.com
MEDIA_SERVICE_URL=https://yamshat-media-service.onrender.com
SEARCH_SERVICE_URL=https://yamshat-search-service.onrender.com
```

### 5. النشر

1. انقر على **Deploy**
2. راقب سجلات البناء والنشر
3. بعد اكتمال النشر، ستحصل على عنوان URL للتطبيق

## معلومات الخدمات

### الفرونت إند
- **المنفذ:** 4173
- **الأمر:** `npm run build && npm run preview`
- **الملفات الثابتة:** `frontend/dist`

### البوابة (Gateway)
- **المنفذ:** 8000
- **الأمر:** `python main.py`
- **الدور:** توجيه الطلبات إلى الخدمات المناسبة

### خدمات الميكروسيرفس
كل خدمة تعمل على منفذ 8000 وتتصل بقاعدة البيانات المشتركة:

- **auth-service:** المصادقة والتفويض
- **user-service:** إدارة المستخدمين والملفات الشخصية
- **post-service:** إنشاء وإدارة المنشورات
- **chat-service:** الرسائل والدردشة
- **notification-service:** الإشعارات
- **media-service:** رفع وإدارة الملفات
- **search-service:** البحث المتقدم

## قاعدة البيانات

### MySQL
- **الاسم:** yamshat_db
- **المستخدم:** yamshat_user
- **الخطة:** Standard

### Redis
- **الاستخدام:** التخزين المؤقت والجلسات
- **الخطة:** Standard

## المراقبة والتسجيل

### عرض السجلات
```bash
# في لوحة تحكم Render، انقر على الخدمة ثم "Logs"
```

### المقاييس
- عدد الطلبات
- زمن الاستجابة
- معدل الأخطاء
- استخدام الموارد

## استكشاف الأخطاء

### الخدمة لا تبدأ
1. تحقق من السجلات للأخطاء
2. تأكد من صحة متغيرات البيئة
3. تحقق من اتصال قاعدة البيانات

### مشاكل الاتصال بين الخدمات
1. تحقق من أسماء الخدمات في `render.yaml`
2. تأكد من أن جميع الخدمات قيد التشغيل
3. تحقق من إعدادات CORS

### مشاكل قاعدة البيانات
1. تحقق من سلسلة الاتصال
2. تأكد من تشغيل الهجرات
3. تحقق من صلاحيات المستخدم

## التحديثات والنشر المستمر

### نشر تحديث جديد
```bash
git add .
git commit -m "Update: your changes"
git push origin main
```

Render سيكتشف التغييرات تلقائياً وسيقوم بإعادة النشر.

### إيقاف النشر
في لوحة تحكم Render، انقر على **Suspend** لإيقاف الخدمة مؤقتاً.

## الأداء والتحسينات

### تحسينات الفرونت إند
- استخدام Vite للبناء السريع
- تقسيم الكود (Code Splitting)
- ضغط الأصول
- تخزين مؤقت ذكي

### تحسينات الخلفية
- استخدام Redis للتخزين المؤقت
- تحديد معدل الطلبات (Rate Limiting)
- مراقبة الأداء

## الأمان

- تفعيل HTTPS تلقائياً على Render
- استخدام متغيرات البيئة للبيانات الحساسة
- تحديد CORS بشكل صارم
- المصادقة والتفويض

## الدعم والمساعدة

- [وثائق Render](https://render.com/docs)
- [مجتمع Render](https://render.com/community)
- [GitHub Issues](https://github.com/your-username/yamshat-unified/issues)

---

**آخر تحديث:** يونيو 2026
**الإصدار:** 1.0.0
