# معمارية تطبيق Yamshat الموحدة

## نظرة عامة

تم إعادة هيكلة المشروع لاتباع معمارية نظيفة وموحدة تعتمد على فصل الاهتمامات (Separation of Concerns) والمبادئ SOLID.

## البنية الهرمية

```
frontend/src/
├── core/                          # الأساسيات والخدمات الأساسية
│   ├── api/                      # طبقة API الموحدة
│   │   ├── client.js            # عميل HTTP الموحد (Axios)
│   │   ├── interceptors.js      # معالجات الطلبات والاستجابات
│   │   ├── errorHandler.js      # معالجة الأخطاء الموحدة
│   │   └── cache.js             # نظام التخزين المؤقت
│   ├── socket/                   # إدارة الاتصالات الفورية
│   │   ├── manager.js           # مدير Socket.io الموحد
│   │   ├── events.js            # تعريفات الأحداث
│   │   └── handlers.js          # معالجات الأحداث
│   ├── store/                    # إدارة الحالة الموحدة
│   │   ├── index.js             # متجر Zustand الرئيسي
│   │   ├── slices/              # شرائح الحالة
│   │   └── middleware.js        # وسيط الحالة
│   ├── auth/                     # إدارة المصادقة
│   │   ├── sessionManager.js    # مدير الجلسة
│   │   ├── tokenManager.js      # مدير الرموز
│   │   └── permissions.js       # إدارة الصلاحيات
│   └── utils/                    # أدوات عامة
│       ├── logger.js            # نظام السجلات الموحد
│       ├── retry.js             # استراتيجية إعادة المحاولة
│       └── validators.js        # التحقق من الصحة
│
├── infrastructure/               # البنية التحتية والخدمات
│   ├── services/                # خدمات الأعمال
│   │   ├── chat/
│   │   ├── media/
│   │   ├── notifications/
│   │   ├── live/
│   │   └── search/
│   ├── hooks/                    # React Hooks المخصصة
│   │   ├── useApi.js
│   │   ├── useSocket.js
│   │   ├── useAuth.js
│   │   └── useOfflineQueue.js
│   └── middleware/              # وسيط التطبيق
│       ├── errorBoundary.js
│       └── authGuard.js
│
├── domain/                       # منطق النطاق (Business Logic)
│   ├── models/                  # نماذج البيانات
│   ├── entities/                # الكيانات
│   └── repositories/            # مستودعات البيانات
│
├── presentation/                # طبقة العرض
│   ├── pages/                   # الصفحات الرئيسية
│   ├── components/              # المكونات المعاد استخدامها
│   │   ├── common/
│   │   ├── layout/
│   │   ├── ui/
│   │   └── feature-specific/
│   ├── layouts/                 # تخطيطات الصفحات
│   └── styles/                  # الأنماط الموحدة
│
├── App.jsx                      # نقطة الدخول الرئيسية
├── main.jsx                     # نقطة البداية
└── index.html                   # ملف HTML الرئيسي
```

## مبادئ المعمارية

### 1. فصل الاهتمامات (Separation of Concerns)

- **Core**: يحتوي على الخدمات الأساسية والأدوات العامة
- **Infrastructure**: يحتوي على الخدمات والـ Hooks والوسيط
- **Domain**: يحتوي على منطق الأعمال والنماذج
- **Presentation**: يحتوي على المكونات وصفحات العرض

### 2. إعادة الاستخدام (Reusability)

- جميع الخدمات والـ Hooks والمكونات يمكن إعادة استخدامها في أماكن متعددة
- تجنب تكرار الأكواد من خلال استخراج الوظائف المشتركة

### 3. قابلية الاختبار (Testability)

- كل وحدة يمكن اختبارها بشكل مستقل
- الخدمات منفصلة عن المكونات

### 4. قابلية الصيانة (Maintainability)

- بنية واضحة وسهلة الفهم
- أسماء موحدة ومعايير ثابتة

## معايير التسمية (Naming Conventions)

### الملفات والمجلدات

- **المجلدات**: بصيغة kebab-case (مثل `chat-service`)
- **الملفات**: بصيغة camelCase (مثل `chatService.js`)
- **المكونات**: بصيغة PascalCase (مثل `ChatComponent.jsx`)
- **الثوابت**: بصيغة UPPER_SNAKE_CASE (مثل `API_BASE_URL`)

### المتغيرات والدوال

- **المتغيرات**: camelCase (مثل `userData`)
- **الثوابت**: UPPER_SNAKE_CASE (مثل `MAX_RETRIES`)
- **الدوال**: camelCase (مثل `fetchUserData()`)
- **الدوال المعاودة (Hooks)**: useXxx (مثل `useAuth()`)

## إدارة الحالة (State Management)

- استخدام **Zustand** كمكتبة إدارة الحالة الموحدة
- تقسيم الحالة إلى شرائح منطقية (slices)
- كل شريحة مسؤولة عن جزء من الحالة

## طبقة API (API Layer)

- استخدام **Axios** كعميل HTTP موحد
- معالجات (Interceptors) موحدة للطلبات والاستجابات
- نظام تخزين مؤقت ذكي (Smart Caching)
- استراتيجية إعادة محاولة مع تراجع أسي (Exponential Backoff)

## إدارة الاتصالات (Socket Management)

- مدير Socket.io موحد مع معالجة الاتصال/قطع الاتصال
- قائمة انتظار للأحداث غير المتصلة (Offline Queue)
- معالجة تلقائية لإعادة الاتصال

## معالجة الأخطاء (Error Handling)

- معالج أخطاء موحد في جميع أنحاء التطبيق
- Error Boundary للمكونات
- رسائل خطأ واضحة وموحدة

## التخزين المؤقت (Caching)

- نظام تخزين مؤقت ذكي على مستوى API
- إمكانية التحكم في TTL (Time To Live)
- إمكانية إعادة التحديث القسري (Force Refresh)

## الأداء

- تقسيم الأكواد (Code Splitting) باستخدام Vite
- تحميل كسول (Lazy Loading) للمكونات
- تحسين الحزم (Bundle Optimization)

## الأمان

- إدارة الرموز (Token Management)
- حماية CSRF
- التحقق من الصلاحيات (RBAC)

## الخطوات التالية

1. نقل الخدمات الموجودة إلى المجلدات الجديدة
2. توحيد معالجة الأخطاء
3. توحيد إدارة الحالة
4. توحيد طبقة API
5. توحيد إدارة الاتصالات
6. اختبار التطبيق بالكامل
