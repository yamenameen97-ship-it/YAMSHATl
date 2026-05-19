# 📦 دليل التثبيت والنشر - Yamshat V3

## 🔧 المتطلبات الأساسية

### البيئة:
- Python 3.9+
- PostgreSQL 12+
- Redis 6+
- Node.js 16+ (للـ Frontend)

### المكتبات:
```bash
pip install -r requirements_enhanced.txt
```

---

## 📥 خطوات التثبيت

### 1. استنساخ المشروع
```bash
git clone https://github.com/yamshat/yamshat.git
cd yamshat
```

### 2. إنشاء بيئة افتراضية
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# أو
venv\Scripts\activate  # Windows
```

### 3. تثبيت المتطلبات
```bash
pip install -r requirements_enhanced.txt
```

### 4. إعداد متغيرات البيئة
```bash
cp .env.example .env
# عدّل الملف بإضافة:
DATABASE_URL=postgresql://user:password@localhost/yamshat
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here
```

### 5. إعداد قاعدة البيانات
```bash
# تشغيل الهجرات
alembic upgrade head

# أو إنشاء الجداول يدويًا
python -c "from app.db.base import Base; from app.db.session import engine; Base.metadata.create_all(bind=engine)"
```

### 6. تشغيل الخادم
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🧪 الاختبار

### اختبار الـ API
```bash
# الوصول إلى التوثيق التفاعلي
http://localhost:8000/docs

# أو استخدام curl
curl -X GET "http://localhost:8000/api/search/trending"
```

### اختبار WebSocket
```bash
# استخدام wscat
npm install -g wscat
wscat -c "ws://localhost:8000/ws/chat/1/1"
```

### تشغيل الاختبارات
```bash
pytest tests/ -v
pytest tests/ --cov=app  # مع تقرير التغطية
```

---

## 🚀 النشر

### على Render.com
```yaml
# render.yaml
services:
  - type: web
    name: yamshat-api
    env: python
    buildCommand: pip install -r requirements_enhanced.txt && alembic upgrade head
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        scope: build,runtime
      - key: REDIS_URL
        scope: build,runtime
```

### على Docker
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements_enhanced.txt .
RUN pip install --no-cache-dir -r requirements_enhanced.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t yamshat:v3 .
docker run -p 8000:8000 yamshat:v3
```

---

## 📊 المراقبة

### تفعيل المقاييس
```python
# في .env
ENABLE_METRICS=true
```

### الوصول إلى المقاييس
```
http://localhost:8000/metrics
```

### استخدام Prometheus
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'yamshat'
    static_configs:
      - targets: ['localhost:8000']
```

---

## 🔒 الأمان

### تفعيل HTTPS
```python
# في production
uvicorn app.main:app --ssl-keyfile=key.pem --ssl-certfile=cert.pem
```

### إعدادات الأمان
```python
# في .env
DEBUG=false
ALLOWED_HOSTS=yourdomain.com
CORS_ORIGINS=https://yourdomain.com
```

---

## 🐛 استكشاف الأخطاء

### مشاكل قاعدة البيانات
```bash
# التحقق من الاتصال
python -c "from app.db.session import engine; engine.connect()"

# إعادة تعيين قاعدة البيانات (تطوير فقط)
alembic downgrade base
alembic upgrade head
```

### مشاكل WebSocket
```bash
# التحقق من الاتصال
wscat -c "ws://localhost:8000/ws/chat/1/1"

# عرض السجلات
tail -f logs/app.log
```

---

## 📈 التحسينات المستقبلية

- [ ] تحسين الأداء باستخدام Caching
- [ ] إضافة GraphQL API
- [ ] تطبيق Mobile Native
- [ ] تحسين الخوارزميات التوصية
- [ ] دعم اللغات المتعددة

---

**آخر تحديث**: 13 مايو 2026
