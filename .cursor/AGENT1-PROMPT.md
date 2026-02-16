# Agent 1: MUI Grid & UI-Komponenten Spezialist

## 🎯 Deine Aufgabe

Behebe alle Grid-Komponenten-Fehler und MUI-bezogene TypeScript-Probleme in der JobFlow-App.

## 📋 Spezifische Fehler, die du beheben musst

### 1. Grid-Komponenten-Fehler

- **Datei:** `app/(employee)/employee/dashboard/page.tsx`
  - Zeile 284: `Grid item xs={12} md={8}` - `item` prop Fehler
  - Zeile 445: `Grid item xs={12} md={4}` - `item` prop Fehler
- **Datei:** `components/admin/TemplateManager.tsx`
  - Zeile 375: `Grid item xs={12} md={6}` - `item` prop Fehler

### 2. Weitere MUI-Komponenten-Fehler

- **Datei:** `components/admin/TemplateManager.tsx`
  - Zeile 765: LoadingSpinner Props-Fehler
  - Zeile 393: FormControl onChange Handler Typ-Fehler

## 🔍 Schritt 1: Fehler identifizieren

```bash
# Finde alle Grid-Fehler
npx tsc --noEmit --skipLibCheck 2>&1 | grep -i "grid\|Grid" | head -30

# Prüfe MUI-Version
grep -r "@mui/material" package.json

# Zeige spezifische Fehler
npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "dashboard/page|TemplateManager" | head -20
```

## 🛠️ Schritt 2: Lösungsansätze

### Option A: Grid2 verwenden (MUI v6)

```typescript
import Grid2 from '@mui/material/Grid2';

// Dann verwenden:
<Grid2 xs={12} md={8}>
```

### Option B: Grid mit item prop (MUI v5)

```typescript
import Grid from '@mui/material/Grid';

// Dann verwenden:
<Grid container spacing={3}>
  <Grid item xs={12} md={8}>
```

**WICHTIG:** Prüfe zuerst, welche MUI-Version verwendet wird!

## 📝 Schritt 3: Dateien bearbeiten

1. **Öffne die Datei:**

   ```bash
   code app/(employee)/employee/dashboard/page.tsx
   ```

2. **Suche nach Grid-Komponenten:**
   - Finde alle `<Grid item` Vorkommen
   - Prüfe ob `container` prop vorhanden ist
   - Korrigiere entsprechend der MUI-Version

3. **Teste nach jeder Änderung:**
   ```bash
   npx tsc --noEmit --skipLibCheck 2>&1 | grep "dashboard/page"
   ```

## ✅ Erfolgskriterien

- [ ] Alle Grid-Komponenten-Fehler behoben
- [ ] Keine MUI-bezogenen TypeScript-Fehler mehr
- [ ] `npx tsc --noEmit --skipLibCheck` zeigt keine Grid-Fehler
- [ ] `npm run build` kompiliert ohne Grid-Warnungen

## 🚫 Was du NICHT anfassen sollst

- ❌ API-Routen (`app/api/`)
- ❌ Type-Definitionen (`lib/types/`)
- ❌ Hooks (`lib/hooks/`)
- ❌ Services (`lib/services/`)

## 📊 Fortschritt dokumentieren

Nach jeder behobenen Datei:

```bash
# Fehler vorher
npx tsc --noEmit --skipLibCheck 2>&1 | grep -i "grid" | wc -l > errors-before.txt

# Änderungen machen...

# Fehler nachher
npx tsc --noEmit --skipLibCheck 2>&1 | grep -i "grid" | wc -l > errors-after.txt
```

## 🎬 Start-Befehl

```bash
cd /Users/patrickschmidt/Desktop/Apps/JobFlow
git checkout -b agent1-mui-grid-fixes
npx tsc --noEmit --skipLibCheck 2>&1 | grep -i "grid\|mui" | head -30
```

**Viel Erfolg! 🚀**
