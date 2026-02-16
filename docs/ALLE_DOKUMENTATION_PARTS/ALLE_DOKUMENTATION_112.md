# JobFlow – Dokumentation Teil 112

*Zeichen 2205502–2225369 von 2862906*

---

```typescript
// lib/services/timesheets.ts

async update(id: string, data: Partial<TimesheetForm>): Promise<void> {
  // KRITISCH: Status prüfen
  const currentDoc = await getDoc(doc(db, COLLECTION_NAME, id));
  if (!currentDoc.exists()) throw new Error('Timesheet not found');
  
  const currentData = currentDoc.data() as FirestoreTimesheetData;
  if (currentData.status === 'approved' || currentData.status === 'submitted') {
    throw new Error('Cannot update approved or submitted timesheet');
  }
  
  // ... rest of update logic
}

async delete(id: string): Promise<void> {
  // KRITISCH: Status prüfen
  const currentDoc = await getDoc(doc(db, COLLECTION_NAME, id));
  if (!currentDoc.exists()) throw new Error('Timesheet not found');
  
  const currentData = currentDoc.data() as FirestoreTimesheetData;
  if (currentData.status === 'approved' || currentData.status === 'submitted') {
    throw new Error('Cannot delete approved or submitted timesheet');
  }
  
  await deleteDoc(doc(db, COLLECTION_NAME, id));
}

async approve(id: string, approvedBy: string): Promise<void> {
  // KRITISCH: Doppelprüfung
  const currentDoc = await getDoc(doc(db, COLLECTION_NAME, id));
  if (!currentDoc.exists()) throw new Error('Timesheet not found');
  
  const currentData = currentDoc.data() as FirestoreTimesheetData;
  if (currentData.status === 'approved') {
    throw new Error('Timesheet already approved');
  }
  
  // ... rest of approve logic
}
```

---

### 8.3 Ruhezeiten-Validierung - KRITISCH

**MUSS SOFORT implementiert werden:**

```typescript
// functions/src/timesheetValidationUtils.ts

async function validateRestTime(
  userId: string,
  newStartTime: Date,
  excludeTimesheetId?: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  
  // Finde letzte Schicht des Users
  const lastTimesheet = await db
    .collection('timesheets')
    .where('userId', '==', userId)
    .where('status', 'in', ['submitted', 'approved'])
    .orderBy('date', 'desc')
    .orderBy('endTime', 'desc')
    .limit(1)
    .get();
  
  if (!lastTimesheet.empty) {
    const last = lastTimesheet.docs[0].data();
    const lastEndTime = new Date(`${last.date}T${last.endTime}`);
    const restHours = (newStartTime.getTime() - lastEndTime.getTime()) / (1000 * 60 * 60);
    
    if (restHours < 11) {
      errors.push(
        `Ruhezeit von ${restHours.toFixed(1)}h unterschreitet das Minimum von 11h (ArbZG §5)`
      );
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  };
}
```

---

## 9. FAZIT

### 9.1 Richterliche Bewertung

**Das System ist NICHT rechtskonform und darf nicht im Produktivbetrieb verwendet werden.**

**Begründung:**
1. GoBD-Verstöße: Genehmigte Timesheets können manipuliert werden
2. ArbZG-Verstöße: Ruhezeiten werden nicht geprüft
3. Haftungsrisiko: Geschäftsführung haftet für Verstöße
4. Bußgeld-Risiko: Bis zu 65.000 € + Strafverfolgung

### 9.2 Empfehlung

**SOFORT:**
1. System aus Produktivbetrieb nehmen
2. Kritische Verstöße beheben (Priorität 1)
3. Rechtliche Beratung einholen
4. Nach Behebung: Externe Compliance-Prüfung

**NACH BEHEBUNG:**
1. Externe Auditierung durch Rechtsanwalt
2. Compliance-Zertifizierung
3. Regelmäßige Compliance-Prüfungen

---

**Bewertet von:** KI-Assistent (Richterliche Prüfung)  
**Datum:** 2025-01  
**Nächste Prüfung:** Nach Behebung der kritischen Verstöße

---

## 10. ANHANG: CODE-BEWEISE

### 10.1 Firestore Rules - Aktueller Stand

```javascript
// firestore.rules Zeile 240-242
allow update, delete: if isAuthenticated() && (
  resource.data.userId == request.auth.uid || isAdmin()
);
// ❌ KEINE Status-Prüfung!
```

