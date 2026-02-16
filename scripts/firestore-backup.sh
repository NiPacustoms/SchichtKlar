#!/usr/bin/env bash
set -euo pipefail

# Firestore Export Script
# Usage:
#   PROJECT_ID=my-project BACKUP_BUCKET=gs://my-backups ./scripts/firestore-backup.sh
# Optional:
#   COLLECTION_GROUPS="users shifts assignments" to limit export

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI not found. Install Google Cloud SDK." >&2
  exit 1
fi

PROJECT_ID=${PROJECT_ID:-}
BACKUP_BUCKET=${BACKUP_BUCKET:-}
COLLECTION_GROUPS=${COLLECTION_GROUPS:-}

if [ -z "$PROJECT_ID" ] || [ -z "$BACKUP_BUCKET" ]; then
  echo "Missing PROJECT_ID or BACKUP_BUCKET. Example:" >&2
  echo "  PROJECT_ID=my-project BACKUP_BUCKET=gs://my-backups ./scripts/firestore-backup.sh" >&2
  exit 1
fi

DATE=$(date +"%Y%m%d-%H%M%S")
DEST="$BACKUP_BUCKET/firestore/$PROJECT_ID/$DATE"

echo "Exporting Firestore to $DEST ..."

if [ -z "$COLLECTION_GROUPS" ]; then
  gcloud firestore export "$DEST" --project="$PROJECT_ID"
else
  ARGS=()
  for c in $COLLECTION_GROUPS; do
    ARGS+=(--collection-ids="$c")
  done
  gcloud firestore export "$DEST" "${ARGS[@]}" --project="$PROJECT_ID"
fi

echo "Done. To list backups: gsutil ls $BACKUP_BUCKET/firestore/$PROJECT_ID/"


