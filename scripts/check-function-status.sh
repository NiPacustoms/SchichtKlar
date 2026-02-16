#!/bin/bash
# Script zum Prüfen des Status einer Cloud Function
# Verwendung: ./scripts/check-function-status.sh [function-name]

set -euo pipefail

FUNCTION_NAME="${1:-ssrjobflow25}"
REGION="${2:-europe-west1}"
PROJECT_ID="${3:-jobflow25}"

echo "🔍 Prüfe Status der Function: $FUNCTION_NAME"
echo "=============================================="
echo ""

# Prüfe Status
STATE=$(gcloud functions describe "$FUNCTION_NAME" \
  --region="$REGION" \
  --gen2 \
  --project="$PROJECT_ID" \
  --format="value(state)" 2>&1)

if [ $? -ne 0 ]; then
  echo "❌ Fehler beim Abrufen des Status:"
  echo "$STATE"
  exit 1
fi

UPDATE_TIME=$(gcloud functions describe "$FUNCTION_NAME" \
  --region="$REGION" \
  --gen2 \
  --project="$PROJECT_ID" \
  --format="value(updateTime)" 2>&1)

echo "📊 Status: $STATE"
echo "🕐 Letzte Aktualisierung: $UPDATE_TIME"
echo ""

case "$STATE" in
  "ACTIVE")
    echo "✅ Function ist bereit und kann verwendet werden."
    exit 0
    ;;
  "DEPLOYING")
    echo "⏳ Function wird gerade deployed. Bitte warten..."
    echo ""
    echo "💡 Tipp: Warte, bis das Deployment abgeschlossen ist, bevor du eine neue Operation startest."
    echo "   Du kannst dieses Script erneut ausführen, um den Status zu prüfen."
    exit 1
    ;;
  "FAILED")
    echo "❌ Deployment ist fehlgeschlagen!"
    echo ""
    echo "💡 Prüfe die Logs mit:"
    echo "   gcloud functions logs read $FUNCTION_NAME --region=$REGION --project=$PROJECT_ID --limit=50"
    exit 1
    ;;
  "UNKNOWN")
    echo "⚠️  Status unbekannt. Die Function existiert möglicherweise nicht."
    exit 1
    ;;
  *)
    echo "⚠️  Unbekannter Status: $STATE"
    exit 1
    ;;
esac

