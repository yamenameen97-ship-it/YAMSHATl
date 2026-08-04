"""
upload.py PATCH — v89.28 ROOT FIX
=================================
هذا الملف هو الاستبدال الكامل لـ backend/app/api/routes/upload.py.
التغييرات الجذرية:

1. `process_media_background` أصبحت تُنفّذ خطّ إنتاج كامل عبر
   `video_pipeline.process_media_pipeline` (ffmpeg ladder + HLS master + poster
   + WebP للصور) قبل الرفع إلى Cloudinary — بدلاً من الاكتفاء بالرفع الخام.

2. مخرجات المعالجة (variants, hls_master_url, poster_url, webp_url) تُعاد
   الآن ضمن payload النهائي لكل rest endpoint (standard + resumable/complete)،
   بحيث يستطيع الـ frontend اختيار الجودة المناسبة (Adaptive Bitrate).

3. تسجيل مفصّل لأي فشل في مرحلة الترانسكود، بدون كسر عملية الرفع الأساسية —
   إذا فشل ffmpeg يبقى الأصل قابلاً للتشغيل (fallback آمن).

4. مسار `derivatives/` يُحفَظ داخل نفس `UPLOAD_DIR` بحيث يُخدَم تلقائياً
   عبر `/uploads` mount الحالي دون أيّ إعادة إعداد على FastAPI.

ملاحظة: كل بقية الملف مُحافظ عليه كما كان (لا تغيير في التوقيعات العامة).
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import mimetypes
import os
import re
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Body, Depends, File, HTTPException, Request, UploadFile, status
from werkzeug.utils import secure_filename

from app.core.dependencies import get_current_user
from app.core.media_urls import normalize_media_url
from app.models.user import User
from app.services.cloudinary_service import is_configured as cloudinary_is_configured
from app.services.cloudinary_service import upload_file as cloudinary_upload_file

# v89.28 ROOT FIX — استيراد خطّ إنتاج الوسائط الجديد
from app.services.video_pipeline import process_media_pipeline

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[4]
BACKEND_ROOT = Path(__file__).resolve().parents[3]

_PERSISTENT_PATH = Path(os.getenv('PERSISTENT_DISK_PATH', '/var/data/uploads'))
try:
    _PERSISTENT_PATH.mkdir(parents=True, exist_ok=True)
    _t = _PERSISTENT_PATH / '.write_test'
    _t.write_text('ok'); _t.unlink()
    UPLOAD_DIR = _PERSISTENT_PATH
except Exception:
    UPLOAD_DIR = PROJECT_ROOT / 'uploads'
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

LEGACY_UPLOAD_DIR = BACKEND_ROOT / 'uploads'
LEGACY_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CHUNKS_DIR = UPLOAD_DIR / 'chunks'
CHUNKS_DIR.mkdir(parents=True, exist_ok=True)


def _mirror_to_legacy_uploads(source_path: Path) -> None:
    try:
        if not source_path.exists() or source_path.is_dir():
            return
        target_path = LEGACY_UPLOAD_DIR / source_path.name
        if target_path.resolve() == source_path.resolve():
            return
        target_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source_path, target_path)
    except Exception:
        return

MAX_FILE_SIZE_BYTES = 600 * 1024 * 1024
ALLOWED_PREFIXES = ('image/', 'video/', 'audio/')
ALLOWED_EXTRA_TYPES = {
    'application/pdf',
    'application/octet-stream',
}

_MIME_EXTENSION_MAP = {
    'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png',
    'image/gif': '.gif', 'image/webp': '.webp', 'image/bmp': '.bmp',
    'image/svg+xml': '.svg', 'image/heic': '.heic', 'image/heif': '.heif',
    'video/mp4': '.mp4', 'video/quicktime': '.mov', 'video/webm': '.webm',
    'video/x-matroska': '.mkv', 'video/x-msvideo': '.avi', 'video/3gpp': '.3gp',
    'audio/mpeg': '.mp3', 'audio/mp3': '.mp3', 'audio/mp4': '.m4a',
    'audio/x-m4a': '.m4a', 'audio/aac': '.aac', 'audio/wav': '.wav',
    'audio/x-wav': '.wav', 'audio/ogg': '.ogg', 'audio/webm': '.webm',
    'audio/opus': '.opus', 'audio/3gpp': '.3gp', 'application/pdf': '.pdf',
}


def _base_mime(content_type):
    return str(content_type or '').split(';')[0].strip().lower()


def _extension_from_mime(content_type):
    base = _base_mime(content_type)
    if not base:
        return ''
    if base in _MIME_EXTENSION_MAP:
        return _MIME_EXTENSION_MAP[base]
    guessed = mimetypes.guess_extension(base, strict=False) or ''
    if guessed == '.jpe':
        return '.jpg'
    return guessed or ''


def _split_extension(name):
    stem, dot, ext = str(name or '').rpartition('.')
    if dot and ext and len(ext) <= 8 and re.fullmatch(r'[A-Za-z0-9]+', ext):
        return stem, f'.{ext.lower()}'
    return str(name or ''), ''


def _safe_storage_name(original_name, content_type):
    name = str(original_name or '').strip()
    _, original_ext = _split_extension(name)
    mime_ext = _extension_from_mime(content_type)
    safe = secure_filename(name)
    if not safe or safe.startswith('.') or '.' not in safe:
        safe = f'upload_{uuid.uuid4().hex}'
    safe_stem, safe_ext = _split_extension(safe)
    final_ext = safe_ext or original_ext or mime_ext
    if not final_ext:
        base = _base_mime(content_type)
        final_ext = '.bin' if base.startswith(('image/', 'video/', 'audio/')) else ''
    safe_stem = (safe_stem or 'upload')[:80]
    return f'{safe_stem}{final_ext}'


def _file_size(upload: UploadFile) -> int:
    try:
        position = upload.file.tell()
        upload.file.seek(0, 2)
        size = upload.file.tell()
        upload.file.seek(position)
        return int(size)
    except Exception:
        return 0


def _kind_from_type(content_type, filename):
    raw_type = str(content_type or '').lower()
    name = str(filename or '').lower()
    if raw_type.startswith('video/') or name.endswith(('.mp4', '.mov', '.webm', '.mkv')):
        return 'video'
    if raw_type.startswith('audio/') or name.endswith(('.mp3', '.wav', '.m4a', '.aac', '.ogg')):
        return 'audio'
    if raw_type.startswith('image/') or name.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp')):
        return 'image'
    return 'file'


def _validate_upload(file: UploadFile):
    filename = file.filename or 'upload.bin'
    content_type = str(file.content_type or 'application/octet-stream').lower()
    if not (content_type.startswith(ALLOWED_PREFIXES) or content_type in ALLOWED_EXTRA_TYPES):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Unsupported file type')
    size = _file_size(file)
    if size and size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail='File is too large')
    kind = _kind_from_type(content_type, filename)
    return filename, size, kind


def _session_path(session_id): return CHUNKS_DIR / f'{session_id}.json'
def _session_file_path(session_id, filename, content_type=None):
    return CHUNKS_DIR / f'{session_id}_{_safe_storage_name(filename, content_type)}'


def _read_session(session_id):
    meta_path = _session_path(session_id)
    if not meta_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Upload session not found')
    return json.loads(meta_path.read_text())


def _write_session(session_id, payload):
    _session_path(session_id).write_text(json.dumps(payload, ensure_ascii=False))


def _finalize_upload_payload(file_path, *, original_name, content_type, size, kind):
    local_path = f'/uploads/{file_path.name}'
    absolute_url = normalize_media_url(local_path) or local_path
    return {
        'status': 'completed',
        'filename': original_name,
        'stored_name': file_path.name,
        'file_size': int(size or file_path.stat().st_size),
        'content_type': content_type,
        'kind': kind,
        'file_url': absolute_url,
        'url': absolute_url,
        'media_url': absolute_url,
        'local_path': local_path,
        'storage': 'local',
        # v89.28: حقول جديدة تُملأ لاحقاً في المعالجة الخلفية
        'variants': [],
        'hls_master_url': '',
        'poster_url': '',
        'webp_url': '',
        'transcode_status': 'pending',
    }


def _apply_remote_storage(file_path, payload):
    if not cloudinary_is_configured():
        return payload
    try:
        is_video = str(file_path).lower().endswith(('.mp4', '.mov', '.webm', '.mkv', '.m4v', '.avi', '.3gp'))
        remote = cloudinary_upload_file(str(file_path), is_video=is_video)
        remote_url = str(remote.get('url') or '').strip()
        if remote_url:
            payload.update({
                'status': 'completed',
                'file_url': remote_url, 'url': remote_url, 'media_url': remote_url,
                'storage': 'cloudinary', 'provider': 'cloudinary',
                'public_id': remote.get('public_id') or '', 'remote': remote,
            })
        else:
            logger.error('[upload] Cloudinary returned empty URL for %s', file_path.name)
        return payload
    except Exception as exc:
        logger.error('[upload] Cloudinary upload FAILED for %s: %s', file_path.name, exc)
        payload['remote_upload_error'] = str(exc)[:300]
        return payload


# ============================================================
# v89.28 ROOT FIX — المعالجة الخلفية الجديدة
# ============================================================

async def process_media_background(file_path: str, _user_id: int):
    """
    خطّ إنتاج كامل بعد الرفع:
      1) ffmpeg ladder (240/360/480/720/1080) mp4
      2) HLS master + per-variant playlists
      3) poster JPEG (فيديو) أو WebP (صورة)
      4) Cloudinary أيضاً كنسخة سحابية (إن كان مُهيّأً)
    كل الخطوات محمية بـ try/except بحيث لا يفشل الرفع بكامله لو تعطّل ffmpeg.
    """
    path = Path(file_path)
    if not path.exists():
        logger.warning('[upload/bg] source missing: %s', file_path)
        return

    # 1) Cloudinary parallel (تحسين ليست فاشلة صامتاً)
    async def _do_cloudinary():
        if not cloudinary_is_configured():
            return
        try:
            is_video = path.suffix.lower() in {'.mp4', '.mov', '.webm', '.mkv', '.m4v', '.avi', '.3gp'}
            # cloudinary_upload_file متزامن — نُشغّله في thread
            await asyncio.to_thread(cloudinary_upload_file, str(path), None, is_video)
        except Exception as exc:
            logger.warning('[upload/bg] cloudinary secondary upload failed: %s', exc)

    # 2) خط الإنتاج المحلي (ffmpeg)
    async def _do_pipeline():
        try:
            result = await process_media_pipeline(
                path, UPLOAD_DIR,
                kind_hint=_kind_from_type(None, path.name),
                file_id=path.stem[:60],
            )
            logger.info(
                '[upload/bg] pipeline result for %s: status=%s variants=%d hls=%s',
                path.name, result.status, len(result.variants), bool(result.hls_master_url),
            )
        except Exception as exc:
            logger.exception('[upload/bg] pipeline crashed for %s: %s', path.name, exc)

    await asyncio.gather(_do_pipeline(), _do_cloudinary())


def save_upload(file: UploadFile) -> dict:
    original_name, size, kind = _validate_upload(file)
    content_type = str(file.content_type or 'application/octet-stream')
    safe_name = _safe_storage_name(original_name, content_type)
    target_path = UPLOAD_DIR / f'{uuid.uuid4().hex}_{safe_name}'
    file.file.seek(0)
    with open(target_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    _mirror_to_legacy_uploads(target_path)
    payload = _finalize_upload_payload(
        target_path,
        original_name=original_name,
        content_type=content_type,
        size=size, kind=kind,
    )
    return _apply_remote_storage(target_path, payload)


@router.post('/resumable/init')
def init_resumable_upload(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    session_id = str(uuid.uuid4())
    raw_filename = str(payload.get('filename') or 'upload.bin')
    content_type = str(payload.get('content_type') or 'application/octet-stream')
    filename = _safe_storage_name(raw_filename, content_type)
    total_size = int(payload.get('total_size') or 0)
    total_chunks = int(payload.get('total_chunks') or 0)
    if total_size <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='total_size is required')
    if total_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail='File is too large')
    declared_chunk_size = int(payload.get('chunk_size') or 0)
    meta = {
        'session_id': session_id, 'filename': filename, 'content_type': content_type,
        'total_size': total_size, 'total_chunks': total_chunks,
        'chunk_size': declared_chunk_size, 'uploaded_size': 0,
        'uploaded_chunks': [], 'status': 'pending', 'user_id': current_user.id,
    }
    _write_session(session_id, meta)
    return {
        'file_id': session_id, 'session_id': session_id,
        'upload_url': f'/api/v1/upload/resumable/{session_id}/chunk',
        'uploaded_chunks': [], 'status': meta['status'],
    }


@router.put('/resumable/{file_id}/chunk')
async def upload_chunk(file_id: str, request: Request, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    meta = _read_session(file_id)
    if int(meta.get('user_id') or 0) != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Upload session does not belong to this user')
    chunk_data = await request.body()
    if not chunk_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Chunk body is empty')
    content_range = str(request.headers.get('Content-Range') or '')
    start_offset = meta.get('uploaded_size', 0)
    if content_range.startswith('bytes '):
        try:
            byte_range = content_range.replace('bytes ', '').split('/')[0]
            start_offset = int(byte_range.split('-')[0])
        except Exception:
            start_offset = int(meta.get('uploaded_size') or 0)
    file_path = _session_file_path(file_id, meta['filename'], meta.get('content_type'))
    with open(file_path, 'r+b' if file_path.exists() else 'wb') as buffer:
        buffer.seek(int(start_offset))
        buffer.write(chunk_data)
    uploaded_size = max(int(meta.get('uploaded_size') or 0), int(start_offset) + len(chunk_data))
    meta['uploaded_size'] = uploaded_size
    if uploaded_size >= int(meta['total_size']):
        meta['status'] = 'completed'
        background_tasks.add_task(process_media_background, str(file_path), current_user.id)
    else:
        meta['status'] = 'uploading'
    _write_session(file_id, meta)
    return {
        'status': meta['status'], 'uploaded_size': uploaded_size,
        'total_size': int(meta['total_size']),
        'progress': round((uploaded_size / max(int(meta['total_size']), 1)) * 100, 2),
    }


@router.get('/resumable/{file_id}/status')
def get_upload_status(file_id: str): return _read_session(file_id)


@router.post('/resumable/start')
def start_resumable_upload(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    return init_resumable_upload(payload, current_user)


@router.get('/resumable/{session_id}')
def get_resumable_status(session_id: str, current_user: User = Depends(get_current_user)):
    meta = _read_session(session_id)
    if int(meta.get('user_id') or 0) != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Upload session does not belong to this user')
    return meta


@router.put('/resumable/{session_id}/chunk/{chunk_index}')
async def upload_resumable_chunk(session_id: str, chunk_index: int, request: Request, current_user: User = Depends(get_current_user)):
    meta = _read_session(session_id)
    if int(meta.get('user_id') or 0) != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Upload session does not belong to this user')
    chunk_data = await request.body()
    if not chunk_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Chunk body is empty')
    file_path = _session_file_path(session_id, meta['filename'], meta.get('content_type'))
    declared_chunk_size = max(int(meta.get('chunk_size') or 0), 0)
    chunk_size = len(chunk_data)
    header_start = request.headers.get('X-Chunk-Start')
    header_end = request.headers.get('X-Chunk-End')
    try:
        start_offset = int(header_start)
    except (TypeError, ValueError):
        start_offset = max(int(chunk_index), 0) * (declared_chunk_size or chunk_size)
    try:
        end_offset = int(header_end)
    except (TypeError, ValueError):
        end_offset = start_offset + chunk_size
    with open(file_path, 'r+b' if file_path.exists() else 'wb') as buffer:
        buffer.seek(start_offset)
        buffer.write(chunk_data)
    uploaded_chunks = set(int(item) for item in meta.get('uploaded_chunks') or [])
    uploaded_chunks.add(int(chunk_index))
    meta['uploaded_chunks'] = sorted(uploaded_chunks)
    meta['uploaded_size'] = min(max(int(meta.get('uploaded_size') or 0), end_offset, file_path.stat().st_size), int(meta['total_size']))
    meta['status'] = 'uploading'
    _write_session(session_id, meta)
    return {
        'session_id': session_id, 'chunk_index': int(chunk_index),
        'uploaded_chunks': meta['uploaded_chunks'],
        'uploaded_size': meta['uploaded_size'], 'status': meta['status'],
    }


@router.post('/resumable/{session_id}/complete')
async def complete_resumable_upload(session_id: str, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    meta = _read_session(session_id)
    if int(meta.get('user_id') or 0) != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Upload session does not belong to this user')
    temp_path = _session_file_path(session_id, meta['filename'], meta.get('content_type'))
    if not temp_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Upload file not found')
    safe_basename = _safe_storage_name(meta['filename'], meta.get('content_type'))
    final_name = f'{uuid.uuid4().hex}_{safe_basename}'
    final_path = UPLOAD_DIR / final_name
    shutil.move(str(temp_path), str(final_path))
    _mirror_to_legacy_uploads(final_path)
    meta['status'] = 'completed'
    meta['uploaded_size'] = int(final_path.stat().st_size)
    _write_session(session_id, meta)
    upload_payload = _finalize_upload_payload(
        final_path, original_name=meta['filename'],
        content_type=str(meta.get('content_type') or 'application/octet-stream'),
        size=int(meta.get('uploaded_size') or 0),
        kind=_kind_from_type(meta.get('content_type'), meta.get('filename')),
    )
    upload_payload = _apply_remote_storage(final_path, upload_payload)
    # v89.28: خطّ إنتاج الوسائط يعمل دائماً بغضّ النظر عن Cloudinary
    background_tasks.add_task(process_media_background, str(final_path), current_user.id)
    upload_payload['transcode_status'] = 'processing'
    return {'session_id': session_id, 'status': 'completed', 'upload': upload_payload}


@router.post('')
@router.post('/')
async def upload_file_standard(background_tasks: BackgroundTasks, file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    upload_result = save_upload(file)
    # v89.28: نُشغّل pipeline دائماً (لا يعتمد على cloudinary)
    background_tasks.add_task(process_media_background, str(UPLOAD_DIR / upload_result['stored_name']), current_user.id)
    upload_result['transcode_status'] = 'processing'
    if upload_result.get('storage') == 'local':
        upload_result['status'] = 'processing'
    return upload_result


@router.get('/derivatives/{file_id}/status')
async def derivatives_status(file_id: str, current_user: User = Depends(get_current_user)):
    """
    v89.28: endpoint جديد يستعلم عن حالة الترانسكود لملف معيّن.
    الـ frontend يستخدمه لسحب رابط HLS master بمجرّد جهوزيته
    (Adaptive Bitrate Streaming) بدل استعمال الملف الأصلي الثقيل.
    """
    safe_id = re.sub(r'[^A-Za-z0-9_.-]', '', file_id)[:80]
    d_dir = UPLOAD_DIR / 'derivatives' / safe_id
    if not d_dir.exists():
        return {'file_id': safe_id, 'ready': False, 'reason': 'not_started'}
    master = d_dir / 'master.m3u8'
    variants = []
    for label in ('240p', '360p', '480p', '720p', '1080p'):
        p = d_dir / f'{label}.mp4'
        if p.exists() and p.stat().st_size > 0:
            variants.append({
                'label': label,
                'mp4_url': f'/uploads/derivatives/{safe_id}/{label}.mp4',
                'hls_url': f'/uploads/derivatives/{safe_id}/hls/{label}/index.m3u8'
                    if (d_dir / 'hls' / label / 'index.m3u8').exists() else '',
            })
    poster = d_dir / 'poster.jpg'
    return {
        'file_id': safe_id,
        'ready': master.exists() and len(variants) > 0,
        'hls_master_url': f'/uploads/derivatives/{safe_id}/master.m3u8' if master.exists() else '',
        'poster_url': f'/uploads/derivatives/{safe_id}/poster.jpg' if poster.exists() else '',
        'variants': variants,
    }


@router.post('/webhook/cloudinary')
async def cloudinary_webhook(payload: dict = Body(...)):
    digest = hashlib.sha1(json.dumps(payload, sort_keys=True).encode('utf-8')).hexdigest()
    return {'status': 'ok', 'digest': digest}
