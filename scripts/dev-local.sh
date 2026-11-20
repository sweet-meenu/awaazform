#!/usr/bin/env bash
# Runs AwaazForm locally.
#   scripts/dev-local.sh          # development: API (:8000) + `next dev` (:3000, hot reload, proxies /api)
#   scripts/dev-local.sh --prod   # one server: builds the site as static files, FastAPI serves site + API on :3000
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
trap 'kill 0' EXIT INT TERM

if [[ "${1:-}" == "--prod" ]]; then
  # Serves the committed frontend/; run scripts/build-frontend.sh first if you changed the UI.
  echo "Starting http://localhost:3000 (site + API, one Python server)"
  cd "$root/backend" && exec uv run uvicorn app.main:app --host 127.0.0.1 --port 3000
fi

(cd "$root/backend" && uv run uvicorn app.main:app --host 127.0.0.1 --port 8000) &
until curl -sf http://127.0.0.1:8000/api/health >/dev/null; do sleep 0.5; done
echo "API ready: http://127.0.0.1:8000/api/health"
(cd "$root" && pnpm --filter web dev) &
wait
