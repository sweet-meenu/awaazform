#!/usr/bin/env bash
# Runs the API (FastAPI, :8000) and the web app (Next.js, :3000) together. Ctrl+C stops both.
#   scripts/dev-local.sh          # development (next dev)
#   scripts/dev-local.sh --prod   # production build of the web app (smoother for demos)
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
trap 'kill 0' EXIT INT TERM

(cd "$root/backend" && uv run uvicorn app.main:app --host 127.0.0.1 --port 8000) &
until curl -sf http://127.0.0.1:8000/api/health >/dev/null; do sleep 0.5; done
echo "API ready: http://127.0.0.1:8000/api/health"

if [[ "${1:-}" == "--prod" ]]; then
  (cd "$root" && pnpm --filter web build && pnpm --filter web start) &
else
  (cd "$root" && pnpm --filter web dev) &
fi
wait
