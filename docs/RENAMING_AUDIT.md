# Renaming-Audit: JobFlow → Schichtklar

**Stand:** 10.07.2026 · Branch `chore/rename-jobflow-to-schichtklar`
**Umfang:** 164 getrackte Dateien enthalten „jobflow" (case-insensitive), verteilt auf 126 Dateien mit `JobFlow`, 63 mit `jobflow`, 3 mit `JOBFLOW`. Keine Treffer für `Jobflow`, `job-flow`, `job_flow`.

Markenstandard: sichtbar **Schichtklar**, technisch/klein **schichtklar**, mit Bindestrich **schichtklar-app**, Konstante **SCHICHTKLAR_APP_NAME**.

---

## 1. Sichtbare Produktbezeichnungen → **Schichtklar** (werden ersetzt)

| Fundstelle | Aktuell | Neu | Kategorie | Risiko |
|---|---|---|---|---|
| `lib/constants/branding.ts` | `DEFAULT_APP_NAME = 'JobFlow'` | `'Schichtklar'` (+ zentrale Branding-Konstanten) | zentrale Konfiguration | niedrig |
| `app/layout.tsx` | `title: 'JobFlow - Zeitarbeits-App'`, `apple-mobile-web-app-title`, Console-Präfixe `[JobFlow]` | Schichtklar | Browser-Titel/Metadaten | niedrig |
| `public/manifest.webmanifest` | `name`, `short_name` = JobFlow | Schichtklar | PWA-Manifest | niedrig |
| `components/auth/AuthLayoutHeader.tsx`, `components/layout/GlobalHeader.tsx` | `companyName: 'JobFlow'` | zentrale Konstante | Header/Navigation | niedrig |
| `components/pwa/InstallPrompt.tsx` | „JobFlow installieren" | Schichtklar | PWA-Dialog | niedrig |
| `components/ui/LoadingSpinner.tsx` | „JobFlow wird geladen…" | Schichtklar | Ladezustand | niedrig |
| `components/ui/AppLogo.tsx`, `components/admin/CategoryManager.tsx` | Text/Kommentar „JobFlow" | Schichtklar | UI-Text | niedrig |
| `lib/services/email.ts` | „Einladung zu JobFlow", „JobFlow beizutreten" | Schichtklar | E-Mail-Text | niedrig |
| `lib/services/documentGeneration.ts` | Fallback `'JobFlow'`, „automatisch von JobFlow erstellt" | Schichtklar | PDF-Nachweis | niedrig |
| `lib/services/timesheetProof.ts` | „Generiert von JobFlow" | Schichtklar | PDF-Zeitnachweis | niedrig |
| `README.md`, `SECURITY.md`, `FIREBASE-QUERIES.md`, `ARCHITECTURE-HEALTH.md`, `docs/**` | Titel/Fließtext | Schichtklar (historische Changelogs: „ehemals JobFlow") | Dokumentation | niedrig |

## 2. Interne Bezeichner → **schichtklar** (werden ersetzt, da sicher)

| Fundstelle | Aktuell | Neu | Risiko |
|---|---|---|---|
| `package.json` | `"name": "jobflow"` | `"schichtklar"` | niedrig (nicht als npm-Paket veröffentlicht) |
| `app/layout.tsx` + `contexts/AuthContext.tsx` | `window.__JOBFLOW_E2E_TEST`, `__JOBFLOW_USER_ROLE` | `__SCHICHTKLAR_*` | niedrig (nur E2E-interne Flags, Setter+Leser gemeinsam) |
| `package.json`, `tests/rules/*` | Emulator-Projekt `jobflow-rules-test` | `schichtklar-rules-test` | niedrig (rein lokaler Emulator, keine Produktivdaten) |

## 3. Technische IDs → **bleiben unverändert** (dokumentiert in `docs/INFRASTRUCTURE_RENAMING.md`)

| Fundstelle | Wert | Grund für Erhalt | Nutzer-sichtbar? |
|---|---|---|---|
| `.firebaserc`, `.github/workflows/firebase-hosting.yml`, ~32 Infra-Skripte, `.env.production.example` (Kommentare) | Firebase-Projekt-ID `jobflow25` | Firebase-Projekt-IDs sind **unveränderlich** und mit Auth/Firestore/Storage/Hosting/Functions **produktiv verbunden**. Umbenennen = neues Projekt + vollständige Datenmigration. | nein |
| abgeleitet aus Projekt-ID | `jobflow25.firebaseapp.com` (Auth-Domain), `jobflow25.firebasestorage.app` (Bucket), `us-central1-jobflow25.cloudfunctions.net` | technisch an die Projekt-ID gebunden | nein (nur in Netzwerk-Requests) |
| Seed-/Test-Fixtures (`scripts/seed-firestore.js`, `scripts/verified-emails-whitelist.txt`, `e2e/**`) | Test-Logins `admin@jobflow.de` u. ä. | fiktive Test-Domain; reine Entwickler-Fixtures. Werden auf `@schichtklar.test` (RFC-6761-reservierte TLD, klar nicht-produktiv) vereinheitlicht, um JobFlow-Sichtbarkeit zu entfernen. | nur Entwickler |

## 4. Firestore-Collections / Storage-Pfade / Custom Claims

Keine Collection, kein Storage-Pfad und kein Custom Claim enthält „jobflow" (verifiziert gegen `firestore.rules` und `storage.rules`). **Kein Migrationsbedarf** auf Datenebene.

## 5. Assets

`public/logo.svg`, `public/logo-default.png` und die Icons enthalten **keinen** Text „JobFlow" im Dateinamen. Ob die Grafiken selbst den Schriftzug „JobFlow" zeigen, ist aus dem Repo nicht prüfbar → in `docs/BRAND_RENAME_REPORT.md` als „finale Markenassets bereitstellen" markiert. Es wird **kein** Logo automatisch durch eine minderwertige Textgrafik ersetzt.

## 6. Reihenfolge der Umsetzung

1. Zentrale Branding-Konstanten (`lib/constants/branding.ts`) auf Schichtklar + erweitern.
2. Sichtbare UI/Metadaten/Manifest/E-Mail/PDF (Kategorie 1).
3. Interne Bezeichner (Kategorie 2).
4. Dokumentation (Kategorie 1, docs).
5. `docs/INFRASTRUCTURE_RENAMING.md` (Kategorie 3) + `docs/BRAND_RENAME_REPORT.md`.
6. Verifikation: Re-Scan, Typecheck, Lint, Build.
