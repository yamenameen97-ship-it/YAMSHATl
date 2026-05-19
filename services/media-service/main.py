"""
خدمة الوسائط المحسّنة - Media Scaling Service
يوفر:
- تحجيم الصور (Image Resizing)
- ضغط الوسائط (Media Compression)
- تحويل الصيغ (Format Conversion)
- معالجة الفيديو (Video Processing)
- التخزين المؤقت (Caching)
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

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Yamshat Media Service",
    description="خدمة معالجة وتوسيع الوسائط",
    version="2.0.0"
)

# إضافة CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# إعدادات الخدمة
UPLOAD_DIR = Path("/tmp/uploads")
CACHE_DIR = Path("/tmp/media_cache")
UPLOAD_DIR.mkdir(exist_ok=True)
CACHE_DIR.mkdir(exist_ok=True)

# الصيغ المدعومة
SUPPORTED_IMAGE_FORMATS = {"png", "jpg", "jpeg", "webp", "gif"}
SUPPORTED_VIDEO_FORMATS = {"mp4", "webm", "mov", "avi"}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB
ALLOWED_EXTENSIONS = SUPPORTED_IMAGE_FORMATS | SUPPORTED_VIDEO_FORMATS


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
        return hashlib.md5(hash_input.encode()).hexdigest()[:12]
    
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
                '-y',  # Overwrite output file
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
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f)
    
    @staticmethod
    def get_metadata(file_hash: str) -> Optional[dict]:
        """الحصول على بيانات الملف"""
        metadata_file = CACHE_DIR / f"{file_hash}.json"
        if metadata_file.exists():
            with open(metadata_file, 'r') as f:
                return json.load(f)
        return None


# المسارات (Routes)

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "media-service",
        "version": "2.0.0"
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
                detail=f"Unsupported file format: {file_ext}"
            )
        
        # قراءة محتوى الملف
        content = await file.read()
        
        # التحقق من حجم الملف
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Max size: {MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        
        # توليد بصمة فريدة
        file_hash = MediaProcessor.generate_file_hash(file.filename, content)
        
        # حفظ الملف مؤقتاً
        temp_path = UPLOAD_DIR / f"{file_hash}_{file.filename}"
        with open(temp_path, 'wb') as f:
            f.write(content)
        
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
            "format": format
        }
        MediaMetadata.save_metadata(file_hash, metadata)
        
        # إرجاع معلومات الملف
        return {
            "success": True,
            "file_hash": file_hash,
            "filename": processed_path.name,
            "url": f"https://cdn.yamshat.com/media/{file_hash}",
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
        content_type = "application/octet-stream"
        if file_path.suffix.lower() in {'.jpg', '.jpeg'}:
            content_type = "image/jpeg"
        elif file_path.suffix.lower() == '.png':
            content_type = "image/png"
        elif file_path.suffix.lower() == '.webp':
            content_type = "image/webp"
        elif file_path.suffix.lower() == '.mp4':
            content_type = "video/mp4"
        
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
            file_hash = MediaProcessor.generate_file_hash(file.filename, content)
            
            results.append({
                "filename": file.filename,
                "success": True,
                "file_hash": file_hash,
                "url": f"https://cdn.yamshat.com/media/{file_hash}"
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
    
    return {
        "uploaded_files": upload_count,
        "cached_metadata": cache_count,
        "upload_dir": str(UPLOAD_DIR),
        "cache_dir": str(CACHE_DIR)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
