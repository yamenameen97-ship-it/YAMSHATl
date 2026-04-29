from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _split_csv(value: str) -> list[str]:
    return [item.strip().rstrip("/") for item in str(value or "").split(",") if item.strip()]


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
    DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "https://yamshatl-1.onrender.com").strip().rstrip("/")
    BACKEND_ORIGIN = os.getenv("BACKEND_ORIGIN", "https://yamshatl.onrender.com").strip().rstrip("/")
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
    SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "Lax")
    SESSION_DAYS = int(os.getenv("SESSION_DAYS", "30"))
    JWT_EXPIRE_DAYS = int(os.getenv("JWT_EXPIRE_DAYS", "30"))
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

    UPLOAD_FOLDER = str(BASE_DIR / "uploads")
    ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}
    ALLOWED_VIDEO_EXTENSIONS = {"mp4", "mov", "webm", "mkv"}
    ALLOWED_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_VIDEO_EXTENSIONS

    ADMIN_EMAILS = _split_csv(os.getenv("ADMIN_EMAILS", ""))
    ADMIN_USERNAMES = _split_csv(os.getenv("ADMIN_USERNAMES", ""))
