"""
خدمة الوسائط المحسّنة - Media Scaling Service
يوفر:
- تحجيم الصور (Image Resizing)
- ضغط الوسائط (Media Compression)
- تحويل الصيغ (Format Conversion)
- معالجة الفيديو (Video Processing)
- التخزين المؤقت (Caching)
- معالجة الأخطاء الشاملة
- التحقق من سلامة الملفات
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import asyncio
from pathlib import Path
from typing import Optional
import hashlib
import json
from datetime import datetime
import logging
import mimetypes

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


# المسارات (Routes)

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "media-service",
        "version": "2.1.0",
        "upload_dir": str(UPLOAD_DIR),
        "cache_dir": str(CACHE_DIR)
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
        
        # حفظ الملف بشكل دائم
        temp_path = UPLOAD_DIR / f"{file_hash}_{file.filename}"
        with open(temp_path, 'wb') as f:
            f.write(content)
        
        logger.info(f"📥 File saved: {temp_path}")
        
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
                temp_path,
                resize_to=resize_tuple,
                quality=quality,
                format=format
            )
        
        elif file_ext in SUPPORTED_VIDEO_FORMATS:
            processed_path = await MediaProcessor.process_video(
                temp_path,
                bitrate="1000k",
                resolution="1280:720"
            )
        
        else:
            processed_path = temp_path
        
        # حفظ البيانات الوصفية
        metadata = {
            "original_filename": file.filename,
            "file_hash": file_hash,
            "file_size": len(content),
            "file_type": file_ext,
            "processed_at": datetime.utcnow().isoformat(),
            "quality": quality,
            "format": format,
            "local_path": str(processed_path),
            "status": "success"
        }
        MediaMetadata.save_metadata(file_hash, metadata)
        
        # إرجاع معلومات الملف
        return {
            "success": True,
            "file_hash": file_hash,
            "filename": processed_path.name,
            "url": f"/api/media/{file_hash}",
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
    try:
        # البحث عن الملف
        matching_files = list(UPLOAD_DIR.glob(f"{file_hash}_*"))
        if not matching_files:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_path = matching_files[0]
        
        # تحديد نوع المحتوى
        file_ext = file_path.suffix.lower().lstrip('.')
        content_type = MIME_TYPES.get(file_ext, "application/octet-stream")
        
        return FileResponse(file_path, media_type=content_type)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get media error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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
            
            # حفظ الملف
            file_path = UPLOAD_DIR / f"{file_hash}_{file.filename}"
            with open(file_path, 'wb') as f:
                f.write(content)
            
            results.append({
                "filename": file.filename,
                "success": True,
                "file_hash": file_hash,
                "url": f"/api/media/{file_hash}"
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


@app.delete("/media/{file_hash}")
async def delete_media(file_hash: str):
    """حذف الملف"""
    try:
        matching_files = list(UPLOAD_DIR.glob(f"{file_hash}_*"))
        if not matching_files:
            raise HTTPException(status_code=404, detail="File not found")
        
        for file_path in matching_files:
            file_path.unlink()
            logger.info(f"🗑️ File deleted: {file_path}")
        
        # حذف البيانات الوصفية
        metadata_file = CACHE_DIR / f"{file_hash}.json"
        if metadata_file.exists():
            metadata_file.unlink()
        
        return {"success": True, "message": "File deleted"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats")
async def get_stats():
    """إحصائيات الخدمة"""
    upload_count = len(list(UPLOAD_DIR.glob("*")))
    cache_count = len(list(CACHE_DIR.glob("*.json")))
    
    # حساب حجم الملفات
    total_size = sum(f.stat().st_size for f in UPLOAD_DIR.glob("*") if f.is_file())
    
    return {
        "uploaded_files": upload_count,
        "cached_metadata": cache_count,
        "total_size_mb": round(total_size / (1024 * 1024), 2),
        "upload_dir": str(UPLOAD_DIR),
        "cache_dir": str(CACHE_DIR)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
