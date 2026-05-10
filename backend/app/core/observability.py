import logging
import time
from typing import Callable

from fastapi import APIRouter, FastAPI, Request, Response
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter, SpanExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader, ConsoleMetricExporter
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.metrics import set_meter_provider, get_meter_provider
from opentelemetry.propagate import set_global_textmap
from opentelemetry.propagators.b3 import B3Format
from opentelemetry.instrumentation.requests import RequestsInstrumentor

# Custom Metrics
API_REQUEST_DURATION = Histogram(
    'yamshat_api_request_duration_seconds',
    'Duration of API requests in seconds',
    ['method', 'path', 'status_code'],
)

DB_QUERY_DURATION = Histogram(
    'yamshat_db_query_duration_seconds',
    'Duration of database queries in seconds',
    ['query_type', 'table'],
)

WEBSOCKET_CONNECTIONS = Counter(
    'yamshat_websocket_connections_total',
    'Total WebSocket connections',
    ['status'],
)

WEBSOCKET_MESSAGES_RECEIVED = Counter(
    'yamshat_websocket_messages_received_total',
    'Total WebSocket messages received',
    ['event_type'],
)

WEBSOCKET_MESSAGES_SENT = Counter(
    'yamshat_websocket_messages_sent_total',
    'Total WebSocket messages sent',
    ['event_type'],
)

from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest, Gauge

from app.core.config import settings

logger = logging.getLogger(__name__)

REQUEST_COUNT = Counter(
    'yamshat_http_requests_total',
    'Total HTTP requests',
    ['service', 'method', 'path', 'status_code'],
)

# Custom Metrics for Prometheus (direct client)
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
        status_code = str(response.status_code)

        REQUEST_LATENCY.labels(service=service_name, method=method, path=path).observe(elapsed)
        REQUEST_COUNT.labels(
            service=service_name,
            method=method,
            path=path,
            status_code=status_code,
        ).inc()
        API_REQUEST_DURATION.labels(method=method, path=path, status_code=status_code).observe(elapsed)

        return response



def configure_tracing(app: FastAPI, service_name: str) -> None:
    if not settings.ENABLE_TRACING:
        logger.info("Tracing is disabled.")
        return

    resource = Resource.create({
        SERVICE_NAME: service_name,
        "environment": settings.ENVIRONMENT,
    })

    # Configure TracerProvider
    provider = TracerProvider(resource=resource)
    span_processors: list[SpanProcessor] = []

    # Jaeger Exporter
    agent_host = settings.JAEGER_AGENT_HOST.strip()
    if agent_host:
        try:
            jaeger_exporter = JaegerExporter(
                agent_host_name=agent_host,
                agent_port=settings.JAEGER_AGENT_PORT,
            )
            span_processors.append(BatchSpanProcessor(jaeger_exporter))
            logger.info(f"Jaeger tracing configured to {agent_host}:{settings.JAEGER_AGENT_PORT}")
        except Exception as exc:
            logger.warning("Failed to configure Jaeger exporter: %s", exc)
    else:
        logger.info("JAEGER_AGENT_HOST is not set; skipping Jaeger exporter.")

    # Console Exporter for local development/debugging
    if settings.DEBUG:
        span_processors.append(BatchSpanProcessor(ConsoleSpanExporter()))
        logger.info("Console tracing exporter enabled for DEBUG mode.")

    for processor in span_processors:
        provider.add_span_processor(processor)

    trace.set_tracer_provider(provider)

    # Set global text map propagator for distributed tracing context propagation
    set_global_textmap(B3Format())

    # Instrument FastAPI application
    FastAPIInstrumentor.instrument_app(app, tracer_provider=provider)
    # Instrument requests library for outgoing HTTP calls
    RequestsInstrumentor().instrument()
    logger.info("OpenTelemetry tracing configured successfully.")

    # Example of how to use the tracer
    # tracer = trace.get_tracer(__name__)
    # with tracer.start_as_current_span("my-operation"):
    #     pass


def configure_metrics_provider(service_name: str) -> None:
    resource = Resource.create({
        SERVICE_NAME: service_name,
        "environment": settings.ENVIRONMENT,
    })
    
    # Configure MetricReader for Prometheus
    # In a real-world scenario, you'd use a PrometheusHttpServer or Pushgateway exporter
    # For Prometheus exposition, we typically use a Prometheus exporter that scrapes metrics.
    # OpenTelemetry Python currently lacks a direct Prometheus exporter for the SDK.
    # Instead, we rely on the prometheus_client library for direct Prometheus metrics exposition.
    # The OpenTelemetry MeterProvider is set up here for potential future integration with OTLP exporters
    # or other OpenTelemetry-native metric consumers.
    # reader = PeriodicExportingMetricReader(ConsoleMetricExporter()) # Removed for direct Prometheus client usage
    meter_provider = MeterProvider(resource=resource)
    set_meter_provider(meter_provider)
    logger.info("OpenTelemetry metrics provider configured successfully (without direct Prometheus exporter for OTel SDK).")



def configure_observability(app: FastAPI, service_name: str) -> None:
    configure_metrics(app, service_name)
    configure_metrics_provider(service_name)
    configure_tracing(app, service_name)
