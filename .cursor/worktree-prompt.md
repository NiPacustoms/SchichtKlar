# Worktree Prompt: TypeScript-Fehlerbehebung mit 3 Agenten

## Kontext

Die JobFlow-App hat aktuell **~1501 TypeScript-Fehler**, die systematisch behoben werden müssen. Die Fehler wurden bereits teilweise reduziert (von ~1536), aber es bleiben noch kritische Probleme.

## Projekt-Struktur

- **Framework:** Next.js 15.5.6 mit TypeScript
- **UI-Library:** Material-UI (MUI)
- **Firebase:** Firestore für Backend
- **Hauptverzeichnis:** `/Users/patrickschmidt/Desktop/Apps/JobFlow`

## Aktuelle Fehlerkategorien

### 1. Grid-Komponenten-Fehler (MUI v5/v6 Inkompatibilität)

- `app/(employee)/employee/dashboard/page.tsx` - Grid `item` prop Fehler
- `components/admin/TemplateManager.tsx` - Grid `item` prop Fehler
- MUI Grid2 vs Grid Import-Probleme

### 2. API-Route-Fehler

- `app/api/chat/channels/route.ts` - `Boolean` wird als Funktion aufgerufen (Zeile 32, 118)
- `app/api/chat/direct/route.ts` - `Boolean` wird als Funktion aufgerufen (Zeile 76)

### 3. Type-Inkompatibilitäten

- `lib/hooks/useChat.ts` - ChatMessage vs Message Typ-Konvertierungen
- `app/(employee)/employee/zeiten/page.tsx` - `assignmentId` Property fehlt auf `TimeEntry`
- `app/(employee)/employee/zeiterfassung/page.tsx` - Timesheet Typ-Inkompatibilität
- `app/api/admin/shifts/route.ts` - `color` Property fehlt im Shift-Typ

### 4. Weitere TypeScript-Fehler

- Fehlende Properties in Interfaces
- Falsche Funktionssignaturen
- Implizite `any` Types

---

## Agent 1: MUI Grid & UI-Komponenten Spezialist

### Aufgabe

Behebe alle Grid-Komponenten-Fehler und MUI-bezogene TypeScript-Probleme.

### Spezifische Aufgaben

1. **Grid-Komponenten korrigieren:**
   - `app/(employee)/employee/dashboard/page.tsx` (Zeilen 284, 445)
   - `components/admin/TemplateManager.tsx` (Zeile 375)
   - Prüfe ob MUI Grid2 verwendet werden sollte oder Grid mit `item` prop
   - Stelle sicher, dass alle Grid-Imports korrekt sind

2. **Weitere MUI-Komponenten-Fehler:**
   - `components/admin/TemplateManager.tsx` - LoadingSpinner Props (Zeile 765)
   - `components/admin/TemplateManager.tsx` - FormControl onChange Handler (Zeile 393)

### Vorgehen

```bash
# 1. Finde alle Grid-Fehler
npx tsc --noEmit --skipLibCheck 2>&1 | grep -i "grid\|Grid"

# 2. Prüfe MUI-Version
grep -r "mui/material" package.json

# 3. Korrigiere Grid-Imports und Verwendung
```

### Erfolgskriterien

- Alle Grid-Komponenten-Fehler behoben
- Keine MUI-bezogenen TypeScript-Fehler mehr
- App kompiliert ohne Grid-bezogene Warnungen

---

## Agent 2: API Routes & Backend TypeScript Spezialist

### Aufgabe

Behebe alle API-Route-Fehler und Backend-bezogene TypeScript-Probleme.

### Spezifische Aufgaben

1. **Boolean-Funktions-Fehler:**
   - `app/api/chat/channels/route.ts` (Zeilen 32, 118)
   - `app/api/chat/direct/route.ts` (Zeile 76)
   - Finde wo `Boolean` fälschlicherweise als Funktion aufgerufen wird
   - Ersetze durch korrekte Typ-Prüfungen

2. **Shift API Route:**
   - `app/api/admin/shifts/route.ts` (Zeile 218)
   - Füge `color` Property zum Shift-Typ hinzu oder entferne es aus dem Payload

3. **Weitere API-Fehler:**
   - Prüfe alle API-Routen auf TypeScript-Fehler
   - Stelle sicher, dass alle Request/Response-Typen korrekt sind

### Vorgehen

```bash
# 1. Finde alle API-Route-Fehler
npx tsc --noEmit --skipLibCheck 2>&1 | grep "app/api"

# 2. Prüfe Boolean-Verwendungen
grep -rn "Boolean(" app/api/

# 3. Korrigiere Boolean-Aufrufe
```

### Erfolgskriterien

- Alle API-Route-Fehler behoben
- Keine `Boolean`-Funktions-Aufrufe mehr
- Alle API-Routen haben korrekte Typen

---

## Agent 3: Type-System & Hook Spezialist

### Aufgabe

Behebe alle Type-Inkompatibilitäten, Hook-Fehler und Type-System-Probleme.

### Spezifische Aufgaben

