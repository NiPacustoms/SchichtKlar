# Entfernte Dateien (Phase 2 – Marktreife)

**Stand:** 10.07.2026 · Branch `chore/market-ready`
Jede Entfernung wurde vor der Löschung per Referenzsuche (Imports, `package.json`-Skripte, CI-Workflows, Firebase-Configs, Doku) nachgewiesen. Historie bleibt in Git erhalten.

> **Hinweis:** Bereits vor dieser Phase wurden per PR #4 (Commit `9aa24d9`) 162 nachweislich tote Dateien entfernt: `build-errors.txt`, `lint-report.txt`, `docs/ALLE_DOKUMENTATION*` (~100k Zeilen generierte Doku), `docs/archive/`, `docs/audits/AUDIT-RAW.txt`, `middleware.disabled.ts`, `fix-node-modules.sh`, `scripts/merge-markdown.js`, `scripts/split-docs.js`, private Fotos und statische HTML-Reste in `public/`.

## In dieser Phase entfernt

| Datei | Grund | Nachweis | Auswirkungen |
|---|---|---|---|
| `.cursor/rules/prompt-optimization.mdc 2` | macOS-Duplikat (Suffix „ 2“), ältere Version (236 Z.) der aktiven Regel `05-prompt-optimization.mdc` (101 Z.) | Nummerierte Regel ist die aktive Namenskonvention; keine Referenzen | keine |
| `pages/api/create-assignment.ts` | Legacy Pages-Router-Route; App-Router-Pendant `app/api/assignment/create/route.ts` existiert | Repo-weite Suche nach `create-assignment`: **0 Aufrufer** im Code (nur Doku-Erwähnungen); Datei seit Initial-Commit unverändert | `pages/`-Verzeichnis entfällt komplett; Build verifiziert grün |
| `scripts/modernize-dialogs.js` | Einmal-Werkzeug einer abgeschlossenen UI-Migrationskampagne | **0 Referenzen** außerhalb `scripts/` | keine |
| `scripts/migrate-times-to-timesheets.js` | Alt-Datenmigration ohne dokumentierten weiteren Zweck | **0 Referenzen** außerhalb `scripts/` | Käufer mit Altdaten vor Migration existieren nicht (Single-Tenant, Verkäuferprojekt) |
| `scripts/fix-typescript-errors.sh` | Einmal-Werkzeug vergangener Fehlerbehebung (TS ist seit langem fehlerfrei) | Nur in historischer Analyse `docs/FEHLERANALYSE.md` erwähnt | keine |
| `scripts/code-cleanup.sh` | Einmal-Werkzeug vergangener Aufräumaktion | Nur in `docs/FEHLERANALYSE.md` erwähnt | keine |
| `.github/workflows/ci-cd.yml` | Redundant zu `ci.yml` (identische Schritte: `npm ci` → `lint:ci` → `typecheck:ci` → `build`); ältere Variante mit auskommentierten Test-Jobs | Diff gegen `ci.yml`: `ci.yml` deckt zusätzlich `develop`-Pushes ab und setzt CI-Platzhalter-ENV | Halbierung redundanter CI-Läufe; `quality.yml` (Lint/Typecheck) und `firebase-hosting.yml` (Deploy) bleiben |

## Anonymisiert (nicht gelöscht)

| Datei | Änderung | Grund |
|---|---|---|
| `.npmrc` | Auskommentierten persönlichen Cache-Pfad (`/Users/<name>/.npm`) entfernt | persönlicher Entwicklerpfad |
| `scripts/sync-custom-claims.js` | Persönlichen Key-Pfad (`/Users/<name>/.keys/jobflow25-admin.json`) durch `GOOGLE_APPLICATION_CREDENTIALS`-ENV + generische Pfade ersetzt | persönlicher Pfad + Verkäufer-Projektbezug |
| `.cursor/README-WORKTREE.md`, `.cursor/worktree-prompt.md` | 8 persönliche Pfade → `<pfad-zum-repo>/JobFlow` | persönliche Entwicklerpfade |
| `docs/DEPENDENCY_CHECK_REPORT.md`, `docs/DEPENDENCY_MAINTENANCE_PLAN.md`, `docs/FEHLERANALYSE.md` | 7 persönliche Pfade → `<pfad-zum-repo>/JobFlow` | persönliche Entwicklerpfade |
| `scripts/sync-user-claims.js`, `scripts/setup-github-secrets.sh` | persönlichen Key-Pfad entfernt bzw. Beispiel-Username neutralisiert | persönliche Bezüge |
| `scripts/seed-firestore.js` | hartcodierte Firebase-Config-Fallbacks (API-Key, Projekt-ID `jobflow25`, App-ID) entfernt; Skript verlangt jetzt vollständige `.env.local` und bricht sonst mit klarer Fehlermeldung ab | Verkäufer-Projektbezug + Key im Repo (Audit-Befund S1) |

## Bewusst NICHT entfernt (geprüft, behalten)

| Datei | Grund für Erhalt |
|---|---|
| `src/` (57 Dateien, Hexagonal-Layer) | **aktiv importiert** von Zeiterfassungs-Seiten, 3 Hooks, `PluginInit` |
| `proxy.ts` | Vorbereitung für Next 16 (Middleware-Umbenennung); Entscheidung über Aktivierung in Phase 4 |
| `scripts/migrate-to-production.sh` | dokumentierter Bestandteil des Setup-Leitfadens (`docs/ENVIRONMENT_SETUP.md`) |
| `scripts/replace-console-logs*` | in `package.json` verdrahtetes Werkzeug |
| `.cursor/rules/` (übrige) | dokumentieren aktiv die Design-System-Konventionen; anonymisiert statt gelöscht |
| Veraltete/widersprüchliche Doku (`MARKTREIFE_ANALYSE.md`, `docs/release/*`, `FEHLERANALYSE.md`, `APP_ZUSAMMENFASSUNG*`) | wird in **Phase 10** konsolidiert statt jetzt gelöscht |
