#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups/postgres}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
DATABASE_URL="${DATABASE_URL:-}"

if [[ -z "$DATABASE_URL" ]]; then
  echo "DATABASE_URL is required. Example: postgresql://ai_arbitrage:password@127.0.0.1:5432/ai_arbitrage"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="$BACKUP_DIR/ai_arbitrage_$timestamp.dump"

if command -v pg_dump >/dev/null 2>&1; then
  pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl --file="$target"
else
  POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-ai-arbitrage_postgres_1}"
  if ! command -v docker >/dev/null 2>&1; then
    echo "pg_dump was not found and docker is not available."
    exit 1
  fi
  docker exec "$POSTGRES_CONTAINER" pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl > "$target"
fi
gzip -f "$target"

find "$BACKUP_DIR" -name 'ai_arbitrage_*.dump.gz' -type f -mtime +"$RETENTION_DAYS" -delete

echo "PostgreSQL backup created: $target.gz"
