#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

python - <<'PY'
from app.core.config import settings

if not settings.database_url_configured:
    print('WARNING: DATABASE_URL is missing or still contains placeholder values. Skipping predeploy DB bootstrap.')
    raise SystemExit(0)

from app.db.bootstrap import initialize_database
from app.db.session import engine

initialize_database(engine, force=True)
print('Database schema prepared and normalized successfully.')
PY

alembic stamp head
