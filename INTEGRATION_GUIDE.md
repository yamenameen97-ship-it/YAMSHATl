# دليل التكامل الشامل - Comprehensive Integration Guide

## نظرة عامة

هذا الدليل يشرح كيفية دمج جميع المكونات الجديدة للبث المباشر في مشروع يمشات.

---

## 📋 قائمة التحقق من التكامل

### 1. الباك اند (Backend)

#### أ. تثبيت النماذج الجديدة
```bash
# نسخ ملفات النماذج
cp backend/app/models/live_viewers.py backend/app/models/

# تشغيل الهجرات
alembic upgrade head
```

#### ب. إضافة المسارات الجديدة
```python
# في main.py أو app.py
from app.api.live_stream_routes import router as live_router

app.include_router(live_router, prefix="/api/v1")
```

#### ج. تثبيت الخدمات
```bash
# نسخ خدمة البث المباشر
cp services/live-service/comprehensive_live_service.py services/live-service/
```

#### د. إضافة Schemas
```bash
# نسخ ملف schemas
cp backend/app/schemas/live.py backend/app/schemas/
```

### 2. الأمامي (Frontend)

#### أ. تحديث واجهات API
```bash
# نسخ ملف API الجديد
cp frontend/src/services/api/advancedLiveStreamApi.js frontend/src/services/api/
```

#### ب. إضافة المكونات الجديدة
```bash
# نسخ مكون إدارة المشاهدين
cp frontend/src/components/live/ViewersManagementPanel.jsx frontend/src/components/live/

# نسخ صفحة البث المحسّنة
cp frontend/src/pages/LiveStudio_Enhanced.jsx frontend/src/pages/
```

#### ج. إضافة الأنماط
```bash
# نسخ ملف CSS
cp frontend/src/styles/viewers-management.css frontend/src/styles/
```

---

## 🔧 خطوات التكامل التفصيلية

### المرحلة 1: إعداد قاعدة البيانات

#### الخطوة 1.1: إنشاء ملف هجرة جديد
```bash
alembic revision --autogenerate -m "Add live stream tables"
```

#### الخطوة 1.2: تطبيق الهجرات
```bash
alembic upgrade head
```

#### الخطوة 1.3: التحقق من الجداول
```sql
-- التحقق من إنشاء الجداول
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'live_%';
```

### المرحلة 2: إعداد الباك اند

#### الخطوة 2.1: تثبيت المسارات
```python
# في app/main.py
from app.api.live_stream_routes import router as live_router

# إضافة المسارات
app.include_router(live_router)
```

#### الخطوة 2.2: اختبار المسارات
```bash
# بدء الخادم
uvicorn app.main:app --reload

# اختبار نقطة API
curl -X POST http://localhost:8000/api/v1/live/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "البث الأول",
    "description": "وصف البث",
    "category": "ألعاب",
    "quality": "720p"
  }'
```

### المرحلة 3: إعداد الأمامي

#### الخطوة 3.1: تحديث ملف التوجيه
```javascript
// في frontend/src/utils/router.js أو App.jsx
import LiveStudioEnhanced from '../pages/LiveStudio_Enhanced';

// إضافة المسار
const routes = [
  // ...
  {
    path: '/live-studio',
    element: <LiveStudioEnhanced />,
  },
];
```

#### الخطوة 3.2: تحديث الواجهة الأمامية
```javascript
// في الصفحة الرئيسية أو قائمة التنقل
import { useNavigate } from 'react-router-dom';

function Navigation() {
  const navigate = useNavigate();
  
  return (
    <button onClick={() => navigate('/live-studio')}>
      🎥 بدء البث المباشر
    </button>
  );
}
```

#### الخطوة 3.3: اختبار الواجهة الأمامية
```bash
# بدء خادم التطوير
npm start

# الانتقال إلى صفحة البث
# http://localhost:3000/live-studio
```

---

## 🧪 اختبار التكامل

### اختبار الوحدات (Unit Tests)

#### اختبار إنشاء البث
```python
# tests/test_live_stream.py
import pytest
from app.api.live_stream_routes import create_live_stream
from app.schemas.live import LiveStreamCreate

@pytest.mark.asyncio
async def test_create_live_stream(db):
    """اختبار إنشاء بث جديد"""
    stream_data = LiveStreamCreate(
        title="البث الاختباري",
        description="وصف الاختبار",
        category="ألعاب",
        quality="720p"
    )
    
    result = await create_live_stream(stream_data, db, current_user)
    
    assert result.stream_id is not None
    assert result.title == "البث الاختباري"
    assert result.status == "pending"
```

#### اختبار الحظر والكتم
```python
@pytest.mark.asyncio
async def test_mute_user(db):
    """اختبار كتم صوت المستخدم"""
    result = await mute_user(
        stream_id="stream_1_123",
        user_id=5,
        moderator_id=1,
        reason="سبام",
        duration_minutes=5,
        db=db
    )
    
    assert result["status"] == "success"
    assert result["action"] == "muted"
```

### اختبار التكامل (Integration Tests)

