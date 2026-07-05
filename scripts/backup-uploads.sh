#!/usr/bin/env bash
set -euo pipefail

UPLOAD_DIR="${UPLOAD_DIR:-/var/lib/ai-arbitrage/uploads}"
BACKUP_DIR="${UPLOAD_BACKUP_DIR:-/var/backups/ai-arbitrage/uploads}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

if [[ ! -d "$UPLOAD_DIR" ]]; then
  echo "Upload directory does not exist yet: $UPLOAD_DIR"
  exit 0
fi

mkdir -p "$BACKUP_DIR"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="$BACKUP_DIR/ai_arbitrage_uploads_$timestamp.tar.gz"

tar -czf "$target" -C "$UPLOAD_DIR" .

find "$BACKUP_DIR" -name 'ai_arbitrage_uploads_*.tar.gz' -type f -mtime +"$RETENTION_DAYS" -delete

echo "Upload backup created: $target"
