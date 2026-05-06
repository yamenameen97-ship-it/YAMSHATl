from __future__ import annotations

import json
import shutil
import subprocess
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from fastapi import APIRouter, Body, Depends, File, HTTPException, Request, UploadFile, status
from werkzeug.utils import secure_filename

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.cloudinary_service import is_configured as cloudinary_is_configured
from app.services.cloudinary_service import upload_file as cloudinary_upload_file

router = APIRouter()

UPLOAD_DIR = Path('uploads')
UPLOAD_DIR.mkdir(exist_ok=True)
RESUMABLE_DIR = UPLOAD_DIR / '.resumable'
RESUMABLE_DIR.mkdir(exist_ok=True)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in settings.allowed_upload_extensions


def _public_upload_url(relative_path: str) -> str:
    cleaned = relative_path.lstrip('/')
    base_candidates = [settings.BACKEND_ORIGIN, settings.RENDER_EXTERNAL_URL]
    for candidate in base_candidates:
        parsed = urlparse(candidate or '')
        if parsed.scheme and parsed.netloc:
            return f'{parsed.scheme}://{parsed.netloc}/{cleaned}'
    return f'/{cleaned}'


def _scan_file(path: Path) -> dict:
    strategy = settings.UPLOAD_SCAN_STRATEGY
    if strategy == 'disabled':
        return {'status': 'skipped', 'engine': None, 'infected': False}
    scanner = shutil.which('clamscan')
    if not scanner:
        return {'status': 'unavailable', 'engine': 'clamav', 'infected': False}
    try:
        result = subprocess.run([scanner, '--no-summary', str(path)], capture_output=True, text=True, timeout=60, check=False)
        infected = result.returncode == 1
        clean = result.returncode == 0
        output = (result.stdout or result.stderr or '').strip()
        return {
            'status': 'infected' if infected else ('clean' if clean else 'error'),
            'engine': 'clamav',
            'infected': infected,
            'detail': output[:500] if output else None,
        }
    except Exception as exc:  # pragma: no cover - environment dependent
        return {'status': 'error', 'engine': 'clamav', 'infected': False, 'detail': str(exc)[:500]}


