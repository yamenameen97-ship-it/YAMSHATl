import os
import re
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / '.env')


def env_str(name: str, default: str = '') -> str:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip()


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {'1', 'true', 'yes', 'on'}


def normalize_database_url(value: str) -> str:
    cleaned = (value or '').strip()

    if cleaned.startswith('postgres://'):
        return cleaned.replace(
            'postgres://',
            'postgresql://',
            1,
        )

    return cleaned


def csv_list(value: str) -> list[str]:
    return [
        item.strip()
        for item in (value or '').split(',')
        if item.strip()
    ]


def render_origin_regex_from_candidates(
    *candidates: str,
) -> str | None:
    patterns: list[str] = []

    seen: set[str] = set()

    for candidate in candidates:
        parsed = urlparse(candidate)

        host = (
            parsed.hostname or ''
        ).strip().lower()

        if not host.endswith('.onrender.com'):
            continue

        service = host.removesuffix(
            '.onrender.com'
        )

        if not service:
            continue

        if service in seen:
            continue

        seen.add(service)

        patterns.append(
            rf'https://{re.escape(service)}\.onrender\.com'
        )

    if not patterns:
        return None

    return rf'^(?:{"|".join(patterns)})$'


class Settings:
    PROJECT_NAME: str = os.getenv(
        'PROJECT_NAME',
        'YAMSHAT API',
    )

    SERVICE_NAME: str = os.getenv(
        'SERVICE_NAME',
        'yamshat-backend',
    )

    API_PREFIX: str = '/api'

    ENVIRONMENT: str = env_str(
        'ENVIRONMENT',
        'production',
    ).lower()

    DEBUG: bool = env_bool(
        'DEBUG',
        False,
    )

    DATABASE_URL: str = normalize_database_url(
        env_str(
            'DATABASE_URL',
            'sqlite:///./yamshat.db',
        )
    )

    SECRET_KEY: str = env_str(
        'SECRET_KEY',
        'change-this-secret-key',
    )

    ALGORITHM: str = os.getenv(
        'ALGORITHM',
        'HS256',
    )

    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv(
            'ACCESS_TOKEN_EXPIRE_MINUTES',
            '60',
        )
    )

    REFRESH_TOKEN_EXPIRE_DAYS: int = int(
        os.getenv(
            'REFRESH_TOKEN_EXPIRE_DAYS',
            '30',
        )
    )

    FRONTEND_ORIGIN: str = (
        os.getenv(
            'FRONTEND_ORIGIN',
            '',
        )
        .strip()
        .rstrip('/')
    )

    BACKEND_ORIGIN: str = (
        os.getenv(
            'BACKEND_ORIGIN',
            'https://yamshat-1ya4.onrender.com',
        )
        .strip()
        .rstrip('/')
    )

    RENDER_EXTERNAL_URL: str = (
        os.getenv(
            'RENDER_EXTERNAL_URL',
            'https://yamshat-1ya4.onrender.com',
        )
        .strip()
        .rstrip('/')
    )

    CORS_ORIGINS_RAW: str = os.getenv(
        'CORS_ORIGINS',
        (
            'http://localhost:3000,'
            'http://127.0.0.1:3000,'
            'http://localhost:5173,'
            'http://127.0.0.1:5173'
        ),
    )

    CORS_ORIGIN_REGEX_RAW: str = (
        os.getenv(
            'CORS_ORIGIN_REGEX',
            '',
        )
        .strip()
    )

    ENABLE_METRICS: bool = env_bool(
        'ENABLE_METRICS',
        True,
    )

    ENABLE_TRACING: bool = env_bool(
        'ENABLE_TRACING',
        False,
    )

    LIVEKIT_URL: str = os.getenv(
        'LIVEKIT_URL',
        '',
    )

    LIVEKIT_API_KEY: str = os.getenv(
        'LIVEKIT_API_KEY',
        '',
    )

    LIVEKIT_API_SECRET: str = os.getenv(
        'LIVEKIT_API_SECRET',
        '',
    )

    CLOUDINARY_CLOUD_NAME: str = (
        os.getenv(
            'CLOUDINARY_CLOUD_NAME',
            '',
        )
        .strip()
    )

    CLOUDINARY_API_KEY: str = (
        os.getenv(
            'CLOUDINARY_API_KEY',
            '',
        )
        .strip()
    )

    CLOUDINARY_API_SECRET: str = (
        os.getenv(
            'CLOUDINARY_API_SECRET',
            '',
        )
        .strip()
    )

    CLOUDINARY_FOLDER: str = (
        os.getenv(
            'CLOUDINARY_FOLDER',
            'yamshat',
        )
        .strip()
    )

    REFRESH_COOKIE_NAME: str = (
        os.getenv(
            'REFRESH_COOKIE_NAME',
            'yamshat_refresh_token',
        )
        .strip()
    )

    REFRESH_COOKIE_SECURE: bool = env_bool(
        'REFRESH_COOKIE_SECURE',
        True,
    )

    COOKIE_SAMESITE: str = (
        os.getenv(
            'COOKIE_SAMESITE',
            'none',
        )
        .strip()
        .lower()
    )

    PRIMARY_ADMIN_EMAIL: str = env_str(
        'PRIMARY_ADMIN_EMAIL',
        'yamenameen97@gmail.com',
    ).lower()

    PRIMARY_ADMIN_PASSWORD: str = env_str(
        'PRIMARY_ADMIN_PASSWORD',
        'yamen1234',
    )

    DEMO_ACCOUNT_EMAIL: str = env_str(
        'DEMO_ACCOUNT_EMAIL',
        'yasryameen21@gmail.com',
    ).lower()

    DEMO_ACCOUNT_PASSWORD: str = env_str(
        'DEMO_ACCOUNT_PASSWORD',
        '12345678',
    )

    ANALYTICS_ENABLED: bool = env_bool(
        'ANALYTICS_ENABLED',
        True,
    )

    PUSH_PROVIDER: str = (
        os.getenv(
            'PUSH_PROVIDER',
            'firebase',
        )
        .strip()
        .lower()
    )

    ALLOWED_UPLOAD_EXTENSIONS_RAW: str = os.getenv(
        'ALLOWED_UPLOAD_EXTENSIONS',
        'png,jpg,jpeg,webp,gif,mp4,webm,mov',
    )

    @property
    def cors_origin_regex(self) -> str | None:
        derived = render_origin_regex_from_candidates(
            self.FRONTEND_ORIGIN,
            self.RENDER_EXTERNAL_URL,
            self.BACKEND_ORIGIN,
            *csv_list(self.CORS_ORIGINS_RAW),
        )

        if self.CORS_ORIGIN_REGEX_RAW:
            return self.CORS_ORIGIN_REGEX_RAW

        if derived:
            return derived

        return r'^https://.*\.onrender\.com$'

    @property
    def cors_origins(self) -> list[str]:
        origins: list[str] = []

        if not self.is_production:
            origins.extend([
                'http://localhost:3000',
                'http://127.0.0.1:3000',
                'http://localhost:5173',
                'http://127.0.0.1:5173',
            ])

        origins.extend(
            csv_list(self.CORS_ORIGINS_RAW)
        )

        origins.extend([
            self.FRONTEND_ORIGIN,
            self.BACKEND_ORIGIN,
            self.RENDER_EXTERNAL_URL,
        ])

        unique: list[str] = []

        seen: set[str] = set()

        for origin in origins:
            normalized = (
                origin or ''
            ).strip().rstrip('/')

            if not normalized:
                continue

            if normalized in seen:
                continue

            seen.add(normalized)

            unique.append(normalized)

        return unique

    @property
    def allowed_upload_extensions(
        self,
    ) -> set[str]:
        return {
            ext.strip()
            .lower()
            .lstrip('.')
            for ext in self.ALLOWED_UPLOAD_EXTENSIONS_RAW.split(',')
            if ext.strip()
        }

    @property
    def cloudinary_configured(self) -> bool:
        return bool(
            self.CLOUDINARY_CLOUD_NAME
            and self.CLOUDINARY_API_KEY
            and self.CLOUDINARY_API_SECRET
        )

    @property
    def cookie_samesite(self) -> str:
        value = self.COOKIE_SAMESITE.lower()

        if value not in {
            'lax',
            'strict',
            'none',
        }:
            value = 'lax'

        if (
            value == 'none'
            and not self.REFRESH_COOKIE_SECURE
        ):
            return 'lax'

        return value

    @property
    def is_production(self) -> bool:
        return (
            self.ENVIRONMENT
            in {'prod', 'production'}
            and not self.DEBUG
        )


settings = Settings()
