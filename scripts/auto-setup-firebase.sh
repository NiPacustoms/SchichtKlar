#!/bin/bash
# Vollständiges Firebase Setup-Script
# Automatisiert: Service Account, Rollen, APIs, etc.
# Verwendung: ./scripts/auto-setup-firebase.sh

set -e

PROJECT_ID="jobflow25"
SERVICE_ACCOUNT="jobflow25@jobflow25.iam.gserviceaccount.com"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Vollständiges Firebase Setup${NC}"
echo "=================================="
echo ""

# 1. Service Account Setup
echo -e "${BLUE}📋 Schritt 1: Service Account Rollen${NC}"
if [ -f "scripts/setup-service-account.sh" ]; then
    bash scripts/setup-service-account.sh
else
    echo -e "${YELLOW}⚠️ Script nicht gefunden, überspringe...${NC}"
fi

echo ""
echo -e "${BLUE}📋 Schritt 2: APIs aktivieren${NC}"
if [ -f "scripts/enable-required-apis.sh" ]; then
    bash scripts/enable-required-apis.sh
else
    echo -e "${YELLOW}⚠️ API-Script nicht gefunden, überspringe...${NC}"
fi

echo ""
echo -e "${BLUE}📋 Schritt 3: Verifikation${NC}"
if [ -f "scripts/verify-service-account.sh" ]; then
    bash scripts/verify-service-account.sh
else
    echo -e "${YELLOW}⚠️ Verifikations-Script nicht gefunden${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup abgeschlossen!${NC}"
echo ""
echo "🎯 Nächste Schritte:"
echo "  1. Warte 2-5 Minuten für Propagierung"
echo "  2. Teste Deployment: git push"

