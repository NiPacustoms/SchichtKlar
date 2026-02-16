# JobFlow – Dokumentation Teil 71

*Zeichen 1390871–1410703 von 2862906*

---

**Zweck:** Priorisierte Liste aller Issues für Verkaufsbereitschaft

---

## Priorisierung

- **P0 (BLOCKER):** Muss vor Verkauf behoben werden
- **P1 (MUSS):** Sollte vor Verkauf behoben werden
- **P2 (SOLLTE):** Kann nach Verkauf behoben werden

---

## P0 - BLOCKER (müssen vor Verkauf behoben werden)

### P0-1: Build-Fehler beheben

**Beschreibung:** Build schlägt fehl, verhindert Deployment

**Betroffene Dateien:**
- `package.json` (ESLint fehlt)
- `app/(app)/chat/[channelId]/page.tsx` (Next.js 15 `params` Promise)
- 60+ Dateien mit TypeScript-Fehler

**Vorschlag zur Behebung:**
1. ESLint installieren: `npm install --save-dev eslint`
2. Next.js 15 `params` Promise-Fix: `params` muss `Promise<{ channelId: string }>` sein
3. TypeScript-Fehler beheben (priorisiert nach Häufigkeit):
   - Fehlende Type-Properties hinzufügen
   - Fehlende Imports/Exports hinzufügen
   - Type-Inkompatibilitäten beheben

**Referenz:** `docs/release/01_STATIC_CHECKS.md`

---

### P0-2: Impressum - Echte Firmendaten eintragen

**Beschreibung:** Impressum enthält nur Mock-Daten (JobFlow GmbH, Musterstraße 123, etc.)

**Betroffene Dateien:**
- `app/(auth)/legal/imprint/page.tsx`

**Vorschlag zur Behebung:**
- Alle Platzhalter durch echte Firmendaten ersetzen:
  - Firmenname
  - Adresse
  - Kontaktdaten (E-Mail, Telefon)
  - Registereintrag (HRB, Registergericht, USt-IdNr.)
  - Verantwortlicher für den Inhalt

**Referenz:** `docs/release/02_SECURITY_LEGAL_AUDIT.md` - Legal-Seiten

---

### P0-3: Datenschutzerklärung - DSGVO-konform erstellen

**Beschreibung:** Generische Datenschutzerklärung ohne spezifische Details

**Betroffene Dateien:**
- `app/(auth)/legal/privacy/page.tsx`

**Vorschlag zur Behebung:**
- DSGVO-konforme Datenschutzerklärung mit spezifischen Details zu:
  - Firebase/Firestore Datenverarbeitung
  - Push-Notifications
  - Chat-Daten
  - Zeiterfassungsdaten
  - Payroll-Daten
  - Cookies/Tracking
  - Datenweitergabe an Dritte
  - Speicherdauer
  - Betroffenenrechte (Art. 15-22 DSGVO)

**Referenz:** `docs/release/02_SECURITY_LEGAL_AUDIT.md` - Legal-Seiten

---

### P0-4: DSGVO-Compliance-Features implementieren

**Beschreibung:** Fehlende DSGVO-Features (Cookie-Banner, Datenexport, Datenlöschung)

**Betroffene Dateien:**
- Neue Komponenten erforderlich
- API-Routes für Datenexport/Datenlöschung

**Vorschlag zur Behebung:**
1. Cookie-Banner implementieren (Opt-In/Opt-Out)
2. Datenexport-Funktion für User (DSGVO Art. 15):
   - API-Route: `/api/user/data-export`
   - UI: Profil-Seite → "Meine Daten exportieren"
   - Export-Format: JSON oder PDF
3. Datenlöschung-Funktion für User (DSGVO Art. 17):
   - API-Route: `/api/user/data-deletion`
   - UI: Profil-Seite → "Konto löschen"
   - Bestätigungs-Dialog
   - Anonymisierung statt Löschung (GoBD-Konformität für Payroll)

**Referenz:** `docs/release/02_SECURITY_LEGAL_AUDIT.md` - DSGVO-Compliance

---

### P0-5: `eval()` in Debug-Route entfernen

**Beschreibung:** `eval()` ist extrem gefährlich und sollte entfernt werden

**Betroffene Dateien:**
- `app/debug-env/page.tsx` (Zeile 58)

**Vorschlag zur Behebung:**
- Debug-Route komplett entfernen ODER
- `eval()` durch sichere Alternative ersetzen (z.B. JSON.parse für spezifische Use-Cases)
- Debug-Route nur in Development-Modus verfügbar machen (bereits vorhanden, aber `eval()` trotzdem entfernen)

