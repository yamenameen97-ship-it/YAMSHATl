"""
تحسينات الكود والصقل (Code Polishing)
- معالجة الأخطاء
- التسجيل (Logging)
- التحقق من المدخلات
- معالجة الاستثناءات
"""

import logging
from typing import Any, Callable, Optional, Type
from functools import wraps
from datetime import datetime
import traceback
import json

# إعداد السجلات
logger = logging.getLogger(__name__)


class ErrorHandler:
    """معالج الأخطاء الموحد"""
    
    @staticmethod
    def handle_database_error(error: Exception) -> dict:
        """معالجة أخطاء قاعدة البيانات"""
        logger.error(f"Database error: {str(error)}")
        return {
            "success": False,
            "error": "حدث خطأ في قاعدة البيانات",
            "error_code": "DB_ERROR",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def handle_validation_error(error: Exception) -> dict:
        """معالجة أخطاء التحقق من الصحة"""
        logger.warning(f"Validation error: {str(error)}")
        return {
            "success": False,
            "error": "البيانات المدخلة غير صحيحة",
            "error_code": "VALIDATION_ERROR",
            "details": str(error),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def handle_auth_error(error: Exception) -> dict:
        """معالجة أخطاء المصادقة"""
        logger.warning(f"Authentication error: {str(error)}")
        return {
            "success": False,
            "error": "فشل المصادقة",
            "error_code": "AUTH_ERROR",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def handle_permission_error(error: Exception) -> dict:
        """معالجة أخطاء الأذونات"""
        logger.warning(f"Permission error: {str(error)}")
        return {
            "success": False,
            "error": "ليس لديك صلاحية للقيام بهذا الإجراء",
            "error_code": "PERMISSION_ERROR",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def handle_generic_error(error: Exception) -> dict:
        """معالجة الأخطاء العامة"""
        logger.error(f"Unexpected error: {str(error)}\n{traceback.format_exc()}")
        return {
            "success": False,
            "error": "حدث خطأ غير متوقع",
            "error_code": "INTERNAL_ERROR",
            "timestamp": datetime.utcnow().isoformat()
        }


class InputValidator:
    """التحقق من المدخلات"""
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """التحقق من صيغة البريد الإلكتروني"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_phone(phone: str) -> bool:
        """التحقق من صيغة رقم الهاتف"""
        import re
        pattern = r'^\+?1?\d{9,15}$'
        return re.match(pattern, phone.replace('-', '').replace(' ', '')) is not None
    
    @staticmethod
    def validate_url(url: str) -> bool:
        """التحقق من صيغة URL"""
        import re
        pattern = r'^https?://[^\s/$.?#].[^\s]*$'
        return re.match(pattern, url) is not None
    
    @staticmethod
    def validate_password_strength(password: str) -> dict:
        """التحقق من قوة كلمة المرور"""
        issues = []
        
        if len(password) < 8:
            issues.append("يجب أن تكون كلمة المرور 8 أحرف على الأقل")
        
        if not any(c.isupper() for c in password):
            issues.append("يجب أن تحتوي على حرف كبير واحد على الأقل")
        
        if not any(c.islower() for c in password):
            issues.append("يجب أن تحتوي على حرف صغير واحد على الأقل")
        
        if not any(c.isdigit() for c in password):
            issues.append("يجب أن تحتوي على رقم واحد على الأقل")
        
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            issues.append("يجب أن تحتوي على رمز خاص واحد على الأقل")
        
        return {
            "is_strong": len(issues) == 0,
            "issues": issues,
            "strength_score": max(0, 100 - (len(issues) * 20))
        }
    
    @staticmethod
    def validate_required_fields(data: dict, required_fields: list) -> tuple[bool, list]:
        """التحقق من الحقول المطلوبة"""
        missing_fields = []
        
        for field in required_fields:
            if field not in data or data[field] is None or data[field] == "":
                missing_fields.append(field)
        
        return len(missing_fields) == 0, missing_fields


class LoggingDecorator:
    """ديكوريتر للتسجيل التلقائي"""
    
    @staticmethod
    def log_function_call(func: Callable) -> Callable:
        """تسجيل استدعاءات الدوال"""
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            func_name = func.__name__
            logger.info(f"🔵 Calling {func_name} with args={args}, kwargs={kwargs}")
            
            try:
                result = await func(*args, **kwargs)
                logger.info(f"✅ {func_name} completed successfully")
                return result
            except Exception as e:
                logger.error(f"❌ {func_name} failed: {str(e)}")
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            func_name = func.__name__
            logger.info(f"🔵 Calling {func_name} with args={args}, kwargs={kwargs}")
            
            try:
                result = func(*args, **kwargs)
                logger.info(f"✅ {func_name} completed successfully")
                return result
            except Exception as e:
                logger.error(f"❌ {func_name} failed: {str(e)}")
                raise
        
        # اختيار الـ wrapper المناسب
        if hasattr(func, '__code__') and 'async' in func.__code__.co_flags:
            return async_wrapper
        return sync_wrapper
    
    @staticmethod
    def log_api_request(func: Callable) -> Callable:
        """تسجيل طلبات API"""
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = datetime.utcnow()
            
            logger.info(f"📨 API Request: {func.__name__}")
            
            try:
                result = await func(*args, **kwargs)
                duration = (datetime.utcnow() - start_time).total_seconds()
                logger.info(f"📤 API Response: {func.__name__} ({duration:.2f}s)")
                return result
            except Exception as e:
                duration = (datetime.utcnow() - start_time).total_seconds()
                logger.error(f"❌ API Error: {func.__name__} ({duration:.2f}s) - {str(e)}")
                raise
        
        return wrapper


class DataSanitizer:
    """تنظيف البيانات"""
    
    @staticmethod
    def sanitize_string(text: str, max_length: int = 1000) -> str:
        """تنظيف النصوص"""
        if not isinstance(text, str):
            return ""
        
        # إزالة المسافات الزائدة
        text = text.strip()
        
        # تقليص الطول
        if len(text) > max_length:
            text = text[:max_length]
        
        # إزالة الأحرف الخطرة
        dangerous_chars = ['<', '>', '"', "'", '&']
        for char in dangerous_chars:
            text = text.replace(char, '')
        
        return text
    
    @staticmethod
    def sanitize_email(email: str) -> str:
        """تنظيف البريد الإلكتروني"""
        if not isinstance(email, str):
            return ""
        
        email = email.strip().lower()
        
        # إزالة المسافات
        email = email.replace(" ", "")
        
        return email
    
    @staticmethod
    def sanitize_json(data: dict) -> dict:
        """تنظيف بيانات JSON"""
        sanitized = {}
        
        for key, value in data.items():
            if isinstance(value, str):
                sanitized[key] = DataSanitizer.sanitize_string(value)
            elif isinstance(value, dict):
                sanitized[key] = DataSanitizer.sanitize_json(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    DataSanitizer.sanitize_string(item) if isinstance(item, str) else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        
        return sanitized


class ResponseFormatter:
    """تنسيق الاستجابات"""
    
    @staticmethod
    def success_response(data: Any = None, message: str = "نجح") -> dict:
        """استجابة ناجحة"""
        return {
            "success": True,
            "message": message,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def error_response(error: str, error_code: str = "ERROR", details: Any = None) -> dict:
        """استجابة خطأ"""
        return {
            "success": False,
            "error": error,
            "error_code": error_code,
            "details": details,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def paginated_response(items: list, total: int, page: int, page_size: int) -> dict:
        """استجابة مع ترقيم"""
        total_pages = (total + page_size - 1) // page_size
        
        return {
            "success": True,
            "data": items,
            "pagination": {
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def list_response(items: list, count: int = None) -> dict:
        """استجابة قائمة"""
        return {
            "success": True,
            "data": items,
            "count": count or len(items),
            "timestamp": datetime.utcnow().isoformat()
        }


class PerformanceMonitor:
    """مراقب الأداء"""
    
    def __init__(self):
        self.metrics = {}
    
    def record_metric(self, name: str, value: float, unit: str = "ms"):
        """تسجيل مقياس أداء"""
        if name not in self.metrics:
            self.metrics[name] = []
        
        self.metrics[name].append({
            "value": value,
            "unit": unit,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    def get_metrics_summary(self) -> dict:
        """الحصول على ملخص المقاييس"""
        summary = {}
        
        for name, values in self.metrics.items():
            numbers = [v["value"] for v in values]
            summary[name] = {
                "count": len(numbers),
                "min": min(numbers),
                "max": max(numbers),
                "avg": sum(numbers) / len(numbers),
                "unit": values[0]["unit"] if values else "unknown"
            }
        
        return summary
    
    def clear_metrics(self):
        """مسح المقاييس"""
        self.metrics = {}


# إنشاء مثيلات عامة
error_handler = ErrorHandler()
input_validator = InputValidator()
data_sanitizer = DataSanitizer()
response_formatter = ResponseFormatter()
performance_monitor = PerformanceMonitor()
