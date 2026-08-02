"""
✅ v89.22 (2026) — Share Download Proxy Router
--------------------------------------------------------------
Proxy لتنزيل الفيديو الحقيقي من YouTube / TikTok / Instagram / Twitter / Facebook
عبر yt-dlp، لتفادي CORS في المتصفح.

الهدف: عندما يضغط المستخدم "تنزيل ومشاركة" على رابط منصة معروفة،
الفرونت إند يستدعي POST /api/share/download-media مع الرابط،
والباكاند يستخدم yt-dlp لجلب أفضل فيديو mp4/webm ثم يعيده كـ stream.

هذا يحل مشكلة النشر كصورة thumbnail بدلاً من فيديو حقيقي.
"""
from __future__ import annotations

import asyncio
import logging
import os
import re
import tempfile
import time
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse

from app.core.dependencies import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()

# مجلد مؤقت لتنزيلات yt-dlp
_TMP_DIR = Path(tempfile.gettempdir()) / "yamshat_share_downloads"
_TMP_DIR.mkdir(parents=True, exist_ok=True)

# مدة صلاحية الملف المؤقت (دقيقتان) — يُنظَّف من disk بعد ذلك
_TTL_SECONDS = 120

# منصات مدعومة
_SUPPORTED_HOSTS = re.compile(
    r"(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|twitter\.com|x\.com|"
    r"facebook\.com|fb\.watch|reddit\.com|snapchat\.com)",
    re.IGNORECASE,
)


def _cleanup_expired() -> None:
    """احذف الملفات المنتهية الصلاحية من _TMP_DIR."""
    now = time.time()
    try:
        for f in _TMP_DIR.iterdir():
            try:
                if not f.is_file():
                    continue
                if now - f.stat().st_mtime > _TTL_SECONDS:
                    f.unlink(missing_ok=True)
            except Exception:
                pass
    except Exception:
        pass


def _detect_media_kind(url: str) -> str:
    """
    يحدد بشكل تقريبي إن كان الرابط لصورة (post/photo) أم فيديو.
    بشكل افتراضي نعتبر روابط المنصات فيديو، إلا إن كان الرابط ينتهي بصيغة صورة.
    """
    if re.search(r"\.(jpe?g|png|gif|webp)(\?|$)", url, re.IGNORECASE):
        return "image"
    return "video"


async def _run_ytdlp(url: str, out_dir: Path) -> Optional[Path]:
    """
    تشغيل yt-dlp لتنزيل أفضل صيغة mp4/webm.
    يُرجع Path للملف الناتج، أو None عند الفشل.
    """
    try:
        # نستخدم yt-dlp كـ Python API إن كانت متاحة، وإلا كأمر خارجي
        try:
            import yt_dlp  # type: ignore
        except ImportError:
            logger.error("[share-download] yt_dlp not installed")
            return None

        ts = int(time.time() * 1000)
        outtmpl = str(out_dir / f"ymdl_{ts}_%(id)s.%(ext)s")

        ydl_opts = {
            "outtmpl": outtmpl,
            "format": "best[ext=mp4]/best[ext=webm]/best",
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
            "max_filesize": 200 * 1024 * 1024,  # 200MB سقف احترازي
            "socket_timeout": 30,
            "retries": 2,
        }

        def _blocking_download() -> Optional[Path]:
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                    if not info:
                        return None
                    # yt-dlp يعيد قاموساً؛ نحصل على المسار عبر prepare_filename
                    filename = ydl.prepare_filename(info)
                    path = Path(filename)
                    if path.exists():
                        return path
                    # في بعض الحالات الامتداد يختلف بعد التنزيل الفعلي
                    stem = path.stem
                    for candidate in out_dir.glob(f"{stem}.*"):
                        if candidate.is_file() and candidate.stat().st_size > 0:
                            return candidate
                    return None
            except Exception as exc:
                logger.warning(f"[share-download] yt-dlp failed for {url}: {exc}")
                return None

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, _blocking_download)
        return result
    except Exception as exc:
        logger.exception(f"[share-download] fatal: {exc}")
        return None


@router.post("/download-media")
async def download_media_proxy(
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
):
    """
    ينزّل الفيديو الفعلي من رابط منصة معروفة ويعيد ملفاً محلياً مؤقتاً.

    Request:  { "url": "https://www.youtube.com/watch?v=..." }
    Response: { "ok": true, "file_url": "/api/share/media/<name>", "mime": "video/mp4",
                "size": 1234567, "kind": "video", "filename": "..." }

    عند الفشل: { "ok": false, "reason": "..." } (200 status لسهولة معالجة الواجهة)
    """
    _cleanup_expired()

    url = str(payload.get("url") or "").strip()
    if not url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="url مفقود")

    if not _SUPPORTED_HOSTS.search(url):
        return JSONResponse(
            status_code=200,
            content={"ok": False, "reason": "PLATFORM_UNSUPPORTED"},
        )

    kind = _detect_media_kind(url)

    file_path = await _run_ytdlp(url, _TMP_DIR)
    if not file_path or not file_path.exists() or file_path.stat().st_size == 0:
        logger.info(f"[share-download] falling back — yt-dlp returned nothing for {url}")
        return JSONResponse(
            status_code=200,
            content={"ok": False, "reason": "YTDLP_UNAVAILABLE_OR_BLOCKED"},
        )

    size = file_path.stat().st_size
    ext = file_path.suffix.lower().lstrip(".") or "mp4"
    mime_map = {
        "mp4": "video/mp4",
        "webm": "video/webm",
        "mkv": "video/x-matroska",
        "mov": "video/quicktime",
        "m4v": "video/mp4",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp",
    }
    mime = mime_map.get(ext, "application/octet-stream")

    return {
        "ok": True,
        "file_url": f"/api/share/media/{file_path.name}",
        "mime": mime,
        "size": size,
        "kind": "video" if mime.startswith("video/") else "image",
        "filename": file_path.name,
        "requested_kind": kind,
    }


@router.get("/media/{name}")
async def get_media_file(name: str):
    """
    يُرجع الملف المؤقت الذي نتج من /download-media.
    يُقدَّم بـ CORS-friendly headers لأنه من نفس الأصل (same-origin) بالنسبة للفرونت.
    """
    # حماية بسيطة ضد path traversal
    if "/" in name or "\\" in name or ".." in name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid name")

    file_path = _TMP_DIR / name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="file not found or expired")

    ext = file_path.suffix.lower().lstrip(".") or "mp4"
    mime_map = {
        "mp4": "video/mp4",
        "webm": "video/webm",
        "mkv": "video/x-matroska",
        "mov": "video/quicktime",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp",
    }
    mime = mime_map.get(ext, "application/octet-stream")

    return FileResponse(
        path=str(file_path),
        media_type=mime,
        filename=file_path.name,
        headers={"Cache-Control": "no-store"},
    )
