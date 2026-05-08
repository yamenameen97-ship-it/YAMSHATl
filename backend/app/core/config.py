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
    DATABASE_URL: str = normalize_database_url(os.getenv('DATABASE_URL', 'sqlite:///./yamshat.db'))
    SECRET_KEY: str = os.getenv('SECRET_KEY', 'change-this-secret-key')
    ALGORITHM: str = os.getenv('ALGORITHM', 'HS256')
    JWT_ISSUER: str = (os.getenv('JWT_ISSUER') or 'yamshat-api').strip()
    JWT_AUDIENCE: str = (os.getenv('JWT_AUDIENCE') or 'yamshat-clients').strip()
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '60'))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv('REFRESH_TOKEN_EXPIRE_DAYS', '30'))
    SESSION_REFRESH_EXPIRE_HOURS: int = int(os.getenv('SESSION_REFRESH_EXPIRE_HOURS', '12'))
    EMAIL_VERIFICATION_CODE_EXPIRE_MINUTES: int = int(os.getenv('EMAIL_VERIFICATION_CODE_EXPIRE_MINUTES', '15'))
    PASSWORD_RESET_CODE_EXPIRE_MINUTES: int = int(os.getenv('PASSWORD_RESET_CODE_EXPIRE_MINUTES', '15'))
    FIREBASE_CREDENTIALS_PATH: str = os.getenv('FIREBASE_CREDENTIALS_PATH', '')
    REDIS_URL: str = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    REDIS_PREFIX: str = (os.getenv('REDIS_PREFIX') or 'yamshat').strip()
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
    CDN_BASE_URL: str = (os.getenv('CDN_BASE_URL') or os.getenv('IMAGEKIT_URL_ENDPOINT') or os.getenv('BUNNY_CDN_URL') or os.getenv('CLOUDFLARE_CDN_URL') or '').strip().rstrip('/')
    ALLOWED_UPLOAD_EXTENSIONS_RAW: str = os.getenv(
        'ALLOWED_UPLOAD_EXTENSIONS',
        'png,jpg,jpeg,webp,gif,mp4,webm,mov',
    )
    LOGIN_RATE_LIMIT_PER_MINUTE: int = int(os.getenv('LOGIN_RATE_LIMIT_PER_MINUTE', '10'))
    REGISTER_RATE_LIMIT_PER_MINUTE: int = int(os.getenv('REGISTER_RATE_LIMIT_PER_MINUTE', '10'))
    API_RATE_LIMIT_PER_MINUTE: int = int(os.getenv('API_RATE_LIMIT_PER_MINUTE', '100'))
    SOCKET_MESSAGE_MIN_INTERVAL_SECONDS: float = float(os.getenv('SOCKET_MESSAGE_MIN_INTERVAL_SECONDS', '1.0'))
    SOCKET_EVENT_BURST_LIMIT: int = int(os.getenv('SOCKET_EVENT_BURST_LIMIT', '20'))
    SOCKET_EVENT_WINDOW_SECONDS: int = int(os.getenv('SOCKET_EVENT_WINDOW_SECONDS', '10'))
    SOCKET_TYPING_MIN_INTERVAL_SECONDS: float = float(os.getenv('SOCKET_TYPING_MIN_INTERVAL_SECONDS', '0.4'))
    SOCKET_REPLAY_WINDOW_SECONDS: int = int(os.getenv('SOCKET_REPLAY_WINDOW_SECONDS', '30'))
    SOCKET_NONCE_TTL_SECONDS: int = int(os.getenv('SOCKET_NONCE_TTL_SECONDS', '120'))
    SOCKET_PERMISSION_REVALIDATION_SECONDS: int = int(os.getenv('SOCKET_PERMISSION_REVALIDATION_SECONDS', '45'))
    SOCKET_ABUSE_BLOCK_SECONDS: int = int(os.getenv('SOCKET_ABUSE_BLOCK_SECONDS', '300'))
    SOCKET_DUPLICATE_WINDOW_SECONDS: int = int(os.getenv('SOCKET_DUPLICATE_WINDOW_SECONDS', '20'))
    SPAM_SCORE_BLOCK_THRESHOLD: int = int(os.getenv('SPAM_SCORE_BLOCK_THRESHOLD', '65'))
    REFRESH_RATE_LIMIT_PER_MINUTE: int = int(os.getenv('REFRESH_RATE_LIMIT_PER_MINUTE', '20'))
    REFRESH_MIN_INTERVAL_SECONDS: float = float(os.getenv('REFRESH_MIN_INTERVAL_SECONDS', '2.0'))
    BRUTE_FORCE_MAX_ATTEMPTS: int = int(os.getenv('BRUTE_FORCE_MAX_ATTEMPTS', '8'))
    BRUTE_FORCE_LOCKOUT_SECONDS: int = int(os.getenv('BRUTE_FORCE_LOCKOUT_SECONDS', '300'))
    VERIFY_RATE_LIMIT_PER_MINUTE: int = int(os.getenv('VERIFY_RATE_LIMIT_PER_MINUTE', '12'))
    RESEND_RATE_LIMIT_PER_MINUTE: int = int(os.getenv('RESEND_RATE_LIMIT_PER_MINUTE', '6'))
    CAPTCHA_RATE_LIMIT_PER_MINUTE: int = int(os.getenv('CAPTCHA_RATE_LIMIT_PER_MINUTE', '20'))
    CAPTCHA_ENABLED: bool = env_bool('CAPTCHA_ENABLED', True)
    CAPTCHA_EXPIRE_MINUTES: int = int(os.getenv('CAPTCHA_EXPIRE_MINUTES', '5'))
    DEV_LOGIN_ENABLED: bool = env_bool('DEV_LOGIN_ENABLED', False)
    LIVEKIT_URL: str = os.getenv('LIVEKIT_URL', '')
    LIVEKIT_API_KEY: str = os.getenv('LIVEKIT_API_KEY', '')
    LIVEKIT_API_SECRET: str = os.getenv('LIVEKIT_API_SECRET', '')
    DB_BOOTSTRAP_ON_START: bool = env_bool('DB_BOOTSTRAP_ON_START', False)
    DB_STATEMENT_TIMEOUT_MS: int = int(os.getenv('DB_STATEMENT_TIMEOUT_MS', '8000'))
    CORS_ORIGIN_REGEX_RAW: str = os.getenv('CORS_ORIGIN_REGEX', '').strip()
    CLOUDINARY_CLOUD_NAME: str = (os.getenv('CLOUDINARY_CLOUD_NAME') or os.getenv('CLOUD_NAME') or '').strip()
    CLOUDINARY_API_KEY: str = (os.getenv('CLOUDINARY_API_KEY') or os.getenv('CLOUD_API_KEY') or '').strip()
    CLOUDINARY_API_SECRET: str = (os.getenv('CLOUDINARY_API_SECRET') or os.getenv('CLOUD_API_SECRET') or '').strip()
    CLOUDINARY_FOLDER: str = (os.getenv('CLOUDINARY_FOLDER') or 'yamshat').strip()
    IMAGEKIT_PUBLIC_KEY: str = (os.getenv('IMAGEKIT_PUBLIC_KEY') or '').strip()
    IMAGEKIT_PRIVATE_KEY: str = (os.getenv('IMAGEKIT_PRIVATE_KEY') or '').strip()
    IMAGEKIT_URL_ENDPOINT: str = (os.getenv('IMAGEKIT_URL_ENDPOINT') or '').strip().rstrip('/')
    IMAGEKIT_FOLDER: str = (os.getenv('IMAGEKIT_FOLDER') or 'yamshat').strip()
    PUSH_PROVIDER: str = (os.getenv('PUSH_PROVIDER') or 'firebase').strip().lower()
    ANALYTICS_ENABLED: bool = env_bool('ANALYTICS_ENABLED', True)
    ANALYTICS_PROVIDER: str = (os.getenv('ANALYTICS_PROVIDER') or 'custom-endpoint').strip().lower()
    ANALYTICS_FORWARD_URL: str = (os.getenv('ANALYTICS_FORWARD_URL') or '').strip()
    ANALYTICS_SHARED_SECRET: str = (os.getenv('ANALYTICS_SHARED_SECRET') or '').strip()
    UPLOAD_SCAN_STRATEGY: str = (os.getenv('UPLOAD_SCAN_STRATEGY') or 'best-effort').strip().lower()
    EXTERNAL_SCAN_URL: str = (os.getenv('EXTERNAL_SCAN_URL') or '').strip()
    EXTERNAL_SCAN_API_KEY: str = (os.getenv('EXTERNAL_SCAN_API_KEY') or '').strip()
    RESUMABLE_UPLOAD_MAX_SIZE_MB: int = int(os.getenv('RESUMABLE_UPLOAD_MAX_SIZE_MB', '512'))
    REFRESH_COOKIE_NAME: str = (os.getenv('REFRESH_COOKIE_NAME') or 'yamshat_refresh_token').strip()
    REFRESH_COOKIE_DOMAIN: str = (os.getenv('REFRESH_COOKIE_DOMAIN') or '').strip()
    REFRESH_COOKIE_SECURE: bool = env_bool('REFRESH_COOKIE_SECURE', True)
    COOKIE_SAMESITE: str = (os.getenv('COOKIE_SAMESITE') or 'none').strip().lower()
    ADMIN_MFA_ENABLED: bool = env_bool('ADMIN_MFA_ENABLED', False)
    ADMIN_MFA_TOTP_SECRET: str = (os.getenv('ADMIN_MFA_TOTP_SECRET') or '').strip()
    ADMIN_ALLOWED_IPS_RAW: str = (os.getenv('ADMIN_ALLOWED_IPS') or '').strip()

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

    @property
    def cloudinary_configured(self) -> bool:
        return bool(self.CLOUDINARY_CLOUD_NAME and self.CLOUDINARY_API_KEY and self.CLOUDINARY_API_SECRET)

    @property
    def imagekit_configured(self) -> bool:
        return bool(self.IMAGEKIT_PRIVATE_KEY and self.IMAGEKIT_URL_ENDPOINT)

    @property
    def resumable_upload_max_size_bytes(self) -> int:
        return max(self.RESUMABLE_UPLOAD_MAX_SIZE_MB, 1) * 1024 * 1024

    @property
    def cookie_samesite(self) -> str:
        value = self.COOKIE_SAMESITE.lower()
        if value not in {'lax', 'strict', 'none'}:
            value = 'lax'
        if value == 'none' and not self.REFRESH_COOKIE_SECURE:
            return 'lax'
        return value

    @property
    def admin_allowed_ips(self) -> set[str]:
        return {item for item in csv_list(self.ADMIN_ALLOWED_IPS_RAW)}

    @property
    def dev_login_enabled(self) -> bool:
        return bool(self.DEBUG or self.DEV_LOGIN_ENABLED)


settings = Settings()
