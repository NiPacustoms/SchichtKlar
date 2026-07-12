# Worktree Setup für 3 Agenten

## 🚀 Schnellstart

Jeder Agent hat seine eigene Prompt-Datei im `.cursor/` Verzeichnis:

- **Agent 1:** `.cursor/AGENT1-PROMPT.md` - MUI Grid & UI-Komponenten
- **Agent 2:** `.cursor/AGENT2-PROMPT.md` - API Routes & Backend
- **Agent 3:** `.cursor/AGENT3-PROMPT.md` - Type-System & Hooks

## 📁 Worktree erstellen

```bash
cd <pfad-zum-repo>/Schichtklar

# Agent 1 Worktree
git worktree add ../Schichtklar-agent1 agent1-mui-grid-fixes
cd ../Schichtklar-agent1
cat .cursor/AGENT1-PROMPT.md

# Agent 2 Worktree
cd <pfad-zum-repo>/Schichtklar
git worktree add ../Schichtklar-agent2 agent2-api-routes-fixes
cd ../Schichtklar-agent2
cat .cursor/AGENT2-PROMPT.md

# Agent 3 Worktree
cd <pfad-zum-repo>/Schichtklar
git worktree add ../Schichtklar-agent3 agent3-type-system-fixes
cd ../Schichtklar-agent3
cat .cursor/AGENT3-PROMPT.md
```

## 🤖 Wie die Agenten arbeiten

Jeder Agent:

1. **Öffnet seinen Worktree**
2. **Liest seine Prompt-Datei** (`.cursor/AGENT[X]-PROMPT.md`)
3. **Folgt den Anweisungen** in der Datei
4. **Dokumentiert Fortschritt** nach jeder Änderung
5. **Testet regelmäßig** mit `npx tsc --noEmit --skipLibCheck`

## 📋 Workflow für jeden Agenten

```bash
# 1. In den Worktree wechseln
cd ../Schichtklar-agent1  # oder agent2/agent3

# 2. Prompt lesen
cat .cursor/AGENT1-PROMPT.md  # oder AGENT2/AGENT3

# 3. Fehler identifizieren (aus Prompt kopieren)
npx tsc --noEmit --skipLibCheck 2>&1 | grep -i "grid" | head -30

# 4. Änderungen machen
# ... Dateien bearbeiten ...

# 5. Testen
npx tsc --noEmit --skipLibCheck 2>&1 | grep -i "grid" | wc -l

# 6. Committen
git add .
git commit -m "Agent1: Grid-Komponenten-Fehler behoben"
```

## 🔄 Koordination

- **Keine Überschneidungen:** Jeder Agent arbeitet an unterschiedlichen Dateien
- **Regelmäßige Syncs:** `git pull` aus main branch
- **Konflikte vermeiden:** Klare Aufgabentrennung

## ✅ Finale Validierung

Nach Abschluss aller drei Agenten:

```bash
cd <pfad-zum-repo>/Schichtklar

# Alle Branches mergen
git checkout main
git merge agent1-mui-grid-fixes
git merge agent2-api-routes-fixes
git merge agent3-type-system-fixes

# Finale Prüfung
npx tsc --noEmit --skipLibCheck 2>&1 | wc -l
npm run build
```

## 📊 Fortschritt verfolgen

Jeder Agent sollte regelmäßig dokumentieren:

```bash
# Fehlerstand vorher
echo "Vorher: $(npx tsc --noEmit --skipLibCheck 2>&1 | wc -l) Fehler" >> PROGRESS.md

# Nach Änderungen
echo "Nachher: $(npx tsc --noEmit --skipLibCheck 2>&1 | wc -l) Fehler" >> PROGRESS.md
```

## 🎯 Ziel

- **Aktuell:** ~1501 TypeScript-Fehler
- **Ziel:** < 100 TypeScript-Fehler
- **Priorität:** Kritische Fehler zuerst (Build-Blocker)
