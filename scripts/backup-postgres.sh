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

pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl --file="$target"
gzip -f "$target"

find "$BACKUP_DIR" -name 'ai_arbitrage_*.dump.gz' -type f -mtime +"$RETENTION_DAYS" -delete

echo "PostgreSQL backup created: $target.gz"
