"""
✅ v89.26 (2026-08-03) — Share Download Proxy Router — ROOT FIX
--------------------------------------------------------------
Proxy لتنزيل الفيديو الحقيقي من YouTube / TikTok / Instagram / Twitter / Facebook.

السبب الجذري السابق (v89.22–v89.25):
    yt-dlp كان يفشل على Render لثلاثة أسباب متراكبة:
      1) YouTube يحجب IPs الشائعة لموفّري السحابة (429/403 على الويب).
      2) ffmpeg قد يكون غير متوفّر → yt-dlp يفشل في merge لصيغ منفصلة.
      3) الإصدار الافتراضي من yt-dlp يستخدم `web` player client الذي بات يتطلّب
         PoToken منذ 2025؛ فيرجع صيغاً محدودة أو فارغة على الروابط الجديدة.
    النتيجة: كل تنزيل يسقط لـ thumbnail → الفيديو يُنشر كصورة.

الإصلاح الجذري:
    A) yt-dlp options مقوّاة: player_client=android (لا يحتاج PoToken)،
       User-Agent موبايل، `format` يبحث عن progressive mp4 بدون ffmpeg،
       retries زيادة + geo-bypass.
    B) Piped fallback: عند فشل yt-dlp، نستعلم Piped API (خوادم عامة) لروابط
       الفيديو المباشرة (progressive stream) ونحمّلها في الباك‌إند بـ requests.
    C) رفض صريح لأي محتوى ليس فيديو (magic bytes سيرفر-سايد) قبل إعادته
       للواجهة → لا يتسرّب thumbnail بمُيم mp4 مغلوط أبداً.
    D) الرد يعيد الآن kind='video' أو kind='image' حسب التوقيع الفعلي،
       بحيث لو رجعت صورة (لسبب ما) تظهر كصورة صراحةً في الواجهة.
"""
from __future__ import annotations

import asyncio
import logging
import os
import re
import tempfile
import time
from pathlib import Path
from typing import Optional, Tuple

from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse

from app.core.dependencies import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()

# مجلد مؤقت لتنزيلات yt-dlp
_TMP_DIR = Path(tempfile.gettempdir()) / "yamshat_share_downloads"
_TMP_DIR.mkdir(parents=True, exist_ok=True)

# مدة صلاحية الملف المؤقت (5 دقائق — كبير كفاية لنشر بطيء)
_TTL_SECONDS = 300

# منصات مدعومة
_SUPPORTED_HOSTS = re.compile(
    r"(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|twitter\.com|x\.com|"
    r"facebook\.com|fb\.watch|reddit\.com|snapchat\.com)",
    re.IGNORECASE,
)

_YT_ID_PATTERNS = [
    re.compile(r"youtu\.be/([A-Za-z0-9_-]{6,})"),
    re.compile(r"[?&]v=([A-Za-z0-9_-]{6,})"),
    re.compile(r"youtube\.com/shorts/([A-Za-z0-9_-]{6,})"),
    re.compile(r"youtube\.com/embed/([A-Za-z0-9_-]{6,})"),
    re.compile(r"youtube\.com/live/([A-Za-z0-9_-]{6,})"),
]

# قائمة خوادم Piped عامة (يمكن تخصيصها بيئياً)
_PIPED_INSTANCES = [
    inst.strip() for inst in (
        os.environ.get("PIPED_INSTANCES")
        or "https://pipedapi.kavin.rocks,https://pipedapi.tokhmi.xyz,https://api-piped.mha.fi,https://pipedapi.moomoo.me"
    ).split(",") if inst.strip()
]

_MOBILE_UA = (
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Mobile Safari/537.36"
)


def _cleanup_expired() -> None:
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
    if re.search(r"\.(jpe?g|png|gif|webp)(\?|$)", url, re.IGNORECASE):
        return "image"
    return "video"


def _extract_yt_id(url: str) -> Optional[str]:
    for pat in _YT_ID_PATTERNS:
        m = pat.search(url)
        if m:
            return m.group(1)
    return None


# ✅ v89.26 ROOT FIX: فحص magic bytes سيرفر-سايد — نضمن أن ما نعيده فيديو حقيقي
def _sniff_kind(path: Path) -> str:
    """
    يعيد 'video' | 'image' | 'unknown' بناءً على أول 16 بايت من الملف.
    """
    try:
        with path.open("rb") as fh:
            head = fh.read(16)
        if len(head) < 12:
            return "unknown"
        if head[0] == 0xFF and head[1] == 0xD8 and head[2] == 0xFF:
            return "image"  # jpeg
        if head[0] == 0x89 and head[1] == 0x50 and head[2] == 0x4E and head[3] == 0x47:
            return "image"  # png
        if head[0] == 0x47 and head[1] == 0x49 and head[2] == 0x46 and head[3] == 0x38:
            return "image"  # gif
        if head[0] == 0x52 and head[1] == 0x49 and head[2] == 0x46 and head[3] == 0x46 and head[8:12] == b"WEBP":
            return "image"  # webp
        if head[4:8] == b"ftyp":
            return "video"  # mp4
        if head[0] == 0x1A and head[1] == 0x45 and head[2] == 0xDF and head[3] == 0xA3:
            return "video"  # webm/matroska
    except Exception:
        return "unknown"
    return "unknown"


