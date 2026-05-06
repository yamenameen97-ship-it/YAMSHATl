#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

python - <<'PY'
from app.db.bootstrap import initialize_database
from app.db.session import engine

initialize_database(engine, force=True)
print('Database schema prepared and normalized successfully.')
PY

alembic stamp head
