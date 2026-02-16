#!/bin/bash
# Automatisches Setup-Script für Firebase Service Account
# Setzt alle benötigten Rollen automatisch und optimiert redundante Rollen
# Verwendung: ./scripts/setup-service-account.sh

set -e

PROJECT_ID="jobflow25"
SERVICE_ACCOUNT="jobflow25@jobflow25.iam.gserviceaccount.com"

# Farben für Output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 Firebase Service Account Setup & Optimierung"
echo "================================================"
echo ""
echo "Projekt: $PROJECT_ID"
echo "Service Account: $SERVICE_ACCOUNT"
echo ""

# Prüfe ob gcloud installiert ist
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI nicht gefunden!${NC}"
    echo "Installiere mit: curl https://sdk.cloud.google.com | bash"
    exit 1
fi

# Prüfe ob eingeloggt
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️ Nicht bei Google Cloud eingeloggt${NC}"
    echo "Führe aus: gcloud auth login"
    exit 1
fi

# Setze Projekt
echo "📋 Setze Projekt..."
gcloud config set project $PROJECT_ID --quiet

# Benötigte Rollen (minimal, optimiert)
REQUIRED_ROLES=(
    "roles/cloudfunctions.admin"
    "roles/firebase.sdkAdminServiceAgent"
    "roles/firebaseextensions.admin"
    "roles/firebasehosting.admin"
    "roles/run.admin"
    "roles/serviceusage.serviceUsageAdmin"
)

# Redundante Rollen (werden entfernt falls vorhanden)
REDUNDANT_ROLES=(
    "roles/firebase.admin"
    "roles/serviceusage.serviceUsageViewer"
    "roles/edgecontainer.serviceAccountAdmin"
    "roles/firebasemods.serviceAgent"
)

echo ""
echo "📊 Aktuelle Rollen prüfen..."
CURRENT_ROLES=$(gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT}" \
    --format="value(bindings.role)" 2>/dev/null || echo "")

echo ""
echo "🧹 Entferne redundante Rollen..."
for ROLE in "${REDUNDANT_ROLES[@]}"; do
    if echo "$CURRENT_ROLES" | grep -q "^${ROLE}$"; then
        echo -e "  ${YELLOW}→ Entferne: $ROLE${NC}"
        gcloud projects remove-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:${SERVICE_ACCOUNT}" \
            --role="$ROLE" \
            --condition=None \
            --quiet 2>/dev/null || true
    fi
done

echo ""
echo "➕ Füge benötigte Rollen hinzu..."
for ROLE in "${REQUIRED_ROLES[@]}"; do
    if ! echo "$CURRENT_ROLES" | grep -q "^${ROLE}$"; then
        echo -e "  ${GREEN}+ Füge hinzu: $ROLE${NC}"
        gcloud projects add-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:${SERVICE_ACCOUNT}" \
            --role="$ROLE" \
            --condition=None \
            --quiet
    else
        echo -e "  ✓ Bereits vorhanden: $ROLE"
    fi
done

echo ""
echo "🔐 Setze Service Account Impersonation..."
# Get project number for compute service account
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)" 2>/dev/null || echo "")
COMPUTE_SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

if [ -n "$PROJECT_NUMBER" ]; then
    echo "  → Grant Service Account User role für: $COMPUTE_SERVICE_ACCOUNT"
    gcloud iam service-accounts add-iam-policy-binding "$COMPUTE_SERVICE_ACCOUNT" \
        --member="serviceAccount:${SERVICE_ACCOUNT}" \
        --role="roles/iam.serviceAccountUser" \
        --project=$PROJECT_ID \
        --quiet 2>/dev/null && echo "  ✅ Service Account User role hinzugefügt" || echo "  ℹ️ Service Account User role bereits vorhanden"
else
    echo "  ⚠️ Projektnummer konnte nicht ermittelt werden, überspringe Service Account User Setup"
fi

echo ""
echo "⏳ Warte 10 Sekunden für Propagierung..."
sleep 10

echo ""
echo "✅ Verifikation der finalen Rollen:"
echo ""
FINAL_ROLES=$(gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT}" \
    --format="table(bindings.role)" 2>/dev/null)

echo "$FINAL_ROLES"
echo ""

ROLE_COUNT=$(gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT}" \
    --format="value(bindings.role)" 2>/dev/null | wc -l | xargs)

echo -e "${GREEN}✅ Setup abgeschlossen!${NC}"
echo ""
echo "📊 Statistiken:"
echo "  - Anzahl Rollen: $ROLE_COUNT"
echo "  - Service Account: $SERVICE_ACCOUNT"
echo ""
echo "🎯 Nächste Schritte:"
echo "  1. Warte 2-5 Minuten für vollständige Propagierung"
echo "  2. Trigger Deployment: git commit --allow-empty -m 'Trigger deployment' && git push"
echo ""