def _cache_control_for_extension(extension: str) -> str:
    if extension in {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.webm', '.mov'}:
        return 'public, max-age=31536000, immutable'
    return 'public, max-age=86400'


def _cdn_policy(path: Path) -> dict:
    return {
        'cache_control': _cache_control_for_extension(path.suffix.lower()),
        'cdn_recommended': True,
        'cdn_path_hint': f'/uploads/{path.name}',
    }


def _read_meta(path: Path) -> dict:
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Upload session not found')
    return json.loads(path.read_text(encoding='utf-8'))


def _write_meta(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')


def _session_dir(session_id: str) -> Path:
    return RESUMABLE_DIR / secure_filename(session_id)


def _meta_path(session_id: str) -> Path:
    return _session_dir(session_id) / 'meta.json'


def _require_session_owner(meta: dict, current_user: User) -> None:
    if int(meta.get('owner_id') or 0) != int(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Upload session does not belong to current user')


def _serialize_resumable_meta(meta: dict) -> dict:
    uploaded_chunks = meta.get('uploaded_chunks') or []
    total_chunks = int(meta.get('total_chunks') or 0)
    progress = int((len(uploaded_chunks) / total_chunks) * 100) if total_chunks else 0
    return {
        **meta,
        'uploaded_chunks': uploaded_chunks,
        'uploaded_count': len(uploaded_chunks),
        'progress': progress,
        'resume_supported': True,
    }


def save_upload(file: UploadFile) -> dict:
    safe_name = secure_filename(file.filename or '')
    if not safe_name or not allowed_file(safe_name):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Unsupported file type')

    extension = Path(safe_name).suffix.lower()
    unique_name = f'{Path(safe_name).stem[:40]}_{uuid.uuid4().hex[:12]}{extension}'
    path = UPLOAD_DIR / unique_name

    with open(path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)

    relative = str(path).replace('\\', '/')
    scan = _scan_file(path)
    response = {
        'filename': path.name,
        'local_path': relative,
        'file_url': _public_upload_url(relative),
        'url': _public_upload_url(relative),
        'storage': 'local',
        'size_bytes': path.stat().st_size,
        'scan': scan,
        'cdn': _cdn_policy(path),
        'resume_supported': True,
        'progress': 100,
    }

    if cloudinary_is_configured():
        try:
            response['cloud_url'] = cloudinary_upload_file(str(path))
            response['file_url'] = response['cloud_url']
            response['url'] = response['cloud_url']
            response['storage'] = 'cloudinary'
        except Exception as exc:
            response['cloud_error'] = str(exc)

    return response


@router.post('/')
def upload(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    _ = current_user
    return save_upload(file)


@router.post('/resumable/start')
def start_resumable_upload(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    filename = secure_filename(str(payload.get('filename') or ''))
    content_type = str(payload.get('content_type') or 'application/octet-stream').strip()[:120]
    total_size = int(payload.get('total_size') or 0)
    total_chunks = int(payload.get('total_chunks') or 0)
    checksum = str(payload.get('checksum') or '').strip()[:128]

    if not filename or not allowed_file(filename):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Unsupported file type')
    if total_size <= 0 or total_size > settings.resumable_upload_max_size_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid upload size')
    if total_chunks <= 0 or total_chunks > 10_000:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid chunk count')

    session_id = uuid.uuid4().hex
    session_dir = _session_dir(session_id)
    chunks_dir = session_dir / 'chunks'
    chunks_dir.mkdir(parents=True, exist_ok=True)
    meta = {
        'session_id': session_id,
        'owner_id': current_user.id,
        'filename': filename,
        'content_type': content_type,
        'total_size': total_size,
        'total_chunks': total_chunks,
        'checksum': checksum or None,
        'uploaded_chunks': [],
        'created_at': _now_iso(),
        'completed_at': None,
        'status': 'uploading',
    }
    _write_meta(_meta_path(session_id), meta)
    return _serialize_resumable_meta(meta)


@router.get('/resumable/{session_id}')
def get_resumable_upload_status(session_id: str, current_user: User = Depends(get_current_user)):
    meta = _read_meta(_meta_path(session_id))
    _require_session_owner(meta, current_user)
    return _serialize_resumable_meta(meta)


@router.put('/resumable/{session_id}/chunk/{chunk_index}')
async def upload_chunk(session_id: str, chunk_index: int, request: Request, current_user: User = Depends(get_current_user)):
    meta_path = _meta_path(session_id)
    meta = _read_meta(meta_path)
    _require_session_owner(meta, current_user)
    total_chunks = int(meta.get('total_chunks') or 0)
    if chunk_index < 0 or chunk_index >= total_chunks:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid chunk index')

    body = await request.body()
    if not body:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Chunk body is empty')

    session_dir = _session_dir(session_id)
    chunks_dir = session_dir / 'chunks'
    chunk_path = chunks_dir / f'{chunk_index:06d}.part'
    chunk_path.write_bytes(body)

    uploaded_chunks = {int(index) for index in meta.get('uploaded_chunks') or []}
    uploaded_chunks.add(chunk_index)
    meta['uploaded_chunks'] = sorted(uploaded_chunks)
    _write_meta(meta_path, meta)
    return _serialize_resumable_meta(meta)


@router.post('/resumable/{session_id}/complete')
def complete_resumable_upload(session_id: str, current_user: User = Depends(get_current_user)):
    meta_path = _meta_path(session_id)
    meta = _read_meta(meta_path)
    _require_session_owner(meta, current_user)

    total_chunks = int(meta.get('total_chunks') or 0)
    uploaded_chunks = [int(index) for index in meta.get('uploaded_chunks') or []]
    if len(uploaded_chunks) != total_chunks:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Upload is incomplete')

    original_name = secure_filename(meta.get('filename') or '')
    extension = Path(original_name).suffix.lower()
    final_name = f'{Path(original_name).stem[:40]}_{uuid.uuid4().hex[:12]}{extension}'
    final_path = UPLOAD_DIR / final_name
    chunks_dir = _session_dir(session_id) / 'chunks'

    with open(final_path, 'wb') as output:
        for index in range(total_chunks):
            chunk_path = chunks_dir / f'{index:06d}.part'
            if not chunk_path.exists():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f'Missing chunk {index}')
            output.write(chunk_path.read_bytes())

    meta['status'] = 'completed'
    meta['completed_at'] = _now_iso()
    meta['final_path'] = str(final_path).replace('\\', '/')
    _write_meta(meta_path, meta)

    response = {
        'session': _serialize_resumable_meta(meta),
        'upload': {
            'filename': final_path.name,
            'local_path': str(final_path).replace('\\', '/'),
            'file_url': _public_upload_url(str(final_path).replace('\\', '/')),
            'url': _public_upload_url(str(final_path).replace('\\', '/')),
            'storage': 'local',
            'size_bytes': final_path.stat().st_size,
            'scan': _scan_file(final_path),
            'cdn': _cdn_policy(final_path),
            'resume_supported': True,
            'progress': 100,
        },
    }

    if cloudinary_is_configured():
        try:
            response['upload']['cloud_url'] = cloudinary_upload_file(str(final_path))
            response['upload']['file_url'] = response['upload']['cloud_url']
            response['upload']['url'] = response['upload']['cloud_url']
            response['upload']['storage'] = 'cloudinary'
        except Exception as exc:
            response['upload']['cloud_error'] = str(exc)

    return response
