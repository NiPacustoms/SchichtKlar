#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "→ Stoppe ggf. laufende Node-Prozesse..."
pkill -f "node.*JobFlow" 2>/dev/null || true
sleep 1

echo "→ Lösche node_modules..."
rm -rf node_modules

echo "→ npm Cache leeren..."
npm cache clean --force

echo "→ npm install..."
npm install

echo "→ npm audit fix..."
npm audit fix

echo "✓ Fertig."