**Referenz:** `docs/release/02_SECURITY_LEGAL_AUDIT.md` - Gefährliche Patterns

---

## P1 - MUSS (sollten vor Verkauf behoben werden)

### P1-1: Chat-Uploads - Storage Rules Channel-Teilnehmer prüfen

**Beschreibung:** Chat-Uploads können von allen authentifizierten Usern gelesen werden, nicht nur Channel-Teilnehmern

**Betroffene Dateien:**
- `storage.rules` (Zeile 35-46)

**Vorschlag zur Behebung:**
- Storage Rules erweitern um Channel-Teilnehmer-Prüfung:
  - Read: Nur Channel-Teilnehmer
  - Write: Nur Channel-Teilnehmer
  - Delete: Nur Channel-Teilnehmer oder Admin
- Firestore-Dokument lesen um Channel-Teilnehmer zu prüfen (ähnlich wie in Firestore Rules)

**Referenz:** `docs/release/02_SECURITY_LEGAL_AUDIT.md` - Storage Rules

---

### P1-2: Chat-Content - Sanitization mit DOMPurify

**Beschreibung:** Chat-Content wird mit `dangerouslySetInnerHTML` ohne Sanitization gerendert (XSS-Risiko)

**Betroffene Dateien:**
- `app/(employee)/employee/chat/components/MessageBubble.tsx` (Zeile 435)

**Vorschlag zur Behebung:**
- DOMPurify verwenden (bereits in `package.json` als `isomorphic-dompurify`):
  ```typescript
  import DOMPurify from 'isomorphic-dompurify';
  const sanitizedContent = DOMPurify.sanitize(formatChatText(message.content));
  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
  ```

**Referenz:** `docs/release/02_SECURITY_LEGAL_AUDIT.md` - Gefährliche Patterns

---

### P1-3: Fehlende Type-Properties hinzufügen

**Beschreibung:** TypeScript-Fehler aufgrund fehlender Properties in Types

**Betroffene Dateien:**
- `lib/types/index.ts` (User, Assignment, TimeEntry, Shift Types)
- `app/(admin)/admin/mitarbeiter/page.tsx` (User.jobTitle)
- `app/(employee)/employee/profil/page.tsx` (User.preferences)
- `app/(admin)/admin/assignments/page.tsx` (Assignment.relievingSignatures, Assignment.pdfUrl)
- `app/(admin)/admin/urlaubsantraege/page.tsx` (TimeEntry.createdAt)
- `app/(admin)/admin/shifts/page.tsx` (Shift.companyId)

**Vorschlag zur Behebung:**
- Fehlende Properties zu Types hinzufügen:
  - `User.jobTitle?: string`
  - `User.preferences?: Record<string, any>`
  - `Assignment.relievingSignatures?: RelievingSignature[]`
  - `Assignment.pdfUrl?: string`
  - `Assignment.signatureSchedule?: SignatureSchedule`
  - `TimeEntry.createdAt?: Date`
  - `Shift.companyId?: string`

**Referenz:** `docs/release/01_STATIC_CHECKS.md` - TypeScript-Fehler

---

### P1-4: Fehlende Firebase-Exports hinzufügen

**Beschreibung:** `getFirebaseConfig`, `doc`, `getDoc` werden verwendet, aber nicht exportiert

**Betroffene Dateien:**
- `lib/firebase.ts`
- `lib/services/pushNotifications.ts` (getFirebaseConfig)
- `app/api/push/notify/route.ts` (doc, getDoc)

**Vorschlag zur Behebung:**
- In `lib/firebase.ts` exportieren:
  - `getFirebaseConfig()` Funktion (falls benötigt)
  - `doc`, `getDoc` von `firebase/firestore` re-exportieren

**Referenz:** `docs/release/01_STATIC_CHECKS.md` - Build-Warnings

---

## P2 - SOLLTE (können nach Verkauf behoben werden)

### P2-1: `any` Types durch korrekte Types ersetzen

**Beschreibung:** Viele `any` Types in API-Routes (z.B. `(decoded as any).role`)

**Betroffene Dateien:**
- `app/api/**/*.ts` (mehrere Dateien)

**Vorschlag zur Behebung:**
- Korrekte Types für Firebase Auth Token definieren:
  ```typescript
  interface FirebaseAuthToken {
    uid: string;
    role?: string;
    companyId?: string;
    customClaims?: {
      role?: string;
      companyId?: string;
    };
  }
  ```
