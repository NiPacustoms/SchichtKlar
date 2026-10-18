# Bekannte Einschränkungen & offene Punkte

**Stand:** 18.10.2026 · Schichtklar

Ehrliche Auflistung aller bekannten Einschränkungen, offenen Entscheidungen und bewusst zurückgestellten Arbeiten. Priorisiert nach Dringlichkeit für einen Käufer.

## A. Vor Produktivbetrieb zwingend

| # | Thema | Details |
|---|---|---|
| A1 | **Impressums-/Legal-Daten setzen** | `NEXT_PUBLIC_COMPANY_*` mit echten Daten belegen. Der Produktions-Guard `validateLegalConfig()` blockiert den Build sonst bewusst. |
| A2 | **Finale Markenassets** | `public/logo.svg`, `public/logo-default.png`, `public/icons/*` durch finale Schichtklar-Grafiken ersetzen (gleiche Dateinamen → keine Code-Änderung). |
| A3 | **Produktions-Domain & CORS** | Domain + Support-E-Mail festlegen; `scripts/storage-cors.json` (Platzhalter `your-production-domain.example`) auf echte Origin setzen und via `npm run storage:cors` anwenden. |
| A4 | **AVV mit Google Cloud** | Auftragsverarbeitungsvertrag abschließen; Region `europe-west1` ist bereits gesetzt. |
| A5 | **GitHub Actions reaktivieren** | Repo-weit seit 31.05.2026 keine Workflow-Runs (Settings → Actions / Billing prüfen). Ohne CI kein automatisches Sicherheitsnetz. |
| A6 | ~~Blaze-Plan für Storage & Functions~~ **ERLEDIGT** | Blaze aktiviert (10.07.2026). Storage-Bucket (`europe-west1`) provisioniert, Storage-Rules deployt, alle **37 Cloud Functions** inkl. Scheduler-Jobs live. Vollständiger Stand: `INFRASTRUCTURE_RENAMING.md` §1a. |

## B. Vor Produktivbetrieb empfohlen

| # | Thema | Details |
|---|---|---|
| B1 | ~~Legacy-Unit-Test-Suite sanieren~~ **ERLEDIGT** | Suite saniert (jsdom-Umgebung, `@testing-library/react`, Mock-/API-Drift behoben) und Produktlücke F1 (Mitarbeiter-Berichte) geschlossen: `npm run test:unit` grün (**65 passed, 0 skipped, 0 failed**). In CI aufgenommen (`quality.yml`). |
| B2 | ~~`next` patchen~~ **ERLEDIGT (18.10.2026)** | `next` 15.5.28 (gepinnt). Verbleibende `npm audit`-Befunde (8 high) liegen ausschließlich im Build-Tooling (Sentry-Bundler-Plugin, rollup, chokidar) bzw. `postcss` via Next – Fix nur über Major-Upgrades (`@sentry/nextjs` 11, Next 16); kein Laufzeitrisiko. 0 critical. |
| B3 | ~~`firebase-admin` aktualisieren~~ **ERLEDIGT (18.10.2026)** | Root auf `firebase-admin` 13.10 (wie `functions/`); gRPC- und busboy-Advisories geschlossen. |
| B4 | **Server-Routen-Gate aktivieren** | `proxy.ts` ist für Next 16 vorbereitet, unter Next 15 inaktiv. Datenzugriff ist bereits durch Firestore-Rules + API-Rollenprüfung geschützt; ein zusätzliches Middleware-Gate wäre Defense-in-Depth (Vorsicht: CSP-Header-Überschneidung mit `next.config.js`). |
| B5 | ~~`deleteAllAssignments`~~ **ENTFERNT (18.10.2026)** | War seit der Multi-Tenancy mandantenübergreifend (Admin jeder Firma hätte die Einsätze **aller** Firmen gelöscht). Kein Client nutzte sie. ⚠️ Nach Deploy die bereits deployte Function löschen: `firebase functions:delete deleteAllAssignments --region europe-west1`. |
| B6 | ~~Rate-Limiting vereinheitlichen~~ **ERLEDIGT (18.10.2026)** | `ensure-admin-role` sowie `/api/invitations` (inkl. Token-Lookup) laufen über das strenge Auth-Limit. |

## C. Fachliche Entscheidungen (Eigentümer)

