"""
video_pipeline.py — v89.28 ROOT FIX
====================================
خطّ إنتاج (pipeline) موحّد لمعالجة الفيديو والصور بعد الرفع.

المشكلة المُكتشَفة سابقاً
------------------------
تقرير الفحص v89.27 أشار إلى أن نظام الفيديوهات والريلز يفتقر إلى بنية متكاملة
لضغط الفيديوهات آلياً (Video Transcoding/Compression) وتحويلها إلى صيغ متعددة
الجودات (HLS/mp4 responsive) قبل تخزينها. النتائج:
    - استهلاك عالٍ لمساحة القرص (كل فيديو يُخزَّن بجودته الأصلية 4K/60fps).
    - بطء التحميل لأصحاب الإنترنت الضعيف (لا يوجد mp4 720p/480p/240p).
    - عدم القدرة على الـ Adaptive Bitrate Streaming محلياً (لا HLS master).
    - `MediaService.transcode_video` معرَّفة لكنها لم تُستدعى من أيّ مكان.
    - `process_media_background` في upload.py كان يقوم فقط بإعادة الرفع إلى
      Cloudinary بدون أيّ ضغط محلي ولا خطة fallback عند فشله.

جذور الحل في هذا الملف
----------------------
1) طبقة `TranscodeResult` تصف مخرجات معالجة فيديو واحد بشكل موحّد.
2) دالة `probe_video()` تستخدم `ffprobe` لجلب الأبعاد والمدة والـ bitrate.
3) دالة `transcode_video_to_ladder()` تُنتج mp4 متعدد الجودات (240/360/480/720/1080)
   وفق مصفوفة (ladder) قابلة للتمديد، مع تجنّب تكرار الجودة الأعلى من الأصل.
4) دالة `build_hls_master()` تولّد master.m3u8 يشير إلى كل مستوى جودة
   مع playlist خاص بكل مستوى + segments (.ts) لكل جودة (Adaptive Bitrate).
5) دالة `generate_video_poster()` تلتقط thumbnail (poster) عند الثانية 1.
6) دالة `compress_image()` تعيد ضغط الصور (JPEG q=82 + WebP q=80) وتحافظ على
   الصورة الأصلية كنسخة احتياطية.
7) دالة `process_media_pipeline()` هي نقطة الدخول العامة: تحدّد النوع
   (video / image) وتُنفّذ كل الخطوات، وتعيد dict فيه كل المسارات النهائية
   جاهزة للحفظ في قاعدة البيانات.
8) كل المخرجات تُكتَب داخل `UPLOAD_DIR/derivatives/<file_id>/…` بحيث تصبح
   قابلة للخدمة من نفس `/uploads` mount الحالي دون أيّ إعادة إعداد.
9) كل عمليات ffmpeg تعمل عبر `asyncio.subprocess` بحيث لا تعطّل حلقة الحدث
   الرئيسية للـ FastAPI. يوجد timeout آمن لكل عملية.
10) إن لم يكن ffmpeg مُثَبَّتاً على البيئة، ترجع الدوال حالة `skipped` مع
    السبب — بدلاً من كسر الرفع بأكمله. النظام يبقى شغّالاً بجودة أصلية
    فقط، وترسل تحذيراً واضحاً إلى logs الإنتاج.

ملاحظات نشر
-----------
- على Render نضيف ffmpeg إلى `nixpacks.toml` أو Dockerfile (سنُحدّثه أدناه).
- الأصل يُحذف اختيارياً بعد نجاح كل الجودات لتوفير مساحة القرص، عبر
  فلاغ `remove_original_after_success` الذي يُقرَأ من متغير البيئة.
- الملف مستقل تماماً: لا يعتمد على أيّ خدمة LLM أو حزمة node — Python + ffmpeg CLI.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import shutil
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# ============================================================
# إعدادات الـ ladder (قابل للتمديد بسهولة)
# ============================================================

# كل مستوى: (label, max_height, v_bitrate_k, a_bitrate_k, maxrate_k, bufsize_k)
# الاختيار يوازن بين جودة يوتيوب-شورتس/ريلز والاستهلاك على قرص Render.
_LADDER = [
    ("240p",  240,  400,  64,  600,  1200),
    ("360p",  360,  700,  96,  1050, 2100),
    ("480p",  480,  1200, 128, 1800, 3600),
    ("720p",  720,  2500, 128, 3750, 7500),
    ("1080p", 1080, 4500, 192, 6750, 13500),
]

# مدد timeout لكل عملية ffmpeg (بالثواني)
_FFMPEG_PROBE_TIMEOUT = 15
_FFMPEG_ENCODE_TIMEOUT = int(os.getenv("FFMPEG_ENCODE_TIMEOUT", "900"))  # 15 دقيقة كحد أقصى

# HLS
_HLS_SEGMENT_SECONDS = 4
_HLS_PLAYLIST_TYPE = "vod"

# صور
_IMAGE_JPEG_QUALITY = 82
_IMAGE_WEBP_QUALITY = 80

# سلوك
_REMOVE_ORIGINAL_AFTER_SUCCESS = os.getenv(
    "REMOVE_ORIGINAL_AFTER_TRANSCODE", "false"
).strip().lower() in {"1", "true", "yes", "on"}


# ============================================================
# نتائج مُوحَّدة
# ============================================================

@dataclass
class VideoVariant:
    label: str
    height: int
    mp4_path: str        # مسار محلي داخل UPLOAD_DIR
    mp4_url: str         # /uploads/derivatives/<id>/720p.mp4
    hls_playlist_url: str  # /uploads/derivatives/<id>/hls/720p/index.m3u8


@dataclass
class TranscodeResult:
    kind: str  # "video" | "image" | "unsupported"
    status: str  # "ok" | "skipped" | "partial" | "failed"
    reason: str = ""
    derivatives_dir: str = ""     # المسار المطلق على القرص
    derivatives_url_prefix: str = ""  # مثل /uploads/derivatives/<id>
    variants: list[VideoVariant] = field(default_factory=list)
    hls_master_url: str = ""
    poster_url: str = ""
    webp_url: str = ""
    original_kept: bool = True
    duration_sec: float = 0.0
    original_width: int = 0
    original_height: int = 0

    def to_dict(self) -> dict:
        return {
            "kind": self.kind,
            "status": self.status,
            "reason": self.reason,
            "derivatives_url_prefix": self.derivatives_url_prefix,
            "variants": [
                {
                    "label": v.label,
                    "height": v.height,
                    "mp4_url": v.mp4_url,
                    "hls_url": v.hls_playlist_url,
                }
                for v in self.variants
            ],
            "hls_master_url": self.hls_master_url,
            "poster_url": self.poster_url,
            "webp_url": self.webp_url,
            "original_kept": self.original_kept,
            "duration_sec": self.duration_sec,
            "original_width": self.original_width,
            "original_height": self.original_height,
        }


# ============================================================
# أدوات مساعدة
# ============================================================

def _ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None and shutil.which("ffprobe") is not None


def _url_for(path: Path, upload_dir: Path) -> str:
    """يحوّل مسار داخل UPLOAD_DIR إلى URL نسبي يبدأ بـ /uploads/."""
    try:
        rel = path.resolve().relative_to(upload_dir.resolve())
    except Exception:
        rel = Path(path.name)
    return "/uploads/" + str(rel).replace(os.sep, "/")


async def _run_ffmpeg(cmd: list[str], *, timeout: int, tag: str) -> tuple[bool, str]:
    """يُشغّل ffmpeg/ffprobe بشكل غير حاجب. يُرجع (نجاح, stderr)."""
    logger.info("[video_pipeline] running %s: %s", tag, " ".join(cmd[:5]) + " …")
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        except asyncio.TimeoutError:
            proc.kill()
            await proc.wait()
            logger.error("[video_pipeline] %s TIMEOUT after %ss", tag, timeout)
            return False, f"timeout after {timeout}s"

        if proc.returncode != 0:
            err = (stderr or b"").decode("utf-8", errors="ignore")[-800:]
            logger.error("[video_pipeline] %s FAILED rc=%s err=%s", tag, proc.returncode, err)
            return False, err
        return True, (stdout or b"").decode("utf-8", errors="ignore")
    except FileNotFoundError:
        return False, "ffmpeg binary not found"
    except Exception as exc:  # noqa: BLE001
        logger.exception("[video_pipeline] %s raised: %s", tag, exc)
        return False, str(exc)


# ============================================================
# ffprobe
# ============================================================

async def probe_video(path: Path) -> Optional[dict]:
    """يعيد dict فيه: width, height, duration_sec, bitrate_kbps."""
    if not _ffmpeg_available():
        return None

    cmd = [
        "ffprobe",
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height,duration,bit_rate:format=duration,bit_rate",
        "-of", "json",
        str(path),
    ]
    ok, output = await _run_ffmpeg(cmd, timeout=_FFMPEG_PROBE_TIMEOUT, tag="ffprobe")
    if not ok:
        return None
    try:
        data = json.loads(output or "{}")
    except Exception:
        return None

    streams = data.get("streams") or []
    fmt = data.get("format") or {}
    if not streams:
        return None

    s0 = streams[0]
    width = int(s0.get("width") or 0)
    height = int(s0.get("height") or 0)
    duration = float(s0.get("duration") or fmt.get("duration") or 0.0)
    bitrate = int((s0.get("bit_rate") or fmt.get("bit_rate") or 0) or 0) // 1000
    return {
        "width": width,
        "height": height,
        "duration_sec": duration,
        "bitrate_kbps": bitrate,
    }


# ============================================================
# Transcoding — ladder (mp4)
# ============================================================

async def _transcode_one_mp4(
    src: Path,
    dst: Path,
    *,
    max_height: int,
    v_bitrate_k: int,
    a_bitrate_k: int,
    maxrate_k: int,
    bufsize_k: int,
) -> bool:
    """ينشئ mp4 واحد بجودة معينة، مع Fast Start ومحتوى H.264 + AAC."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    scale_filter = (
        f"scale='if(gt(iw*{max_height}/ih,iw),iw,-2)':'if(gt(iw*{max_height}/ih,iw),ih,{max_height})',"
        f"pad=ceil(iw/2)*2:ceil(ih/2)*2"
    )
    cmd = [
        "ffmpeg", "-y", "-i", str(src),
        "-vf", scale_filter,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-profile:v", "main",
        "-level", "4.0",
        "-pix_fmt", "yuv420p",
        "-b:v", f"{v_bitrate_k}k",
        "-maxrate", f"{maxrate_k}k",
        "-bufsize", f"{bufsize_k}k",
        "-c:a", "aac",
        "-b:a", f"{a_bitrate_k}k",
        "-ac", "2",
        "-movflags", "+faststart",
        "-sn", "-dn",
        str(dst),
    ]
    ok, _ = await _run_ffmpeg(cmd, timeout=_FFMPEG_ENCODE_TIMEOUT, tag=f"transcode:{max_height}p")
    return ok and dst.exists() and dst.stat().st_size > 0


