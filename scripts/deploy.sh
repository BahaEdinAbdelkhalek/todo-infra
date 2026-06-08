#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

APP_DIR="${APP_DIR:-/opt/kamka-todo}"
REPO_URL="${REPO_URL:-https://github.com/YOUR_ORG/kamka-todo.git}"
BRANCH="${BRANCH:-main}"

log() { echo "[$(date '+%H:%M:%S')] $*"; }
die() { echo "ERROR: $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run as root: sudo $0"

if ! command -v docker &>/dev/null; then
  log "Installing Docker..."
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable --now docker
  log "Docker installed"
fi

if [[ -d "$APP_DIR/.git" ]]; then
  log "Updating repo..."
  git -C "$APP_DIR" fetch origin "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
else
  log "Cloning into $APP_DIR..."
  git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

[[ -f .env ]] || { cp .env.example .env; die ".env created from .env.example — set real values then re-run."; }

log "Pulling images..."
docker compose pull

log "Starting stack..."
docker compose up -d --remove-orphans

log "Waiting for API to be healthy..."
for i in $(seq 1 30); do
  docker compose exec -T api wget -qO- http://localhost:4000/health &>/dev/null && break
  [[ $i -eq 30 ]] && die "API never became healthy — check: docker compose logs api"
  sleep 2
done

log "API healthy"
docker image prune -f
docker compose ps
