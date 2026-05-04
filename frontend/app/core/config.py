import os
import re
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / '.env')


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {'1', 'true', 'yes', 'on'}


def normalize_database_url(value: str) -> str:
    cleaned = (value or '').strip()
    if cleaned.startswith('postgres://'):
        return cleaned.replace('postgres://', 'postgresql://', 1)
    return cleaned


def csv_list(value: str) -> list[str]:
    return [item.strip() for item in (value or '').split(',') if item.strip()]


class Settings:
    PROJECT_NAME: str = os.getenv('PROJECT_NAME', 'YAMSHAT API')
    SERVICE_NAME: str = os.getenv('SERVICE_NAME', 'yamshat-backend')
    API_PREFIX: str = '/api'
    DEBUG: bool = env_bool('DEBUG', False)
    DATABASE_URL: str = normalize_database_url(
        os.getenv('DATABASE_URL', 'sqlite:///./yamshat.db')
    )
    SECRET_KEY: str = os.getenv('SECRET_KEY', 'change-this-secret-key')
    ALGORITHM: str = os.getenv('ALGORITHM', 'HS256')
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '1440'))
    FIREBASE_CREDENTIALS_PATH: str = os.getenv('FIREBASE_CREDENTIALS_PATH', '')
    REDIS_URL: str = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    ENABLE_METRICS: bool = env_bool('ENABLE_METRICS', True)
    ENABLE_TRACING: bool = env_bool('ENABLE_TRACING', False)
    JAEGER_AGENT_HOST: str = os.getenv('JAEGER_AGENT_HOST', '').strip()
    JAEGER_AGENT_PORT: int = int(os.getenv('JAEGER_AGENT_PORT', '6831'))
    CORS_ORIGINS_RAW: str = os.getenv(
        'CORS_ORIGINS',
        'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173',
    )
    FRONTEND_ORIGIN: str = os.getenv('FRONTEND_ORIGIN', '').strip()
    BACKEND_ORIGIN: str = os.getenv('BACKEND_ORIGIN', '').strip()
    RENDER_EXTERNAL_URL: str = os.getenv('RENDER_EXTERNAL_URL', '').strip()
    RAILWAY_STATIC_URL: str = os.getenv('RAILWAY_STATIC_URL', '').strip()
    ALLOWED_UPLOAD_EXTENSIONS_RAW: str = os.getenv(
        'ALLOWED_UPLOAD_EXTENSIONS',
        'png,jpg,jpeg,webp,gif,mp4,webm,mov',
    )
    LOGIN_RATE_LIMIT_PER_MINUTE: int = int(os.getenv('LOGIN_RATE_LIMIT_PER_MINUTE', '10'))
    REGISTER_RATE_LIMIT_PER_MINUTE: int = int(os.getenv('REGISTER_RATE_LIMIT_PER_MINUTE', '10'))
    API_RATE_LIMIT_PER_MINUTE: int = int(os.getenv('API_RATE_LIMIT_PER_MINUTE', '100'))
    SOCKET_MESSAGE_MIN_INTERVAL_SECONDS: float = float(os.getenv('SOCKET_MESSAGE_MIN_INTERVAL_SECONDS', '1.0'))
    BRUTE_FORCE_MAX_ATTEMPTS: int = int(os.getenv('BRUTE_FORCE_MAX_ATTEMPTS', '8'))
    BRUTE_FORCE_LOCKOUT_SECONDS: int = int(os.getenv('BRUTE_FORCE_LOCKOUT_SECONDS', '300'))
    LIVEKIT_URL: str = os.getenv('LIVEKIT_URL', '')
    LIVEKIT_API_KEY: str = os.getenv('LIVEKIT_API_KEY', '')
    LIVEKIT_API_SECRET: str = os.getenv('LIVEKIT_API_SECRET', '')
    DB_BOOTSTRAP_ON_START: bool = env_bool('DB_BOOTSTRAP_ON_START', False)
    CORS_ORIGIN_REGEX_RAW: str = os.getenv('CORS_ORIGIN_REGEX', '').strip()

    @property
    def cors_origin_regex(self) -> str | None:
        if self.CORS_ORIGIN_REGEX_RAW:
            return self.CORS_ORIGIN_REGEX_RAW

        for candidate in [self.FRONTEND_ORIGIN, self.BACKEND_ORIGIN, self.RENDER_EXTERNAL_URL]:
            parsed = urlparse(candidate)
            host = (parsed.hostname or '').strip().lower()
            if not host.endswith('.onrender.com'):
                continue
            base = re.sub(r'-\d+(?=\.onrender\.com$)', '', host)
            service = base.removesuffix('.onrender.com')
            if service:
                return rf'^https://{re.escape(service)}(?:-\d+)?\.onrender\.com$'

        return r'^https://[a-z0-9-]+(?:-\d+)?\.onrender\.com$'

    @property
    def cors_origins(self) -> list[str]:
        if self.CORS_ORIGINS_RAW.strip() == '*':
            return ['*']

        origins: list[str] = []
        origins.extend(csv_list(self.CORS_ORIGINS_RAW))
        origins.extend(
            origin
            for origin in [
                self.FRONTEND_ORIGIN,
                self.BACKEND_ORIGIN,
                self.RENDER_EXTERNAL_URL,
                self.RAILWAY_STATIC_URL,
            ]
            if origin
        )

        unique_origins: list[str] = []
        seen: set[str] = set()
        for origin in origins:
            if origin not in seen:
                unique_origins.append(origin)
                seen.add(origin)
        return unique_origins

    @property
    def allowed_upload_extensions(self) -> set[str]:
        return {
            ext.strip().lower().lstrip('.')
            for ext in self.ALLOWED_UPLOAD_EXTENSIONS_RAW.split(',')
            if ext.strip()
        }


settings = Settings()