### 10.2 Client-Service Update - Aktueller Stand

```typescript
// lib/services/timesheets.ts Zeile 284-321
async update(id: string, data: Partial<TimesheetForm>): Promise<void> {
  // ... KEINE Status-Prüfung!
  await updateDoc(timesheetRef, updateData);
}
```

### 10.3 Ruhezeiten - Fehlend

```typescript
// Suche nach "restTime", "Ruhezeit", "11" in timesheetValidation.ts
// → KEINE Treffer
// → Validierung fehlt komplett
```

---

**ENDE DER BEWERTUNG**


```

---

## Chat

*5 Dateien*

### 📄 CHAT_FIRESTORE_INDEXE.md

```markdown
# Chat-System - Firestore Indexe

**Datum:** 2025-01-27  
**Zweck:** Dokumentation der benötigten Firestore Composite Indexe für das Chat-System

---

## 1. Übersicht

Das Chat-System verwendet mehrere Firestore-Queries, die Composite Indexe erfordern. Diese werden automatisch von Firestore vorgeschlagen, wenn die Query zum ersten Mal ausgeführt wird.

---

## 2. Benötigte Indexe

### 2.1 chatChannels Collection

#### Index 1: Channel-Liste mit Archivierungs-Filter

**Collection:** `chatChannels`  
**Felder:**
- `participants` (Array-contains)
- `archived` (==)
- `updatedAt` (desc)

**Verwendung:** `useChatChannels` Hook - Lädt alle nicht-archivierten Channels für einen User

**Query:**
```typescript
query(
  collection(db, 'chatChannels'),
  where('participants', 'array-contains', uid),
  where('archived', '==', false),
  orderBy('updatedAt', 'desc')
)
```

**Firestore Console Link:**  
Wird automatisch generiert, wenn die Query zum ersten Mal ausgeführt wird.

**Manuelle Erstellung:**
1. Firebase Console öffnen
2. Firestore Database → Indexes
3. "Create Index" klicken
4. Collection: `chatChannels`
5. Felder hinzufügen:
   - `participants` (Array-contains, Ascending)
   - `archived` (Ascending)
   - `updatedAt` (Descending)
6. Index erstellen

---

### 2.2 chatChannels/{channelId}/messages Subcollection

#### Index 1: Nachrichten-Laden (Pagination)

**Collection:** `chatChannels/{channelId}/messages`  
**Felder:**
- `createdAt` (asc)

**Verwendung:** `useChatMessages` Hook - Lädt Nachrichten für einen Channel

**Query:**
```typescript
query(
  collection(db, `chatChannels/${channelId}/messages`),
  orderBy('createdAt', 'asc'),
  limit(50)
)
```

**Hinweis:** Dieser Index ist normalerweise nicht erforderlich, da nur ein Feld sortiert wird. Firestore erstellt automatisch einen Single-Field-Index.

---

## 3. Index-Erstellung

### 3.1 Automatische Erstellung

Firestore schlägt automatisch fehlende Indexe vor, wenn eine Query ausgeführt wird:

1. Query ausführen (z.B. Chat-Seite öffnen)
2. Fehler in der Konsole prüfen
3. Link zu Firebase Console folgen
4. Index erstellen

### 3.2 Manuelle Erstellung

**Firebase Console:**
1. https://console.firebase.google.com öffnen
2. Projekt auswählen
3. Firestore Database → Indexes
4. "Create Index" klicken
5. Felder gemäß Dokumentation hinzufügen
6. Index erstellen (kann einige Minuten dauern)

**Firebase CLI:**
```bash
# firestore.indexes.json erstellen (falls nicht vorhanden)
firebase init firestore

# Indexe deployen
firebase deploy --only firestore:indexes
```

---

## 4. Index-Status prüfen

### 4.1 Firebase Console

1. Firestore Database → Indexes
2. Status prüfen:
   - **Building**: Index wird erstellt
   - **Enabled**: Index ist aktiv
   - **Error**: Fehler beim Erstellen

### 4.2 Firebase CLI

```bash
firebase firestore:indexes
```

---

## 5. Performance-Hinweise

### 5.1 Index-Größe

- Indexe benötigen Speicherplatz
- Große Collections können große Indexe erzeugen
- Regelmäßige Überprüfung der Index-Größe empfohlen

### 5.2 Query-Optimierung

