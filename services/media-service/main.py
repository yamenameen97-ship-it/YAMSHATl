from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any
import hashlib
import json
from datetime import datetime
import logging
import mimetypes
import boto3

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Yamshat Media Service",
    description="خدمة معالجة وتوسيع الوسائط",
    version="2.1.0"
)

# إضافة CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# إعدادات الخدمة - استخدام مسارات دائمة
BASE_DIR = Path(__file__).parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads" / "media"
CACHE_DIR = BASE_DIR / "uploads" / "cache"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)

logger.info(f"📁 Upload directory: {UPLOAD_DIR}")
logger.info(f"📁 Cache directory: {CACHE_DIR}")

# AWS S3 and CloudFront Configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "yamshat-media-bucket")
CLOUDFRONT_DOMAIN = os.getenv("CLOUDFRONT_DOMAIN", "d12345.cloudfront.net") # Replace with your CloudFront domain

s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

# الصيغ المدعومة
SUPPORTED_IMAGE_FORMATS = {"png", "jpg", "jpeg", "webp", "gif"}
SUPPORTED_VIDEO_FORMATS = {"mp4", "webm", "mov", "avi"}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB
ALLOWED_EXTENSIONS = SUPPORTED_IMAGE_FORMATS | SUPPORTED_VIDEO_FORMATS

# MIME types
MIME_TYPES = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
}


class MediaProcessor:
    """معالج الوسائط المتقدم"""
    
    @staticmethod
    def get_file_extension(filename: str) -> str:
        """الحصول على امتداد الملف"""
        return filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    
    @staticmethod
    def generate_file_hash(filename: str, content: bytes) -> str:
        """توليد بصمة فريدة للملف"""
        hash_input = f"{filename}{len(content)}{datetime.utcnow().isoformat()}"
        return hashlib.md5(hash_input.encode()).hexdigest()[:16]
    
    @staticmethod
    def validate_file_content(content: bytes, file_ext: str) -> bool:
        """التحقق من صحة محتوى الملف"""
        if not content:
            return False
        
        # التحقق من الحد الأدنى للحجم
        if len(content) < 100:
            return False
        
        # التحقق من البصمات (Magic Numbers)
        if file_ext in {'png'}:
            return content[:8] == b'\x89PNG\r\n\x1a\n'
        elif file_ext in {'jpg', 'jpeg'}:
            return content[:2] == b'\xff\xd8' and content[-2:] == b'\xff\xd9'
        elif file_ext == 'webp':
            return content[:4] == b'RIFF' and b'WEBP' in content[:12]
        elif file_ext == 'gif':
            return content[:6] in {b'GIF87a', b'GIF89a'}
        elif file_ext in {'mp4'}:
            return b'ftyp' in content[:32]
        
        return True
    
    @staticmethod
    async def process_image(
        file_path: Path,
        resize_to: Optional[tuple] = None,
        quality: int = 85,
        format: str = "webp"
    ) -> Path:
        """معالجة الصور - تحجيم وضغط"""
        try:
            from PIL import Image
            
            img = Image.open(file_path)
            
            # تحجيم الصورة إذا لزم الأمر
            if resize_to:
                img.thumbnail(resize_to, Image.Resampling.LANCZOS)
            
            # تحويل إلى صيغة محسّنة
            output_path = file_path.with_suffix(f'.{format}')
            img.save(output_path, format=format.upper(), quality=quality, optimize=True)
            
            logger.info(f"✅ Image processed: {file_path.name} -> {output_path.name}")
            return output_path
            
        except Exception as e:
            logger.error(f"❌ Image processing error: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")
    
    @staticmethod
    async def process_video(
        file_path: Path,
        bitrate: str = "1000k",
        resolution: str = "1280:720"
    ) -> Path:
        """معالجة الفيديو - ضغط وتحويل"""
        try:
            import subprocess
            
            output_path = file_path.with_suffix('.mp4')
            
            # استخدام FFmpeg لمعالجة الفيديو
            cmd = [
                'ffmpeg', '-i', str(file_path),
                '-b:v', bitrate,
                '-s', resolution,
                '-c:v', 'libx264',
                '-preset', 'medium',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-y',
                str(output_path)
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                raise Exception(f"FFmpeg error: {stderr.decode()}")
            
            logger.info(f"✅ Video processed: {file_path.name} -> {output_path.name}")
            return output_path
            
        except Exception as e:
            logger.error(f"❌ Video processing error: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Video processing failed: {str(e)}")


class MediaMetadata:
    """إدارة بيانات الوسائط"""
    
    @staticmethod
    def save_metadata(file_hash: str, metadata: dict):
        """حفظ بيانات الملف"""
        metadata_file = CACHE_DIR / f"{file_hash}.json"
        try:
            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Failed to save metadata: {str(e)}")
    
    @staticmethod
    def get_metadata(file_hash: str) -> Optional[dict]:
        """الحصول على بيانات الملف"""
        metadata_file = CACHE_DIR / f"{file_hash}.json"
        if metadata_file.exists():
            try:
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to read metadata: {str(e)}")
        return None

async def upload_to_s3(file_path: Path, object_name: str, content_type: str):
    try:
        if not AWS_ACCESS_KEY_ID or "your" in AWS_ACCESS_KEY_ID.lower():
            logger.warning("⚠️ AWS Credentials not configured, using local URL")
            return f"/uploads/media/{object_name}"
            
        s3_client.upload_file(str(file_path), S3_BUCKET_NAME, object_name, ExtraArgs={'ContentType': content_type})
        logger.info(f"✅ Uploaded {file_path} to S3 bucket {S3_BUCKET_NAME} as {object_name}")
        return f"https://{CLOUDFRONT_DOMAIN}/{object_name}"
    except Exception as e:
        logger.error(f"❌ Failed to upload {file_path} to S3: {e}, falling back to local")
        return f"/uploads/media/{object_name}"


# المسارات (Routes)

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "media-service",
        "version": "2.1.0",
        "upload_dir": str(UPLOAD_DIR),
        "cache_dir": str(CACHE_DIR),
        "s3_bucket": S3_BUCKET_NAME,
        "cloudfront_domain": CLOUDFRONT_DOMAIN
    }


