import cloudinary
import cloudinary.uploader
import cloudinary.api
from app.core.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)

def is_configured() -> bool:
    return settings.cloudinary_configured

def upload_file(file_path: str, folder: str | None = None, is_video: bool = False) -> dict:
    if not is_configured():
        raise RuntimeError('Cloudinary is not configured')

    # Adaptive Media Optimization & Responsive Variants
    upload_options = {
        "folder": folder or settings.CLOUDINARY_FOLDER,
        "resource_type": "auto",
        "use_filename": True,
        "unique_filename": True,
        "overwrite": False,
        "fetch_format": "auto",  # CDN Optimization
        "quality": "auto",       # Adaptive Optimization
    }

    if is_video:
        # Async Transcoding for Videos
        upload_options.update({
            "eager": [
                {"streaming_profile": "full_hd", "format": "m3u8"}, # Adaptive Bitrate Streaming
                {"width": 720, "crop": "scale", "format": "mp4"},   # Responsive Variant
            ],
            "eager_async": True,
            "eager_notification_url": f"{settings.BACKEND_ORIGIN}/api/v1/upload/webhook/cloudinary"
        })
    else:
        # Responsive Image Variants
        upload_options.update({
            "transformation": [
                {"width": "auto", "dpr": "auto", "crop": "scale"},
                {"quality": "auto", "fetch_format": "auto"}
            ]
        })

    result = cloudinary.uploader.upload(file_path, **upload_options)
    
    secure_url = result.get('secure_url')
    if not secure_url:
        raise RuntimeError('Cloudinary upload failed')
        
    return {
        "url": secure_url,
        "public_id": result.get("public_id"),
        "format": result.get("format"),
        "version": result.get("version"),
        "responsive_variants": result.get("eager", []),
        "optimization": "adaptive_auto"
    }

def get_optimized_url(public_id: str, width: int = None, height: int = None, crop: str = "fill") -> str:
    """توليد روابط محسنة لـ CDN بناءً على المتطلبات"""
    options = {"fetch_format": "auto", "quality": "auto"}
    if width: options["width"] = width
    if height: options["height"] = height
    if width or height: options["crop"] = crop
    
    return cloudinary.utils.cloudinary_url(public_id, **options)[0]
