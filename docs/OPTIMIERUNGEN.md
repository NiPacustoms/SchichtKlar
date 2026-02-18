# Optimierungsbedarf – JobFlow

Kurzüberblick: Wo es Potenzial gibt und was priorisiert werden kann.

---

## 1. E2E (Playwright)

| Thema | Ist | Empfehlung |
|-------|-----|------------|
| **Lokal parallel** | `workers: undefined` (1 bei CI) | Lokal z. B. `workers: 2` oder `3` für kürzere Laufzeit (in config oder per `--workers=2`). |
| **Wiederholbarkeit** | Einige Tests nutzen `getByTestId('login-button')`, andere `getByRole('button', …)` | Gemeinsames Helper z. B. `e2e/helpers/login.ts`: `expectLoginFormVisible(page)` nutzt einheitlich `getByTestId('login-button')`. |
| **CI E2E** | Server mit `npm run start &`, dann `sleep 25`, dann Tests | Robuster: Warten auf URL (curl/wget) statt fester Sleep; oder global-setup wartet bereits – dann ggf. Sleep reduzieren. |
| **Projekte** | chromium + firefox | Wenn nur Chromium in CI nötig: `npm run test:e2e -- --project=chromium` in CI spart Zeit. |

---

## 2. Große Dateien (Wartbarkeit)

Viele Pages/Komponenten haben 500–1900 Zeilen. Ziel laut Architektur: <300 Zeilen pro Datei (oder <150).

| Datei | Zeilen | Vorschlag |
|-------|--------|-----------|
| `app/(admin)/admin/einstellungen/page.tsx` | ~1876 | In Tabs/Sections aufteilen (z. B. `EinstellungenGeneral`, `EinstellungenBranding`, …). |
| `app/(employee)/employee/zeiten/page.tsx` | ~1326 | Logik in Hook/Service, UI in kleinere Komponenten (Filter, Tabelle, Aktionen). |
| `app/(employee)/employee/profil/page.tsx` | ~1107 | Profil in Unterkomponenten (Persönlich, Zeiten, Dokumente). |
| `components/admin/StaffEditDialog.tsx` | ~1083 | Tabs oder Steps in eigene Komponenten auslagern. |
| `components/admin/TemplateManager.tsx` | ~1082 | Listen-/Editor-Bereich trennen. |
| Weitere | 600–1000 | Schrittweise nach dem gleichen Muster aufteilen. |

Priorität: Einstellungen und Zeiten (häufig geändert, sehr groß).

---

## 3. CI / Qualität

| Thema | Ist | Empfehlung |
|-------|-----|------------|
| **typecheck:ci** | `tsc --noEmit \|\| echo '...'` – Fehler werden ignoriert | Langfristig: Echte Fehler beheben und `npm run typecheck` in CI ohne Fallback laufen lassen, damit CI bei Typfehlern rot wird. |
| **E2E in CI** | Läuft nach verify (lint, typecheck, build) | Ok. Optional: E2E nur auf `main`/`develop` oder mit `paths`-Filter, um Laufzeit zu begrenzen. |
| **Lighthouse** | Nicht in CI | Optional: Job mit `npx lighthouse ... --output=json` und Schwellen (z. B. Performance > 90) für wichtige Routen. |

---

## 4. Build / Next.js

| Thema | Empfehlung |
|-------|------------|
| **Bundle-Analyse** | Optional `@next/bundle-analyzer` aktivieren, um große Client-Bundles zu finden und zu splitten. |
| **ESLint-Warnung** | Beim Build: „Invalid Options: useEslintrc, extensions“. Next.js- und ESLint-Version prüfen, ggf. Konfig anpassen, um die Meldung zu beseitigen. |

---

## 5. Prioritäten (kurz)

1. **Hoch:** Große Pages (Einstellungen, Zeiten, Profil) schrittweise in kleinere Module/Hooks aufteilen.
2. **Mittel:** E2E-Helper für Login-Form, ggf. mehr Worker lokal; CI E2E nur Chromium, wenn ausreichend.
3. **Niedrig:** typecheck:ci ohne Fehler-Ignoranz; Lighthouse in CI; Bundle-Analyzer.

---

## 6. Kein dringender Handlungsbedarf

- **Design-System / Tokens:** Bereits konsistent genutzt (Phase 4 umgesetzt).
- **Services (assignments, shifts, timesheets):** Bereits modular, Dateien unter 150 Zeilen.
- **E2E-Stabilität:** 34/34 grün nach den letzten Anpassungen (global-setup, Locators).

Wenn du willst, können wir als Nächstes eine konkrete Aufteilung für eine der großen Pages (z. B. Einstellungen oder Zeiten) durchgehen oder die E2E-Helper + Playwright-Config konkret ausarbeiten.
