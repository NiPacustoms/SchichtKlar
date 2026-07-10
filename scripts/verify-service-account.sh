#!/bin/bash
# Verifizierungs-Script für Service Account Rollen
# Prüft ob alle benötigten Rollen vorhanden sind

set -e

PROJECT_ID="schichtklar"
SERVICE_ACCOUNT="schichtklar@schichtklar.iam.gserviceaccount.com"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Service Account Verifikation"
echo "================================"
echo ""

# Benötigte Rollen
REQUIRED_ROLES=(
    "roles/cloudfunctions.admin"
    "roles/firebase.sdkAdminServiceAgent"
    "roles/firebaseextensions.admin"
    "roles/firebasehosting.admin"
    "roles/run.admin"
    "roles/serviceusage.serviceUsageAdmin"
)

# Redundante Rollen (sollten nicht vorhanden sein)
REDUNDANT_ROLES=(
    "roles/firebase.admin"
    "roles/serviceusage.serviceUsageViewer"
    "roles/edgecontainer.serviceAccountAdmin"
    "roles/firebasemods.serviceAgent"
)

# Aktuelle Rollen abrufen
CURRENT_ROLES=$(gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT}" \
    --format="value(bindings.role)" 2>/dev/null || echo "")

echo "📋 Prüfe benötigte Rollen..."
MISSING_ROLES=()
for ROLE in "${REQUIRED_ROLES[@]}"; do
    if echo "$CURRENT_ROLES" | grep -q "^${ROLE}$"; then
        echo -e "  ${GREEN}✅${NC} $ROLE"
    else
        echo -e "  ${RED}❌${NC} $ROLE - FEHLT!"
        MISSING_ROLES+=("$ROLE")
    fi
done

echo ""
echo "🧹 Prüfe redundante Rollen..."
HAS_REDUNDANT=false
for ROLE in "${REDUNDANT_ROLES[@]}"; do
    if echo "$CURRENT_ROLES" | grep -q "^${ROLE}$"; then
        echo -e "  ${YELLOW}⚠️${NC} $ROLE - Redundant (kann entfernt werden)"
        HAS_REDUNDANT=true
    fi
done

if [ "$HAS_REDUNDANT" = false ]; then
    echo -e "  ${GREEN}✅ Keine redundanten Rollen gefunden${NC}"
fi

echo ""
ROLE_COUNT=$(echo "$CURRENT_ROLES" | wc -l | xargs)

echo "📊 Zusammenfassung:"
echo "  - Anzahl Rollen: $ROLE_COUNT"
echo "  - Benötigte Rollen: ${#REQUIRED_ROLES[@]}"
echo "  - Fehlende Rollen: ${#MISSING_ROLES[@]}"

if [ ${#MISSING_ROLES[@]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Alle benötigten Rollen sind vorhanden!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Fehlende Rollen gefunden!${NC}"
    echo ""
    echo "Führe aus um zu beheben:"
    echo "  ./scripts/setup-service-account.sh"
    exit 1
fi

