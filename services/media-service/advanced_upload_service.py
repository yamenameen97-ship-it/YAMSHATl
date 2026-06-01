"""
نظام رفع الملفات المتقدم - Advanced Upload Service
يوفر:
- أشرطة تقدم احترافية (Professional Progress Bars)
- إعادة محاولة الرفع (Upload Retry)
- إلغاء الرفع (Cancel Upload)
- السحب والإفلات (Drag & Drop)
- رفع الملفات بالشرائح (Chunk Upload)
- استرجاع الملفات الفاشلة (Failed Upload Recovery)
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import os
import asyncio
from pathlib import Path
from typing import Optional, Dict, List
import hashlib
import json
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass, asdict, field
from enum import Enum
import uuid

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Yamshat Advanced Upload Service",
    description="نظام رفع ملفات متقدم مع الشرائح والإعادة والـ Drag&Drop",
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

# ============ التكوينات ============

UPLOAD_DIR = Path("/tmp/uploads")
CHUNKS_DIR = Path("/tmp/chunks")
FAILED_UPLOADS_DIR = Path("/tmp/failed_uploads")
METADATA_DIR = Path("/tmp/upload_metadata")

for dir_path in [UPLOAD_DIR, CHUNKS_DIR, FAILED_UPLOADS_DIR, METADATA_DIR]:
    dir_path.mkdir(exist_ok=True, parents=True)

# الإعدادات
CHUNK_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB
MAX_RETRIES = 3
CHUNK_EXPIRY_HOURS = 24

SUPPORTED_IMAGE_FORMATS = {"png", "jpg", "jpeg", "webp", "gif", "bmp", "svg"}
SUPPORTED_VIDEO_FORMATS = {"mp4", "webm", "mov", "avi", "mkv", "flv"}
SUPPORTED_DOCUMENT_FORMATS = {"pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"}
ALLOWED_EXTENSIONS = SUPPORTED_IMAGE_FORMATS | SUPPORTED_VIDEO_FORMATS | SUPPORTED_DOCUMENT_FORMATS


# ============ تعريفات الأنواع ============

class UploadStatus(str, Enum):
    """حالات الرفع"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PAUSED = "paused"


class ChunkStatus(str, Enum):
    """حالات الشرائح"""
    PENDING = "pending"
    UPLOADED = "uploaded"
    VERIFIED = "verified"
    FAILED = "failed"


@dataclass
class ChunkMetadata:
    """بيانات الشريحة"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    upload_id: str = ""
    chunk_index: int = 0
    chunk_size: int = 0
    chunk_hash: str = ""
    status: ChunkStatus = ChunkStatus.PENDING
    attempts: int = 0
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class UploadProgress:
    """تقدم الرفع"""
    upload_id: str = ""
    filename: str = ""
    total_size: int = 0
    uploaded_size: int = 0
    total_chunks: int = 0
    uploaded_chunks: int = 0
    failed_chunks: int = 0
    progress_percent: float = 0.0
    status: UploadStatus = UploadStatus.PENDING
    speed_bps: float = 0.0  # bytes per second
    eta_seconds: int = 0
    start_time: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    last_update: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class UploadSession:
    """جلسة الرفع"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    filename: str = ""
    file_size: int = 0
    file_type: str = ""
    file_hash: str = ""
    total_chunks: int = 0
    uploaded_chunks: List[int] = field(default_factory=list)
    failed_chunks: List[int] = field(default_factory=list)
    status: UploadStatus = UploadStatus.PENDING
    progress: UploadProgress = field(default_factory=UploadProgress)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    expires_at: str = field(default_factory=lambda: (
        datetime.utcnow() + timedelta(hours=CHUNK_EXPIRY_HOURS)
    ).isoformat())
    metadata: Dict = field(default_factory=dict)


# ============ مدير الرفع ============

