#!/usr/bin/env bash
# ============================================================
# JobFlow – GitHub Actions Secrets einrichten
# ============================================================
# Voraussetzung:
#   1. GitHub CLI installiert: https://cli.github.com/
#   2. Eingeloggt: gh auth login
#   3. .env.local im Projekt-Root vorhanden
#
# Ausführen (im Projekt-Root):
#   chmod +x scripts/set-github-secrets.sh
#   ./scripts/set-github-secrets.sh
# ============================================================

set -euo pipefail

REPO="NiPacustoms/JobFlow"
ENV_FILE=".env.local"

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "========================================"
echo "  JobFlow – GitHub Secrets einrichten"
echo "========================================"
echo ""

# Prüfe ob gh CLI vorhanden
if ! command -v gh &> /dev/null; then
  echo -e "${RED}FEHLER: GitHub CLI (gh) ist nicht installiert.${NC}"
  echo "Installieren: https://cli.github.com/"
  exit 1
fi

# Prüfe ob eingeloggt
if ! gh auth status &> /dev/null; then
  echo -e "${RED}FEHLER: Nicht bei GitHub eingeloggt.${NC}"
  echo "Bitte zuerst: gh auth login"
  exit 1
fi

# Prüfe ob .env.local vorhanden
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}FEHLER: $ENV_FILE nicht gefunden.${NC}"
  echo "Bitte die Datei im Projekt-Root anlegen."
  exit 1
fi

echo -e "${YELLOW}Repository:${NC} $REPO"
echo -e "${YELLOW}Quelle:${NC}     $ENV_FILE"
echo ""

# Funktion: Wert aus .env.local lesen
get_env() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '\r'
}

# Funktion: Secret setzen
set_secret() {
  local name="$1"
  local value="$2"
  if [ -z "$value" ]; then
    echo -e "  ${YELLOW}SKIP${NC}  $name  (leer in .env.local)"
    return
  fi
  echo -n "  Setze $name ... "
  if echo -n "$value" | gh secret set "$name" --repo "$REPO" 2>/dev/null; then
    echo -e "${GREEN}OK${NC}"
  else
    echo -e "${RED}FEHLER${NC}"
  fi
}

# ── Firebase (Public) ──────────────────────────────────────
echo "Firebase Public Keys:"
set_secret "NEXT_PUBLIC_FIREBASE_API_KEY"            "$(get_env NEXT_PUBLIC_FIREBASE_API_KEY)"
set_secret "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"        "$(get_env NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)"
set_secret "NEXT_PUBLIC_FIREBASE_PROJECT_ID"         "$(get_env NEXT_PUBLIC_FIREBASE_PROJECT_ID)"
set_secret "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"     "$(get_env NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)"
set_secret "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "$(get_env NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)"
set_secret "NEXT_PUBLIC_FIREBASE_APP_ID"             "$(get_env NEXT_PUBLIC_FIREBASE_APP_ID)"

echo ""

# ── Firebase Admin (Server) ────────────────────────────────
echo "Firebase Admin Keys:"
set_secret "FIREBASE_PROJECT_ID"   "$(get_env FIREBASE_PROJECT_ID)"
set_secret "FIREBASE_CLIENT_EMAIL" "$(get_env FIREBASE_CLIENT_EMAIL)"
set_secret "FIREBASE_PRIVATE_KEY"  "$(get_env FIREBASE_PRIVATE_KEY)"

echo ""

# ── E-Mail / Resend ────────────────────────────────────────
echo "E-Mail (Resend):"
set_secret "RESEND_API_KEY" "$(get_env RESEND_API_KEY)"
set_secret "RESEND_FROM"    "$(get_env RESEND_FROM)"

echo ""

# ── App-Konfiguration ──────────────────────────────────────
echo "App-Konfiguration:"
set_secret "NEXT_PUBLIC_APP_URL" "$(get_env NEXT_PUBLIC_APP_URL)"
set_secret "NEXT_PUBLIC_APP_ENV" "$(get_env NEXT_PUBLIC_APP_ENV)"

echo ""

# ── Firmendaten (Legal) ────────────────────────────────────
echo "Firmendaten (Legal):"
set_secret "NEXT_PUBLIC_COMPANY_NAME"    "$(get_env NEXT_PUBLIC_COMPANY_NAME)"
set_secret "NEXT_PUBLIC_COMPANY_STREET"  "$(get_env NEXT_PUBLIC_COMPANY_STREET)"
set_secret "NEXT_PUBLIC_COMPANY_CITY"    "$(get_env NEXT_PUBLIC_COMPANY_CITY)"
set_secret "NEXT_PUBLIC_COMPANY_ZIP"     "$(get_env NEXT_PUBLIC_COMPANY_ZIP)"
set_secret "NEXT_PUBLIC_COMPANY_EMAIL"   "$(get_env NEXT_PUBLIC_COMPANY_EMAIL)"
set_secret "NEXT_PUBLIC_COMPANY_PHONE"   "$(get_env NEXT_PUBLIC_COMPANY_PHONE)"
set_secret "NEXT_PUBLIC_COMPANY_WEBSITE" "$(get_env NEXT_PUBLIC_COMPANY_WEBSITE)"
set_secret "NEXT_PUBLIC_REGISTER_NUMBER" "$(get_env NEXT_PUBLIC_REGISTER_NUMBER)"
set_secret "NEXT_PUBLIC_REGISTER_COURT"  "$(get_env NEXT_PUBLIC_REGISTER_COURT)"
set_secret "NEXT_PUBLIC_VAT_ID"          "$(get_env NEXT_PUBLIC_VAT_ID)"
set_secret "NEXT_PUBLIC_RESPONSIBLE_NAME"     "$(get_env NEXT_PUBLIC_RESPONSIBLE_NAME)"
set_secret "NEXT_PUBLIC_RESPONSIBLE_POSITION" "$(get_env NEXT_PUBLIC_RESPONSIBLE_POSITION)"

echo ""
echo -e "${GREEN}Fertig!${NC}"
echo ""
echo "Prüfen unter: https://github.com/$REPO/settings/secrets/actions"
echo ""
