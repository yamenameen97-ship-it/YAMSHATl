from __future__ import annotations

import asyncio
import hashlib
import json
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Body, Depends, File, HTTPException, Request, UploadFile, status
from werkzeug.utils import secure_filename

from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.cloudinary_service import is_configured as cloudinary_is_configured
from app.services.cloudinary_service import upload_file as cloudinary_upload_file

router = APIRouter()

UPLOAD_DIR = Path('uploads')
UPLOAD_DIR.mkdir(exist_ok=True)
CHUNKS_DIR = UPLOAD_DIR / 'chunks'
CHUNKS_DIR.mkdir(exist_ok=True)

MAX_FILE_SIZE_BYTES = 600 * 1024 * 1024
ALLOWED_PREFIXES = ('image/', 'video/', 'audio/')
ALLOWED_EXTRA_TYPES = {
    'application/pdf',
    'application/octet-stream',
}


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


def _session_file_path(session_id: str, filename: str) -> Path:
    safe_name = secure_filename(filename) or f'upload_{session_id}'
    return CHUNKS_DIR / f'{session_id}_{safe_name}'


def _read_session(session_id: str) -> dict:
    meta_path = _session_path(session_id)
    if not meta_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Upload session not found')
    return json.loads(meta_path.read_text())


def _write_session(session_id: str, payload: dict) -> None:
    _session_path(session_id).write_text(json.dumps(payload, ensure_ascii=False))


def _finalize_upload_payload(file_path: Path, *, original_name: str, content_type: str, size: int, kind: str) -> dict:
    return {
        'status': 'completed',
        'filename': original_name,
        'stored_name': file_path.name,
        'file_size': int(size or file_path.stat().st_size),
        'content_type': content_type,
        'kind': kind,
        'file_url': f'/uploads/{file_path.name}',
        'url': f'/uploads/{file_path.name}',
        'media_url': f'/uploads/{file_path.name}',
        'storage': 'local',
    }


def _apply_remote_storage(file_path: Path, payload: dict) -> dict:
    if not cloudinary_is_configured():
        return payload

    try:
        remote = cloudinary_upload_file(
            str(file_path),
            is_video=str(file_path).lower().endswith(('.mp4', '.mov', '.webm', '.mkv')),
        )
        remote_url = str(remote.get('url') or '').strip()
        if remote_url:
            payload.update({
                'status': 'completed',
                'file_url': remote_url,
                'url': remote_url,
                'media_url': remote_url,
                'storage': 'cloudinary',
                'provider': 'cloudinary',
                'remote': remote,
            })
        return payload
    except Exception as exc:
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
    safe_name = secure_filename(original_name) or f'upload_{uuid.uuid4().hex}'
    target_path = UPLOAD_DIR / f'{uuid.uuid4().hex}_{safe_name}'
    file.file.seek(0)
    with open(target_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    payload = _finalize_upload_payload(
        target_path,
        original_name=original_name,
        content_type=str(file.content_type or 'application/octet-stream'),
        size=size,
        kind=kind,
    )
    return _apply_remote_storage(target_path, payload)


@router.post('/resumable/init')
def init_resumable_upload(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    session_id = str(uuid.uuid4())
    filename = secure_filename(str(payload.get('filename') or 'upload.bin')) or f'upload_{session_id}'
    total_size = int(payload.get('total_size') or 0)
    total_chunks = int(payload.get('total_chunks') or 0)
    content_type = str(payload.get('content_type') or 'application/octet-stream')
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

    file_path = _session_file_path(file_id, meta['filename'])
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

    file_path = _session_file_path(session_id, meta['filename'])
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

    temp_path = _session_file_path(session_id, meta['filename'])
    if not temp_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Upload file not found')

    final_name = f'{uuid.uuid4().hex}_{secure_filename(meta["filename"]) or "upload.bin"}'
    final_path = UPLOAD_DIR / final_name
    shutil.move(str(temp_path), str(final_path))
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


@router.post('/')
async def upload_file_standard(background_tasks: BackgroundTasks, file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    upload_result = save_upload(file)
    if upload_result.get('storage') == 'local' and cloudinary_is_configured():
        background_tasks.add_task(process_media_background, str(UPLOAD_DIR / upload_result['stored_name']), current_user.id)
        upload_result['status'] = 'processing'
    return upload_result


@router.post('/webhook/cloudinary')
async def cloudinary_webhook(payload: dict = Body(...)):
    digest = hashlib.sha1(json.dumps(payload, sort_keys=True).encode('utf-8')).hexdigest()
    return {'status': 'ok', 'digest': digest}
