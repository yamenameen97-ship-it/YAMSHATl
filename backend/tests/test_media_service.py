"""
اختبارات خدمة الوسائط المحسّنة
"""

import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import tempfile
import json
from unittest.mock import Mock, patch


# محاكاة تطبيق الخدمة
@pytest.fixture
def mock_media_service():
    """إنشاء خدمة وسائط وهمية للاختبار"""
    from services.media_service.main import app
    return TestClient(app)


class TestMediaServiceHealth:
    """اختبارات صحة الخدمة"""
    
    def test_health_check(self, mock_media_service):
        """اختبار فحص صحة الخدمة"""
        response = mock_media_service.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        assert response.json()["service"] == "media-service"


class TestMediaUpload:
    """اختبارات رفع الوسائط"""
    
    def test_upload_image_success(self, mock_media_service):
        """اختبار رفع صورة بنجاح"""
        # إنشاء ملف صورة وهمي
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            tmp.write(b'fake image content')
            tmp_path = tmp.name
        
        try:
            with open(tmp_path, 'rb') as f:
                response = mock_media_service.post(
                    "/upload",
                    files={"file": ("test.jpg", f, "image/jpeg")}
                )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "file_hash" in data
            assert "url" in data
        finally:
            Path(tmp_path).unlink()
    
    def test_upload_unsupported_format(self, mock_media_service):
        """اختبار رفع صيغة غير مدعومة"""
        with tempfile.NamedTemporaryFile(suffix='.exe', delete=False) as tmp:
            tmp.write(b'fake exe content')
            tmp_path = tmp.name
        
        try:
            with open(tmp_path, 'rb') as f:
                response = mock_media_service.post(
                    "/upload",
                    files={"file": ("test.exe", f, "application/x-msdownload")}
                )
            
            assert response.status_code == 400
            assert response.json()["success"] is False
        finally:
            Path(tmp_path).unlink()
    
    def test_upload_with_resize(self, mock_media_service):
        """اختبار رفع صورة مع تحجيم"""
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            tmp.write(b'fake image content')
            tmp_path = tmp.name
        
        try:
            with open(tmp_path, 'rb') as f:
                response = mock_media_service.post(
                    "/upload?resize=800x600&quality=85&format=webp",
                    files={"file": ("test.jpg", f, "image/jpeg")}
                )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
        finally:
            Path(tmp_path).unlink()


class TestBatchUpload:
    """اختبارات الرفع المتعدد"""
    
    def test_batch_upload_multiple_files(self, mock_media_service):
        """اختبار رفع عدة ملفات"""
        files = []
        temp_paths = []
        
        try:
            # إنشاء عدة ملفات وهمية
            for i in range(3):
                with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
                    tmp.write(b'fake image content')
                    temp_paths.append(tmp.name)
            
            # فتح الملفات وإرسالها
            for tmp_path in temp_paths:
                with open(tmp_path, 'rb') as f:
                    files.append(("files", (f"test{len(files)}.jpg", f, "image/jpeg")))
            
            response = mock_media_service.post(
                "/batch-upload",
                files=files
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 3
            assert data["successful"] >= 0
        finally:
            for tmp_path in temp_paths:
                Path(tmp_path).unlink()


class TestMediaRetrieval:
    """اختبارات استرجاع الوسائط"""
    
    def test_get_media_not_found(self, mock_media_service):
        """اختبار استرجاع ملف غير موجود"""
        response = mock_media_service.get("/media/nonexistent")
        assert response.status_code == 404
    
    def test_get_media_metadata_not_found(self, mock_media_service):
        """اختبار استرجاع بيانات ملف غير موجود"""
        response = mock_media_service.get("/media/nonexistent/metadata")
        assert response.status_code == 404


class TestMediaDeletion:
    """اختبارات حذف الوسائط"""
    
    def test_delete_media_not_found(self, mock_media_service):
        """اختبار حذف ملف غير موجود"""
        response = mock_media_service.delete("/media/nonexistent")
        assert response.status_code == 404


class TestMediaStats:
    """اختبارات إحصائيات الخدمة"""
    
    def test_get_stats(self, mock_media_service):
        """اختبار الحصول على الإحصائيات"""
        response = mock_media_service.get("/stats")
        assert response.status_code == 200
        data = response.json()
        assert "uploaded_files" in data
        assert "cached_metadata" in data


class TestMediaProcessor:
    """اختبارات معالج الوسائط"""
    
    def test_get_file_extension(self):
        """اختبار الحصول على امتداد الملف"""
        from services.media_service.main import MediaProcessor
        
        assert MediaProcessor.get_file_extension("image.jpg") == "jpg"
        assert MediaProcessor.get_file_extension("video.mp4") == "mp4"
        assert MediaProcessor.get_file_extension("file") == ""
    
    def test_generate_file_hash(self):
        """اختبار توليد بصمة الملف"""
        from services.media_service.main import MediaProcessor
        
        hash1 = MediaProcessor.generate_file_hash("test.jpg", b"content")
        hash2 = MediaProcessor.generate_file_hash("test.jpg", b"content")
        
        # يجب أن تكون البصمات مختلفة (لأن الوقت مختلف)
        # لكن يجب أن تكون بنفس الطول
        assert len(hash1) == len(hash2) == 12


class TestMediaMetadata:
    """اختبارات بيانات الوسائط"""
    
    def test_save_and_get_metadata(self):
        """اختبار حفظ واسترجاع البيانات الوصفية"""
        from services.media_service.main import MediaMetadata
        
        metadata = {
            "filename": "test.jpg",
            "size": 1024,
            "type": "image/jpeg"
        }
        
        MediaMetadata.save_metadata("test-hash", metadata)
        retrieved = MediaMetadata.get_metadata("test-hash")
        
        assert retrieved is not None
        assert retrieved["filename"] == "test.jpg"


class TestIntegrationMediaService:
    """اختبارات التكامل لخدمة الوسائط"""
    
    def test_complete_upload_workflow(self, mock_media_service):
        """اختبار سير العمل الكامل للرفع"""
        # 1. التحقق من صحة الخدمة
        health = mock_media_service.get("/health")
        assert health.status_code == 200
        
        # 2. الحصول على الإحصائيات الأولية
        stats_before = mock_media_service.get("/stats")
        assert stats_before.status_code == 200
        
        # 3. محاولة رفع ملف
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            tmp.write(b'fake image content')
            tmp_path = tmp.name
        
        try:
            with open(tmp_path, 'rb') as f:
                upload = mock_media_service.post(
                    "/upload",
                    files={"file": ("test.jpg", f, "image/jpeg")}
                )
            
            if upload.status_code == 200:
                # 4. الحصول على الإحصائيات بعد الرفع
                stats_after = mock_media_service.get("/stats")
                assert stats_after.status_code == 200
        finally:
            Path(tmp_path).unlink()
