import cloudinary
import cloudinary.uploader

from app.core.config import settings


cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


def is_configured() -> bool:
    return settings.cloudinary_configured


def upload_file(file_path: str, folder: str | None = None) -> str:
    if not is_configured():
        raise RuntimeError('Cloudinary is not configured')

    result = cloudinary.uploader.upload(
        file_path,
        folder=folder or settings.CLOUDINARY_FOLDER,
        resource_type='auto',
        use_filename=True,
        unique_filename=True,
        overwrite=False,
    )
    secure_url = result.get('secure_url')
    if not secure_url:
        raise RuntimeError('Cloudinary upload failed')
    return secure_url
