# =====================================================
# v83.4 fix (NEW GAP #1):
# لم يكن هناك Dockerfile في backend/ إطلاقاً — بينما:
#   - k8s/06-backend.yaml يشير إلى image: yamshat/backend:v83.3
#   - infra/docker-compose.yml يستخدم build: ../backend
# نتائج ذلك السابقة:
#   - `docker compose up` يفشل بـ "Cannot locate Dockerfile" فور محاولة إقلاع backend.
#   - سلسلة CI/CD (docker build -t yamshat/backend:v83.3 ./backend) تفشل ⇒ Deployment
#     في K8s يبقى ImagePullBackOff لأن الصورة غير موجودة في registry.
#   - كل الخدمات الفرعية (notification-service/Dockerfile) تنسخ backend/requirements.txt
#     مما يوهم أن backend يُبنى — لكن لا صورة قابلة للتشغيل مستقلة له.
#
# هذا الملف يحل الفجوة: بناء صورة backend الأحادية الحقيقية (auth+chat+media+search+posts).
# =====================================================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8000

# حزم النظام اللازمة لـ psycopg2-binary + reportlab + Pillow + livekit
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        libjpeg-dev \
        zlib1g-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# طبقة تخزين مؤقت للاعتمادات — يعيد البناء فقط عند تغيّر requirements.txt
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r /app/requirements.txt

# نسخ الكود بعد الاعتمادات
COPY . /app

# مستخدم غير جذر لأمان أفضل داخل العنقود
RUN useradd --create-home --shell /bin/bash yamshat \
    && chown -R yamshat:yamshat /app
USER yamshat

EXPOSE 8000

# healthcheck داخلي (K8s له probes خاصة، لكن هذا يفيد في docker-compose)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

# نفس الأمر الذي يستخدمه nixpacks.toml حتى يكون سلوك التطوير والإنتاج متطابقاً.
# ملاحظة: main.py يعرّف كلاً من `app` و `application` — نستخدم `application` لتوافق نفس النمط.
CMD ["sh", "-c", "uvicorn app.main:application --host 0.0.0.0 --port ${PORT:-8000}"]
