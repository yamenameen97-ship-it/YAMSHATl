from __future__ import annotations

from pathlib import Path
import os

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _split_csv(value: str) -> list[str]:
    return [item.strip().rstrip("/") for item in str(value or "").split(",") if item.strip()]


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY") or "change-me-in-production"
    DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    DEBUG = False
    TESTING = False

    SESSION_DAYS = int(os.environ.get("SESSION_DAYS", "30"))
    SESSION_COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE", "1") == "1"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = os.environ.get("SESSION_COOKIE_SAMESITE", "Lax")

    MAX_CONTENT_LENGTH = int(os.environ.get("MAX_CONTENT_LENGTH_MB", "5")) * 1024 * 1024
    ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
    ALLOWED_VIDEO_EXTENSIONS = {"mp4", "mov", "webm", "mkv"}
    ALLOWED_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_VIDEO_EXTENSIONS

    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "https://yamshatl-1.onrender.com").strip().rstrip("/")
    BACKEND_ORIGIN = os.environ.get("BACKEND_ORIGIN", "https://yamshatl.onrender.com").strip().rstrip("/")
    RENDER_EXTERNAL_URL = os.environ.get("RENDER_EXTERNAL_URL", BACKEND_ORIGIN).strip().rstrip("/")

    ALLOWED_ORIGINS = _split_csv(
        os.environ.get(
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

    RATELIMIT_STORAGE_URI = os.environ.get("RATELIMIT_STORAGE_URI", "memory://")
    RATELIMIT_DEFAULT = _split_csv(os.environ.get("RATELIMIT_DEFAULT", "300 per hour,60 per minute"))

    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()
    JWT_EXPIRE_DAYS = int(os.environ.get("JWT_EXPIRE_DAYS", "30"))
