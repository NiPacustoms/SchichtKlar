#!/usr/bin/env bash
# ============================================================
# JobFlow – Lokales Deployment zu Firebase Hosting
# ============================================================
# Voraussetzungen:
#   1. Firebase CLI: npm install -g firebase-tools
#   2. Eingeloggt: firebase login
#   3. .env.local im Projekt-Root vorhanden
#
# Ausführen (im Projekt-Root):
#   chmod +x scripts/deploy.sh
#   ./scripts/deploy.sh              # Production
#   ./scripts/deploy.sh preview      # Preview-Channel
# ============================================================

set -euo pipefail

ENV_FILE=".env.local"
PROJECT="jobflow25"
CHANNEL="${1:-production}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "========================================"
echo "  JobFlow – Firebase Deploy"
echo "========================================"
echo ""

if ! command -v firebase &> /dev/null; then
  echo -e "${RED}FEHLER: Firebase CLI nicht installiert.${NC}"
  echo "Installieren: npm install -g firebase-tools"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}FEHLER: $ENV_FILE nicht gefunden.${NC}"
  exit 1
fi

# .env.local laden
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

echo -e "${YELLOW}Projekt:${NC} $PROJECT"
echo -e "${YELLOW}Channel:${NC} $CHANNEL"
echo ""

# TypeScript prüfen
echo "Typecheck..."
npm run typecheck:ci
echo -e "${GREEN}OK${NC}"
echo ""

# Build
echo "Build..."
export NEXT_PUBLIC_APP_ENV=production
npm run build
echo -e "${GREEN}OK${NC}"
echo ""

# Functions-Abhängigkeiten
if [ -d "functions" ]; then
  echo "Functions installieren..."
  npm ci --prefix functions --no-audit --no-fund
  echo -e "${GREEN}OK${NC}"
  echo ""
fi

# Deploy
if [ "$CHANNEL" = "production" ]; then
  echo "Deploy zu Production..."
  firebase deploy --only hosting --project "$PROJECT" --force
else
  echo "Deploy zu Preview-Channel '$CHANNEL'..."
  firebase hosting:channel:deploy "$CHANNEL" --only hosting --project "$PROJECT" --expires 7d --force
fi

echo ""
echo -e "${GREEN}Deploy abgeschlossen!${NC}"
echo ""

