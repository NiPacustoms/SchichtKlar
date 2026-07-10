# Market-Ready-Report – Schichtklar

**Stand:** 10.07.2026 · Branch `chore/rename-jobflow-to-schichtklar` (baut auf `chore/market-ready` auf)
**Basis:** verifizierter `main`-Stand + Marktreife- und Rebrand-Arbeiten dieser Session.

---

## Executive Summary

**Aktueller Zustand:** Schichtklar (ehemals JobFlow) ist eine funktional substanzielle, DSGVO-orientierte Einsatzplanungs-, Zeiterfassungs- und Nachweis-App (Next.js 15 / React / TypeScript strict / MUI / Firebase, Single-Tenant). Der Code ist statisch verifiziert (Typecheck, ESLint 9 mit 0 Warnungen, Produktions-Build grün) und in den sicherheitskritischen Pfaden durch Tests abgesichert.

**Wichtigste Verbesserungen dieser Session:**
- **Kritische Rechte-Eskalation behoben** (Pflegekraft konnte sich über das eigene User-Dokument zum Admin machen) – inkl. dauerhaftem Emulator-Test.
- **jsPDF-Object-Injection** (kritisch) durch kontrollierten Bump geschlossen; **0 kritische** `npm audit`-Befunde verbleibend.
- Storage-Logo-Schreibrecht auf Admin eingeschränkt; `/api/admin/shifts` mit Rollen-Gate; Security-Webhook nicht mehr client-exponiert.
- Repository bereinigt (Altlasten entfernt, persönliche Pfade/API-Keys anonymisiert), 3 ungenutzte Dependencies entfernt.
- **Vollständiger Rebrand JobFlow → Schichtklar** (sichtbar überall; technische Alt-IDs dokumentiert).
- Umfassende Käufer-Dokumentation erstellt.

**Verbleibende Risiken:** abgedriftete (nicht CI-gebundene) Legacy-Unit-Suite, zwei fachliche Geschäftsregel-Entscheidungen (1 Einsatz/Tag; 7-Tage-Signaturblock), inaktive GitHub Actions, offene rechtliche/organisatorische Punkte (AVV, Impressum, finale Assets/Domain).

**Einschätzung der Verkaufsreife:** **Technisch verkaufsfähig** – die Substanz, Sicherheit und Dokumentation tragen eine Übergabe; vor dem ersten zahlenden Kunden sind klar benannte, überschaubare Rest­arbeiten (v. a. rechtlich/organisatorisch + Legacy-Tests) zu erledigen.

---

## Technischer Zustand (0–100)

| Dimension | Score | Begründung |
|---|---:|---|
| Codequalität | 82 | TS strict, ESLint 9 (0 Warnungen), saubere Service-Schicht + Hexagonal-Layer; Altlasten der Doku/Tests noch spürbar |
| Sicherheit | 85 | kritische/hohe Befunde behoben & getestet; Rules solide; offen: Server-Routen-Gate, Rate-Limit-Vereinheitlichung |
| Testabdeckung | 55 | neue Rules- (13) + Geschäftsregel-Tests (12) grün; Legacy-Unit-Suite abgedriftet & nicht CI-gebunden |
| Dokumentation | 88 | vollständige Audit-/Käufer-Doku (Architektur, Schema, ENV, Deployment, Handover, Limitations) |
| Wartbarkeit | 80 | zentrale Branding-Config, klare Struktur; ESLint/Toolchain vereinheitlicht |
| Performance | 70 | PWA + SW-Caching, Lazy-PDF-Imports; keine dedizierte Lasttest-/Bundle-Optimierungsrunde in dieser Session |
| Datenschutz-Vorbereitung | 72 | Export/Löschung implementiert, EU-Region, Anonymisierung erledigt; rechtliche Artefakte (AVV, Fristen) offen ⚖️ |
| Übergabefähigkeit | 85 | Handover-/Infrastruktur-Doku, Secret-Rotation-Plan, keine Secrets im Repo |
| Verkaufsfähigkeit | 80 | permissive Lizenzen, White-Label-fähig, klare Rest-Liste |

---

## Durchgeführte Arbeiten

