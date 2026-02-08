#!/bin/sh

set -e

# Enable debug output only when DEBUG is set
if [ "${DEBUG:-false}" = "true" ]; then
  set -x
fi

rm -rf /app/tmp/pids/server.pid
rm -rf /app/tmp/cache/vite-dev 2>/dev/null || true

# Only install if lockfile changed or node_modules is missing
if [ ! -d /app/node_modules/.pnpm ] || [ /app/pnpm-lock.yaml -nt /app/node_modules/.pnpm-lock-hash ]; then
  echo "Dependencies changed, running pnpm install..."
  pnpm install --frozen-lockfile || pnpm install
  cp /app/pnpm-lock.yaml /app/node_modules/.pnpm-lock-hash 2>/dev/null || true
else
  echo "Dependencies up to date, skipping install."
fi

echo "Ready to run Vite development server."

exec "$@"
