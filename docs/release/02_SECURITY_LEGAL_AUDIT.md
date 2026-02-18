# JobFlow - Security & Legal Audit

**Erstellt:** 2025-01-27  
**Zweck:** Security-Rules, API-Validierung und Legal-Compliance prüfen

---

## 1. Firestore Security Rules

### 1.1 Datei
- **Pfad:** `firestore.rules`
- **Zeilen:** 810
- **Status:** ✅ VORHANDEN

### 1.2 Mandantenisolation (`companyId`)

**Status:** ✅ IMPLEMENTIERT

**Details:**
- Helper-Funktionen vorhanden:
  - `belongsToSameCompany(resourceCompanyId)` - Zeile 29-34
  - `creatingForSameCompany(requestCompanyId)` - Zeile 37-42
- Verwendet in:
  - `users` (Zeile 75, 80, 85, 89)
  - `facilities` (Zeile 103, 104, 106, 107)
  - `shifts` (Zeile 118, 119, 121, 122)
  - `documents` (Zeile 133, 136, 139, 143)
  - `assignments` (Zeile 150, 153, 154, 156)
  - `reports` (Zeile 167, 170, 173)
  - `channels` (Zeile 204, 208, 212, 219)
  - `messages` (Zeile 231, 239, 245, 252)
  - `timesheets` (Zeile 358, 365, 371, 383)
  - `alerts` (Zeile 471, 474, 475, 479)
  - `notifications` (Zeile 491, 494, 495, 500)
  - `activities` (Zeile 338, 339, 340)
  - `auditLogs` (Zeile 602)

**Interpretation:** `OK` - Mandantenisolation ist durchgängig implementiert

### 1.3 Rollenbasierte Zugriffe

**Status:** ✅ IMPLEMENTIERT

**Helper-Funktionen:**
- `isAuthenticated()` - Zeile 5-7
- `hasRole(role)` - Zeile 9-17
- `isAdmin()` - Zeile 19-21
- `isDispatcher()` - Zeile 23-25

**Verwendung:**
- Admin-Zugriff: `isAdmin()` für sensible Collections (settings, auditLogs, employeePayrollData)
- Dispatcher-Zugriff: `isDispatcher()` für Shifts, Facilities, Assignments
- User-Zugriff: Eigene Daten + Company-Mitglieder

**Interpretation:** `OK` - Rollenbasierte Zugriffe korrekt implementiert

### 1.4 Chat-Security

**Status:** ✅ IMPLEMENTIERT

**Channel-Zugriff:**
- Lesen: Nur Teilnehmer (`request.auth.uid in resource.data.participants`) - Zeile 205
- Erstellen: User muss Teilnehmer sein - Zeile 209
- Update: Nur Ersteller oder Admin - Zeile 214
- Delete: Nur Admin - Zeile 219

**Message-Zugriff:**
- Lesen: Nur Channel-Teilnehmer (`isChannelParticipant()`) - Zeile 231-233
- Erstellen: Nur Channel-Teilnehmer, Broadcast nur Admin/Dispatcher - Zeile 239-242
- Update/Delete: Nur eigener Ersteller oder Admin - Zeile 245-255

**Helper-Funktionen:**
- `isChannelParticipant(channelId)` - Zeile 49-54
- `canCreateMessage(channelId)` - Zeile 56-64

**Interpretation:** `OK` - Chat-Security korrekt implementiert

### 1.5 Timesheets-Security

**Status:** ✅ IMPLEMENTIERT

**Zugriffsregeln:**
- Lesen: Eigene Timesheets ODER Admin derselben Company - Zeile 353-362
- Erstellen: Authentifizierte User - Zeile 363-366
- Update: Nur wenn NICHT approved/submitted (GoBD) - Zeile 369-378
- Delete: Nur wenn NICHT approved/submitted (GoBD) - Zeile 381-389

**GoBD-Konformität:**
- Approved/submitted Timesheets sind unveränderlich - Zeile 376-377, 387-388

**Interpretation:** `OK` - Timesheets-Security und GoBD-Konformität implementiert

### 1.6 Payroll-Security

**Status:** ✅ IMPLEMENTIERT

**Zugriffsregeln:**
- `payrollPeriods`: Nur Dispatcher/Admin - Zeile 617, 620, 627, 641
- `payrollItems`: Nur Cloud Functions können schreiben (false) - Zeile 656
- `employeePayrollData`: Nur Admin (sensible Daten: IBAN, SV-Nr., Steuer-ID) - Zeile 682, 685
- `payrollSettings`: Eigener User oder Admin/Dispatcher - Zeile 701, 707
- `payrollAuditLogs`: Nur Admin - Zeile 667

**Interpretation:** `OK` - Payroll-Security korrekt implementiert

### 1.7 Gefährliche Patterns

**Status:** ✅ KEINE GEFUNDEN

**Prüfung:**
- `allow read, write: if true` - NICHT GEFUNDEN
- Alle Rules haben Authentifizierungs- und Autorisierungs-Checks

