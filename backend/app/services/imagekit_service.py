from __future__ import annotations

import base64
from pathlib import Path

import httpx

from app.core.config import settings

IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'


def is_configured() -> bool:
    return settings.imagekit_configured


def upload_file(file_path: str, folder: str | None = None) -> str:
    if not is_configured():
        raise RuntimeError('ImageKit is not configured')

    path = Path(file_path)
    if not path.exists():
        raise RuntimeError('File does not exist')

    auth = base64.b64encode(f'{settings.IMAGEKIT_PRIVATE_KEY}:'.encode('utf-8')).decode('utf-8')
    data = {
        'fileName': path.name,
        'useUniqueFileName': 'true',
        'folder': folder or settings.IMAGEKIT_FOLDER,
    }

    with path.open('rb') as fh:
        response = httpx.post(
            IMAGEKIT_UPLOAD_URL,
            headers={
                'Authorization': f'Basic {auth}',
            },
            data=data,
            files={'file': (path.name, fh, 'application/octet-stream')},
            timeout=60,
        )
    response.raise_for_status()
    payload = response.json()
    secure_url = payload.get('url') or payload.get('thumbnailUrl') or payload.get('filePath')
    if not secure_url:
        raise RuntimeError('ImageKit upload failed')
    return str(secure_url)
