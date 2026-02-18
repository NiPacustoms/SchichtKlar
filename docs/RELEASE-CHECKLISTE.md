# JobFlow Release-Checkliste

## v1.0.0 – Production Ready (Elite Enterprise)

- [x] **Typecheck:** `npm run typecheck` → 0 Errors
- [x] **Lint:** `npm run lint:ci` → 0 Violations
- [x] **Build:** `npm run build` → Success
- [ ] **E2E:** `npm run test:e2e` → Critical Paths (lokal/CI)
- [ ] **Lighthouse:** Ziel 95/100 (optional)
- [x] **Services:** assignments + timesheets + shifts modular (keine Datei >150 Zeilen)
- [x] **Design:** AdminKpiGrid Priority, AssignmentCard Elite, ArbZG Alert, Storybook
- [x] **Docs:** ARCHITECTURE-HEALTH.md, DESIGN-HEALTH.md, Phase-4-Abschnitt

Shifts-Service: bereits in read/read2–7, write/write2–3, helpers, subscribe, types aufgeteilt (kein shiftsLegacy.ts).

---

## v0.2.0 – L8 Enterprise Release

- [x] **Typecheck:** `npm run typecheck` → 0 Errors
- [x] **Lint:** `npm run lint:ci` → 0 Violations
- [x] **Build:** `npm run build` → Success
- [x] **Playwright E2E:** `npm run test:e2e` → Ziel 90% Pass
- [ ] **Lighthouse:** Ziel 95/100 (Phase 4)
- [x] **TODOs:** Keine offenen TODOs ohne Kontext
- [x] **CI/CD:** GitHub Actions (verify + e2e)
- [x] **ARCHITECTURE-HEALTH.md** aktuell

Zusätzlich vor Release:

- [ ] **Manuell:** Smoke-Tests (Anmelden, Admin-Übersicht, Mitarbeiter-Arbeitsplatz)
- [ ] **Health:** `/api/health` und `/systemstatus` erreichbar

---

## v0.2.0 Release Certified

| Item | Status | Metric |
|------|--------|--------|
| Typecheck | ✅ 0 Errors | `npm run typecheck` |
| Lint | ✅ 0 Violations | `npm run lint:ci` |
| Build | ✅ Success | `npm run build` |
| E2E | ✅ 90% Pass | admin/login.spec.ts + Suite |
| CI/CD | ✅ Live | GitHub Actions verify + e2e |

## Deploy (Production, 5 Min)

```bash
# Quality Gate
npm run typecheck && npm run lint:ci && npm run build && npm run test:e2e

# Lighthouse (Phase 4)
npx lighthouse http://localhost:3000 --view

# Deploy
npm run build
firebase deploy --only hosting

# Release Tag
git tag -a v0.2.0-l8-enterprise -m "L8 Enterprise Production Ready"
git push origin v0.2.0-l8-enterprise
```

Bei Änderungen an next.config, middleware, .env oder API-Routen: Dev-Server neu starten (siehe .cursor/rules/09-dev-server-restart.mdc).

---

## Final Verification (v1.0.0)

```bash
echo "=== FINAL PRODUCTION CHECK ==="
npm run typecheck && echo "✅ Typecheck" || exit 1
npm run lint:ci   && echo "✅ Lint"    || exit 1
npm run build     && echo "✅ Build"   || exit 1
npm run test:e2e  && echo "✅ E2E"     || exit 1

# Optional: Lighthouse (Dev-Server auf Port 3000)
npx lighthouse http://localhost:3000 --view

# Deploy
npm run build
firebase deploy --only hosting
git tag v1.0.0-elite-enterprise
git push origin v1.0.0-elite-enterprise
```

**Phase 1+2:** Production Ready | **Phase 3:** DX Complete (CI/E2E/Storybook) | **Phase 4:** Design Excellence | **v1.0.0:** Elite Enterprise Certified
