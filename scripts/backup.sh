#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

APP_DIR="${APP_DIR:-/opt/kamka-todo}"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"
TIMESTAMP="$(date '+%Y%m%d_%H%M%S')"
BACKUP_FILE="$BACKUP_DIR/todo_db_${TIMESTAMP}.sql.gz"

[[ -f "$APP_DIR/.env" ]] && set -a && source "$APP_DIR/.env" && set +a

log() { echo "[$(date '+%H:%M:%S')] $*"; }
die() { echo "ERROR: $*" >&2; exit 1; }

command -v docker &>/dev/null || die "docker not found"

POSTGRES_USER="${POSTGRES_USER:-todo_user}"
POSTGRES_DB="${POSTGRES_DB:-todo_db}"

mkdir -p "$BACKUP_DIR"
log "Backing up $POSTGRES_DB to $BACKUP_FILE..."

docker compose -f "$APP_DIR/docker-compose.yml" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_FILE"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
log "Done: $BACKUP_FILE ($SIZE)"

find "$BACKUP_DIR" -name "todo_db_*.sql.gz" -mtime +"$KEEP_DAYS" -delete
REMAINING=$(find "$BACKUP_DIR" -name "todo_db_*.sql.gz" | wc -l)
log "Rotation complete — $REMAINING backup(s) retained"
