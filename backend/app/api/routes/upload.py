import os
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from werkzeug.utils import secure_filename

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.cloudinary_service import upload_file as cloudinary_upload_file

router = APIRouter()

UPLOAD_DIR = Path('uploads')
UPLOAD_DIR.mkdir(exist_ok=True)


def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in settings.allowed_upload_extensions


@router.post('/')
def upload(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    _ = current_user
    safe_name = secure_filename(file.filename or '')
    if not safe_name or not allowed_file(safe_name):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Unsupported file type')

    path = UPLOAD_DIR / safe_name
    with open(path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)

    response = {
        'filename': safe_name,
        'local_path': str(path),
        'file_url': str(path),
        'url': str(path),
    }

    if os.getenv('CLOUD_NAME') and os.getenv('CLOUD_API_KEY') and os.getenv('CLOUD_API_SECRET'):
        try:
            response['cloud_url'] = cloudinary_upload_file(str(path))
            response['file_url'] = response['cloud_url']
            response['url'] = response['cloud_url']
        except Exception as exc:
            response['cloud_error'] = str(exc)

    return response
