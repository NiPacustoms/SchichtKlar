# Datenbank-Schema (Cloud Firestore)

**Stand:** 10.07.2026 · Schichtklar
**Quelle:** `firestore.rules`, `firestore.indexes.json`, Service-Layer (`lib/services/*`). Single-Tenant-Modell (1 Kunde = 1 Firebase-Projekt).

## Collections

| Collection | Inhalt | Zugriff (vereinfacht) |
|---|---|---|
| `users/{uid}` | Mitarbeiter-/Admin-Stammdaten, Rolle, Qualifikationen, `companyId` | Eigenes Dokument lesbar; Rollen-/`companyId`-Felder **nicht** selbst änderbar (Rules-Guard gegen Privilege Escalation); Admin verwaltet alle |
| `facilities/{id}` | Kunden/Einrichtungen | Admin (mit `companyId`-Isolation) |
| `shifts/{id}` | Schichten/Angebote | Lesen: alle Authentifizierten (offene Schichten); Schreiben: Admin |
| `assignments/{id}` | Einsätze (Mitarbeiter↔Schicht), Status-Workflow, `signatureSchedule` | Besitzer/Admin lesen; Admin schreibt; Mitarbeiter eigene Zusage |
| `timesheets/{id}` | Zeiterfassung; GoBD: approved/submitted unveränderlich | Besitzer/Admin; nach Freigabe schreibgeschützt |
| `times/{id}` | Zeiteinträge (work/break/sick); work/break benötigen `assignmentId` | Besitzer/Admin |
| `documents/{id}` | Mitarbeiterdokumente (Zeugnisse etc.) | Besitzer/Admin; Datei in Storage |
| `reports/{id}`, `employeeReports/{id}` | Berichte | Besitzer/Admin lesen; Admin schreibt |
| `limitIncreaseRequests/{id}` | Anträge auf Wochenstunden-Erhöhung | Antragsteller/Admin |
| `alerts/{id}`, `notifications/{id}` | Warnungen/Benachrichtigungen | Besitzer/Admin, `companyId`-Kontext |
| `activities/{id}` | Aktivitäts-Log | Admin (mit `companyId`) |
| `adminAnnouncements/{id}` | Ankündigungen | Lesen: alle; Schreiben: Admin |
| `settings`, `systemSettings`, `adminSettings`, `config` | System-/App-Konfiguration | Admin (config lesen: alle) |
| `adminRoles/{id}` | Benutzerdefinierte Rollen | Admin; Nutzer liest eigene zugewiesene Rolle |
| `documentTypes/{id}`, `adminDocumentTypes/{id}` | Dokumenttyp-Katalog | Lesen: alle; Schreiben: Admin |
| `auditLogs/{id}` | Unveränderliches Audit-Log (GoBD) | Lesen: Admin; Schreiben: nur Cloud Functions (Rules verbieten Client-Writes) |
| `route_cache/{id}` | Routen-/Karten-Cache | Lesen: Admin; Schreiben: authentifiziert |

**Default-Deny:** `match /{document=**} { allow read, write: if false; }` als letzte Regel.

## Rollen & Rechte

- Rollen: `admin`, `nurse` (= Mitarbeiter). Quelle: Custom Claim `role`, Fallback `users/{uid}.role` beim ersten Login.
- Mandanten-Isolation: `companyId` (Single-Tenant → `SINGLE_COMPANY_ID`). Rules-Helper sind bewusste Stubs; für Multi-Tenant echte Implementierung nötig (siehe `KNOWN_LIMITATIONS.md` D1).
- Sicherheitsgarantien durch Emulator-Tests gepinnt: `tests/rules/firestore-rules.test.mjs` (Isolation) + `firestore-escalation.test.mjs` (Rollen-Eskalation).

## Storage

| Pfad | Zugriff |
|---|---|
| `logos/**` | Lesen: öffentlich; Schreiben/Löschen: **nur Admin** (Bild-Typ, < 5 MB) |
| `documents/{userId}/{docId}/{file}` | Besitzer/Admin; < 10 MB; `image/*` oder `application/pdf` |

## Indizes

Definiert in `firestore.indexes.json` (Composite-Indizes für die häufigen `where`+`orderBy`-Queries auf `assignments`, `timesheets`, `shifts`). Deploy via `firebase deploy --only firestore:indexes`.
