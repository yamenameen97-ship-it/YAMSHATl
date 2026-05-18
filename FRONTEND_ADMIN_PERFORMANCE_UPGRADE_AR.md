# ترقية الفرونت إند — لوحة الأدمن والأداء

تم تنفيذ المطلوب في هذا التحديث داخل الفرونت إند:

## لوحة الأدمن
- مركز بلاغات جديد في المسار `/admin/reports`
- Review Queue بفلترة + عرض افتراضي Windowed List لتخفيف الضغط
- Moderation Tools سريعة داخل شاشة البلاغات
- Dashboard مطور بإحصائيات حية: Active Users / Traffic / Growth / Live Metrics
- إضافة شاشة سجل نشاط الأدمن في المسار `/admin/audit`
- ربط dashboard و audit مع socket updates عند توفرها

## الأداء والجوال
- تحسين Vite build لتقليل حجم الـ JS bundle
- تفعيل minify + css minify + chunk split إضافي لـ libsignal
- تحسين صفحة الريلز لتعمل على الأجهزة الضعيفة:
  - unload hidden videos
  - preload nearby videos
  - adaptive quality
  - requestAnimationFrame scroll handling
  - windowed rendering around active reel

## ملف المكتبات
- تم إضافة/تحديث الملف: `frontend/DEPLOY_REQUIRED_LIBRARIES_AR.txt`
- يحتوي على المكتبات المطلوبة وقت النشر

## ملاحظة
- الملف النهائي المضغوط لا يحتوي على node_modules.
