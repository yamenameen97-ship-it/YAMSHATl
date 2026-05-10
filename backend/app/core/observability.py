import logging
import time
from typing import Callable

from fastapi import APIRouter, FastAPI, Request, Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest

from app.core.config import settings

logger = logging.getLogger(__name__)

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

API_REQUEST_DURATION = Histogram(
    'yamshat_api_request_duration_seconds',
    'Duration of API requests in seconds',
    ['method', 'path', 'status_code'],
)

ACTIVE_USERS_GAUGE = Gauge(
    'yamshat_active_users',
    'Number of currently active users',
    ['service'],
)

LIVE_STREAMS_GAUGE = Gauge(
    'yamshat_live_streams_active',
    'Number of active live streams',
    ['service'],
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
        status_code = str(response.status_code)

        REQUEST_LATENCY.labels(service=service_name, method=method, path=path).observe(elapsed)
        REQUEST_COUNT.labels(service=service_name, method=method, path=path, status_code=status_code).inc()
        API_REQUEST_DURATION.labels(method=method, path=path, status_code=status_code).observe(elapsed)
        return response


def configure_tracing(app: FastAPI, service_name: str) -> None:
    if not settings.ENABLE_TRACING:
        logger.info('Tracing is disabled.')
        return

    try:
        from opentelemetry import trace
        from opentelemetry.exporter.jaeger.thrift import JaegerExporter
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        from opentelemetry.sdk.resources import SERVICE_NAME, Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
    except Exception as exc:  # pragma: no cover
        logger.warning('Tracing dependencies are unavailable: %s', exc)
        return

    resource = Resource.create({
        SERVICE_NAME: service_name,
        'environment': settings.ENVIRONMENT,
    })
    provider = TracerProvider(resource=resource)
    configured_processor = False

    agent_host = settings.JAEGER_AGENT_HOST.strip()
    if agent_host:
        try:
            jaeger_exporter = JaegerExporter(
                agent_host_name=agent_host,
                agent_port=settings.JAEGER_AGENT_PORT,
            )
            provider.add_span_processor(BatchSpanProcessor(jaeger_exporter))
            configured_processor = True
            logger.info('Jaeger tracing configured to %s:%s', agent_host, settings.JAEGER_AGENT_PORT)
        except Exception as exc:
            logger.warning('Failed to configure Jaeger exporter: %s', exc)

    if settings.DEBUG:
        provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))
        configured_processor = True
        logger.info('Console tracing exporter enabled for DEBUG mode.')

    if not configured_processor:
        logger.info('Tracing enabled but no exporters configured; skipping instrumentation.')
        return

    trace.set_tracer_provider(provider)
    FastAPIInstrumentor.instrument_app(app, tracer_provider=provider)

    try:
        from opentelemetry.instrumentation.requests import RequestsInstrumentor

        RequestsInstrumentor().instrument()
    except Exception as exc:  # pragma: no cover
        logger.warning('Requests instrumentation skipped: %s', exc)

    logger.info('OpenTelemetry tracing configured successfully.')
