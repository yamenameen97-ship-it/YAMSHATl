FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend:/app

WORKDIR /app

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend /app/backend
COPY user-service /app/user-service

EXPOSE 8000
CMD ["uvicorn", "main:app", "--app-dir", "/app/user-service", "--host", "0.0.0.0", "--port", "8000"]
