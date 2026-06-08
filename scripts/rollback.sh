#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

APP_DIR="${APP_DIR:-/opt/kamka-todo}"
REGISTRY="${REGISTRY:-ghcr.io}"
IMAGE_PREFIX="${IMAGE_PREFIX:-your_org/kamka-todo}"
TARGET_TAG="${1:-}"

log() { echo "[$(date '+%H:%M:%S')] $*"; }
die() { echo "ERROR: $*" >&2; exit 1; }

cd "$APP_DIR"

if [[ -z "$TARGET_TAG" ]]; then
  TARGET_TAG="sha-$(git log --format='%h' -n 2 | tail -1)"
  log "No tag given — rolling back to: $TARGET_TAG"
else
  log "Rolling back to: $TARGET_TAG"
fi

API_IMAGE="$REGISTRY/$IMAGE_PREFIX-api:$TARGET_TAG"
FE_IMAGE="$REGISTRY/$IMAGE_PREFIX-frontend:$TARGET_TAG"

docker pull "$API_IMAGE"      || die "Failed to pull $API_IMAGE"
docker pull "$FE_IMAGE"       || die "Failed to pull $FE_IMAGE"

docker tag "$API_IMAGE" "$REGISTRY/$IMAGE_PREFIX-api:latest"
docker tag "$FE_IMAGE"  "$REGISTRY/$IMAGE_PREFIX-frontend:latest"

docker compose up -d --no-build api frontend
sleep 5

docker compose exec -T api wget -qO- http://localhost:4000/health &>/dev/null \
  || die "API did not come up after rollback — check: docker compose logs api"

log "Rollback to $TARGET_TAG successful"