- Möglichst wenige `where`-Klauseln verwenden
- `limit` verwenden, um Datenmenge zu begrenzen
- Composite Indexe nur bei Bedarf erstellen

---

## 6. Troubleshooting

### Problem: Query schlägt fehl mit "index required"

**Lösung:**
1. Fehlermeldung in der Konsole prüfen
2. Link zu Firebase Console folgen
3. Index erstellen
4. Warten bis Index aktiv ist (Status: "Enabled")

### Problem: Index wird nicht erstellt

**Lösung:**
1. Firebase Console → Firestore → Indexes prüfen
2. Manuell erstellen (siehe Abschnitt 3.2)
3. Firestore Rules prüfen (Zugriff erlaubt?)

### Problem: Query ist langsam

**Lösung:**
1. Index-Status prüfen (Enabled?)
2. Query optimieren (weniger `where`-Klauseln)
3. `limit` verwenden
4. Composite Indexe prüfen

---

## 7. Checkliste

- [ ] Index für `chatChannels` mit `participants`, `archived`, `updatedAt` erstellt
- [ ] Index-Status: "Enabled"
- [ ] Query funktioniert ohne Fehler
- [ ] Performance akzeptabel

---

**Erstellt:** 2025-01-27  
**Nächste Prüfung:** Bei neuen Queries oder Performance-Problemen


```

---

### 📄 CHAT_FUNKTIONSFÄHIGKEITSPRÜFUNG.md

```markdown
# Chat-System - Vollständige Funktionsfähigkeitsprüfung

**Datum:** 2025-01-27  
**Prüfungsbereich:** Vollständiges Chat-System (Employee & Admin)

---

## 1. Übersicht

Das Chat-System ermöglicht interne Kommunikation zwischen Admin, Dispatcher und Mitarbeitern. Es basiert auf Firestore mit Echtzeit-Updates.

---

## 2. Service-Layer (`lib/services/_chatService.impl.ts`)

### 2.1 Channel-Management ✅

| Funktion | Status | Implementierung | Bewertung |
|----------|--------|-----------------|-----------|
| **getChannelsForUser** | ✅ | Zeile 6-16 | ✅ **FUNKTIONSFÄHIG** |
| **createChannel** | ✅ | Zeile 18-39 | ✅ **FUNKTIONSFÄHIG** |
| **onMessages** (Realtime) | ✅ | Zeile 41-51 | ✅ **FUNKTIONSFÄHIG** |

**Details:**
- ✅ Channels werden nach `participants` gefiltert
- ✅ Sortierung nach `updatedAt` desc
- ✅ Realtime-Updates über `onSnapshot`
- ✅ Channel-Erstellung mit Validierung

### 2.2 Message-Management ✅

| Funktion | Status | Implementierung | Bewertung |
|----------|--------|-----------------|-----------|
| **getMessages** | ✅ | Zeile 53-76 | ✅ **FUNKTIONSFÄHIG** |
| **sendMessage** | ✅ | Zeile 78-126 | ✅ **FUNKTIONSFÄHIG** |
| **markAsRead** | ✅ | Zeile 128-142 | ✅ **FUNKTIONSFÄHIG** |
| **markChannelAsRead** | ✅ | Zeile 144-183 | ✅ **FUNKTIONSFÄHIG** |

**Details:**
- ✅ Pagination mit `limit` und `before` (QueryDocumentSnapshot)
- ✅ Validierung: Channel existiert, User ist Teilnehmer
- ✅ Automatisches Holen von `senderName` aus User-Dokument
- ✅ `readBy` Array wird korrekt aktualisiert
- ✅ Batch-Update für `markChannelAsRead` (max 20 Nachrichten)

### 2.3 File-Upload ✅

| Funktion | Status | Implementierung | Bewertung |
|----------|--------|-----------------|-----------|
| **uploadAttachment** | ✅ | Zeile 185-230 | ✅ **FUNKTIONSFÄHIG** |

**Details:**
- ✅ Dateigrößen-Validierung: Max 10MB
- ✅ Dateityp-Validierung: Nur Bilder und PDFs
- ✅ Upload-Progress-Callback unterstützt
- ✅ Dateiname-Sanitization
- ✅ UUID-basierte Pfade für Kollisionsvermeidung

**Status:** ✅ **VOLLSTÄNDIG FUNKTIONSFÄHIG**

---

## 3. Hooks (`lib/hooks/`)

### 3.1 useChatChannels ✅

**Datei:** `lib/hooks/useChatChannels.ts`

