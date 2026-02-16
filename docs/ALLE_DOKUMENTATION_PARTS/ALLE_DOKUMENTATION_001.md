# JobFlow – Dokumentation Teil 1

*Zeichen 1–19881 von 2862906*

---

# JobFlow – Konsolidierte Dokumentation

Diese Datei enthält den vollständigen Inhalt aller Projekt-Markdown-Dateien, zusammengeführt am 2026-02-16.

## Inhaltsverzeichnis (Quelldateien)

- .cursor/AGENT1-PROMPT.md
- .cursor/AGENT2-PROMPT.md
- .cursor/AGENT3-PROMPT.md
- .cursor/README-WORKTREE.md
- .cursor/chat-optimization-analysis.md
- .cursor/plans/code-bereinigung-jobflow-b40dd7ba.plan.md
- .cursor/plans/jobflow-vollst-ndige-implementierung-1bf43c8e.plan.md
- .cursor/plans/payroll-547c5e-97f79f44.plan.md
- .cursor/plans/static-templates.plan.md
- .cursor/rules/README.md
- .cursor/worktree-prompt.md
- .github/PULL_REQUEST_TEMPLATE.md
- APP_ZUSAMMENFASSUNG.md
- ARCHITECTURE_AUDIT_REPORT.md
- DEPENDENCY_CHECK_REPORT.md
- DEPENDENCY_MAINTENANCE_PLAN.md
- NOTEBOOKLM_APP_DOKUMENTATION.md
- README.md
- SECURITY.md
- SOTA_ANALYSE.md
- docs/ADMIN_GUIDE.md
- docs/API_MONITORING.md
- docs/ARCHITECTURE_AUDIT_REPORT.md
- docs/ARCHITECTURE_IMPLEMENTATION_ROADMAP.md
- docs/ASVS_CHECKLIST.md
- docs/CHANGELOG.md
- docs/CODEBASE_OVERVIEW.md
- docs/DEPENDENCY_CHECK_REPORT.md
- docs/DEPENDENCY_MAINTENANCE_PLAN.md
- docs/DESIGN_NEXT_LEVEL_PLAN.md
- docs/DESIGN_SYSTEM_2026.md
- docs/DISASTER_RECOVERY.md
- docs/DSGVO_PROZESSE.md
- docs/ENVIRONMENT_SETUP.md
- docs/ENV_EXAMPLE.md
- docs/ERROR_HANDLING.md
- docs/ESSENTIELLE_DOKUMENTATION.md
- docs/FCM_SETUP.md
- docs/FEHLERANALYSE.md
- docs/FIREBASE_CLEANUP_POLICY.md
- docs/FIREBASE_COSTS.md
- docs/FIREBASE_SERVICE_ACCOUNT_PERMISSIONS.md
- docs/FIREBASE_SERVICE_ACCOUNT_ROLES.md
- docs/FIREBASE_SETUP.md
- docs/FIREBASE_SETUP_GUIDE.md
- docs/FIX_STATUS.md
- docs/GO_LIVE_CHECKLIST.md
- docs/IMPLEMENTATION_GUIDE.md
- docs/INCIDENT_RUNBOOKS.md
- docs/KONSOLIDIERTE_DOKUMENTATION.md
- docs/LOHNABRECHNUNG_IMPLEMENTATION.md
- docs/LOHNABRECHNUNG_USER_GUIDE.md
- docs/MARKTREIFE_ANALYSE.md
- docs/NOTEBOOKLM_APP_DOKUMENTATION.md
- docs/NOTIFICATION_BELL_VARIANTS.md
- docs/NOTIFICATION_COVERAGE_ANALYSIS.md
- docs/PAYROLL_API_KONFIGURATION.md
- docs/PRODUCTION_BACKUP.md
- docs/PRODUCTION_ENVIRONMENT.md
- docs/PRODUCTION_MONITORING.md
- docs/PRODUCTION_READY_CHECKLIST.md
- docs/README.md
- docs/RECHTSKONFORMITÄT_ZEITERFASSUNG_2025.md
- docs/SERVICE_INTEGRATION.md
- docs/SLO_SLA.md
- docs/SOTA_ANALYSE.md
- docs/SYNTAX_FIXES_COMPLETE.md
- docs/SYNTAX_FIXES_FINAL.md
- docs/SYNTAX_FIXES_SUMMARY.md
- docs/TESTS.md
- docs/VERSION-VEROEFFENTLICHT-AUSCHECKEN.md
- docs/WORKTREE_NODE_MODULES_FIX.md
- docs/ZEITERFASSUNG_IMPLEMENTIERUNG.md
- docs/release/02_SECURITY_LEGAL_AUDIT.md
- docs/release/CONSOLE_LOG_CLEANUP_PLAN.md
- docs/release/PRODUCTION_READINESS_AUDIT_RE_RUN.md
- docs/release/SALES_READINESS_RE_AUDIT.md
- scripts/README-GITHUB-SECRETS.md
- scripts/README.md

---


---

## Quelle: .cursor/AGENT1-PROMPT.md

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

3. **Prüfe nach jeder Änderung:** `npx tsc --noEmit --skipLibCheck`

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



---

## Quelle: .cursor/AGENT2-PROMPT.md

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



---

## Quelle: .cursor/AGENT3-PROMPT.md

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



---

## Quelle: .cursor/README-WORKTREE.md

# Worktree Setup für 3 Agenten

## 🚀 Schnellstart

Jeder Agent hat seine eigene Prompt-Datei im `.cursor/` Verzeichnis:

