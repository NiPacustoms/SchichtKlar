#!/bin/bash
# Vollständiges automatisches Setup aller GitHub Actions Secrets und Variables
# Liest Werte aus .env.e2e und .firebaserc und setzt sie automatisch

set -euo pipefail

# Farben für Output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "\n${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}\n"
}

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Prüfe GitHub CLI
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) ist nicht installiert!"
        print_info "Installiere mit: brew install gh"
        exit 1
    fi
    
    if ! gh auth status &> /dev/null; then
        print_error "GitHub CLI ist nicht authentifiziert!"
        print_info "Bitte authentifiziere dich mit: gh auth login"
        exit 1
    fi
    
    print_success "GitHub CLI ist installiert und authentifiziert"
}

# Hole Repository-Info
get_repo_info() {
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
        exit 1
    fi
    
    print_info "Repository: $REPO_OWNER/$REPO_NAME"
}

# Setze ein Secret (überschreibt falls vorhanden)
set_secret() {
    local SECRET_NAME=$1
    local SECRET_VALUE=$2
    local IS_OPTIONAL=${3:-false}
    
    if [ -z "$SECRET_VALUE" ]; then
        if [ "$IS_OPTIONAL" = "true" ]; then
            print_info "$SECRET_NAME ist optional und leer, überspringe..."
            return 0
        else
            print_warning "$SECRET_NAME ist leer, überspringe..."
            return 1
        fi
    fi
    
    echo -n "Setze Secret $SECRET_NAME... "
    if echo -n "$SECRET_VALUE" | gh secret set "$SECRET_NAME" --repo "$REPO_OWNER/$REPO_NAME" &> /dev/null; then
        print_success "$SECRET_NAME gesetzt"
        return 0
    else
        print_error "Fehler beim Setzen von $SECRET_NAME"
        return 1
    fi
}

# Setze eine Variable (überschreibt falls vorhanden)
set_variable() {
    local VAR_NAME=$1
    local VAR_VALUE=$2
    local IS_OPTIONAL=${3:-false}
    
    if [ -z "$VAR_VALUE" ]; then
        if [ "$IS_OPTIONAL" = "true" ]; then
            print_info "$VAR_NAME ist optional und leer, überspringe..."
            return 0
        else
            print_warning "$VAR_NAME ist leer, überspringe..."
            return 1
        fi
    fi
    
    echo -n "Setze Variable $VAR_NAME... "
    if gh variable set "$VAR_NAME" --body "$VAR_VALUE" --repo "$REPO_OWNER/$REPO_NAME" &> /dev/null; then
        print_success "$VAR_NAME gesetzt: $VAR_VALUE"
        return 0
    else
        print_error "Fehler beim Setzen von $VAR_NAME"
        return 1
    fi
}

# Hauptfunktion
main() {
    print_header "GitHub Actions Secrets & Variables - Vollständiges Setup"
    
    # Prüfungen
    check_gh_cli
    get_repo_info
    
    # Lese .env.e2e
    ENV_E2E_FILE=".env.e2e"
    if [ ! -f "$ENV_E2E_FILE" ]; then
        print_error "$ENV_E2E_FILE nicht gefunden!"
        exit 1
    fi
    
    print_info "Lese Werte aus $ENV_E2E_FILE"
    source "$ENV_E2E_FILE"
    
    # Lese .firebaserc
    FIREBASERC_FILE=".firebaserc"
    if [ ! -f "$FIREBASERC_FILE" ]; then
        print_warning "$FIREBASERC_FILE nicht gefunden, verwende Standardwert"
        FIREBASE_PROJECT_ID="schichtklar"
    else
        # Extrahiere default Projekt-ID aus .firebaserc
        FIREBASE_PROJECT_ID=$(grep -o '"default": "[^"]*"' "$FIREBASERC_FILE" | cut -d'"' -f4 || echo "schichtklar")
        print_info "Firebase Projekt-ID aus .firebaserc: $FIREBASE_PROJECT_ID"
    fi
    
    print_header "Setze E2E Test Secrets"
    
    # E2E Secrets aus .env.e2e
    set_secret "E2E_BASE_URL" "${BASE_URL:-http://localhost:3000}" true
    set_secret "E2E_ADMIN_EMAIL" "${E2E_ADMIN_EMAIL:-}" false
    set_secret "E2E_ADMIN_PASSWORD" "${E2E_ADMIN_PASSWORD:-}" false
    set_secret "E2E_EMPLOYEE_EMAIL" "${E2E_EMPLOYEE_EMAIL:-}" false
    set_secret "E2E_EMPLOYEE_PASSWORD" "${E2E_EMPLOYEE_PASSWORD:-}" false
    
    print_header "Setze Firebase Variables"
    
    # Firebase Variables
    set_variable "FIREBASE_PROJECT_ID" "$FIREBASE_PROJECT_ID" false
    
    print_header "Zusammenfassung"
    
    echo ""
    print_info "Gesetzte Secrets:"
    gh secret list --repo "$REPO_OWNER/$REPO_NAME" 2>/dev/null | grep -E "(E2E_|FIREBASE_)" || print_warning "Keine Secrets gefunden"
    
    echo ""
    print_info "Gesetzte Variables:"
    gh variable list --repo "$REPO_OWNER/$REPO_NAME" 2>/dev/null | grep -E "FIREBASE_PROJECT_ID" || print_warning "Keine Variables gefunden"
    
    echo ""
    print_success "Setup abgeschlossen!"
    echo ""
    print_info "Nächste Schritte:"
    echo "  1. Optional: Setze FIREBASE_SERVICE_ACCOUNT (falls Workload Identity nicht verwendet wird)"
    echo "  2. Optional: Setze FIREBASE_DEPLOYMENT_NOTIFICATION_SECRET (falls Firebase-Benachrichtigungen gewünscht)"
    echo "  3. Teste die Pipeline mit einem Test-Commit"
    echo "  4. Prüfe die GitHub Actions Logs auf Fehler"
    echo ""
    print_info "Siehe docs/GITHUB_ACTIONS_SECRETS.md für Details zu optionalen Secrets"
}

# Script ausführen
main "$@"
