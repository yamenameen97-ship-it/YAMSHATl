"""
خدمة التخزين الدائم للوسائط (Persistent Media Storage)
======================================================
تحل مشكلة اختفاء الفيديوهات والصور عند إعادة النشر على Render.

الاستراتيجية:
1. الأولوية الأولى: Cloudinary (إذا كانت المتغيرات معرّفة)
2. الأولوية الثانية: Render Persistent Disk على المسار /var/data/uploads
3. الأخيرة (للتطوير فقط): backend/uploads/

ملاحظة: على Render، أضف Persistent Disk عبر render.yaml بالمسار /var/data
حتى لا تختفي الملفات بين عمليات النشر.
"""
from __future__ import annotations

import logging
import os
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import UploadFile

logger = logging.getLogger(__name__)

# مسار التخزين الدائم على Render (Persistent Disk)
PERSISTENT_DISK_PATH = Path(os.getenv("PERSISTENT_DISK_PATH", "/var/data/uploads"))
# مسار احتياطي (لا يستخدم على Render في الإنتاج)
LOCAL_FALLBACK_PATH = Path(__file__).resolve().parents[2] / "uploads"


def _get_storage_root() -> Path:
    """يختار جذر التخزين الدائم إذا كان متاحاً، وإلا يستخدم المحلي."""
    try:
        PERSISTENT_DISK_PATH.mkdir(parents=True, exist_ok=True)
        # اختبار الكتابة
        test_file = PERSISTENT_DISK_PATH / ".write_test"
        test_file.write_text("ok")
        test_file.unlink()
        return PERSISTENT_DISK_PATH
    except Exception as exc:
        logger.warning(
            "Persistent disk غير متاح (%s). استخدام المسار المحلي %s",
            exc, LOCAL_FALLBACK_PATH,
        )
        LOCAL_FALLBACK_PATH.mkdir(parents=True, exist_ok=True)
        return LOCAL_FALLBACK_PATH


def is_cloudinary_available() -> bool:
    """يتحقق من توفر بيانات اعتماد Cloudinary."""
    try:
        from app.services.cloudinary_service import is_configured
        return is_configured()
    except Exception:
        return False


async def save_media_permanently(
    file: UploadFile,
    folder: str = "general",
    user_id: Optional[int] = None,
    is_video: bool = False,
) -> dict:
    """
    يحفظ الملف بشكل دائم — يُرجع dict فيه:
      - url:        رابط نهائي قابل للاستخدام مباشرة
      - storage:    'cloudinary' | 'persistent_disk' | 'local'
      - public_id:  (في Cloudinary فقط)
    """
    # ===== 1) محاولة Cloudinary أولاً =====
    if is_cloudinary_available():
        try:
            from app.services.cloudinary_service import upload_file as cdn_upload
            # نحفظ مؤقتاً ثم نرفع
            tmp_dir = _get_storage_root() / "_tmp"
            tmp_dir.mkdir(parents=True, exist_ok=True)
            tmp_path = tmp_dir / f"{uuid.uuid4().hex}_{file.filename}"
            try:
                with open(tmp_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                result = cdn_upload(
                    str(tmp_path),
                    folder=f"yamshat/{folder}/{user_id or 'anon'}",
                    is_video=is_video,
                )
                return {
                    "url": result["url"],
                    "storage": "cloudinary",
                    "public_id": result.get("public_id"),
                }
            finally:
                try:
                    tmp_path.unlink(missing_ok=True)
                except Exception:
                    pass
        except Exception as exc:
            logger.error("فشل رفع Cloudinary، التراجع إلى التخزين المحلي: %s", exc)

    # ===== 2) Persistent Disk أو المسار المحلي =====
    storage_root = _get_storage_root()
    storage_type = "persistent_disk" if storage_root == PERSISTENT_DISK_PATH else "local"

    safe_filename = f"{datetime.utcnow().timestamp()}_{uuid.uuid4().hex[:8]}_{file.filename}"
    target_dir = storage_root / folder / str(user_id or "anon")
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / safe_filename

    with open(target_path, "wb") as buffer:
        # إعادة المؤشر للأول في حال جرت محاولة Cloudinary فاشلة
        try:
            file.file.seek(0)
        except Exception:
            pass
        shutil.copyfileobj(file.file, buffer)

    # نُعيد URL نسبياً يُخدم عبر FastAPI StaticFiles على /uploads
    relative_url = f"/uploads/{folder}/{user_id or 'anon'}/{safe_filename}"
    return {
        "url": relative_url,
        "storage": storage_type,
        "public_id": None,
    }


def get_storage_status() -> dict:
    """يعيد حالة التخزين الحالية — لاستخدامها في /health."""
    return {
        "cloudinary_configured": is_cloudinary_available(),
        "persistent_disk_path": str(PERSISTENT_DISK_PATH),
        "persistent_disk_available": PERSISTENT_DISK_PATH.exists()
        and os.access(PERSISTENT_DISK_PATH, os.W_OK),
        "active_root": str(_get_storage_root()),
    }
