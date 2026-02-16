#!/bin/bash

# JobFlow Worktree Cleanup Script
# Bereinigt alte/verwaiste Git-Worktrees und stellt node_modules wieder her

echo "🧹 JobFlow Worktree Cleanup"
echo ""

# Zeige aktuelle Worktrees
echo "📋 Aktuelle Worktrees:"
git worktree list
echo ""

# Frage nach Bestätigung
read -p "Möchten Sie alte Worktrees bereinigen? (j/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[JjYy]$ ]]; then
    echo "❌ Abgebrochen"
    exit 1
fi

# Finde alle Worktrees außer dem Hauptverzeichnis
WORKTREES=$(git worktree list --porcelain | grep "^worktree" | awk '{print $2}' | grep -v "^$(pwd)$")

if [ -z "$WORKTREES" ]; then
    echo "✅ Keine zusätzlichen Worktrees gefunden"
else
    echo "🗑️  Gefundene Worktrees zum Bereinigen:"
    echo "$WORKTREES"
    echo ""
    
    # Bereinige jeden Worktree
    for WT in $WORKTREES; do
        if [ -d "$WT" ]; then
            echo "🗑️  Entferne Worktree: $WT"
            git worktree remove --force "$WT" 2>/dev/null || {
                echo "⚠️  Konnte Worktree nicht entfernen: $WT"
                echo "   Versuche manuell: rm -rf $WT"
            }
        fi
    done
fi

echo ""
echo "✅ Worktree-Bereinigung abgeschlossen"
echo ""

# Prüfe node_modules im Hauptverzeichnis
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    echo "📦 node_modules fehlen oder sind leer"
    echo "🔄 Installiere Dependencies neu..."
    npm install
else
    echo "✅ node_modules vorhanden"
    echo "💡 Tipp: Falls Probleme auftreten, führen Sie 'npm install' aus"
fi

echo ""
echo "🎉 Cleanup abgeschlossen!"

