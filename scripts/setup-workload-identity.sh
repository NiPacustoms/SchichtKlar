#!/bin/bash
# Setup Script für Workload Identity Federation
# Dieses Script richtet Workload Identity für GitHub Actions ein

set -euo pipefail

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Konfiguration
PROJECT_ID="${PROJECT_ID:-schichtklar}"
GITHUB_USER="${GITHUB_USER:-NiPacustoms}"
REPO_NAME="${REPO_NAME:-JobFlow}"
SERVICE_ACCOUNT_NAME="${SERVICE_ACCOUNT_NAME:-github-actions}"
POOL_NAME="${POOL_NAME:-github-actions-pool}"
PROVIDER_NAME="${PROVIDER_NAME:-github-provider}"

echo -e "${GREEN}🚀 Workload Identity Setup für GitHub Actions${NC}"
echo ""

# Prüfe ob gcloud installiert ist
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI ist nicht installiert!${NC}"
    echo "Installiere es mit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Prüfe ob eingeloggt
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  Du bist nicht bei gcloud eingeloggt.${NC}"
    echo "Führe aus: gcloud auth login"
    exit 1
fi

# Setze Projekt
echo -e "${GREEN}📋 Projekt setzen: ${PROJECT_ID}${NC}"
gcloud config set project "$PROJECT_ID"

# Projekt-Nummer ermitteln
echo -e "${GREEN}🔢 Projekt-Nummer ermitteln...${NC}"
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
if [ -z "$PROJECT_NUMBER" ]; then
    echo -e "${RED}❌ Konnte Projekt-Nummer nicht ermitteln!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Projekt-Nummer: ${PROJECT_NUMBER}${NC}"
echo ""

# GitHub User/Repo abfragen falls nicht gesetzt
if [ -z "$GITHUB_USER" ]; then
    echo -e "${YELLOW}📝 GitHub Username eingeben:${NC}"
    read -r GITHUB_USER
fi

if [ -z "$REPO_NAME" ]; then
    echo -e "${YELLOW}📝 Repository Name eingeben (z.B. JobFlow):${NC}"
    read -r REPO_NAME
fi

echo ""
echo -e "${GREEN}📋 Konfiguration:${NC}"
echo "  Projekt: $PROJECT_ID"
echo "  Projekt-Nummer: $PROJECT_NUMBER"
echo "  GitHub User: $GITHUB_USER"
echo "  Repository: $REPO_NAME"
echo "  Service Account: ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
echo ""
read -p "Fortfahren? (j/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[JjYy]$ ]]; then
    echo "Abgebrochen."
    exit 1
fi

# Schritt 1: Workload Identity Pool erstellen
echo ""
echo -e "${GREEN}📦 Schritt 1: Workload Identity Pool erstellen...${NC}"
if gcloud iam workload-identity-pools describe "$POOL_NAME" \
    --project="$PROJECT_ID" \
    --location=global &>/dev/null; then
    echo -e "${YELLOW}⚠️  Pool '${POOL_NAME}' existiert bereits. Überspringe...${NC}"
else
    gcloud iam workload-identity-pools create "$POOL_NAME" \
        --project="$PROJECT_ID" \
        --location=global \
        --display-name="GitHub Actions Pool"
    echo -e "${GREEN}✅ Pool erstellt${NC}"
fi

# Schritt 2: Provider erstellen
echo ""
echo -e "${GREEN}🔐 Schritt 2: Workload Identity Provider erstellen...${NC}"
if gcloud iam workload-identity-pools providers describe "$PROVIDER_NAME" \
    --project="$PROJECT_ID" \
    --location=global \
    --workload-identity-pool="$POOL_NAME" &>/dev/null; then
    echo -e "${YELLOW}⚠️  Provider '${PROVIDER_NAME}' existiert bereits. Überspringe...${NC}"
else
    gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_NAME" \
        --project="$PROJECT_ID" \
        --location=global \
        --workload-identity-pool="$POOL_NAME" \
        --display-name="GitHub Provider" \
        --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
        --attribute-condition="assertion.repository=='${GITHUB_USER}/${REPO_NAME}'" \
        --issuer-uri="https://token.actions.githubusercontent.com"
    echo -e "${GREEN}✅ Provider erstellt${NC}"