| Funktion | Status | Implementierung |
|----------|--------|-----------------|
| **Realtime Channels** | ✅ | Zeile 12-39 |
| **createChannel** | ✅ | Zeile 41-50 |

**Details:**
- ✅ Realtime-Updates über `onSnapshot`
- ✅ Filterung nach `participants`
- ✅ Error-Handling implementiert

**Status:** ✅ **FUNKTIONSFÄHIG**

### 3.2 useChatMessages ✅

**Datei:** `lib/hooks/useChatMessages.ts`

| Funktion | Status | Implementierung |
|----------|--------|-----------------|
| **Initial Load** | ✅ | Zeile 16-38 |
| **Realtime Updates** | ✅ | Zeile 41-60 |
| **Load More (Pagination)** | ✅ | Zeile 62-87 |
| **markAsRead** | ✅ | Zeile 89-95 |
| **markChannelAsRead** | ✅ | Zeile 97-103 |

**Details:**
- ✅ Initial Load: 50 Nachrichten
- ✅ Realtime-Updates: Merge-Logik für neue/aktualisierte Nachrichten
- ✅ Pagination: `loadMore` mit `before`-Cursor
- ✅ Duplikat-Vermeidung durch ID-Check

**Status:** ✅ **FUNKTIONSFÄHIG**

### 3.3 useChat (useChannels, useMessages, useTyping) ✅

**Datei:** `lib/hooks/useChat.ts`

| Hook | Status | Implementierung |
|------|--------|-----------------|
| **useChannels** | ✅ | Zeile 7-80 |
| **useMessages** | ✅ | Zeile 83-306 |
| **useFileUpload** | ✅ | Zeile 309-349 |
| **useChatUsers** | ✅ | Zeile 352-379 |
| **useDirectChat** | ✅ | Zeile 382-407 |
| **useChatState** | ✅ | Zeile 410-446 |
| **useTyping** | ✅ | Zeile 449-507 |

**Details:**
- ✅ **useChannels:** CRUD-Operationen für Channels
- ✅ **useMessages:** Optimistic Updates, Pagination, Mark as Read
- ✅ **useFileUpload:** Upload mit Progress, Error-Handling
- ✅ **useChatUsers:** Laden aller Chat-User
- ✅ **useDirectChat:** Get-or-Create für Direkt-Chats
- ✅ **useChatState:** State-Management für UI
- ✅ **useTyping:** Typing-Indicators mit Auto-Timeout

**Status:** ✅ **VOLLSTÄNDIG FUNKTIONSFÄHIG**

### 3.4 useSendMessage ✅

**Datei:** `lib/hooks/useSendMessage.ts`

| Funktion | Status | Implementierung |
|----------|--------|-----------------|
| **sendMessage** | ✅ | Zeile 11-38 |
| **sendMessageWithAttachment** | ✅ | Zeile 40-77 |

**Details:**
- ✅ Text-Nachrichten mit Validierung
- ✅ Attachment-Upload mit Progress-Tracking
- ✅ Error-Handling

**Status:** ✅ **FUNKTIONSFÄHIG**

---

## 4. UI-Komponenten

### 4.1 Chat-Seite (`app/(employee)/employee/chat/page.tsx`) ✅

| Feature | Status | Implementierung |
|---------|--------|-----------------|
| **Channel-Liste** | ✅ | Zeile 125-129 |
| **Chat-View** | ✅ | Zeile 141-162 |
| **Mobile/Desktop Layout** | ✅ | Zeile 109-183 |
| **New Chat Dialog** | ✅ | Zeile 203-210 |

**Details:**
- ✅ Responsive Design (Mobile/Desktop)
- ✅ Split-View auf Desktop
- ✅ Single-View auf Mobile
- ✅ FAB für neue Chats auf Mobile

**Status:** ✅ **FUNKTIONSFÄHIG**

### 4.2 ChannelList ✅

**Datei:** `app/(employee)/employee/chat/components/ChannelList.tsx`

| Feature | Status | Implementierung |
|---------|--------|-----------------|
| **Suche** | ✅ | Zeile 42, 51-62 |
| **Channel-Anzeige** | ✅ | Zeile 205-319 |
| **Unread Badges** | ✅ | Zeile 122-125, 206, 233-235 |
| **Channel-Icons** | ✅ | Zeile 82-93 |
| **Zeitformatierung** | ✅ | Zeile 96-119 |

