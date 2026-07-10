# Bekannte Einschränkungen & offene Punkte

**Stand:** 10.07.2026 · Schichtklar

Ehrliche Auflistung aller bekannten Einschränkungen, offenen Entscheidungen und bewusst zurückgestellten Arbeiten. Priorisiert nach Dringlichkeit für einen Käufer.

## A. Vor Produktivbetrieb zwingend

| # | Thema | Details |
|---|---|---|
| A1 | **Impressums-/Legal-Daten setzen** | `NEXT_PUBLIC_COMPANY_*` mit echten Daten belegen. Der Produktions-Guard `validateLegalConfig()` blockiert den Build sonst bewusst. |
| A2 | **Finale Markenassets** | `public/logo.svg`, `public/logo-default.png`, `public/icons/*` durch finale Schichtklar-Grafiken ersetzen (gleiche Dateinamen → keine Code-Änderung). |
| A3 | **Produktions-Domain & CORS** | Domain + Support-E-Mail festlegen; `scripts/storage-cors.json` (Platzhalter `your-production-domain.example`) auf echte Origin setzen und via `npm run storage:cors` anwenden. |
| A4 | **AVV mit Google Cloud** | Auftragsverarbeitungsvertrag abschließen; Region `europe-west1` ist bereits gesetzt. |
| A5 | **GitHub Actions reaktivieren** | Repo-weit seit 31.05.2026 keine Workflow-Runs (Settings → Actions / Billing prüfen). Ohne CI kein automatisches Sicherheitsnetz. |

## B. Vor Produktivbetrieb empfohlen

| # | Thema | Details |
|---|---|---|
| B1 | **Legacy-Unit-Test-Suite sanieren** | `lib/services/__tests__/*` und `lib/hooks/__tests__/*` sind von den aktuellen Service-APIs abgedriftet (21/45 rot; Details in `QA_REPORT.md`). Nicht CI-gebunden, blockiert daher nichts, sollte aber repariert und in CI aufgenommen werden. Neue Rules- und Geschäftsregel-Tests (13 + 12) sind grün. |
| B2 | **`next` patchen** | Auf `>=15.5.13` heben (schließt Rewrite-Request-Smuggling-Advisory). Siehe `DEPENDENCY_AUDIT.md`. |
| B3 | **`firebase-admin` aktualisieren** | Schließt transitive `@grpc/grpc-js`/`node-forge`-Advisories (serverseitig). |
| B4 | **Server-Routen-Gate aktivieren** | `proxy.ts` ist für Next 16 vorbereitet, unter Next 15 inaktiv. Datenzugriff ist bereits durch Firestore-Rules + API-Rollenprüfung geschützt; ein zusätzliches Middleware-Gate wäre Defense-in-Depth (Vorsicht: CSP-Header-Überschneidung mit `next.config.js`). |
| B5 | **`deleteAllAssignments` absichern/entfernen** | Destruktive Wartungs-Cloud-Function (admin-only, korrekt autorisiert). Vor Kundenauslieferung entfernen oder hinter zusätzliches Bestätigungs-Flag stellen. |
| B6 | **Rate-Limiting vereinheitlichen** | `ensure-admin-role` (ENV-gegatet) und `invitations` haben kein Rate-Limit; andere Auth-Routen schon. |

## C. Fachliche Entscheidungen (Eigentümer)

| # | Thema | Details |
|---|---|---|
| C1 | **Regel „1 Einsatz pro Kalendertag"** | Aktuell als **Zeit-Überlappung** implementiert (`createWithMatching.ts`), nicht als „ein Einsatz pro Kalendertag". Zwei nicht-überlappende Einsätze am selben Tag wären möglich. Wenn die harte Kalendertag-Regel gilt, muss der Konflikt-Check umgestellt werden (schließt Split-Shifts aus → Freigabe nötig). Siehe `QA_REPORT.md`. |
| C2 | **Regel „Signaturblock max. 7 Tage"** | Das Datenmodell (`signatureSchedule.requiredDates`) erlaubt beliebig viele Tage; eine harte serverseitige 7-Tage-Grenze wurde nicht gefunden. Empfehlung: bei Anlage validieren (`requiredDates.length <= 7`). |

## D. Architektur-Hinweise (kein Mangel, dokumentiert)

| # | Thema | Details |
|---|---|---|
| D1 | **Single-Tenant-Modell** | 1 Kunde = 1 Firebase-Projekt (`SINGLE_COMPANY_ID`). Mandanten-Helper in `firestore.rules` sind bewusst Stubs (`return true`). Für Multi-Tenant müssten `belongsToSameCompany` echt implementiert und alle List-Queries mit `companyId`-Filter versehen werden. Durch `tests/rules/` als bewusste Entscheidung gepinnt. |
| D2 | **UI-System = MUI** | Trotz vorhandener Tailwind-Restkonfiguration ist MUI das führende Design-System (Radix ist nicht installiert). |
| D3 | **Technische Alt-IDs** | Firebase-Projekt `jobflow25` u. a. bleiben aus Infrastrukturgründen bestehen (nicht nutzer-sichtbar). Migrationspfad: `INFRASTRUCTURE_RENAMING.md`. |

## E. Optionale Ausbaustufen (Marktrecherche)

PDL-Freigabe per Magic-Link (Remote-Bestätigung ohne Account), §82c-Satzdeckel-Monitor, Equal-Pay-/Höchstüberlassungs-Countdown, DATEV-Export-Vertiefung. Kein Blocker – Differenzierungsmerkmale.
