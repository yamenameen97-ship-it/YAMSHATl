FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend:/app

WORKDIR /app

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend /app/backend
COPY notification-service /app/notification-service

EXPOSE 8000
CMD ["uvicorn", "main:app", "--app-dir", "/app/notification-service", "--host", "0.0.0.0", "--port", "8000"]
