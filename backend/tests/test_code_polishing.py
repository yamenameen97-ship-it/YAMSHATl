"""
اختبارات الصقل والتحسينات
"""

import pytest
from app.core.code_polishing import (
    ErrorHandler,
    InputValidator,
    DataSanitizer,
    ResponseFormatter,
    PerformanceMonitor
)


class TestErrorHandler:
    """اختبارات معالج الأخطاء"""
    
    def test_handle_database_error(self):
        """اختبار معالجة أخطاء قاعدة البيانات"""
        error = Exception("Connection failed")
        result = ErrorHandler.handle_database_error(error)
        
        assert result["success"] is False
        assert result["error_code"] == "DB_ERROR"
        assert "timestamp" in result
    
    def test_handle_validation_error(self):
        """اختبار معالجة أخطاء التحقق"""
        error = Exception("Invalid email format")
        result = ErrorHandler.handle_validation_error(error)
        
        assert result["success"] is False
        assert result["error_code"] == "VALIDATION_ERROR"
        assert "details" in result
    
    def test_handle_auth_error(self):
        """اختبار معالجة أخطاء المصادقة"""
        error = Exception("Invalid credentials")
        result = ErrorHandler.handle_auth_error(error)
        
        assert result["success"] is False
        assert result["error_code"] == "AUTH_ERROR"
    
    def test_handle_permission_error(self):
        """اختبار معالجة أخطاء الأذونات"""
        error = Exception("Access denied")
        result = ErrorHandler.handle_permission_error(error)
        
        assert result["success"] is False
        assert result["error_code"] == "PERMISSION_ERROR"
    
    def test_handle_generic_error(self):
        """اختبار معالجة الأخطاء العامة"""
        error = Exception("Unexpected error")
        result = ErrorHandler.handle_generic_error(error)
        
        assert result["success"] is False
        assert result["error_code"] == "INTERNAL_ERROR"


class TestInputValidator:
    """اختبارات التحقق من المدخلات"""
    
    def test_validate_email_valid(self):
        """اختبار التحقق من بريد إلكتروني صحيح"""
        assert InputValidator.validate_email("user@example.com") is True
        assert InputValidator.validate_email("test.email@domain.co.uk") is True
    
    def test_validate_email_invalid(self):
        """اختبار التحقق من بريد إلكتروني غير صحيح"""
        assert InputValidator.validate_email("invalid.email") is False
        assert InputValidator.validate_email("@example.com") is False
        assert InputValidator.validate_email("user@") is False
    
    def test_validate_phone_valid(self):
        """اختبار التحقق من رقم هاتف صحيح"""
        assert InputValidator.validate_phone("1234567890") is True
        assert InputValidator.validate_phone("+1-234-567-8900") is True
    
    def test_validate_phone_invalid(self):
        """اختبار التحقق من رقم هاتف غير صحيح"""
        assert InputValidator.validate_phone("123") is False
        assert InputValidator.validate_phone("abc") is False
    
    def test_validate_url_valid(self):
        """اختبار التحقق من URL صحيح"""
        assert InputValidator.validate_url("https://example.com") is True
        assert InputValidator.validate_url("http://test.org/path") is True
    
    def test_validate_url_invalid(self):
        """اختبار التحقق من URL غير صحيح"""
        assert InputValidator.validate_url("not a url") is False
        assert InputValidator.validate_url("example.com") is False
    
    def test_validate_password_strength_weak(self):
        """اختبار كلمة مرور ضعيفة"""
        result = InputValidator.validate_password_strength("weak")
        
        assert result["is_strong"] is False
        assert len(result["issues"]) > 0
        assert result["strength_score"] < 100
    
    def test_validate_password_strength_strong(self):
        """اختبار كلمة مرور قوية"""
        result = InputValidator.validate_password_strength("StrongPass123!@#")
        
        assert result["is_strong"] is True
        assert len(result["issues"]) == 0
        assert result["strength_score"] == 100
    
    def test_validate_required_fields_all_present(self):
        """اختبار التحقق من الحقول المطلوبة - جميعها موجودة"""
        data = {"name": "أحمد", "email": "test@example.com"}
        is_valid, missing = InputValidator.validate_required_fields(
            data,
            ["name", "email"]
        )
        
        assert is_valid is True
        assert len(missing) == 0
    
    def test_validate_required_fields_some_missing(self):
        """اختبار التحقق من الحقول المطلوبة - بعضها مفقود"""
        data = {"name": "أحمد"}
        is_valid, missing = InputValidator.validate_required_fields(
            data,
            ["name", "email", "phone"]
        )
        
        assert is_valid is False
        assert "email" in missing
        assert "phone" in missing


