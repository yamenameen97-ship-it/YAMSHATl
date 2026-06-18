"""
اختبارات تحسينات الأداء والتحسينات
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta

from app.core.optimization import (
    CacheManager,
    DatabaseOptimization,
    QueryOptimization,
    MemoryOptimization,
    AsyncOptimization
)


class TestCacheManager:
    """اختبارات مدير الكاش"""
    
    def test_cache_initialization(self):
        """اختبار تهيئة مدير الكاش"""
        cache = CacheManager()
        assert cache.redis is None
        assert cache.ttl_default == 300
    
    def test_get_cache_key(self):
        """اختبار توليد مفتاح الكاش"""
        cache = CacheManager()
        key1 = cache.get_cache_key("user", 1, {"name": "test"})
        key2 = cache.get_cache_key("user", 1, {"name": "test"})
        
        assert key1 == key2
        assert "user:" in key1
    
    def test_cache_decorator_with_sync_function(self):
        """اختبار ديكوريتر الكاش مع دالة متزامنة"""
        cache = CacheManager(redis_client=None)
        
        call_count = 0
        
        @cache.cache_decorator(ttl=300, prefix="test")
        def test_func(x):
            nonlocal call_count
            call_count += 1
            return x * 2
        
        # الاستدعاء الأول
        result1 = test_func(5)
        assert result1 == 10
        assert call_count == 1
        
        # الاستدعاء الثاني (بدون كاش)
        result2 = test_func(5)
        assert result2 == 10
        assert call_count == 2  # تم استدعاء الدالة مرة أخرى


class TestDatabaseOptimization:
    """اختبارات تحسينات قاعدة البيانات"""
    
    def test_configure_connection_pool(self):
        """اختبار تكوين تجمع الاتصالات"""
        mock_engine = Mock()
        mock_engine.pool = Mock()
        mock_engine.pool.__class__.__name__ = 'QueuePool'
        
        DatabaseOptimization.configure_connection_pool(mock_engine, pool_size=30, max_overflow=50)
        
        assert mock_engine.pool.pool_size == 30
        assert mock_engine.pool.max_overflow == 50
        assert mock_engine.pool.timeout == 30
        assert mock_engine.pool.recycle == 3600
    
    def test_enable_query_logging(self):
        """اختبار تفعيل تسجيل الاستعلامات"""
        mock_engine = Mock()
        
        # يجب ألا ترفع الدالة أي استثناء
        try:
            DatabaseOptimization.enable_query_logging(mock_engine, verbose=False)
        except Exception as e:
            pytest.fail(f"enable_query_logging raised {type(e).__name__}: {e}")


class TestQueryOptimization:
    """اختبارات تحسينات الاستعلامات"""
    
    def test_add_pagination(self):
        """اختبار إضافة الترقيم"""
        mock_query = Mock()
        mock_query.offset.return_value = mock_query
        mock_query.limit.return_value = mock_query
        
        result = QueryOptimization.add_pagination(mock_query, skip=0, limit=20)
        
        mock_query.offset.assert_called_once_with(0)
        mock_query.limit.assert_called_once_with(20)
    
    def test_pagination_max_limit(self):
        """اختبار الحد الأقصى للترقيم"""
        mock_query = Mock()
        mock_query.offset.return_value = mock_query
        mock_query.limit.return_value = mock_query
        
        QueryOptimization.add_pagination(mock_query, skip=0, limit=200)
        
        # يجب أن يكون الحد الأقصى 100
        mock_query.limit.assert_called_once_with(100)


class TestMemoryOptimization:
    """اختبارات تحسينات الذاكرة"""
    
    def test_cleanup_old_sessions(self):
        """اختبار تنظيف الجلسات القديمة"""
        mock_session = Mock()
        mock_query = Mock()
        mock_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        
        # يجب ألا ترفع الدالة أي استثناء
        try:
            MemoryOptimization.cleanup_old_sessions(mock_session, days=30)
        except Exception as e:
            pytest.fail(f"cleanup_old_sessions raised {type(e).__name__}: {e}")
    
    def test_cleanup_expired_tokens(self):
        """اختبار تنظيف الرموز المنتهية الصلاحية"""
        mock_session = Mock()
        mock_query = Mock()
        mock_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        
        try:
            MemoryOptimization.cleanup_expired_tokens(mock_session, hours=24)
        except Exception as e:
            pytest.fail(f"cleanup_expired_tokens raised {type(e).__name__}: {e}")


class TestAsyncOptimization:
    """اختبارات تحسينات العمليات غير المتزامنة"""
    
    @pytest.mark.asyncio
    async def test_batch_process(self):
        """اختبار معالجة العناصر على دفعات"""
        items = list(range(250))
        
        async def mock_process(item):
            await asyncio.sleep(0.001)
            return item * 2
        
        result = await AsyncOptimization.batch_process(
            items,
            batch_size=100,
            process_func=mock_process
        )
        
        assert len(result) == 250
        assert result[0] == 0
        assert result[100] == 200
    
    @pytest.mark.asyncio
    async def test_batch_process_empty_list(self):
        """اختبار معالجة قائمة فارغة"""
        items = []
        
        async def mock_process(item):
            return item
        
        result = await AsyncOptimization.batch_process(
            items,
            batch_size=100,
            process_func=mock_process
        )
        
        assert result == []


class TestPerformanceMetrics:
    """اختبارات قياس الأداء"""
    
    def test_performance_measurement(self):
        """اختبار قياس الأداء"""
        cache = CacheManager()
        
        perf = cache.cache_decorator(ttl=300, prefix="perf_test")
        
        @perf
        def slow_function(x):
            import time
            time.sleep(0.01)
            return x * 2
        
        result = slow_function(5)
        assert result == 10


class TestCacheExpiration:
    """اختبارات انتهاء صلاحية الكاش"""
    
    def test_cache_key_generation_uniqueness(self):
        """اختبار فرادة مفاتيح الكاش"""
        cache = CacheManager()
        
        keys = set()
        for i in range(100):
            key = cache.get_cache_key("test", i)
            keys.add(key)
        
        # يجب أن تكون جميع المفاتيح فريدة
        assert len(keys) == 100


class TestIntegration:
    """اختبارات التكامل"""
    
    def test_optimization_modules_import(self):
        """اختبار استيراد وحدات التحسين"""
        from app.core.optimization import (
            CacheManager,
            DatabaseOptimization,
            QueryOptimization,
            MemoryOptimization,
            AsyncOptimization,
            cache_manager
        )
        
        assert CacheManager is not None
        assert DatabaseOptimization is not None
        assert QueryOptimization is not None
        assert MemoryOptimization is not None
        assert AsyncOptimization is not None
        assert cache_manager is not None
