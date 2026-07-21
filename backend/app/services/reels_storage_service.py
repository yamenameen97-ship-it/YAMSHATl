"""
reels_storage_service.py — v88.28
=================================
خدمة تخزين دائم للريلز (Cloud-first).

المشكلة السابقة:
- upload.py يحفظ الفيديو محلياً ثم يحاول رفعه لـ Cloudinary داخل نفس request.
- عند فشل Cloudinary صامتاً، يُخزَّن رابط `/uploads/xxx` في قاعدة البيانات.
- قرص Render غير دائم → عند إعادة النشر تختفي الملفات وتصبح الروابط ميتة.

الحل في هذا الملف:
- دالة موحّدة `persist_reel_media(video_upload, thumbnail_upload, user_id)` تُلزم
  رفع الريلز إلى Cloudinary (عند تفعيله) قبل حفظه في قاعدة البيانات.
- محاولات إعادة (retries) 3 مرات مع تأخير تصاعدي عند فشل Cloudinary.
- إذا لم تنجح، يُرفع HTTP 503 مع رسالة واضحة (لا يُخزَّن رابط ميت).
- إذا لم يكن Cloudinary مُهيّأً على الإطلاق، يتم استخدام PERSISTENT_DISK ويُشار
  إلى ذلك في storage_type — ولا يُحذف الملف عند إعادة النشر إن كان القرص دائماً.
- يُرجع dict فيه:
    video_url, thumbnail_url,
    cloudinary_video_public_id, cloudinary_thumb_public_id,
    storage_type ('cloudinary' | 'persistent_disk' | 'local'),
    duration (لو أعادها Cloudinary).
"""
from __future__ import annotations

import logging
import shutil
import time
import uuid
from pathlib import Path
from typing import Any, Optional

from fastapi import HTTPException, UploadFile, status

from app.api.routes.upload import (
    UPLOAD_DIR,
    _apply_remote_storage,
    _finalize_upload_payload,
    _kind_from_type,
    _mirror_to_legacy_uploads,
    _safe_storage_name,
    _validate_upload,
)
from app.core.media_urls import normalize_media_url
from app.services.cloudinary_service import (
    is_configured as cloudinary_is_configured,
    upload_file as cloudinary_upload_file,
)

logger = logging.getLogger(__name__)

# ثوابت المحاولات
_CLOUD_RETRIES = 3
_CLOUD_RETRY_DELAY_BASE_SEC = 1.5  # 1.5, 3, 4.5


def _write_upload_to_disk(file: UploadFile) -> tuple[Path, str, int, str, str]:
    """يحفظ ملف الرفع مؤقتاً/دائماً على القرص ويُعيد المسار والمعلومات."""
    original_name, size, kind = _validate_upload(file)
    content_type = str(file.content_type or 'application/octet-stream')
    safe_name = _safe_storage_name(original_name, content_type)
    target_path = UPLOAD_DIR / f'{uuid.uuid4().hex}_{safe_name}'
    file.file.seek(0)
    with open(target_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    _mirror_to_legacy_uploads(target_path)
    return target_path, original_name, size, content_type, kind


def _upload_to_cloudinary_with_retries(file_path: Path, is_video: bool) -> Optional[dict]:
    """يحاول الرفع إلى Cloudinary مع إعادة المحاولات. يُرجع None عند فشل نهائي."""
    if not cloudinary_is_configured():
        return None

    last_error: Optional[Exception] = None
    for attempt in range(1, _CLOUD_RETRIES + 1):
        try:
            result = cloudinary_upload_file(str(file_path), is_video=is_video)
            remote_url = str(result.get('url') or '').strip()
            if remote_url:
                logger.info(
                    '[reels_storage] Cloudinary upload OK for %s on attempt %d (public_id=%s)',
                    file_path.name, attempt, result.get('public_id'),
                )
                return result
            last_error = RuntimeError('empty URL')
            logger.warning('[reels_storage] Cloudinary returned empty URL (attempt %d)', attempt)
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            logger.warning(
                '[reels_storage] Cloudinary attempt %d/%d FAILED for %s: %s',
                attempt, _CLOUD_RETRIES, file_path.name, exc,
            )
        if attempt < _CLOUD_RETRIES:
            time.sleep(_CLOUD_RETRY_DELAY_BASE_SEC * attempt)

    logger.error(
        '[reels_storage] Cloudinary upload FAILED after %d attempts for %s: %s',
        _CLOUD_RETRIES, file_path.name, last_error,
    )
    return None


def _persist_single_media(
    file: UploadFile,
    *,
    require_cloud: bool,
    kind_hint: Optional[str] = None,
) -> dict:
    """يحفظ ملفاً واحداً بشكل دائم. عند require_cloud=True يفشل صريحاً إن لم ينجح Cloudinary."""
    target_path, original_name, size, content_type, kind = _write_upload_to_disk(file)
    effective_kind = kind_hint or kind
    is_video = effective_kind == 'video' or str(target_path).lower().endswith(
        ('.mp4', '.mov', '.webm', '.mkv', '.m4v', '.avi', '.3gp')
    )

    payload = _finalize_upload_payload(
        target_path,
        original_name=original_name,
        content_type=content_type,
        size=size,
        kind=effective_kind,
    )

    cloud_result = _upload_to_cloudinary_with_retries(target_path, is_video=is_video)
    if cloud_result:
        payload.update({
            'status': 'completed',
            'file_url': cloud_result['url'],
            'url': cloud_result['url'],
            'media_url': cloud_result['url'],
            'storage': 'cloudinary',
            'provider': 'cloudinary',
            'public_id': cloud_result.get('public_id') or '',
            'remote': cloud_result,
        })
        # الملف المحلي لم نعد بحاجة إليه (الحقيقي على Cloudinary)
        try:
            target_path.unlink(missing_ok=True)
        except Exception:  # noqa: BLE001
            pass
        return payload

    # فشل Cloudinary
    if require_cloud and cloudinary_is_configured():
        # حذف الملف المحلي المؤقت لأنه غير موثوق (سيختفي عند إعادة النشر)
        try:
            target_path.unlink(missing_ok=True)
        except Exception:  # noqa: BLE001
            pass
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                'تعذّر رفع الفيديو إلى التخزين السحابي بعد عدة محاولات. '
                'يرجى المحاولة مرة أخرى بعد لحظات.'
            ),
        )

    # لا Cloudinary مُهيّأ → نُبقي المسار المحلي (يعتمد على PERSISTENT_DISK)
    logger.warning(
        '[reels_storage] Cloudinary NOT configured — using persistent/local for %s',
        target_path.name,
    )
    return payload


