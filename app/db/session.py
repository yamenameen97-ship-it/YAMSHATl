import logging
import os
import re

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.core.config import normalize_database_url, settings

logger = logging.getLogger(__name__)

engine_kwargs = {
    'pool_pre_ping': True,
    # v85.2 fix: pool_recycle مهم لـ Render Postgres — الخادم يقطع
    # الاتصالات الخاملة بعد فترة قصيرة، وبدون recycle نحصل على
    # "server closed the connection unexpectedly".
    'pool_recycle': 280,
}
connect_args = {}


def _mask_url_for_log(url: str) -> str:
    """إخفاء كلمة المرور عند طباعة الرابط في السجلات."""
    try:
        return re.sub(r'(://[^:]+:)[^@]+(@)', r'\1***\2', url)
    except Exception:
        return url.split('@', 1)[-1] if '@' in url else url


def _resolve_database_url() -> str:
    """
    v85.2 — استخراج رابط قاعدة البيانات مع تطبيع صارم:
      • أولاً effective_database_url من Settings (بعد normalize).
      • ثم DATABASE_URL من Settings (raw) → يتم normalize يدوياً.
      • ثم متغير البيئة مباشرة (احتياط لكسر أي كاش قديم على Render).
      • أخيراً SQLite محلي.
    هذا يضمن أن أي تغيير في متغير البيئة على Render يُلتقط فوراً حتى لو
    كانت هناك نسخة قديمة من Settings في الذاكرة.
    """
    candidates = (
        getattr(settings, 'effective_database_url', None),
        getattr(settings, 'DATABASE_URL', None),
        os.getenv('DATABASE_URL'),
    )
    for value in candidates:
        if not value:
            continue
        normalized = normalize_database_url(str(value))
        if normalized and not normalized.startswith('sqlite'):
            return normalized
        if normalized:
            return normalized
    return 'sqlite:///./yamshat.db'


DATABASE_URL = _resolve_database_url()
RAW_DB_URL = getattr(settings, 'DATABASE_URL', '') or ''

if DATABASE_URL.startswith('sqlite') and RAW_DB_URL and not RAW_DB_URL.startswith('sqlite'):
    logger.warning(
        'DATABASE_URL est vide ou contient encore des placeholders; '
        'fallback vers SQLite local jusqu\'à ce qu\'une URL réelle soit configurée.'
    )
else:
    logger.info('Database engine will connect to: %s', _mask_url_for_log(DATABASE_URL))

if DATABASE_URL.startswith('sqlite'):
    connect_args['check_same_thread'] = False
elif DATABASE_URL.startswith('postgresql'):
    # v85.2 fix: connect_timeout يتجنب تعليق الخدمة لدقائق إذا كانت قاعدة
    # البيانات نائمة (Render Free tier) — يسمح بمحاولة أسرع مع pool_pre_ping.
    connect_args['connect_timeout'] = 10

if connect_args:
    engine_kwargs['connect_args'] = connect_args

engine = create_engine(DATABASE_URL, **engine_kwargs)

if DATABASE_URL.startswith(('postgresql://', 'postgres://')):
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

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