class TestDataSanitizer:
    """اختبارات تنظيف البيانات"""
    
    def test_sanitize_string_basic(self):
        """اختبار تنظيف النص الأساسي"""
        result = DataSanitizer.sanitize_string("  hello world  ")
        assert result == "hello world"
    
    def test_sanitize_string_remove_dangerous_chars(self):
        """اختبار إزالة الأحرف الخطرة"""
        result = DataSanitizer.sanitize_string("<script>alert('xss')</script>")
        assert "<" not in result
        assert ">" not in result
    
    def test_sanitize_string_max_length(self):
        """اختبار الحد الأقصى للطول"""
        long_text = "a" * 2000
        result = DataSanitizer.sanitize_string(long_text, max_length=100)
        assert len(result) == 100
    
    def test_sanitize_email(self):
        """اختبار تنظيف البريد الإلكتروني"""
        result = DataSanitizer.sanitize_email("  USER@EXAMPLE.COM  ")
        assert result == "user@example.com"
    
    def test_sanitize_json(self):
        """اختبار تنظيف JSON"""
        data = {
            "name": "  أحمد  ",
            "email": "  TEST@EXAMPLE.COM  ",
            "tags": ["tag1", "  tag2  "]
        }
        
        result = DataSanitizer.sanitize_json(data)
        assert result["name"] == "أحمد"
        assert result["email"] == "test@example.com"
        assert result["tags"][1] == "tag2"


class TestResponseFormatter:
    """اختبارات تنسيق الاستجابات"""
    
    def test_success_response(self):
        """اختبار استجابة ناجحة"""
        result = ResponseFormatter.success_response(
            data={"id": 1, "name": "أحمد"},
            message="تم الحصول على البيانات"
        )
        
        assert result["success"] is True
        assert result["message"] == "تم الحصول على البيانات"
        assert result["data"]["id"] == 1
        assert "timestamp" in result
    
    def test_error_response(self):
        """اختبار استجابة خطأ"""
        result = ResponseFormatter.error_response(
            error="حدث خطأ",
            error_code="ERROR_CODE",
            details="تفاصيل الخطأ"
        )
        
        assert result["success"] is False
        assert result["error"] == "حدث خطأ"
        assert result["error_code"] == "ERROR_CODE"
        assert result["details"] == "تفاصيل الخطأ"
    
    def test_paginated_response(self):
        """اختبار استجابة مع ترقيم"""
        items = [{"id": 1}, {"id": 2}]
        result = ResponseFormatter.paginated_response(
            items=items,
            total=100,
            page=1,
            page_size=2
        )
        
        assert result["success"] is True
        assert len(result["data"]) == 2
        assert result["pagination"]["total"] == 100
        assert result["pagination"]["page"] == 1
        assert result["pagination"]["total_pages"] == 50
        assert result["pagination"]["has_next"] is True
    
    def test_list_response(self):
        """اختبار استجابة قائمة"""
        items = [{"id": 1}, {"id": 2}, {"id": 3}]
        result = ResponseFormatter.list_response(items)
        
        assert result["success"] is True
        assert result["count"] == 3
        assert len(result["data"]) == 3


class TestPerformanceMonitor:
    """اختبارات مراقب الأداء"""
    
    def test_record_metric(self):
        """اختبار تسجيل مقياس"""
        monitor = PerformanceMonitor()
        monitor.record_metric("api_call", 150.5, "ms")
        
        assert "api_call" in monitor.metrics
        assert len(monitor.metrics["api_call"]) == 1
        assert monitor.metrics["api_call"][0]["value"] == 150.5
    
    def test_get_metrics_summary(self):
        """اختبار الحصول على ملخص المقاييس"""
        monitor = PerformanceMonitor()
        monitor.record_metric("response_time", 100, "ms")
        monitor.record_metric("response_time", 200, "ms")
        monitor.record_metric("response_time", 300, "ms")
        
        summary = monitor.get_metrics_summary()
        
        assert "response_time" in summary
        assert summary["response_time"]["count"] == 3
        assert summary["response_time"]["min"] == 100
        assert summary["response_time"]["max"] == 300
        assert summary["response_time"]["avg"] == 200
    
    def test_clear_metrics(self):
        """اختبار مسح المقاييس"""
        monitor = PerformanceMonitor()
        monitor.record_metric("test", 100, "ms")
        
        assert len(monitor.metrics) > 0
        
        monitor.clear_metrics()
        
        assert len(monitor.metrics) == 0


class TestIntegrationPolishing:
    """اختبارات التكامل للصقل والتحسينات"""
    
    def test_complete_validation_workflow(self):
        """اختبار سير العمل الكامل للتحقق"""
        # 1. التحقق من البريد الإلكتروني
        email = "user@example.com"
        assert InputValidator.validate_email(email) is True
        
        # 2. تنظيف البريد
        sanitized_email = DataSanitizer.sanitize_email(email)
        assert sanitized_email == "user@example.com"
        
        # 3. إرجاع استجابة ناجحة
        response = ResponseFormatter.success_response(
            data={"email": sanitized_email},
            message="تم التحقق بنجاح"
        )
        
        assert response["success"] is True
        assert response["data"]["email"] == sanitized_email
    
    def test_error_handling_workflow(self):
        """اختبار سير العمل لمعالجة الأخطاء"""
        # 1. محاكاة خطأ
        try:
            raise ValueError("Invalid input")
        except ValueError as e:
            # 2. معالجة الخطأ
            error_response = ErrorHandler.handle_validation_error(e)
            
            # 3. التحقق من الاستجابة
            assert error_response["success"] is False
            assert error_response["error_code"] == "VALIDATION_ERROR"
