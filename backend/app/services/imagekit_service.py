from __future__ import annotations
import base64
from pathlib import Path
import httpx
from app.core.config import settings

IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'

def is_configured() -> bool:
    return settings.imagekit_configured

def upload_file(file_path: str, folder: str | None = None) -> dict:
    if not is_configured():
        raise RuntimeError('ImageKit is not configured')

    path = Path(file_path)
    if not path.exists():
        raise RuntimeError('File does not exist')

    auth = base64.b64encode(f'{settings.IMAGEKIT_PRIVATE_KEY}:'.encode('utf-8')).decode('utf-8')
    
    # Adaptive Media Optimization & Responsive Variants
    data = {
        'fileName': path.name,
        'useUniqueFileName': 'true',
        'folder': folder or settings.IMAGEKIT_FOLDER,
        'isPrivateFile': 'false',
        'overwriteFile': 'false',
        'tags': 'yamshat,adaptive_optimized',
        'responseFields': 'isPrivateFile,tags,embeddedMetadata,thumbnailUrl'
    }

    # CDN Optimization via automatic transformations
    # ImageKit automatically applies optimization when using the returned URL
    with path.open('rb') as fh:
        response = httpx.post(
            IMAGEKIT_UPLOAD_URL,
            headers={'Authorization': f'Basic {auth}'},
            data=data,
            files={'file': (path.name, fh, 'application/octet-stream')},
            timeout=60,
        )
        
    response.raise_for_status()
    payload = response.json()
    
    secure_url = payload.get('url')
    if not secure_url:
        raise RuntimeError('ImageKit upload failed')
        
    # Adding Responsive & Optimization metadata
    return {
        "url": secure_url,
        "thumbnail": payload.get("thumbnailUrl"),
        "file_id": payload.get("fileId"),
        "optimization": {
            "cdn": "imagekit_edge",
            "adaptive": True,
            "responsive_url": f"{secure_url}?tr=w-auto,pr-true" # Responsive variant hint
        }
    }

def get_cdn_optimized_url(url: str, width: int = None, quality: int = 80) -> str:
    """توليد روابط محسنة لـ CDN باستخدام تحويلات ImageKit"""
    params = [f"q-{quality}"]
    if width: params.append(f"w-{width}")
    
    transformation = ",".join(params)
    return f"{url}?tr={transformation}"
