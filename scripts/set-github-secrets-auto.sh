#!/bin/bash
# Automatisches Setzen von GitHub Actions Secrets aus .env.e2e
# Setzt alle Secrets automatisch ohne Benutzerinteraktion

set -euo pipefail

# Farben für Output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Prüfe GitHub CLI
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) ist nicht installiert!"
    print_info "Installiere mit: brew install gh"
    exit 1
fi

# Prüfe Authentifizierung
if ! gh auth status &> /dev/null; then
    print_warning "GitHub CLI ist nicht authentifiziert!"
    print_info "Bitte authentifiziere dich mit: gh auth login"
    exit 1
fi

# Hole Repository-Info
REPO_OWNER="${GITHUB_REPOSITORY_OWNER:-}"
REPO_NAME="${GITHUB_REPOSITORY_NAME:-}"

if [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
    if git remote get-url origin &> /dev/null; then
        REMOTE_URL=$(git remote get-url origin)
        if [[ $REMOTE_URL =~ github.com[:/]([^/]+)/([^/]+)\.git ]]; then
            REPO_OWNER="${BASH_REMATCH[1]}"
            REPO_NAME="${BASH_REMATCH[2]%.git}"
        fi
    fi
fi

if [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
    print_error "Konnte Repository-Informationen nicht ermitteln"
    print_info "Bitte setze GITHUB_REPOSITORY_OWNER und GITHUB_REPOSITORY_NAME"
    exit 1
fi

print_info "Repository: $REPO_OWNER/$REPO_NAME"

# Lese .env.e2e
ENV_E2E_FILE=".env.e2e"
if [ ! -f "$ENV_E2E_FILE" ]; then
    print_error "$ENV_E2E_FILE nicht gefunden!"
    exit 1
fi

print_info "Lese Werte aus $ENV_E2E_FILE"
source "$ENV_E2E_FILE"

# Setze Secrets
print_info "Setze Secrets..."

# E2E Secrets
if [ -n "${BASE_URL:-}" ]; then
    echo -n "$BASE_URL" | gh secret set E2E_BASE_URL --repo "$REPO_OWNER/$REPO_NAME" && print_success "E2E_BASE_URL gesetzt"
fi

if [ -n "${E2E_ADMIN_EMAIL:-}" ]; then
    echo -n "$E2E_ADMIN_EMAIL" | gh secret set E2E_ADMIN_EMAIL --repo "$REPO_OWNER/$REPO_NAME" && print_success "E2E_ADMIN_EMAIL gesetzt"
fi

if [ -n "${E2E_ADMIN_PASSWORD:-}" ]; then
    echo -n "$E2E_ADMIN_PASSWORD" | gh secret set E2E_ADMIN_PASSWORD --repo "$REPO_OWNER/$REPO_NAME" && print_success "E2E_ADMIN_PASSWORD gesetzt"
fi

if [ -n "${E2E_EMPLOYEE_EMAIL:-}" ]; then
    echo -n "$E2E_EMPLOYEE_EMAIL" | gh secret set E2E_EMPLOYEE_EMAIL --repo "$REPO_OWNER/$REPO_NAME" && print_success "E2E_EMPLOYEE_EMAIL gesetzt"
fi

if [ -n "${E2E_EMPLOYEE_PASSWORD:-}" ]; then
    echo -n "$E2E_EMPLOYEE_PASSWORD" | gh secret set E2E_EMPLOYEE_PASSWORD --repo "$REPO_OWNER/$REPO_NAME" && print_success "E2E_EMPLOYEE_PASSWORD gesetzt"
fi

# Setze Variables
print_info "Setze Variables..."

# Firebase Project ID aus .firebaserc lesen
if [ -f ".firebaserc" ]; then
    FIREBASE_PROJECT_ID=$(grep -o '"default": "[^"]*"' .firebaserc | cut -d'"' -f4 || echo "schichtklar")
    if [ -n "$FIREBASE_PROJECT_ID" ]; then
        gh variable set FIREBASE_PROJECT_ID --body "$FIREBASE_PROJECT_ID" --repo "$REPO_OWNER/$REPO_NAME" && print_success "FIREBASE_PROJECT_ID gesetzt: $FIREBASE_PROJECT_ID"
    fi
fi

print_success "Alle Secrets und Variables wurden gesetzt!"
print_info "Prüfe mit: gh secret list --repo $REPO_OWNER/$REPO_NAME"
print_info "Prüfe mit: gh variable list --repo $REPO_OWNER/$REPO_NAME"
