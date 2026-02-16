#!/usr/bin/env bash
set -euo pipefail

# Firebase Storage Backup Script (copies bucket to versioned path)
# Usage:
#   PROJECT_ID=my-project SOURCE_BUCKET=gs://my-project.appspot.com BACKUP_BUCKET=gs://my-backups ./scripts/storage-backup.sh

if ! command -v gsutil >/dev/null 2>&1; then
  echo "gsutil not found. Install Google Cloud SDK." >&2
  exit 1
fi

PROJECT_ID=${PROJECT_ID:-}
SOURCE_BUCKET=${SOURCE_BUCKET:-}
BACKUP_BUCKET=${BACKUP_BUCKET:-}

if [ -z "$PROJECT_ID" ] || [ -z "$SOURCE_BUCKET" ] || [ -z "$BACKUP_BUCKET" ]; then
  echo "Missing PROJECT_ID, SOURCE_BUCKET or BACKUP_BUCKET" >&2
  exit 1
fi

DATE=$(date +"%Y%m%d-%H%M%S")
DEST="$BACKUP_BUCKET/storage/$PROJECT_ID/$DATE/"

echo "Syncing $SOURCE_BUCKET to $DEST ..."
gsutil -m rsync -r "$SOURCE_BUCKET" "$DEST"
echo "Done. To list backups: gsutil ls $BACKUP_BUCKET/storage/$PROJECT_ID/"


