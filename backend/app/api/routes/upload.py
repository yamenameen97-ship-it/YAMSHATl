import shutil
import uuid
from pathlib import Path
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from werkzeug.utils import secure_filename

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.cloudinary_service import is_configured as cloudinary_is_configured
from app.services.cloudinary_service import upload_file as cloudinary_upload_file

router = APIRouter()

UPLOAD_DIR = Path('uploads')
UPLOAD_DIR.mkdir(exist_ok=True)


def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in settings.allowed_upload_extensions


def _public_upload_url(relative_path: str) -> str:
    cleaned = relative_path.lstrip('/')
    base_candidates = [
        settings.BACKEND_ORIGIN,
        settings.RENDER_EXTERNAL_URL,
    ]
    for candidate in base_candidates:
        parsed = urlparse(candidate or '')
        if parsed.scheme and parsed.netloc:
            return f'{parsed.scheme}://{parsed.netloc}/{cleaned}'
    return f'/{cleaned}'


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
    response = {
        'filename': path.name,
        'local_path': relative,
        'file_url': _public_upload_url(relative),
        'url': _public_upload_url(relative),
        'storage': 'local',
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
