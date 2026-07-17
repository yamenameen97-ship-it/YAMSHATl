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

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

# IMPORTANT: use an absolute uploads directory rooted at the project level.
# On Render the process may start with CWD=/app/backend, while FastAPI serves
# static files from the project-root /uploads mount. Using a relative path here
# caused files to be written to backend/uploads but served from /uploads,
# producing 404 after a seemingly successful upload.
PROJECT_ROOT = Path(__file__).resolve().parents[4]
BACKEND_ROOT = Path(__file__).resolve().parents[3]

# ✅ إصلاح v41: الأولوية لـ Persistent Disk على Render
# إذا لم يتوفر، استخدم المسار المحلي (التطوير فقط)
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
    """انسخ الملف أيضاً إلى backend/uploads لتفادي أي اختلاف في نقطة الخدمة أثناء النشر."""
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

# خريطة صريحة mime → امتداد لضمان حفظ الملفات بامتدادات صحيحة
# (مهم لأن secure_filename يحذف الأحرف غير ASCII فتضيع الأسماء العربية امتداداتها)
_MIME_EXTENSION_MAP = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/bmp': '.bmp',
    'image/svg+xml': '.svg',
    'image/heic': '.heic',
    'image/heif': '.heif',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'video/webm': '.webm',
    'video/x-matroska': '.mkv',
    'video/x-msvideo': '.avi',
    'video/3gpp': '.3gp',
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'audio/mp4': '.m4a',
    'audio/x-m4a': '.m4a',
    'audio/aac': '.aac',
    'audio/wav': '.wav',
    'audio/x-wav': '.wav',
    'audio/ogg': '.ogg',
    'audio/webm': '.webm',
    'audio/opus': '.opus',
    'audio/3gpp': '.3gp',
    'application/pdf': '.pdf',
}


def _base_mime(content_type: str | None) -> str:
    """جرد معلمات الكودك/charset من mime type (مثل 'audio/webm;codecs=opus' → 'audio/webm')."""
    return str(content_type or '').split(';')[0].strip().lower()


def _extension_from_mime(content_type: str | None) -> str:
    base = _base_mime(content_type)
    if not base:
        return ''
    if base in _MIME_EXTENSION_MAP:
        return _MIME_EXTENSION_MAP[base]
    # الرجوع إلى mimetypes القياسية للبايثون
    guessed = mimetypes.guess_extension(base, strict=False) or ''
    # التصحيح الشائع: '.jpe' → '.jpg'
    if guessed == '.jpe':
        return '.jpg'
    return guessed or ''


def _split_extension(name: str) -> tuple[str, str]:
    """استخراج الجذر والامتداد بشكل آمن حتى للأسماء غير ASCII."""
    stem, dot, ext = str(name or '').rpartition('.')
    if dot and ext and len(ext) <= 8 and re.fullmatch(r'[A-Za-z0-9]+', ext):
        return stem, f'.{ext.lower()}'
    return str(name or ''), ''


def _safe_storage_name(original_name: str | None, content_type: str | None) -> str:
    """بناء اسم تخزين آمن يحافظ دائماً على الامتداد الصحيح.

    werkzeug.secure_filename يحذف الأحرف غير ASCII بالكامل، فإذا كان الاسم
    "صورة.jpg" فإنه يعيد "jpg" فقط بدون نقطة → الملف يُحفظ بدون امتداد → تكسر!
    هذا الدالة تتأكد من وجود امتداد صحيح دائماً بناء على mime type.
    """
    name = str(original_name or '').strip()
    _, original_ext = _split_extension(name)
    mime_ext = _extension_from_mime(content_type)

    safe = secure_filename(name)
    # إذا أفرغ secure_filename الاسم (أسماء عربية)، أو جعله الامتداد فقط
    if not safe or safe.startswith('.') or '.' not in safe:
        safe = f'upload_{uuid.uuid4().hex}'

    safe_stem, safe_ext = _split_extension(safe)
    # اختر أفضل امتداد متوفر: الباقي من secure → الأصلي → من mime
    final_ext = safe_ext or original_ext or mime_ext
    if not final_ext:
        # افتراضي أخير حسب فئة mime
        base = _base_mime(content_type)
        if base.startswith('image/'):
            final_ext = '.bin'
        elif base.startswith('video/'):
            final_ext = '.bin'
        elif base.startswith('audio/'):
            final_ext = '.bin'
        else:
            final_ext = ''

    # تقصير الجذر لتجنب أسماء طويلة جداً
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