- `(decoded as any)` durch `(decoded as FirebaseAuthToken)` ersetzen

**Referenz:** `docs/release/02_SECURITY_LEGAL_AUDIT.md` - Gefährliche Patterns

---

### P2-2: Test-Suite implementieren

**Beschreibung:** Keine Tests vorhanden (vitest in devDependencies, aber kein Test-Script)

**Betroffene Dateien:**
- `package.json` (Test-Script hinzufügen)
- Neue Test-Dateien erforderlich

**Vorschlag zur Behebung:**
1. Test-Script in `package.json` hinzufügen:
   ```json
   "test": "vitest",
   "test:ui": "vitest --ui"
   ```
2. Test-Dateien für kritische Services erstellen:
   - `lib/services/timesheets.test.ts`
   - `lib/services/payroll.test.ts`
   - `lib/services/chatService.test.ts`
3. Integration-Tests für API-Routes

**Referenz:** `docs/release/01_STATIC_CHECKS.md` - Test-Check

---

### P2-3: TODOs im Code beheben

**Beschreibung:** Einige TODOs in Code vorhanden

**Betroffene Dateien:**
- `app/(employee)/employee/forms/assignment/[assignmentId]/page.tsx` (Zeile 159): "TODO: Admin-ID aus Assignment oder System holen"
- `app/(employee)/employee/profil/page.tsx` (Zeile 366): "TODO: Implementiere automatische Pausenerinnerung"
- `app/(app)/chat/[channelId]/page.tsx` (Zeile 3): "Chat window (messages list + input + upload button). Minimal TSX scaffold with TODOs."

**Vorschlag zur Behebung:**
- TODOs durch Implementierung ersetzen oder als Feature-Request dokumentieren

**Referenz:** `docs/release/03_FEATURE_COVERAGE.md` - TODOs gefunden

---

### P2-4: Alle API-Routes validieren

**Beschreibung:** Nicht alle API-Routes haben Body-Validierung

**Betroffene Dateien:**
- `app/api/push/notify/route.ts` (keine Validierung gefunden)
- Weitere Routes prüfen

**Vorschlag zur Behebung:**
- Zod-Schemas für alle POST/PUT-Routes erstellen
- `validateRequest()` in allen Routes verwenden

**Referenz:** `docs/release/02_SECURITY_LEGAL_AUDIT.md` - API-Route-Validierung

---

## Zusammenfassung

### Priorität P0 (BLOCKER): 5 Issues
1. Build-Fehler beheben
2. Impressum - Echte Firmendaten
3. Datenschutzerklärung - DSGVO-konform
4. DSGVO-Compliance-Features
5. `eval()` entfernen

### Priorität P1 (MUSS): 4 Issues
1. Chat-Uploads Storage Rules
2. Chat-Content Sanitization
3. Fehlende Type-Properties
4. Fehlende Firebase-Exports

### Priorität P2 (SOLLTE): 4 Issues
1. `any` Types ersetzen
2. Test-Suite implementieren
3. TODOs beheben
4. Alle API-Routes validieren

**Gesamt:** 13 Issues

---

## Geschätzter Aufwand

- **P0:** 5-7 Tage
- **P1:** 2-3 Tage
- **P2:** 5-7 Tage (kann nach Verkauf)

**Gesamt (P0+P1):** 7-10 Tage bis Verkaufsbereitschaft

---

**Referenzen:**
- `docs/release/00_REPO_MAP.md`
- `docs/release/01_STATIC_CHECKS.md`
- `docs/release/02_SECURITY_LEGAL_AUDIT.md`
- `docs/release/03_FEATURE_COVERAGE.md`
- `docs/release/SALES_READINESS_REPORT_v2.md`


```

---

### 📄 PRODUCTION_READY_CHECKLIST.md

```markdown
# JobFlow - Production Ready Checklist

## 🎯 Ziel: 100% Verkaufsfertigkeit

Diese Checkliste muss **vollständig erfüllt** sein, bevor die App zum Verkauf angeboten werden kann.

---

## ✅ Automatische Checks (werden kontinuierlich getestet)

### 1. Code-Qualität

#### Linter
- [ ] **0 Linter-Fehler** ✅
- [ ] Alle Dateien formatiert (Prettier)
- [ ] ESLint-Regeln eingehalten
- [ ] Keine Console-Logs in Production-Code

