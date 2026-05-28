import logging

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

engine_kwargs = {'pool_pre_ping': True}
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

if DATABASE_URL != RAW_DB_URL:
    logger.warning(
        'DATABASE_URL is missing or still contains placeholders; '
        'using fallback %s until a real database URL is configured.',
        DATABASE_URL.split(':', 1)[0] if ':' in DATABASE_URL else DATABASE_URL,
    )

if DATABASE_URL.startswith('sqlite'):
    connect_args['check_same_thread'] = False

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
