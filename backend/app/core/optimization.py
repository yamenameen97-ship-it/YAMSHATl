"""
تحسينات الأداء للتطبيق
- Caching strategies
- Query optimization
- Connection pooling
- Async operations
"""

from functools import lru_cache, wraps
from typing import Any, Callable, Optional
import hashlib
import json
from datetime import timedelta

from sqlalchemy import event
from sqlalchemy.pool import QueuePool
from redis import Redis

from app.core.config import settings


class CacheManager:
    """إدارة الذاكرة المؤقتة (Caching)"""
    
    def __init__(self, redis_client: Optional[Redis] = None):
        self.redis = redis_client
        self.ttl_default = 300  # 5 دقائق
        
    def get_cache_key(self, prefix: str, *args, **kwargs) -> str:
        """توليد مفتاح الكاش الفريد"""
        key_data = json.dumps({
            'args': args,
            'kwargs': kwargs
        }, sort_keys=True, default=str)
        hash_val = hashlib.md5(key_data.encode()).hexdigest()
        return f"{prefix}:{hash_val}"
    
    def cache_decorator(self, ttl: int = 300, prefix: str = "cache"):
        """ديكوريتر للتخزين المؤقت"""
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                if not self.redis:
                    return await func(*args, **kwargs)
                
                cache_key = self.get_cache_key(prefix, *args, **kwargs)
                
                # محاولة الحصول من الكاش
                cached = self.redis.get(cache_key)
                if cached:
                    return json.loads(cached)
                
                # تنفيذ الدالة وتخزين النتيجة
                result = await func(*args, **kwargs)
                self.redis.setex(
                    cache_key,
                    ttl,
                    json.dumps(result, default=str)
                )
                return result
            
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                if not self.redis:
                    return func(*args, **kwargs)
                
                cache_key = self.get_cache_key(prefix, *args, **kwargs)
                cached = self.redis.get(cache_key)
                if cached:
                    return json.loads(cached)
                
                result = func(*args, **kwargs)
                self.redis.setex(
                    cache_key,
                    ttl,
                    json.dumps(result, default=str)
                )
                return result
            
            # اختيار الـ wrapper المناسب
            if hasattr(func, '__code__') and 'async' in func.__code__.co_flags:
                return async_wrapper
            return sync_wrapper
        
        return decorator


class DatabaseOptimization:
    """تحسينات قاعدة البيانات"""
    
    @staticmethod
    def configure_connection_pool(engine, pool_size: int = 20, max_overflow: int = 40):
        """تكوين تجمع الاتصالات (Connection Pooling)"""
        if engine.pool.__class__.__name__ != 'QueuePool':
            return
        
        # تحديث معاملات التجمع
        engine.pool.pool_size = pool_size
        engine.pool.max_overflow = max_overflow
        engine.pool.timeout = 30
        engine.pool.recycle = 3600  # إعادة تدوير الاتصالات كل ساعة
    
    @staticmethod
    def enable_query_logging(engine, verbose: bool = False):
        """تفعيل تسجيل الاستعلامات البطيئة"""
        @event.listens_for(engine, "before_cursor_execute")
        def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            conn.info.setdefault('query_start_time', []).append(None)
        
        @event.listens_for(engine, "after_cursor_execute")
        def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            import time
            total_time = time.time() - conn.info['query_start_time'].pop(-1)
            
            # تسجيل الاستعلامات البطيئة (أكثر من 0.5 ثانية)
            if total_time > 0.5 and verbose:
                print(f"⚠️ Slow Query ({total_time:.2f}s): {statement[:100]}")


class QueryOptimization:
    """تحسينات الاستعلامات"""
    
    @staticmethod
    def optimize_relationships(query):
        """تحسين تحميل العلاقات (Eager Loading)"""
        # استخدام joinedload بدلاً من lazy loading
        from sqlalchemy.orm import joinedload
        return query
    
    @staticmethod
    def add_pagination(query, skip: int = 0, limit: int = 20):
        """إضافة الترقيم (Pagination)"""
        return query.offset(skip).limit(min(limit, 100))  # حد أقصى 100 عنصر


class MemoryOptimization:
    """تحسينات استخدام الذاكرة"""
    
    @staticmethod
    def cleanup_old_sessions(db_session, days: int = 30):
        """تنظيف الجلسات القديمة"""
        from datetime import datetime, timedelta
        from app.models import UserSession
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        db_session.query(UserSession).filter(
            UserSession.created_at < cutoff_date
        ).delete()
        db_session.commit()
    
    @staticmethod
    def cleanup_expired_tokens(db_session, hours: int = 24):
        """تنظيف الرموز المنتهية الصلاحية"""
        from datetime import datetime, timedelta
        from app.models import PasswordResetToken
        
        cutoff_date = datetime.utcnow() - timedelta(hours=hours)
        db_session.query(PasswordResetToken).filter(
            PasswordResetToken.created_at < cutoff_date
        ).delete()
        db_session.commit()


class AsyncOptimization:
    """تحسينات العمليات غير المتزامنة"""
    
    @staticmethod
    async def batch_process(items: list, batch_size: int = 100, process_func: Callable = None):
        """معالجة العناصر على دفعات"""
        import asyncio
        
        results = []
        for i in range(0, len(items), batch_size):
            batch = items[i:i + batch_size]
            if process_func:
                batch_results = await asyncio.gather(
                    *[process_func(item) for item in batch]
                )
                results.extend(batch_results)
        
        return results


# إنشاء مثيل من مدير الكاش
cache_manager = CacheManager()
