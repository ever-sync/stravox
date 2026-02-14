#!/bin/sh

set -e

# Enable debug output only when DEBUG is set
if [ "${DEBUG:-false}" = "true" ]; then
  set -x
fi

# Remove a potentially pre-existing server.pid for Rails.
rm -rf /app/tmp/pids/server.pid
rm -rf /app/tmp/cache/*

# Restore compiled assets (Vite manifest + JS/CSS) when /app/public is a volume mount.
# The Docker volume overwrites /app/public from the image, so we restore from backup.
if [ -d "/app/public-assets-backup/vite" ]; then
  echo "Restoring compiled Vite assets to /app/public..."
  cp -rf /app/public-assets-backup/vite /app/public/vite
  cp -rf /app/public-assets-backup/assets /app/public/assets 2>/dev/null || true
  echo "Vite assets restored."
fi

echo "Waiting for postgres to become ready...."

# Let DATABASE_URL env take presedence over individual connection params.
# This is done to avoid printing the DATABASE_URL in the logs
$(docker/entrypoints/helpers/pg_database_url.rb)
PG_READY="pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USERNAME"

MAX_RETRIES=30
RETRY_COUNT=0
until $PG_READY || [ $RETRY_COUNT -ge $MAX_RETRIES ]
do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Waiting for postgres... attempt $RETRY_COUNT/$MAX_RETRIES"
  sleep 2;
done

if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
  echo "ERROR: PostgreSQL did not become ready after $MAX_RETRIES attempts. Exiting."
  exit 1
fi

echo "Database ready to accept connections."

#install missing gems for local dev as we are using base image compiled for production
if ! bundle check > /dev/null 2>&1; then
  echo "Installing missing gems..."
  bundle install
fi

BUNDLE="bundle check"

MAX_RETRIES=15
RETRY_COUNT=0
until $BUNDLE || [ $RETRY_COUNT -ge $MAX_RETRIES ]
do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Waiting for bundle... attempt $RETRY_COUNT/$MAX_RETRIES"
  sleep 2;
done

if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
  echo "ERROR: Bundle check failed after $MAX_RETRIES attempts. Exiting."
  exit 1
fi

# Execute the main process of the container
exec "$@"