def _kind_from_type(content_type: str | None, filename: str | None) -> str:
    raw_type = str(content_type or '').lower()
    name = str(filename or '').lower()
    if raw_type.startswith('video/') or name.endswith(('.mp4', '.mov', '.webm', '.mkv')):
        return 'video'
    if raw_type.startswith('audio/') or name.endswith(('.mp3', '.wav', '.m4a', '.aac', '.ogg')):
        return 'audio'
    if raw_type.startswith('image/') or name.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp')):
        return 'image'
    return 'file'


def _validate_upload(file: UploadFile) -> tuple[str, int, str]:
    filename = file.filename or 'upload.bin'
    content_type = str(file.content_type or 'application/octet-stream').lower()
    if not (content_type.startswith(ALLOWED_PREFIXES) or content_type in ALLOWED_EXTRA_TYPES):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Unsupported file type')
    size = _file_size(file)
    if size and size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail='File is too large')
    kind = _kind_from_type(content_type, filename)
    return filename, size, kind


def _session_path(session_id: str) -> Path:
    return CHUNKS_DIR / f'{session_id}.json'


def _session_file_path(session_id: str, filename: str, content_type: str | None = None) -> Path:
    safe_name = _safe_storage_name(filename, content_type)
    return CHUNKS_DIR / f'{session_id}_{safe_name}'


def _read_session(session_id: str) -> dict:
    meta_path = _session_path(session_id)
    if not meta_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Upload session not found')
    return json.loads(meta_path.read_text())


def _write_session(session_id: str, payload: dict) -> None:
    _session_path(session_id).write_text(json.dumps(payload, ensure_ascii=False))


def _finalize_upload_payload(file_path: Path, *, original_name: str, content_type: str, size: int, kind: str) -> dict:
    # v88.3.2 MEDIA RENDER ROOT FIX:
    # نُرجِع دائماً رابطاً مطلقاً يمكن للمشترك تحميله من أي Origin.
    # normalize_media_url يبني الرابط من BACKEND_ORIGIN/RENDER_EXTERNAL_URL
    # عند توفّرهما، وإلاّ يعيد المسار كما هو (نسبي).
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
    }


def _apply_remote_storage(file_path: Path, payload: dict) -> dict:
    """يرفع الملف إلى Cloudinary — v88.3.2 MEDIA RENDER ROOT FIX.

    السلوك الجديد:
      • إذا كان Cloudinary مُهيّأً ونجح الرفع → نستبدل الرابط بالكامل
        بالرابط السحابي الدائم (يعمل لكل المشتركين على Render/بدون قرص).
      • إذا فشل الرفع → نُبقي الرابط المحلي المطلق، لكن **نُسجِّل الخطأ
        بوضوح** ليظهر في logs الإنتاج بدلاً من الفشل الصامت السابق.
      • إذا لم يكن Cloudinary مُهيّأً → نُبقي الرابط المحلي كما هو (يعتمد
        على PERSISTENT_DISK_PATH لتفادي فقد الملفات بعد إعادة النشر).
    """
    if not cloudinary_is_configured():
        # لا نُسجّل تحذيراً هنا — قد تكون البيئة تطويرية.
        return payload

    try:
        is_video = str(file_path).lower().endswith(
            ('.mp4', '.mov', '.webm', '.mkv', '.m4v', '.avi', '.3gp')
        )
        remote = cloudinary_upload_file(str(file_path), is_video=is_video)
        remote_url = str(remote.get('url') or '').strip()
        if remote_url:
            payload.update({
                'status': 'completed',
                'file_url': remote_url,
                'url': remote_url,
                'media_url': remote_url,
                'storage': 'cloudinary',
                'provider': 'cloudinary',
                'public_id': remote.get('public_id') or '',
                'remote': remote,
            })
        else:
            logger.error('[upload] Cloudinary returned empty URL for %s', file_path.name)
        return payload
    except Exception as exc:
        # v88.3.2: تسجيل مفصّل بدلاً من الفشل الصامت — يساعد على تشخيص
        # مشاكل "القصص/الريلز مكسورة عند المشتركين" في الإنتاج.
        logger.error(
            '[upload] Cloudinary upload FAILED for %s (fallback to local URL): %s',
            file_path.name, exc,
        )
        payload['remote_upload_error'] = str(exc)[:300]
        return payload


