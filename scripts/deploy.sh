#!/bin/bash
# Deployment Script für Firebase Hosting
# Lädt Environment-Variablen aus .env.local und deployed die App

set -euo pipefail

echo "🚀 JobFlow Deployment Script"
echo "============================"

# Prüfe ob .env.local existiert
if [ ! -f .env.local ]; then
    echo "❌ .env.local nicht gefunden. Bitte erstelle die Datei mit den Firebase-Konfigurationswerten."
    exit 1
fi

echo "✅ .env.local gefunden"

# Lade Environment-Variablen aus .env.local
# Entferne Kommentare und leere Zeilen, exportiere nur NEXT_PUBLIC_* Variablen
# Unterstützt Werte mit Leerzeichen durch korrektes Parsing
while IFS= read -r line || [ -n "$line" ]; do
  # Überspringe Kommentare und leere Zeilen
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// }" ]] && continue
  
  # Nur NEXT_PUBLIC_* Variablen exportieren
  if [[ "$line" =~ ^NEXT_PUBLIC_ ]]; then
    # Parse KEY=VALUE (unterstützt Werte mit Leerzeichen in Anführungszeichen)
    if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      value="${BASH_REMATCH[2]}"
      # Entferne Anführungszeichen falls vorhanden
      value="${value#\"}"
      value="${value%\"}"
      export "$key=$value"
    fi
  fi
done < <(grep -v '^#' .env.local | grep '^NEXT_PUBLIC_')

# Prüfe ob alle erforderlichen Variablen gesetzt sind
REQUIRED_VARS=(
    "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    "NEXT_PUBLIC_FIREBASE_APP_ID"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Fehlende Environment-Variablen:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    exit 1
fi

echo "✅ Alle erforderlichen Environment-Variablen sind gesetzt"

# Build und Deploy
echo ""
echo "📦 Starte Build..."
npm run build

echo ""
echo "🚀 Starte Deployment..."
echo "💡 Hinweis: Bestehende Firestore-Indizes werden automatisch beibehalten (N)."
# Automatisch "N" bei der Frage nach dem Löschen von Indizes beantworten
# um bestehende Indizes zu behalten
echo "N" | firebase deploy

echo ""
echo "✅ Deployment abgeschlossen!"