**Details:**
- ✅ Suche filtert nach Name und letzter Nachricht
- ✅ Unread-Count wird angezeigt
- ✅ Icons für verschiedene Channel-Typen
- ✅ Relative Zeitformatierung (heute, diese Woche, Datum)

**Status:** ✅ **FUNKTIONSFÄHIG**

### 4.3 ChatView ✅

**Datei:** `app/(employee)/employee/chat/components/ChatView.tsx`

| Feature | Status | Implementierung |
|---------|--------|-----------------|
| **Message-Liste** | ✅ | Zeile 70-81 |
| **Auto-Scroll** | ✅ | Zeile 103-107 |
| **Infinite Scroll** | ✅ | Zeile 132-134 |
| **Mark as Read** | ✅ | Zeile 110-121 |
| **Typing Indicators** | ✅ | Zeile 85, 88-95 |
| **Broadcast-Check** | ✅ | Zeile 97-100 |

**Details:**
- ✅ Auto-Scroll nur wenn User am Ende war
- ✅ Infinite Scroll lädt mehr Nachrichten beim Scrollen nach oben
- ✅ Batch-Mark-as-Read für alle ungelesenen Nachrichten
- ✅ Typing-Indicators werden angezeigt
- ✅ Broadcast-Channels: Nur Admin/Dispatcher können schreiben

**Status:** ✅ **FUNKTIONSFÄHIG**

### 4.4 MessageInput ✅

**Datei:** `app/(employee)/employee/chat/components/MessageInput.tsx`

| Feature | Status | Implementierung |
|---------|--------|-----------------|
| **Text-Input** | ✅ | Zeile 38, 250-281 |
| **File-Upload** | ✅ | Zeile 106-138 |
| **Attachment-Preview** | ✅ | Zeile 172-195 |
| **Upload-Progress** | ✅ | Zeile 198-205 |
| **Typing-Indicator** | ✅ | Zeile 48-69, 144-158 |
| **Enter-to-Send** | ✅ | Zeile 99-104 |

**Details:**
- ✅ Multiline-Input mit max 4 Zeilen
- ✅ File-Upload mit Drag & Drop (über Input)
- ✅ Attachment-Vorschau mit Entfernen-Funktion
- ✅ Upload-Progress-Anzeige
- ✅ Typing-Indicator mit Debounce (2 Sekunden)
- ✅ Enter zum Senden, Shift+Enter für neue Zeile

**Status:** ✅ **FUNKTIONSFÄHIG**

### 4.5 NewChatDialog ✅

**Datei:** `app/(employee)/employee/chat/components/NewChatDialog.tsx`

| Feature | Status | Implementierung |
|---------|--------|-----------------|
| **Chat-Typ-Auswahl** | ✅ | Zeile 42, 216-273 |
| **User-Auswahl** | ✅ | Zeile 292-383 |
| **Rollen-Prüfung** | ✅ | Zeile 52-54, 90-96, 117-120 |
| **Direkt-Chat** | ✅ | Zeile 74-100 |
| **Gruppen-Chat** | ✅ | Zeile 101-114 |
| **Broadcast-Chat** | ✅ | Zeile 115-133 |

**Details:**
- ✅ Chat-Typ: Direct, Group, Broadcast
- ✅ Rollen-Prüfung: Mitarbeiter können nur Admin/Dispatcher kontaktieren
- ✅ Broadcast nur für Admin/Dispatcher
- ✅ Gruppen-Chat nur für Admin/Dispatcher
- ✅ User-Autocomplete mit Filterung

**Status:** ✅ **FUNKTIONSFÄHIG**

---

## 5. Cloud Functions

### 5.1 onMessageCreate ✅

**Datei:** `functions/src/chat/onMessageCreate.ts`

| Funktion | Status | Implementierung |
|----------|--------|-----------------|
| **lastMessage Update** | ✅ | Zeile 33-39, 56-59 |
| **unreadCount Berechnung** | ✅ | Zeile 49-53 |
| **updatedAt Update** | ✅ | Zeile 58 |
| **senderName Fallback** | ✅ | Zeile 18-31 |

**Details:**
- ✅ Aktualisiert `lastMessage` im Channel
- ✅ Berechnet `unreadCount` (alle Teilnehmer außer Sender)
- ✅ Aktualisiert `updatedAt` für Sortierung
- ✅ Holt `senderName` aus User-Dokument falls fehlend