def persist_reel_media(
    video_file: UploadFile,
    thumbnail_file: Optional[UploadFile],
    *,
    user_id: int,
) -> dict:
    """
    يحفظ فيديو الريل + الصورة المصغّرة بشكل دائم في Cloudinary (إن أمكن)
    ويُرجع dict فيه كل الحقول اللازمة لإنشاء صف Reel في DB:

        {
            'video_url': str,                       # رابط قابل للتشغيل من أي origin
            'thumbnail_url': str | None,
            'cloudinary_video_public_id': str | None,
            'cloudinary_thumb_public_id': str | None,
            'storage_type': 'cloudinary' | 'persistent_disk' | 'local',
            'duration': int,                        # ثوانٍ (0 إن لم تُتَح)
        }
    """
    # الفيديو مطلوب دائماً: نفرض cloudinary عند تفعيله (لتجنّب رابط محلي ميت)
    video_payload = _persist_single_media(video_file, require_cloud=True, kind_hint='video')

    thumb_payload = None
    if thumbnail_file is not None and hasattr(thumbnail_file, 'filename') and thumbnail_file.filename:
        try:
            thumb_payload = _persist_single_media(
                thumbnail_file, require_cloud=False, kind_hint='image'
            )
        except HTTPException as exc:
            # فشل رفع الـ thumbnail لا يُفشل عملية الريل كاملة
            logger.warning('[reels_storage] thumbnail upload failed (non-fatal): %s', exc.detail)
            thumb_payload = None
        except Exception as exc:  # noqa: BLE001
            logger.warning('[reels_storage] thumbnail upload failed (non-fatal): %s', exc)
            thumb_payload = None

    video_url = normalize_media_url(video_payload.get('media_url')) or video_payload.get('media_url')
    thumb_url = None
    if thumb_payload:
        thumb_url = normalize_media_url(thumb_payload.get('media_url')) or thumb_payload.get('media_url')

    # نوع التخزين
    storage_type = str(video_payload.get('storage') or 'local')

    # duration من Cloudinary لو أعادها
    duration = 0
    try:
        remote = video_payload.get('remote') or {}
        raw_duration = remote.get('duration') if isinstance(remote, dict) else None
        if raw_duration is not None:
            duration = int(float(raw_duration))
    except Exception:  # noqa: BLE001
        duration = 0

    return {
        'video_url': video_url or '',
        'thumbnail_url': thumb_url,
        'cloudinary_video_public_id': (video_payload.get('public_id') or None) if storage_type == 'cloudinary' else None,
        'cloudinary_thumb_public_id': (thumb_payload.get('public_id') if (thumb_payload and thumb_payload.get('storage') == 'cloudinary') else None),
        'storage_type': storage_type,
        'duration': duration,
    }


def rehost_reel_url(video_url: str, *, is_video: bool = True) -> Optional[dict]:
    """
    يحاول إعادة رفع فيديو ريل قديم من قاعدة البيانات (رابط محلي) إلى Cloudinary.
    يُستخدم من endpoint إداري: POST /api/v1/reels/admin/rehost
    يُرجع dict عند النجاح أو None.
    """
    if not cloudinary_is_configured():
        return None
    if not video_url:
        return None

    # نحاول إيجاد الملف على القرص أولاً
    from urllib.parse import urlparse
    parsed = urlparse(video_url)
    path_part = parsed.path or video_url
    marker = '/uploads/'
    idx = path_part.find(marker)
    if idx < 0:
        return None
    filename = path_part[idx + len(marker):].lstrip('/')
    if not filename:
        return None
    local_candidate = UPLOAD_DIR / filename
    if not local_candidate.exists():
        # نُجرّب legacy uploads
        try:
            from app.api.routes.upload import LEGACY_UPLOAD_DIR
            legacy = LEGACY_UPLOAD_DIR / filename
            if legacy.exists():
                local_candidate = legacy
            else:
                return None
        except Exception:  # noqa: BLE001
            return None

    result = _upload_to_cloudinary_with_retries(local_candidate, is_video=is_video)
    if not result:
        return None
    return {
        'video_url': result['url'],
        'cloudinary_public_id': result.get('public_id') or None,
        'storage_type': 'cloudinary',
    }