**Interpretation:** `OK` - Keine über-permissiven Rules

---

## 2. Storage Security Rules

### 2.1 Datei
- **Pfad:** `storage.rules`
- **Zeilen:** 50
- **Status:** ✅ VORHANDEN

### 2.2 Logos (`/logos/{allPaths=**}`)

**Status:** ⚠️ ÖFFENTLICHER READ-ZUGRIFF

**Details:**
- Zeile 7: `allow read: if true;` - Öffentlicher Lesezugriff
- Zeile 9-11: Write nur für authentifizierte User, max 5MB, nur Images
- Zeile 13: Delete nur für Admin

**Interpretation:** `OK` - Öffentlicher Read für Logos ist beabsichtigt (für Anzeige in App)

### 2.3 Documents (`/documents/{userId}/{documentId}/{fileName}`)

**Status:** ✅ SICHER

**Details:**
- Zeile 19-21: Read nur für eigenen User oder Admin/Dispatcher
- Zeile 24-27: Write nur für eigenen User, max 10MB, nur Images/PDF
- Zeile 30-31: Delete nur für eigenen User oder Admin

**Interpretation:** `OK` - Dokumente sind korrekt geschützt

### 2.4 Chat Uploads (`/chatUploads/{channelId}/{fileName}`)

**Status:** ⚠️ NUR AUTHENTIFIZIERUNG

**Details:**
- Zeile 37: Read für alle authentifizierten User
- Zeile 40-42: Write für alle authentifizierten User, max 10MB, nur Images/PDF
- Zeile 45: Delete für alle authentifizierten User

**Problem:** Keine Channel-Teilnehmer-Prüfung

**Interpretation:** `MUSS` - Chat-Uploads sollten nur für Channel-Teilnehmer erlaubt sein

**Beleg:** `storage.rules` Zeile 35-46

---

## 3. API-Route-Validierung

### 3.1 Validierungs-Framework

**Status:** ✅ IMPLEMENTIERT

**Framework:** Zod (v4.1.12)

**Helper-Funktion:**
- `validateRequest()` - `lib/validations/index.ts` Zeile 18-60
- Unterstützt Body- und Query-Parameter-Validierung

### 3.2 Validierte API-Routes

**Status:** ✅ MEISTE ROUTES VALIDIERT

**Gefundene Validierungen:**
1. `/api/auth/register-admin` - `registerAdminSchema` - Zeile 36
2. `/api/auth/accept-invite` - `acceptInviteSchema` - Zeile 23
3. `/api/chat/channels` (POST) - `createChannelSchema` - Zeile 103
4. `/api/chat/messages` (POST) - `sendMessageSchema` - Zeile 130
5. `/api/chat/messages` (GET) - `messagesQuerySchema` - Zeile 31
6. `/api/admin/shifts` (GET) - `shiftsQuerySchema` - Zeile 49
7. `/api/admin/shifts` (POST) - `createShiftSchema` - Zeile 202
8. `/api/templates` (POST) - `createTemplateSchema` - Zeile 97
9. `/api/templates` (GET) - `templateQuerySchema` - Zeile 23
10. `/api/templates/[templateId]` (PUT) - `updateTemplateSchema` - Zeile 89

**Interpretation:** `OK` - Wichtige API-Routes sind validiert

### 3.3 Nicht-validierte API-Routes

**Status:** ⚠️ EINIGE ROUTES OHNE VALIDIERUNG

**Gefundene Routes ohne explizite Validierung:**
- `/api/health` - Keine Body-Validierung nötig (GET-only)
- `/api/debug/**` - Debug-Routes (sollten in Production deaktiviert sein)
- `/api/push/notify` - Keine Validierung gefunden (Import-Fehler in Build)

**Interpretation:** `SOLLTE` - Alle POST/PUT-Routes sollten validiert werden

**Beleg:** Grep-Ergebnis: 17 Validierungen gefunden, aber nicht alle Routes geprüft

### 3.4 Authentifizierung in API-Routes

**Status:** ✅ IMPLEMENTIERT

**Pattern:**
- Token-Verifizierung via `verifyIdToken()` aus `@/lib/server/firebaseAdmin`
- Rate Limiting via `checkRateLimit()`
- Custom Claims für Rollen-Checks

**Beispiel:** `app/api/auth/register-admin/route.ts` Zeile 25-33

**Interpretation:** `OK` - Authentifizierung ist durchgängig implementiert

---

## 4. Gefährliche Patterns

### 4.1 `dangerouslySetInnerHTML`

**Status:** ⚠️ VERWENDET

**Gefundene Verwendungen:**

1. **`app/layout.tsx`** - Zeile 57, 107, 173
   - Verwendung für Script-Tags (Google Analytics, etc.)
   - **Interpretation:** `OK` - Für externe Scripts akzeptabel, sollte aber überprüft werden

