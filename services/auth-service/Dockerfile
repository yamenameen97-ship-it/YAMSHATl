FROM python:3.11-slim

WORKDIR /app

# نسخ المتطلبات أولاً للاستفادة من cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# نسخ بقية الكود
COPY . .

# health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health').read()" || exit 1

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