#### اختبار تدفق البث الكامل
```javascript
// frontend/src/__tests__/LiveStream.integration.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LiveStudioEnhanced from '../pages/LiveStudio_Enhanced';

describe('Live Stream Integration', () => {
  test('should create and start a live stream', async () => {
    render(<LiveStudioEnhanced />);
    
    // ملء نموذج البث
    fireEvent.change(screen.getByPlaceholderText('عنوان البث'), {
      target: { value: 'البث الاختباري' }
    });
    
    // بدء البث
    fireEvent.click(screen.getByText('بدء البث'));
    
    // التحقق من بدء البث
    await waitFor(() => {
      expect(screen.getByText('أنت الآن مباشر')).toBeInTheDocument();
    });
  });
  
  test('should mute a user', async () => {
    // ... اختبار كتم المستخدم
  });
});
```

### اختبار الأداء (Performance Tests)

```bash
# استخدام Apache JMeter أو Postman
# اختبار 100 مستخدم متزامن
# قياس الاستجابة والأداء
```

---

## 🚀 نشر في الإنتاج

### قائمة التحقق قبل النشر

- [ ] تشغيل جميع الاختبارات
- [ ] التحقق من الأداء
- [ ] مراجعة الأمان
- [ ] تحديث التوثيق
- [ ] إعداد نسخ احتياطية من قاعدة البيانات
- [ ] اختبار الهجرات
- [ ] التحقق من متغيرات البيئة

### خطوات النشر

#### 1. تحضير الخادم
```bash
# تحديث الكود
git pull origin main

# تثبيت الحزم الجديدة
pip install -r requirements.txt
npm install
```

#### 2. تشغيل الهجرات
```bash
# في بيئة الإنتاج
alembic upgrade head
```

#### 3. بناء الأمامي
```bash
# بناء الإصدار الإنتاجي
npm run build

# نسخ الملفات المبنية
cp -r build/* /var/www/yamshat/
```

#### 4. إعادة تشغيل الخدمات
```bash
# إعادة تشغيل الخادم
systemctl restart yamshat-api

# إعادة تشغيل الخادم الثابت
systemctl restart nginx
```

#### 5. التحقق من الحالة
```bash
# التحقق من صحة الخادم
curl -X GET http://localhost:8000/api/v1/health

# التحقق من السجلات
tail -f /var/log/yamshat/api.log
```

---

## 🔍 استكشاف الأخطاء

### المشاكل الشائعة والحلول

#### المشكلة 1: خطأ في الهجرات
```
Error: Can't find revision identified by 'abc123'
```

**الحل:**
```bash
# إعادة تعيين الهجرات
alembic stamp head
alembic upgrade head
```

#### المشكلة 2: خطأ CORS
```
Access to XMLHttpRequest blocked by CORS policy
```

**الحل:**
```python
# في app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### المشكلة 3: خطأ في الاتصال بقاعدة البيانات
```
psycopg2.OperationalError: could not connect to server
```

**الحل:**
```bash
# التحقق من حالة قاعدة البيانات
systemctl status postgresql

# إعادة تشغيل قاعدة البيانات
systemctl restart postgresql
```

#### المشكلة 4: عدم تحميل الكاميرا
```
Error: Camera permission denied
```

**الحل:**
```javascript
// التحقق من الأذونات في المتصفح
// طلب الأذونات مرة أخرى
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).catch(error => {
  console.error('Camera error:', error);
  // عرض رسالة للمستخدم
});
```

---

## 📊 المراقبة والصيانة

### مؤشرات الأداء الرئيسية (KPIs)

- **وقت الاستجابة**: < 200ms
- **معدل الأخطاء**: < 0.1%
- **توفر الخدمة**: > 99.9%
- **عدد المشاهدين المتزامنين**: > 1000

### السجلات المهمة

```bash
# مراقبة السجلات الحية
tail -f /var/log/yamshat/api.log | grep "live"

# البحث عن الأخطاء
grep "ERROR" /var/log/yamshat/api.log

# تحليل الأداء
grep "duration" /var/log/yamshat/api.log
```

### النسخ الاحتياطية

```bash
# نسخة احتياطية يومية من قاعدة البيانات
0 2 * * * pg_dump yamshat > /backups/yamshat_$(date +\%Y\%m\%d).sql

# نسخة احتياطية من الملفات
0 3 * * * tar -czf /backups/yamshat_files_$(date +\%Y\%m\%d).tar.gz /var/www/yamshat/
```

---

## 📞 الدعم والمساعدة

### معلومات الاتصال

- **البريد الإلكتروني**: support@yamshat.com
- **الدردشة الحية**: https://yamshat.com/chat
- **مركز المساعدة**: https://help.yamshat.com

### الموارد الإضافية

- [توثيق FastAPI](https://fastapi.tiangolo.com/)
- [توثيق React](https://react.dev/)
- [توثيق SQLAlchemy](https://docs.sqlalchemy.org/)
- [توثيق WebRTC](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

---

## ✅ قائمة التحقق النهائية

- [ ] تم تثبيت جميع الملفات الجديدة
- [ ] تم تشغيل الهجرات بنجاح
- [ ] تم اختبار جميع نقاط API
- [ ] تم اختبار جميع المكونات
- [ ] تم التحقق من الأمان
- [ ] تم تحديث التوثيق
- [ ] تم إعداد المراقبة
- [ ] تم إعداد النسخ الاحتياطية
- [ ] تم اختبار الأداء
- [ ] تم النشر في الإنتاج

---

**آخر تحديث:** يونيو 2026
**الإصدار:** 1.0.0