# ============================================================
# HLS
# ============================================================

async def _make_hls_for_variant(
    src_mp4: Path,
    variant_hls_dir: Path,
) -> bool:
    """يقسّم mp4 واحد إلى segments HLS + playlist خاص به."""
    variant_hls_dir.mkdir(parents=True, exist_ok=True)
    playlist = variant_hls_dir / "index.m3u8"
    seg_pattern = str(variant_hls_dir / "seg_%03d.ts")

    cmd = [
        "ffmpeg", "-y", "-i", str(src_mp4),
        "-c", "copy",
        "-f", "hls",
        "-hls_time", str(_HLS_SEGMENT_SECONDS),
        "-hls_playlist_type", _HLS_PLAYLIST_TYPE,
        "-hls_segment_filename", seg_pattern,
        str(playlist),
    ]
    ok, _ = await _run_ffmpeg(cmd, timeout=_FFMPEG_ENCODE_TIMEOUT, tag=f"hls:{variant_hls_dir.name}")
    return ok and playlist.exists()


def _write_hls_master(master_path: Path, variants: list[VideoVariant]) -> None:
    """يبني master.m3u8 يشير إلى كل جودة (Adaptive Bitrate)."""
    lines = ["#EXTM3U", "#EXT-X-VERSION:3"]
    # bandwidth تقريبي بناءً على ladder
    label_to_bandwidth = {
        "240p": 500_000,
        "360p": 900_000,
        "480p": 1_500_000,
        "720p": 3_000_000,
        "1080p": 5_000_000,
    }
    label_to_res = {
        "240p": "426x240",
        "360p": "640x360",
        "480p": "854x480",
        "720p": "1280x720",
        "1080p": "1920x1080",
    }
    for v in variants:
        bw = label_to_bandwidth.get(v.label, 1_000_000)
        res = label_to_res.get(v.label, f"?x{v.height}")
        # v.hls_playlist_url يبدأ بـ /uploads/derivatives/<id>/hls/<label>/index.m3u8
        # في master نستخدم مسار نسبي فقط
        rel = f"hls/{v.label}/index.m3u8"
        lines.append(
            f'#EXT-X-STREAM-INF:BANDWIDTH={bw},RESOLUTION={res},CODECS="avc1.4d401f,mp4a.40.2"'
        )
        lines.append(rel)
    master_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