- **Bereinigte Dateien:** Legacy-Route, Einmal-Skripte, macOS-Duplikat, redundanter CI-Workflow (Phase 2); frühere 162 tote Dateien (PR #4).
- **Entfernte Dependencies:** `@react-pdf/renderer`, `html2canvas`, `nanoid` (nachweislich ungenutzt).
- **Behobene Bugs/Sicherheitslücken:** Privilege Escalation (kritisch), jsPDF (kritisch), Storage-Logo-Rule (hoch), `/api/admin/shifts` ohne Rollen-Gate (mittel), client-exponierter Security-Webhook (mittel).
- **Neue Tests:** `firestore-escalation.test.mjs` (4), `businessRules.test.ts` (12); Rules-Isolation (9) weiterhin grün.
- **Neue Dokumentation:** REPOSITORY_AUDIT, REMOVED_FILES, SECURITY_AUDIT, QA_REPORT, DEPENDENCY_AUDIT, THIRD_PARTY_LICENSES, RENAMING_AUDIT, INFRASTRUCTURE_RENAMING, BRAND_RENAME_REPORT, ENVIRONMENT_VARIABLES, DATABASE_SCHEMA, PRIVACY_AND_COMPLIANCE, BUYER_HANDOVER, DEPLOYMENT, KNOWN_LIMITATIONS, dieser Report.
- **Anonymisiert:** persönliche Pfade, hartcodierter API-Key/Projektbezug, Test-Mail-Domains.
- **Rebrand:** JobFlow → Schichtklar vollständig sichtbar; zentrale Branding-Konstanten.

---

## Verbleibende Aufgaben

**Vor Verkauf zwingend**
- Finale Marken-Assets (Logo/Icons) einsetzen.
- Impressums-/Legal-Daten setzen (Build-Guard).

**Vor Produktivbetrieb empfohlen**
- Legacy-Unit-Suite sanieren + in CI aufnehmen (`KNOWN_LIMITATIONS.md` B1).
- `next` patchen, `firebase-admin` aktualisieren (`DEPENDENCY_AUDIT.md`).
- GitHub Actions reaktivieren; Server-Routen-Gate + Rate-Limiting vereinheitlichen.
- `deleteAllAssignments` absichern/entfernen.

**Rechtlich zu prüfen (⚖️)**
- AVV Google Cloud + Unterauftragnehmer, Verarbeitungsverzeichnis, Aufbewahrungsfristen, Datenschutzerklärung/Impressum, Einwilligungen (`PRIVACY_AND_COMPLIANCE.md`).

**Fachliche Entscheidungen (Eigentümer)**
- Regel „1 Einsatz/Kalendertag" (Überlappung vs. Kalendertag) und „7-Tage-Signaturblock" hart verankern (`KNOWN_LIMITATIONS.md` C1/C2).

**Durch Käufer nach Übernahme**
- Firebase-Projekt/Domain/Secrets übernehmen & rotieren (`BUYER_HANDOVER.md`).

---

## Übergabeliste (Kurzform)

Repository ✅ · Firebase-Projekt ⏳ (Transfer/Neuanlage) · Hosting ⏳ · Domain ⏳ · E-Mail-Konten ⏳ · Secrets ⏳ (rotieren) · Service Accounts ⏳ (neu) · Analytics/Sentry ⏳ · Backups ⏳ (einrichten) · Dokumentation ✅ · Verträge ⚖️ · Lizenzen ✅ · Rechtstexte ⚖️ · Zugangsdaten ⏳ · Käufer-Onboarding ✅ (dokumentiert). Details: `docs/BUYER_HANDOVER.md`.

---

## Verkaufsfreigabe

> **Technisch verkaufsfähig.**

**Begründung (ehrlich):** Sicherheit, Kernfunktionen, reproduzierbarer Build und Übergabedokumentation sind auf einem Niveau, das eine seriöse Übergabe erlaubt; die kritischen Sicherheitsrisiken sind behoben und getestet. Für **„vollständig übergabefähig"** fehlen noch: die Sanierung der Legacy-Test-Suite (Vertrauenssignal in Due Diligence), zwei fachliche Regel-Entscheidungen, die Reaktivierung der CI sowie die rechtlichen/organisatorischen Artefakte (AVV, Impressum, finale Assets). Alle Restpunkte sind konkret benannt, überschaubar und in `KNOWN_LIMITATIONS.md` nachverfolgbar.

---

## Verifikation (Phase 12)

- `npm run typecheck` ✅ 0 Fehler
- `npm run lint` (`--max-warnings=0`) ✅ 0 Fehler/Warnungen
- `npm run build` ✅ erfolgreich
- `npm run test:rules` ✅ 13/13 · `businessRules.test.ts` ✅ 12/12
- `npm audit --omit=dev` ✅ 0 kritisch
- Rebrand-Scan ✅ kein „jobflow" außer dokumentierten technischen IDs
