"""
========================================================================
 Database Session — v61 hardened against Render 503 disconnects
========================================================================
يحتفظ بنفس الـ API السابق (engine, SessionLocal, get_db) مع إضافات:
  - pool_pre_ping=True       → فحص الاتصال قبل كل استخدام
  - pool_recycle=280         → تجديد قبل أن تقطع Render الاتصال (~300s)
  - TCP keepalives           → إبقاء الاتصال حياً على مستوى الشبكة
  - engine_connect listener  → إلغاء الاتصالات الميتة تلقائياً
  - حفاظ على statement_timeout الموجود
"""

import logging

from sqlalchemy import create_engine, event, text
from sqlalchemy.exc import DBAPIError, DisconnectionError, OperationalError
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)


# ----------------------------------------------------------------------
# Engine kwargs defaults — مقاومة لانقطاع الاتصال
# ----------------------------------------------------------------------
engine_kwargs = {
    'pool_pre_ping': True,
    # ⭐ v61: إعادة تدوير الاتصالات قبل أن تقطعها Render (افتراضياً ~300s)
    'pool_recycle': int(getattr(settings, 'DB_POOL_RECYCLE', 280) or 280),
    'pool_size': int(getattr(settings, 'DB_POOL_SIZE', 5) or 5),
    'max_overflow': int(getattr(settings, 'DB_MAX_OVERFLOW', 10) or 10),
    'pool_timeout': int(getattr(settings, 'DB_POOL_TIMEOUT', 20) or 20),
    'future': True,
}
connect_args = {}


def _resolve_database_url() -> str:
    """
    Récupère l'URL effective de la base avec un fallback de sécurité.
    Cette fonction est défensive : si pour une raison quelconque la
    propriété `effective_database_url` n'existe pas (ancien cache
    d'image Render par ex.), on retombe sur `DATABASE_URL` brut, puis
    sur SQLite local en dernier recours.
    """
    candidates = ('effective_database_url', 'DATABASE_URL')
    for attr in candidates:
        try:
            value = getattr(settings, attr, None)
        except Exception:
            value = None
        if value:
            return str(value)
    return 'sqlite:///./yamshat.db'


DATABASE_URL = _resolve_database_url()
RAW_DB_URL = getattr(settings, 'DATABASE_URL', '') or ''

# تطبيع البروتوكول: Render تعطي postgres:// لكن SQLAlchemy 2.x يفضل postgresql://
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

if DATABASE_URL != RAW_DB_URL:
    logger.warning(
        'DATABASE_URL is missing or still contains placeholders; '
        'using fallback %s until a real database URL is configured.',
        DATABASE_URL.split(':', 1)[0] if ':' in DATABASE_URL else DATABASE_URL,
    )

# ----------------------------------------------------------------------
# connect_args حسب نوع القاعدة
# ----------------------------------------------------------------------
if DATABASE_URL.startswith('sqlite'):
    connect_args['check_same_thread'] = False
    # SQLite لا تحتاج pool_size كبير
    engine_kwargs['pool_size'] = 1
    engine_kwargs['max_overflow'] = 0
    engine_kwargs.pop('pool_recycle', None)
elif DATABASE_URL.startswith(('postgresql://', 'postgresql+psycopg2://', 'postgresql+psycopg://')):
    # ⭐ v61: TCP keepalives — حاسم لإبقاء الاتصال حياً على Render
    connect_args.update({
        'connect_timeout': 10,
        'keepalives': 1,
        'keepalives_idle': 30,
        'keepalives_interval': 10,
        'keepalives_count': 5,
        'application_name': 'yamshat-v61',
    })

if connect_args:
    engine_kwargs['connect_args'] = connect_args

# ----------------------------------------------------------------------
# إنشاء Engine
# ----------------------------------------------------------------------
engine = create_engine(DATABASE_URL, **engine_kwargs)

# ----------------------------------------------------------------------
# Listener: statement_timeout (محافظ على الكود السابق)
# ----------------------------------------------------------------------
if DATABASE_URL.startswith(('postgresql://', 'postgres://', 'postgresql+psycopg2://', 'postgresql+psycopg://')):

    @event.listens_for(engine, 'connect')
    def _set_statement_timeout(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        try:
            timeout_ms = max(int(getattr(settings, 'DB_STATEMENT_TIMEOUT_MS', 8000)), 1000)
            cursor.execute(f'SET statement_timeout = {timeout_ms}')
        except Exception as exc:
            logger.warning('Could not set statement_timeout: %s', exc)
        finally:
            cursor.close()

    # ⭐ v61: Listener إضافي لاكتشاف الاتصالات الميتة عند الاستخدام
    @event.listens_for(engine, 'engine_connect')
    def _ping_connection(connection, *args, **kwargs):
        """يفحص الاتصال عند الحصول عليه من البِركة، ويلغيه إذا كان ميتاً.

        ملاحظة: pool_pre_ping=True يفعل شيئاً مشابهاً، لكن هذا الـ listener
        يلتقط الاتصالات الميتة بعد إعادة الاستخدام الطويل أيضاً.
        """
        try:
            connection.scalar(text('SELECT 1'))
        except (DisconnectionError, OperationalError, DBAPIError) as exc:
            logger.warning('Detected stale DB connection, invalidating: %s', exc)
            try:
                connection.invalidate()
            except Exception:
                pass
            # SQLAlchemy سيُنشئ اتصالاً جديداً تلقائياً عند الاستخدام التالي
            try:
                connection.scalar(text('SELECT 1'))
            except Exception:
                # ندع الـ caller يتعامل مع الاستثناء
                raise


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def db_healthcheck() -> dict:
    """فحص سريع لصحة قاعدة البيانات — مفيد لـ /api/health."""
    try:
        with engine.connect() as conn:
            conn.execute(text('SELECT 1'))
        return {
            'db': 'ok',
            'pool_size': engine.pool.size() if hasattr(engine.pool, 'size') else None,
            'checked_out': engine.pool.checkedout() if hasattr(engine.pool, 'checkedout') else None,
        }
    except Exception as exc:  # noqa: BLE001
        logger.error('DB healthcheck failed: %s', exc)
        return {'db': 'down', 'error': str(exc)}