# ============================================================
# Poster (thumbnail)
# ============================================================

async def generate_video_poster(src: Path, dst_jpg: Path, at_seconds: float = 1.0) -> bool:
    if not _ffmpeg_available():
        return False
    dst_jpg.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(at_seconds),
        "-i", str(src),
        "-frames:v", "1",
        "-q:v", "3",
        str(dst_jpg),
    ]
    ok, _ = await _run_ffmpeg(cmd, timeout=_FFMPEG_PROBE_TIMEOUT * 2, tag="poster")
    return ok and dst_jpg.exists()


# ============================================================
# ضغط الصور
# ============================================================

def compress_image(src: Path, out_dir: Path) -> tuple[Optional[Path], Optional[Path]]:
    """يُنتج JPEG محسّن + WebP. يُرجع (jpeg_path, webp_path). قد يكون أحدهما None."""
    try:
        from PIL import Image
    except Exception:  # Pillow غير متوفر
        return None, None

    out_dir.mkdir(parents=True, exist_ok=True)
    jpeg_path = out_dir / "optimized.jpg"
    webp_path = out_dir / "optimized.webp"

    try:
        with Image.open(src) as img:
            if img.mode in ("RGBA", "P"):
                rgb = img.convert("RGB")
            else:
                rgb = img
            rgb.save(jpeg_path, "JPEG", quality=_IMAGE_JPEG_QUALITY, optimize=True, progressive=True)
    except Exception as exc:
        logger.warning("[video_pipeline] JPEG compress failed for %s: %s", src.name, exc)
        jpeg_path = None

    try:
        with Image.open(src) as img:
            img.save(webp_path, "WEBP", quality=_IMAGE_WEBP_QUALITY, method=6)
    except Exception as exc:
        logger.warning("[video_pipeline] WebP compress failed for %s: %s", src.name, exc)
        webp_path = None

    return jpeg_path, webp_path