#### TypeScript
- [ ] **0 TypeScript-Fehler** ✅
- [ ] Alle Typen korrekt definiert
- [ ] Keine `any`-Typen (außer wo notwendig)
- [ ] Strict Mode aktiviert

#### Code-Coverage
- [ ] **≥ 80% Code-Coverage** ✅
- [ ] Statements: ≥ 80%
- [ ] Branches: ≥ 75%
- [ ] Functions: ≥ 80%
- [ ] Lines: ≥ 80%

---

### 2. Tests

#### Unit-Tests
- [ ] **100% der Unit-Tests bestehen** ✅
- [ ] Alle kritischen Funktionen getestet
- [ ] Edge Cases abgedeckt
- [ ] Mock-Daten korrekt

#### Integration-Tests
- [ ] **100% der Integration-Tests bestehen** ✅
- [ ] React Query getestet
- [ ] Form-Validierung getestet
- [ ] Error Boundaries getestet

#### E2E-Tests
- [ ] **100% der E2E-Tests bestehen** ✅
- [ ] Alle User-Flows getestet
- [ ] Admin-Flows getestet
- [ ] Mitarbeiter-Flows getestet

#### Routen-Tests
- [ ] **100% der Routen erreichbar** ✅
- [ ] Alle öffentlichen Routen (200)
- [ ] Alle Admin-Routen (mit Auth)
- [ ] Alle Mitarbeiter-Routen (mit Auth)
- [ ] 404-Seite funktioniert

---

### 3. Funktionalität

#### Authentifizierung
- [ ] Login funktioniert
- [ ] Registrierung funktioniert
- [ ] Logout funktioniert
- [ ] Session-Management funktioniert
- [ ] Passwort-Reset funktioniert
- [ ] OIDC-Login funktioniert (falls aktiviert)

#### Admin-Funktionen
- [ ] Schichtverwaltung (CRUD)
- [ ] Mitarbeiterverwaltung (CRUD)
- [ ] Einrichtungsverwaltung (CRUD)
- [ ] Berichte & Exporte
- [ ] Chat-System
- [ ] Audit-Logs

#### Mitarbeiter-Funktionen
- [ ] Zeiterfassung (Start/Stop/Pause)
- [ ] Dienstplan anzeigen
- [ ] Profil bearbeiten
- [ ] Dokumente hochladen
- [ ] Chat-System
- [ ] Benachrichtigungen

#### Interaktive Elemente
- [ ] Alle Buttons funktionieren
- [ ] Alle Formulare validieren korrekt
- [ ] Alle Modals öffnen/schließen
- [ ] Navigation funktioniert
- [ ] Suche & Filter funktionieren
- [ ] Keyboard-Navigation funktioniert

---

### 4. Performance

#### Lighthouse-Scores
- [ ] **Performance ≥ 90** ✅
- [ ] **Accessibility ≥ 95** ✅
- [ ] **Best Practices ≥ 90** ✅
- [ ] **SEO ≥ 90** ✅

#### Metriken
- [ ] First Contentful Paint (FCP) < 1.5s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Time to Interactive (TTI) < 3.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Total Blocking Time (TBT) < 200ms

#### Ladezeiten
- [ ] Initial Load < 3s
- [ ] Route Navigation < 1s
- [ ] API-Response < 500ms (P95)

---

### 5. Security

#### Security Headers
- [ ] X-Frame-Options gesetzt
- [ ] X-Content-Type-Options gesetzt
- [ ] X-XSS-Protection gesetzt
- [ ] Strict-Transport-Security gesetzt (Production)
- [ ] Content-Security-Policy gesetzt

#### Input-Validierung
- [ ] XSS-Schutz aktiv
- [ ] SQL-Injection-Schutz aktiv
- [ ] CSRF-Schutz aktiv
- [ ] E-Mail-Validierung
- [ ] Passwort-Stärke-Prüfung

#### RBAC (Role-Based Access Control)
- [ ] Admin-Bereich geschützt
- [ ] Mitarbeiter-Bereich geschützt
- [ ] Unauthorized-Zugriff blockiert
- [ ] Rollen-basierte Permissions korrekt

#### Firebase Security Rules
- [ ] Firestore Rules deployed
- [ ] Storage Rules deployed
- [ ] Auth Rules korrekt

---

### 6. Accessibility (WCAG 2.1 AA)

#### Keyboard-Navigation
- [ ] Alle interaktiven Elemente erreichbar
- [ ] Focus-Indikatoren sichtbar
- [ ] Tab-Reihenfolge logisch
- [ ] Skip-Links vorhanden