class UploadManager:
    """مدير الرفع المتقدم"""
    
    def __init__(self):
        self.sessions: Dict[str, UploadSession] = {}
        self.chunks_metadata: Dict[str, List[ChunkMetadata]] = {}
        self.active_uploads: Dict[str, UploadSession] = {}
    
    def create_upload_session(
        self,
        user_id: str,
        filename: str,
        file_size: int,
        file_type: str
    ) -> UploadSession:
        """إنشاء جلسة رفع جديدة"""
        file_hash = self._calculate_file_hash(filename, file_size)
        total_chunks = (file_size + CHUNK_SIZE - 1) // CHUNK_SIZE
        
        session = UploadSession(
            user_id=user_id,
            filename=filename,
            file_size=file_size,
            file_type=file_type,
            file_hash=file_hash,
            total_chunks=total_chunks
        )
        
        session.progress = UploadProgress(
            upload_id=session.id,
            filename=filename,
            total_size=file_size,
            total_chunks=total_chunks
        )
        
        self.sessions[session.id] = session
        self.active_uploads[session.id] = session
        self.chunks_metadata[session.id] = []
        
        logger.info(f"✅ Upload session created: {session.id} ({filename})")
        return session
    
    def get_session(self, upload_id: str) -> Optional[UploadSession]:
        """الحصول على جلسة الرفع"""
        return self.sessions.get(upload_id)
    
    def upload_chunk(
        self,
        upload_id: str,
        chunk_index: int,
        chunk_data: bytes,
        chunk_hash: str
    ) -> bool:
        """رفع شريحة"""
        session = self.get_session(upload_id)
        if not session:
            return False
        
        # التحقق من صحة الشريحة
        calculated_hash = hashlib.md5(chunk_data).hexdigest()
        if calculated_hash != chunk_hash:
            logger.error(f"❌ Chunk hash mismatch for {upload_id}:{chunk_index}")
            return False
        
        # حفظ الشريحة
        chunk_path = CHUNKS_DIR / f"{upload_id}_chunk_{chunk_index}"
        try:
            with open(chunk_path, 'wb') as f:
                f.write(chunk_data)
            
            # تحديث البيانات الوصفية
            chunk_metadata = ChunkMetadata(
                upload_id=upload_id,
                chunk_index=chunk_index,
                chunk_size=len(chunk_data),
                chunk_hash=chunk_hash,
                status=ChunkStatus.UPLOADED
            )
            self.chunks_metadata[upload_id].append(chunk_metadata)
            
            # تحديث الجلسة
            session.uploaded_chunks.append(chunk_index)
            session.progress.uploaded_chunks = len(session.uploaded_chunks)
            session.progress.uploaded_size = sum(
                chunk.chunk_size for chunk in self.chunks_metadata[upload_id]
                if chunk.status == ChunkStatus.UPLOADED
            )
            session.progress.progress_percent = (
                session.progress.uploaded_size / session.file_size * 100
            )
            session.progress.last_update = datetime.utcnow().isoformat()
            
            logger.info(f"✅ Chunk {chunk_index} uploaded for {upload_id}")
            return True
        
        except Exception as e:
            logger.error(f"❌ Error uploading chunk: {str(e)}")
            session.failed_chunks.append(chunk_index)
            return False
    
    def finalize_upload(self, upload_id: str) -> Optional[str]:
        """إنهاء الرفع ودمج الشرائح"""
        session = self.get_session(upload_id)
        if not session:
            return None
        
        # التحقق من أن جميع الشرائح تم رفعها
        if len(session.uploaded_chunks) != session.total_chunks:
            logger.error(f"❌ Not all chunks uploaded for {upload_id}")
            return None
        
        try:
            # دمج الشرائح
            output_path = UPLOAD_DIR / f"{upload_id}_{session.filename}"
            with open(output_path, 'wb') as output_file:
                for i in range(session.total_chunks):
                    chunk_path = CHUNKS_DIR / f"{upload_id}_chunk_{i}"
                    with open(chunk_path, 'rb') as chunk_file:
                        output_file.write(chunk_file.read())
                    chunk_path.unlink()  # حذف الشريحة بعد دمجها
            
            # تحديث الجلسة
            session.status = UploadStatus.COMPLETED
            session.progress.status = UploadStatus.COMPLETED
            session.progress.progress_percent = 100.0
            session.updated_at = datetime.utcnow().isoformat()
            
            logger.info(f"✅ Upload finalized: {upload_id}")
            return str(output_path)
        
        except Exception as e:
            logger.error(f"❌ Error finalizing upload: {str(e)}")
            session.status = UploadStatus.FAILED
            session.progress.status = UploadStatus.FAILED
            return None
    
    def cancel_upload(self, upload_id: str) -> bool:
        """إلغاء الرفع"""
        session = self.get_session(upload_id)
        if not session:
            return False
        
        try:
            # حذف الشرائح
            for chunk_path in CHUNKS_DIR.glob(f"{upload_id}_chunk_*"):
                chunk_path.unlink()
            
            session.status = UploadStatus.CANCELLED
            session.progress.status = UploadStatus.CANCELLED
            
            logger.info(f"✅ Upload cancelled: {upload_id}")
            return True
        
        except Exception as e:
            logger.error(f"❌ Error cancelling upload: {str(e)}")
            return False
    
    def retry_failed_chunks(self, upload_id: str) -> List[int]:
        """إعادة محاولة الشرائح الفاشلة"""
        session = self.get_session(upload_id)
        if not session:
            return []
        
        failed_chunks = session.failed_chunks.copy()
        session.failed_chunks.clear()
        
        logger.info(f"✅ Retrying {len(failed_chunks)} failed chunks for {upload_id}")
        return failed_chunks
    
    def pause_upload(self, upload_id: str) -> bool:
        """إيقاف الرفع مؤقتاً"""
        session = self.get_session(upload_id)
        if not session:
            return False
        
        session.status = UploadStatus.PAUSED
        session.progress.status = UploadStatus.PAUSED
        
        logger.info(f"✅ Upload paused: {upload_id}")
        return True
    
    def resume_upload(self, upload_id: str) -> bool:
        """استئناف الرفع"""
        session = self.get_session(upload_id)
        if not session:
            return False
        
        session.status = UploadStatus.IN_PROGRESS
        session.progress.status = UploadStatus.IN_PROGRESS
        
        logger.info(f"✅ Upload resumed: {upload_id}")
        return True
    
    def get_upload_progress(self, upload_id: str) -> Optional[Dict]:
        """الحصول على تقدم الرفع"""
        session = self.get_session(upload_id)
        if not session:
            return None
        
        return asdict(session.progress)
    
    def _calculate_file_hash(self, filename: str, file_size: int) -> str:
        """حساب بصمة الملف"""
        hash_input = f"{filename}{file_size}{datetime.utcnow().isoformat()}"
        return hashlib.md5(hash_input.encode()).hexdigest()[:16]
    
    def cleanup_expired_sessions(self):
        """تنظيف الجلسات المنتهية الصلاحية"""
        now = datetime.utcnow()
        expired_sessions = []
        
        for upload_id, session in self.sessions.items():
            expires_at = datetime.fromisoformat(session.expires_at)
            if now > expires_at:
                expired_sessions.append(upload_id)
        
        for upload_id in expired_sessions:
            # حذف الشرائح
            for chunk_path in CHUNKS_DIR.glob(f"{upload_id}_chunk_*"):
                chunk_path.unlink()
            
            del self.sessions[upload_id]
            if upload_id in self.active_uploads:
                del self.active_uploads[upload_id]
            
            logger.info(f"✅ Expired session cleaned up: {upload_id}")


