from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from app.db.base import Base


def _add_column_if_missing(engine: Engine, table_name: str, column_name: str, column_definition: str) -> None:
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    if table_name not in table_names:
        return

    existing_columns = {column['name'] for column in inspector.get_columns(table_name)}
    if column_name in existing_columns:
        return

    with engine.begin() as connection:
        connection.execute(text(f'ALTER TABLE {table_name} ADD COLUMN {column_definition}'))


def initialize_database(engine: Engine) -> None:
    Base.metadata.create_all(bind=engine)
    _add_column_if_missing(engine, 'users', 'followers_count', 'followers_count INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'users', 'following_count', 'following_count INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'users', 'fcm_token', 'fcm_token VARCHAR(1024)')