1. **useChat Hook:**
   - `lib/hooks/useChat.ts` - Alle verbleibenden ChatMessage/Message Konvertierungen
   - Stelle sicher, dass alle Callbacks korrekte Typen haben
   - Behebe `userId` undefined-Probleme

2. **TimeEntry & Timesheet Typen:**
   - `app/(employee)/employee/zeiten/page.tsx` - `assignmentId` Property hinzufügen
   - `app/(employee)/employee/zeiterfassung/page.tsx` - Timesheet Typ-Inkompatibilität beheben
   - Prüfe ob `TimeEntry` Interface erweitert werden muss

3. **Weitere Type-Fehler:**
   - `components/profile/ProfileForm.tsx` - Record<string, unknown> Typ-Fehler
   - `components/auth/RoleGuard.tsx` - `tenantId` Property fehlt
   - Alle impliziten `any` Types explizit typisieren

### Vorgehen

```bash
# 1. Finde alle Type-Fehler
npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "TS23|TS25|TS27|TS70"

# 2. Prüfe Hook-Fehler
npx tsc --noEmit --skipLibCheck 2>&1 | grep "hooks/"

# 3. Prüfe Component-Fehler
npx tsc --noEmit --skipLibCheck 2>&1 | grep "components/"

# 4. Analysiere Type-Definitionen
grep -r "interface TimeEntry\|type TimeEntry" lib/types/
```

### Erfolgskriterien

- Alle Type-Inkompatibilitäten behoben
- Keine impliziten `any` Types mehr
- Alle Hooks haben korrekte Typen
- Type-System ist konsistent

---

## Koordinations-Regeln

### Workflow

1. **Jeder Agent arbeitet in einem separaten Branch:**
   - `agent1-mui-grid-fixes`
   - `agent2-api-routes-fixes`
   - `agent3-type-system-fixes`

2. **Vor jeder Änderung:**

   ```bash
   # Aktuellen Fehlerstand dokumentieren
   npx tsc --noEmit --skipLibCheck 2>&1 | wc -l > errors-before.txt

   # Spezifische Fehler für diesen Agent
   npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "[RELEVANTE_PATTERNS]" > agent-errors.txt
   ```

3. **Nach jeder Änderung:**

   ```bash
   # Fehlerstand nach Änderung
   npx tsc --noEmit --skipLibCheck 2>&1 | wc -l > errors-after.txt

   # Build-Test
   npm run build 2>&1 | head -50
   ```

4. **Konflikte vermeiden:**
   - Agent 1: Arbeitet nur an UI-Komponenten
   - Agent 2: Arbeitet nur an API-Routen
   - Agent 3: Arbeitet nur an Types/Hooks
   - Bei Überschneidungen: Koordination erforderlich

### Kommunikation

- Jeder Agent dokumentiert seine Änderungen in `AGENT[X]-CHANGES.md`
- Kritische Änderungen werden vorher besprochen
- Merge-Konflikte werden sofort gemeldet

---

## Finale Validierung

Nach Abschluss aller drei Agenten:

```bash
# 1. Finale Fehlerprüfung
npx tsc --noEmit --skipLibCheck 2>&1 | wc -l

# 2. Build-Test
npm run build

# 3. Linter-Check
npm run lint 2>&1 | head -50

# 4. Kritische Dateien prüfen
npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "error TS" | head -20
```

## Ziel

- **Ziel:** < 100 TypeScript-Fehler (aktuell ~1501)
- **Priorität:** Kritische Fehler zuerst (Build-Blocker)
- **Qualität:** Keine neuen Fehler einführen

---

## Wichtige Dateien für Referenz

### Type-Definitionen

- `lib/types/index.ts` - Haupt-Type-Definitionen
- `lib/types/chat.ts` - Chat-Types
- `lib/types/chatChannels.ts` - ChatChannel-Types

### Services

- `lib/services/_chatService.impl.ts` - Chat-Service Implementation
- `lib/services/index.ts` - Service-Exports

### Hooks

- `lib/hooks/useChat.ts` - Chat-Hooks

### Komponenten

- `components/admin/TemplateManager.tsx` - Template-Manager
- `app/(employee)/employee/dashboard/page.tsx` - Dashboard

### API Routes

- `app/api/chat/channels/route.ts` - Chat-Channels API
- `app/api/chat/direct/route.ts` - Direct-Chat API
- `app/api/admin/shifts/route.ts` - Shifts API

---

## Start-Befehl für jeden Agenten

```bash
# Agent 1
cd /Users/patrickschmidt/Desktop/Apps/JobFlow
git checkout -b agent1-mui-grid-fixes
# Beginne mit: npx tsc --noEmit --skipLibCheck 2>&1 | grep -i "grid\|mui" | head -30

# Agent 2
cd /Users/patrickschmidt/Desktop/Apps/JobFlow
git checkout -b agent2-api-routes-fixes
# Beginne mit: npx tsc --noEmit --skipLibCheck 2>&1 | grep "app/api" | head -30

# Agent 3
cd /Users/patrickschmidt/Desktop/Apps/JobFlow
git checkout -b agent3-type-system-fixes
# Beginne mit: npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "TS23|TS25|TS27|TS70" | head -50
```

---

**Viel Erfolg! 🚀**