async def _run_ytdlp(url: str, out_dir: Path) -> Optional[Path]:
    """
    ✅ v89.26 ROOT FIX A: yt-dlp options مقوّاة لتجاوز حجب YouTube على Render.
    """
    try:
        try:
            import yt_dlp  # type: ignore
        except ImportError:
            logger.error("[share-download] yt_dlp not installed")
            return None

        ts = int(time.time() * 1000)
        outtmpl = str(out_dir / f"ymdl_{ts}_%(id)s.%(ext)s")

        # نبحث عن progressive mp4 (فيديو+صوت في ملف واحد) بدون ما نحتاج ffmpeg للدمج
        # itag 18 = 360p mp4 progressive (الأكثر ضمانةً)، 22 = 720p mp4 progressive.
        ydl_opts = {
            "outtmpl": outtmpl,
            # ترتيب مقصود: progressive أولاً (لا يحتاج ffmpeg) → أي best بدون merge → أي best
            "format": (
                "best[ext=mp4][acodec!=none][vcodec!=none]/"
                "18/22/"
                "best[ext=mp4]/best[ext=webm]/best"
            ),
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
            "max_filesize": 200 * 1024 * 1024,
            "socket_timeout": 30,
            "retries": 4,
            "fragment_retries": 4,
            "geo_bypass": True,
            "nocheckcertificate": True,
            "http_headers": {
                "User-Agent": _MOBILE_UA,
                "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
            },
            # ✅ الأهم لتجاوز حجب PoToken من web player:
            "extractor_args": {
                "youtube": {
                    "player_client": ["android", "ios", "web"],
                    "player_skip": ["configs"],
                }
            },
        }

        def _blocking_download() -> Optional[Path]:
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                    if not info:
                        return None
                    filename = ydl.prepare_filename(info)
                    path = Path(filename)
                    if path.exists() and path.stat().st_size > 0:
                        return path
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
        logger.exception(f"[share-download] fatal in _run_ytdlp: {exc}")
        return None


# ✅ v89.26 ROOT FIX B: Piped fallback — عندما يفشل yt-dlp (أغلب أسباب الفشل
#     على Render هي حجب YouTube لـ IP)، نستعلم Piped API لأخذ رابط
#     progressive stream ونحمّله من هنا (server-side، لا CORS).
async def _download_via_piped(url: str, out_dir: Path) -> Optional[Path]:
    yt_id = _extract_yt_id(url)
    if not yt_id:
        return None
    try:
        import requests  # type: ignore
    except ImportError:
        logger.error("[share-download] requests not installed for Piped fallback")
        return None

    def _blocking_piped() -> Optional[Path]:
        for instance in _PIPED_INSTANCES:
            try:
                api = f"{instance.rstrip('/')}/streams/{yt_id}"
                r = requests.get(api, timeout=15, headers={"User-Agent": _MOBILE_UA})
                if r.status_code != 200:
                    logger.info(f"[share-download] Piped {instance} → HTTP {r.status_code}")
                    continue
                data = r.json() or {}
                # videoStreams: صيغ فيديو-فقط. نبحث عن progressive (mp4 + صوت)
                # في Piped هذه توجد ضمن videoStreams مع videoOnly=false
                candidates = []
                for s in (data.get("videoStreams") or []):
                    if s.get("videoOnly") is False and (s.get("format") or "").upper().startswith("MP4"):
                        candidates.append(s)
                if not candidates:
                    # fallback إلى أي mp4 progressive بأي شكل
                    for s in (data.get("videoStreams") or []):
                        if s.get("videoOnly") is False:
                            candidates.append(s)
                if not candidates:
                    logger.info(f"[share-download] Piped {instance} → no progressive streams")
                    continue
                # ترتيب حسب bitrate تنازلياً — نأخذ أعلى جودة progressive
                candidates.sort(key=lambda s: int(s.get("bitrate") or 0), reverse=True)
                stream_url = candidates[0].get("url")
                if not stream_url:
                    continue

                # حمّل الفيديو
                ts = int(time.time() * 1000)
                out_path = out_dir / f"piped_{ts}_{yt_id}.mp4"
                with requests.get(stream_url, stream=True, timeout=60,
                                  headers={"User-Agent": _MOBILE_UA}) as vresp:
                    if vresp.status_code != 200:
                        logger.info(f"[share-download] Piped stream {vresp.status_code}")
                        continue
                    total = 0
                    max_bytes = 200 * 1024 * 1024
                    with out_path.open("wb") as fh:
                        for chunk in vresp.iter_content(chunk_size=64 * 1024):
                            if not chunk:
                                continue
                            fh.write(chunk)
                            total += len(chunk)
                            if total > max_bytes:
                                break
                if out_path.exists() and out_path.stat().st_size > 32 * 1024:
                    return out_path
                try:
                    out_path.unlink(missing_ok=True)
                except Exception:
                    pass
            except Exception as exc:
                logger.warning(f"[share-download] Piped instance {instance} failed: {exc}")
                continue
        return None

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _blocking_piped)