2. **`app/(employee)/employee/chat/components/MessageBubble.tsx`** - Zeile 435
   - Verwendung für Chat-Text-Formatierung: `dangerouslySetInnerHTML={{ __html: formatChatText(message.content) }}`
   - **Problem:** User-Input wird direkt gerendert
   - **Interpretation:** `MUSS` - Chat-Content sollte sanitized werden (z.B. mit DOMPurify)

3. **`app/debug-env/page.tsx`** - Zeile 58
   - Verwendung von `eval()`: `const evalResult = eval(evalStr);`
   - **Problem:** `eval()` ist extrem gefährlich
   - **Interpretation:** `BLOCKER` - `eval()` sollte entfernt werden (Debug-Route sollte in Production deaktiviert sein)

**Beleg:** Grep-Ergebnis: 5 Treffer

### 4.2 `any` Type Usage

**Status:** ⚠️ VERWENDET

**Details:**
- In TypeScript-Check gefunden: Viele `any` Types in API-Routes
- Beispiel: `(decoded as any).role` - Zeile 62 in `app/api/auth/register-admin/route.ts`

**Interpretation:** `SOLLTE` - `any` Types sollten durch korrekte Types ersetzt werden

### 4.3 Fehlende Input-Sanitization

**Status:** ⚠️ TEILWEISE

**Details:**
- Chat-Messages werden mit `dangerouslySetInnerHTML` gerendert ohne Sanitization
- `formatChatText()` sollte DOMPurify verwenden

**Interpretation:** `MUSS` - User-Input sollte immer sanitized werden

---

## 5. Legal-Seiten

### 5.1 Impressum

**Status:** ⚠️ MOCK-DATEN

**Datei:** `app/(auth)/legal/imprint/page.tsx`

**Inhalt:**
- JobFlow GmbH (Platzhalter)
- Musterstraße 123, 12345 Musterstadt (Platzhalter)
- E-Mail: info@jobflow.de (Platzhalter)
- Telefon: +49 123 456789 (Platzhalter)
- HRB 12345 (Platzhalter)
- Max Mustermann, Geschäftsführer (Platzhalter)

**Interpretation:** `BLOCKER` - Echte Firmendaten müssen vor Verkauf eingetragen werden

**Beleg:** `app/(auth)/legal/imprint/page.tsx` Zeile 18-54

### 5.2 Datenschutzerklärung

**Status:** ⚠️ GENERISCH

**Datei:** `app/(auth)/legal/privacy/page.tsx`

**Inhalt:**
- Generische Datenschutzerklärung
- Keine spezifischen Details zu:
  - Firebase/Firestore Datenverarbeitung
  - Push-Notifications
  - Chat-Daten
  - Zeiterfassungsdaten
  - Payroll-Daten
  - Cookies/Tracking

**Interpretation:** `MUSS` - DSGVO-konforme Datenschutzerklärung mit spezifischen Details erforderlich

**Beleg:** `app/(auth)/legal/privacy/page.tsx` Zeile 13-77

### 5.3 DSGVO-Compliance

**Status:** ⚠️ UNVOLLSTÄNDIG

**Fehlende Elemente:**
- Keine Cookie-Banner gefunden
- Keine Opt-Out-Mechanismen für Tracking
- Keine Datenexport-Funktion für User (DSGVO Art. 15)
- Keine Datenlöschung-Funktion für User (DSGVO Art. 17)

**Interpretation:** `MUSS` - DSGVO-Compliance-Features müssen implementiert werden

---

## 6. Zusammenfassung

### 6.1 Security-Stärken

✅ **Firestore Rules:**
- Mandantenisolation implementiert
- Rollenbasierte Zugriffe korrekt
- Chat-Security korrekt
- GoBD-Konformität für Timesheets
- Payroll-Security korrekt

✅ **API-Validierung:**
- Zod-Schemas für wichtige Routes
- Authentifizierung durchgängig
- Rate Limiting implementiert

### 6.2 Security-Schwächen

🔴 **BLOCKER:**
1. `eval()` in Debug-Route (`app/debug-env/page.tsx`) - muss entfernt werden
2. Impressum enthält nur Mock-Daten - echte Daten erforderlich

🟡 **MUSS:**
1. Chat-Uploads: Storage Rules sollten Channel-Teilnehmer prüfen
2. Chat-Content: `dangerouslySetInnerHTML` ohne Sanitization
3. Datenschutzerklärung: DSGVO-konform mit spezifischen Details
4. DSGVO-Compliance: Cookie-Banner, Datenexport, Datenlöschung

🟢 **SOLLTE:**
1. Alle API-Routes validieren (einige fehlen)
2. `any` Types durch korrekte Types ersetzen

### 6.3 Legal-Compliance

🔴 **BLOCKER:**
- Impressum: Mock-Daten müssen durch echte Firmendaten ersetzt werden

🟡 **MUSS:**
- Datenschutzerklärung: DSGVO-konform mit spezifischen Details
- DSGVO-Features: Cookie-Banner, Datenexport, Datenlöschung

---

**Nächste Schritte:** Siehe `03_FEATURE_COVERAGE.md` für Feature-Prüfungen.

