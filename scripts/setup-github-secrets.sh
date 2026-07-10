#!/bin/bash
# Script zum automatischen Setzen von GitHub Actions Secrets und Variables
# Verwendet die GitHub CLI (gh) um Secrets und Variables zu konfigurieren

set -euo pipefail

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Repository-Informationen
REPO_OWNER="${GITHUB_REPOSITORY_OWNER:-}"
REPO_NAME="${GITHUB_REPOSITORY_NAME:-}"

# Funktionen
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Prüfe ob GitHub CLI installiert ist
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) ist nicht installiert!"
        echo ""
        print_info "Installation:"
        echo "  macOS: brew install gh"
        echo "  Linux: https://cli.github.com/manual/installation"
        echo "  Windows: https://cli.github.com/manual/installation"
        echo ""
        print_info "Nach der Installation:"
        echo "  1. gh auth login"
        echo "  2. Dieses Script erneut ausführen"
        exit 1
    fi
    
    # Prüfe ob authentifiziert
    if ! gh auth status &> /dev/null; then
        print_warning "GitHub CLI ist nicht authentifiziert!"
        echo ""
        print_info "Bitte authentifiziere dich mit:"
        echo "  gh auth login"
        exit 1
    fi
    
    print_success "GitHub CLI ist installiert und authentifiziert"
}

