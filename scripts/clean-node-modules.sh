#!/bin/bash
# Vollständige Neuinstallation von node_modules (behebt ENOTEMPTY).
# Am besten in einem **externen Terminal** ausführen (Cursor/IDE schließen oder
# nicht auf den Projektordner zugreifen), damit kein Prozess node_modules blockiert.
set -e
cd "$(dirname "$0")/.."
echo "→ Stoppe Prozesse auf Port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
echo "→ Lösche node_modules..."
rm -rf node_modules
echo "→ npm install..."
npm install
echo "✓ Fertig. Starte mit: npm run dev"
