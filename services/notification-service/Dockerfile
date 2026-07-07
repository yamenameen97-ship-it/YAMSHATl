# ✅ v83.5 FIX #3: كان Dockerfile يستخدم `pip install fastapi uvicorn` مباشرة
# بينما `requirements.txt` المجاور يحتوي 14 مكتبة (prometheus-client, redis,
# httpx, sqlalchemy, PyJWT، ...). النتائج قبل الإصلاح:
#   - `advanced_notification_service.py` يستورد prometheus_client → ImportError عند الإقلاع.
#   - middleware المشترك للإصدارات ينكسر لأن pydantic v1 الافتراضي يتعارض مع pydantic==2.10.4
#     المُثبّت في بقية الخدمات → عدم تطابق schema بين الخدمات في نفس العنقود.
#   - لا psycopg2-binary → أي endpoint يستعلم PostgreSQL يفشل صامتاً بـ 500.
#   - انحراف الإصدارات (fastapi latest بدلاً من 0.115.12) يسبب سلوك CORS مختلف بين dev/prod.
# الحل: نتبع نفس نمط بقية Dockerfiles في المشروع (طبقة اعتمادات مؤقتة + non-root user + HEALTHCHECK).

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# حزم نظام لازمة لبناء psycopg2-binary و cryptography (تتطلبها python-jose)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ✅ طبقة الاعتمادات مؤقتة: تُعاد فقط عند تغيّر requirements.txt
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# نسخ الكود بعد الاعتمادات لتحسين الـ layer caching
COPY . /app

# مستخدم غير جذر للأمان (اتّساقاً مع backend/Dockerfile)
RUN groupadd --system --gid 1001 yamshat \
    && useradd  --system --uid 1001 --gid yamshat --home /app --shell /sbin/nologin yamshat \
    && chown -R yamshat:yamshat /app
USER yamshat

EXPOSE 8000

# فحص صحة داخلي (Kubernetes/Compose يمكنه الاعتماد عليه بديلاً عن probes خارجية فقط)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