# Hole Repository-Informationen
get_repo_info() {
    if [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
        # Versuche aus git remote zu lesen
        if git remote get-url origin &> /dev/null; then
            REMOTE_URL=$(git remote get-url origin)
            if [[ $REMOTE_URL =~ github.com[:/]([^/]+)/([^/]+)\.git ]]; then
                REPO_OWNER="${BASH_REMATCH[1]}"
                REPO_NAME="${BASH_REMATCH[2]}"
            fi
        fi
        
        # Falls immer noch leer, interaktiv abfragen
        if [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
            echo ""
            read -p "GitHub Repository Owner (z.B. mein-github-user): " REPO_OWNER
            read -p "GitHub Repository Name (z.B. JobFlow): " REPO_NAME
        fi
    fi
    
    print_info "Repository: $REPO_OWNER/$REPO_NAME"
}

# Lese Werte aus .env.e2e
read_env_e2e() {
    ENV_E2E_FILE=".env.e2e"
    if [ -f "$ENV_E2E_FILE" ]; then
        print_info "Lese Werte aus $ENV_E2E_FILE"
        source "$ENV_E2E_FILE"
        print_success "Werte aus $ENV_E2E_FILE geladen"
    else
        print_warning "$ENV_E2E_FILE nicht gefunden, verwende Standardwerte"
    fi
}

# Setze ein Secret
set_secret() {
    local SECRET_NAME=$1
    local SECRET_VALUE=$2
    local IS_OPTIONAL=${3:-false}
    
    if [ -z "$SECRET_VALUE" ] && [ "$IS_OPTIONAL" = "false" ]; then
        print_warning "$SECRET_NAME ist leer, überspringe..."
        return
    fi
    
    if [ -z "$SECRET_VALUE" ] && [ "$IS_OPTIONAL" = "true" ]; then
        print_info "$SECRET_NAME ist optional, überspringe..."
        return
    fi
    
    echo -n "Setze Secret $SECRET_NAME... "
    if echo -n "$SECRET_VALUE" | gh secret set "$SECRET_NAME" --repo "$REPO_OWNER/$REPO_NAME" &> /dev/null; then
        print_success "$SECRET_NAME gesetzt"
    else
        print_error "Fehler beim Setzen von $SECRET_NAME"
        return 1
    fi
}

# Setze eine Variable
set_variable() {
    local VAR_NAME=$1
    local VAR_VALUE=$2
    local IS_OPTIONAL=${3:-false}
    
    if [ -z "$VAR_VALUE" ] && [ "$IS_OPTIONAL" = "false" ]; then
        print_warning "$VAR_NAME ist leer, überspringe..."
        return
    fi
    
    if [ -z "$VAR_VALUE" ] && [ "$IS_OPTIONAL" = "true" ]; then
        print_info "$VAR_NAME ist optional, überspringe..."
        return
    fi
    
    echo -n "Setze Variable $VAR_NAME... "
    if gh variable set "$VAR_NAME" --body "$VAR_VALUE" --repo "$REPO_OWNER/$REPO_NAME" &> /dev/null; then
        print_success "$VAR_NAME gesetzt"
    else
        print_error "Fehler beim Setzen von $VAR_NAME"
        return 1
    fi
}

# Interaktive Abfrage für fehlende Werte
prompt_value() {
    local PROMPT_TEXT=$1
    local DEFAULT_VALUE=${2:-}
    local IS_SECRET=${3:-false}
    
    if [ -n "$DEFAULT_VALUE" ]; then
        if [ "$IS_SECRET" = "true" ]; then
            read -sp "$PROMPT_TEXT [verwende Standardwert]: " VALUE
            echo ""
        else
            read -p "$PROMPT_TEXT [Standard: $DEFAULT_VALUE]: " VALUE
        fi
        VALUE="${VALUE:-$DEFAULT_VALUE}"
    else
        if [ "$IS_SECRET" = "true" ]; then
            read -sp "$PROMPT_TEXT: " VALUE
            echo ""
        else
            read -p "$PROMPT_TEXT: " VALUE
        fi
    fi
    
    echo "$VALUE"
}

# Hauptfunktion
main() {
    print_header "GitHub Actions Secrets & Variables Setup"
    
    # Prüfungen
    check_gh_cli
    get_repo_info
    
    # Lese .env.e2e falls vorhanden
    read_env_e2e
    
    print_header "Secrets konfigurieren"
    
    # E2E Test Secrets
    print_info "E2E Test Secrets"
    E2E_BASE_URL_VALUE="${BASE_URL:-http://localhost:3000}"
    E2E_BASE_URL_VALUE=$(prompt_value "E2E_BASE_URL" "$E2E_BASE_URL_VALUE" false)
    set_secret "E2E_BASE_URL" "$E2E_BASE_URL_VALUE" true
    
    E2E_ADMIN_EMAIL_VALUE="${E2E_ADMIN_EMAIL:-admin@jobflow.de}"
    E2E_ADMIN_EMAIL_VALUE=$(prompt_value "E2E_ADMIN_EMAIL" "$E2E_ADMIN_EMAIL_VALUE" false)
    set_secret "E2E_ADMIN_EMAIL" "$E2E_ADMIN_EMAIL_VALUE" false
    
    E2E_ADMIN_PASSWORD_VALUE="${E2E_ADMIN_PASSWORD:-admin123}"
    E2E_ADMIN_PASSWORD_VALUE=$(prompt_value "E2E_ADMIN_PASSWORD" "$E2E_ADMIN_PASSWORD_VALUE" true)
    set_secret "E2E_ADMIN_PASSWORD" "$E2E_ADMIN_PASSWORD_VALUE" false
    
    E2E_EMPLOYEE_EMAIL_VALUE="${E2E_EMPLOYEE_EMAIL:-nurse@jobflow.de}"
    E2E_EMPLOYEE_EMAIL_VALUE=$(prompt_value "E2E_EMPLOYEE_EMAIL" "$E2E_EMPLOYEE_EMAIL_VALUE" false)
    set_secret "E2E_EMPLOYEE_EMAIL" "$E2E_EMPLOYEE_EMAIL_VALUE" false
    
    E2E_EMPLOYEE_PASSWORD_VALUE="${E2E_EMPLOYEE_PASSWORD:-nurse123}"
    E2E_EMPLOYEE_PASSWORD_VALUE=$(prompt_value "E2E_EMPLOYEE_PASSWORD" "$E2E_EMPLOYEE_PASSWORD_VALUE" true)
    set_secret "E2E_EMPLOYEE_PASSWORD" "$E2E_EMPLOYEE_PASSWORD_VALUE" false
    
    # Firebase Secrets (optional)
    echo ""
    print_info "Firebase Secrets (optional - nur wenn Workload Identity NICHT verwendet wird)"
    read -p "FIREBASE_SERVICE_ACCOUNT setzen? (j/n) [n]: " SET_FIREBASE_SA
    if [[ "$SET_FIREBASE_SA" =~ ^[Jj]$ ]]; then
        print_info "Bitte den kompletten JSON-Inhalt des Service Accounts einfügen (Ende mit Ctrl+D):"
        FIREBASE_SA_JSON=$(cat)
        set_secret "FIREBASE_SERVICE_ACCOUNT" "$FIREBASE_SA_JSON" true
    fi
    
    # Notification Secret (optional)
    echo ""
    read -p "FIREBASE_DEPLOYMENT_NOTIFICATION_SECRET setzen? (j/n) [n]: " SET_NOTIFICATION_SECRET
    if [[ "$SET_NOTIFICATION_SECRET" =~ ^[Jj]$ ]]; then
        NOTIFICATION_SECRET_VALUE=$(openssl rand -hex 32 2>/dev/null || echo "")
        if [ -z "$NOTIFICATION_SECRET_VALUE" ]; then
            NOTIFICATION_SECRET_VALUE=$(prompt_value "FIREBASE_DEPLOYMENT_NOTIFICATION_SECRET" "" true)
        else
            print_info "Generierter Secret: $NOTIFICATION_SECRET_VALUE"
            read -p "Verwenden? (j/n) [j]: " USE_GENERATED
            if [[ ! "$USE_GENERATED" =~ ^[Nn]$ ]]; then
                set_secret "FIREBASE_DEPLOYMENT_NOTIFICATION_SECRET" "$NOTIFICATION_SECRET_VALUE" true
            else
                NOTIFICATION_SECRET_VALUE=$(prompt_value "FIREBASE_DEPLOYMENT_NOTIFICATION_SECRET" "" true)
                set_secret "FIREBASE_DEPLOYMENT_NOTIFICATION_SECRET" "$NOTIFICATION_SECRET_VALUE" true
            fi
        fi
    fi
    
    # Lighthouse CI Token (optional)
    echo ""
    read -p "LHCI_GITHUB_APP_TOKEN setzen? (j/n) [n]: " SET_LHCI_TOKEN
    if [[ "$SET_LHCI_TOKEN" =~ ^[Jj]$ ]]; then
        LHCI_TOKEN_VALUE=$(prompt_value "LHCI_GITHUB_APP_TOKEN" "" true)
        set_secret "LHCI_GITHUB_APP_TOKEN" "$LHCI_TOKEN_VALUE" true
    fi
    
    print_header "Variables konfigurieren"
    
    # Firebase Variables
    print_info "Firebase Variables"
    FIREBASE_PROJECT_ID_VALUE="jobflow25"
    FIREBASE_PROJECT_ID_VALUE=$(prompt_value "FIREBASE_PROJECT_ID" "$FIREBASE_PROJECT_ID_VALUE" false)
    set_variable "FIREBASE_PROJECT_ID" "$FIREBASE_PROJECT_ID_VALUE" false
    
    # Workload Identity Variables (optional)
    echo ""
    print_info "Workload Identity Variables (optional - nur wenn Workload Identity verwendet wird)"
    read -p "WORKLOAD_IDENTITY_PROVIDER setzen? (j/n) [n]: " SET_WI_PROVIDER
    if [[ "$SET_WI_PROVIDER" =~ ^[Jj]$ ]]; then
        WI_PROVIDER_VALUE=$(prompt_value "WORKLOAD_IDENTITY_PROVIDER" "" false)
        set_variable "WORKLOAD_IDENTITY_PROVIDER" "$WI_PROVIDER_VALUE" true
    fi
    
    read -p "WORKLOAD_IDENTITY_SERVICE_ACCOUNT setzen? (j/n) [n]: " SET_WI_SA
    if [[ "$SET_WI_SA" =~ ^[Jj]$ ]]; then
        WI_SA_VALUE=$(prompt_value "WORKLOAD_IDENTITY_SERVICE_ACCOUNT" "" false)
        set_variable "WORKLOAD_IDENTITY_SERVICE_ACCOUNT" "$WI_SA_VALUE" true
    fi
    
    # Notification URL (optional)
    echo ""
    read -p "FIREBASE_DEPLOYMENT_NOTIFICATION_URL setzen? (j/n) [n]: " SET_NOTIFICATION_URL
    if [[ "$SET_NOTIFICATION_URL" =~ ^[Jj]$ ]]; then
        NOTIFICATION_URL_VALUE="https://us-central1-jobflow25.cloudfunctions.net/notifyDeployment"
        NOTIFICATION_URL_VALUE=$(prompt_value "FIREBASE_DEPLOYMENT_NOTIFICATION_URL" "$NOTIFICATION_URL_VALUE" false)
        set_variable "FIREBASE_DEPLOYMENT_NOTIFICATION_URL" "$NOTIFICATION_URL_VALUE" true
    fi
    
    print_header "Zusammenfassung"
    print_success "Setup abgeschlossen!"
    echo ""
    print_info "Gesetzte Secrets und Variables:"
    echo "  Repository: $REPO_OWNER/$REPO_NAME"
    echo ""
    echo "  Secrets:"
    gh secret list --repo "$REPO_OWNER/$REPO_NAME" 2>/dev/null || echo "    (Fehler beim Abrufen der Secrets)"
    echo ""
    echo "  Variables:"
    gh variable list --repo "$REPO_OWNER/$REPO_NAME" 2>/dev/null || echo "    (Fehler beim Abrufen der Variables)"
    echo ""
    print_info "Nächste Schritte:"
    echo "  1. Teste die Pipeline mit einem Test-Commit"
    echo "  2. Prüfe die GitHub Actions Logs auf Fehler"
    echo "  3. Siehe docs/GITHUB_ACTIONS_SECRETS.md für Details"
}

# Script ausführen
main "$@"
