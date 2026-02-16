# Agent 3: Type-System & Hook Spezialist

## 🎯 Deine Aufgabe

Behebe alle Type-Inkompatibilitäten, Hook-Fehler und Type-System-Probleme in der JobFlow-App.

## 📋 Spezifische Fehler, die du beheben musst

### 1. useChat Hook Fehler

- **Datei:** `lib/hooks/useChat.ts`
  - ChatMessage vs Message Typ-Konvertierungen
  - `userId` undefined-Probleme in Callbacks
  - Attachment-Typ-Inkompatibilitäten
  - Channel-Typ-Konvertierungen

### 2. TimeEntry & Timesheet Typen

- **Datei:** `app/(employee)/employee/zeiten/page.tsx`
  - Zeile 180, 470, 475: `assignmentId` Property fehlt auf `TimeEntry`
  - Lösung: Property zum Interface hinzufügen oder Typ erweitern

- **Datei:** `app/(employee)/employee/zeiterfassung/page.tsx`
  - Zeile 434: Timesheet Typ-Inkompatibilität zwischen Service und Types

### 3. Component Type-Fehler

- **Datei:** `components/profile/ProfileForm.tsx`
  - Zeile 332: `Record<string, unknown>` Typ-Fehler

- **Datei:** `components/auth/RoleGuard.tsx`
  - Zeile 73: `tenantId` Property fehlt auf User-Typ

### 4. Weitere Type-Fehler

- Alle impliziten `any` Types explizit typisieren
- Type-Inkompatibilitäten zwischen verschiedenen Modulen

## 🔍 Schritt 1: Fehler identifizieren

```bash
# Finde alle Type-Fehler
npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "TS23|TS25|TS27|TS70" | head -50

# Finde Hook-Fehler
npx tsc --noEmit --skipLibCheck 2>&1 | grep "hooks/" | head -30

# Finde Component-Fehler
npx tsc --noEmit --skipLibCheck 2>&1 | grep "components/" | head -30

# Analysiere Type-Definitionen
grep -r "interface TimeEntry\|type TimeEntry" lib/types/
grep -r "interface Timesheet\|type Timesheet" lib/types/
```

## 🛠️ Schritt 2: Lösungsansätze

### TimeEntry assignmentId hinzufügen

**Option A:** Interface erweitern

```typescript
// In lib/types/index.ts oder entsprechender Datei
export interface TimeEntry {
  // ... bestehende Properties
  assignmentId?: string; // Optional hinzufügen
}
```

**Option B:** Typ-Assertion verwenden (wenn Property wirklich existiert)

```typescript
(e as any).assignmentId === activeWorkEntry.assignmentId;
```

### useChat Hook userId-Probleme

**Problem:** `userId` ist in Callbacks nicht verfügbar

**Lösung:** `userId` als Parameter übergeben oder aus Context holen

```typescript
const useMessages = (channelId: string | null, userId?: string) => {
  // userId ist jetzt verfügbar
};
```

### ChatMessage vs Message Konvertierung

**Problem:** Zwei verschiedene Message-Typen müssen konvertiert werden

**Lösung:** Explizite Konvertierungs-Funktion erstellen

```typescript
function convertChatMessageToMessage(msg: ChatMessage, channelId: string): Message {
  return {
    id: msg.id,
    channelId: channelId,
    userId: msg.senderId,
    content: msg.text || '',
    // ... weitere Konvertierungen
  };
}
```

## 📝 Schritt 3: Dateien bearbeiten

1. **Öffne die Datei:**

   ```bash
   code lib/hooks/useChat.ts
   ```

2. **Prüfe Type-Definitionen:**

   ```bash
   code lib/types/chat.ts
   code lib/types/chatChannels.ts
   ```

3. **Korrigiere Typ-Inkompatibilitäten:**
   - Füge fehlende Properties hinzu
   - Erstelle Konvertierungs-Funktionen
   - Typisiere alle `any` Types

4. **Teste nach jeder Änderung:**
   ```bash
   npx tsc --noEmit --skipLibCheck 2>&1 | grep "useChat\|TimeEntry\|Timesheet"
   ```

## ✅ Erfolgskriterien

- [ ] Alle Type-Inkompatibilitäten behoben
- [ ] Keine impliziten `any` Types mehr
- [ ] Alle Hooks haben korrekte Typen
- [ ] TimeEntry und Timesheet Typen konsistent
- [ ] `npx tsc --noEmit --skipLibCheck` zeigt keine Type-Fehler mehr
- [ ] `npm run build` kompiliert ohne Type-Warnungen

## 🚫 Was du NICHT anfassen sollst

- ❌ UI-Komponenten (außer Type-Definitionen)
- ❌ API-Routen (`app/api/`)
- ❌ MUI Grid-Komponenten

## 📊 Fortschritt dokumentieren

Nach jeder behobenen Datei:

```bash
# Fehler vorher
npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "TS23|TS25|TS27|TS70" | wc -l > errors-before.txt

# Änderungen machen...

# Fehler nachher
npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "TS23|TS25|TS27|TS70" | wc -l > errors-after.txt
```

## 🎬 Start-Befehl

```bash
cd /Users/patrickschmidt/Desktop/Apps/JobFlow
git checkout -b agent3-type-system-fixes
npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "TS23|TS25|TS27|TS70" | head -50
```

**Viel Erfolg! 🚀**
