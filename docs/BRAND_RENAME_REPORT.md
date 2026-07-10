# Brand-Rename-Report: JobFlow → Schichtklar

**Stand:** 10.07.2026 · Branch `chore/rename-jobflow-to-schichtklar`

## 1. Umbenannte Bereiche (sichtbar → Schichtklar)

| Bereich | Dateien (Auswahl) |
|---|---|
| **Zentrale Marke** | `lib/constants/branding.ts` (`DEFAULT_APP_NAME='Schichtklar'` + `branding`-Objekt) |
| **Browser-Titel / Metadaten** | `app/layout.tsx` (Title, Apple-Web-App-Title, Console-Präfixe) |
| **PWA-Manifest** | `public/manifest.webmanifest` (`name`, `short_name`) |
| **Login / Dashboards / Navigation / Footer** | `app/(auth)/anmelden`, `app/page.tsx`, `app/(employee)/employee/*`, `components/layout/GlobalHeader`, `components/auth/AuthLayoutHeader` |
| **Lade-/Install-/Offline-Zustände** | `app/loading.tsx`, `components/ui/LoadingSpinner`, `components/pwa/InstallPrompt`, `public/offline.html` |
| **Push-Benachrichtigungen** | `public/sw.js`, `public/firebase-messaging-sw.js`, `app/firebase-messaging-sw.js/route.ts` |
| **E-Mail-Texte** (Client + Cloud Functions) | `lib/services/email.ts`, `lib/server/email.ts`, `functions/src/email.ts`, `functions/src/scheduledReports.ts`, `functions/src/apiMonitoring/checkApiLimitAlert.ts` |
| **PDF-Nachweise / Exporte** | `lib/services/documentGeneration.ts`, `lib/services/timesheetProof.ts`, `lib/services/exportService.ts` |
| **DSGVO-Export-Dateinamen** (nutzer-sichtbar) | `app/api/user/data-export`, `app/api/admin/user/[userId]/data-export`, `app/(employee)/employee/profil` → `schichtklar-data-export-*.json` |
| **System-/Absendernamen (Einstellungen)** | `lib/services/adminSettings`, `lib/services/settings`, `lib/services/settingsService`, `lib/hooks/useAdminSettings`, `lib/hooks/useBrandingSettings` |
| **Interne Bezeichner** | Paketname (`schichtklar`), E2E-Flags (`__SCHICHTKLAR_*`), Rollen-Cookie (`schichtklar_role`), Theme-Key (`schichtklar-theme-mode`), SW-Caches (`schichtklar-static/runtime`), IndexedDB (`SchichtklarOffline`), Plugin-ID (`schichtklar/notifications`), Offline-Sync-Event, User-Agent |
| **Dokumentation** | `README.md`, `SECURITY.md`, `ARCHITECTURE-HEALTH.md`, `FIREBASE-QUERIES.md`, gesamter `docs/`-Ordner |
| **Konfig-Beispiele** | `.env.example`, `.env.production.example`, `.env.staging.example`, `.npmrc`, `.cursor/**` |

## 2. Infrastruktur (Details: `docs/INFRASTRUCTURE_RENAMING.md`)

- **Neues Firebase-Projekt `schichtklar`** angelegt; alle Deploy-/Projekt-Referenzen (`.firebaserc`, Workflows, Skripte) migriert. Web-Config gehört in `.env.local`/Hosting-ENV, nicht ins Repo.
- **GitHub-Secret** auf `FIREBASE_SERVICE_ACCOUNT_SCHICHTKLAR` umgestellt – muss in den Repo-Settings mit einem Service-Account des neuen Projekts angelegt werden.
- **GitHub-Repo-Name `JobFlow`** (Clone-/Setup-Beispiele) – spiegelt den aktuellen Repo-Namen; optional umbenennbar.

## 3. Manuelle Aufgaben außerhalb des Repositories

1. **Finale Markenassets bereitstellen** (siehe Punkt 4).
2. **Produktions-Domain + Support-E-Mail festlegen** und als ENV setzen (siehe Punkt 5) – u. a. `scripts/storage-cors.json` (CORS-Origins stehen auf Platzhalter `your-production-domain.example`).
3. **GitHub-Secret `FIREBASE_SERVICE_ACCOUNT_SCHICHTKLAR`** mit einem Service-Account des neuen Projekts `schichtklar` anlegen (Deploy-Workflow referenziert bereits diesen Namen). Details: `docs/INFRASTRUCTURE_RENAMING.md`.

## 4. Noch fehlende Markenassets

Die Grafiken `public/logo.svg`, `public/logo-default.png` und die Icons (`public/icons/*`) wurden **nicht** automatisch verändert. Ob sie den Schriftzug „JobFlow" zeigen, ist aus dem Repository nicht prüfbar. **Vor Veröffentlichung** durch finale Schichtklar-Assets ersetzen (gleiche Dateinamen/-größen beibehalten, dann sind keine Code-Änderungen nötig). Es wurde bewusst **keine** minderwertige Text-Grafik generiert. Das im UI angezeigte Wortmarken-Fallback nutzt bereits den Text „Schichtklar" aus `branding.ts`.

## 5. Domains / E-Mail-Adressen, die noch festzulegen sind

Es wurden **keine** Schichtklar-Domains oder -E-Mail-Adressen erfunden. Wo bisher JobFlow-Platzhalter standen, stehen jetzt **neutrale, klar nicht-produktive Platzhalter**:

| Zweck | Aktueller Platzhalter | Vor Launch setzen via |
|---|---|---|
| Rechtlicher Firmenname (Impressum) | `Musterfirma GmbH` | `NEXT_PUBLIC_COMPANY_NAME` |
| Support-/Impressum-E-Mail | `info@example.com` | `NEXT_PUBLIC_COMPANY_EMAIL` |
| Produktions-/Staging-URL | `https://example.com`, `https://staging.example.com` | `NEXT_PUBLIC_APP_URL` |
| Storage-CORS-Origins | `your-production-domain.example` | `scripts/storage-cors.json` + `npm run storage:cors` |
| Dev-Test-Logins | `admin@schichtklar.test` u. ä. (RFC-6761-TLD `.test`) | Seed/E2E-Fixtures |

Der Produktions-Guard `validateLegalConfig()` blockiert den Build weiterhin, solange die Impressums-Platzhalter nicht durch echte Daten ersetzt sind.

## 6. Verifikation

- Vollständiger Re-Scan: kein „jobflow" mehr außer den dokumentierten technischen IDs.
- `npm run typecheck` ✅ · `npm run lint` (`--max-warnings=0`) ✅ · `npm run build` ✅ · `npm run test:rules` (13/13) ✅

## 7. Bestätigung

**Die sichtbare Umbenennung ist vollständig.** Nutzer, Käufer und Entwickler sehen im Code, in der UI, in Metadaten, E-Mails, PDFs, Push-Nachrichten und der Dokumentation ausschließlich „Schichtklar". Verbleibende „jobflow"-Vorkommen sind ausschließlich nicht-sichtbare technische Infrastruktur-IDs, die in `docs/INFRASTRUCTURE_RENAMING.md` begründet und mit Migrationspfad dokumentiert sind.
