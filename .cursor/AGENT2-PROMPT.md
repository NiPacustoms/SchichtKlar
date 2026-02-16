# Agent 2: API Routes & Backend TypeScript Spezialist

## 🎯 Deine Aufgabe

Behebe alle API-Route-Fehler und Backend-bezogene TypeScript-Probleme in der JobFlow-App.

## 📋 Spezifische Fehler, die du beheben musst

### 1. Boolean-Funktions-Fehler (KRITISCH)

- **Datei:** `app/api/chat/channels/route.ts`
  - Zeile 32: `Boolean` wird als Funktion aufgerufen
  - Zeile 118: `Boolean` wird als Funktion aufgerufen
- **Datei:** `app/api/chat/direct/route.ts`
  - Zeile 76: `Boolean` wird als Funktion aufgerufen

**Problem:** `Boolean` ist ein Konstruktor, keine Funktion. Verwende stattdessen:

- `!!value` oder
- `Boolean(value)` (wenn wirklich nötig) oder
- `value !== null && value !== undefined`

### 2. Shift API Route

- **Datei:** `app/api/admin/shifts/route.ts`
  - Zeile 218: `color` Property existiert nicht im Shift-Typ
  - Lösung: Entweder Property hinzufügen oder aus Payload entfernen

### 3. Weitere API-Fehler

- Prüfe alle API-Routen auf TypeScript-Fehler
- Stelle sicher, dass Request/Response-Typen korrekt sind

## 🔍 Schritt 1: Fehler identifizieren

```bash
# Finde alle API-Route-Fehler
npx tsc --noEmit --skipLibCheck 2>&1 | grep "app/api" | head -30

# Finde Boolean-Verwendungen
grep -rn "Boolean(" app/api/

# Zeige spezifische Fehler
npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "channels/route|direct/route|shifts/route" | head -20
```

## 🛠️ Schritt 2: Lösungsansätze

### Boolean-Fehler beheben

**FALSCH:**

```typescript
if (Boolean(someValue)) { ... }
```

**RICHTIG (Option 1 - Empfohlen):**

```typescript
if (someValue) { ... }
```

**RICHTIG (Option 2):**

```typescript
if (!!someValue) { ... }
```

**RICHTIG (Option 3 - Explizit):**

```typescript
if (someValue !== null && someValue !== undefined) { ... }
```

### Shift color Property

**Option A:** Property zum Typ hinzufügen

```typescript
// In lib/types/index.ts oder lib/services/shifts.ts
interface Shift {
  // ... andere Properties
  color?: string;
}
```

**Option B:** Aus Payload entfernen

```typescript
// In app/api/admin/shifts/route.ts
const shiftData = {
  // ... andere Properties
  // color: body.color || '#4CAF50', // ENTFERNEN
};
```

## 📝 Schritt 3: Dateien bearbeiten

1. **Öffne die Datei:**

   ```bash
   code app/api/chat/channels/route.ts
   ```

2. **Suche nach Boolean-Aufrufen:**

   ```bash
   grep -n "Boolean(" app/api/chat/channels/route.ts
   ```

3. **Korrigiere jeden Boolean-Aufruf:**
   - Prüfe den Kontext
   - Ersetze durch passende Prüfung
   - Teste die Logik

4. **Teste nach jeder Änderung:**
   ```bash
   npx tsc --noEmit --skipLibCheck 2>&1 | grep "channels/route"
   ```

## ✅ Erfolgskriterien

- [ ] Alle Boolean-Funktions-Aufrufe behoben
- [ ] Shift API Route `color` Property korrigiert
- [ ] Keine API-Route TypeScript-Fehler mehr
- [ ] `npx tsc --noEmit --skipLibCheck` zeigt keine API-Fehler
- [ ] `npm run build` kompiliert ohne API-Warnungen

## 🚫 Was du NICHT anfassen sollst

- ❌ UI-Komponenten (`components/`, `app/(employee)/`, `app/(admin)/`)
- ❌ Type-Definitionen (außer wenn nötig für API)
- ❌ Hooks (`lib/hooks/`)
- ❌ Services (außer wenn nötig für API)

## 📊 Fortschritt dokumentieren

Nach jeder behobenen Datei:

```bash
# Fehler vorher
npx tsc --noEmit --skipLibCheck 2>&1 | grep "app/api" | wc -l > errors-before.txt

# Änderungen machen...

# Fehler nachher
npx tsc --noEmit --skipLibCheck 2>&1 | grep "app/api" | wc -l > errors-after.txt
```

## 🎬 Start-Befehl

```bash
cd /Users/patrickschmidt/Desktop/Apps/JobFlow
git checkout -b agent2-api-routes-fixes
npx tsc --noEmit --skipLibCheck 2>&1 | grep "app/api" | head -30
```

**Viel Erfolg! 🚀**