# ============================================================
# نقطة الدخول العامة
# ============================================================

async def process_media_pipeline(
    file_path: Path,
    upload_dir: Path,
    *,
    kind_hint: Optional[str] = None,
    file_id: Optional[str] = None,
) -> TranscodeResult:
    """
    يعالج ملفاً واحداً (فيديو/صورة):
      - يكتشف النوع
      - يُنشئ مجلد derivatives خاص به
      - يُنفّذ ladder + HLS + poster (فيديو) أو compress (صورة)
      - يُعيد TranscodeResult
    """
    file_path = Path(file_path)
    upload_dir = Path(upload_dir)

    if not file_path.exists():
        return TranscodeResult(kind="unsupported", status="failed", reason="source file missing")

    ext = file_path.suffix.lower()
    is_video = kind_hint == "video" or ext in {".mp4", ".mov", ".webm", ".mkv", ".m4v", ".avi", ".3gp"}
    is_image = kind_hint == "image" or ext in {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif", ".heic", ".heif"}

    if not (is_video or is_image):
        return TranscodeResult(kind="unsupported", status="skipped", reason=f"unsupported ext={ext}")

    file_id = file_id or file_path.stem
    derivatives_dir = upload_dir / "derivatives" / file_id
    derivatives_dir.mkdir(parents=True, exist_ok=True)
    derivatives_url_prefix = "/uploads/derivatives/" + file_id

    result = TranscodeResult(
        kind="video" if is_video else "image",
        status="ok",
        derivatives_dir=str(derivatives_dir),
        derivatives_url_prefix=derivatives_url_prefix,
    )

    # -------- IMAGE --------
    if is_image:
        jpeg_p, webp_p = compress_image(file_path, derivatives_dir)
        if not (jpeg_p or webp_p):
            result.status = "skipped"
            result.reason = "PIL unavailable or unsupported image"
            return result
        if webp_p:
            result.webp_url = _url_for(webp_p, upload_dir)
        if jpeg_p:
            result.poster_url = _url_for(jpeg_p, upload_dir)
        return result

    # -------- VIDEO --------
    if not _ffmpeg_available():
        result.status = "skipped"
        result.reason = "ffmpeg not installed"
        logger.error(
            "[video_pipeline] ffmpeg NOT installed — video will be served in original size. "
            "Add ffmpeg to the runtime image (nixpacks.toml / Dockerfile)."
        )
        return result

    info = await probe_video(file_path)
    if not info:
        result.status = "failed"
        result.reason = "ffprobe failed to read the file"
        return result

    result.original_width = info["width"]
    result.original_height = info["height"]
    result.duration_sec = info["duration_sec"]
    src_height = max(info["height"], 1)

    # اختر مستويات الـ ladder المناسبة (تجنّب الأعلى من الأصلي، لكن اترك على الأقل مستوى واحد)
    applicable = [row for row in _LADDER if row[1] <= src_height]
    if not applicable:
        applicable = [_LADDER[0]]  # حتى فيديو 144p سيُعطى نسخة 240p

    # نفّذ الجودات بالتوازي بحدود معقولة (2 في وقت واحد لتجنّب إغراق CPU على Render)
    sem = asyncio.Semaphore(int(os.getenv("FFMPEG_PARALLEL", "2")))

    async def _do_variant(row):
        label, h, vb, ab, mr, bs = row
        mp4_path = derivatives_dir / f"{label}.mp4"
        async with sem:
            ok = await _transcode_one_mp4(
                file_path, mp4_path,
                max_height=h, v_bitrate_k=vb, a_bitrate_k=ab,
                maxrate_k=mr, bufsize_k=bs,
            )
        if not ok:
            return None
        # HLS لهذا المستوى
        hls_dir = derivatives_dir / "hls" / label
        hls_ok = await _make_hls_for_variant(mp4_path, hls_dir)
        return VideoVariant(
            label=label,
            height=h,
            mp4_path=str(mp4_path),
            mp4_url=_url_for(mp4_path, upload_dir),
            hls_playlist_url=_url_for(hls_dir / "index.m3u8", upload_dir) if hls_ok else "",
        )

    variants = await asyncio.gather(*[_do_variant(r) for r in applicable])
    variants = [v for v in variants if v is not None]

    if not variants:
        result.status = "failed"
        result.reason = "all transcode attempts failed"
        return result

    result.variants = variants

    # HLS master
    master_path = derivatives_dir / "master.m3u8"
    try:
        _write_hls_master(master_path, variants)
        result.hls_master_url = _url_for(master_path, upload_dir)
    except Exception as exc:
        logger.warning("[video_pipeline] failed to write master.m3u8: %s", exc)

    # poster
    poster_path = derivatives_dir / "poster.jpg"
    poster_ok = await generate_video_poster(file_path, poster_path, at_seconds=1.0)
    if poster_ok:
        result.poster_url = _url_for(poster_path, upload_dir)

    # حذف الأصل اختيارياً (يحرّر مساحة كبيرة)
    if _REMOVE_ORIGINAL_AFTER_SUCCESS and len(variants) == len(applicable):
        try:
            file_path.unlink(missing_ok=True)
            result.original_kept = False
        except Exception as exc:
            logger.warning("[video_pipeline] cannot remove original %s: %s", file_path.name, exc)

    # تحديد الحالة
    result.status = "ok" if len(variants) == len(applicable) else "partial"
    if result.status == "partial":
        result.reason = f"only {len(variants)}/{len(applicable)} variants succeeded"

    logger.info(
        "[video_pipeline] DONE %s → %d variants, hls=%s, poster=%s, status=%s",
        file_path.name, len(variants), bool(result.hls_master_url),
        bool(result.poster_url), result.status,
    )
    return result