- **Agent 1:** `.cursor/AGENT1-PROMPT.md` - MUI Grid & UI-Komponenten
- **Agent 2:** `.cursor/AGENT2-PROMPT.md` - API Routes & Backend
- **Agent 3:** `.cursor/AGENT3-PROMPT.md` - Type-System & Hooks

## 📁 Worktree erstellen

```bash
cd /Users/patrickschmidt/Desktop/Apps/JobFlow

# Agent 1 Worktree
git worktree add ../JobFlow-agent1 agent1-mui-grid-fixes
cd ../JobFlow-agent1
cat .cursor/AGENT1-PROMPT.md

# Agent 2 Worktree
cd /Users/patrickschmidt/Desktop/Apps/JobFlow
git worktree add ../JobFlow-agent2 agent2-api-routes-fixes
cd ../JobFlow-agent2
cat .cursor/AGENT2-PROMPT.md

# Agent 3 Worktree
cd /Users/patrickschmidt/Desktop/Apps/JobFlow
git worktree add ../JobFlow-agent3 agent3-type-system-fixes
cd ../JobFlow-agent3
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
cd ../JobFlow-agent1  # oder agent2/agent3

# 2. Prompt lesen
cat .cursor/AGENT1-PROMPT.md  # oder AGENT2/AGENT3

# 3. Fehler identifizieren (aus Prompt kopieren)
npx tsc --noEmit --skipLibCheck 2>&1 | grep -i "grid" | head -30

# 4. Änderungen machen
# ... Dateien bearbeiten ...

# 5. Committen
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
cd /Users/patrickschmidt/Desktop/Apps/JobFlow

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



---

## Quelle: .cursor/chat-optimization-analysis.md

# 🔍 Chat-Optimierungsanalyse

## 📊 Übersicht

Diese Analyse identifiziert Optimierungsmöglichkeiten für das Chat-System in JobFlow.

---

## 🚀 Performance-Optimierungen

### 1. **Auto-Scroll Optimierung** ⚠️ KRITISCH

**Problem:**

- Auto-Scroll wird bei JEDER Message-Änderung ausgelöst, auch wenn User nicht am Ende ist
- Führt zu störendem Scroll-Verhalten beim Lesen älterer Nachrichten

**Lösung:**

```typescript
// Nur scrollen wenn User bereits am Ende war
const [wasAtBottom, setWasAtBottom] = useState(true);

useEffect(() => {
  if (messagesEndRef.current && wasAtBottom) {
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }
}, [messages, wasAtBottom]);

// Scroll-Position tracken
const handleScroll = () => {
  if (messagesContainerRef.current) {
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setWasAtBottom(isNearBottom);
    setShowScrollButton(!isNearBottom);
  }
};
```

**Datei:** `app/(employee)/employee/chat/components/ChatView.tsx:67-71`

---

### 2. **Message-Gruppierung Memoization** ⚠️ WICHTIG

**Problem:**

- `groupMessagesByDate` wird bei jedem Render neu berechnet
- Bei vielen Messages = Performance-Problem

**Lösung:**

```typescript
const messageGroups = useMemo(() => {
  return groupMessagesByDate(messages);
}, [messages]);
```

**Datei:** `app/(employee)/employee/chat/components/ChatView.tsx:186`

---

### 3. **Batch markAsRead** ⚠️ WICHTIG

**Problem:**

- Jede unread Message wird einzeln markiert → viele Firestore-Writes
- Kann zu Rate-Limiting führen

**Lösung:**

```typescript
// Batch-Update implementieren
const markAllAsRead = useCallback(
  async (messageIds: string[], userId: string) => {
    if (!channelId || messageIds.length === 0) return;

    // Batch-Write in Firestore
    const batch = writeBatch(db);
    messageIds.forEach(messageId => {
      const messageRef = doc(db, 'messages', messageId);
      batch.update(messageRef, {
        readBy: arrayUnion(userId),
      });
    });
    await batch.commit();
  },
  [channelId]
);
```

**Datei:** `app/(employee)/employee/chat/components/ChatView.tsx:74-82`

---

### 4. **Message Pagination / Infinite Scroll** ⚠️ KRITISCH

**Problem:**

- Nur 50 Messages werden geladen (hard limit)
- Keine Möglichkeit, ältere Nachrichten zu laden
- Bei langen Chats = unvollständige Historie

**Lösung:**

```typescript
// In useMessages Hook:
const [hasMore, setHasMore] = useState(true);
const [lastMessage, setLastMessage] = useState<Message | null>(null);

const loadMoreMessages = useCallback(async () => {
  if (!channelId || !hasMore) return;

  const olderMessages = await chatService.getMessages(channelId, 50, lastMessage?.createdAt);

  if (olderMessages.length < 50) setHasMore(false);
  setMessages(prev => [...olderMessages, ...prev]);
  setLastMessage(olderMessages[0] || null);
}, [channelId, hasMore, lastMessage]);
```

**Dateien:**

- `lib/hooks/useChat.ts:83-106`
- `lib/services/chatService.ts:113-152`

---

### 5. **Virtualisierung für lange Listen** ⚠️ WICHTIG

**Problem:**

- Alle Messages werden gerendert, auch außerhalb Viewport
- Bei 100+ Messages = Performance-Probleme

**Lösung:**

- React-Window oder react-virtualized verwenden
- Nur sichtbare Messages rendern

**Datei:** `app/(employee)/employee/chat/components/ChatView.tsx:315-360`

---

### 6. **Decryption Optimierung** ⚠️ WICHTIG

**Problem:**

- Decryption passiert synchron in `subscribeToMessages`
- Kann UI blockieren bei vielen verschlüsselten Messages

**Lösung:**

```typescript
// Parallel decryption mit Promise.all
