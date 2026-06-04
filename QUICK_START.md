# البدء السريع - Quick Start Guide

## 🚀 للبدء فوراً

### 1. نسخ الملفات الجديدة
```bash
# نسخ ملفات الباك اند
cp backend/app/models/live_viewers.py backend/app/models/
cp backend/app/api/live_stream_routes.py backend/app/api/
cp backend/app/schemas/live.py backend/app/schemas/
cp services/live-service/comprehensive_live_service.py services/live-service/

# نسخ ملفات الأمامي
cp frontend/src/services/api/advancedLiveStreamApi.js frontend/src/services/api/
cp frontend/src/components/live/ViewersManagementPanel.jsx frontend/src/components/live/
cp frontend/src/pages/LiveStudio_Enhanced.jsx frontend/src/pages/
cp frontend/src/styles/viewers-management.css frontend/src/styles/
```

### 2. إضافة المسارات في الباك اند
```python
# في app/main.py
from app.api.live_stream_routes import router as live_router

app.include_router(live_router)
```

### 3. تشغيل الهجرات
```bash
alembic upgrade head
```

### 4. بدء الخادم
```bash
# الباك اند
uvicorn app.main:app --reload

# الأمامي (في نافذة أخرى)
npm start
```

### 5. اختبار البث
```bash
# الذهاب إلى
http://localhost:3000/live-studio

# أو اختبار API
curl -X POST http://localhost:8000/api/v1/live/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "البث الأول",
    "description": "وصف البث",
    "category": "ألعاب",
    "quality": "720p"
  }'
```

---

## 📝 الأزرار المتاحة

| الزر | الوظيفة | الحالة |
|------|--------|--------|
| ▶ بدء البث | إنشاء وبدء بث جديد | ✅ مرتبط |
| ⏹ إيقاف البث | إنهاء البث المباشر | ✅ مرتبط |
| 📷 تبديل الكاميرا | تشغيل/إيقاف الكاميرا | ✅ مرتبط |
| 🎤 تبديل الميكروفون | كتم/تشغيل الصوت | ✅ مرتبط |
| ⏺ التسجيل | بدء/إيقاف التسجيل | ✅ مرتبط |

---

## 🎮 ميزات الإدارة

### إدارة المشتركين
- عرض قائمة المشاهدين الحاليين
- تصفية المشاهدين (الكل، المكتومون، المحظورون)
- إجراءات سريعة:
  - 🔇 كتم الصوت / رفع الكتم
  - 🚫 حظر / رفع الحظر
  - ❌ إزالة من البث

### الإحصائيات
- عدد المشاهدين الحاليين
- إجمالي الإعجابات
- عدد الهدايا المرسلة
- مدة البث
- صحة البث

### الهدايا
- 🌹 وردة (10 نقاط)
- ☕ قهوة (50 نقطة)
- 💜 قلب كبير (100 نقطة)
- ⭐ نجمة (250 نقطة)
- 👑 تاج ملكي (1000 نقطة)

---

## 🔌 نقاط API الرئيسية

```
POST   /api/v1/live/create              ✅ إنشاء بث
POST   /api/v1/live/{stream_id}/start   ✅ بدء البث
POST   /api/v1/live/{stream_id}/end     ✅ إنهاء البث
GET    /api/v1/live/{stream_id}/viewers ✅ المشاهدون
POST   /api/v1/live/{stream_id}/mute    ✅ كتم المستخدم
POST   /api/v1/live/{stream_id}/ban     ✅ حظر المستخدم
PUT    /api/v1/live/{stream_id}/camera  ✅ تحديث الكاميرا
GET    /api/v1/live/{stream_id}/stats   ✅ الإحصائيات
```

---

## 🧪 اختبار سريع

### اختبار إنشاء بث
```bash
curl -X POST http://localhost:8000/api/v1/live/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "اختبار",
    "description": "بث اختباري",
    "category": "ألعاب",
    "quality": "720p"
  }'
```

### اختبار كتم المستخدم
```bash
curl -X POST http://localhost:8000/api/v1/live/stream_1_123/mute \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 5,
    "moderator_id": 1,
    "reason": "سبام",
    "duration_minutes": 5
  }'
```

### اختبار حظر المستخدم
```bash
curl -X POST http://localhost:8000/api/v1/live/stream_1_123/ban \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 5,
    "moderator_id": 1,
    "reason": "سلوك سيء",
    "duration": "temporary"
  }'
```

---

## 📊 الجداول الجديدة

```sql
-- عرض الجداول الجديدة
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'live_%';

-- النتيجة المتوقعة:
-- live_stream_viewers
-- live_stream_sessions
-- live_stream_host_settings
-- live_stream_camera_states
```

---

## 🐛 استكشاف الأخطاء

### خطأ: "الجداول غير موجودة"
```bash
# الحل: تشغيل الهجرات
alembic upgrade head
```

### خطأ: "CORS"
```python
# تحقق من إعدادات CORS في main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### خطأ: "الكاميرا لا تعمل"
```javascript
// تحقق من أذونات المتصفح
// اسمح بالوصول إلى الكاميرا والميكروفون
```

---

## 📚 الملفات المهمة

| الملف | الوصف |
|------|--------|
| `LIVE_STREAM_ENHANCEMENTS.md` | توثيق شامل للميزات |
| `INTEGRATION_GUIDE.md` | دليل التكامل التفصيلي |
| `FILES_SUMMARY.md` | ملخص الملفات المضافة |
| `backend/app/models/live_viewers.py` | نماذج قاعدة البيانات |
| `backend/app/api/live_stream_routes.py` | مسارات API |
| `frontend/src/pages/LiveStudio_Enhanced.jsx` | صفحة البث |
| `frontend/src/components/live/ViewersManagementPanel.jsx` | لوحة إدارة المشاهدين |

---

## ✅ قائمة التحقق

- [ ] تم نسخ جميع الملفات الجديدة
- [ ] تم إضافة المسارات في main.py
- [ ] تم تشغيل الهجرات
- [ ] تم اختبار نقاط API
- [ ] تم اختبار الواجهة الأمامية
- [ ] تم التحقق من الأمان
- [ ] تم النشر

---

## 🎯 الخطوات التالية

1. ✅ نسخ الملفات
2. ✅ تشغيل الهجرات
3. ✅ اختبار API
4. ✅ اختبار الواجهة الأمامية
5. ✅ النشر في الإنتاج

---

**آخر تحديث:** يونيو 2026
**الإصدار:** 1.0.0
