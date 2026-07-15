import logging
import re
from urllib.parse import urlparse

import cloudinary
import cloudinary.uploader
import cloudinary.api
from app.core.config import settings

logger = logging.getLogger(__name__)

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)

def is_configured() -> bool:
    return settings.cloudinary_configured

def upload_file(file_path: str, folder: str | None = None, is_video: bool = False) -> dict:
    if not is_configured():
        raise RuntimeError('Cloudinary is not configured')

    # Adaptive Media Optimization & Responsive Variants
    upload_options = {
        "folder": folder or settings.CLOUDINARY_FOLDER,
        "resource_type": "auto",
        "use_filename": True,
        "unique_filename": True,
        "overwrite": False,
        "fetch_format": "auto",  # CDN Optimization
        "quality": "auto",       # Adaptive Optimization
    }

    if is_video:
        # Async Transcoding for Videos
        upload_options.update({
            "eager": [
                {"streaming_profile": "full_hd", "format": "m3u8"}, # Adaptive Bitrate Streaming
                {"width": 720, "crop": "scale", "format": "mp4"},   # Responsive Variant
            ],
            "eager_async": True,
            "eager_notification_url": f"{settings.BACKEND_ORIGIN}/api/v1/upload/webhook/cloudinary"
        })
    else:
        # Responsive Image Variants
        upload_options.update({
            "transformation": [
                {"width": "auto", "dpr": "auto", "crop": "scale"},
                {"quality": "auto", "fetch_format": "auto"}
            ]
        })

    result = cloudinary.uploader.upload(file_path, **upload_options)
    
    secure_url = result.get('secure_url') or result.get('url')
    if not secure_url:
        raise RuntimeError('Cloudinary upload failed')
        
    return {
        "url": secure_url,
        "public_id": result.get("public_id"),
        "format": result.get("format"),
        "version": result.get("version"),
        "responsive_variants": result.get("eager", []),
        "optimization": "adaptive_auto"
    }

def get_optimized_url(public_id: str, width: int = None, height: int = None, crop: str = "fill") -> str:
    """توليد روابط محسنة لـ CDN بناءً على المتطلبات"""
    options = {"fetch_format": "auto", "quality": "auto"}
    if width: options["width"] = width
    if height: options["height"] = height
    if width or height: options["crop"] = crop

    return cloudinary.utils.cloudinary_url(public_id, **options)[0]


# ============================== v84.0 — حذف الوسائط ==============================
_PUBLIC_ID_RE = re.compile(r'/(?:image|video|raw)/upload/(?:v\d+/)?(.+?)(?:\.[a-zA-Z0-9]+)?$')


def extract_public_id_from_url(media_url: str) -> str | None:
    """يستخرج public_id من رابط Cloudinary كامل.

    مثال: https://res.cloudinary.com/xx/image/upload/v1712345678/stories/abc.jpg
    → stories/abc

    يرجع None إن لم يتمكن من الاستخراج أو إن كان الرابط غير Cloudinary.
    """
    if not media_url or not isinstance(media_url, str):
        return None
    try:
        parsed = urlparse(media_url)
    except Exception:
        return None
    if 'cloudinary' not in (parsed.netloc or '').lower():
        return None
    match = _PUBLIC_ID_RE.search(parsed.path or '')
    if not match:
        return None
    return match.group(1)


def _guess_resource_type(media_url: str) -> str:
    u = (media_url or '').lower()
    if any(seg in u for seg in ('/video/upload/', '.mp4', '.webm', '.mov', '.m4v', '.mkv')):
        return 'video'
    if '/raw/upload/' in u:
        return 'raw'
    return 'image'


def delete_file(media_url_or_public_id: str, resource_type: str | None = None) -> bool:
    """يحذف ملفاً من Cloudinary. حذف آمن — لا يرفع استثناء جديداً.

    Args:
        media_url_or_public_id: إما URL كامل (سيُستخرج public_id منه) أو public_id مباشرة.
        resource_type: image | video | raw — إن لم يُحدّد يُخمّن من الرابط.

    Returns: True إذا تم الحذف أو لم يكن الملف موجوداً أصلاً، False لأي خطأ.
    """
    if not is_configured():
        return False
    if not media_url_or_public_id:
        return False

    if media_url_or_public_id.startswith(('http://', 'https://')):
        public_id = extract_public_id_from_url(media_url_or_public_id)
        if not public_id:
            return False
        rtype = resource_type or _guess_resource_type(media_url_or_public_id)
    else:
        public_id = media_url_or_public_id
        rtype = resource_type or 'image'

    try:
        result = cloudinary.uploader.destroy(public_id, resource_type=rtype, invalidate=True)
        status_val = str(result.get('result') or '').lower()
        # cloudinary يرجع "ok" للنجاح أو "not found" لملف غير موجود أصلاً
        return status_val in ('ok', 'not found', 'not_found')
    except Exception as exc:
        logger.warning('Cloudinary destroy failed for %s: %s', public_id, exc)
        return False


def delete_files_batch(media_urls: list[str]) -> dict:
    """حذف دفعة من ملفات Cloudinary. يجمّع حسب resource_type لمكالمة API واحدة."""
    if not is_configured() or not media_urls:
        return {'deleted': 0, 'failed': 0}

    grouped: dict[str, list[str]] = {}
    for url in media_urls:
        pid = extract_public_id_from_url(url) if url.startswith(('http://', 'https://')) else url
        if not pid:
            continue
        rtype = _guess_resource_type(url) if url.startswith(('http://', 'https://')) else 'image'
        grouped.setdefault(rtype, []).append(pid)

    deleted = 0
    failed = 0
    for rtype, ids in grouped.items():
        # cloudinary.api.delete_resources يقبل حتى 100 معرّف لكل مكالمة
        for chunk_start in range(0, len(ids), 100):
            chunk = ids[chunk_start:chunk_start + 100]
            try:
                res = cloudinary.api.delete_resources(chunk, resource_type=rtype, invalidate=True)
                deleted_map = res.get('deleted') or {}
                for pid, status_val in deleted_map.items():
                    if str(status_val).lower() in ('deleted', 'not_found'):
                        deleted += 1
                    else:
                        failed += 1
            except Exception as exc:
                logger.warning('Cloudinary batch destroy failed (%s ids): %s', len(chunk), exc)
                failed += len(chunk)
    return {'deleted': deleted, 'failed': failed}