# ============ مدير الرفع ============

upload_manager = UploadManager()


# ============ المسارات (Routes) ============

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "service": "advanced-upload-service",
        "version": "2.0.0"
    }


@app.post("/upload/initiate")
async def initiate_upload(
    user_id: str,
    filename: str,
    file_size: int,
    file_type: str = Query(..., description="File type: image, video, document")
):
    """بدء جلسة رفع جديدة"""
    try:
        # التحقق من امتداد الملف
        file_ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {file_ext}"
            )
        
        # التحقق من حجم الملف
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Max size: {MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        
        # إنشاء جلسة
        session = upload_manager.create_upload_session(
            user_id=user_id,
            filename=filename,
            file_size=file_size,
            file_type=file_type
        )
        
        return {
            "success": True,
            "upload_id": session.id,
            "chunk_size": CHUNK_SIZE,
            "total_chunks": session.total_chunks,
            "expires_at": session.expires_at
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error initiating upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload/{upload_id}/chunk/{chunk_index}")
async def upload_chunk(
    upload_id: str,
    chunk_index: int,
    file: UploadFile = File(...)
):
    """رفع شريحة من الملف"""
    try:
        session = upload_manager.get_session(upload_id)
        if not session:
            raise HTTPException(status_code=404, detail="Upload session not found")
        
        # قراءة محتوى الشريحة
        chunk_data = await file.read()
        chunk_hash = hashlib.md5(chunk_data).hexdigest()
        
        # رفع الشريحة
        success = upload_manager.upload_chunk(
            upload_id=upload_id,
            chunk_index=chunk_index,
            chunk_data=chunk_data,
            chunk_hash=chunk_hash
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Chunk upload failed")
        
        return {
            "success": True,
            "chunk_index": chunk_index,
            "progress": upload_manager.get_upload_progress(upload_id)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error uploading chunk: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload/{upload_id}/finalize")
async def finalize_upload(upload_id: str):
    """إنهاء الرفع ودمج الشرائح"""
    try:
        session = upload_manager.get_session(upload_id)
        if not session:
            raise HTTPException(status_code=404, detail="Upload session not found")
        
        # دمج الشرائح
        file_path = upload_manager.finalize_upload(upload_id)
        if not file_path:
            raise HTTPException(status_code=400, detail="Failed to finalize upload")
        
        return {
            "success": True,
            "upload_id": upload_id,
            "file_path": file_path,
            "url": f"https://cdn.yamshat.com/uploads/{upload_id}",
            "progress": upload_manager.get_upload_progress(upload_id)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error finalizing upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/upload/{upload_id}/progress")
async def get_progress(upload_id: str):
    """الحصول على تقدم الرفع"""
    try:
        progress = upload_manager.get_upload_progress(upload_id)
        if not progress:
            raise HTTPException(status_code=404, detail="Upload session not found")
        
        return {
            "success": True,
            "progress": progress
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching progress: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload/{upload_id}/cancel")
async def cancel_upload(upload_id: str):
    """إلغاء الرفع"""
    try:
        success = upload_manager.cancel_upload(upload_id)
        if not success:
            raise HTTPException(status_code=404, detail="Upload session not found")
        
        return {
            "success": True,
            "upload_id": upload_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error cancelling upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload/{upload_id}/pause")
async def pause_upload(upload_id: str):
    """إيقاف الرفع مؤقتاً"""
    try:
        success = upload_manager.pause_upload(upload_id)
        if not success:
            raise HTTPException(status_code=404, detail="Upload session not found")
        
        return {
            "success": True,
            "upload_id": upload_id,
            "progress": upload_manager.get_upload_progress(upload_id)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error pausing upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload/{upload_id}/resume")
async def resume_upload(upload_id: str):
    """استئناف الرفع"""
    try:
        success = upload_manager.resume_upload(upload_id)
        if not success:
            raise HTTPException(status_code=404, detail="Upload session not found")
        
        return {
            "success": True,
            "upload_id": upload_id,
            "progress": upload_manager.get_upload_progress(upload_id)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error resuming upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload/{upload_id}/retry")
async def retry_failed_chunks(upload_id: str):
    """إعادة محاولة الشرائح الفاشلة"""
    try:
        failed_chunks = upload_manager.retry_failed_chunks(upload_id)
        
        return {
            "success": True,
            "upload_id": upload_id,
            "failed_chunks": failed_chunks,
            "count": len(failed_chunks)
        }
    
    except Exception as e:
        logger.error(f"❌ Error retrying failed chunks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/upload/stats")
async def get_stats():
    """إحصائيات الخدمة"""
    return {
        "active_uploads": len(upload_manager.active_uploads),
        "total_sessions": len(upload_manager.sessions),
        "chunk_size": CHUNK_SIZE,
        "max_file_size": MAX_FILE_SIZE,
        "max_retries": MAX_RETRIES
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
