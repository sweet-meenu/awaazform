#!/usr/bin/env bash
# Rebuilds frontend/ (the ready-to-serve site: plain HTML, CSS and JavaScript) from the source in apps/web.
# Only needed after changing the UI; running AwaazForm needs just Python (see README).
# Needs Node 22+ and pnpm: corepack enable && pnpm install
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
pnpm --filter web build
rm -rf frontend
cp -r apps/web/out frontend
echo "frontend/ rebuilt ($(du -sh frontend | cut -f1)). Commit it."
