#!/usr/bin/env bash
set -euo pipefail

if ! command -v gsutil >/dev/null 2>&1; then
  echo "gsutil ist nicht installiert. Bitte die Google Cloud SDK installieren und authentifizieren (gcloud init)." >&2
  exit 1
fi

BUCKET="${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:-}"
if [[ -z "$BUCKET" ]]; then
  echo "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ist nicht gesetzt." >&2
  exit 1
fi

JSON_PATH="scripts/storage-cors.json"
if [[ ! -f "$JSON_PATH" ]]; then
  echo "CORS-Datei $JSON_PATH nicht gefunden." >&2
  exit 1
fi

echo "Setze CORS auf Bucket gs://$BUCKET ..."
gsutil cors set "$JSON_PATH" "gs://$BUCKET"
echo "Aktuelle CORS-Konfiguration:"
gsutil cors get "gs://$BUCKET"

echo "Fertig."


