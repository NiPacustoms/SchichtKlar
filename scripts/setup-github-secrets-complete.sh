#!/bin/bash
# Komplettes Setup: Authentifizierung + Secrets setzen
# Führt durch den gesamten Prozess

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo ""
print_info "GitHub Secrets Setup - Kompletter Prozess"
echo ""

# Schritt 1: GitHub CLI installieren
if ! command -v gh &> /dev/null; then
    print_warning "GitHub CLI ist nicht installiert"
    print_info "Installiere GitHub CLI..."
    if command -v brew &> /dev/null; then
        brew install gh
        print_success "GitHub CLI installiert"
    else
        print_error "Homebrew nicht gefunden. Bitte installiere GitHub CLI manuell:"
        echo "  macOS: brew install gh"
        echo "  Linux: https://cli.github.com/manual/installation"
        exit 1
    fi
else
    print_success "GitHub CLI ist installiert"
fi

# Schritt 2: Authentifizierung prüfen
if ! gh auth status &> /dev/null; then
    print_warning "GitHub CLI ist nicht authentifiziert"
    print_info "Starte Authentifizierung..."
    echo ""
    print_info "Bitte folge den Anweisungen im Browser..."
    gh auth login --web
    print_success "Authentifizierung abgeschlossen"
else
    print_success "GitHub CLI ist bereits authentifiziert"
fi

# Schritt 3: Secrets setzen
echo ""
print_info "Setze Secrets aus .env.e2e..."
./scripts/set-github-secrets-auto.sh

print_success "Setup abgeschlossen!"
echo ""
print_info "Nächste Schritte:"
echo "  1. Teste die Pipeline mit einem Test-Commit"
echo "  2. Prüfe die GitHub Actions Logs"
echo "  3. Siehe docs/GITHUB_ACTIONS_SECRETS.md für Details"
