from prometheus_client import Counter, Histogram, Gauge, generate_latest
from fastapi import Request
import time
import psutil

# المقاييس (Metrics)
REQUEST_COUNT = Counter("api_requests_total", "Total API Requests", ["method", "endpoint", "status"])
REQUEST_LATENCY = Histogram("api_request_latency_seconds", "API Request Latency", ["endpoint"])
WEBSOCKET_ACTIVE_CONNECTIONS = Gauge("websocket_active_connections", "Current active WS connections")
MEMORY_USAGE = Gauge("server_memory_usage_bytes", "Current memory usage in bytes")
DB_POOL_SIZE = Gauge("db_pool_size", "Current database connection pool size")

class MonitoringMiddleware:
    async def __call__(self, request: Request, call_next):
        start_time = time.time()
        endpoint = request.url.path
        
        response = await call_next(request)
        
        # تسجيل المقاييس
        latency = time.time() - start_time
        REQUEST_COUNT.labels(method=request.method, endpoint=endpoint, status=response.status_code).inc()
        REQUEST_LATENCY.labels(endpoint=endpoint).observe(latency)
        
        # تحديث استخدام الذاكرة
        MEMORY_USAGE.set(psutil.Process().memory_info().rss)
        
        return response

def get_metrics():
    return generate_latest()
