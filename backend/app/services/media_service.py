def scan_media_for_malware(media_url: str) -> bool:
    # Placeholder for media scanning logic
    # In a real application, this would integrate with a malware scanning service
    return True

import os
import shutil
import uuid
import logging
from pathlib import Path
from typing import List, Optional
from fastapi import UploadFile, HTTPException
from PIL import Image
import subprocess
import asyncio
from datetime import datetime

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path("backend/uploads")
MEDIA_DIR = Path("backend/media")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

class MediaService:
    @staticmethod
    async def save_upload_chunk(file_id: str, chunk_index: int, content: bytes):
        """حفظ جزء من الملف (Chunk Upload)"""
        chunk_dir = UPLOAD_DIR / f"chunks_{file_id}"
        chunk_dir.mkdir(exist_ok=True)
        chunk_path = chunk_dir / f"chunk_{chunk_index}"
        with open(chunk_path, "wb") as f:
            f.write(content)
        return chunk_path

    @staticmethod
    async def assemble_chunks(file_id: str, total_chunks: int, filename: str):
        """تجميع الأجزاء في ملف واحد"""
        chunk_dir = UPLOAD_DIR / f"chunks_{file_id}"
        final_path = UPLOAD_DIR / f"{uuid.uuid4()}_{filename}"
        
        with open(final_path, "wb") as final_file:
            for i in range(total_chunks):
                chunk_path = chunk_dir / f"chunk_{i}"
                if not chunk_path.exists():
                    raise HTTPException(status_code=400, detail=f"Missing chunk {i}")
                with open(chunk_path, "rb") as f:
                    final_file.write(f.read())
        
        # تنظيف الأجزاء
        shutil.rmtree(chunk_dir)
        return final_path

    @staticmethod
    async def compress_image(input_path: Path, quality: int = 70):
        """ضغط الصور لتقليل الحجم"""
        try:
            output_path = MEDIA_DIR / f"compressed_{input_path.name}"
            with Image.open(input_path) as img:
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                img.save(output_path, "JPEG", quality=quality, optimize=True)
            return output_path
        except Exception as e:
            logger.error(f"Error compressing image: {e}")
            return input_path

    @staticmethod
    async def transcode_video(input_path: Path):
        """تحويل الفيديو إلى صيغة متوافقة (H.264)"""
        output_path = MEDIA_DIR / f"transcoded_{input_path.stem}.mp4"
        cmd = [
            "ffmpeg", "-i", str(input_path),
            "-c:v", "libx264", "-crf", "23", "-preset", "medium",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart", "-y", str(output_path)
        ]
        process = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        await process.communicate()
        return output_path if output_path.exists() else input_path

    @staticmethod
    async def cleanup_old_media(days: int = 30):
        """تنظيف الملفات القديمة وغير المستخدمة"""
        now = datetime.now().timestamp()
        count = 0
        for folder in [UPLOAD_DIR, MEDIA_DIR]:
            for path in folder.glob("*"):
                if path.is_file() and (now - path.stat().st_mtime) > (days * 86400):
                    path.unlink()
                    count += 1
        return count