#### Screen-Reader
- [ ] ARIA-Labels korrekt
- [ ] Landmarks vorhanden
- [ ] Alt-Texte für Bilder
- [ ] Formular-Labels korrekt

#### Farbkontrast
- [ ] Text-Kontrast ≥ 4.5:1
- [ ] UI-Komponenten-Kontrast ≥ 3:1
- [ ] Focus-Indikatoren sichtbar

---

### 7. Cross-Browser

#### Browser-Kompatibilität
- [ ] Chrome (Desktop & Mobile) ✅
- [ ] Firefox (Desktop & Mobile) ✅
- [ ] Safari (Desktop & Mobile) ✅
- [ ] Edge (Desktop) ✅

---

### 8. Mobile-Responsive

#### Viewports
- [ ] Desktop (1920x1080) ✅
- [ ] Laptop (1440x900) ✅
- [ ] Tablet (768x1024) ✅
- [ ] Mobile (375x667) ✅
- [ ] Mobile Landscape (667x375) ✅

#### Mobile-Features
- [ ] Touch-Targets ≥ 44px
- [ ] Navigation angepasst
- [ ] Formulare optimiert
- [ ] Performance auf Mobile OK

---

### 9. API-Endpunkte

#### Health & Status
- [ ] `/api/health` funktioniert
- [ ] `/status` funktioniert

#### Auth-Endpunkte
- [ ] `/api/auth/register-admin` funktioniert
- [ ] `/api/auth/accept-invite` funktioniert

#### Error-Handling
- [ ] Fehler werden korrekt zurückgegeben
- [ ] Error-Codes korrekt
- [ ] Error-Messages verständlich

---

### 10. Firebase-Integration

#### Firestore
- [ ] Alle Collections vorhanden
- [ ] Datenintegrität gewährleistet
- [ ] Security Rules deployed
- [ ] Indizes erstellt

#### Authentication
- [ ] User-Erstellung funktioniert
- [ ] Custom Claims gesetzt
- [ ] Rollen-Verwaltung funktioniert
- [ ] Session-Management funktioniert

#### Storage
- [ ] Datei-Upload funktioniert
- [ ] Datei-Download funktioniert
- [ ] Storage Rules deployed
- [ ] CORS konfiguriert

---

## 📋 Manuelle Checks

### 11. Dokumentation

- [ ] README.md vollständig
- [ ] API-Dokumentation vorhanden
- [ ] User-Guide vorhanden
- [ ] Admin-Guide vorhanden
- [ ] Deployment-Guide vorhanden

### 12. Deployment

- [ ] Production-Build erfolgreich
- [ ] Environment-Variablen gesetzt
- [ ] Firebase-Projekt konfiguriert
- [ ] Domain konfiguriert
- [ ] SSL-Zertifikat aktiv
- [ ] CDN konfiguriert (falls verwendet)

### 13. Monitoring

- [ ] Error-Tracking aktiv (Sentry)
- [ ] Analytics aktiv (falls gewünscht)
- [ ] Logging konfiguriert
- [ ] Alerts eingerichtet

### 14. Backup & Recovery

- [ ] Firestore-Backup-Strategie
- [ ] Storage-Backup-Strategie
- [ ] Recovery-Prozess dokumentiert

### 15. Rechtliches

- [ ] Impressum vollständig
- [ ] Datenschutzerklärung vollständig
- [ ] AGB vorhanden (falls nötig)
- [ ] DSGVO-konform

---

## 🚀 Automatischer Check

### Test-System starten

```bash
# Dev-Server starten (in separatem Terminal)
npm run dev

# Kontinuierliches Test-System starten
npm run test:until-perfect
```

Das System:
1. ✅ Führt alle Tests aus
2. ✅ Behebt automatisch Fehler (wo möglich)
3. ✅ Wiederholt solange, bis alles bei 100% ist
4. ✅ Stoppt erst wenn die App verkaufsfertig ist

### Production-Ready Check

```bash
npm run test:production-ready
```

---

## 📊 Fortschritt

### Aktueller Status

- **Code-Qualität:** ⏳ Wird getestet...
- **Tests:** ⏳ Wird getestet...
- **Funktionalität:** ⏳ Wird getestet...
- **Performance:** ⏳ Wird getestet...
- **Security:** ⏳ Wird getestet...
- **Accessibility:** ⏳ Wird getestet...
- **Cross-Browser:** ⏳ Wird getestet...
- **Mobile-Responsive:** ⏳ Wird getestet...

