# Firebase Setup für JobFlow

## Problem

Die Anwendung zeigt Firebase-Fehler wegen fehlender Firestore-Indizes. Diese müssen erstellt werden, damit die komplexen Queries funktionieren.

## Schnelle Lösung

### Option 1: Automatische Index-Erstellung (Empfohlen)

```bash
# Stelle sicher, dass du in der Projekt-Root bist
node scripts/create-firestore-indexes.js
```

### Option 2: Firebase CLI

```bash
# Firebase CLI installieren (falls nicht vorhanden)
npm install -g firebase-tools

# Bei Firebase anmelden
firebase login

# Indizes deployen
firebase deploy --only firestore:indexes
```

### Option 3: Manuelle Erstellung über Firebase Console

#### Direkte Links (aus den Fehlermeldungen):

1. **Assignments Index:**

   ```
   https://console.firebase.google.com/v1/r/project/jobflow25/firestore/indexes?create_composite=Ck1wcm9qZWN0cy9qb2JmbG93MjUvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2Fzc2lnbm1lbnRzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg4KCmFzc2lnbmVkQXQQAhoMCghfX25hbWVfXxAC
   ```

2. **Timesheets Index (by date):**

   ```
   https://console.firebase.google.com/v1/r/project/jobflow25/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9qb2JmbG93MjUvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3RpbWVzaGVldHMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaCAoEZGF0ZRABGgwKCF9fbmFtZV9fEAE
   ```

3. **Timesheets Index (by date range):**
   ```
   https://console.firebase.google.com/v1/r/project/jobflow25/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9qb2JmbG93MjUvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3RpbWVzaGVldHMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaCAoEZGF0ZRACGgwKCF9fbmFtZV9fEAI
   ```

## Benötigte Indizes

### Assignments Collection

- `userId` (ASC) + `assignedAt` (ASC)
- `userId` (ASC) + `assignedAt` (DESC)
- `shiftId` (ASC) + `assignedAt` (ASC)
- `status` (ASC) + `assignedAt` (DESC)
- `shiftId` (ASC) + `status` (ASC)

### Timesheets Collection

- `userId` (ASC) + `date` (ASC)
- `userId` (ASC) + `date` (DESC)
- `userId` (ASC) + `date` (Range Query)

## Temporäre Lösung

Falls die Indizes noch nicht erstellt sind, wurden die Services bereits vereinfacht, um die Fehler zu vermeiden. Die Queries funktionieren jetzt ohne `orderBy` und `range` Queries.

## Überprüfung

Nach der Index-Erstellung:

1. Die Fehler in der Browser-Konsole sollten verschwinden
2. Die Anwendung sollte normal funktionieren
3. Die Daten werden korrekt sortiert angezeigt

## Monitoring

Überwache die Firebase Console auf:

- **Index-Status:** https://console.firebase.google.com/project/jobflow25/firestore/indexes
- **Query-Performance:** Firestore > Usage
- **Fehler-Logs:** Firebase > Functions > Logs

## Troubleshooting

### Index wird nicht erstellt

- Überprüfe, ob du die richtigen Berechtigungen hast
- Stelle sicher, dass das Projekt korrekt konfiguriert ist
- Warte 5-10 Minuten, da Index-Erstellung Zeit braucht

### Queries funktionieren immer noch nicht

- Überprüfe die Index-Konfiguration
- Stelle sicher, dass alle benötigten Felder im Index enthalten sind
- Teste die Queries in der Firebase Console

### Performance-Probleme

- Überwache die Query-Performance in der Firebase Console
- Erwäge zusätzliche Indizes für häufig verwendete Queries
- Optimiere die Query-Struktur falls nötig