@app.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    resize: Optional[str] = Query(None, description="Resize format: 800x600"),
    quality: int = Query(85, ge=1, le=100),
    format: str = Query("webp", description="Output format")
):
    """
    رفع ومعالجة الوسائط
    
    المعاملات:
    - file: الملف المراد رفعه
    - resize: حجم التحجيم (مثال: 800x600)
    - quality: جودة الضغط (1-100)
    - format: صيغة الإخراج (webp, jpg, mp4, إلخ)
    """
    try:
        # التحقق من امتداد الملف
        file_ext = MediaProcessor.get_file_extension(file.filename)
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {file_ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # قراءة محتوى الملف
        content = await file.read()
        
        # التحقق من حجم الملف
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Max size: {MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        
        # التحقق من صحة محتوى الملف
        if not MediaProcessor.validate_file_content(content, file_ext):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file content for format: {file_ext}"
            )
        
        # توليد بصمة فريدة
        file_hash = MediaProcessor.generate_file_hash(file.filename, content)
        
        # حفظ الملف بشكل مؤقت للمعالجة
        temp_local_path = UPLOAD_DIR / f"{file_hash}_{file.filename}"
        with open(temp_local_path, 'wb') as f:
            f.write(content)
        
        logger.info(f"📥 File saved locally for processing: {temp_local_path}")
        
        processed_path = temp_local_path
        # معالجة الملف حسب نوعه
        if file_ext in SUPPORTED_IMAGE_FORMATS:
            resize_tuple = None
            if resize:
                try:
                    w, h = map(int, resize.split('x'))
                    resize_tuple = (w, h)
                except:
                    pass
            
            processed_path = await MediaProcessor.process_image(
                temp_local_path,
                resize_to=resize_tuple,
                quality=quality,
                format=format
            )
        
        elif file_ext in SUPPORTED_VIDEO_FORMATS:
            processed_path = await MediaProcessor.process_video(
                temp_local_path,
                bitrate="1000k",
                resolution="1280:720"
            )
        
        # Upload to S3
        object_name = f"{file_hash}.{processed_path.suffix.lstrip('.')}"
        content_type = MIME_TYPES.get(processed_path.suffix.lstrip('.'), "application/octet-stream")
        s3_url = await upload_to_s3(processed_path, object_name, content_type)

        # If S3 is not used, keep the file in UPLOAD_DIR
        if s3_url.startswith("/uploads/"):
            final_path = UPLOAD_DIR / object_name
            if processed_path != final_path:
                import shutil
                shutil.copy2(processed_path, final_path)
        
        # Clean up temporary files
        try:
            if temp_local_path.exists(): os.remove(temp_local_path)
            if processed_path.exists() and processed_path != (UPLOAD_DIR / object_name): 
                os.remove(processed_path)
        except: pass
        
        # حفظ البيانات الوصفية
        metadata = {
            "original_filename": file.filename,
            "file_hash": file_hash,
            "file_size": len(content),
            "file_type": file_ext,
            "processed_at": datetime.utcnow().isoformat(),
            "quality": quality,
            "format": format,
            "s3_url": s3_url,
            "status": "success"
        }
        MediaMetadata.save_metadata(file_hash, metadata)
        
        # إرجاع معلومات الملف
        return {
            "success": True,
            "file_hash": file_hash,
            "filename": processed_path.name,
            "url": s3_url,
            "size": len(content),
            "type": file_ext,
            "metadata": metadata
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/media/{file_hash}")
async def get_media(file_hash: str):
    """الحصول على الملف المعالج"""
    metadata = MediaMetadata.get_metadata(file_hash)
    if not metadata or "s3_url" not in metadata:
        raise HTTPException(status_code=404, detail="File not found or not available on S3")
    
    # Redirect to CloudFront URL
    return RedirectResponse(url=metadata["s3_url"])


@app.get("/media/{file_hash}/metadata")
async def get_media_metadata(file_hash: str):
    """الحصول على بيانات الملف"""
    metadata = MediaMetadata.get_metadata(file_hash)
    if not metadata:
        raise HTTPException(status_code=404, detail="Metadata not found")
    return metadata


@app.post("/batch-upload")
async def batch_upload(
    files: list[UploadFile] = File(...),
    quality: int = Query(85, ge=1, le=100)
):
    """رفع عدة ملفات دفعة واحدة"""
    results = []
    
    for file in files:
        try:
            # معالجة كل ملف
            file_ext = MediaProcessor.get_file_extension(file.filename)
            if file_ext not in ALLOWED_EXTENSIONS:
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": f"Unsupported format: {file_ext}"
                })
                continue
            
            content = await file.read()
            
            # التحقق من الحجم
            if len(content) > MAX_FILE_SIZE:
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": f"File too large"
                })
                continue
            
            # التحقق من صحة المحتوى
            if not MediaProcessor.validate_file_content(content, file_ext):
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": f"Invalid file content"
                })
                continue
            
            file_hash = MediaProcessor.generate_file_hash(file.filename, content)
            
            # حفظ الملف بشكل مؤقت
            temp_local_path = UPLOAD_DIR / f"{file_hash}_{file.filename}"
            with open(temp_local_path, 'wb') as f:
                f.write(content)
            
            processed_path = temp_local_path
            # معالجة الملف حسب نوعه (يمكن إضافة معالجة للصور/الفيديو هنا إذا لزم الأمر)
            # For batch upload, we might skip complex processing for simplicity or offload it.

            # Upload to S3
            object_name = f"{file_hash}.{processed_path.suffix.lstrip('.')}"
            content_type = MIME_TYPES.get(processed_path.suffix.lstrip('.'), "application/octet-stream")
            s3_url = await upload_to_s3(processed_path, object_name, content_type)

            # Clean up local temporary file
            os.remove(temp_local_path)
            if processed_path != temp_local_path: # Remove processed file if different
                os.remove(processed_path)

            results.append({
                "filename": file.filename,
                "success": True,
                "file_hash": file_hash,
                "url": s3_url
            })
        
        except Exception as e:
            results.append({
                "filename": file.filename,
                "success": False,
                "error": str(e)
            })
    
    return {
        "total": len(files),
        "successful": sum(1 for r in results if r["success"]),
        "failed": sum(1 for r in results if not r["success"]),
        "results": results
    }