### Gesamt-Fortschritt: 0%

---

## ✅ Checkliste-Status

- [ ] Alle automatischen Checks bei 100%
- [ ] Alle manuellen Checks erfüllt
- [ ] Production-Ready Report erstellt
- [ ] App ist verkaufsfertig

---

## 🎯 Ziel

**100% aller Checks müssen erfüllt sein, bevor die App zum Verkauf angeboten werden kann!**

Das kontinuierliche Test-System hilft dabei, automatisch alle Fehler zu finden und zu beheben, bis die App perfekt ist.

---

**Viel Erfolg! 🚀**




```

---

### 📄 release/00_REPO_MAP.md

```markdown
# JobFlow - Repo-Mapping

**Erstellt:** 2025-01-27  
**Zweck:** Übersicht über Routes, Firebase-Config, Auth/Role-System und Services für Verkaufsbereitschaftsprüfung

---

## 1. Route-Übersicht

### 1.1 Auth-Routes (`app/(auth)/`)
- `/login` - `app/(auth)/login/page.tsx`
- `/register` - `app/(auth)/register/page.tsx`
- `/forgot-password` - `app/(auth)/forgot-password/page.tsx`
- `/admin-register` - `app/(auth)/admin-register/page.tsx`
- `/legal/imprint` - `app/(auth)/legal/imprint/page.tsx`
- `/legal/privacy` - `app/(auth)/legal/privacy/page.tsx`
- `/auth/callback` - `app/(auth)/auth/callback/page.tsx`

### 1.2 Admin-Routes (`app/(admin)/admin/`)
- `/admin` - `app/(admin)/admin/page.tsx`
- `/admin/dashboard` - `app/(admin)/admin/dashboard/page.tsx`
- `/admin/mitarbeiter` - `app/(admin)/admin/mitarbeiter/page.tsx`
- `/admin/mitarbeiter/[uid]` - `app/(admin)/admin/mitarbeiter/[uid]/page.tsx`
- `/admin/mitarbeiter/[uid]/gehalt` - `app/(admin)/admin/mitarbeiter/[uid]/gehalt/page.tsx`
- `/admin/einrichtungen` - `app/(admin)/admin/einrichtungen/page.tsx`
- `/admin/einrichtungen/[id]` - `app/(admin)/admin/einrichtungen/[id]/page.tsx`
- `/admin/dienstplan` - `app/(admin)/admin/dienstplan/page.tsx`
- `/admin/shifts` - `app/(admin)/admin/shifts/page.tsx`
- `/admin/assignments` - `app/(admin)/admin/assignments/page.tsx`
- `/admin/lohnabrechnung` - `app/(admin)/admin/lohnabrechnung/page.tsx`
- `/admin/berichte` - `app/(admin)/admin/berichte/page.tsx`
- `/admin/chat` - `app/(admin)/admin/chat/page.tsx`
- `/admin/chat/[channelId]` - `app/(admin)/admin/chat/[channelId]/page.tsx`
- `/admin/documents` - `app/(admin)/admin/documents/page.tsx`
- `/admin/documents/templates` - `app/(admin)/admin/documents/templates/page.tsx`
- `/admin/document-types` - `app/(admin)/admin/document-types/page.tsx`
- `/admin/einstellungen` - `app/(admin)/admin/einstellungen/page.tsx`
- `/admin/audit-logs` - `app/(admin)/admin/audit-logs/page.tsx`
- `/admin/urlaubsantraege` - `app/(admin)/admin/urlaubsantraege/page.tsx`
- `/admin/staff-simple` - `app/(admin)/admin/staff-simple/page.tsx`
- `/admin/secure-setup` - `app/(admin)/admin/secure-setup/page.tsx`

### 1.3 Employee-Routes (`app/(employee)/employee/`)
- `/employee/dashboard` - `app/(employee)/employee/dashboard/page.tsx`
- `/employee/zeiterfassung` - `app/(employee)/employee/zeiterfassung/page.tsx`
- `/employee/zeiten` - `app/(employee)/employee/zeiten/page.tsx`
- `/employee/dienstplan` - `app/(employee)/employee/dienstplan/page.tsx`
- `/employee/assignments` - `app/(employee)/employee/assignments/page.tsx`
- `/employee/forms/assignment/[assignmentId]` - `app/(employee)/employee/forms/assignment/[assignmentId]/page.tsx`
- `/employee/forms/assignment/[assignmentId]/summary` - `app/(employee)/employee/forms/assignment/[assignmentId]/summary/page.tsx`
