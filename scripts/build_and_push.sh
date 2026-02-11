#!/usr/bin/env bash
set -euo pipefail

# Script to build and push the custom Chatwoot image to GHCR (or Docker Hub)
# Edit GHCR_USER and GHCR_PAT environment variables or pass them before running.

# REPO_URL="https://github.com/ever-sync/stravox.git"
# REPO_DIR="stravox"
IMAGE="ghcr.io/ever-sync/stravox:latest"
DOCKERFILE_PATH="docker/Dockerfile"

# Build directly from the current directory (local improvements)
docker build -t "$IMAGE" -f "$DOCKERFILE_PATH" .

# Push to GHCR: set GHCR_USER and GHCR_PAT in environment
if [ -z "${GHCR_USER:-}" ] || [ -z "${GHCR_PAT:-}" ]; then
  echo "Please set GHCR_USER and GHCR_PAT environment variables before running to push to GHCR."
  echo "Example: export GHCR_USER=youruser && export GHCR_PAT=yourtoken"
  exit 1
fi

echo "$GHCR_PAT" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
docker push "$IMAGE"

echo "Image pushed: $IMAGE"
