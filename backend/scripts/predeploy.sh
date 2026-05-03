#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

python - <<'PY'
import os
import sys
from sqlalchemy import create_engine, inspect, text


def normalize(url: str) -> str:
    value = (url or '').strip()
    if value.startswith('postgres://'):
        return value.replace('postgres://', 'postgresql://', 1)
    return value


url = normalize(os.getenv('DATABASE_URL', ''))
if not url:
    print('DATABASE_URL is not set', file=sys.stderr)
    sys.exit(1)

engine = create_engine(url, pool_pre_ping=True)
inspector = inspect(engine)
existing_tables = set(inspector.get_table_names())
known_tables = {
    'app_settings',
    'audit_logs',
    'users',
    'posts',
    'comments',
    'follows',
    'likes',
    'messages',
    'notifications',
}

if 'alembic_version' in existing_tables:
    print('Alembic version table detected; migrations can run normally.')
    sys.exit(0)

if existing_tables & known_tables:
    with engine.begin() as conn:
        conn.execute(text('CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) NOT NULL PRIMARY KEY)'))
        conn.execute(text('DELETE FROM alembic_version'))
        conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('20260503_0001')"))
    print('Existing schema detected without alembic_version; stamped current revision before deploy.')
else:
    print('Fresh database detected; running migrations from scratch.')
PY

alembic upgrade head
