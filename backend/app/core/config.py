import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / '.env')


class Settings:
    PROJECT_NAME: str = os.getenv('PROJECT_NAME', 'YAMSHAT API')
    SERVICE_NAME: str = os.getenv('SERVICE_NAME', 'yamshat-backend')
    API_PREFIX: str = '/api'
    DEBUG: bool = os.getenv('DEBUG', 'false').lower() == 'true'
    DATABASE_URL: str = os.getenv(
        'DATABASE_URL',
        'postgresql://postgres:1234@localhost:5432/yamshat',
    )
    SECRET_KEY: str = os.getenv('SECRET_KEY', 'change-this-secret-key')
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '60'))
    FIREBASE_CREDENTIALS_PATH: str = os.getenv('FIREBASE_CREDENTIALS_PATH', '')
    REDIS_URL: str = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    ENABLE_METRICS: bool = os.getenv('ENABLE_METRICS', 'true').lower() == 'true'
    ENABLE_TRACING: bool = os.getenv('ENABLE_TRACING', 'true').lower() == 'true'
    JAEGER_AGENT_HOST: str = os.getenv('JAEGER_AGENT_HOST', 'jaeger-agent.monitoring.svc.cluster.local')
    JAEGER_AGENT_PORT: int = int(os.getenv('JAEGER_AGENT_PORT', '6831'))
    CORS_ORIGINS_RAW: str = os.getenv(
        'CORS_ORIGINS',
        'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173',
    )

    @property
    def cors_origins(self) -> list[str]:
        if self.CORS_ORIGINS_RAW.strip() == '*':
            return ['*']
        return [origin.strip() for origin in self.CORS_ORIGINS_RAW.split(',') if origin.strip()]


settings = Settings()