**Status:** ✅ **FUNKTIONSFÄHIG**

### 5.2 Fehlende Cloud Functions ⚠️

| Funktion | Status | Implementierung |
|----------|--------|-----------------|
| **onChannelCreate** | ❌ | Nicht gefunden |
| **onChannelUpdate** | ❌ | Nicht gefunden |

**Hinweis:** Laut `tasks/chat.todo.md` sollte `onChannelCreate` für Validierung und Normalisierung vorhanden sein. Aktuell wird die Validierung client-seitig durchgeführt.

**Status:** ⚠️ **TEILWEISE** - Validierung funktioniert, aber nicht server-seitig

---

## 6. Security Rules

### 6.1 Firestore Rules ✅

**Datei:** `firestore.rules`

| Regel | Status | Implementierung |
|-------|--------|-----------------|
| **chatChannels Read** | ✅ | Zeile 719 |
| **chatChannels Create** | ✅ | Zeile 720 |
| **chatChannels Update/Delete** | ✅ | Zeile 721 |
| **messages Read/Create** | ✅ | Zeile 724 |
| **messages Update/Delete** | ✅ | Zeile 725 |

**Details:**
- ✅ Channels: Nur Teilnehmer können lesen
- ✅ Channels: Nur Admin/Dispatcher können erstellen
- ✅ Messages: Nur Teilnehmer können lesen/erstellen
- ✅ Messages: Update/Delete deaktiviert (MVP)

**Status:** ✅ **FUNKTIONSFÄHIG**

### 6.2 Broadcast-Beschränkung ⚠️

**Problem:** Die Firestore Rules prüfen nicht, ob Broadcast-Channels nur von Admin/Dispatcher beschrieben werden können.

**Aktuell:** Client-seitige Prüfung in `ChatView.tsx` Zeile 97-100

**Empfehlung:** Server-seitige Prüfung in Firestore Rules hinzufügen

**Status:** ⚠️ **TEILWEISE** - Funktioniert, aber nicht vollständig gesichert

---

## 7. API Routes

### 7.1 `/api/chat/channels` ✅

**Datei:** `app/api/chat/channels/route.ts`

| Endpoint | Status | Implementierung |
|----------|--------|-----------------|
| **GET** | ✅ | Zeile 8-67 |
| **POST** | ✅ | Zeile 70-154 |

**Details:**
- ✅ GET: Lädt Channels für User
- ✅ POST: Erstellt Channel mit Rollen-Prüfung
- ✅ Broadcast-Prüfung: Nur Admin/Dispatcher

**Status:** ✅ **FUNKTIONSFÄHIG**

### 7.2 `/api/chat/messages` ✅

**Datei:** `app/api/chat/messages/route.ts`

| Endpoint | Status | Implementierung |
|----------|--------|-----------------|
| **GET** | ✅ | Zeile 8-94 |
| **POST** | ✅ | Zeile 97-190 |

**Details:**
- ✅ GET: Lädt Nachrichten für Channel
- ✅ POST: Sendet Nachricht mit Validierung
- ✅ Broadcast-Prüfung: Nur Admin/Dispatcher können schreiben

**Status:** ✅ **FUNKTIONSFÄHIG**

---

## 8. Typen & Interfaces

### 8.1 Chat-Typen ✅

**Datei:** `lib/types/chatChannels.ts`

| Typ | Status | Felder |
|-----|--------|--------|
| **ChatChannel** | ✅ | id, name, type, participants, createdBy, createdAt, updatedAt, facilityId, lastMessage |
| **ChatMessage** | ✅ | id, text, type, senderId, senderName, createdAt, readBy, attachments |
| **ChatAttachment** | ✅ | name, url, mime, size |
| **CreateChannelInput** | ✅ | name, participants, type, createdBy, facilityId |
| **SendMessageInput** | ✅ | text, senderId, senderName, attachments |

**Status:** ✅ **VOLLSTÄNDIG**

---

## 9. Fehlende Funktionen

### 9.1 Archivierung ⚠️

**Anforderung:** Channels archivieren (ausblenden, nicht löschen)

**Status:** ❌ **NICHT IMPLEMENTIERT**

**Empfehlung:** `archived`-Feld zu `ChatChannel` hinzufügen und Filter in `ChannelList` implementieren

### 9.2 Nachrichten bearbeiten/löschen ⚠️

**Anforderung:** Nachrichten bearbeiten und löschen

