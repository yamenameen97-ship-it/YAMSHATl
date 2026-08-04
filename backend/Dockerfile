# =====================================================
# v89.28 ROOT FIX — إصلاح مشكلة "نظام الفيديوهات والريلز"
# ---------------------------------------------------------------
# نضيف ffmpeg + ffprobe إلى صورة الإنتاج بحيث يعمل خطّ إنتاج الوسائط
# (app/services/video_pipeline.py): Transcoding ladder (240→1080p mp4)
# + HLS master + poster + WebP للصور. بدون ffmpeg، النظام يعود إلى
# الجودة الأصلية فقط (fallback آمن) لكن يفقد المزايا الجديدة.
# =====================================================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8000

# حزم النظام اللازمة لـ psycopg2-binary + reportlab + Pillow + livekit
# + v89.28: ffmpeg + ffprobe لخطّ إنتاج الفيديو والريلز
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        libjpeg-dev \
        zlib1g-dev \
        curl \
        ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

RUN useradd --create-home --shell /bin/bash yamshat \
    && chown -R yamshat:yamshat /app
USER yamshat

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

CMD ["sh", "-c", "uvicorn app.main:application --host 0.0.0.0 --port ${PORT:-8000}"]