| # | Thema | Details |
|---|---|---|
| C1 | **Regel „1 Einsatz pro Kalendertag"** | Aktuell als **Zeit-Überlappung** implementiert (`createWithMatching.ts`), nicht als „ein Einsatz pro Kalendertag". Zwei nicht-überlappende Einsätze am selben Tag wären möglich. Wenn die harte Kalendertag-Regel gilt, muss der Konflikt-Check umgestellt werden (schließt Split-Shifts aus → Freigabe nötig). Siehe `QA_REPORT.md`. |
| C2 | ~~Regel „Signaturblock max. 7 Tage"~~ **ERLEDIGT (11.07.2026)** | `calculateSignatureSchedule` garantiert die 7-Tage-Blöcke jetzt konstruktiv (Sonntage + Einsatzende, Termin nie nach Einsatzende); zusätzlich prüfbar via `validateSignatureScheduleMaxBlock()`. Dabei behobene Bugs: UTC-Off-by-one der Datums-Keys (Signaturtermine an Sonntagen verfehlten den Abgleich), Signaturtermin lag bei kurzen Einsätzen ohne Sonntag NACH dem Einsatzende (dadurch öffnete sich der Einrichtungs-Signatur-Dialog praktisch nie), Duplikat wenn Einsatzende = Sonntag. 10 neue Unit-Tests. |

## D. Architektur-Hinweise (kein Mangel, dokumentiert)

| # | Thema | Details |
|---|---|---|
| D1 | **Multi-Tenant (seit #29)** | Mandantentrennung über `companyId` in Rules, Client-Queries und Cloud Functions (`functions/src/utils/tenant.ts`, fail-closed). Die Rules tolerieren `companyId == null` noch für Legacy-Daten → **vor dem zweiten Kunden** einmal `/api/admin/backfill-company-ids?confirm=BACKFILL` ausführen und danach die null-Toleranz in `belongsToSameCompany` entfernen. |
| D2 | **UI-System = MUI** | Trotz vorhandener Tailwind-Restkonfiguration ist MUI das führende Design-System (Radix ist nicht installiert). |
| D3 | **Firebase-Projekt migriert** | Neues Projekt `schichtklar` angelegt, alle Deploy-Referenzen umgestellt (Frischstart). Erforderlicher GitHub-Schritt: Secret `FIREBASE_SERVICE_ACCOUNT_SCHICHTKLAR` mit Service-Account des neuen Projekts anlegen. Details: `INFRASTRUCTURE_RENAMING.md`. |

## F. Produktlücke: Mitarbeiter-Berichte teils Stub

| # | Thema | Details |
|---|---|---|
| F1 | ~~`useEmployeeReports` Aggregation/Export~~ **ERLEDIGT** | Echte Aggregation implementiert: `workTimeReport` (Gesamt-/Regel-/Überstunden, Arbeitstage, Ø pro Tag/Woche, `hoursByDay`-Chartdaten, §3-ArbZG-10h-Check), `surchargesReport` (Gesamtzuschlag + anteilige Aufteilung nach Nacht/Wochenende/Feiertag/Überstunden) und `exportWorkTimeReport` (ruft `reportService`-PDF/Excel-Export). Die 3 zuvor übersprungenen Tests sind reaktiviert und grün. |

## G. Mandanten-Härtung Cloud Functions (18.10.2026)

Mehrere Callables prüften nur „ist Admin", nicht „Admin **derselben Firma**". Behoben über den gemeinsamen Helper `functions/src/utils/tenant.ts` (Firma aus Claims, Fallback `users/{uid}`, sonst Ablehnung):

| Function | Vorher | Jetzt |
|---|---|---|
| `setUserRole` | Rollen in fremden Firmen setzbar; überschrieb Claims und **löschte `companyId`** | nur eigene Firma, Claims bleiben erhalten, kein Selbst-Entzug der Admin-Rolle |
| `getUsersWithRoles` | listete Nutzer **aller** Firmen | nur eigene Firma |
| `getUserRole` | Rolle beliebiger UIDs abfragbar | fremde Rollen nur für Admin derselben Firma |
| `findCandidates` | Kandidaten aus allen Firmen, fremde Schichten | Schicht + Kandidaten nur eigene Firma |
| `unassignShift` | Admin konnte fremde Zuweisungen lösen | nur eigene Firma (bzw. eigene Zuweisung) |
| `notifyFacility` | jeder Nutzer konnte Mails an beliebige Einrichtungen auslösen | nur zugewiesene Person oder Admin derselben Firma |
| `createWithMatching` | Firmen-Check fail-open, Einrichtung ungeprüft | fail-closed, Einrichtung muss zur Firma gehören |

⚠️ Wirksam erst nach `firebase deploy --only functions`.

## E. Optionale Ausbaustufen (Marktrecherche)

PDL-Freigabe per Magic-Link (Remote-Bestätigung ohne Account), §82c-Satzdeckel-Monitor, Equal-Pay-/Höchstüberlassungs-Countdown, DATEV-Export-Vertiefung. Kein Blocker – Differenzierungsmerkmale.
