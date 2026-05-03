#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "$PROJECT_ROOT"

export PYTHONPATH="$PROJECT_ROOT:${PYTHONPATH:-}"

if command -v alembic >/dev/null 2>&1; then
  echo "[yamshat] applying database migrations"
  alembic upgrade head
fi

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"

echo "[yamshat] starting api on ${HOST}:${PORT}"
exec uvicorn app.main:app --host "$HOST" --port "$PORT"
