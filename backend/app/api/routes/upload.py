from __future__ import annotations
import hashlib
import json
import shutil
import uuid
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, Body, Depends, File, HTTPException, Request, UploadFile, status, BackgroundTasks
from werkzeug.utils import secure_filename

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.cloudinary_service import is_configured as cloudinary_is_configured
from app.services.cloudinary_service import upload_file as cloudinary_upload_file

router = APIRouter()

UPLOAD_DIR = Path('uploads')
UPLOAD_DIR.mkdir(exist_ok=True)
CHUNKS_DIR = UPLOAD_DIR / 'chunks'
CHUNKS_DIR.mkdir(exist_ok=True)

# --- Background Workers for Media Processing ---
async def process_media_background(file_path: str, user_id: int):
    """عامل في الخلفية لمعالجة وتحويل الميديا بشكل غير متزامن"""
    print(f"Background worker: Processing {file_path} for user {user_id}")
    # محاكاة Transcoding أو التحسين
    await asyncio.sleep(2)
    if cloudinary_is_configured():
        cloudinary_upload_file(file_path, is_video=file_path.endswith(('.mp4', '.mov')))

# --- Advanced Chunk & Resumable Uploads ---

@router.post('/resumable/init')
def init_resumable_upload(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    """بدء عملية رفع قابلة للاستئناف (Resumable Init)"""
    file_id = str(uuid.uuid4())
    filename = secure_filename(payload.get('filename'))
    total_size = payload.get('total_size')
    
    # حفظ البيانات الوصفية للرفع
    meta = {
        "file_id": file_id,
        "filename": filename,
        "total_size": total_size,
        "uploaded_size": 0,
        "status": "pending",
        "user_id": current_user.id
    }
    
    meta_path = CHUNKS_DIR / f"{file_id}.json"
    meta_path.write_text(json.dumps(meta))
    
    return {"file_id": file_id, "upload_url": f"/api/v1/upload/resumable/{file_id}/chunk"}

@router.put('/resumable/{file_id}/chunk')
async def upload_chunk(
    file_id: str, 
    request: Request, 
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """رفع جزء من الملف (Chunk Upload)"""
    meta_path = CHUNKS_DIR / f"{file_id}.json"
    if not meta_path.exists():
        raise HTTPException(status_code=404, detail="Upload session not found")
        
    meta = json.loads(meta_path.read_text())
    
    # الحصول على معلومات الجزء من الترويسات (Headers)
    content_range = request.headers.get("Content-Range") # bytes 0-524287/1024832
    chunk_data = await request.body()
    
    file_path = UPLOAD_DIR / f"{file_id}_{meta['filename']}"
    
    with open(file_path, "ab") as f:
        f.write(chunk_data)
        
    meta["uploaded_size"] += len(chunk_data)
    
    if meta["uploaded_size"] >= meta["total_size"]:
        meta["status"] = "completed"
        # تشغيل المعالجة في الخلفية (Background Workers)
        background_tasks.add_task(process_media_background, str(file_path), current_user.id)
        
    meta_path.write_text(json.dumps(meta))
    
    return {
        "status": meta["status"],
        "uploaded_size": meta["uploaded_size"],
        "total_size": meta["total_size"],
        "progress": round((meta["uploaded_size"] / meta["total_size"]) * 100, 2)
    }

@router.get('/resumable/{file_id}/status')
def get_upload_status(file_id: str):
    """التحقق من حالة الرفع للاستئناف (Resumable Status)"""
    meta_path = CHUNKS_DIR / f"{file_id}.json"
    if not meta_path.exists():
        raise HTTPException(status_code=404, detail="Upload session not found")
    return json.loads(meta_path.read_text())

# --- Standard Upload with CDN Optimization ---

@router.post('/')
async def upload_file_standard(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    current_user: User = Depends(get_current_user)
):
    """الرفع القياسي مع تفعيل التحسينات التلقائية"""
    temp_path = UPLOAD_DIR / f"std_{uuid.uuid4().hex}_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # التحسين المتقدم عبر Cloudinary/CDN
    result = {"status": "processing", "filename": file.filename}
    
    if cloudinary_is_configured():
        # Async transcoding & adaptive optimization
        background_tasks.add_task(process_media_background, str(temp_path), current_user.id)
        result["storage"] = "cloudinary_async"
    else:
        result["storage"] = "local"
        result["url"] = f"/uploads/{temp_path.name}"
        
    return result

@router.post('/webhook/cloudinary')
async def cloudinary_webhook(payload: dict = Body(...)):
    """استقبال تحديثات Transcoding غير المتزامنة من Cloudinary"""
    print(f"Cloudinary Webhook received: {payload.get('notification_type')}")
    # تحديث قاعدة البيانات بروابط الفيديو المحولة (Adaptive Bitrate)
    return {"status": "ok"}
