#!/bin/bash
# Script zum automatischen Hinzufügen fehlender Service Account Berechtigungen
# Behebt die Deployment-Fehler für Cleanup Policy, Runtime Config API und Compute API
# Verwendung: ./scripts/fix-service-account-permissions.sh [SERVICE_ACCOUNT_EMAIL]

set -e

PROJECT_ID="jobflow25"

# Farben für Output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Firebase Service Account Berechtigungen - Automatische Reparatur${NC}"
echo "================================================================="
echo ""

# Service Account ermitteln
if [ -n "$1" ]; then
    SERVICE_ACCOUNT="$1"
    echo -e "${GREEN}✓ Service Account übergeben: $SERVICE_ACCOUNT${NC}"
elif [ -f "firebase-service-account.json" ]; then
    # Versuche aus lokalem JSON zu lesen
    SERVICE_ACCOUNT=$(python3 -c "import json; d=json.load(open('firebase-service-account.json')); print(d.get('client_email', ''))" 2>/dev/null || echo "")
    if [ -n "$SERVICE_ACCOUNT" ]; then
        echo -e "${GREEN}✓ Service Account aus firebase-service-account.json gelesen: $SERVICE_ACCOUNT${NC}"
    fi
fi

if [ -z "$SERVICE_ACCOUNT" ]; then
    # Versuche alle Service Accounts aufzulisten
    echo -e "${YELLOW}⚠️  Service Account nicht gefunden. Liste verfügbare Service Accounts...${NC}"
    echo ""
    echo "Verfügbare Service Accounts im Projekt:"
    gcloud iam service-accounts list --project=$PROJECT_ID --format="table(email)" 2>/dev/null || echo "  (Konnte nicht abgerufen werden)"
    echo ""
    echo "Bitte gib die Service Account Email an:"
    echo "  Option 1: ./scripts/fix-service-account-permissions.sh SERVICE_ACCOUNT@PROJECT.iam.gserviceaccount.com"
    echo "  Option 2: Setze SERVICE_ACCOUNT env variable: export SERVICE_ACCOUNT=..."
    echo "  Option 3: Wähle aus der Liste oben"
    echo ""
    read -p "Service Account Email: " SERVICE_ACCOUNT
fi

if [ -z "$SERVICE_ACCOUNT" ]; then
    echo -e "${RED}❌ Service Account Email erforderlich!${NC}"
    exit 1
fi

# Prüfe ob gcloud installiert ist
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI nicht gefunden!${NC}"
    echo "Installiere mit: curl https://sdk.cloud.google.com | bash"
    exit 1
fi

# Prüfe ob eingeloggt
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  Nicht bei Google Cloud eingeloggt${NC}"
    echo "Führe aus: gcloud auth login"
    exit 1
fi

# Setze Projekt
echo ""
echo "📋 Setze Projekt auf $PROJECT_ID..."
gcloud config set project $PROJECT_ID --quiet

echo ""
echo "🔍 Prüfe aktuelle Berechtigungen..."
CURRENT_ROLES=$(gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT}" \
    --format="value(bindings.role)" 2>/dev/null || echo "")

# Fehlende Rollen, die hinzugefügt werden müssen
REQUIRED_ROLES=(
    "roles/firebaseextensions.admin"
    "roles/serviceusage.serviceUsageConsumer"
    "roles/artifactregistry.admin"
    "roles/compute.viewer"
    "roles/serviceusage.serviceUsageAdmin"
)

echo ""
echo "➕ Füge fehlende Rollen hinzu..."
echo ""

ADDED_COUNT=0
ALREADY_EXISTS_COUNT=0

for ROLE in "${REQUIRED_ROLES[@]}"; do
    ROLE_NAME=$(echo "$ROLE" | cut -d'/' -f2)
    
    if echo "$CURRENT_ROLES" | grep -q "^${ROLE}$"; then
        echo -e "  ${GREEN}✓${NC} Bereits vorhanden: ${BLUE}$ROLE_NAME${NC}"
        ((ALREADY_EXISTS_COUNT++))
    else
        echo -e "  ${YELLOW}+${NC} Füge hinzu: ${BLUE}$ROLE_NAME${NC}"
        if gcloud projects add-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:${SERVICE_ACCOUNT}" \
            --role="$ROLE" \
            --condition=None \
            --quiet 2>/dev/null; then
            echo -e "    ${GREEN}✅ Erfolgreich hinzugefügt${NC}"
            ((ADDED_COUNT++))
        else
            echo -e "    ${RED}❌ Fehler beim Hinzufügen${NC}"
        fi
    fi
done

echo ""
echo "⏳ Warte 15 Sekunden für Propagierung..."
sleep 15

echo ""
echo "🔍 Verifiziere finale Berechtigungen..."
echo ""

FINAL_ROLES=$(gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT}" \
    --format="table(bindings.role)" 2>/dev/null || echo "")

echo "$FINAL_ROLES"
echo ""

# Cleanup Policy Setup versuchen
echo "🧹 Versuche Cleanup Policy einzurichten..."
if firebase functions:artifacts:setpolicy --project $PROJECT_ID --location europe-west1 2>/dev/null; then
    echo -e "  ${GREEN}✅ Cleanup Policy erfolgreich eingerichtet${NC}"
else
    echo -e "  ${YELLOW}⚠️  Cleanup Policy konnte nicht automatisch eingerichtet werden${NC}"
    echo "     Das ist OK - das Deployment wird trotzdem funktionieren"
    echo "     Um manuell einzurichten: firebase functions:artifacts:setpolicy --location europe-west1"
fi

echo ""
echo "================================================================="
echo -e "${GREEN}✅ Setup abgeschlossen!${NC}"
echo ""
echo "📊 Zusammenfassung:"
echo "  - Service Account: $SERVICE_ACCOUNT"
echo "  - Rollen hinzugefügt: $ADDED_COUNT"
echo "  - Rollen bereits vorhanden: $ALREADY_EXISTS_COUNT"
echo ""
echo "🎯 Nächste Schritte:"
echo "  1. Warte 1-2 Minuten für vollständige Propagierung der IAM-Änderungen"
echo "  2. Trigger ein neues Deployment:"
echo "     git commit --allow-empty -m 'Trigger deployment after permission fix' && git push"
echo ""
echo "💡 Hinweis: Falls das Deployment immer noch fehlschlägt, prüfe:"
echo "   - docs/FIREBASE_SERVICE_ACCOUNT_PERMISSIONS.md"
echo "   - GitHub Actions Logs für weitere Details"
echo ""

