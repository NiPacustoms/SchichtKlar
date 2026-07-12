#!/bin/bash
# Script zum Warten auf den Abschluss eines Function-Deployments
# Verwendung: ./scripts/wait-for-deployment.sh [function-name] [max-wait-seconds]

set -euo pipefail

FUNCTION_NAME="${1:-ssrschichtklar}"
REGION="${2:-europe-west1}"
PROJECT_ID="${3:-schichtklar}"
MAX_WAIT="${4:-600}"  # Default: 10 Minuten
CHECK_INTERVAL=10     # Prüfe alle 10 Sekunden

echo "⏳ Warte auf Abschluss des Deployments für: $FUNCTION_NAME"
echo "=============================================="
echo "Maximale Wartezeit: $MAX_WAIT Sekunden"
echo "Prüfintervall: $CHECK_INTERVAL Sekunden"
echo ""

START_TIME=$(date +%s)
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
  STATE=$(gcloud functions describe "$FUNCTION_NAME" \
    --region="$REGION" \
    --gen2 \
    --project="$PROJECT_ID" \
    --format="value(state)" 2>&1)
  
  if [ $? -ne 0 ]; then
    echo "❌ Fehler beim Abrufen des Status: $STATE"
    exit 1
  fi
  
  ELAPSED=$(($(date +%s) - START_TIME))
  MINUTES=$((ELAPSED / 60))
  SECONDS=$((ELAPSED % 60))
  
  printf "\r⏳ Status: %-15s | Verstrichene Zeit: %02d:%02d" "$STATE" "$MINUTES" "$SECONDS"
  
  case "$STATE" in
    "ACTIVE")
      echo ""
      echo ""
      echo "✅ Deployment erfolgreich abgeschlossen!"
      echo "   Function ist jetzt bereit."
      exit 0
      ;;
    "FAILED")
      echo ""
      echo ""
      echo "❌ Deployment fehlgeschlagen!"
      echo ""
      echo "💡 Prüfe die Logs mit:"
      echo "   gcloud functions logs read $FUNCTION_NAME --region=$REGION --project=$PROJECT_ID --limit=50"
      exit 1
      ;;
    "DEPLOYING")
      # Weiter warten
      sleep $CHECK_INTERVAL
      ;;
    *)
      echo ""
      echo "⚠️  Unbekannter Status: $STATE"
      exit 1
      ;;
  esac
done

echo ""
echo ""
echo "⏰ Maximale Wartezeit erreicht!"
echo "   Function ist immer noch im Status: $STATE"
echo ""
echo "💡 Prüfe manuell mit:"
echo "   ./scripts/check-function-status.sh $FUNCTION_NAME"
exit 1

