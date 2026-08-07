from __future__ import annotations

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

import app.models  # noqa: F401
from app.core.config import settings
from app.db.base import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# v89.50 fix: نستخدم resolve_database_url() الذي يجرّب Internal أولاً ثم يقع
# تلقائياً على External + sslmode=require عند فشل DNS لروابط Render الداخلية.
# هذا يضمن أن alembic يعمل من أي بيئة (داخل Render أو خارجه).
try:
    from app.db.url_resolver import resolve_database_url
    _alembic_db_url = resolve_database_url()
except Exception:
    _alembic_db_url = getattr(settings, 'effective_database_url', None) or settings.DATABASE_URL
config.set_main_option('sqlalchemy.url', _alembic_db_url)
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option('sqlalchemy.url')
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={'paramstyle': 'named'},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix='sqlalchemy.',
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
