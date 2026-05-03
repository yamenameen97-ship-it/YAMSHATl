import time
from typing import Callable

from fastapi import APIRouter, FastAPI, Request, Response
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

from app.core.config import settings

REQUEST_COUNT = Counter(
    'yamshat_http_requests_total',
    'Total HTTP requests',
    ['service', 'method', 'path', 'status_code'],
)

REQUEST_LATENCY = Histogram(
    'yamshat_http_request_latency_seconds',
    'HTTP request latency in seconds',
    ['service', 'method', 'path'],
)


def make_metrics_router() -> APIRouter:
    router = APIRouter()

    @router.get('/metrics', include_in_schema=False)
    def metrics() -> Response:
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

    return router


def configure_metrics(app: FastAPI, service_name: str) -> None:
    @app.middleware('http')
    async def metrics_middleware(request: Request, call_next: Callable):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed = time.perf_counter() - start
        path = request.url.path
        method = request.method
        REQUEST_LATENCY.labels(service=service_name, method=method, path=path).observe(elapsed)
        REQUEST_COUNT.labels(
            service=service_name,
            method=method,
            path=path,
            status_code=str(response.status_code),
        ).inc()
        return response


def configure_tracing(app: FastAPI, service_name: str) -> None:
    if not settings.ENABLE_TRACING:
        return

    provider = TracerProvider(resource=Resource.create({'service.name': service_name}))
    exporter = JaegerExporter(
        agent_host_name=settings.JAEGER_AGENT_HOST,
        agent_port=settings.JAEGER_AGENT_PORT,
    )
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)
    FastAPIInstrumentor.instrument_app(app, tracer_provider=provider)
