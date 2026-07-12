#!/bin/bash
# Script zum Aktivieren der benötigten Google Cloud APIs für Firebase Deployment
# Verwendung: ./scripts/enable-required-apis.sh

set -e

PROJECT_ID="schichtklar"
SERVICE_ACCOUNT="schichtklar@schichtklar.iam.gserviceaccount.com"

# Farben für Output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔧 Google Cloud APIs aktivieren"
echo "================================="
echo ""
echo "Projekt: $PROJECT_ID"
echo ""

# Prüfe ob gcloud installiert ist
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI nicht gefunden!${NC}"
    echo "Installiere mit: curl https://sdk.cloud.google.com | bash"
    exit 1
fi

# Setze Projekt
gcloud config set project $PROJECT_ID --quiet

# Liste der APIs, die aktiviert werden sollen
# Hinweis: Einige APIs sind optional, aber Firebase CLI prüft sie
APIS=(
    # Pflicht-APIs für Firebase
    "cloudfunctions.googleapis.com"
    "cloudbuild.googleapis.com"
    "artifactregistry.googleapis.com"
    "run.googleapis.com"
    "eventarc.googleapis.com"
    "pubsub.googleapis.com"
    "storage.googleapis.com"
    "firebaseextensions.googleapis.com"
    
    # Optional, aber Firebase CLI prüft sie
    "cloudbilling.googleapis.com"
    "runtimeconfig.googleapis.com"
    "compute.googleapis.com"
    
    # Bereits aktiviert, aber zur Sicherheit
    "firebase.googleapis.com"
    "firebasehosting.googleapis.com"
    "serviceusage.googleapis.com"
)

echo "📋 Aktiviere APIs..."
echo ""

ENABLED_COUNT=0
ALREADY_ENABLED_COUNT=0
FAILED_COUNT=0

for API in "${APIS[@]}"; do
    # Prüfe ob API bereits aktiviert ist
    if gcloud services list --enabled --filter="name:$API" --format="value(name)" | grep -q "^$API$"; then
        echo -e "  ✓ Bereits aktiviert: $API"
        ((ALREADY_ENABLED_COUNT++))
    else
        echo -e "  ${YELLOW}→ Aktiviere: $API${NC}"
        if gcloud services enable "$API" --project="$PROJECT_ID" --quiet 2>/dev/null; then
            echo -e "    ${GREEN}✅ Erfolgreich aktiviert${NC}"
            ((ENABLED_COUNT++))
        else
            echo -e "    ${RED}❌ Fehler beim Aktivieren${NC}"
            ((FAILED_COUNT++))
            # Fortfahren, auch wenn eine API fehlschlägt (z.B. Cloud Billing bei Spark Plan)
        fi
    fi
done

echo ""
echo "⏳ Warte 30 Sekunden für API-Propagierung..."
sleep 30

echo ""
echo -e "${GREEN}✅ API-Aktivierung abgeschlossen!${NC}"
echo ""
echo "📊 Statistiken:"
echo "  - Bereits aktiviert: $ALREADY_ENABLED_COUNT"
echo "  - Neu aktiviert: $ENABLED_COUNT"
echo "  - Fehler: $FAILED_COUNT"
echo ""
echo "💡 Hinweis:"
echo "  - Cloud Billing API kann bei Spark Plan (Free Tier) nicht aktiviert werden"
echo "  - Dies ist normal und verhindert das Deployment nicht"
echo ""

