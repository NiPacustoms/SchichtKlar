#!/bin/bash

# Auto-Push Script für JobFlow
# Überwacht Dateiänderungen und pusht automatisch

set -e

# Farben für Output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Konfiguration
INTERVAL=30  # Sekunden zwischen Checks
BRANCH=$(git branch --show-current)
REMOTE="origin"

echo -e "${GREEN}🚀 Auto-Push Watcher gestartet${NC}"
echo -e "Branch: ${YELLOW}${BRANCH}${NC}"
echo -e "Intervall: ${YELLOW}${INTERVAL}s${NC}"
echo -e "Drücke Ctrl+C zum Beenden\n"

# Funktion zum Pushen
push_changes() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Prüfe ob es Änderungen gibt
    if git diff --quiet && git diff --cached --quiet; then
        return 0  # Keine Änderungen
    fi
    
    echo -e "${YELLOW}[${timestamp}] Änderungen erkannt...${NC}"
    
    # Stage alle Änderungen
    git add -A
    
    # Commit mit Timestamp
    if git commit -m "auto: update ${timestamp}" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Committed${NC}"
    else
        echo -e "${RED}✗ Commit fehlgeschlagen${NC}"
        return 1
    fi
    
    # Push
    if git push ${REMOTE} ${BRANCH} >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Gepusht nach ${REMOTE}/${BRANCH}${NC}\n"
        return 0
    else
        echo -e "${RED}✗ Push fehlgeschlagen${NC}\n"
        return 1
    fi
}

# Haupt-Loop
while true; do
    push_changes
    sleep ${INTERVAL}
done

