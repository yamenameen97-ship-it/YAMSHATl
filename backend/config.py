from __future__ import annotations

import os
import secrets
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _split_csv(value: str) -> list[str]:
    return [item.strip().rstrip("/") for item in str(value or "").split(",") if item.strip()]


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "").strip() or secrets.token_hex(32)
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "").strip() or SECRET_KEY
    DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "").strip().rstrip("/")
    BACKEND_ORIGIN = os.getenv("BACKEND_ORIGIN", "").strip().rstrip("/")
    RENDER_EXTERNAL_URL = os.getenv("RENDER_EXTERNAL_URL", BACKEND_ORIGIN).strip().rstrip("/")

    ALLOWED_ORIGINS = _split_csv(
        os.getenv(
            "ALLOWED_ORIGINS",
            ",".join(
                [
                    FRONTEND_ORIGIN,
                    BACKEND_ORIGIN,
                    "http://127.0.0.1:5000",
                    "http://localhost:5000",
                    "http://127.0.0.1:5500",
                    "http://localhost:5500",
                    "capacitor://localhost",
                    "ionic://localhost",
                ]
            ),
        )
    )

    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH_MB", "25")) * 1024 * 1024
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "1") == "1"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "None")
    SESSION_DAYS = int(os.getenv("SESSION_DAYS", "30"))
    JWT_EXPIRE_DAYS = int(os.getenv("JWT_EXPIRE_DAYS", "30"))
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
    DEFAULT_COIN_BALANCE = int(os.getenv("DEFAULT_COIN_BALANCE", "0"))

    LIVEKIT_PROJECT_ID = os.getenv("LIVEKIT_PROJECT_ID", "").strip()
    LIVEKIT_SIP_URI = os.getenv("LIVEKIT_SIP_URI", "").strip()
    LIVEKIT_WS_URL = os.getenv("LIVEKIT_WS_URL", os.getenv("LIVEKIT_URL", "")).strip()

    UPLOAD_FOLDER = str(BASE_DIR / "uploads")
    ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}
    ALLOWED_VIDEO_EXTENSIONS = {"mp4", "mov", "webm", "mkv"}
    ALLOWED_AUDIO_EXTENSIONS = {"mp3", "wav", "m4a", "aac", "ogg", "oga", "opus", "3gp", "amr", "weba"}
    ALLOWED_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_VIDEO_EXTENSIONS | ALLOWED_AUDIO_EXTENSIONS

    ADMIN_EMAILS = _split_csv(os.getenv("ADMIN_EMAILS", "admin@gmail.com"))
    ADMIN_USERNAMES = _split_csv(os.getenv("ADMIN_USERNAMES", "adminyamen"))

    RESET_CODE_EXPIRE_MINUTES = int(os.getenv("RESET_CODE_EXPIRE_MINUTES", "10"))
    RESET_CODE_LENGTH = int(os.getenv("RESET_CODE_LENGTH", "6"))
    RESET_MAX_VERIFY_ATTEMPTS = int(os.getenv("RESET_MAX_VERIFY_ATTEMPTS", "5"))

    SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER", "").strip()
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "").strip()
    SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Yamshat").strip() or "Yamshat"
    SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "1") == "1"
    SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "0") == "1"

    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "").strip()
    TWILIO_WHATSAPP_CONTENT_SID = os.getenv("TWILIO_WHATSAPP_CONTENT_SID", "").strip()

    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0").strip()
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", REDIS_URL).strip()
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL).strip()
    LOG_FILE = os.getenv("LOG_FILE", str(BASE_DIR / "app.log")).strip()
