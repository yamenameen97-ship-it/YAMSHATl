import os
import shutil
from pathlib import Path

from fastapi import APIRouter, File, UploadFile

from app.services.cloudinary_service import upload_file as cloudinary_upload_file

router = APIRouter()

UPLOAD_DIR = Path('uploads')
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post('/')
def upload(file: UploadFile = File(...)):
    path = UPLOAD_DIR / file.filename

    with open(path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)

    response = {
        'filename': file.filename,
        'local_path': str(path),
    }

    if os.getenv('CLOUD_NAME') and os.getenv('CLOUD_API_KEY') and os.getenv('CLOUD_API_SECRET'):
        try:
            response['cloud_url'] = cloudinary_upload_file(str(path))
        except Exception as exc:
            response['cloud_error'] = str(exc)

    return response