async def process_media_background(file_path: str, _user_id: int):
    await asyncio.sleep(0.2)
    if cloudinary_is_configured():
        try:
            cloudinary_upload_file(file_path, is_video=file_path.endswith(('.mp4', '.mov', '.webm', '.mkv')))
        except Exception:
            return


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
        size=size,
        kind=kind,
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
        'session_id': session_id,
        'filename': filename,
        'content_type': content_type,
        'total_size': total_size,
        'total_chunks': total_chunks,
        'chunk_size': declared_chunk_size,
        'uploaded_size': 0,
        'uploaded_chunks': [],
        'status': 'pending',
        'user_id': current_user.id,
    }
    _write_session(session_id, meta)
    return {
        'file_id': session_id,
        'session_id': session_id,
        'upload_url': f'/api/v1/upload/resumable/{session_id}/chunk',
        'uploaded_chunks': [],
        'status': meta['status'],
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
        'status': meta['status'],
        'uploaded_size': uploaded_size,
        'total_size': int(meta['total_size']),
        'progress': round((uploaded_size / max(int(meta['total_size']), 1)) * 100, 2),
    }


@router.get('/resumable/{file_id}/status')
def get_upload_status(file_id: str):
    return _read_session(file_id)


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
        'session_id': session_id,
        'chunk_index': int(chunk_index),
        'uploaded_chunks': meta['uploaded_chunks'],
        'uploaded_size': meta['uploaded_size'],
        'status': meta['status'],
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
        final_path,
        original_name=meta['filename'],
        content_type=str(meta.get('content_type') or 'application/octet-stream'),
        size=int(meta.get('uploaded_size') or 0),
        kind=_kind_from_type(meta.get('content_type'), meta.get('filename')),
    )
    upload_payload = _apply_remote_storage(final_path, upload_payload)
    if upload_payload.get('storage') == 'local' and cloudinary_is_configured():
        background_tasks.add_task(process_media_background, str(final_path), current_user.id)

    return {
        'session_id': session_id,
        'status': 'completed',
        'upload': upload_payload,
    }


@router.post('')
@router.post('/')
async def upload_file_standard(background_tasks: BackgroundTasks, file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """
    Accepte les deux variantes :
      - POST /api/upload   (sans trailing slash, envoyée par le frontend web)
      - POST /api/upload/  (avec trailing slash, ancienne version)
    Indispensable car redirect_slashes=False sur l'app FastAPI.
    """
    upload_result = save_upload(file)
    if upload_result.get('storage') == 'local' and cloudinary_is_configured():
        background_tasks.add_task(process_media_background, str(UPLOAD_DIR / upload_result['stored_name']), current_user.id)
        upload_result['status'] = 'processing'
    return upload_result


@router.post('/webhook/cloudinary')
async def cloudinary_webhook(payload: dict = Body(...)):
    digest = hashlib.sha1(json.dumps(payload, sort_keys=True).encode('utf-8')).hexdigest()
    return {'status': 'ok', 'digest': digest}