@router.post("/download-media")
async def download_media_proxy(
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
):
    """
    ✅ v89.26: ينزّل الفيديو الفعلي من رابط منصة معروفة.
    مسارات fallback:
      1) yt-dlp (android client — يتجاوز PoToken).
      2) Piped fallback (لو yt-dlp فشل — استعلام API + progressive stream).
      3) عند فشل الجميع: ok:false مع reason صريح — الواجهة تُظهر انحدار
         للـ thumbnail مع إشعار المستخدم صراحةً.
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

    requested_kind = _detect_media_kind(url)

    # ---- المسار 1: yt-dlp ----
    file_path = await _run_ytdlp(url, _TMP_DIR)

    # ---- المسار 2: Piped fallback (لـ YouTube فقط حالياً) ----
    if not file_path or not file_path.exists() or file_path.stat().st_size == 0:
        if re.search(r"youtube\.com|youtu\.be", url, re.IGNORECASE):
            logger.info(f"[share-download] yt-dlp failed, trying Piped fallback for {url}")
            file_path = await _download_via_piped(url, _TMP_DIR)

    if not file_path or not file_path.exists() or file_path.stat().st_size == 0:
        logger.info(f"[share-download] all sources failed for {url}")
        return JSONResponse(
            status_code=200,
            content={"ok": False, "reason": "YTDLP_UNAVAILABLE_OR_BLOCKED"},
        )

    # ---- ✅ v89.26 ROOT FIX C: فحص magic bytes قبل إعادة النتيجة ----
    sniffed = _sniff_kind(file_path)
    size = file_path.stat().st_size

    if requested_kind == "video" and sniffed == "image":
        # النتيجة صورة رغم أن الرابط يطلب فيديو → نرفض صراحةً
        try:
            file_path.unlink(missing_ok=True)
        except Exception:
            pass
        logger.warning(f"[share-download] refusing image body for video request: {url}")
        return JSONResponse(
            status_code=200,
            content={"ok": False, "reason": "BACKEND_GOT_IMAGE_NOT_VIDEO"},
        )

    # حد أدنى معقول للفيديو الحقيقي
    if requested_kind == "video" and sniffed == "video" and size < 32 * 1024:
        try:
            file_path.unlink(missing_ok=True)
        except Exception:
            pass
        return JSONResponse(
            status_code=200,
            content={"ok": False, "reason": f"VIDEO_TOO_SMALL_{size}"},
        )

    ext = file_path.suffix.lower().lstrip(".") or ("mp4" if sniffed == "video" else "bin")
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

    # ✅ v89.26 ROOT FIX D: kind الحقيقي مبنيّ على magic bytes، لا الامتداد
    if sniffed == "video" and not mime.startswith("video/"):
        mime = "video/mp4"
    elif sniffed == "image" and not mime.startswith("image/"):
        mime = "image/jpeg"

    final_kind = "video" if mime.startswith("video/") else ("image" if mime.startswith("image/") else requested_kind)

    return {
        "ok": True,
        "file_url": f"/api/share/media/{file_path.name}",
        "mime": mime,
        "size": size,
        "kind": final_kind,
        "filename": file_path.name,
        "requested_kind": requested_kind,
        "sniffed_kind": sniffed,
    }


@router.get("/media/{name}")
async def get_media_file(name: str):
    """
    يُرجع الملف المؤقت الذي نتج من /download-media.
    """
    # حماية بسيطة ضد path traversal
    if "/" in name or "\\" in name or ".." in name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid name")

    file_path = _TMP_DIR / name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="file not found or expired")

    # ✅ v89.26: نستخدم الفحص الفعلي (magic bytes) بدل الامتداد الأعمى
    sniffed = _sniff_kind(file_path)
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
    if sniffed == "video" and not mime.startswith("video/"):
        mime = "video/mp4"
    elif sniffed == "image" and not mime.startswith("image/"):
        mime = "image/jpeg"

    return FileResponse(
        path=str(file_path),
        media_type=mime,
        filename=file_path.name,
        headers={"Cache-Control": "no-store"},
    )