fi

# Schritt 3: Service Account erstellen
echo ""
echo -e "${GREEN}👤 Schritt 3: Service Account erstellen...${NC}"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
if gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" \
    --project="$PROJECT_ID" &>/dev/null; then
    echo -e "${YELLOW}⚠️  Service Account '${SERVICE_ACCOUNT_EMAIL}' existiert bereits. Überspringe...${NC}"
else
    gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
        --project="$PROJECT_ID" \
        --display-name="GitHub Actions Service Account" \
        --description="Service Account für GitHub Actions mit Workload Identity"
    echo -e "${GREEN}✅ Service Account erstellt${NC}"
fi

# Schritt 4: Workload Identity Binding
echo ""
echo -e "${GREEN}🔗 Schritt 4: Workload Identity Binding erstellen...${NC}"
MEMBER="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/attribute.repository/${GITHUB_USER}/${REPO_NAME}"

# Prüfe ob Binding bereits existiert
if gcloud iam service-accounts get-iam-policy "$SERVICE_ACCOUNT_EMAIL" \
    --project="$PROJECT_ID" \
    --flatten="bindings[].members" \
    --filter="bindings.members:${MEMBER}" \
    --format="value(bindings.members)" | grep -q "$MEMBER"; then
    echo -e "${YELLOW}⚠️  Binding existiert bereits. Überspringe...${NC}"
else
    gcloud iam service-accounts add-iam-policy-binding "$SERVICE_ACCOUNT_EMAIL" \
        --project="$PROJECT_ID" \
        --role="roles/iam.workloadIdentityUser" \
        --member="$MEMBER"
    echo -e "${GREEN}✅ Binding erstellt${NC}"
fi

# Schritt 5: Firebase Berechtigungen
echo ""
echo -e "${GREEN}🔥 Schritt 5: Firebase Berechtigungen zuweisen...${NC}"

ROLES=(
    "roles/firebase.admin"
    "roles/firebaseextensions.admin"
    "roles/artifactregistry.admin"
    "roles/compute.viewer"
    "roles/serviceusage.serviceUsageAdmin"
)

for ROLE in "${ROLES[@]}"; do
    ROLE_NAME=$(echo "$ROLE" | cut -d'/' -f2)
    echo -n "  → $ROLE_NAME... "
    if gcloud projects get-iam-policy "$PROJECT_ID" \
        --flatten="bindings[].members" \
        --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT_EMAIL} AND bindings.role:${ROLE}" \
        --format="value(bindings.role)" | grep -q "$ROLE"; then
        echo -e "${YELLOW}bereits vorhanden${NC}"
    else
        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
            --role="$ROLE" \
            --condition=None \
            --quiet &>/dev/null || \
        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
            --role="$ROLE" \
            --quiet &>/dev/null
        echo -e "${GREEN}✅${NC}"
    fi
done

# Schritt 6: Zusammenfassung
echo ""
echo -e "${GREEN}✅ Setup abgeschlossen!${NC}"
echo ""
echo -e "${GREEN}📋 Nächste Schritte:${NC}"
echo ""
echo "1. Setze diese GitHub Variables:"
echo ""
echo "   WORKLOAD_IDENTITY_PROVIDER=projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/providers/${PROVIDER_NAME}"
echo "   WORKLOAD_IDENTITY_SERVICE_ACCOUNT=${SERVICE_ACCOUNT_EMAIL}"
echo ""
echo "2. Teste die Workflows mit einem Test-Commit"
echo ""
echo "3. Nach erfolgreichem Test kannst du diese Secrets aus GitHub entfernen:"
echo "   ❌ FIREBASE_SERVICE_ACCOUNT"
echo "   ❌ FIREBASE_SERVICE_ACCOUNT_SCHICHTKLAR"
echo ""
echo -e "${GREEN}🎉 Fertig! Workload Identity ist eingerichtet.${NC}"
