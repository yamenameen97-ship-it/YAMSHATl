from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine_kwargs = {'pool_pre_ping': True}
connect_args = {}

if settings.DATABASE_URL.startswith('sqlite'):
    connect_args['check_same_thread'] = False

if connect_args:
    engine_kwargs['connect_args'] = connect_args

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

if settings.DATABASE_URL.startswith(('postgresql://', 'postgres://')):
    @event.listens_for(engine, 'connect')
    def _set_statement_timeout(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute(f'SET statement_timeout = {max(int(settings.DB_STATEMENT_TIMEOUT_MS), 1000)}')
        finally:
            cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
