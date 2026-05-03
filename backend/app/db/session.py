from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine_kwargs = {'pool_pre_ping': True}
connect_args = {}

if settings.DATABASE_URL.startswith('sqlite'):
    connect_args['check_same_thread'] = False

if connect_args:
    engine_kwargs['connect_args'] = connect_args

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
