# JobFlow Release-Checkliste

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

**Phase 1+2:** Production Ready | **Phase 3:** DX Complete (CI/E2E/Storybook) | **Phase 4:** Lighthouse 100/100, Assignment-Split, Mobile
